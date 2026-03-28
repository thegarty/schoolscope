import {
  SchoolEnrichmentProposalStatus,
  SchoolEnrichmentProposalType,
  SchoolEnrichmentTriggerType,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { extractSchoolData } from "@/lib/enrichment/extractor";
import { extractSchoolDataWithAI } from "@/lib/enrichment/ai-extractor";
import { isAllowedOfficialSource } from "@/lib/enrichment/source-policy";
import {
  aiReviewProposalCandidate,
  isDuplicateAgainstExisting,
  shouldReplaceCurrentValue,
} from "@/lib/enrichment/proposal-review";
import {
  buildAboutSummary,
  cleanAboutContent,
  cleanFieldValueByType,
} from "@/lib/enrichment/cleaning";

type RunOptions = {
  schoolId: string;
  triggerType?: SchoolEnrichmentTriggerType;
};

function sourcePathScore(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    const path = parsed.pathname.toLowerCase();
    if (path === "/" || path === "") return 0;
    if (path.includes("contact")) return 1;
    return 2;
  } catch {
    return 3;
  }
}

type ProposalPayload = {
  schoolId: string;
  runId: string;
  sourceId: string;
  proposalType: SchoolEnrichmentProposalType;
  targetField?: string;
  existingValue?: string | null;
  proposedValue: unknown;
  confidence: number;
  sourceUrl: string;
  evidenceSnippet?: string;
};

async function createProposalIfNew(payload: ProposalPayload) {
  const currentValueDecision = shouldReplaceCurrentValue({
    proposalType: payload.proposalType,
    targetField: payload.targetField,
    existingValue: payload.existingValue,
    proposedValue: payload.proposedValue,
    confidence: payload.confidence,
  });
  if (!currentValueDecision.keep) return false;

  const existing = await db.schoolEnrichmentProposal.findMany({
    where: {
      schoolId: payload.schoolId,
      proposalType: payload.proposalType,
      targetField: payload.targetField ?? null,
      status: {
        in: [
          SchoolEnrichmentProposalStatus.PENDING,
          SchoolEnrichmentProposalStatus.APPROVED,
          SchoolEnrichmentProposalStatus.APPLIED,
        ],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      proposalType: true,
      targetField: true,
      proposedValue: true,
      status: true,
    },
  });

  const duplicate = isDuplicateAgainstExisting({
    proposalType: payload.proposalType,
    targetField: payload.targetField,
    proposedValue: payload.proposedValue,
    existing,
  });
  if (duplicate) return false;

  if (payload.proposalType === "EVENT") {
    const candidate = (payload.proposedValue ?? {}) as Record<string, unknown>;
    const title = typeof candidate.title === "string" ? candidate.title.trim() : "";
    const startDate = typeof candidate.startDate === "string" ? candidate.startDate : "";
    if (!title || !startDate) return false;

    const existingEvent = await db.event.findFirst({
      where: {
        schoolId: payload.schoolId,
        title: {
          equals: title,
          mode: "insensitive",
        },
        startDate: new Date(startDate),
      },
      select: { id: true },
    });
    if (existingEvent) return false;
  }

  const review = await aiReviewProposalCandidate({
    proposalType: payload.proposalType,
    targetField: payload.targetField,
    proposedValue: payload.proposedValue,
    existingCount: existing.length,
  });
  if (!review.keep) return false;

  await db.schoolEnrichmentProposal.create({
    data: {
      schoolId: payload.schoolId,
      runId: payload.runId,
      sourceId: payload.sourceId,
      proposalType: payload.proposalType,
      targetField: payload.targetField ?? null,
      existingValue: payload.existingValue ?? null,
      proposedValue: payload.proposedValue as object,
      confidence: payload.confidence,
      sourceUrl: payload.sourceUrl,
      evidenceSnippet: review.reason
        ? `${payload.evidenceSnippet || ""} [review: ${review.reason}]`.trim()
        : payload.evidenceSnippet,
    },
  });
  return true;
}

export async function runSchoolEnrichment({ schoolId, triggerType = "MANUAL" }: RunOptions) {
  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: {
      schoolSources: {
        where: { isActive: true, isOfficial: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!school) {
    throw new Error("School not found.");
  }

  if (!school.enrichmentEnabled || school.enrichmentPaused) {
    throw new Error("Enrichment is disabled or paused for this school.");
  }

  if (school.schoolSources.length === 0) {
    throw new Error("No official active sources configured for this school.");
  }

  const filteredSourcesMap = new Map<string, typeof school.schoolSources[number]>();
  for (const source of school.schoolSources) {
    let host = "";
    try {
      const parsed = new URL(source.url);
      host = parsed.hostname.toLowerCase();
    } catch {
      await db.schoolSource.update({
        where: { id: source.id },
        data: {
          isActive: false,
          lastFetchedAt: new Date(),
          lastError: "Invalid source URL format. Source auto-paused.",
        },
      });
      continue;
    }

    const current = filteredSourcesMap.get(host);
    if (!current) {
      filteredSourcesMap.set(host, source);
      continue;
    }

    if (sourcePathScore(source.url) < sourcePathScore(current.url)) {
      filteredSourcesMap.set(host, source);
    }
  }
  const filteredSources = Array.from(filteredSourcesMap.values());

  if (filteredSources.length === 0) {
    throw new Error("No valid active sources configured after source quality checks.");
  }

  const run = await db.schoolEnrichmentRun.create({
    data: {
      schoolId: school.id,
      status: "RUNNING",
      triggerType,
      startedAt: new Date(),
      totalSources: filteredSources.length,
      sources: {
        connect: filteredSources.map((source) => ({ id: source.id })),
      },
    },
  });

  let proposalsCreated = 0;
  let processedSources = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    for (const source of filteredSources) {
      if (!isAllowedOfficialSource(source.url, school.website)) {
        errors.push(`Blocked source by policy: ${source.url}`);
        await db.schoolSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastError: "Blocked by official source policy. Source auto-paused.",
            isActive: false,
          },
        });
        continue;
      }

      try {
        const response = await fetch(source.url, {
          headers: {
            "user-agent": "SchoolScopeBot/1.0 (+https://schoolscope.com.au)",
            accept: "text/html,application/xhtml+xml",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const html = await response.text();
        let extracted = null;
        try {
          extracted = await extractSchoolDataWithAI({
            html,
            schoolName: school.name,
            schoolWebsite: school.website,
            sourceUrl: source.url,
          });
        } catch (aiError) {
          const aiMessage =
            aiError instanceof Error ? aiError.message : "Unknown AI extraction error";
          warnings.push(`AI extraction failed for ${source.url}: ${aiMessage}`);
        }

        if (!extracted) {
          extracted = extractSchoolData(
            html,
            { website: school.website, name: school.name },
            source.url
          );
        }
        processedSources += 1;

        for (const fieldProposal of extracted.fields) {
          const normalizedValue = cleanFieldValueByType(fieldProposal.field, fieldProposal.value);
          if (!normalizedValue) continue;

          const existingValue = (school as Record<string, unknown>)[fieldProposal.field];
          const nextValue = normalizedValue.trim();
          const oldValue = typeof existingValue === "string" ? existingValue.trim() : "";
          if (!nextValue || nextValue === oldValue) continue;

          const created = await createProposalIfNew({
            schoolId: school.id,
            runId: run.id,
            sourceId: source.id,
            proposalType: "FIELD",
            targetField: fieldProposal.field,
            existingValue: oldValue,
            proposedValue: nextValue,
            confidence: fieldProposal.confidence,
            sourceUrl: source.url,
            evidenceSnippet: fieldProposal.evidence,
          });
          if (created) proposalsCreated += 1;
        }

        const cleanedAbout = extracted.aboutContent
          ? cleanAboutContent(extracted.aboutContent)
          : null;
        if (cleanedAbout && extracted.aboutConfidence && extracted.aboutEvidence) {
          const cleanedSummary = buildAboutSummary(cleanedAbout, extracted.aboutSummary);
          const aboutCreated = await createProposalIfNew({
            schoolId: school.id,
            runId: run.id,
            sourceId: source.id,
            proposalType: "ABOUT",
            existingValue: school.aboutContent,
            proposedValue: {
              content: cleanedAbout,
              summary: cleanedSummary ?? null,
            },
            confidence: extracted.aboutConfidence,
            sourceUrl: source.url,
            evidenceSnippet: extracted.aboutEvidence,
          });
          if (aboutCreated) proposalsCreated += 1;
        }

        for (const eventProposal of extracted.events) {
          const created = await createProposalIfNew({
            schoolId: school.id,
            runId: run.id,
            sourceId: source.id,
            proposalType: "EVENT",
            proposedValue: {
              title: eventProposal.title,
              description: eventProposal.description,
              startDate: eventProposal.startDate,
              endDate: eventProposal.endDate,
              location: eventProposal.location ?? null,
              category: eventProposal.category,
            },
            confidence: eventProposal.confidence,
            sourceUrl: source.url,
            evidenceSnippet: eventProposal.evidence,
          });
          if (created) proposalsCreated += 1;
        }

        await db.schoolSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastSuccessAt: new Date(),
            lastError: null,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown fetch error";
        errors.push(`${source.url}: ${message}`);
        await db.schoolSource.update({
          where: { id: source.id },
          data: {
            lastFetchedAt: new Date(),
            lastError: `${message}. Source auto-paused.`,
            isActive: false,
          },
        });
      }
    }

    await db.school.update({
      where: { id: school.id },
      data: { lastEnrichmentAt: new Date() },
    });

    await db.schoolEnrichmentRun.update({
      where: { id: run.id },
      data: {
        status: errors.length === filteredSources.length ? "FAILED" : "COMPLETED",
        processedSources,
        proposalsCreated,
        errorMessage:
          errors.length > 0
            ? errors.join(" | ").slice(0, 3000)
            : warnings.length > 0
              ? warnings.join(" | ").slice(0, 3000)
              : null,
        completedAt: new Date(),
      },
    });

    return {
      runId: run.id,
      processedSources,
      proposalsCreated,
      errors: errors.length > 0 ? errors : warnings,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown enrichment error";
    await db.schoolEnrichmentRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        processedSources,
        proposalsCreated,
        errorMessage: message,
        completedAt: new Date(),
      },
    });
    throw error;
  }
}
