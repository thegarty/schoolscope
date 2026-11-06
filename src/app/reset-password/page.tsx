import AuthShell from '@/components/AuthShell'
import { ResetPassword } from '@allauth/react'
export default function Page() { return <AuthShell title="A fresh start" description="Choose a new password for your account."><ResetPassword /></AuthShell> }
