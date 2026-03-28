import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  classifySourceType,
  inferStateFromUrl,
  isLikelyOfficialCandidate,
  normalizeSourceUrl,
} from "@/lib/enrichment/source-policy";

export const dynamic = "force-dynamic";

function normalizeSchoolQueryPart(value: string | null | undefined) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim();
}

function toTitleCase(value: string) {
  return value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildSourceLabel(url: string, schoolName: string) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    if (host.endsWith(".schools.nsw.gov.au")) {
      const sub = host.replace(".schools.nsw.gov.au", "").replace(/^www\./, "");
      return `${toTitleCase(sub.replace(/\./g, " "))} (NSW Schools)`;
    }

    if (host.includes(".education.") || host.includes(".det.") || host.endsWith(".gov.au")) {
      return `${schoolName} - Education Department`;
    }

    if (host.endsWith(".edu.au")) {
      if (host === "myschool.edu.au") {
        return `${schoolName} - My School (ACARA)`;
      }
      return `${schoolName} - Official School Website`;
    }

    return `${schoolName} - ${parsed.hostname.replace(/^www\./, "")}`;
  } catch {
    return `${schoolName} - Official Source`;
  }
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

function urlFromDuckDuckGoHref(rawHref: string) {
  if (!rawHref) return null;
  const trimmed = rawHref.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  // DuckDuckGo redirect format: /l/?kh=-1&uddg=<encoded-url>
  const match = trimmed.match(/[?&]uddg=([^&]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function unwrapKnownRedirect(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);

    // Google outbound redirect wrapper.
    if (
      (parsed.hostname === "www.google.com" || parsed.hostname === "google.com") &&
      parsed.pathname === "/url"
    ) {
      return (
        parsed.searchParams.get("q") ||
        parsed.searchParams.get("url") ||
        rawUrl
      );
    }

    // Ignore generic Google search pages as candidates.
    if (parsed.hostname.endsWith("google.com") && parsed.pathname.startsWith("/search")) {
      return null;
    }

    // Gemini grounding often returns this redirect host.
    if (parsed.hostname === "vertexaisearch.cloud.google.com") {
      const direct =
        parsed.searchParams.get("url") ||
        parsed.searchParams.get("uri") ||
        parsed.searchParams.get("target") ||
        parsed.searchParams.get("dest") ||
        parsed.searchParams.get("destination");
      if (direct) {
        return direct;
      }

      // Fallback: decode any embedded encoded URL fragment.
      const embedded = rawUrl.match(/https?%3A%2F%2F[^&\s]+/i);
      if (embedded) {
        try {
          return decodeURIComponent(embedded[0]);
        } catch {
          return rawUrl;
        }
      }
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function addCandidateUrl(target: Set<string>, rawUrl: string) {
  const sanitizedRaw = rawUrl
    .trim()
    .replace(/[`'"<>]+$/g, "")
    .replace(/[),.;]+$/g, "");

  const unwrapped = unwrapKnownRedirect(sanitizedRaw);
  if (!unwrapped) return;
  const normalized = normalizeSourceUrl(unwrapped);
  if (!normalized) return;
  target.add(normalized);
}

function getRejectionReason(
  candidateUrl: string,
  schoolWebsite?: string | null,
  schoolName?: string | null,
  schoolState?: string | null
) {
  try {
    const candidate = new URL(candidateUrl);
    const host = candidate.hostname.toLowerCase();
    const path = candidate.pathname.toLowerCase();
    const inferredState = inferStateFromUrl(candidateUrl);

    if (
      schoolState &&
      inferredState &&
      schoolState.toUpperCase() !== inferredState
    ) {
      return `state_mismatch_${inferredState}`;
    }

    if (isLikelyOfficialCandidate(candidateUrl, schoolWebsite, schoolName)) {
      return null;
    }

    if (!host.endsWith(".au")) {
      return "non_au_domain";
    }

    if (
      host.includes("google.") ||
      host.includes("bing.") ||
      host.includes("duckduckgo.")
    ) {
      return "search_provider_link";
    }

    if (path.startsWith("/search") || path.startsWith("/url")) {
      return "search_redirect_or_results";
    }

    const tokens = schoolName ? tokenizeSchoolName(schoolName) : [];
    const nameHit = tokens.some((token) => token.length >= 3 && candidateUrl.toLowerCase().includes(token));
    if (!nameHit) {
      return "no_school_name_match";
    }

    return "did_not_meet_official_policy";
  } catch {
    return "invalid_url";
  }
}

function extractCandidateUrls(html: string) {
  const candidates = new Set<string>();
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null = hrefRegex.exec(html);

  while (match) {
    const parsed = urlFromDuckDuckGoHref(match[1]);
    if (parsed) {
      addCandidateUrl(candidates, parsed);
    }
    match = hrefRegex.exec(html);
  }

  // Fallback: capture any direct absolute links in raw HTML text.
  const directUrlRegex = /https?:\/\/[^\s"'<>]+/gi;
  let direct = directUrlRegex.exec(html);
  while (direct) {
    addCandidateUrl(candidates, direct[0]);
    direct = directUrlRegex.exec(html);
  }

  return Array.from(candidates);
}

async function searchCandidateUrlsGemini(query: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return [];

  const model = process.env.GEMINI_GROUNDED_MODEL || "gemini-2.5-flash";
  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      model
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(endpoint, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.1,
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                `Find official Australian school sources for this query: "${query}". ` +
                `Return direct final website URLs only (no Google redirect links, no vertexaisearch.cloud.google.com links). ` +
                `Prefer government/education domains such as .gov.au and .edu.au. ` +
                `Prioritise the exact school state in the query and avoid similarly named schools in other states. ` +
                `Return information with citations.`,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = (await response.text()).slice(0, 400);
    } catch {
      detail = "";
    }
    throw new Error(
      `Gemini grounded search failed (${response.status})${detail ? ` - ${detail}` : ""}`
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      groundingMetadata?: {
        groundingChunks?: Array<{ web?: { uri?: string } }>;
      };
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const urls = new Set<string>();
  const firstCandidate = data.candidates?.[0];

  for (const chunk of firstCandidate?.groundingMetadata?.groundingChunks ?? []) {
    const uri = chunk.web?.uri;
    if (!uri) continue;
    addCandidateUrl(urls, uri);
  }

  // Fallback: parse URLs from synthesized response text.
  for (const part of firstCandidate?.content?.parts ?? []) {
    if (!part.text) continue;
    const extracted = part.text.match(/https?:\/\/[^\s)"'<>]+/g) || [];
    for (const raw of extracted) {
      addCandidateUrl(urls, raw);
    }
  }

  // Final fallback parser for any raw grounded HTML snippet.
  for (const part of firstCandidate?.content?.parts ?? []) {
    if (!part.text) continue;
    const fromHtml = extractCandidateUrls(part.text);
    fromHtml.forEach((url) => addCandidateUrl(urls, url));
  }

  return Array.from(urls);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let discoveryRunId: string | null = null;
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const persist = Boolean(body.persist ?? true);

    const school = await db.school.findUnique({
      where: { id },
      select: {
        id: true,
        acara_id: true,
        name: true,
        suburb: true,
        state: true,
        website: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found." }, { status: 404 });
    }

    const discoveryRun = await db.schoolSourceDiscoveryRun.create({
      data: {
        schoolId: school.id,
        status: "RUNNING",
        provider: "gemini",
      },
      select: { id: true },
    });
    discoveryRunId = discoveryRun.id;

    const existing = await db.schoolSource.findMany({
      where: { schoolId: school.id },
      select: { url: true },
    });
    const existingUrls = new Set(existing.map((source) => source.url));

    const baseName = normalizeSchoolQueryPart(school.name);
    const suburb = normalizeSchoolQueryPart(school.suburb);
    const state = normalizeSchoolQueryPart(school.state);

    const queries = [
      `${baseName} ${suburb} ${state} official website`,
      `${baseName} ${state} school`,
      `${baseName} site:edu.au`,
      `${baseName} site:gov.au`,
      `${baseName} ${state} education department`,
    ];

    const candidateSet = new Set<string>();

    // Deterministic ACARA profile URL derived from school record.
    if (school.acara_id) {
      addCandidateUrl(candidateSet, `https://myschool.edu.au/school/${school.acara_id}`);
    }

    let geminiHits = 0;
    const geminiErrors: string[] = [];
    const queryDiagnostics: Array<{
      query: string;
      candidateCount: number;
      sampleHosts: string[];
      error?: string;
    }> = [];

    // Gemini-only discovery provider.
    for (const query of queries) {
      try {
        const urls = await searchCandidateUrlsGemini(query);
        if (urls.length > 0) {
          geminiHits += 1;
        }
        queryDiagnostics.push({
          query,
          candidateCount: urls.length,
          sampleHosts: urls.slice(0, 4).map((url) => {
            try {
              return new URL(url).hostname;
            } catch {
              return "invalid";
            }
          }),
        });
        urls.forEach((url) => candidateSet.add(url));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown Gemini error";
        geminiErrors.push(`${query}: ${message}`);
        queryDiagnostics.push({
          query,
          candidateCount: 0,
          sampleHosts: [],
          error: message,
        });
        console.warn(`Failed Gemini URL discovery query "${query}":`, error);
      }
    }

    const officialCandidates = Array.from(candidateSet).filter((url) => {
      const likelyOfficial = isLikelyOfficialCandidate(url, school.website, school.name);
      if (!likelyOfficial) return false;

      const inferredState = inferStateFromUrl(url);
      if (
        school.state &&
        inferredState &&
        school.state.toUpperCase() !== inferredState
      ) {
        return false;
      }

      return true;
    });
    const bestByHost = new Map<string, string>();
    for (const url of officialCandidates) {
      let host = "";
      let path = "";
      try {
        const parsed = new URL(url);
        host = parsed.hostname.toLowerCase();
        path = parsed.pathname;
      } catch {
        continue;
      }

      const currentBest = bestByHost.get(host);
      if (!currentBest) {
        bestByHost.set(host, url);
        continue;
      }

      const currentPath = (() => {
        try {
          return new URL(currentBest).pathname;
        } catch {
          return "/";
        }
      })();

      const score = (p: string) => {
        if (p === "/" || p === "") return 0;
        if (p.includes("contact")) return 1;
        return 2;
      };

      if (score(path) < score(currentPath)) {
        bestByHost.set(host, url);
      }
    }
    const dedupedOfficialCandidates = Array.from(bestByHost.values());
    const rejectedCandidates = Array.from(candidateSet)
      .filter((url) => {
        if (!isLikelyOfficialCandidate(url, school.website, school.name)) return true;
        const inferredState = inferStateFromUrl(url);
        if (
          school.state &&
          inferredState &&
          school.state.toUpperCase() !== inferredState
        ) {
          return true;
        }
        return false;
      })
      .map((url) => {
        let host = "invalid";
        try {
          host = new URL(url).hostname;
        } catch {}
        return {
          url,
          host,
          reason: getRejectionReason(url, school.website, school.name, school.state),
        };
      });

    const rejectedReasonCounts = rejectedCandidates.reduce<Record<string, number>>((acc, item) => {
      const key = item.reason || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const discovered = dedupedOfficialCandidates
      .filter((url) => !existingUrls.has(url))
      .slice(0, 12)
      .map((url) => {
        const host = new URL(url).hostname.toLowerCase();
        const isMySchool = host === "myschool.edu.au";
        return {
          url,
          label: buildSourceLabel(url, school.name),
          sourceType: classifySourceType(url, school.name),
          isActive: !isMySchool,
        };
      });

    let addedCount = 0;
    if (persist && discovered.length > 0) {
      for (const source of discovered) {
        try {
          await db.schoolSource.create({
            data: {
              schoolId: school.id,
              label: source.label,
              url: source.url,
              sourceType: source.sourceType,
              isOfficial: true,
              isActive: source.isActive,
            },
          });
          addedCount += 1;
        } catch (error) {
          // Skip duplicates or race conditions.
          console.warn("Skipping discovered source create failure:", error);
        }
      }
    }

    const details = {
      school: {
        id: school.id,
        name: school.name,
        state: school.state,
        suburb: school.suburb,
      },
      queries: queryDiagnostics,
      candidateHosts: Array.from(candidateSet)
        .slice(0, 25)
        .map((url) => {
          try {
            return new URL(url).hostname;
          } catch {
            return "invalid";
          }
        }),
      officialCandidateHosts: dedupedOfficialCandidates.slice(0, 25).map((url) => {
        try {
          return new URL(url).hostname;
        } catch {
          return "invalid";
        }
      }),
      rejectedReasonCounts,
      rejectedCandidates: rejectedCandidates.slice(0, 30),
      discovered,
      geminiErrors,
    };

    if (discoveryRunId) {
      await db.schoolSourceDiscoveryRun.update({
        where: { id: discoveryRunId },
        data: {
          status: "COMPLETED",
          queryCount: queries.length,
          geminiHits,
          candidateCount: candidateSet.size,
          officialCandidateCount: dedupedOfficialCandidates.length,
          discoveredCount: discovered.length,
          addedCount,
          errorMessage:
            geminiErrors.length > 0 ? geminiErrors.slice(0, 3).join(" | ").slice(0, 1000) : null,
          details,
        },
      });
    }

    return NextResponse.json({
      success: true,
      discoveryRunId,
      school: { id: school.id, name: school.name },
      discovered,
      addedCount,
      candidateCount: candidateSet.size,
      candidateHosts: Array.from(candidateSet)
        .slice(0, 10)
        .map((url) => {
          try {
            return new URL(url).hostname;
          } catch {
            return "invalid";
          }
        }),
      officialCandidateCount: dedupedOfficialCandidates.length,
      officialCandidateHosts: dedupedOfficialCandidates
        .slice(0, 8)
        .map((url) => new URL(url).hostname),
      rejectedCandidateCount: rejectedCandidates.length,
      rejectedReasonCounts,
      rejectedCandidates: rejectedCandidates.slice(0, 8),
      geminiHits,
      geminiError:
        geminiErrors.length > 0
          ? geminiErrors[0].slice(0, 500)
          : null,
      persisted: persist,
    });
  } catch (error) {
    if (discoveryRunId) {
      try {
        await db.schoolSourceDiscoveryRun.update({
          where: { id: discoveryRunId },
          data: {
            status: "FAILED",
            errorMessage:
              error instanceof Error ? error.message.slice(0, 1000) : "Unknown discovery error",
          },
        });
      } catch (updateError) {
        console.error("Failed to update discovery run error state:", updateError);
      }
    }

    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error discovering enrichment sources:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
