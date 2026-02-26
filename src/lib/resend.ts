import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_CONFIG = {
  fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@schoolscope.com.au',
  fromName: process.env.RESEND_FROM_NAME || 'SchoolScope',
}
