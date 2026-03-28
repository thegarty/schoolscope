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

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sentenceCount(value: string) {
  return (value.match(/[.!?](\s|$)/g) || []).length;
}

function navKeywordCount(value: string) {
  const lower = value.toLowerCase();
  return NAV_KEYWORDS.reduce(
    (count, token) => count + (lower.includes(token) ? 1 : 0),
    0
  );
}

export function cleanWebsite(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`
    );
    return url.origin;
  } catch {
    return null;
  }
}

export function cleanPhone(value: string) {
  const digits = value.replace(/[^\d+]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+61")) return digits;
  if (digits.startsWith("0")) return digits;
  return digits.length >= 8 ? digits : null;
}

export function cleanEmail(value: string) {
  const normalized = value.trim().toLowerCase();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  return valid ? normalized : null;
}

export function cleanAddress(value: string) {
  const normalized = normalizeWhitespace(value);
  if (normalized.length < 8) return null;
  if (!/[a-z]/i.test(normalized)) return null;
  if (!/\d/.test(normalized)) return null;
  if (/@/.test(normalized)) return null;
  if (/https?:\/\//i.test(normalized)) return null;
  return normalized;
}

export function cleanTextValue(value: string, max = 220) {
  const normalized = normalizeWhitespace(value);
  return normalized.slice(0, max);
}

export function cleanPrincipalName(value: string) {
  const normalized = cleanTextValue(value, 120)
    .replace(/^mr\.?\s+|^mrs\.?\s+|^ms\.?\s+|^dr\.?\s+/i, "")
    .trim();
  if (normalized.length < 4) return null;
  if (normalized.length > 80) return null;
  if (/\d|@|https?:\/\//i.test(normalized)) return null;
  // Accept simple names with letters, apostrophes, spaces, and hyphens.
  if (!/^[A-Za-z][A-Za-z' -]+$/.test(normalized)) return null;
  return normalized;
}

export function cleanFieldValueByType(
  field: "website" | "phone" | "email" | "principalName" | "address",
  value: string
) {
  if (field === "website") return cleanWebsite(value);
  if (field === "phone") return cleanPhone(value);
  if (field === "email") return cleanEmail(value);
  if (field === "principalName") return cleanPrincipalName(value);
  if (field === "address") return cleanAddress(value);
  return null;
}

export function cleanAboutContent(value: string) {
  const normalized = normalizeWhitespace(value)
    .replace(/\s*\|\s*/g, " ")
    .replace(/\s*>\s*/g, " ")
    .replace(/\s*-\s*/g, " ");

  if (normalized.length < 120) return null;
  if (sentenceCount(normalized) < 2) return null;
  if (navKeywordCount(normalized) >= 8) return null;

  // Trim very long AI output to keep it readable.
  return normalized.slice(0, 1500).trim();
}

export function buildAboutSummary(content: string, preferred?: string | null) {
  if (preferred) {
    const cleaned = cleanTextValue(preferred, 220);
    if (cleaned.length >= 50) return cleaned;
  }

  const firstSentence = content.split(/(?<=[.!?])\s+/)[0] || content;
  return cleanTextValue(firstSentence, 220);
}
