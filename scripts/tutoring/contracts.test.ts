import assert from 'node:assert/strict'
import {test} from 'node:test'
import {Block,Highlight,Draw,LessonStep,sydneyDay,applyOperations} from '../../src/lib/tutoring/contracts'
import {sign,verify,signedPrincipal,readPrincipal} from '../../src/lib/tutoring/security'
process.env.TUTOR_INTERNAL_SECRET='test-secret-with-more-than-thirty-two-characters'
test('Sydney budget day crosses midnight independently of UTC',()=>{assert.equal(sydneyDay(new Date('2026-11-05T12:59:59Z')),'2026-11-05');assert.equal(sydneyDay(new Date('2026-11-05T13:00:00Z')),'2026-11-06')})
test('rejects invalid fractions, number lines and out-of-page highlights',()=>{
 assert.equal(Block.safeParse({id:'a',kind:'fraction',title:'bad',numerator:5,denominator:4}).success,false)
 assert.equal(Block.safeParse({id:'b',kind:'numberline',title:'bad',min:4,max:1,points:[]}).success,false)
 assert.equal(Highlight.safeParse({attachmentId:'x',page:1,x:.8,y:.1,width:.5,height:.3}).success,false)
 assert.equal(Draw.safeParse({operationId:crypto.randomUUID(),points:[[0,0],[2,2]],colour:'ink'}).success,false)
})
test('tool schema cannot introduce executable block types; content stays plain text',()=>{
 assert.equal(Block.safeParse({id:'x',kind:'html',title:'x',html:'<script>alert(1)</script>'}).success,false)
 assert.equal(LessonStep.safeParse({narration:'hello',operations:[{type:'execute',code:'delete database'}],needsReview:false}).success,false)
 const b=Block.parse({id:'x',kind:'question',title:'<script>x</script>',question:'<img onerror=alert(1)>',hint:'plain'})
 assert.equal(b.kind,'question')
})
test('replayed add operations replace the same block rather than duplicating it',()=>{
 const b=Block.parse({id:'x',kind:'fraction',title:'half',numerator:1,denominator:2})
 assert.equal(applyOperations([b],[{type:'add',block:b}]).length,1)
 assert.throws(()=>applyOperations([],[{type:'update',block:b}]))
})
test('service authorization binds method and exact path, with tamper rejection',()=>{
 const value=sign('hello');assert.equal(verify(value),'hello');assert.equal(verify(value+'x'),null);assert.equal(verify('hello.'+'é'.repeat(64)),null)
 const p={visitorHash:'visitor',ipHash:'ip',isAdmin:false};const auth=signedPrincipal(p,'GET','/sessions/a')
 assert.deepEqual(readPrincipal(auth,'GET','/sessions/a'),p)
 assert.throws(()=>readPrincipal(auth,'DELETE','/sessions/a'));assert.throws(()=>readPrincipal(auth,'GET','/sessions/b'))
})

test('multiple-choice questions reject duplicate choices and preserve old free-response questions',()=>{
 const base={id:'q',kind:'question',title:'Try it',question:'Which amount is half?',hint:'Think about equal parts.'}
 assert.equal(Block.safeParse({...base,options:['One half','One half']}).success,false)
 assert.equal(Block.safeParse({...base,options:['One half','One quarter','One whole']}).success,true)
 assert.equal(Block.safeParse(base).success,true)
})

test('spoken and typed option labels bind deterministically to the visible choices',async()=>{
 const {resolveChoice}=await import('../../src/lib/tutoring/contracts')
 const options=['Exactly half is shaded','The whole bar is shaded','Nothing is shaded']
 for(const value of ['B','b.','I choose B','Option 2','the second one','bee'])assert.equal(resolveChoice(value,options),1)
 assert.equal(resolveChoice('Exactly half is shaded',options),0)
 assert.equal(resolveChoice('Can you explain this?',options),null)
 assert.equal(resolveChoice('D',options),null)
})
