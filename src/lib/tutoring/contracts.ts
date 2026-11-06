import { z } from 'zod'

export const Context = z.object({ country: z.literal('AU').default('AU'), state: z.enum(['NSW','VIC','QLD','WA','SA','TAS','ACT','NT']), year: z.number().int().min(3).max(6), lesson: z.enum(['fractions','multiplication','measurement']), label: z.string().max(80).default('Alex, a fictional learner') })
export type LessonContext = z.infer<typeof Context>
const base = { id: z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/), title: z.string().max(120) }
export const Block = z.discriminatedUnion('kind', [
  z.object({ ...base, kind: z.literal('steps'), steps: z.array(z.string().max(400)).max(8) }),
  z.object({ ...base, kind: z.literal('equation'), expression: z.string().max(300), explanation: z.string().max(500) }),
  z.object({ ...base, kind: z.literal('fraction'), numerator: z.number().int().min(0).max(24), denominator: z.number().int().min(1).max(24) }).refine(b=>b.numerator<=b.denominator,'Use a proper fraction'),
  z.object({ ...base, kind: z.literal('numberline'), min: z.number().min(-1000), max: z.number().max(1000), points: z.array(z.number()).max(15) }).refine(b=>b.max>b.min && b.points.every(p=>p>=b.min && p<=b.max),'Invalid number line'),
  z.object({ ...base, kind: z.literal('geometry'), shape: z.enum(['rectangle','triangle','circle']), width: z.number().min(1).max(20), height: z.number().min(1).max(20), unit: z.enum(['cm','m','units']) }),
  z.object({ ...base, kind: z.literal('question'), question: z.string().max(600), hint: z.string().max(400) }),
  z.object({ ...base, kind: z.literal('feedback'), message: z.string().max(500), correct: z.boolean() }),
])
export type TeachingBlock = z.infer<typeof Block>
export const Highlight = z.object({ attachmentId: z.string().max(80), page: z.number().int().min(1).max(5), x: z.number().min(0).max(1), y: z.number().min(0).max(1), width: z.number().min(0.01).max(1), height: z.number().min(0.01).max(1) }).refine(b=>b.x+b.width<=1 && b.y+b.height<=1,'Highlight is outside the page')
export const Operation = z.discriminatedUnion('type', [
  z.object({ type: z.literal('add'), block: Block }),
  z.object({ type: z.literal('update'), block: Block }),
  z.object({ type: z.literal('highlight'), region: Highlight }),
])
export const LessonStep = z.object({ narration: z.string().min(1).max(1600), operations: z.array(Operation).max(5), needsReview: z.boolean() })
export const Message = z.object({ text: z.string().trim().min(1).max(2000), operationId: z.string().uuid(), revision: z.number().int().min(0) })
export const Draw = z.object({ operationId: z.string().uuid(), points: z.array(z.tuple([z.number().min(0).max(1),z.number().min(0).max(1)])).min(2).max(400), colour: z.enum(['ink','blue','orange']), blockId: z.string().max(80).optional() })
export type Principal = { parentId?: string; visitorHash: string; ipHash: string; isAdmin: boolean }
export class TutorError extends Error { constructor(public status: number, message: string) { super(message) } }
export const LIMITS = { minutes: 10, dailyMicros: 25_000_000, reservationMicros: 1_000_000, publicConcurrent: 3, trialsPerDay: 2, backendCalls: 24, fileBytes: 10*1024*1024, files: 3, pdfPages: 5 } as const
export function sydneyDay(at=new Date()) { return new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(at) }
export function applyOperations(workspace: TeachingBlock[], operations: z.infer<typeof Operation>[]) {
  const next=[...workspace]
  for(const op of operations) {
    if(op.type==='highlight') continue
    const index=next.findIndex(b=>b.id===op.block.id)
    if(op.type==='update' && index<0) throw new TutorError(409,'That teaching block no longer exists')
    if(index>=0) next[index]=op.block; else next.push(op.block)
  }
  if(next.length>40) throw new TutorError(422,'The canvas is full. Start a new lesson.')
  return next
}
