import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { normalizeSourceUrl } from "@/lib/enrichment/source-policy";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    await requireAdmin();
    const { id, sourceId } = await params;
    const body = await request.json();

    const existing = await db.schoolSource.findFirst({
      where: { id: sourceId, schoolId: id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    const url = body.url ? normalizeSourceUrl(String(body.url)) : undefined;
    if (body.url && !url) {
      return NextResponse.json({ error: "Invalid source URL." }, { status: 400 });
    }

    const source = await db.schoolSource.update({
      where: { id: sourceId },
      data: {
        label: body.label ? String(body.label).trim() : undefined,
        url: url ?? undefined,
        isActive: typeof body.isActive === "boolean" ? body.isActive : undefined,
      },
    });

    return NextResponse.json({ success: true, source });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Error updating source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sourceId: string }> }
) {
  try {
    await requireAdmin();
    const { id, sourceId } = await params;

    const existing = await db.schoolSource.findFirst({
      where: { id: sourceId, schoolId: id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Source not found." }, { status: 404 });
    }

    await db.schoolSource.delete({
      where: { id: sourceId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Admin access required") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    console.error("Error deleting source:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
