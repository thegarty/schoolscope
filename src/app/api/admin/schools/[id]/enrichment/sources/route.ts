import { NextRequest, NextResponse } from "next/server";
import { SchoolSourceType } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { normalizeSourceUrl } from "@/lib/enrichment/source-policy";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const sources = await db.schoolSource.findMany({
      where: { schoolId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, sources });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Error fetching enrichment sources:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const label = String(body.label ?? "").trim();
    const normalizedUrl = normalizeSourceUrl(String(body.url ?? ""));
    const sourceTypeRaw = String(body.sourceType ?? "").trim();

    if (!label || !normalizedUrl) {
      return NextResponse.json(
        { error: "label and valid url are required" },
        { status: 400 }
      );
    }

    if (!Object.values(SchoolSourceType).includes(sourceTypeRaw as SchoolSourceType)) {
      return NextResponse.json(
        { error: "Invalid sourceType" },
        { status: 400 }
      );
    }

    const source = await db.schoolSource.create({
      data: {
        schoolId: id,
        label,
        url: normalizedUrl,
        sourceType: sourceTypeRaw as SchoolSourceType,
        isOfficial: true,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "This source URL is already configured for the school." },
        { status: 409 }
      );
    }
    console.error("Error creating enrichment source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
