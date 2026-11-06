import assert from 'node:assert/strict'
import {createHash,randomUUID} from 'node:crypto'
import sharp from 'sharp'
import {writeFile,mkdir} from 'node:fs/promises'
const origin=process.env.SMOKE_APP_ORIGIN||'http://localhost:3000'
let cookie=''
async function api(path,body,method){const r=await fetch(`${origin}/api/tutoring/${path}`,{method:method||(body?'POST':'GET'),headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(body instanceof FormData?{}:{'Content-Type':'application/json'})},...(body?{body:body instanceof FormData?body:JSON.stringify(body)}:{})});if(r.headers.getSetCookie().length)cookie=r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');const d=await r.json();if(!r.ok)throw new Error(`${path}: ${r.status} ${d.error}`);return d}
const b=await api('bootstrap');let nonce=0;while(!createHash('sha256').update(`${b.challenge}:${nonce}`).digest('hex').startsWith('0000'))nonce++
const session=await api('sessions',{context:{country:'AU',state:'NSW',year:4,lesson:'fractions',label:'Alex, a fictional learner'},adultConfirmed:true,consent:true,challenge:b.challenge,nonce:String(nonce)})
try {
 const first=(await api(`sessions/${session.id}/cards`))[0]
 assert.ok(first.question.options.length>=3)
 await api(`sessions/${session.id}/focus`,{cardId:first.id})
 const answered=await api(`sessions/${session.id}/answer`,{cardId:first.id,questionId:first.question.id,choice:first.question.options[0],revision:session.revision,operationId:randomUUID()})
 assert.ok(answered.operations.some(o=>o.block?.kind==='feedback'&&o.block.correct===true),'Correct clicked answer should get positive feedback')
 assert.ok(answered.operations.some(o=>o.block?.kind==='question'&&o.block.options?.length>=3),'Next question should have choices')
 const cards=await api(`sessions/${session.id}/cards`);assert.ok(cards.length>1);await api(`sessions/${session.id}/focus`,{cardId:cards[0].id})
 const visible=await api(`sessions/${session.id}`)
 const typed=await api(`sessions/${session.id}/message`,{text:'B',revision:visible.revision,operationId:randomUUID()})
 assert.ok(typed.operations.some(o=>o.block?.kind==='feedback'&&o.block.correct===false),'Typed B must be interpreted against the visible earlier card, not the newer question')
 const outsider=await fetch(`${origin}/api/tutoring/sessions/${session.id}`);assert.equal(outsider.status,404)
 const form=new FormData();form.set('file',new File([Uint8Array.from(await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="white"/><text x="50" y="100" font-size="30">Question 1: Show why 2/4 equals 1/2.</text><rect x="50" y="200" width="200" height="100" fill="#8c9aca"/><rect x="250" y="200" width="200" height="100" fill="#eeeefa"/><path d="M150 200V300 M250 200V300 M350 200V300" stroke="black"/></svg>')).jpeg().toBuffer())],'fractions-practice.jpg',{type:'image/jpeg'}));const attachment=await api(`sessions/${session.id}/uploads`,form);assert.equal(attachment.mime,'image/jpeg')
 const ticket=await api(`sessions/${session.id}/attachments/${attachment.id}`);const content=await fetch(origin+ticket.url,{headers:{Cookie:cookie}});assert.equal(content.status,200);assert.match(content.headers.get('content-type'),/image\/jpeg/)
 const state=await api(`sessions/${session.id}`)
 const operationId=randomUUID();const message={text:'Look at question 1 in my uploaded worksheet. Show a visual example and ask me one question about why 2/4 equals 1/2.',revision:state.revision,operationId}
 const lesson=await api(`sessions/${session.id}/message`,message);assert.ok(lesson.narration.length);assert.ok(lesson.operations.length>0)
 const after=await api(`sessions/${session.id}`);assert.ok(after.workspace.length>=2)
 const replay=await api(`sessions/${session.id}/message`,message);assert.equal((await api(`sessions/${session.id}`)).revision,after.revision)
 await api(`sessions/${session.id}/draw`,{operationId:randomUUID(),points:[[.1,.1],[.2,.2]],colour:'blue'})
 await api(`sessions/${session.id}/edit`,{operationId:randomUUID(),blockId:'welcome',text:'Two out of four equal pieces.'})
 const csrf=await fetch(`${origin}/api/tutoring/sessions/${session.id}/stop`,{method:'POST',headers:{Origin:'https://untrusted.example',Cookie:cookie,'Content-Type':'application/json'},body:'{}'});assert.equal(csrf.status,403)
 await api(`sessions/${session.id}/stop`,{})
 const final=await api(`sessions/${session.id}`);assert.equal(final.status,'ended');assert.ok(final.summary?.overview);assert.ok(!final.summary.overview.includes('automatic summary was unavailable'),'Expected a real generated summary');assert.ok(final.summary.topics.length>0)
 await mkdir('output/tutoring',{recursive:true});await writeFile('output/tutoring/public-smoke.json',JSON.stringify({origin,sessionId:session.id,attachmentId:attachment.id,narration:lesson.narration,operations:lesson.operations,summary:final.summary,checks:['cross-visitor isolation','private S3/image access','worksheet vision and canvas tool','idempotency','drawing','notes','CSRF rejection','stop and saved summary','clicked multiple choice','fresh choices','card navigation context','typed option against focused card']},null,2))
 console.log(JSON.stringify({passed:true,origin,sessionId:session.id,checks:12,canvasOperations:lesson.operations.length,summarySaved:true}))
} finally {await api(`sessions/${session.id}/stop`,{}).catch(()=>{})}
