import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { getAuthUser } from '@/lib/auth'
import { digest, sign, verify, signedPrincipal } from '@/lib/tutoring/security'
export const runtime='nodejs'
export const dynamic='force-dynamic'
async function handler(request:Request,{params}:{params:Promise<{path?:string[]}>}) {
 try{
  const origin=process.env.NEXT_PUBLIC_APP_URL!
  if(!['GET','HEAD'].includes(request.method)&&request.headers.get('origin')!==origin)return Response.json({error:'A same-origin request is required'},{status:403})
  const jar=await cookies();let visitor=verify(jar.get('ss_tutor_visitor')?.value||'');const fresh=!visitor;if(!visitor)visitor=randomUUID()
  const path=(await params).path||[]
  if(path[0]==='exit-child') {
   if(!['POST','GET'].includes(request.method))return new Response(null,{status:405})
   if(request.method==='GET'){const response=Response.redirect(`${origin}/sign-in`,303);response.headers.append('set-cookie','ss_child_mode=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');return response}
   const {allauthProxy}=await import('@/lib/allauth-server')
   const upstream=await allauthProxy()(new Request(`${origin}/api/allauth/sign-out`,{method:'POST',headers:{origin,'content-type':'application/json',cookie:request.headers.get('cookie')||''},body:'{}'}),{params:Promise.resolve({all:['sign-out']})})
   if(!upstream.ok)return Response.json({error:'Could not sign out. Try again.'},{status:502})
   const response=request.method==='GET'?Response.redirect(`${origin}/sign-in`,303):Response.json({signedOut:true});for(const cookie of upstream.headers.getSetCookie())response.headers.append('set-cookie',cookie);response.headers.append('set-cookie','ss_child_mode=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');return response
  }
  let childScope:any=null
  const rawScope=verify(jar.get('ss_child_mode')?.value||'')
  if(rawScope)try{childScope=JSON.parse(Buffer.from(rawScope,'base64url').toString());if(childScope.expires<Date.now())childScope=null}catch{}
  if(childScope&&request.method==='DELETE')return Response.json({error:'Ask a parent to manage saved lessons.'},{status:403})
  const user=childScope?null:await getAuthUser()
  const principal={parentId:childScope?.parentId||user?.id,visitorHash:digest(visitor),ipHash:digest(request.headers.get('x-forwarded-for')?.split(',')[0].trim()||'local'),isAdmin:user?.isAdmin??false}
  const url=new URL(request.url);const target=`/${path.join('/')}${url.search}`
  const headers=new Headers({'x-tutor-authorization':signedPrincipal(principal,request.method,target)});const contentType=request.headers.get('content-type');if(contentType)headers.set('content-type',contentType)
  if(request.headers.has('last-event-id'))headers.set('last-event-id',request.headers.get('last-event-id')!)
  if(Number(request.headers.get('content-length')||0)>11*1024*1024)return Response.json({error:'Choose a file smaller than 10 MB'},{status:413})
  let body:ArrayBuffer|undefined
  if(!['GET','HEAD'].includes(request.method)){const reader=request.body?.getReader();const chunks:Uint8Array<ArrayBuffer>[]=[];let size=0;if(reader)while(true){const next=await reader.read();if(next.done)break;size+=next.value.byteLength;if(size>11*1024*1024){await reader.cancel();return Response.json({error:'Request is too large'},{status:413})}chunks.push(next.value)}const combined=new Uint8Array(size);let offset=0;for(const chunk of chunks){combined.set(chunk,offset);offset+=chunk.byteLength}body=combined.buffer;if(body.byteLength>11*1024*1024)return Response.json({error:'Request is too large'},{status:413})}
  const upstream=await fetch(`${process.env.TUTOR_CONTROLLER_URL||'http://127.0.0.1:3001'}${target}`,{method:request.method,headers,body,cache:'no-store',signal:request.signal})
  const resultHeaders=new Headers(upstream.headers);resultHeaders.set('cache-control','no-store');resultHeaders.set('x-content-type-options','nosniff')
  if(fresh)resultHeaders.append('set-cookie',`ss_tutor_visitor=${sign(visitor)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=172800${origin.startsWith('https')?'; Secure':''}`)
  if(request.method==='POST'&&path.join('/')==='sessions'&&upstream.ok){
   const created=await upstream.clone().json()
   if(created.mode==='private'&&user){
    const {allauthProxy}=await import('@/lib/allauth-server')
    const out=await allauthProxy()(new Request(`${origin}/api/allauth/sign-out`,{method:'POST',headers:{origin,'content-type':'application/json',cookie:request.headers.get('cookie')||''},body:'{}'}),{params:Promise.resolve({all:['sign-out']})})
    if(!out.ok)return Response.json({error:'Could not enter child mode securely. Please try again.'},{status:502})
    for(const cookie of out.headers.getSetCookie())resultHeaders.append('set-cookie',cookie)
    const scope=sign(Buffer.from(JSON.stringify({id:created.id,parentId:user.id,expires:new Date(created.expiresAt).getTime()+60000})).toString('base64url'))
    resultHeaders.append('set-cookie',`ss_child_mode=${scope}; Path=/; HttpOnly; SameSite=Lax; Max-Age=660${origin.startsWith('https')?'; Secure':''}`)
   }
  }
  return new Response(upstream.body,{status:upstream.status,headers:resultHeaders})
 }catch{return Response.json({error:'Tutoring is temporarily unavailable. Please try again shortly.'},{status:503})}
}
export {handler as GET,handler as POST,handler as DELETE}
