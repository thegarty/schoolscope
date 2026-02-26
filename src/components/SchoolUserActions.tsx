"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calendar, Users } from 'lucide-react'

interface SchoolUserActionsProps {
  schoolId: string
}

export function SchoolUserActions({ schoolId }: SchoolUserActionsProps) {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => setLoggedIn(r.ok))
      .catch(() => setLoggedIn(false))
  }, [])

  if (loggedIn === null) {
    return (
      <div className="space-y-2">
        <div className="h-9 w-full rounded-md bg-gray-100 animate-pulse" />
        <div className="h-9 w-full rounded-md bg-gray-100 animate-pulse" />
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-3">
          Login to add children and create events
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Login / Register</Link>
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button asChild className="w-full">
        <Link href={`/children/add?schoolId=${schoolId}`}>
          <Users className="h-4 w-4 mr-2" />
          Add Child to This School
        </Link>
      </Button>
      <Button asChild variant="outline" className="w-full">
        <Link href="/events/create">
          <Calendar className="h-4 w-4 mr-2" />
          Create Event
        </Link>
      </Button>
    </>
  )
}
