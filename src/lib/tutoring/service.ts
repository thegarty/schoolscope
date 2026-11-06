import { randomUUID, createHash } from 'node:crypto'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import { z } from 'zod'
import { tutorDb as db } from './database'
import { Context, LIMITS, TutorError, sydneyDay, type Principal, type TeachingBlock, type LessonContext } from './contracts'
import { curriculum, starterBlocks } from './curriculum'
import { digest, sign, verify } from './security'
import { putObject, getObject, deleteObject } from './storage'
import type { Prisma } from '../../generated/prisma/client'
export const json=(value:unknown)=>JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
export async function enabled() {
 if(process.env.TUTOR_PUBLIC_ENABLED!=='true' || (await db.tutoringControl.findUnique({where:{id:'global'}}))?.disabled) throw new TutorError(503,'Live tutoring is paused. Please try again later.')
}
export async function owned(id:string,p:Principal) {
 const s=await db.tutoringSession.findUnique({where:{id},include:{attachments:true}})
 if(!s || (s.mode==='private'?s.parentId!==p.parentId:s.visitorHash!==p.visitorHash) || s.retainedUntil<new Date()) throw new TutorError(404,'Lesson not found')
 return s
}
export async function active(id:string,p?:Principal) {
 const s=p?await owned(id,p):await db.tutoringSession.findUniqueOrThrow({where:{id},include:{attachments:true}})
 if(s.status!=='active' || s.expiresAt<new Date()) throw new TutorError(409,'This lesson has ended')
 await enabled(); return s
}
export async function event(id:string,type:string,payload:unknown,operationId:string=randomUUID()) {
 return db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`
  const existing=await tx.tutoringEvent.findUnique({where:{sessionId_operationId:{sessionId:id,operationId}}}); if(existing)return existing
  const s=await tx.tutoringSession.update({where:{id},data:{sequence:{increment:1}}})
  return tx.tutoringEvent.create({data:{sessionId:id,seq:s.sequence,type,payload:json(payload),operationId}})
 })
}
export function challenge(p:Principal) {return sign(Buffer.from(JSON.stringify({visitor:p.visitorHash,expires:Date.now()+120000,id:randomUUID()})).toString('base64url'))}
export function checkChallenge(p:Principal,token:string,nonce:string) {
 const raw=verify(token); if(!raw)throw new TutorError(403,'Please repeat the browser check')
 const c=JSON.parse(Buffer.from(raw,'base64url').toString())
 if(c.visitor!==p.visitorHash || c.expires<Date.now() || !/^[0-9]{1,10}$/.test(nonce) || !createHash('sha256').update(`${token}:${nonce}`).digest('hex').startsWith('0000'))throw new TutorError(403,'Please repeat the browser check')
 return c.id as string
}
const Create=z.object({context:Context,adultConfirmed:z.literal(true),childId:z.string().max(80).optional(),consent:z.literal(true),challenge:z.string().max(1000),nonce:z.string().max(10)})
export async function createSession(p:Principal,input:unknown) {
 const data=Create.parse(input);await enabled(); const challengeId=checkChallenge(p,data.challenge,data.nonce)
 let c=data.context
 if(data.childId) {
  if(!p.parentId)throw new TutorError(401,'Sign in as a parent')
  const child=await db.child.findFirst({where:{id:data.childId,userId:p.parentId},include:{school:true}})
  if(!child)throw new TutorError(404,'Child not found')
  if(process.env.TUTOR_CHILD_ENABLED!=='true' || process.env.TUTOR_RETENTION_VERIFIED!=='true')throw new TutorError(403,'Real child sessions are not enabled yet. Try the adult demonstration with a fictional learner.')
  // Parent-approved corrections in data.context take precedence over the displayed school defaults.
  c={...data.context,label:'Learner'}
 }
 const day=sydneyDay();const now=new Date()
 const s=await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(71403892)`
  if((await tx.tutoringControl.findUnique({where:{id:`challenge:${challengeId}`}})))throw new TutorError(409,'This browser check has already been used')
  const reservations=await tx.tutoringReservation.findMany({where:{day},select:{reservedMicros:true,settledMicros:true}})
  if(reservations.reduce((sum,r)=>sum+(r.settledMicros??r.reservedMicros),0)+LIMITS.reservationMicros>LIMITS.dailyMicros)throw new TutorError(429,'Today’s demo budget has been reached. Come back tomorrow.')
  if(!data.childId) {
   const visitorTrials=await tx.tutoringControl.count({where:{id:{startsWith:`trial:${day}:v:${p.visitorHash}:`}}})
   const ipTrials=await tx.tutoringControl.count({where:{id:{startsWith:`trial:${day}:ip:${p.ipHash}:`}}})
   if(visitorTrials>=2 || ipTrials>=6)throw new TutorError(429,'You’ve used today’s demo sessions. Come back tomorrow.')
   if(await tx.tutoringSession.count({where:{mode:'demo',status:'active',expiresAt:{gt:now},lastHeartbeat:{gt:new Date(Date.now()-60000)}}})>=3)throw new TutorError(429,'Three lessons are running right now. Try again shortly.')
  }
  if(!data.childId) {
   await tx.tutoringControl.create({data:{id:`trial:${day}:v:${p.visitorHash}:${challengeId}`}})
   await tx.tutoringControl.create({data:{id:`trial:${day}:ip:${p.ipHash}:${challengeId}`}})
  }
  await tx.tutoringControl.create({data:{id:`challenge:${challengeId}`}})
  return tx.tutoringSession.create({data:{parentId:data.childId?p.parentId:null,childId:data.childId??null,visitorHash:p.visitorHash,ipHash:p.ipHash,mode:data.childId?'private':'demo',context:json(c),workspace:json(starterBlocks(c)),expiresAt:new Date(Date.now()+600000),retainedUntil:new Date(Date.now()+(data.childId?30:1)*86400000),reservation:{create:{day,reservedMicros:1000000}}}})
 })
 await event(s.id,'notice',{text:'AI tutor demonstration. Adult participant confirmed. Parents can review private lessons; no audio is recorded.'})
 return publicSession(s)
}
export function publicSession(s:{[key:string]:any}) {
 const {id,status,context,workspace,revision,createdAt,expiresAt,summary,sequence,attachments,mode,voiceSeconds}=s
 return {id,status,context,workspace,revision,createdAt,expiresAt,summary,sequence,mode,voiceSeconds,curriculum:curriculum(Context.parse(context)),attachments:attachments?.map(({id,name,mime,pages}:any)=>({id,name,mime,pages}))??[]}
}
export async function events(id:string,p:Principal,after:number) {await owned(id,p);return db.tutoringEvent.findMany({where:{sessionId:id,seq:{gt:after}},orderBy:{seq:'asc'},take:200})}
export async function history(p:Principal) {return (await db.tutoringSession.findMany({where:{retainedUntil:{gt:new Date()},OR:[{mode:'demo',visitorHash:p.visitorHash},...(p.parentId?[{mode:'private',parentId:p.parentId}]:[])]},orderBy:{createdAt:'desc'},take:50})).map(publicSession)}
export async function attach(id:string,p:Principal,file:File) {
 await active(id,p)
 if(file.size>LIMITS.fileBytes || file.size<1)throw new TutorError(413,'Choose a file smaller than 10 MB')
 let bytes=Buffer.from(await file.arrayBuffer());let mime='image/jpeg';let pages=0
 if(file.type==='application/pdf') {
  try {const pdf=await PDFDocument.load(bytes,{ignoreEncryption:false});pages=pdf.getPageCount();if(pages>5)throw new Error(); // Rebuild pages, dropping document metadata and catalog-level active content.
   const clean=await PDFDocument.create();for(const page of await clean.copyPages(pdf,pdf.getPageIndices())){page.node.delete((await import('pdf-lib')).PDFName.of('Annots'));clean.addPage(page)}bytes=Buffer.from(await clean.save())
  }catch{throw new TutorError(422,'Use an unencrypted PDF with at most five pages')}
  mime='application/pdf'
 } else {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new TutorError(415,'Choose a JPEG, PNG, WebP image or PDF')
  const jpeg=bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff;const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));const webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';if(!jpeg&&!png&&!webp)throw new TutorError(422,'The file is not a supported photo format')
  try {bytes=await sharp(bytes,{limitInputPixels:25_000_000,animated:false}).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).flatten({background:'#fff'}).jpeg({quality:85}).toBuffer()}catch{throw new TutorError(422,'That photo could not be opened')}
 }
 const key=`${randomUUID()}.${pages?'pdf':'jpg'}`;await putObject(key,bytes,mime)
 try {return await db.$transaction(async tx=>{
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`
  const s=await tx.tutoringSession.findUniqueOrThrow({where:{id}});if(s.status!=='active'||s.expiresAt<new Date())throw new TutorError(409,'This lesson has ended')
  const files=await tx.tutoringAttachment.findMany({where:{sessionId:id}})
  if(files.length>=3 || files.reduce((n,f)=>n+f.pages,0)+pages>5)throw new TutorError(422,'A lesson can contain three files and five PDF pages in total')
  const a=await tx.tutoringAttachment.create({data:{sessionId:id,key,name:file.name.replace(/[^a-zA-Z0-9 ._-]/g,'').slice(0,100)||'Worksheet',mime,size:bytes.length,pages}})
  await tx.tutoringSession.update({where:{id},data:{revision:{increment:1},sequence:{increment:1}}})
  await tx.tutoringEvent.create({data:{sessionId:id,seq:s.sequence+1,operationId:randomUUID(),type:'attachment',payload:json({id:a.id,name:a.name,mime,pages})}})
  return {id:a.id,name:a.name,mime:a.mime,pages:a.pages}
 })}catch(e){await deleteObject(key);throw e}
}
export async function attachment(id:string,p:Principal,attachmentId:string) {const s=await owned(id,p);const a=s.attachments.find(a=>a.id===attachmentId);if(!a)throw new TutorError(404,'Worksheet not found');return {file:a,bytes:await getObject(a.key)}}
export async function deleteSession(id:string,p:Principal) {
 const s=await owned(id,p);if(s.status==='active')throw new TutorError(409,'Stop the lesson before deleting it')
 for(const a of s.attachments)await deleteObject(a.key)
 // Keep only a spend ledger, with no link to the deleted session or identity.
 await db.$transaction(async tx=>{await tx.tutoringSession.delete({where:{id}})})
}
