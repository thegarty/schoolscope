import AuthShell from '@/components/AuthShell'
import { ForgotPassword } from '@allauth/react'
export default function Page() { return <AuthShell title="Let’s get you back in" description="We’ll help you reset your password."><ForgotPassword /></AuthShell> }
