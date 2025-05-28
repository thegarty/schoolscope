import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    await requireAdmin();

    const data = await request.json();
    const { status, reason } = data;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    // Get the edit request
    const editRequest = await db.schoolEdit.findUnique({
      where: { id: params.id },
      include: {
        school: true,
      },
    });

    if (!editRequest) {
      return NextResponse.json(
        { error: 'Edit request not found' },
        { status: 404 }
      );
    }

    if (editRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Edit request has already been processed' },
        { status: 400 }
      );
    }

    // Update the edit request status
    const updatedEdit = await db.schoolEdit.update({
      where: { id: params.id },
      data: {
        status,
      },
    });

    // If approved, apply the changes to the school
    if (status === 'APPROVED') {
      const updateData: any = {};
      updateData[editRequest.field] = editRequest.newValue;

      await db.school.update({
        where: { id: editRequest.schoolId },
        data: updateData,
      });
    }

    return NextResponse.json({
      success: true,
      edit: updatedEdit,
      message: `Edit request ${status.toLowerCase()} successfully`,
    });

  } catch (error) {
    console.error('Error processing school edit:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 