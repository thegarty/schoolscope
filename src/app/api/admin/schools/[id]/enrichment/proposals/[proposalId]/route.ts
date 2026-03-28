import { NextRequest, NextResponse } from "next/server";
import { SchoolEnrichmentProposalStatus } from "@/generated/prisma/client";
import { getAuthUser } from "@/lib/auth";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { applyApprovedProposal } from "@/lib/enrichment/publisher";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  try {
    await requireAdmin();
    const { id, proposalId } = await params;
    const body = await request.json();
    const status = String(body.status ?? "").toUpperCase() as SchoolEnrichmentProposalStatus;
    const notes = body.reviewNotes ? String(body.reviewNotes) : undefined;

    const proposal = await db.schoolEnrichmentProposal.findFirst({
      where: { id: proposalId, schoolId: id },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found." }, { status: 404 });
    }

    if (proposal.status !== "PENDING") {
      return NextResponse.json({ error: "Proposal already processed." }, { status: 400 });
    }

    const authUser = await getAuthUser();
    if (!authUser) {
      return NextResponse.json({ error: "Unable to resolve admin user." }, { status: 401 });
    }

    if (status === "APPROVED") {
      await db.schoolEnrichmentProposal.update({
        where: { id: proposal.id },
        data: {
          status: "APPROVED",
          reviewedById: authUser.id,
          reviewedAt: new Date(),
          reviewNotes: notes ?? null,
        },
      });

      await applyApprovedProposal(proposal, authUser.id, notes);
      return NextResponse.json({ success: true, status: "APPLIED" });
    }

    if (status === "REJECTED") {
      await db.schoolEnrichmentProposal.update({
        where: { id: proposal.id },
        data: {
          status: "REJECTED",
          reviewedById: authUser.id,
          reviewedAt: new Date(),
          reviewNotes: notes ?? null,
        },
      });
      return NextResponse.json({ success: true, status: "REJECTED" });
    }

    return NextResponse.json(
      { error: "status must be APPROVED or REJECTED" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error reviewing enrichment proposal:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
