import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json({ error: 'Missing token or email' }, { status: 400 });
  }

  // Verify the unsubscribe token
  const expectedToken = crypto
    .createHmac('sha256', process.env.SNS_WEBHOOK_SECRET!)
    .update(email)
    .digest('hex');

  if (token !== expectedToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    // Update user subscription status
    await db.user.updateMany({
      where: { email },
      data: { emailSubscribed: false },
    });

    return new NextResponse(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed - SchoolScope</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
            .container { text-align: center; }
            .success { color: #28a745; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 class="success">Successfully Unsubscribed</h1>
            <p>You have been unsubscribed from SchoolScope email notifications.</p>
            <p>If you change your mind, you can re-enable email notifications in your account settings.</p>
          </div>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Update user subscription status
    const result = await db.user.updateMany({
      where: { email },
      data: { emailSubscribed: false },
    });

    if (result.count === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Successfully unsubscribed' });
  } catch (error) {
    console.error('Error unsubscribing user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 