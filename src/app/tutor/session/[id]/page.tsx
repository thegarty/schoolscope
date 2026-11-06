import {TutorSession} from '@/components/tutoring/TutorApp'
export default async function Page({params}:{params:Promise<{id:string}>}){return <TutorSession id={(await params).id}/>}
