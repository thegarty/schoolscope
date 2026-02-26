import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getBouncedEmails, getComplaintEmails } from '@/lib/email-utils';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();
    
    // Get email statistics
    const [
      totalUsers,
      subscribedUsers,
      totalEmailEvents,
      recentBounces,
      recentComplaints,
      deliveryStats,
    ] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { emailSubscribed: true } }),
      db.emailEvent.count(),
      getBouncedEmails(30),
      getComplaintEmails(30),
      db.emailEvent.groupBy({
        by: ['eventType'],
        _count: { eventType: true },
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
          },
        },
      }),
    ]);

    // Get recent email events
    const recentEvents = await db.emailEvent.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalUsers,
        subscribedUsers,
        unsubscribedUsers: totalUsers - subscribedUsers,
        totalEmailEvents,
        recentBouncesCount: recentBounces.length,
        recentComplaintsCount: recentComplaints.length,
      },
      deliveryStats: deliveryStats.reduce((acc: Record<string, number>, stat: typeof deliveryStats[number]) => {
        acc[stat.eventType] = stat._count.eventType;
        return acc;
      }, {}),
      recentBounces,
      recentComplaints,
      recentEvents: recentEvents.map((event: typeof recentEvents[number]) => ({
        id: event.id,
        email: event.email,
        userName: event.user?.name,
        eventType: event.eventType,
        timestamp: event.timestamp,
        reason: event.reason,
        bounceType: event.bounceType,
        subType: event.subType,
        createdAt: event.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update subscription status for a user
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();
    
    const { email, subscribed } = await request.json();

    if (!email || typeof subscribed !== 'boolean') {
      return NextResponse.json(
        { error: 'Email and subscribed status are required' },
        { status: 400 }
      );
    }

    const result = await db.user.updateMany({
      where: { email },
      data: { emailSubscribed: subscribed },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: `User ${subscribed ? 'subscribed' : 'unsubscribed'} successfully`,
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 