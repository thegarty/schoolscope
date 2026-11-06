import { createHmac, timingSafeEqual } from 'node:crypto'
import { TutorError } from './contracts'
export function secret() { const key=process.env.TUTOR_INTERNAL_SECRET; if(!key || key.length<32) throw new Error('Tutoring service secret is not configured'); return key }
export function digest(value:string) { return createHmac('sha256',secret()).update(value).digest('hex') }
export function sign(value:string) { return `${value}.${digest(value)}` }
export function verify(signed:string) { const split=signed.lastIndexOf('.'); if(split<1) return null; const value=signed.slice(0,split), mac=signed.slice(split+1), expected=digest(value); return /^[a-f0-9]{64}$/.test(mac) && timingSafeEqual(Buffer.from(mac),Buffer.from(expected))?value:null }
export function signedPrincipal(principal:unknown,method:string,path:string) { return sign(Buffer.from(JSON.stringify({principal,method,path,time:Date.now()})).toString('base64url')) }
export function readPrincipal(header:string,method:string,path:string) {
 const value=verify(header); if(!value) throw new TutorError(401,'Invalid service authorization')
 const parsed=JSON.parse(Buffer.from(value,'base64url').toString())
 if(parsed.method!==method || parsed.path!==path || Math.abs(Date.now()-parsed.time)>30000) throw new TutorError(401,'Expired service authorization')
 return parsed.principal
}
