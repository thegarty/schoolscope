"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function UserNavButton() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => setLoggedIn(r.ok))
      .catch(() => setLoggedIn(false))
  }, [])

  if (loggedIn === null) {
    return <div className="h-9 w-24 rounded-md bg-gray-100 animate-pulse" />
  }

  return (
    <Button asChild variant="outline">
      <Link href={loggedIn ? '/dashboard' : '/login'}>
        {loggedIn ? 'Dashboard' : 'Login'}
      </Link>
    </Button>
  )
}
