import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export interface AuthUser {
  id: string
  clerkId: string
  email: string
  name: string | null
  isAdmin: boolean
}

function getPrimaryEmail(clerkUser: Awaited<ReturnType<typeof currentUser>>) {
  if (!clerkUser) return null

  const primary =
    clerkUser.emailAddresses.find(
      (emailAddress) => emailAddress.id === clerkUser.primaryEmailAddressId
    ) ?? clerkUser.emailAddresses[0]

  return primary?.emailAddress?.toLowerCase() ?? null
}

export async function getAuthUser(): Promise<AuthUser | null> {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return null
  }

  const { userId } = await auth()
  if (!userId) {
    return null
  }

  const clerkUser = await currentUser()
  const email = getPrimaryEmail(clerkUser)
  if (!email) {
    return null
  }

  const fallbackName = `${clerkUser?.firstName ?? ''} ${clerkUser?.lastName ?? ''}`.trim()
  const displayName = clerkUser?.fullName ?? (fallbackName || null)

  let dbUser = await db.user.findUnique({
    where: { clerkId: userId },
  })

  if (!dbUser) {
    const legacyUser = await db.user.findUnique({
      where: { email },
    })

    if (legacyUser) {
      dbUser = await db.user.update({
        where: { id: legacyUser.id },
        data: {
          clerkId: userId,
          name: displayName ?? legacyUser.name,
          email,
        },
      })
    } else {
      dbUser = await db.user.create({
        data: {
          clerkId: userId,
          email,
          name: displayName,
          password: null,
          emailVerified: true,
        },
      })
    }
  } else if (dbUser.email !== email || dbUser.name !== displayName) {
    dbUser = await db.user.update({
      where: { id: dbUser.id },
      data: {
        email,
        name: displayName,
      },
    })
  }

  return {
    id: dbUser.id,
    clerkId: userId,
    email: dbUser.email,
    name: dbUser.name,
    isAdmin: dbUser.isAdmin,
  }
}

export async function requireAuthUser() {
  const user = await getAuthUser()
  if (!user) {
    redirect('/sign-in')
  }
  return user
}

export async function validateRequest() {
  const user = await getAuthUser()
  return {
    user,
    session: user ? { id: user.clerkId } : null,
  }
}
