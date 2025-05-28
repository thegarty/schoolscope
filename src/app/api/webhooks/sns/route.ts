import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SNS_CONFIG } from '@/lib/aws';
import crypto from 'crypto';

interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL?: string;
  SubscribeURL?: string;
}

interface SESBounceMessage {
  eventType: 'bounce';
  bounce: {
    bounceType: string;
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
    reportingMTA?: string;
  };
  mail: {
    timestamp: string;
    messageId: string;
    source: string;
    sourceArn?: string;
    sourceIp?: string;
    sendingAccountId?: string;
    destination: string[];
    headersTruncated?: boolean;
    headers?: Array<{ name: string; value: string }>;
    commonHeaders?: {
      from?: string[];
      to?: string[];
      messageId?: string;
      subject?: string;
    };
  };
}

interface SESComplaintMessage {
  eventType: 'complaint';
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    complaintSubType?: string;
    userAgent?: string;
    complaintFeedbackType?: string;
    arrivalDate?: string;
  };
  mail: {
    timestamp: string;
    messageId: string;
    source: string;
    sourceArn?: string;
    sourceIp?: string;
    sendingAccountId?: string;
    destination: string[];
    headersTruncated?: boolean;
    headers?: Array<{ name: string; value: string }>;
    commonHeaders?: {
      from?: string[];
      to?: string[];
      messageId?: string;
      subject?: string;
    };
  };
}

interface SESDeliveryMessage {
  eventType: 'delivery';
  delivery: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
    reportingMTA: string;
  };
  mail: {
    timestamp: string;
    messageId: string;
    source: string;
    sourceArn?: string;
    sourceIp?: string;
    sendingAccountId?: string;
    destination: string[];
    headersTruncated?: boolean;
    headers?: Array<{ name: string; value: string }>;
    commonHeaders?: {
      from?: string[];
      to?: string[];
      messageId?: string;
      subject?: string;
    };
  };
}

function verifySignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', SNS_CONFIG.webhookSecret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-amz-sns-message-signature');
    
    if (!signature || !verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const snsMessage: SNSMessage = JSON.parse(body);

    // Handle SNS subscription confirmation
    if (snsMessage.Type === 'SubscriptionConfirmation') {
      console.log('SNS Subscription confirmation received');
      // In production, you might want to automatically confirm the subscription
      // by making a GET request to the SubscribeURL
      return NextResponse.json({ message: 'Subscription confirmation received' });
    }

    // Handle SNS notifications
    if (snsMessage.Type === 'Notification') {
      const message = JSON.parse(snsMessage.Message) as SESBounceMessage | SESComplaintMessage | SESDeliveryMessage;
      
      await handleSESEvent(message);
      
      return NextResponse.json({ message: 'Event processed successfully' });
    }

    return NextResponse.json({ message: 'Unknown message type' }, { status: 400 });
  } catch (error) {
    console.error('Error processing SNS webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleSESEvent(message: SESBounceMessage | SESComplaintMessage | SESDeliveryMessage) {
  const { mail } = message;
  
  try {
    switch (message.eventType) {
      case 'bounce':
        await handleBounce(message as SESBounceMessage);
        break;
      case 'complaint':
        await handleComplaint(message as SESComplaintMessage);
        break;
      case 'delivery':
        await handleDelivery(message as SESDeliveryMessage);
        break;
      default:
        console.log('Unknown SES event type:', (message as any).eventType);
    }
  } catch (error) {
    console.error('Error handling SES event:', error);
  }
}

async function handleBounce(message: SESBounceMessage) {
  const { bounce, mail } = message;
  
  for (const recipient of bounce.bouncedRecipients) {
    // Find user by email and update their subscription status if it's a permanent bounce
    if (bounce.bounceType === 'Permanent') {
      await db.user.updateMany({
        where: { email: recipient.emailAddress },
        data: { emailSubscribed: false },
      });
    }
    
    // Log the bounce event
    await db.emailEvent.create({
      data: {
        email: recipient.emailAddress,
        messageId: mail.messageId,
        eventType: 'BOUNCE',
        timestamp: new Date(bounce.timestamp),
        reason: recipient.diagnosticCode || 'Email bounced',
        bounceType: bounce.bounceType,
        subType: bounce.bounceSubType,
        destination: recipient.emailAddress,
        source: mail.source,
      },
    });
  }
}

async function handleComplaint(message: SESComplaintMessage) {
  const { complaint, mail } = message;
  
  for (const recipient of complaint.complainedRecipients) {
    // Unsubscribe user from emails
    await db.user.updateMany({
      where: { email: recipient.emailAddress },
      data: { emailSubscribed: false },
    });
    
    // Log the complaint event
    await db.emailEvent.create({
      data: {
        email: recipient.emailAddress,
        messageId: mail.messageId,
        eventType: 'COMPLAINT',
        timestamp: new Date(complaint.timestamp),
        reason: complaint.complaintFeedbackType || 'Email complaint',
        subType: complaint.complaintSubType,
        destination: recipient.emailAddress,
        source: mail.source,
      },
    });
  }
}

async function handleDelivery(message: SESDeliveryMessage) {
  const { delivery, mail } = message;
  
  for (const recipient of delivery.recipients) {
    // Log the delivery event
    await db.emailEvent.create({
      data: {
        email: recipient,
        messageId: mail.messageId,
        eventType: 'DELIVERY',
        timestamp: new Date(delivery.timestamp),
        destination: recipient,
        source: mail.source,
      },
    });
  }
} 