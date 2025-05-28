import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';
    const category = searchParams.get('category')?.trim() || '';
    const confirmed = searchParams.get('confirmed');
    const isPrivate = searchParams.get('isPrivate');
    const schoolId = searchParams.get('schoolId')?.trim() || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build where clause
    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (confirmed !== null) {
      whereClause.confirmed = confirmed === 'true';
    }

    if (isPrivate !== null) {
      whereClause.isPrivate = isPrivate === 'true';
    }

    if (schoolId) {
      whereClause.schoolId = schoolId;
    }

    const events = await db.event.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
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
      orderBy: [
        { confirmed: 'asc' }, // Pending events first
        { startDate: 'desc' }, // Then by start date
      ],
      take: Math.min(limit, 100), // Cap at 100 for performance
    });

    return NextResponse.json({
      success: true,
      events,
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 