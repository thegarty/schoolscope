'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import {lessonCards} from '@/lib/tutoring/cards'
import type {LessonContext} from '@/lib/tutoring/contracts'
import type { TeachingBlock } from '@/lib/tutoring/contracts'

export function MathText({value}:{value:string}) {
 try{return <span dangerouslySetInnerHTML={{__html:katex.renderToString(value,{throwOnError:false,trust:false,strict:'error',maxExpand:100,maxSize:10,output:'html'})}}/>}catch{return <span>{value}</span>}
}
function Visual({block:b}:{block:TeachingBlock}) {
 switch(b.kind){
 case 'steps':return <ol className="tutor-steps">{b.steps.map((s,i)=><li key={i}><span>{i+1}</span><p>{s}</p></li>)}</ol>
 case 'equation':return <><div className="tutor-equation"><MathText value={b.expression}/></div><p className="tutor-muted">{b.explanation}</p></>
 case 'fraction':return <><div className="tutor-fraction-bar">{Array.from({length:b.denominator},(_,i)=><span key={i} className={i<b.numerator?'filled':''}/>)}</div><div className="tutor-fraction-caption"><span><b>{b.numerator}</b><i/><b>{b.denominator}</b></span><p>{b.numerator} of {b.denominator} equal parts</p></div></>
 case 'numberline':return <svg viewBox="0 0 600 130" role="img" aria-label={`${b.title}: ${b.points.join(', ')}`}><line x1="30" y1="65" x2="570" y2="65" stroke="#34475c" strokeWidth="3"/>{b.points.map((p,i)=>{const x=30+(p-b.min)/(b.max-b.min)*540;return <g key={i}><line x1={x} y1="54" x2={x} y2="76" stroke="#34475c" strokeWidth="2"/><circle cx={x} cy="65" r="6" fill="#6973d4"/><text x={x} y="108" textAnchor="middle" fill="#34475c" fontSize="18">{p}</text></g>})}</svg>
 case 'geometry':return <div className="tutor-geometry"><svg viewBox="0 0 400 210" role="img" aria-label={`${b.shape}, ${b.width} by ${b.height} ${b.unit}`}>
 {b.shape==='rectangle'?<rect x="90" y="45" width="220" height="120" rx="3" fill="#e8f2ed" stroke="#4b8c79" strokeWidth="3"/>:b.shape==='triangle'?<path d="M200 30 L320 175 L80 175 Z" fill="#e8f2ed" stroke="#4b8c79" strokeWidth="3"/>:<circle cx="200" cy="105" r="75" fill="#e8f2ed" stroke="#4b8c79" strokeWidth="3"/>}<text x="200" y="200" textAnchor="middle" fontSize="18" fill="#34475c">{b.width} {b.unit}</text><text x="350" y="110" textAnchor="middle" fontSize="18" fill="#34475c">{b.height} {b.unit}</text></svg></div>
 case 'question':return <><p className="tutor-question-text">{b.question}</p><details className="tutor-hint"><summary>A little hint</summary><p>{b.hint}</p></details></>
 case 'feedback':return <p className={`tutor-feedback ${b.correct?'positive':''}`}>{b.correct?'✓ ':''}{b.message}<small>Practice feedback · not a formal assessment</small></p>
 }
}
export function TeachingCanvas({blocks,context,events,readOnly,busy,onDraw,onNote,onAnswer,onFocus}:{blocks:TeachingBlock[];context:LessonContext;events:any[];readOnly:boolean;busy:boolean;onDraw:(points:[number,number][],colour:string,cardId:string)=>void;onNote:(blockId:string,text:string)=>void;onAnswer:(cardId:string,questionId:string,choice:string)=>void;onFocus:(cardId:string)=>void}) {
 const cards=useMemo(()=>lessonCards(context,events),[context,events])
 const [index,setIndex]=useState(0),[direction,setDirection]=useState('next'),[pen,setPen]=useState(false),[colour,setColour]=useState('ink'),[draft,setDraft]=useState<[number,number][]>([]),[noteOpen,setNoteOpen]=useState(false)
 const area=useRef<HTMLDivElement>(null),drawing=useRef(false),points=useRef<[number,number][]>([]),swipe=useRef<{x:number;y:number}|null>(null)
 const card=cards[Math.min(index,cards.length-1)]
 const lastId=cards[cards.length-1].id
 const focusCallback=useRef(onFocus);focusCallback.current=onFocus
 useEffect(()=>{setDirection('next');setIndex(cards.length-1)},[lastId])
 useEffect(()=>{if(!readOnly)focusCallback.current(card.id)},[card.id,readOnly])
 const latestFocus=events.filter(e=>e.type==='focus').slice(-1)[0]
 useEffect(()=>{if(readOnly&&latestFocus){const i=cards.findIndex(c=>c.id===latestFocus.payload.cardId);if(i>=0)setIndex(i)}},[latestFocus?.id,readOnly])
 const strokes=events.filter(e=>e.type==='draw'&&(e.payload.blockId===card.id||(!e.payload.blockId&&card.id==='welcome'))).slice(-100)
 const selected=events.filter(e=>e.type==='choice'&&e.payload.cardId===card.id).slice(-1)[0]?.payload.choice
 function move(next:number){if(next<0||next>=cards.length)return;setDirection(next>index?'next':'previous');setPen(false);setDraft([]);setIndex(next)}
 const position=(e:React.PointerEvent):[number,number]=>{const r=area.current!.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]}
 const finish=()=>{if(drawing.current){drawing.current=false;if(points.current.length>1)onDraw(points.current,colour,card.id);setDraft([])}}
 const visuals=card.blocks.filter(b=>b.kind!=='question'&&b.kind!=='feedback')
 const feedback=card.blocks.filter(b=>b.kind==='feedback')
 const question=card.question
 return <div className="tutor-canvas-shell tutor-card-deck" aria-label="Lesson cards" tabIndex={0} onKeyDown={e=>{if((e.target as HTMLElement).closest('input,textarea,select,button,summary'))return;if(e.key==='ArrowLeft'){e.preventDefault();move(index-1)}if(e.key==='ArrowRight'){e.preventDefault();move(index+1)}}}>
 <div className="tutor-canvas-tools"><span className="tutor-eyebrow">{index===cards.length-1?'CURRENT QUESTION':'LOOKING BACK'}</span><div>{!readOnly&&<><button onClick={()=>setNoteOpen(!noteOpen)} aria-expanded={noteOpen}>＋ Note</button><button aria-pressed={pen} onClick={()=>setPen(!pen)}>{pen?'✓ Done drawing':'✎ Draw'}</button><label className="sr-only" htmlFor="pen-colour">Pen colour</label><select id="pen-colour" value={colour} onChange={e=>setColour(e.target.value)}><option value="ink">Ink</option><option value="blue">Blue</option><option value="orange">Orange</option></select></>}<span className="tutor-saved"><i/> Saved</span></div></div>
 {noteOpen&&!readOnly&&<form className="tutor-card-note-editor" onSubmit={e=>{e.preventDefault();const text=String(new FormData(e.currentTarget).get('thought')||'').trim();if(text)onNote(question?.id||card.blocks[0].id,text);setNoteOpen(false)}}><input autoFocus name="thought" aria-label="Your thinking" placeholder="Add your thinking…" maxLength={400}/><button>Save</button><button type="button" aria-label="Cancel note" onClick={()=>setNoteOpen(false)}>×</button></form>}
 <div className={`tutor-canvas ${pen?'pen-active':''}`} ref={area} onTouchStart={e=>{if(pen||(e.target as Element).closest('button,input,textarea,select,summary'))return;swipe.current={x:e.touches[0].clientX,y:e.touches[0].clientY}}} onTouchEnd={e=>{if(!swipe.current)return;const dx=e.changedTouches[0].clientX-swipe.current.x,dy=e.changedTouches[0].clientY-swipe.current.y;swipe.current=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)move(index+(dx<0?1:-1))}}>
 <div className={`tutor-active-slide slide-${direction}`} key={card.id}>
 <div className="tutor-slide-visual">{visuals.map(b=><article className={`tutor-block kind-${b.kind}`} key={b.id}><div className="tutor-block-heading"><h3>{b.title}</h3><span>LET’S EXPLORE</span></div><Visual block={b}/></article>)}</div>
 {feedback.map(b=><article className="tutor-card-feedback" key={b.id}><Visual block={b}/></article>)}
 {question?<article className="tutor-block tutor-question-card" key={question.id}><div className="tutor-block-heading"><span className="tutor-eyebrow">YOUR TURN</span><h3>{question.title}</h3></div><p className="tutor-question-text">{question.question}</p>
 {question.options?.length?<div className={`tutor-choice-grid choices-${question.options.length}`} role="group" aria-label="Answer choices">{question.options.map((option,i)=><button key={option} disabled={readOnly||busy} aria-pressed={selected===option} className={selected===option?'chosen':''} onClick={()=>onAnswer(card.id,question.id,option)}><span className="tutor-choice-letter">{String.fromCharCode(65+i)}</span><span>{option}</span></button>)}</div>:<p className="tutor-answer-help">Say your answer or type it below.</p>}
 <div className="tutor-question-footer"><details className="tutor-hint"><summary>A little hint</summary><p>{question.hint}</p></details><span>{busy?'Checking your answer…':'Tap, type, or say your answer'}</span></div>
 </article>:<p className="tutor-muted">Ask Ripple a question to keep exploring.</p>}
 {events.filter(e=>e.type==='annotation'&&card.blocks.some(b=>b.id===e.payload.blockId)).slice(-1).map(e=><p className="tutor-note" key={e.id}>✎ {e.payload.text}</p>)}
 </div>
 <svg className="tutor-drawing" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{pointerEvents:pen&&!readOnly?'auto':'none',touchAction:pen?'none':'auto'}} onPointerDown={e=>{if(readOnly||!pen)return;e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;points.current=[position(e)];setDraft(points.current)}} onPointerMove={e=>{if(!drawing.current)return;if(points.current.length<400){points.current=[...points.current,position(e)];setDraft(points.current)}}} onPointerUp={finish} onPointerCancel={finish}>
 {strokes.map(e=><polyline key={e.id} points={e.payload.points.map((p:number[])=>`${p[0]*1000},${p[1]*1000}`).join(' ')} fill="none" stroke={{ink:'#334155',blue:'#6973d4',orange:'#d47c4f'}[e.payload.colour as 'ink']} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>)}<polyline points={draft.map(p=>`${p[0]*1000},${p[1]*1000}`).join(' ')} fill="none" stroke={{ink:'#334155',blue:'#6973d4',orange:'#d47c4f'}[colour as 'ink']} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
 </svg></div>
 <nav className="tutor-card-navigation" aria-label="Lesson card navigation"><button disabled={index===0} onClick={()=>move(index-1)} aria-label="Previous lesson card">‹ <span>Previous</span></button><div><span className="tutor-card-counter">{index+1} / {cards.length}</span><span className="tutor-card-dots">{cards.map((c,i)=><button key={c.id} className={i===index?'active':''} aria-label={`Go to lesson card ${i+1}`} aria-current={i===index?'step':undefined} onClick={()=>move(i)}/>)}</span></div><button disabled={index===cards.length-1} onClick={()=>move(index+1)} aria-label="Next lesson card"><span>Next</span> ›</button></nav>
 </div>
}
