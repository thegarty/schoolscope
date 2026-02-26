import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's children and their schools
    const children = await db.child.findMany({
      where: { userId: user.id },
      include: { school: true }
    })

    const schoolIds = children.map((child: typeof children[number]) => child.schoolId)
    const yearLevels = Array.from(new Set(children.map((child: typeof children[number]) => child.yearLevel)))

    interface Notification {
      id: string
      type: 'EVENT_CONFIRMATION' | 'SCHOOL_EDIT_VOTE' | 'UPCOMING_EVENT'
      title: string
      message: string
      data: any
      createdAt: Date
      priority: 'high' | 'medium' | 'low'
    }

    const notifications: Notification[] = []

    // 1. Events needing confirmation (public events from user's schools that they haven't confirmed)
    if (schoolIds.length > 0) {
      const eventsNeedingConfirmation = await db.event.findMany({
        where: {
          schoolId: { in: schoolIds },
          isPrivate: false,
          confirmed: false,
          userId: { not: user.id }, // Can't confirm own events
          startDate: { gte: new Date() },
          OR: [
            { yearLevels: { isEmpty: true } }, // Events for all year levels
            { yearLevels: { hasSome: yearLevels } } // Events for user's children's year levels
          ],
          confirmations: {
            none: {
              userId: user.id // User hasn't confirmed this event yet
            }
          }
        },
        include: {
          school: true,
          user: true,
          confirmations: true
        },
        orderBy: { startDate: 'asc' },
        take: 10
      })

      eventsNeedingConfirmation.forEach(event => {
        notifications.push({
          id: `event-confirm-${event.id}`,
          type: 'EVENT_CONFIRMATION',
          title: 'Event needs confirmation',
          message: `"${event.title}" at ${event.school.name}`,
          data: {
            eventId: event.id,
            eventTitle: event.title,
            schoolName: event.school.name,
            startDate: event.startDate,
            confirmationCount: event.confirmations.length
          },
          createdAt: event.createdAt,
          priority: 'medium'
        })
      })
    }

    // 2. School edits needing votes (from user's schools that they haven't voted on)
    if (schoolIds.length > 0) {
      const schoolEditsNeedingVotes = await db.schoolEdit.findMany({
        where: {
          schoolId: { in: schoolIds },
          status: 'PENDING',
          userId: { not: user.id }, // Can't vote on own edits
          votes: {
            none: {
              userId: user.id // User hasn't voted on this edit yet
            }
          }
        },
        include: {
          school: true,
          user: true,
          votes: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      schoolEditsNeedingVotes.forEach(edit => {
        const approveCount = edit.votes.filter(v => v.vote === 'APPROVE').length
        const rejectCount = edit.votes.filter(v => v.vote === 'REJECT').length
        
        notifications.push({
          id: `school-edit-${edit.id}`,
          type: 'SCHOOL_EDIT_VOTE',
          title: 'School update needs your vote',
          message: `${edit.user.name || edit.user.email} wants to update ${edit.field} at ${edit.school.name}`,
          data: {
            editId: edit.id,
            schoolName: edit.school.name,
            field: edit.field,
            newValue: edit.newValue,
            reason: edit.reason,
            approveCount,
            rejectCount
          },
          createdAt: edit.createdAt,
          priority: 'medium'
        })
      })
    }

    // 3. Upcoming events (next 7 days)
    if (schoolIds.length > 0) {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)

      const upcomingEvents = await db.event.findMany({
        where: {
          OR: [
            // Public events from user's schools
            {
              schoolId: { in: schoolIds },
              isPrivate: false,
              confirmed: true,
              startDate: { 
                gte: new Date(),
                lte: nextWeek
              },
              OR: [
                { yearLevels: { isEmpty: true } },
                { yearLevels: { hasSome: yearLevels } }
              ]
            },
            // User's private events
            {
              userId: user.id,
              isPrivate: true,
              startDate: { 
                gte: new Date(),
                lte: nextWeek
              }
            }
          ]
        },
        include: {
          school: true,
          child: true
        },
        orderBy: { startDate: 'asc' },
        take: 5
      })

      upcomingEvents.forEach(event => {
        const daysUntil = Math.ceil((new Date(event.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        
        notifications.push({
          id: `upcoming-event-${event.id}`,
          type: 'UPCOMING_EVENT',
          title: daysUntil === 0 ? 'Event today!' : daysUntil === 1 ? 'Event tomorrow' : `Event in ${daysUntil} days`,
          message: `"${event.title}" at ${event.school.name}${event.isPrivate && event.child ? ` (${event.child.name})` : ''}`,
          data: {
            eventId: event.id,
            eventTitle: event.title,
            schoolName: event.school.name,
            startDate: event.startDate,
            isPrivate: event.isPrivate,
            childName: event.child?.name,
            daysUntil
          },
          createdAt: event.createdAt,
          priority: daysUntil <= 1 ? 'high' : 'low'
        })
      })
    }

    // Sort notifications by priority and date
    const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 3, medium: 2, low: 1 }
    notifications.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return NextResponse.json({ 
      notifications,
      counts: {
        total: notifications.length,
        eventsNeedingConfirmation: notifications.filter(n => n.type === 'EVENT_CONFIRMATION').length,
        schoolEditsNeedingVotes: notifications.filter(n => n.type === 'SCHOOL_EDIT_VOTE').length,
        upcomingEvents: notifications.filter(n => n.type === 'UPCOMING_EVENT').length
      }
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 