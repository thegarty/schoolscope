import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import crypto from 'crypto'

// Resend webhook event types
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced'
  created_at: string
  data: {
    created_at: string
    email_id: string
    from: string
    to: string[]
    subject: string
    // bounce-specific
    bounce?: {
      message: string
    }
  }
}

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Verify signature if secret is configured
    const signature = request.headers.get('resend-signature')
    if (process.env.RESEND_WEBHOOK_SECRET) {
      if (!signature || !verifySignature(body, signature)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const event: ResendWebhookEvent = JSON.parse(body)
    const { type, data } = event
    const recipient = data.to?.[0] ?? ''
    const messageId = data.email_id

    switch (type) {
      case 'email.delivered':
        await db.emailEvent.create({
          data: {
            email: recipient,
            messageId,
            eventType: 'DELIVERY',
            timestamp: new Date(data.created_at),
            destination: data.to.join(','),
            source: data.from,
          },
        })
        break

      case 'email.bounced':
        // Permanently unsubscribe bounced address
        await db.user.updateMany({
          where: { email: recipient },
          data: { emailSubscribed: false },
        })
        await db.emailEvent.create({
          data: {
            email: recipient,
            messageId,
            eventType: 'BOUNCE',
            timestamp: new Date(data.created_at),
            reason: data.bounce?.message || 'Email bounced',
            bounceType: 'Permanent',
            destination: data.to.join(','),
            source: data.from,
          },
        })
        break

      case 'email.complained':
        // Unsubscribe on spam complaint
        await db.user.updateMany({
          where: { email: recipient },
          data: { emailSubscribed: false },
        })
        await db.emailEvent.create({
          data: {
            email: recipient,
            messageId,
            eventType: 'COMPLAINT',
            timestamp: new Date(data.created_at),
            reason: 'Spam complaint',
            destination: data.to.join(','),
            source: data.from,
          },
        })
        break

      default:
        // email.sent / email.delivery_delayed — no action needed
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing Resend webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
