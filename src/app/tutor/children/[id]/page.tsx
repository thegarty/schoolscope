import {TutorSetup} from '@/components/tutoring/TutorApp'
import {requireAuthUser} from '@/lib/auth'
export default async function Page({params}:{params:Promise<{id:string}>}){await requireAuthUser();return <TutorSetup childId={(await params).id}/>}
