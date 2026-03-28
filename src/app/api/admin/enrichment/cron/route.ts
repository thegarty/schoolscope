import { NextRequest, NextResponse } from "next/server";
import { runSchoolEnrichment } from "@/lib/enrichment/runner";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function shouldRunSchool(
  lastEnrichmentAt: Date | null,
  frequencyHours: number
) {
  if (!lastEnrichmentAt) return true;
  const nextRunAt = new Date(lastEnrichmentAt.getTime() + frequencyHours * 60 * 60 * 1000);
  return Date.now() >= nextRunAt.getTime();
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-enrichment-token");
    if (!token || token !== process.env.ENRICHMENT_CRON_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const pilotOnly = Boolean(body.pilotOnly);
    const limit = Math.min(Number(body.limit ?? 10), 50);

    const schools = await db.school.findMany({
      where: {
        enrichmentEnabled: true,
        enrichmentPaused: false,
        ...(pilotOnly ? { enrichmentPilot: true } : {}),
      },
      orderBy: { lastEnrichmentAt: "asc" },
      take: limit,
      select: {
        id: true,
        enrichmentFrequencyHours: true,
        lastEnrichmentAt: true,
      },
    });

    const results: Array<{ schoolId: string; ok: boolean; message?: string }> = [];

    for (const school of schools) {
      if (!shouldRunSchool(school.lastEnrichmentAt, school.enrichmentFrequencyHours)) {
        continue;
      }

      try {
        await runSchoolEnrichment({
          schoolId: school.id,
          triggerType: "SCHEDULED",
        });
        results.push({ schoolId: school.id, ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed";
        results.push({ schoolId: school.id, ok: false, message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("Error running scheduled enrichment:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
