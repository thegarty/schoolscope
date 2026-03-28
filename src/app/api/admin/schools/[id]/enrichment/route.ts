import { NextRequest, NextResponse } from "next/server";
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

    const school = await db.school.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        website: true,
        enrichmentEnabled: true,
        enrichmentPaused: true,
        enrichmentPilot: true,
        enrichmentFrequencyHours: true,
        lastEnrichmentAt: true,
        schoolSources: {
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            enrichmentProposals: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const pendingCount = await db.schoolEnrichmentProposal.count({
      where: { schoolId: id, status: "PENDING" },
    });

    const lastRun = await db.schoolEnrichmentRun.findFirst({
      where: { schoolId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      school,
      pendingCount,
      lastRun,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Error loading enrichment config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const enrichmentFrequencyHours = Number(body.enrichmentFrequencyHours ?? 168);
    if (!Number.isFinite(enrichmentFrequencyHours) || enrichmentFrequencyHours < 1) {
      return NextResponse.json(
        { error: "enrichmentFrequencyHours must be a positive number" },
        { status: 400 }
      );
    }

    const school = await db.school.update({
      where: { id },
      data: {
        enrichmentEnabled: Boolean(body.enrichmentEnabled),
        enrichmentPaused: Boolean(body.enrichmentPaused),
        enrichmentPilot: Boolean(body.enrichmentPilot),
        enrichmentFrequencyHours: Math.min(Math.round(enrichmentFrequencyHours), 24 * 30),
      },
      select: {
        id: true,
        enrichmentEnabled: true,
        enrichmentPaused: true,
        enrichmentPilot: true,
        enrichmentFrequencyHours: true,
        lastEnrichmentAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      school,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Error updating enrichment config:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
