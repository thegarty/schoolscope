import { db } from "@/lib/db";
import { SchoolEnrichmentProposal, SchoolEnrichmentProposalType } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import {
  buildAboutSummary,
  cleanAboutContent,
  cleanFieldValueByType,
} from "@/lib/enrichment/cleaning";

const ALLOWED_FIELDS = new Set(["website", "phone", "email", "principalName", "address"]);

function proposalToString(value: unknown) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

export async function applyApprovedProposal(
  proposal: SchoolEnrichmentProposal,
  reviewerId: string,
  reviewNotes?: string
) {
  if (proposal.status !== "PENDING") {
    throw new Error("Only pending proposals can be applied.");
  }

  if (proposal.proposalType === SchoolEnrichmentProposalType.FIELD) {
    if (!proposal.targetField || !ALLOWED_FIELDS.has(proposal.targetField)) {
      throw new Error("Unsupported target field for enrichment proposal.");
    }

    if (proposal.confidence < 0.45) {
      throw new Error("Proposal confidence is too low to apply.");
    }

    const cleanedFieldValue = (() => {
      const value = proposalToString(proposal.proposedValue);
      if (
        proposal.targetField === "website" ||
        proposal.targetField === "email" ||
        proposal.targetField === "phone" ||
        proposal.targetField === "address" ||
        proposal.targetField === "principalName"
      ) {
        return cleanFieldValueByType(proposal.targetField, value);
      }
      return null;
    })();

    if (!cleanedFieldValue) {
      throw new Error("Proposal value could not be normalized for publishing.");
    }

    await db.school.update({
      where: { id: proposal.schoolId },
      data: {
        [proposal.targetField]: cleanedFieldValue,
      },
    });
  }

  if (proposal.proposalType === SchoolEnrichmentProposalType.ABOUT) {
    const payload = (proposal.proposedValue ?? {}) as Record<string, unknown>;
    const rawContent = proposalToString(payload.content);
    const content = cleanAboutContent(rawContent);
    const summary = content ? buildAboutSummary(content, proposalToString(payload.summary)) : "";
    if (!content) {
      throw new Error("About proposal is missing content.");
    }

    await db.school.update({
      where: { id: proposal.schoolId },
      data: {
        aboutContent: content,
        aboutSummary: summary || null,
        aboutUpdatedAt: new Date(),
      },
    });

    await db.schoolAboutVersion.create({
      data: {
        schoolId: proposal.schoolId,
        proposalId: proposal.id,
        content,
        summary: summary || null,
        sourceUrl: proposal.sourceUrl,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
  }

  if (proposal.proposalType === SchoolEnrichmentProposalType.EVENT) {
    const payload = (proposal.proposedValue ?? {}) as Record<string, unknown>;
    const title = proposalToString(payload.title);
    const description = proposalToString(payload.description) || "Upcoming school event discovered from official source.";
    const startDateRaw = proposalToString(payload.startDate);
    const endDateRaw = proposalToString(payload.endDate) || startDateRaw;
    const location = proposalToString(payload.location) || null;
    const category = proposalToString(payload.category) || "School Event";

    if (!title || !startDateRaw) {
      throw new Error("Event proposal is missing title or start date.");
    }

    const reviewer = await db.user.findUnique({
      where: { id: reviewerId },
      select: { id: true },
    });

    if (!reviewer) {
      throw new Error("Reviewer user could not be resolved.");
    }

    const existing = await db.event.findFirst({
      where: {
        schoolId: proposal.schoolId,
        title,
        startDate: new Date(startDateRaw),
      },
      select: { id: true },
    });

    if (!existing) {
      await db.event.create({
        data: {
          schoolId: proposal.schoolId,
          userId: reviewer.id,
          title,
          description,
          startDate: new Date(startDateRaw),
          endDate: new Date(endDateRaw),
          category,
          location,
          yearLevels: [],
          confirmed: true,
          isPrivate: false,
          sourceUrl: proposal.sourceUrl,
          sourceType: "OFFICIAL_WEB",
          sourceConfidence: proposal.confidence,
          isAiGenerated: true,
        },
      });
    }
  }

  await db.schoolEnrichmentProposal.update({
    where: { id: proposal.id },
    data: {
      status: "APPLIED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: reviewNotes ?? null,
    },
  });

  revalidatePath(`/schools`);
}
