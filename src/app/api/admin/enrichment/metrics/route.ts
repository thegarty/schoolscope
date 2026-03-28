import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const [
      pendingProposals,
      approvedOrApplied,
      rejectedProposals,
      enabledSchools,
      pilotSchools,
      lastRuns,
      upcomingEvents,
    ] = await Promise.all([
      db.schoolEnrichmentProposal.count({ where: { status: "PENDING" } }),
      db.schoolEnrichmentProposal.count({ where: { status: { in: ["APPROVED", "APPLIED"] } } }),
      db.schoolEnrichmentProposal.count({ where: { status: "REJECTED" } }),
      db.school.count({ where: { enrichmentEnabled: true } }),
      db.school.count({ where: { enrichmentPilot: true, enrichmentEnabled: true } }),
      db.schoolEnrichmentRun.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          schoolId: true,
          status: true,
          proposalsCreated: true,
          processedSources: true,
          createdAt: true,
        },
      }),
      db.event.count({
        where: {
          startDate: { gte: new Date() },
          isAiGenerated: true,
          isPrivate: false,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      metrics: {
        pendingProposals,
        approvedOrApplied,
        rejectedProposals,
        enabledSchools,
        pilotSchools,
        aiUpcomingEvents: upcomingEvents,
        recentRuns: lastRuns,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Error fetching enrichment metrics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
