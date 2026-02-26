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

// Resend webhooks are delivered via svix.
// Signed content = "{svix-id}.{svix-timestamp}.{raw-body}"
// Secret is base64-encoded (with optional "whsec_" prefix).
// Signature is base64, prefixed with "v1," — multiple may be present space-separated.
function verifySignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string
): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) return false

  const rawSecret = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const secretBytes = Buffer.from(rawSecret, 'base64')

  const signedContent = `${svixId}.${svixTimestamp}.${payload}`
  const expected = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64')

  return svixSignature.split(' ').some(sig => {
    const value = sig.startsWith('v1,') ? sig.slice(3) : sig
    return value === expected
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()

    // Verify svix signature headers if secret is configured
    const svixId = request.headers.get('svix-id')
    const svixTimestamp = request.headers.get('svix-timestamp')
    const svixSignature = request.headers.get('svix-signature')
    if (process.env.RESEND_WEBHOOK_SECRET) {
      if (
        !svixId ||
        !svixTimestamp ||
        !svixSignature ||
        !verifySignature(body, svixId, svixTimestamp, svixSignature)
      ) {
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
    // Duplicate event delivery — Resend retries until it gets a 2xx, so return
    // 200 to stop the retry loop rather than letting it keep failing.
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json({ received: true, duplicate: true })
    }
    console.error('Error processing Resend webhook:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
