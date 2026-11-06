import type {TeachingBlock,LessonContext} from './contracts'
import {starterBlocks} from './curriculum'
export type LessonCard={id:string;seq:number;blocks:TeachingBlock[];question:Extract<TeachingBlock,{kind:'question'}>|undefined}
/** Immutable lesson snapshots let reviewing an old card retain its original question. */
export function lessonCards(context:LessonContext,events:{id:string;seq:number;type:string;payload:any}[]):LessonCard[]{
 const initial=starterBlocks(context)
 const cards:LessonCard[]=[{id:'welcome',seq:0,blocks:initial,question:initial.find(b=>b.kind==='question') as LessonCard['question']}]
 for(const event of events){if(event.type!=='lesson')continue
  const changed:TeachingBlock[]=event.payload.operations?.filter((o:any)=>o.type==='add'||o.type==='update').map((o:any)=>o.block)||[]
  if(!changed.length)continue
  const previous=cards[cards.length-1]
  const question=changed.filter(b=>b.kind==='question').slice(-1)[0] as LessonCard['question']||previous.question
  const visual=changed.filter(b=>b.kind!=='question'&&b.kind!=='feedback').slice(-1)
  const fallback=previous.blocks.filter(b=>b.kind!=='question'&&b.kind!=='feedback').slice(-1)
  const feedback=changed.filter(b=>b.kind==='feedback').slice(-1)
  cards.push({id:event.id,seq:event.seq,blocks:[...(visual.length?visual:fallback),...feedback,...(question?[question]:[])],question})
 }
 return cards
}
