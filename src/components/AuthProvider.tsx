'use client'
import { AllAuthProvider } from '@allauth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AllAuthProvider basePath="/api/allauth" signInUrl="/sign-in" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard" branding={{ name: 'SchoolScope' }}>{children}</AllAuthProvider>
}
