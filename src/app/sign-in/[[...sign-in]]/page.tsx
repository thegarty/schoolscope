import AuthShell from '@/components/AuthShell'
import { SignIn } from '@allauth/react'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthPage() {
  if (await getAuthUser()) redirect('/dashboard')
  return <AuthShell title="Welcome back" description="Your school day, all together."><SignIn signUpUrl="/sign-up" forgotPasswordUrl="/forgot-password" /></AuthShell>
}
