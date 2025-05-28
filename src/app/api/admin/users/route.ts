import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { db } from '@/lib/db';
import { updateSubscriptionStatus } from '@/lib/email-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const subscriptionFilter = searchParams.get('subscription'); // 'subscribed', 'unsubscribed', or null
    const adminFilter = searchParams.get('admin'); // 'true' to filter only admins

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (subscriptionFilter === 'subscribed') {
      where.emailSubscribed = true;
    } else if (subscriptionFilter === 'unsubscribed') {
      where.emailSubscribed = false;
    }

    if (adminFilter === 'true') {
      where.isAdmin = true;
    }

    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          emailSubscribed: true,
          emailVerified: true,
          createdAt: true,
          _count: {
            select: {
              emailEvents: true,
              children: true,
              events: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate updates
    const allowedUpdates = ['emailSubscribed', 'isAdmin', 'emailVerified'];
    const validUpdates: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        validUpdates[key] = value;
      }
    }

    if (Object.keys(validUpdates).length === 0) {
      return NextResponse.json(
        { error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: validUpdates,
      select: {
        id: true,
        email: true,
        name: true,
        isAdmin: true,
        emailSubscribed: true,
        emailVerified: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'User updated successfully',
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 