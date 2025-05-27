import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  if (!q) {
    return NextResponse.json([])
  }
  const schools = await db.school.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { suburb: { contains: q, mode: 'insensitive' } },
        { postcode: { contains: q, mode: 'insensitive' } }
      ]
    },
    orderBy: { name: 'asc' },
    take: 20,
    select: { id: true, name: true, suburb: true, state: true, postcode: true }
  })
  return NextResponse.json(schools)
} 