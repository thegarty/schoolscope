import 'dotenv/config'
import assert from 'node:assert/strict'
import {test,after,before} from 'node:test'
import {createHash,randomUUID} from 'node:crypto'
import sharp from 'sharp'
import {PDFDocument} from 'pdf-lib'
import {tutorDb as db} from '../../src/lib/tutoring/database'
import {challenge,createSession,owned,deleteSession,attach,event} from '../../src/lib/tutoring/service'
import {sydneyDay,type Principal} from '../../src/lib/tutoring/contracts'
if(!process.env.DATABASE_URL?.includes('/schoolscope_tutor_tests'))throw new Error('Use the isolated schoolscope_tutor_tests database')
process.env.TUTOR_PUBLIC_ENABLED='true';process.env.TUTOR_CHILD_ENABLED='false';process.env.TUTOR_INTERNAL_SECRET='integration-tests-secret-at-least-32-chars'
const principal=():Principal=>({visitorHash:randomUUID(),ipHash:randomUUID(),isAdmin:false})
const p=principal();let id:string
function input(p:Principal){const token=challenge(p);let n=0;while(!createHash('sha256').update(`${token}:${n}`).digest('hex').startsWith('0000'))n++;return {context:{country:'AU',state:'NSW',year:4,lesson:'fractions',label:'Fictional learner'},adultConfirmed:true,consent:true,challenge:token,nonce:String(n)}}
async function clear(){await db.tutoringReservation.deleteMany();await db.tutoringSession.deleteMany();await db.tutoringControl.deleteMany()}
before(clear);after(async()=>{await clear();await db.$disconnect()})
test('creates an owned demo; another visitor and forged parent cannot access it',async()=>{id=(await createSession(p,input(p))).id;assert.equal((await owned(id,p)).mode,'demo');await assert.rejects(owned(id,principal()));await assert.rejects(owned(id,{...principal(),parentId:'pretend-parent'}))})
test('a browser check is single use and consent is mandatory',async()=>{const q=principal(),data=input(q);await assert.rejects(createSession(q,{...data,adultConfirmed:false}));await createSession(q,data);await assert.rejects(createSession(q,data))})
test('event replay is idempotent and ordering remains unique under concurrent writes',async()=>{const op=randomUUID();await Promise.all(Array.from({length:6},()=>event(id,'draw',{points:[[0,0],[1,1]]},op)));assert.equal(await db.tutoringEvent.count({where:{sessionId:id,operationId:op}}),1);const es=await db.tutoringEvent.findMany({where:{sessionId:id},orderBy:{seq:'asc'}});assert.equal(new Set(es.map(e=>e.seq)).size,es.length)})
test('uploads strip image metadata; PDF and file quotas are enforced',async()=>{
 const source=await sharp({create:{width:60,height:60,channels:3,background:'white'}}).jpeg().withMetadata({orientation:6}).toBuffer()
 const photo=await attach(id,p,new File([new Uint8Array(source)],'homework.jpg',{type:'image/jpeg'}));assert.equal(photo.mime,'image/jpeg')
 const pdf=await PDFDocument.create();for(let i=0;i<6;i++)pdf.addPage();const data=await pdf.save();await assert.rejects(attach(id,p,new File([Uint8Array.from(data)],'too-many.pdf',{type:'application/pdf'})))
 const pdf5=await PDFDocument.create();for(let i=0;i<5;i++)pdf5.addPage();await attach(id,p,new File([Uint8Array.from(await pdf5.save())],'five.pdf',{type:'application/pdf'}))
 const pdf1=await PDFDocument.create();pdf1.addPage();await assert.rejects(attach(id,p,new File([Uint8Array.from(await pdf1.save())],'one-more.pdf',{type:'application/pdf'})))
 await assert.rejects(attach(id,p,new File(['<script>x</script>'],'bad.html',{type:'text/html'})))
 await assert.rejects(attach(id,p,new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'],'spoof.jpg',{type:'image/jpeg'})))
 await attach(id,p,new File([new Uint8Array(source)],'third.jpg',{type:'image/jpeg'}));await assert.rejects(attach(id,p,new File([new Uint8Array(source)],'fourth.jpg',{type:'image/jpeg'})))
 const {attachment}=await import('../../src/lib/tutoring/service');const saved=await attachment(id,p,photo.id);assert.equal((await sharp(saved.bytes).metadata()).exif,undefined)
 await assert.rejects(attachment(id,principal(),photo.id))
})
test('deleting a lesson preserves its spend ledger and daily trial counter',async()=>{
 await db.tutoringSession.update({where:{id},data:{status:'ended'}});await deleteSession(id,p);const reservations=await db.tutoringReservation.findMany({where:{sessionId:null}});assert.equal(reservations.length,1)
 const next=await createSession(p,input(p));await db.tutoringSession.update({where:{id:next.id},data:{status:'ended'}});await deleteSession(next.id,p);await assert.rejects(createSession(p,input(p)))
})
test('concurrent admissions cannot exceed the three-session cap',async()=>{
 await clear();const ps=Array.from({length:6},principal);const inputs=ps.map(input);const results=await Promise.allSettled(ps.map((q,i)=>createSession(q,inputs[i])));assert.equal(results.filter(r=>r.status==='fulfilled').length,3)
})
test('private ownership and retention expiry reject unrelated parents',async()=>{
 await clear();const owner={...principal(),parentId:'owning-parent'}
 const privateLesson=await db.tutoringSession.create({data:{parentId:owner.parentId,childId:'child-fixture',mode:'private',context:{country:'AU',state:'NSW',year:4,lesson:'fractions'},expiresAt:new Date(Date.now()+60000),retainedUntil:new Date(Date.now()+86400000)}})
 assert.equal((await owned(privateLesson.id,owner)).parentId,owner.parentId)
 await assert.rejects(owned(privateLesson.id,{...principal(),parentId:'another-parent'}))
 await assert.rejects(owned(privateLesson.id,principal()))
 await db.tutoringSession.update({where:{id:privateLesson.id},data:{retainedUntil:new Date(Date.now()-1000)}})
 await assert.rejects(owned(privateLesson.id,owner))
})
test('expired sessions cannot accept actions',async()=>{
 const {active}=await import('../../src/lib/tutoring/service')
 const q=principal();const s=await db.tutoringSession.create({data:{visitorHash:q.visitorHash,mode:'demo',context:{country:'AU',state:'NSW',year:4,lesson:'fractions'},expiresAt:new Date(Date.now()-1000),retainedUntil:new Date(Date.now()+86400000)}})
 await assert.rejects(active(s.id,q))
})
test('atomic reservations enforce the daily budget; kill switch rejects admission',async()=>{
 await clear();await db.tutoringReservation.create({data:{day:sydneyDay(),reservedMicros:25_000_000}});const q=principal();await assert.rejects(createSession(q,input(q)));await clear();await db.tutoringControl.create({data:{id:'global',disabled:true}});await assert.rejects(createSession(q,input(q)))
})
