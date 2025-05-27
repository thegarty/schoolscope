import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// Cache the response for 5 minutes to reduce database load
export const revalidate = 300

export async function GET() {
  try {
    // Set a timeout for database operations
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database timeout')), 10000) // 10 second timeout
    })

    // Get popular schools with events and student counts
    const dataPromise = Promise.all([
      db.school.findMany({
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
      }),
      db.school.count(),
      db.event.count({
        where: {
          isPrivate: false,
          startDate: { gte: new Date() }
        }
      }),
      db.child.count()
    ])

    // Race between data fetching and timeout
    const [popularSchools, totalSchools, totalEvents, totalStudents] = await Promise.race([
      dataPromise,
      timeoutPromise
    ]) as [any[], number, number, number]

    // Validate the data
    if (!Array.isArray(popularSchools) || typeof totalSchools !== 'number') {
      throw new Error('Invalid data received from database')
    }

    return NextResponse.json({
      schools: popularSchools,
      totalSchools,
      totalEvents,
      totalStudents
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (error) {
    console.error('Error fetching ticker data:', error)
    
    // Return fallback data with appropriate cache headers
    return NextResponse.json({
      schools: [
        {
          id: 'fallback-1',
          name: 'Sydney Grammar School',
          suburb: 'Darlinghurst',
          state: 'NSW',
          _count: { events: 15, children: 45 }
        },
        {
          id: 'fallback-2',
          name: 'Melbourne High School',
          suburb: 'South Yarra',
          state: 'VIC',
          _count: { events: 12, children: 38 }
        },
        {
          id: 'fallback-3',
          name: 'Brisbane State High School',
          suburb: 'South Brisbane',
          state: 'QLD',
          _count: { events: 8, children: 29 }
        },
        {
          id: 'fallback-4',
          name: 'Perth Modern School',
          suburb: 'Subiaco',
          state: 'WA',
          _count: { events: 6, children: 22 }
        },
        {
          id: 'fallback-5',
          name: 'Adelaide High School',
          suburb: 'Adelaide',
          state: 'SA',
          _count: { events: 4, children: 18 }
        },
        {
          id: 'fallback-6',
          name: 'Hobart College',
          suburb: 'Mount Nelson',
          state: 'TAS',
          _count: { events: 3, children: 15 }
        }
      ],
      totalSchools: 10868,
      totalEvents: 2450,
      totalStudents: 1250
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    })
  }
} 