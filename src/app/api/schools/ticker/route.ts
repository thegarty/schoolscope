import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Get popular schools with events and student counts
    const popularSchools = await db.school.findMany({
      include: {
        _count: {
          select: {
            events: {
              where: {
                isPrivate: false,
                startDate: { gte: new Date() }
              }
            },
            children: true
          }
        }
      },
      orderBy: [
        { children: { _count: 'desc' } },
        { events: { _count: 'desc' } }
      ],
      take: 12
    })

    // Get some overall stats
    const [totalSchools, totalEvents, totalStudents] = await Promise.all([
      db.school.count(),
      db.event.count({
        where: {
          isPrivate: false,
          startDate: { gte: new Date() }
        }
      }),
      db.child.count()
    ])

    return NextResponse.json({
      schools: popularSchools,
      totalSchools,
      totalEvents,
      totalStudents
    })
  } catch (error) {
    console.error('Error fetching ticker data:', error)
    
    // Return fallback data during build time or when database is unavailable
    return NextResponse.json({
      schools: [],
      totalSchools: 10868,
      totalEvents: 0,
      totalStudents: 0
    })
  }
} 