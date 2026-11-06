import {NextRequest,NextResponse} from 'next/server'
import {verify} from '@/lib/tutoring/security'
export function proxy(request:NextRequest){
 if(request.nextUrl.pathname==='/api/tutoring/exit-child')return NextResponse.next()
 const scoped=request.cookies.get('ss_child_mode')?.value;if(!scoped)return NextResponse.next()
 let scope:any;try{const raw=verify(scoped);scope=raw?JSON.parse(Buffer.from(raw,'base64url').toString()):null}catch{}
 if(!scope||scope.expires<Date.now())return NextResponse.redirect(new URL('/api/tutoring/exit-child',request.url))
 const p=request.nextUrl.pathname
 if(p===`/tutor/session/${scope.id}`||p.startsWith(`/api/tutoring/sessions/${scope.id}/`)||p===`/api/tutoring/sessions/${scope.id}`||p==='/api/tutoring/exit-child'||p==='/api/allauth/sdk/config'||p==='/api/allauth/get-session')return NextResponse.next()
 if(p.startsWith('/api/'))return NextResponse.json({error:'This device is in child mode. Ask a parent to sign in again.'},{status:403})
 return NextResponse.redirect(new URL(`/tutor/session/${scope.id}`,request.url))
}
export const config={matcher:['/((?!_next|[^?]*\\.(?:html?|css|js|mjs|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|pdf)).*)']}
