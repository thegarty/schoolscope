import { Resend } from 'resend'

let client: Resend | undefined
export function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('Email delivery is not configured: set RESEND_API_KEY')
  return client ??= new Resend(process.env.RESEND_API_KEY)
}

export const EMAIL_CONFIG = {
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@schoolscope.com.au',
  fromName: process.env.RESEND_FROM_NAME || 'SchoolScope',
}
