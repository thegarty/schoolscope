import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10)
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)

    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

    const events = await db.event.findMany({
      where: {
        schoolId: params.id,
        isPrivate: false,
        startDate: { gte: startOfMonth, lte: endOfMonth },
      },
      orderBy: { startDate: 'asc' },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        category: true,
        confirmed: true,
      },
    })

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
