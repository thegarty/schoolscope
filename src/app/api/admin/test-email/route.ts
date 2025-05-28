import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { sendEmail, sendWelcomeEmail, sendEventNotification } from '@/lib/email';
import { isUserSubscribed } from '@/lib/email-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Check admin access
    await requireAdmin();

    const { type, email, ...params } = await request.json();

    if (!type || !email) {
      return NextResponse.json(
        { error: 'Type and email are required' },
        { status: 400 }
      );
    }

    let result;
    let messageId;

    switch (type) {
      case 'welcome':
        messageId = await sendWelcomeEmail(
          email,
          params.name || 'Test User',
          params.userId || 'test-user-id'
        );
        result = { type: 'welcome', messageId };
        break;

      case 'event':
        messageId = await sendEventNotification(
          email,
          params.eventTitle || 'Test School Event',
          new Date(params.eventDate || Date.now() + 7 * 24 * 60 * 60 * 1000),
          params.schoolName || 'Test School',
          params.userId
        );
        result = { type: 'event', messageId };
        break;

      case 'custom':
        messageId = await sendEmail({
          to: email,
          subject: params.subject || 'Test Email from SchoolScope',
          html: params.html || `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h1 style="color: #333;">Test Email</h1>
              <p>This is a test email sent from the SchoolScope admin panel.</p>
              <p>If you received this, the email system is working correctly!</p>
              <p>Best regards,<br>The SchoolScope Team</p>
            </div>
          `,
          text: params.text,
          userId: params.userId,
        });
        result = { type: 'custom', messageId };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid email type. Use: welcome, event, or custom' },
          { status: 400 }
        );
    }

    if (!messageId) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Check subscription status
    const isSubscribed = await isUserSubscribed(email);

    return NextResponse.json({
      success: true,
      result,
      recipientSubscribed: isSubscribed,
      message: `Test ${type} email sent successfully`,
    });

  } catch (error) {
    console.error('Error sending test email:', error);
    
    if (error instanceof Error && error.message === 'Admin access required') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 