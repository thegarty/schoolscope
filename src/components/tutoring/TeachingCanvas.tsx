'use client'
import { useEffect, useRef, useState } from 'react'
import katex from 'katex'
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
export function TeachingCanvas({blocks,events,readOnly,onDraw,onNote}:{blocks:TeachingBlock[];events:any[];readOnly:boolean;onDraw:(points:[number,number][],colour:string)=>void;onNote:(blockId:string,text:string)=>void}) {
 const [pen,setPen]=useState(false),[colour,setColour]=useState('ink'),[draft,setDraft]=useState<[number,number][]>([])
 const area=useRef<HTMLDivElement>(null), drawing=useRef(false),points=useRef<[number,number][]>([])
 const strokes=events.filter(e=>e.type==='draw').slice(-150)
 const position=(e:React.PointerEvent):[number,number]=>{const r=area.current!.getBoundingClientRect();return [Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))]}
 const finish=()=>{if(drawing.current){drawing.current=false;if(points.current.length>1)onDraw(points.current,colour);setDraft([])}}
 return <div className="tutor-canvas-shell"><div className="tutor-canvas-tools"><span className="tutor-eyebrow">OUR WORKSPACE</span><div>{!readOnly&&<><button aria-pressed={pen} onClick={()=>setPen(!pen)}>{pen?'✓ Drawing on':'✎ Draw'}</button><label className="sr-only" htmlFor="pen-colour">Pen colour</label><select id="pen-colour" value={colour} onChange={e=>setColour(e.target.value)}><option value="ink">Ink</option><option value="blue">Blue</option><option value="orange">Orange</option></select></>}<span className="tutor-saved"><i/> Saved as we go</span></div></div>
 <div className={`tutor-canvas ${pen?'pen-active':''}`} ref={area}>
 <div className="tutor-block-grid">{blocks.map((b,i)=><article className={`tutor-block kind-${b.kind}`} key={b.id}><div className="tutor-block-heading"><span className="tutor-block-number">{String(i+1).padStart(2,'0')}</span><h3>{b.title}</h3><span>{b.kind==='question'?'YOUR TURN':b.kind==='feedback'?'FEEDBACK':'LET’S EXPLORE'}</span></div><Visual block={b}/>{events.filter(e=>e.type==='annotation'&&e.payload.blockId===b.id).map(e=><p className="tutor-note" key={e.id}>✎ {e.payload.text}</p>)}{!readOnly&&<form className="tutor-note-form" onSubmit={e=>{e.preventDefault();const form=e.currentTarget;const text=(new FormData(form).get('note') as string).trim();if(text)onNote(b.id,text);form.reset()}}><input name="note" aria-label={`Add a note to ${b.title}`} placeholder="Add your thinking…" maxLength={400}/><button title="Save note" aria-label="Save note">+</button></form>}</article>)}</div>
 <svg className="tutor-drawing" viewBox="0 0 1000 1000" preserveAspectRatio="none" style={{pointerEvents:pen&&!readOnly?'auto':'none',touchAction:pen?'none':'auto'}} onPointerDown={e=>{if(readOnly||!pen)return;e.currentTarget.setPointerCapture(e.pointerId);drawing.current=true;points.current=[position(e)];setDraft(points.current)}} onPointerMove={e=>{if(!drawing.current)return;if(points.current.length<400){points.current=[...points.current,position(e)];setDraft(points.current)}}} onPointerUp={finish} onPointerCancel={finish}>
 {strokes.map(e=><polyline key={e.id} points={e.payload.points.map((p:number[])=>`${p[0]*1000},${p[1]*1000}`).join(' ')} fill="none" stroke={{ink:'#334155',blue:'#6973d4',orange:'#d47c4f'}[e.payload.colour as 'ink']} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>)}<polyline points={draft.map(p=>`${p[0]*1000},${p[1]*1000}`).join(' ')} fill="none" stroke={{ink:'#334155',blue:'#6973d4',orange:'#d47c4f'}[colour as 'ink']} strokeWidth="2" vectorEffect="non-scaling-stroke"/>
 </svg></div><p className="tutor-canvas-footer">A place to try things. Mistakes are part of learning.</p></div>
}
