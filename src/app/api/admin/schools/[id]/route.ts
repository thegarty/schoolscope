import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check admin access
    await requireAdmin();

    const school = await db.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
            children: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      school,
    });

  } catch (error) {
    console.error('Error fetching school:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check admin access
    await requireAdmin();

    const data = await request.json();
    const { name, address, city, state, postcode, phone, email, website, aboutContent, aboutSummary } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'School name is required' },
        { status: 400 }
      );
    }

    // Check if another school with same name exists (excluding current school)
    const existingSchool = await db.school.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        },
        NOT: {
          id
        }
      }
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'A school with this name already exists' },
        { status: 400 }
      );
    }

    const school = await db.school.update({
      where: { id },
      data: {
        name,
        suburb: city || '',
        state: state || '',
        postcode: postcode || '',
        address,
        phone,
        email,
        website,
        aboutContent: aboutContent || null,
        aboutSummary: aboutSummary || null,
        aboutUpdatedAt: aboutContent ? new Date() : null,
      },
      include: {
        _count: {
          select: {
            events: true,
            children: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      school,
      message: 'School updated successfully',
    });

  } catch (error) {
    console.error('Error updating school:', error);
    
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check admin access
    await requireAdmin();

    // Check if school has associated events or children
    const school = await db.school.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            events: true,
            children: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    if (school._count.events > 0 || school._count.children > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete school with associated events or children',
          details: {
            events: school._count.events,
            children: school._count.children,
          }
        },
        { status: 400 }
      );
    }

    await db.school.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'School deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting school:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 