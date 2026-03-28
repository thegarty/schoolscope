import {
  SchoolEnrichmentProposalType,
  SchoolEnrichmentProposalStatus,
  type Prisma,
} from "@/generated/prisma/client";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_REVIEW_MODEL = "gpt-4.1-mini";
const NAV_KEYWORDS = [
  "home",
  "welcome",
  "staff",
  "policies",
  "resources",
  "news",
  "contact",
  "menu",
  "portal",
  "links",
  "students",
  "parents",
  "curriculum",
];

export function canonicalProposalValue(params: {
  proposalType: SchoolEnrichmentProposalType;
  targetField?: string;
  proposedValue: unknown;
}): string | null {
  const { proposalType, targetField, proposedValue } = params;

  if (proposalType === SchoolEnrichmentProposalType.FIELD) {
    if (typeof proposedValue !== "string") return null;
    const raw = proposedValue.trim();
    if (!raw) return null;

    if (targetField === "email") return `email:${raw.toLowerCase()}`;
    if (targetField === "website") {
      try {
        const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
        return `website:${url.origin.toLowerCase()}`;
      } catch {
        return `website:${raw.toLowerCase()}`;
      }
    }
    if (targetField === "phone") return `phone:${raw.replace(/[^\d+]/g, "")}`;
    return `${targetField || "field"}:${raw.toLowerCase().replace(/\s+/g, " ")}`;
  }

  if (proposalType === SchoolEnrichmentProposalType.ABOUT) {
    const value = (proposedValue ?? {}) as Record<string, unknown>;
    const content = typeof value.content === "string" ? value.content : "";
    const normalized = content.toLowerCase().replace(/\s+/g, " ").trim();
    if (normalized.length < 80) return null;
    return `about:${normalized.slice(0, 700)}`;
  }

  if (proposalType === SchoolEnrichmentProposalType.EVENT) {
    const value = (proposedValue ?? {}) as Record<string, unknown>;
    const title = typeof value.title === "string" ? value.title.trim() : "";
    const startDate = typeof value.startDate === "string" ? value.startDate : "";
    if (!title || !startDate) return null;
    const normalizedTitle = title.toLowerCase().replace(/\s+/g, " ").trim();
    const dateKey = new Date(startDate).toISOString().slice(0, 10);
    return `event:${normalizedTitle}|${dateKey}`;
  }

  return null;
}

export function isDuplicateAgainstExisting(params: {
  proposalType: SchoolEnrichmentProposalType;
  targetField?: string;
  proposedValue: unknown;
  existing: Array<{
    proposalType: SchoolEnrichmentProposalType;
    targetField: string | null;
    proposedValue: Prisma.JsonValue;
    status: SchoolEnrichmentProposalStatus;
  }>;
}): boolean {
  const candidateKey = canonicalProposalValue({
    proposalType: params.proposalType,
    targetField: params.targetField,
    proposedValue: params.proposedValue,
  });
  if (!candidateKey) return true;

  for (const current of params.existing) {
    const currentKey = canonicalProposalValue({
      proposalType: current.proposalType,
      targetField: current.targetField ?? undefined,
      proposedValue: current.proposedValue,
    });
    if (!currentKey) continue;
    if (currentKey === candidateKey) return true;
  }
  return false;
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function navKeywordCount(value: string) {
  const lower = value.toLowerCase();
  return NAV_KEYWORDS.reduce(
    (count, token) => count + (lower.includes(token) ? 1 : 0),
    0
  );
}

function sentenceCount(value: string) {
  return (value.match(/[.!?](\s|$)/g) || []).length;
}

function domainQuality(host: string) {
  const lower = host.toLowerCase();
  if (lower.endsWith(".gov.au")) return 3;
  if (lower.endsWith(".edu.au")) return 2;
  if (lower.endsWith(".org.au") || lower.endsWith(".com.au")) return 1;
  return 0;
}

function parseHost(urlLike: string) {
  try {
    const parsed = new URL(urlLike.startsWith("http") ? urlLike : `https://${urlLike}`);
    return parsed.hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function shouldReplaceCurrentValue(params: {
  proposalType: SchoolEnrichmentProposalType;
  targetField?: string;
  existingValue?: string | null;
  proposedValue: unknown;
  confidence: number;
}): { keep: boolean; reason?: string } {
  const existing = (params.existingValue || "").trim();
  if (!existing) return { keep: true };

  if (params.proposalType === SchoolEnrichmentProposalType.FIELD) {
    if (typeof params.proposedValue !== "string") {
      return { keep: false, reason: "proposed_field_value_invalid" };
    }

    const proposed = params.proposedValue.trim();
    if (!proposed) return { keep: false, reason: "proposed_field_value_empty" };

    if (normalizeText(existing) === normalizeText(proposed)) {
      return { keep: false, reason: "same_as_current" };
    }

    if (params.confidence < 0.62) {
      return { keep: false, reason: "confidence_below_threshold_with_existing_value" };
    }

    if (params.targetField === "website") {
      const existingHost = parseHost(existing);
      const proposedHost = parseHost(proposed);
      if (domainQuality(existingHost) > domainQuality(proposedHost)) {
        return { keep: false, reason: "current_website_domain_more_trusted" };
      }
    }

    if (params.targetField === "email") {
      const existingDomain = existing.split("@")[1]?.toLowerCase() || "";
      const proposedDomain = proposed.split("@")[1]?.toLowerCase() || "";
      if (
        (existingDomain.endsWith(".gov.au") || existingDomain.endsWith(".edu.au")) &&
        !(proposedDomain.endsWith(".gov.au") || proposedDomain.endsWith(".edu.au"))
      ) {
        return { keep: false, reason: "current_email_domain_more_trusted" };
      }
    }

    if (params.targetField === "phone") {
      const existingDigits = existing.replace(/[^\d]/g, "");
      const proposedDigits = proposed.replace(/[^\d]/g, "");
      if (existingDigits.length >= 8 && proposedDigits.length < existingDigits.length) {
        return { keep: false, reason: "current_phone_more_complete" };
      }
    }

    return { keep: true };
  }

  if (params.proposalType === SchoolEnrichmentProposalType.ABOUT) {
    const value = (params.proposedValue ?? {}) as Record<string, unknown>;
    const proposedContent =
      typeof value.content === "string" ? value.content.trim() : "";
    if (!proposedContent) {
      return { keep: false, reason: "proposed_about_empty" };
    }

    if (normalizeText(existing) === normalizeText(proposedContent)) {
      return { keep: false, reason: "about_same_as_current" };
    }

    if (params.confidence < 0.62) {
      return { keep: false, reason: "about_confidence_below_threshold" };
    }

    if (
      existing.length >= 350 &&
      sentenceCount(existing) >= 3 &&
      proposedContent.length < Math.floor(existing.length * 0.8)
    ) {
      return { keep: false, reason: "current_about_more_complete" };
    }

    if (navKeywordCount(proposedContent) >= 9) {
      return { keep: false, reason: "proposed_about_looks_like_navigation_dump" };
    }

    return { keep: true };
  }

  return { keep: true };
}

export async function aiReviewProposalCandidate(params: {
  proposalType: SchoolEnrichmentProposalType;
  targetField?: string;
  proposedValue: unknown;
  existingCount: number;
}): Promise<{ keep: boolean; reason?: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { keep: true };

  // Use second-pass AI review only for noisy proposal classes.
  if (
    params.proposalType !== SchoolEnrichmentProposalType.ABOUT &&
    params.proposalType !== SchoolEnrichmentProposalType.EVENT
  ) {
    return { keep: true };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.ENRICHMENT_PROPOSAL_REVIEW_MODEL || DEFAULT_REVIEW_MODEL,
        temperature: 0.0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a strict quality gate for school enrichment proposals. Reject duplicates, low-signal content, menu/link dumps, malformed events, and unclear entries. Return JSON: {keep:boolean, reason:string}.",
          },
          {
            role: "user",
            content: JSON.stringify({
              proposalType: params.proposalType,
              targetField: params.targetField || null,
              proposedValue: params.proposedValue,
              context: {
                existingRelevantProposalCount: params.existingCount,
              },
            }),
          },
        ],
      }),
    });

    if (!response.ok) {
      return { keep: true, reason: "review_skipped_api_error" };
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content;
    if (!content) return { keep: true, reason: "review_skipped_empty_response" };

    const parsed = JSON.parse(content) as { keep?: boolean; reason?: string };
    return {
      keep: Boolean(parsed.keep),
      reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 200) : undefined,
    };
  } catch {
    return { keep: true, reason: "review_skipped_exception" };
  }
}
