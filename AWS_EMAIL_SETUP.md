# AWS SES & SNS Email Integration Setup

This guide explains how to set up Amazon SES (Simple Email Service) and SNS (Simple Notification Service) for email delivery and bounce/complaint handling in your SchoolScope application.

## Prerequisites

1. AWS Account with appropriate permissions
2. Verified domain or email address in SES
3. SES moved out of sandbox mode (for production)

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here

# SES Configuration
SES_FROM_EMAIL=noreply@yourdomain.com
SES_FROM_NAME=SchoolScope

# SNS Configuration
SNS_TOPIC_ARN_BOUNCE=arn:aws:sns:us-east-1:your-account:ses-bounces
SNS_TOPIC_ARN_COMPLAINT=arn:aws:sns:us-east-1:your-account:ses-complaints
SNS_TOPIC_ARN_DELIVERY=arn:aws:sns:us-east-1:your-account:ses-delivery

# Webhook secret for SNS notifications (generate a random string)
SNS_WEBHOOK_SECRET=your_random_webhook_secret_here
```

## AWS Setup Steps

### 1. Set up SES

1. **Verify your domain or email address:**
   - Go to AWS SES Console
   - Navigate to "Verified identities"
   - Add your domain or email address
   - Complete the verification process

2. **Request production access (if needed):**
   - Go to "Account dashboard"
   - Click "Request production access"
   - Fill out the form explaining your use case

3. **Set up configuration sets (optional but recommended):**
   - Create a configuration set for tracking
   - Enable event publishing

### 2. Set up SNS Topics

Create three SNS topics for handling different email events:

```bash
# Create topics
aws sns create-topic --name ses-bounces
aws sns create-topic --name ses-complaints  
aws sns create-topic --name ses-delivery
```

### 3. Configure SES Event Publishing

1. **Go to SES Console > Configuration sets**
2. **Create or edit a configuration set**
3. **Add event destinations:**
   - Bounce events → SNS topic: `ses-bounces`
   - Complaint events → SNS topic: `ses-complaints`
   - Delivery events → SNS topic: `ses-delivery`

### 4. Subscribe SNS Topics to Your Webhook

For each SNS topic, create an HTTPS subscription:

```bash
# Replace with your actual domain and topic ARNs
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:your-account:ses-bounces \
  --protocol https \
  --notification-endpoint https://yourdomain.com/api/webhooks/sns

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:your-account:ses-complaints \
  --protocol https \
  --notification-endpoint https://yourdomain.com/api/webhooks/sns

aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:your-account:ses-delivery \
  --protocol https \
  --notification-endpoint https://yourdomain.com/api/webhooks/sns
```

## Database Migration

The integration adds new fields to track email subscriptions and events. Run the migration:

```bash
npm run db:migrate
```

This adds:
- `emailVerified` and `emailSubscribed` fields to the User model
- `EmailEvent` model for tracking email delivery events

## API Endpoints

### SNS Webhook Endpoint
- **URL:** `/api/webhooks/sns`
- **Method:** POST
- **Purpose:** Receives bounce, complaint, and delivery notifications from AWS SNS

### Email Unsubscribe
- **URL:** `/api/email/unsubscribe`
- **Methods:** GET (with token), POST (with email)
- **Purpose:** Allows users to unsubscribe from emails

### Admin Email Statistics
- **URL:** `/api/admin/email-stats`
- **Methods:** GET (view stats), POST (update subscription)
- **Purpose:** View email delivery statistics and manage subscriptions

## Usage Examples

### Sending Emails

```typescript
import { sendEmail, sendWelcomeEmail, sendEventNotification } from '@/lib/email';

// Send a custom email
await sendEmail({
  to: 'user@example.com',
  subject: 'Hello from SchoolScope',
  html: '<h1>Hello!</h1><p>This is a test email.</p>',
  userId: 'user-id-optional'
});

// Send welcome email
await sendWelcomeEmail('user@example.com', 'John Doe', 'user-id');

// Send event notification
await sendEventNotification(
  'user@example.com',
  'School Sports Day',
  new Date('2024-06-15'),
  'Springfield Elementary',
  'user-id'
);
```

### Checking Subscription Status

```typescript
import { isUserSubscribed, getSubscribedUsers } from '@/lib/email-utils';

// Check if a user is subscribed
const isSubscribed = await isUserSubscribed('user@example.com');

// Get all subscribed users from a list
const emails = ['user1@example.com', 'user2@example.com'];
const subscribedEmails = await getSubscribedUsers(emails);
```

### Managing Subscriptions

```typescript
import { updateSubscriptionStatus } from '@/lib/email-utils';

// Unsubscribe a user
await updateSubscriptionStatus('user@example.com', false);

// Resubscribe a user
await updateSubscriptionStatus('user@example.com', true);
```

## Email Event Tracking

The system automatically tracks:
- **SEND:** When an email is sent
- **DELIVERY:** When an email is successfully delivered
- **BOUNCE:** When an email bounces (temporary or permanent)
- **COMPLAINT:** When a recipient marks email as spam
- **REJECT:** When SES rejects the email

### Automatic Actions

- **Permanent bounces:** Automatically unsubscribe the user
- **Complaints:** Automatically unsubscribe the user
- **Event logging:** All events are stored in the database for analysis

## Monitoring and Analytics

### View Email Statistics

Access `/api/admin/email-stats` to get:
- Total users and subscription counts
- Delivery statistics by event type
- Recent bounces and complaints
- Recent email events with details

### Example Response

```json
{
  "stats": {
    "totalUsers": 1000,
    "subscribedUsers": 950,
    "unsubscribedUsers": 50,
    "totalEmailEvents": 5000,
    "recentBouncesCount": 5,
    "recentComplaintsCount": 2
  },
  "deliveryStats": {
    "SEND": 1000,
    "DELIVERY": 980,
    "BOUNCE": 15,
    "COMPLAINT": 5
  },
  "recentBounces": ["bounced@example.com"],
  "recentComplaints": ["complaint@example.com"],
  "recentEvents": [...]
}
```

## Security Considerations

1. **Webhook Verification:** The SNS webhook endpoint verifies message signatures
2. **Unsubscribe Tokens:** Unsubscribe links use HMAC tokens for security
3. **Environment Variables:** Keep AWS credentials secure and never commit them
4. **Admin Endpoints:** Implement proper authentication for admin endpoints

## Troubleshooting

### Common Issues

1. **SNS Subscription Confirmation:**
   - Check your webhook endpoint logs
   - Manually confirm subscriptions if needed

2. **Email Not Sending:**
   - Verify SES domain/email verification
   - Check AWS credentials and permissions
   - Ensure SES is out of sandbox mode

3. **Bounces Not Being Processed:**
   - Verify SNS topic subscriptions
   - Check webhook endpoint is accessible
   - Verify webhook secret matches

### Logs to Check

- Application logs for email sending errors
- AWS CloudWatch logs for SES events
- SNS delivery status for webhook calls

## Production Checklist

- [ ] Domain verified in SES
- [ ] SES moved out of sandbox mode
- [ ] SNS topics created and configured
- [ ] Webhook endpoint deployed and accessible
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Email templates tested
- [ ] Bounce/complaint handling tested
- [ ] Monitoring and alerting set up 