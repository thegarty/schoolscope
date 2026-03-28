import { z } from "zod";
import { ExtractionResult } from "@/lib/enrichment/extractor";
import {
  buildAboutSummary,
  cleanAboutContent,
  cleanFieldValueByType,
} from "@/lib/enrichment/cleaning";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4.1-mini";

const allowedFields = ["website", "phone", "email", "principalName", "address"] as const;

const aboutSchema = z.preprocess((value) => {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }
  return value;
}, z.object({
  content: z.string().min(1).max(3000),
  summary: z.string().max(300).optional(),
  confidence: z.number().min(0).max(1).default(0.62),
  evidence: z.preprocess(
    (value) => {
      if (Array.isArray(value)) {
        const joined = value
          .map((item) => String(item ?? ""))
          .filter(Boolean)
          .join(" ");
        return joined;
      }
      const normalized =
        typeof value === "string"
          ? value
          : value === null || value === undefined
            ? "Grounded source content."
            : String(value);
      return normalized.slice(0, 400);
    },
    z.string().min(1).max(400)
  ).default("Grounded source content."),
}));

const eventSchema = z.object({
  title: z.string().min(2).max(160).optional(),
  description: z.string().max(500).default("Upcoming school event."),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().max(200).optional(),
  category: z.string().max(80).default("School Event"),
  confidence: z.number().min(0).max(1).default(0.5),
  evidence: z.string().min(1).max(400).default("Source text reference."),
});

const aiSchema = z.object({
  fields: z
    .array(
      z.object({
        field: z.enum(allowedFields),
        value: z.string().min(1).max(300),
        confidence: z.number().min(0).max(1),
        evidence: z.string().min(1).max(400),
      })
    )
    .default([]),
  about: aboutSchema.optional(),
  events: z.array(eventSchema).default([]),
});

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function htmlToText(html: string) {
  return normalizeWhitespace(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<\/(p|h1|h2|h3|h4|h5|h6|li|div|br|tr)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  );
}

function parseDateToIso(raw: string) {
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function sanitizeResult(input: z.infer<typeof aiSchema>): ExtractionResult {
  const now = Date.now();
  const fields = input.fields.slice(0, 8);
  const normalizedFields = fields
    .map((field) => {
      const value = cleanFieldValueByType(field.field, field.value);

      if (!value) return null;
      return {
        ...field,
        value,
      };
    })
    .filter((field): field is NonNullable<typeof field> => Boolean(field));
  const events = input.events
    .map((event) => {
      if (!event.title || !event.startDate) return null;
      const startDate = parseDateToIso(event.startDate);
      const endDate = parseDateToIso(event.endDate ?? event.startDate);
      if (!startDate || !endDate) return null;
      if (new Date(startDate).getTime() < now - 1000 * 60 * 60 * 24) return null;
      return {
        title: event.title.trim(),
        description: event.description.trim(),
        startDate,
        endDate,
        location: event.location?.trim() || undefined,
        category: event.category.trim() || "School Event",
        confidence: event.confidence,
        evidence: event.evidence.trim(),
      };
    })
    .filter((event): event is NonNullable<typeof event> => Boolean(event))
    .slice(0, 15);

  const cleanedAbout = input.about?.content ? cleanAboutContent(input.about.content) : null;

  return {
    fields: normalizedFields,
    aboutContent: cleanedAbout ?? undefined,
    aboutSummary: cleanedAbout
      ? buildAboutSummary(cleanedAbout, input.about?.summary)
      : undefined,
    aboutConfidence: cleanedAbout ? input.about?.confidence : undefined,
    aboutEvidence: cleanedAbout ? input.about?.evidence : undefined,
    events,
  };
}

export async function extractSchoolDataWithAI(params: {
  html: string;
  schoolName: string;
  schoolWebsite?: string | null;
  sourceUrl: string;
}): Promise<ExtractionResult | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const text = htmlToText(params.html).slice(0, 20000);
  if (!text) return null;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_ENRICHMENT_MODEL || DEFAULT_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract verified school profile and event information from official sources. Return strict JSON with keys: fields, about, events. Use only explicit evidence from source text. For about.content, write clean prose paragraphs only; do NOT output navigation/menu/link lists.",
        },
        {
          role: "user",
          content: JSON.stringify({
            school: {
              name: params.schoolName,
              website: params.schoolWebsite || null,
            },
            sourceUrl: params.sourceUrl,
            rules: [
              "Only include data found in source text.",
              "fields[].field must be one of website, phone, email, principalName, address.",
              "confidence must be between 0 and 1.",
              "events should be upcoming where possible.",
              "Provide short evidence snippets for every field/event/about item.",
            ],
            sourceText: text,
          }),
        },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI extraction failed: ${response.status} ${body.slice(0, 220)}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI extraction returned empty content.");
  }

  const parsed = aiSchema.parse(JSON.parse(content));
  return sanitizeResult(parsed);
}
