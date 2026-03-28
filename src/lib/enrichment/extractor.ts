import { School } from "@/generated/prisma/client";
import { cleanAboutContent } from "@/lib/enrichment/cleaning";

const FIELD_REGEX = {
  email: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i,
  phone: /(\+?61\s?|0)[2-9](?:[\s-]?\d){8}/,
  principalName: /principal(?:'s)?\s*(?:name)?[:\s-]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})/i,
};

const DATE_PATTERNS = [
  /\b(\d{1,2}\s+(?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+\d{4})\b/gi,
  /\b((?:Jan|January|Feb|February|Mar|March|Apr|April|May|Jun|June|Jul|July|Aug|August|Sep|Sept|September|Oct|October|Nov|November|Dec|December)\s+\d{1,2},\s+\d{4})\b/gi,
];

export type ExtractedField = {
  field: "website" | "phone" | "email" | "principalName" | "address";
  value: string;
  confidence: number;
  evidence: string;
};

export type ExtractedEvent = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  category: string;
  confidence: number;
  evidence: string;
};

export type ExtractionResult = {
  fields: ExtractedField[];
  aboutContent?: string;
  aboutSummary?: string;
  aboutConfidence?: number;
  aboutEvidence?: string;
  events: ExtractedEvent[];
};

function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function stripHtml(html: string) {
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

function sliceEvidence(text: string, term: string, window = 120) {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, window);
  const start = Math.max(0, idx - Math.floor(window / 2));
  const end = Math.min(text.length, idx + Math.floor(window / 2));
  return text.slice(start, end).trim();
}

function safeDate(value: string): string | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(9, 0, 0, 0);
  return parsed.toISOString();
}

function summarize(text: string, maxLength = 240) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}…`;
}

function extractAddress(lines: string[]) {
  const candidate = lines.find((line) =>
    /(address|campus|location)/i.test(line) &&
    /[A-Za-z]/.test(line) &&
    /\d/.test(line)
  );

  if (!candidate) return null;
  const normalized = candidate.replace(/^(address|campus|location)\s*[:\-]?\s*/i, "").trim();
  if (normalized.length < 10) return null;
  return normalized;
}

function extractEvents(lines: string[]): ExtractedEvent[] {
  const events: ExtractedEvent[] = [];
  const now = Date.now();

  for (const line of lines) {
    if (line.length < 12 || line.length > 240) continue;
    if (!/(event|calendar|upcoming|assembly|parent|carnival|sports|tour|orientation|holiday|open day)/i.test(line)) {
      continue;
    }

    for (const pattern of DATE_PATTERNS) {
      const matches = Array.from(line.matchAll(pattern));
      for (const match of matches) {
        const dateValue = safeDate(match[1]);
        if (!dateValue) continue;
        if (new Date(dateValue).getTime() < now - 1000 * 60 * 60 * 24) continue;

        const title = normalizeWhitespace(line.replace(match[0], "").replace(/[-|:]+/g, " "));
        if (title.length < 4) continue;

        events.push({
          title: summarize(title, 80),
          description: summarize(line, 220),
          startDate: dateValue,
          endDate: dateValue,
          category: /sport|carnival/i.test(line) ? "Sports" : "School Event",
          confidence: 0.62,
          evidence: summarize(line, 220),
        });
      }
    }
  }

  return events.slice(0, 12);
}

export function extractSchoolData(
  html: string,
  school: Pick<School, "website" | "name">,
  sourceUrl?: string
): ExtractionResult {
  const text = stripHtml(html);
  const lines = text
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean);

  const fields: ExtractedField[] = [];

  const emailMatch = text.match(FIELD_REGEX.email);
  if (emailMatch) {
    fields.push({
      field: "email",
      value: emailMatch[0].toLowerCase(),
      confidence: 0.9,
      evidence: sliceEvidence(text, emailMatch[0]),
    });
  }

  const phoneMatch = text.match(FIELD_REGEX.phone);
  if (phoneMatch) {
    fields.push({
      field: "phone",
      value: normalizeWhitespace(phoneMatch[0]),
      confidence: 0.78,
      evidence: sliceEvidence(text, phoneMatch[0]),
    });
  }

  const principalMatch = text.match(FIELD_REGEX.principalName);
  if (principalMatch?.[1]) {
    fields.push({
      field: "principalName",
      value: normalizeWhitespace(principalMatch[1]),
      confidence: 0.66,
      evidence: sliceEvidence(text, principalMatch[0]),
    });
  }

  const address = extractAddress(lines);
  if (address) {
    fields.push({
      field: "address",
      value: address,
      confidence: 0.6,
      evidence: sliceEvidence(text, address),
    });
  }

  if (sourceUrl) {
    const derivedWebsite = (() => {
      try {
        return new URL(sourceUrl).origin;
      } catch {
        return null;
      }
    })();

    if (derivedWebsite) {
      fields.push({
        field: "website",
        value: derivedWebsite,
        confidence: 0.74,
        evidence: `Source URL discovered as ${derivedWebsite}`,
      });
    }
  } else if (school.website) {
    fields.push({
      field: "website",
      value: school.website,
      confidence: 0.99,
      evidence: `Official website configured as ${school.website}`,
    });
  }

  const aboutParagraph = lines.find(
    (line) =>
      line.length > 120 &&
      /school|students|learning|community|curriculum|education|campus|famil/i.test(line)
  );

  const cleanedAbout = aboutParagraph ? cleanAboutContent(aboutParagraph) : null;

  return {
    fields,
    aboutContent: cleanedAbout ? summarize(cleanedAbout, 950) : undefined,
    aboutSummary: cleanedAbout ? summarize(cleanedAbout, 180) : undefined,
    aboutConfidence: cleanedAbout ? 0.58 : undefined,
    aboutEvidence: cleanedAbout ? summarize(cleanedAbout, 220) : undefined,
    events: extractEvents(lines),
  };
}
