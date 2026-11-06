import { cache } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { allauthProxy } from '@/lib/allauth-server'

export interface AuthUser {
  id: string
  allauthId: string
  email: string
  name: string | null
  isAdmin: boolean
}

export const getAuthUser = cache(async (): Promise<AuthUser | null> => {
  const incoming = await headers()
  const cookie = incoming.get('cookie') || ''
  const prefix = `allauth_project_${process.env.ALLAUTH_PROJECT}.`
  if (!cookie.split(';').some(part => part.trim().startsWith(prefix) || part.trim().startsWith(`__Secure-${prefix}`))) return null
  const origin = process.env.NEXT_PUBLIC_APP_URL
  if (!origin) throw new Error('Application origin is not configured')
  const response = await allauthProxy()(new Request(`${origin}/api/allauth/get-session?disableCookieCache=true`, {
    headers: { cookie: incoming.get('cookie') || '' },
  }), { params: Promise.resolve({ all: ['get-session'] }) })
  if (!response.ok) throw new Error(`AllAuth session check failed (${response.status})`)
  const data = await response.json()
  const identity = data?.user
  if (!data?.session || !identity || typeof identity.id !== 'string' || typeof identity.email !== 'string') return null
  // Only verified native identities may claim existing local user records.
  if (identity.emailVerified !== true) return null
  const email = identity.email.toLowerCase()
  const name = typeof identity.name === 'string' ? identity.name : null
  const existing = await db.user.findUnique({ where: { allauthId: identity.id } })
  let user
  if (existing) {
    user = await db.user.update({ where: { id: existing.id }, data: { email, name, emailVerified: true } })
  } else {
    user = await db.$transaction(async tx => {
      const legacy = await tx.user.findUnique({ where: { email } })
      if (legacy?.allauthId && legacy.allauthId !== identity.id) throw new Error('This email is linked to another identity')
      if (legacy) return tx.user.update({ where: { id: legacy.id }, data: { allauthId: identity.id, name, emailVerified: true } })
      return tx.user.create({ data: { allauthId: identity.id, email, name, emailVerified: true } })
    })
  }
  return { id: user.id, allauthId: identity.id, email: user.email, name: user.name, isAdmin: user.isAdmin }
})

export async function requireAuthUser() {
  const user = await getAuthUser()
  if (!user) redirect('/sign-in')
  return user
}

export async function validateRequest() {
  const user = await getAuthUser()
  return { user, session: user ? { id: user.allauthId } : null }
}
