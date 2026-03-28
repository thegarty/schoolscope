const TRUSTED_SUFFIXES = [".edu.au", ".gov.au"];
const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "NT", "ACT"] as const;
type AuState = (typeof AU_STATES)[number];

function getHostname(rawUrl: string) {
  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isAllowedOfficialSource(sourceUrl: string, schoolWebsite?: string | null) {
  const sourceHost = getHostname(sourceUrl);
  if (!sourceHost) return false;

  const hasTrustedSuffix = TRUSTED_SUFFIXES.some((suffix) => sourceHost.endsWith(suffix));

  if (hasTrustedSuffix) return true;

  const websiteHost = schoolWebsite ? getHostname(schoolWebsite) : null;
  if (!websiteHost) return false;

  return sourceHost === websiteHost || sourceHost.endsWith(`.${websiteHost}`);
}

function tokenizeSchoolName(schoolName: string) {
  return schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/[\s-]+/)
    .filter(Boolean)
    .filter(
      (token) =>
        ![
          "school",
          "primary",
          "secondary",
          "college",
          "campus",
          "state",
          "public",
          "the",
          "and",
          "of",
        ].includes(token)
    );
}

function schoolNameMatchesHost(host: string, schoolName?: string | null) {
  if (!schoolName) return false;
  const tokens = tokenizeSchoolName(schoolName);
  if (tokens.length === 0) return false;
  const normalizedHost = host.replace(/^www\./, "");
  const matches = tokens.filter(
    (token) => token.length >= 3 && normalizedHost.includes(token)
  ).length;
  return matches >= Math.min(2, tokens.length);
}

export function isLikelyOfficialCandidate(
  sourceUrl: string,
  schoolWebsite?: string | null,
  schoolName?: string | null
) {
  if (isAllowedOfficialSource(sourceUrl, schoolWebsite)) {
    return true;
  }

  const host = getHostname(sourceUrl);
  if (!host || !schoolName) return false;

  // State department + school directory host patterns.
  if (
    host.includes(".schools.") ||
    host.includes(".education.") ||
    host.includes(".det.") ||
    host.endsWith(".schools.nsw.gov.au")
  ) {
    return true;
  }

  // For some Australian schools, official domains can be .com.au/.org.au.
  const looksAustralian = host.endsWith(".au");
  if (!looksAustralian) return false;

  const domainWithoutTld = host
    .replace(/^www\./, "")
    .replace(/\.(com|org|net|edu|gov)\.au$/, "")
    .replace(/\.au$/, "");
  const tokens = tokenizeSchoolName(schoolName);
  if (tokens.length === 0) return false;

  let matches = 0;
  for (const token of tokens) {
    if (token.length < 3) continue;
    if (domainWithoutTld.includes(token)) {
      matches += 1;
    }
  }

  return matches >= Math.min(2, tokens.length);
}

export function inferStateFromUrl(sourceUrl: string): AuState | null {
  const host = getHostname(sourceUrl);
  if (!host) return null;
  const lowerHost = host.toLowerCase();

  if (lowerHost.endsWith(".schools.nsw.gov.au")) return "NSW";

  const tokenChecks: Array<{ token: string; state: AuState }> = [
    { token: ".nsw.", state: "NSW" },
    { token: ".vic.", state: "VIC" },
    { token: ".qld.", state: "QLD" },
    { token: ".wa.", state: "WA" },
    { token: ".sa.", state: "SA" },
    { token: ".tas.", state: "TAS" },
    { token: ".nt.", state: "NT" },
    { token: ".act.", state: "ACT" },
  ];

  for (const check of tokenChecks) {
    if (lowerHost.includes(check.token)) return check.state;
  }

  // Some QLD school domains use eq.edu.au.
  if (lowerHost.endsWith(".eq.edu.au") || lowerHost.includes(".eq.edu.au")) return "QLD";

  return null;
}

export function normalizeSourceUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const normalized = trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(normalized);

    // Canonicalize known NSW Department school host variants.
    if (parsed.hostname.endsWith(".schools.nsw.edu.au")) {
      parsed.hostname = parsed.hostname.replace(/\.schools\.nsw\.edu\.au$/i, ".schools.nsw.gov.au");
    }
    if (parsed.hostname.endsWith(".schools.nsw.au")) {
      parsed.hostname = parsed.hostname.replace(/\.schools\.nsw\.au$/i, ".schools.nsw.gov.au");
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function classifySourceType(sourceUrl: string, schoolName?: string | null) {
  const host = getHostname(sourceUrl);
  if (!host) return "OTHER_OFFICIAL" as const;
  if (host === "myschool.edu.au") {
    return "GOVERNMENT_DIRECTORY" as const;
  }
  const path = (() => {
    try {
      return new URL(sourceUrl).pathname.toLowerCase();
    } catch {
      return "";
    }
  })();

  // Direct school-hosting patterns from state education domains.
  if (
    host.endsWith(".schools.nsw.gov.au") ||
    host.endsWith(".eq.edu.au") ||
    host.endsWith(".wa.edu.au") ||
    host.endsWith(".schools.vic.edu.au")
  ) {
    return "SCHOOL_WEBSITE" as const;
  }

  // Government directories and finder pages.
  if (
    host.endsWith(".gov.au") &&
    (path.includes("school-finder") ||
      path.includes("find-a-school") ||
      path.includes("directory") ||
      path.includes("schools") ||
      path.includes("school"))
  ) {
    return "GOVERNMENT_DIRECTORY" as const;
  }

  if (host.endsWith(".gov.au")) {
    // If a school-specific hostname is used under gov.au, treat as school website.
    if (schoolNameMatchesHost(host, schoolName)) {
      return "SCHOOL_WEBSITE" as const;
    }
    return "EDUCATION_DEPARTMENT" as const;
  }

  if (host.endsWith(".edu.au")) {
    if (host.includes("education.") || host.includes("det.")) {
      return "EDUCATION_DEPARTMENT" as const;
    }
    if (host.includes("schools.") || schoolNameMatchesHost(host, schoolName)) {
      return "SCHOOL_WEBSITE" as const;
    }
    return "OTHER_OFFICIAL" as const;
  }

  // Some schools use .com.au/.org.au domains.
  if (
    (host.endsWith(".com.au") || host.endsWith(".org.au")) &&
    schoolNameMatchesHost(host, schoolName)
  ) {
    return "SCHOOL_WEBSITE" as const;
  }

  return "OTHER_OFFICIAL" as const;
}
