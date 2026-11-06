import {getAuthUser} from '@/lib/auth'
import {redirect} from 'next/navigation'
import {TutorAdmin} from '@/components/tutoring/TutorAdmin'
export default async function Page(){const user=await getAuthUser();if(!user?.isAdmin)redirect('/dashboard');return <TutorAdmin/>}
