import { allauthProxy } from '@/lib/allauth-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
async function handler(request: Request, context: { params: Promise<{ all?: string[] }> }) {
  return allauthProxy()(request, context)
}
export { handler as GET, handler as POST }
