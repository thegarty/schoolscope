import { SESClient } from '@aws-sdk/client-ses';
import { SNSClient } from '@aws-sdk/client-sns';

const awsConfig = {
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
};

export const sesClient = new SESClient(awsConfig);
export const snsClient = new SNSClient(awsConfig);

export const SES_CONFIG = {
  fromEmail: process.env.SES_FROM_EMAIL!,
  fromName: process.env.SES_FROM_NAME || 'SchoolScope',
};

export const SNS_CONFIG = {
  topicArn: process.env.SNS_TOPIC_ARN!,
  webhookSecret: process.env.SNS_WEBHOOK_SECRET!,
}; 