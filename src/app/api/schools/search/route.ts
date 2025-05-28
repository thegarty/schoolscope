import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim() || ''
  const search = searchParams.get('search')?.trim() || ''
  const state = searchParams.get('state')?.trim() || ''
  const limit = parseInt(searchParams.get('limit') || '20')

  // Handle legacy 'q' parameter for existing functionality
  const searchTerm = search || q

  // Build where clause
  const whereClause: any = {}
  
  if (searchTerm) {
    whereClause.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { suburb: { contains: searchTerm, mode: 'insensitive' } },
      { postcode: { contains: searchTerm, mode: 'insensitive' } }
    ]
  }

  if (state) {
    whereClause.state = state
  }

  // If using legacy 'q' parameter and no search term, return empty array
  if (q !== null && !searchTerm && !state && !searchParams.has('limit')) {
    return NextResponse.json([])
  }

  const schools = await db.school.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: { name: 'asc' },
    take: Math.min(limit, 100), // Cap at 100 for performance
    select: { 
      id: true, 
      name: true, 
      acara_id: true,
      suburb: true, 
      state: true, 
      postcode: true,
      address: true,
      phone: true,
      email: true,
      website: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          events: true,
          children: true,
        },
      },
    }
  })

  // Return in format expected by admin page
  return NextResponse.json({ schools })
} 