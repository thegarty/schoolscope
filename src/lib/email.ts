import { SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';
import { sesClient, SES_CONFIG } from './aws';
import { db } from './db';
import crypto from 'crypto';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  userId?: string;
}

export function generateUnsubscribeLink(email: string): string {
  const token = crypto
    .createHmac('sha256', process.env.SNS_WEBHOOK_SECRET!)
    .update(email)
    .digest('hex');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/api/email/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

function addUnsubscribeFooter(html: string, email: string): string {
  const unsubscribeLink = generateUnsubscribeLink(email);
  
  return html + `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center;">
      <p>You received this email because you have an account with SchoolScope.</p>
      <p><a href="${unsubscribeLink}" style="color: #666;">Unsubscribe from these emails</a></p>
    </div>
  `;
}

export async function sendEmail(options: EmailOptions): Promise<string | null> {
  try {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const primaryEmail = recipients[0];
    
    // Add unsubscribe footer to HTML emails
    const htmlContent = options.html ? addUnsubscribeFooter(options.html, primaryEmail) : undefined;
    
    const params: SendEmailCommandInput = {
      Source: `${SES_CONFIG.fromName} <${SES_CONFIG.fromEmail}>`,
      Destination: {
        ToAddresses: recipients,
      },
      Message: {
        Subject: {
          Data: options.subject,
          Charset: 'UTF-8',
        },
        Body: {
          ...(htmlContent && {
            Html: {
              Data: htmlContent,
              Charset: 'UTF-8',
            },
          }),
          ...(options.text && {
            Text: {
              Data: options.text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    };

    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    
    // Log the email send event
    if (result.MessageId) {
      await db.emailEvent.create({
        data: {
          userId: options.userId,
          email: recipients[0], // Primary recipient
          messageId: result.MessageId,
          eventType: 'SEND',
          timestamp: new Date(),
          destination: recipients.join(','),
          source: SES_CONFIG.fromEmail,
        },
      });
    }
    
    return result.MessageId || null;
  } catch (error) {
    console.error('Failed to send email:', error);
    return null;
  }
}

export async function sendWelcomeEmail(email: string, name: string, userId: string) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Welcome to SchoolScope!</h1>
      <p>Hi ${name},</p>
      <p>Thank you for joining SchoolScope. We're excited to help you stay connected with your school community.</p>
      <p>You can now:</p>
      <ul>
        <li>View and create school events</li>
        <li>Manage your children's information</li>
        <li>Stay updated with school notifications</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The SchoolScope Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to SchoolScope!',
    html,
    userId,
  });
}

export async function sendEventNotification(
  email: string,
  eventTitle: string,
  eventDate: Date,
  schoolName: string,
  userId?: string
) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">New School Event</h1>
      <p>A new event has been added at ${schoolName}:</p>
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin: 0 0 10px 0; color: #333;">${eventTitle}</h2>
        <p style="margin: 0; color: #666;">Date: ${eventDate.toLocaleDateString()}</p>
      </div>
      <p>Visit SchoolScope to view more details and confirm your attendance.</p>
      <p>Best regards,<br>The SchoolScope Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `New Event: ${eventTitle}`,
    html,
    userId,
  });
} 