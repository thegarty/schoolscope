import 'server-only'
import { createAllAuthProxy } from '@allauth/react/next'

export function allauthProxy() {
  const project = process.env.ALLAUTH_PROJECT
  const proxySecret = process.env.ALLAUTH_PROXY_SECRET
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL
  if (!project || !proxySecret || !appOrigin) throw new Error('AllAuth environment is not configured')
  return createAllAuthProxy({ project, proxySecret, appOrigin, allauthURL: process.env.ALLAUTH_URL || 'https://allauth.co' })
}
