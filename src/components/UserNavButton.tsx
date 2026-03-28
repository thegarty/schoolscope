"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs'

export function UserNavButton() {
  const { userId } = useAuth()
  const isLoggedIn = Boolean(userId)

  return (
    <div className="flex items-center gap-2">
      {isLoggedIn ? (
        <>
        <Button asChild variant="outline">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        <UserButton />
        </>
      ) : (
        <>
          <SignInButton mode="modal">
            <Button variant="outline" type="button">Login</Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button type="button">Sign Up</Button>
          </SignUpButton>
        </>
      )}
    </div>
  )
}
