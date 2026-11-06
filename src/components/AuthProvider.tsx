'use client'
import Image from 'next/image'
import { AllAuthProvider } from '@allauth/react'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <AllAuthProvider basePath="/api/allauth" signInUrl="/sign-in" afterSignInUrl="/dashboard" afterSignUpUrl="/dashboard" branding={{ name: 'SchoolScope', logo: <Image src="/brand/ripple-mark.png" alt="" width={40} height={56} style={{ objectFit: 'contain' }} /> }}>{children}</AllAuthProvider>
}
