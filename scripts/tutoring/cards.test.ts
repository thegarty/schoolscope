import {test} from 'node:test'
import assert from 'node:assert/strict'
import {lessonCards} from '../../src/lib/tutoring/cards'
const context={country:'AU' as const,state:'NSW' as const,year:4,lesson:'fractions' as const,label:'Fictional learner'}
test('the first card has a visual and tappable choices',()=>{const [card]=lessonCards(context,[]);assert.equal(card.id,'welcome');assert.equal(card.question?.options?.length,3);assert.ok(card.blocks.some(b=>b.kind==='fraction'))})
test('a new question becomes its own card and keeps prior question snapshots',()=>{
 const original={id:'q',kind:'question',title:'First',question:'What is half?',hint:'Equal parts',options:['1/2','1/4','1']}
 const updated={...original,question:'What is one quarter?',options:['1/2','1/4','1']}
 const events=[{id:'card-one',seq:1,type:'lesson',payload:{operations:[{type:'add',block:original}]}},{id:'card-two',seq:2,type:'lesson',payload:{operations:[{type:'update',block:updated}]}}]
 const cards=lessonCards(context,events);assert.equal(cards.length,3);assert.equal(cards[1].question?.question,'What is half?');assert.equal(cards[2].question?.question,'What is one quarter?');assert.ok(cards[2].blocks.some(b=>b.kind==='fraction'))
})
test('chat, focus updates and empty tool results never add blank cards',()=>{assert.equal(lessonCards(context,[{id:'s',seq:1,type:'speech',payload:{text:'hello'}},{id:'f',seq:2,type:'focus',payload:{cardId:'welcome'}},{id:'l',seq:3,type:'lesson',payload:{operations:[]}}]).length,1)})
