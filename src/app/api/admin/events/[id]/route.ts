import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    await requireAdmin();

    const event = await db.event.findUnique({
      where: { id: params.id },
      include: {
        school: {
          select: {
            name: true,
            suburb: true,
            state: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        child: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            confirmations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event,
    });

  } catch (error) {
    console.error('Error fetching event:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    await requireAdmin();

    const data = await request.json();
    const { confirmed, title, description, startDate, endDate, category, location, yearLevels } = data;

    // Build update data
    const updateData: any = {};
    
    if (confirmed !== undefined) updateData.confirmed = confirmed;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startDate !== undefined) updateData.startDate = new Date(startDate);
    if (endDate !== undefined) updateData.endDate = new Date(endDate);
    if (category !== undefined) updateData.category = category;
    if (location !== undefined) updateData.location = location;
    if (yearLevels !== undefined) updateData.yearLevels = yearLevels;

    const event = await db.event.update({
      where: { id: params.id },
      data: updateData,
      include: {
        school: {
          select: {
            name: true,
            suburb: true,
            state: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            confirmations: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      event,
      message: 'Event updated successfully',
    });

  } catch (error) {
    console.error('Error updating event:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin access
    await requireAdmin();

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            confirmations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Delete event confirmations first (cascade should handle this, but being explicit)
    await db.eventConfirmation.deleteMany({
      where: { eventId: params.id },
    });

    // Delete the event
    await db.event.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting event:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 