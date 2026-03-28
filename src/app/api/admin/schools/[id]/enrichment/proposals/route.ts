import { NextRequest, NextResponse } from "next/server";
import {
  SchoolEnrichmentProposalStatus,
  SchoolEnrichmentProposalType,
} from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const proposalType = searchParams.get("proposalType");
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 200);

    const where: {
      schoolId: string;
      status?: SchoolEnrichmentProposalStatus;
      proposalType?: SchoolEnrichmentProposalType;
    } = { schoolId: id };

    if (
      status &&
      Object.values(SchoolEnrichmentProposalStatus).includes(status as SchoolEnrichmentProposalStatus)
    ) {
      where.status = status as SchoolEnrichmentProposalStatus;
    }

    if (
      proposalType &&
      Object.values(SchoolEnrichmentProposalType).includes(proposalType as SchoolEnrichmentProposalType)
    ) {
      where.proposalType = proposalType as SchoolEnrichmentProposalType;
    }

    const proposals = await db.schoolEnrichmentProposal.findMany({
      where,
      include: {
        source: true,
        run: {
          select: {
            id: true,
            createdAt: true,
            triggerType: true,
          },
        },
        reviewedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ success: true, proposals });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Error fetching enrichment proposals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
