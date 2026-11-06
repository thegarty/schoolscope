import AuthShell from '@/components/AuthShell'
import { SignUp } from '@allauth/react'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthPage() {
  if (await getAuthUser()) redirect('/dashboard')
  return <AuthShell title="A little discovery starts here" description="Join your Australian school community."><SignUp signInUrl="/sign-in" /></AuthShell>
}
