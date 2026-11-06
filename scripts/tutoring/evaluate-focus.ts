import 'dotenv/config'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {tutorDb as db} from '../../src/lib/tutoring/database'
import {teach} from '../../src/lib/tutoring/backend'
import {event,json} from '../../src/lib/tutoring/service'
import {starterBlocks} from '../../src/lib/tutoring/curriculum'
if(!process.env.DATABASE_URL?.includes('/schoolscope_tutor_tests'))throw new Error('Use the isolated test database')
process.env.TUTOR_PUBLIC_ENABLED='true'
async function main(){const context={country:'AU' as const,state:'NSW' as const,year:4,lesson:'fractions' as const,label:'Fictional learner'};const later={id:'later-question',kind:'question',title:'Equivalent fractions',question:'Which fraction equals one half?',hint:'Equal parts',options:['2/3','2/4','3/4']};const s=await db.tutoringSession.create({data:{mode:'demo',context,workspace:json([...starterBlocks(context),later]),expiresAt:new Date(Date.now()+86400000),retainedUntil:new Date(Date.now()+86400000)}})
 try{const laterEvent=await event(s.id,'lesson',{narration:'Which fraction equals one half?',operations:[{type:'add',block:later}],workspace:[...starterBlocks(context),later]});await event(s.id,'focus',{cardId:'welcome'});const typed:any=await teach(s.id,randomUUID(),0,'B');assert.ok(typed.operations.some((o:any)=>o.type!=='highlight'&&o.block.kind==='feedback'&&o.block.correct===false),'B means whole bar on the visible original card');console.log('PASS: typed B refers to the visible older question')
 await event(s.id,'focus',{cardId:laterEvent.id});await event(s.id,'speech',{role:'user',text:'B',startMs:0,endMs:500});const row=await db.tutoringSession.findUniqueOrThrow({where:{id:s.id}});const spoken=await teach(s.id,randomUUID(),row.revision);assert.ok((spoken as any).operations.some((o:any)=>o.block?.kind==='feedback'&&o.block.correct===true),'Spoken B means 2/4 on the visible later card');console.log('PASS: spoken B refers to the visible later question')
 }finally{await db.tutoringSession.delete({where:{id:s.id}})}}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect())
