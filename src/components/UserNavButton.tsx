'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserButton, useAllAuth } from '@allauth/react'

export function UserNavButton() {
  const { client } = useAllAuth()
  const session = client.useSession()
  return <div className="flex items-center gap-2">
    {session.data?.user ? <><Button asChild variant="outline"><Link href="/dashboard">Dashboard</Link></Button><UserButton variant="avatar" managementMode="modal" /></> : <><Button asChild variant="outline"><Link href="/sign-in">Login</Link></Button><Button asChild><Link href="/sign-up">Sign Up</Link></Button></>}
  </div>
}
