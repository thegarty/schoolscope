import { SignIn } from '@allauth/react'
import { getAuthUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AuthPage() {
  if (await getAuthUser()) redirect('/dashboard')
  return <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4"><SignIn signUpUrl="/sign-up" forgotPasswordUrl="/forgot-password" /></div>
}
