'use client'
import Link from 'next/link'
import {useEffect,useLayoutEffect,useRef,useState} from 'react'
import {useRouter} from 'next/navigation'
import {ArrowRight,BookOpen,Check,ChevronDown,FileText,Headphones,Lightbulb,MessageCircle,Mic,MicOff,Ruler,ShieldCheck,Sparkles,Volume2,X} from 'lucide-react'
import {SchoolScopeBrand} from '@/components/SchoolScopeBrand'
import {LESSONS,STATES} from '@/lib/tutoring/curriculum'
import type {LessonContext} from '@/lib/tutoring/contracts'
import {TeachingCanvas} from './TeachingCanvas'
import {Worksheet} from './Worksheet'
export async function tutorApi(path:string,body?:unknown,method?:string) {
 const response=await fetch(`/api/tutoring/${path}`,{method:method||(body?'POST':'GET'),...(body instanceof FormData?{body}:{headers:{'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})})
 const data=await response.json();if(!response.ok)throw new Error(data.error||'Something went wrong');return data
}
export function TutorBrand(){return <SchoolScopeBrand href="/tutor/demo" subtitle="A little help. A lot of discovery."/>}
async function proof(token:string){const encoder=new TextEncoder();for(let nonce=0;nonce<3_000_000;nonce++){const hash=new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(`${token}:${nonce}`)));if(hash[0]===0&&hash[1]===0)return String(nonce);if(nonce%512===0)await new Promise(r=>setTimeout(r,0))}throw new Error('Browser verification timed out. Please try again.')}
export function TutorSetup({childId}:{childId?:string}) {
 const router=useRouter(),[lesson,setLesson]=useState<keyof typeof LESSONS>('fractions'),[year,setYear]=useState(4),[state,setState]=useState('NSW'),[adult,setAdult]=useState(false),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[child,setChild]=useState<any>(null)
 useEffect(()=>{if(childId)void tutorApi(`children/${childId}`).then(c=>{setChild(c);setYear(c.year);setState(c.state)}).catch(e=>setError(e.message))},[childId])
 async function start(){setBusy(true);setError('');try{const setup=await tutorApi('bootstrap');const nonce=await proof(setup.challenge);const s=await tutorApi('sessions',{context:{country:'AU',state,year,lesson,label:childId?'Learner':'Alex, a fictional learner'},...(childId?{childId}:{}),adultConfirmed:adult,consent,challenge:setup.challenge,nonce});router.push(`/tutor/session/${s.id}`)}catch(e:any){setError(e.message);setBusy(false)}}
 return (
  <div className="tutor-app tutor-setup">
   <header className="tutor-topbar">
    <TutorBrand/>
    <nav aria-label="Tutor navigation"><Link href="/">Home</Link><Link href="/tutor/history">My lessons</Link><Link href="/dashboard">For parents</Link></nav>
    <span className="tutor-preview-badge">Adult preview</span>
   </header>
   <main className="tutor-setup-main" id="main-content">
    <div className="tutor-intro">
     <span className="tutor-kicker"><Lightbulb size={18}/> YOUR LITTLE LEARNING COMPANION</span>
     <h1>Big questions.<br/><em>Little lightbulbs.</em></h1>
     <p>Meet Ripple, your patient AI maths tutor. Try an idea, ask a question, and work it out together.</p>
     <div className="tutor-intro-features"><span><MessageCircle size={18}/> Talk or type</span><span><BookOpen size={18}/> See how it works</span><span><Sparkles size={18}/> Go at your pace</span></div>
     <div className="tutor-welcome-note"><span className="tutor-welcome-icon"><Lightbulb size={28}/></span><div><b>“I don’t get it” is a great place to start.</b><p>No rush. No silly questions. Just one little step at a time.</p></div></div>
     <p className="tutor-intro-footnote">Maths for Australian Years 3–6. This preview is for adults to explore with a fictional learner.</p>
    </div>
    <section className="tutor-start-card" aria-labelledby="lesson-setup-title">
     <div className="tutor-start-heading"><span className="tutor-small-icon"><BookOpen size={24}/></span><div><h2 id="lesson-setup-title">{childId?'Your next discovery':'What shall we explore?'}</h2><p>{child?`${child.name} · ${child.school}`:'Pick a topic to try with Ripple.'}</p></div></div>
     {childId&&!child?.enabled&&<div className="tutor-gate"><ShieldCheck size={22}/><p>Child sessions aren’t enabled in this preview. An adult can explore using our fictional learner.<Link href="/tutor/demo">Try the adult demo <ArrowRight size={16}/></Link></p></div>}
     <div className="tutor-lesson-choices" role="group" aria-label="Choose a maths topic">
      {Object.entries(LESSONS).map(([id,l],i)=><button key={id} type="button" aria-pressed={lesson===id} className={lesson===id?'selected':''} onClick={()=>setLesson(id as keyof typeof LESSONS)}><span className={`lesson-symbol lesson-${id}`}>{i===2?<Ruler size={25}/>:['½','×'][i]}</span><span><b>{l.short}</b><small>{['Discover parts of a whole','Find patterns in numbers','Explore lengths and shapes'][i]}</small></span><span className="lesson-radio" aria-hidden="true">{lesson===id&&<Check size={15}/>}</span></button>)}
     </div>
     <div className="tutor-two-fields"><label>Year level<select value={year} onChange={e=>setYear(+e.target.value)}>{[3,4,5,6].map(y=><option key={y} value={y}>Year {y}</option>)}</select></label><label>State or territory<select value={state} onChange={e=>setState(e.target.value)}>{Object.keys(STATES).map(s=><option key={s} value={s}>{s}</option>)}</select></label></div>
     <fieldset className="tutor-adult-check"><legend><ShieldCheck size={17}/> A quick check for grown-ups</legend><label className="tutor-consent"><input type="checkbox" checked={adult} onChange={e=>setAdult(e.target.checked)}/><span>I’m an adult trying this demonstration. I won’t submit a child’s voice or personal information.</span></label><label className="tutor-consent"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/><span>I agree to AI processing of my demo input and saving the transcript and worksheet for up to 24 hours. No audio recording is saved.</span></label></fieldset>
     {error&&<p role="alert" className="tutor-error">{error}</p>}
     <button className="tutor-primary tutor-start-button" disabled={!adult||!consent||busy||!!childId&&!child?.enabled} onClick={()=>void start()}>{busy?'Getting Ripple ready…':'Let’s learn together'}<ArrowRight size={20}/></button>
     <p className="tutor-card-footnote">{!adult||!consent?'Tick both boxes above to start.':'You’re ready to explore.'} No microphone needed.</p>
    </section>
   </main>
   <footer className="tutor-setup-footer"><span>AI can make mistakes. Keep asking questions.</span><Link href="/privacy">Privacy</Link></footer>
  </div>
 )
}

function Transcript({events}:{events:any[]}) {
 const scroll=useRef<HTMLDivElement>(null),following=useRef(true);const [away,setAway]=useState(false)
 const last=events[events.length-1]
 useEffect(()=>{const el=scroll.current;if(!el)return;const observer=new ResizeObserver(()=>{if(following.current)el.scrollTop=el.scrollHeight});observer.observe(el);return()=>observer.disconnect()},[])
 useLayoutEffect(()=>{if(following.current&&scroll.current)scroll.current.scrollTop=scroll.current.scrollHeight},[last?.id,last?.payload?.text])
 const grouped:{role:string;text:string}[]=[]
 for(const e of events){let role='',text='';if(e.type==='user'){role='user';text=e.payload.text}else if(e.type==='lesson'&&!e.payload.delegationId){role='assistant';text=e.payload.narration}else if(e.type==='assistant'){role='assistant';text=e.payload.text}else if(e.type==='speech'){role=e.payload.role;text=e.payload.text}if(!text)continue;const previous=grouped[grouped.length-1];if(e.type==='speech'&&previous?.role===role)previous.text+=text;else grouped.push({role,text})}
 return <div className="tutor-transcript-wrap"><div ref={scroll} className="tutor-transcript" onScroll={()=>{const el=scroll.current!;following.current=el.scrollHeight-el.scrollTop-el.clientHeight<65;setAway(!following.current)}}>{grouped.length?grouped.map((t,i)=><div className={`tutor-chat ${t.role}`} key={i}><b>{t.role==='user'?'You':'Ripple'}</b><p>{t.text}</p></div>):<div className="tutor-empty-chat"><Lightbulb size={28}/><p>Every question is welcome.</p><small>Start by talking, typing, or uploading your work.</small></div>}</div>{away&&<button className="tutor-latest-words" onClick={()=>{following.current=true;setAway(false);scroll.current?.scrollTo({top:scroll.current.scrollHeight,behavior:'smooth'})}}>Latest words ↓</button>}</div>
}
export function TutorSession({id}:{id:string}) {
 const [session,setSession]=useState<any>(null),[events,setEvents]=useState<any[]>([]),[error,setError]=useState(''),[text,setText]=useState(''),[busy,setBusy]=useState(false),[voice,setVoice]=useState<'off'|'connecting'|'on'>('off'),[muted,setMuted]=useState(false),[seconds,setSeconds]=useState(600),[readOnly,setReadOnly]=useState(false),[panel,setPanel]=useState<'conversation'|'summary'>('conversation'),[playBlocked,setPlayBlocked]=useState(false),[chatOpen,setChatOpen]=useState(false),[worksheetOpen,setWorksheetOpen]=useState(false)
 const peer=useRef<RTCPeerConnection|null>(null),media=useRef<MediaStream|null>(null),audio=useRef<HTMLAudioElement|null>(null),source=useRef<EventSource|null>(null),cursor=useRef(0),latest=useRef<any>(null)
 const focusQueue=useRef<Promise<unknown>>(Promise.resolve())
 useEffect(()=>{if(!window.matchMedia('(max-width: 960px)').matches)return;window.scrollTo({top:0});if(chatOpen)document.getElementById('tutor-question')?.focus({preventScroll:true})},[chatOpen,worksheetOpen])
 useEffect(()=>{setReadOnly(new URLSearchParams(location.search).get('observe')==='1');let disposed=false
  const load=async()=>{try{const s=await tutorApi(`sessions/${id}`);if(!disposed){setSession(s);latest.current=s}}catch(e:any){setError(e.message)}}
  function subscribe(){if(disposed)return;const es=new EventSource(`/api/tutoring/sessions/${id}/events?after=${cursor.current}`);source.current=es;es.onmessage=e=>{const v=JSON.parse(e.data);cursor.current=Math.max(cursor.current,v.seq);setEvents(old=>old.some(x=>x.id===v.id)?old:[...old,v]);if(v.type==='lesson'){setSession((old:any)=>{if(!old||v.payload.revision<old.revision)return old;const next={...old,workspace:v.payload.workspace,revision:v.payload.revision};latest.current=next;return next})}if(['attachment','ended','summary'].includes(v.type))void load()};es.onerror=()=>{es.close();if(!disposed)setTimeout(subscribe,1500)}}void load().then(subscribe)
  return()=>{disposed=true;source.current?.close();peer.current?.close();media.current?.getTracks().forEach(t=>t.stop());audio.current?.pause()}
 },[id])
 useEffect(()=>{latest.current=session;if(session?.status!=='active'){peer.current?.close();media.current?.getTracks().forEach(t=>t.stop());setVoice('off')}},[session])
 useEffect(()=>{if((readOnly&&voice==='off')||session?.status!=='active')return;const beat=()=>void tutorApi(`sessions/${id}/heartbeat`,{}).catch(()=>{});beat();const timer=setInterval(beat,15000);return()=>clearInterval(timer)},[id,readOnly,voice,session?.status])
 useEffect(()=>{const timer=setInterval(()=>{if(session)setSeconds(Math.max(0,Math.ceil((new Date(session.expiresAt).getTime()-Date.now())/1000)))},1000);return()=>clearInterval(timer)},[session])
 async function refresh(){const s=await tutorApi(`sessions/${id}`);setSession(s);latest.current=s}
 async function action(path:string,body:unknown){setError('');try{return await tutorApi(`sessions/${id}/${path}`,body)}catch(e:any){setError(e.message);throw e}}
 async function send(){if(!text.trim()||busy)return;setBusy(true);setError('');try{await focusQueue.current;await action('message',{text,operationId:crypto.randomUUID(),revision:latest.current.revision});setText('');await refresh()}catch{await refresh().catch(()=>{})}finally{setBusy(false)}}
 function focusCard(cardId:string){focusQueue.current=focusQueue.current.catch(()=>{}).then(async()=>{try{const result=await action('focus',{cardId});setSession((old:any)=>{const next={...old,revision:Math.max(old.revision,result.revision)};latest.current=next;return next})}catch{}})}
 async function answer(cardId:string,questionId:string,choice:string){if(busy)return;setBusy(true);setError('');try{await focusQueue.current;await action('answer',{cardId,questionId,choice,revision:latest.current.revision,operationId:crypto.randomUUID()});await refresh()}catch{await refresh().catch(()=>{})}finally{setBusy(false)}}
 async function stop(){setBusy(true);try{await action('stop',{});await refresh()}catch{}finally{setBusy(false)}}
 async function startVoice(){setVoice('connecting');setError('');try{const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});media.current=stream;const pc=new RTCPeerConnection();peer.current=pc;const speaker=new Audio();speaker.autoplay=true;audio.current=speaker;pc.ontrack=e=>{speaker.srcObject=e.streams[0]||new MediaStream([e.track]);void speaker.play().catch(()=>setPlayBlocked(true))};for(const track of stream.getTracks())pc.addTrack(track,stream);let markStarted:()=>void=()=>{};const started=new Promise<void>(resolve=>{markStarted=resolve});const channel=pc.createDataChannel('oai-events');channel.onmessage=e=>{const event=JSON.parse(e.data);if(event.type==='session.started')markStarted();if(event.type==='session.closed'){setVoice('off');pc.close();stream.getTracks().forEach(t=>t.stop());void refresh()}if(event.type==='error')setError('Voice encountered a problem. You can keep typing.')};const offer=await pc.createOffer();await pc.setLocalDescription(offer);if(pc.iceGatheringState!=='complete')await new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Network connection setup timed out. Please try again.')),10000);const listener=()=>{if(pc.iceGatheringState==='complete'){clearTimeout(timer);pc.removeEventListener('icegatheringstatechange',listener);resolve()}};pc.addEventListener('icegatheringstatechange',listener)});const response=await action('connect',{sdp:pc.localDescription!.sdp});await pc.setRemoteDescription({type:'answer',sdp:response.sdp});pc.onconnectionstatechange=()=>{if(pc.connectionState==='failed'){setError('Voice disconnected. You can still review your lesson.');setVoice('off');stream.getTracks().forEach(t=>t.stop());void action('stop',{}).catch(()=>{})}};await Promise.race([started,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Voice did not start. Please start a new lesson.')),15000))]);setVoice('on')}catch(e:any){peer.current?.close();media.current?.getTracks().forEach(t=>t.stop());setVoice('off');setError(e.name==='NotAllowedError'?'Microphone access was declined. You can type your question below.':e.message||'Voice could not connect. You can keep typing.');if(e.name!=='NotAllowedError'&&e.name!=='NotFoundError')void action('stop',{}).catch(()=>{})}}
 function toggleMute(){const value=!muted;setMuted(value);media.current?.getAudioTracks().forEach(t=>t.enabled=!value)}
 if(!session)return <div className="tutor-app tutor-loading"><TutorBrand/><p>{error||'Getting your workspace ready…'}</p><Link href="/tutor/demo">Back to the demo</Link></div>
 const ended=session.status!=='active',context=session.context as LessonContext,highlights=events.filter(e=>e.type==='lesson').flatMap(e=>e.payload.operations.filter((o:any)=>o.type==='highlight').map((o:any)=>o.region))
 return (
  <div className={`tutor-app tutor-session ${worksheetOpen?'worksheet-open':''} ${chatOpen?'conversation-open':''}`}>
   <header className="tutor-topbar">
    <TutorBrand/>
    <div className="tutor-session-title"><span>{LESSONS[context.lesson].short}</span><span>Year {context.year}</span></div>
    <div className="tutor-session-top-actions">
     <span className="tutor-time">{ended?'Lesson saved':session.limitsEnabled?`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')} left`:'At your pace'}</span>
     <details className="tutor-session-details"><summary>Lesson info <ChevronDown size={16}/></summary><div>
      <p>{context.state}, Australia · {session.mode==='demo'?'Adult demo · fictional learner':'Parent-started lesson'}</p>
      <Link aria-disabled={voice==='connecting'} className="tutor-observe" href={`/tutor/session/${id}?observe=${readOnly?'0':'1'}`} onClick={e=>{if(voice==='connecting'){e.preventDefault();return}if(!readOnly&&voice==='on'){media.current?.getAudioTracks().forEach(t=>t.enabled=false);setMuted(true)}setReadOnly(!readOnly)}}>{readOnly?'Back to learning':'Parent view'}</Link>
      <Link href="/tutor/history">Lesson history</Link>
      <p className="tutor-curriculum">{session.curriculum.name}<a href={session.curriculum.url} target="_blank" rel="noreferrer">Curriculum information</a><small>Version {session.curriculum.version} · broad year-band guidance</small></p>
      {session.mode==='private'&&<button className="tutor-end" onClick={async()=>{await tutorApi('exit-child',{});location.href='/sign-in'}}>Exit to parent sign-in</button>}
     </div></details>
     {!ended&&<button className="tutor-end" disabled={busy} onClick={()=>void stop()}>Finish</button>}
    </div>
   </header>
   {readOnly&&<div className="tutor-observer-banner"><ShieldCheck size={18}/> Parent view: watch the lesson and conversation. You can finish the lesson at any time.</div>}
   <div className="tutor-context-strip"><span><span className="tutor-avatar"><Lightbulb size={18}/></span>{context.label}</span><span>{session.mode==='demo'?'Adult preview':'Your learning space'}</span></div>
   <main className="tutor-workspace-layout" id="main-content">
    <aside className="tutor-left" aria-label="Worksheet">
     <div className="tutor-mobile-panel-heading"><h1>My worksheet</h1><button aria-label="Back to lesson" onClick={()=>setWorksheetOpen(false)}><X size={22}/></button></div>
     <Worksheet sessionId={id} attachments={session.attachments} lesson={context.lesson} highlights={highlights} readOnly={readOnly||ended} onUpload={async file=>{const form=new FormData();form.set('file',file);await action('uploads',form);await refresh()}}/>
     <div className="tutor-kind-reminder"><Lightbulb size={21}/><p>You don’t need to know the answer yet. Let’s figure it out together.</p></div>
    </aside>
    <section className="tutor-middle" aria-label="Your lesson">
     <div className="tutor-workspace-heading"><div><span className="tutor-eyebrow">ONE LITTLE STEP AT A TIME</span><h1>{LESSONS[context.lesson].title}</h1></div><span className="tutor-topic-pill" aria-hidden="true">{context.lesson==='fractions'?'½':context.lesson==='multiplication'?'×':<Ruler size={25}/>}</span></div>
     <TeachingCanvas blocks={session.workspace} context={context} events={events} readOnly={readOnly||ended} busy={busy} onFocus={focusCard} onAnswer={(cardId,questionId,choice)=>void answer(cardId,questionId,choice)} onDraw={(points,colour,cardId)=>void action('draw',{points,colour,blockId:cardId,operationId:crypto.randomUUID()}).catch(()=>{})} onNote={(blockId,text)=>void action('edit',{blockId,text,operationId:crypto.randomUUID()}).catch(()=>{})}/>
     <p className="tutor-lesson-reassurance"><Sparkles size={16}/>{ended?'Revisit your work or read your lesson notes.':readOnly?'Follow along with the lesson and conversation.':voice==='on'?(muted?'Microphone paused. Tap Unmute when you’re ready.':'Ripple is listening. You can say your answer.'):'Need a hand? Ask Ripple a question, any time.'}</p>
     {error&&!chatOpen&&<p className="tutor-error" role="alert">{error}</p>}
     {ended&&<div className="tutor-end-card"><Check size={24}/><div><h3>Look how far you’ve come.</h3><p>Your lesson and notes are saved.{session.mode==='demo'?' Demo content is deleted within 24 hours.':''}</p><Link href="/tutor/demo">Try another lesson <ArrowRight size={18}/></Link></div></div>}
    </section>
    <aside className="tutor-right" aria-label="Ask Ripple">
     <div className="tutor-mobile-panel-heading"><h1>Ask Ripple</h1><button aria-label="Back to lesson" onClick={()=>setChatOpen(false)}><X size={22}/></button></div>
     <div className="tutor-voice-card">
      <div className={`tutor-ripple ${voice==='on'&&!muted?'speaking':''}`} aria-hidden="true"><Headphones size={30}/></div>
      <div><h2>Meet Ripple <span>AI TUTOR</span></h2><p>{voice==='on'?(muted?'Microphone paused. Take your time.':'I’m listening. Take your time.'):voice==='connecting'?'Connecting your voice…':'Your questions are always welcome.'}</p></div>
      {!readOnly&&!ended&&<><button className={`tutor-voice-button ${voice==='on'?'connected':''}`} onClick={()=>voice==='on'?toggleMute():void startVoice()} disabled={voice==='connecting'}>{voice==='on'?(muted?<MicOff size={20}/>:<Mic size={20}/>):<Headphones size={20}/>} {voice==='on'?(muted?'Unmute microphone':'Pause microphone'):voice==='connecting'?'Connecting…':'Talk with Ripple'}</button><small>Or type below. It’s up to you.</small></>}
      {playBlocked&&<button className="tutor-audio-enable" onClick={()=>{void audio.current?.play();setPlayBlocked(false)}}><Volume2 size={18}/> Turn on sound</button>}
     </div>
     <div className="tutor-conversation-tabs" role="group" aria-label="Conversation view"><button aria-pressed={panel==='conversation'} className={panel==='conversation'?'active':''} onClick={()=>setPanel('conversation')}>Our chat</button><button aria-pressed={panel==='summary'} className={panel==='summary'?'active':''} onClick={()=>setPanel('summary')}>Lesson notes</button></div>
     {panel==='conversation'?<Transcript events={events}/>:<div className="tutor-summary">{session.summary?<><h3>What we explored</h3><p>{session.summary.overview}</p>{[['Topics',session.summary.topics],['Still practising',session.summary.difficulties],['A good next step',session.summary.nextSteps]].map(([title,items])=><section key={String(title)}><b>{String(title)}</b><ul>{(items as string[]).map((item,i)=><li key={i}>{item}</li>)}</ul></section>)}</>:<p>Your lesson notes will be here when we finish. You can read our chat any time.</p>}</div>}
     {error&&<p className="tutor-error" role="alert">{error}</p>}
     {!readOnly&&!ended&&<form className="tutor-composer" onSubmit={e=>{e.preventDefault();void send()}}><label htmlFor="tutor-question" className="sr-only">Your question</label><textarea id="tutor-question" value={text} onChange={e=>setText(e.target.value)} maxLength={2000} placeholder="Ask me anything about this…" rows={2} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void send()}}}/><button aria-label="Send question" disabled={busy||!text.trim()}><ArrowRight size={21}/></button><small role="status">{busy?'Ripple is thinking…':'Type a question or tell me your answer.'}</small></form>}
     <div className="tutor-ai-note"><ShieldCheck size={16}/><span>AI can make mistakes. Let’s check ideas together.</span></div>
    </aside>
   </main>
   <nav className="tutor-mobile-actions" aria-label="Lesson tools">
    <button aria-current={!chatOpen&&!worksheetOpen?'page':undefined} onClick={()=>{setChatOpen(false);setWorksheetOpen(false)}}><BookOpen size={22}/><span>Learn</span></button>
    {!readOnly&&!ended&&<button className={voice==='on'&&!muted?'voice-active':''} aria-label={voice==='on'?(muted?'Unmute Ripple microphone':'Pause Ripple microphone'):'Talk with Ripple'} aria-pressed={voice==='on'&&!muted} disabled={voice==='connecting'} onClick={()=>voice==='on'?toggleMute():void startVoice()}>{muted?<MicOff size={22}/>:<Mic size={22}/>}<span>{voice==='connecting'?'Connecting':voice==='on'?(muted?'Unmute':'Pause mic'):'Talk'}</span></button>}
    <button aria-current={chatOpen?'page':undefined} onClick={()=>{setChatOpen(true);setWorksheetOpen(false)}}><MessageCircle size={22}/><span>{readOnly||ended?'Chat':'Type'}</span></button>
    <button aria-current={worksheetOpen?'page':undefined} onClick={()=>{setWorksheetOpen(true);setChatOpen(false)}}><FileText size={22}/><span>My work</span></button>
   </nav>
  </div>
 )
}

export function TutorHistory(){const [sessions,setSessions]=useState<any[]>([]),[error,setError]=useState('');useEffect(()=>{void tutorApi('sessions').then(setSessions).catch(e=>setError(e.message))},[]);return <div className="tutor-app"><header className="tutor-topbar"><TutorBrand/><Link href="/dashboard">Parent dashboard</Link></header><main className="tutor-history"><span className="tutor-eyebrow">A LITTLE PROGRESS, SAVED</span><h1>Lesson history</h1><p>Your private lessons are visible only to their parent account. Public demo lessons belong to this browser.</p>{error&&<p className="tutor-error">{error}</p>}{sessions.length?sessions.map(s=><article className="tutor-history-card" key={s.id}><div><h2>{LESSONS[s.context.lesson as keyof typeof LESSONS].title}</h2><p>Year {s.context.year} · {s.context.state} · {new Date(s.createdAt).toLocaleString('en-AU')}</p><small>{s.status==='active'?'In progress':'Saved'} · {s.mode==='demo'?'Adult demo':'Private lesson'}</small></div><Link className="tutor-primary" href={`/tutor/session/${s.id}?observe=1`}>Review lesson</Link>{s.status!=='active'&&<button onClick={async()=>{try{await tutorApi(`sessions/${s.id}`,undefined,'DELETE');setSessions(ss=>ss.filter(x=>x.id!==s.id))}catch(e:any){setError(e.message)}}}>Delete</button>}</article>):<div className="tutor-empty-history"><BookOpen size={32}/><p>Your first little lightbulb is waiting.</p><Link className="tutor-primary" href="/tutor/demo">Try a lesson</Link></div>}</main></div>}
