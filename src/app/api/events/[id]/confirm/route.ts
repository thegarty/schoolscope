import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check if user already confirmed this event
    const existingConfirmation = await db.eventConfirmation.findUnique({
      where: {
        eventId_userId: {
          eventId,
          userId: user.id
        }
      }
    })

    if (existingConfirmation) {
      return NextResponse.json({ error: 'Event already confirmed' }, { status: 400 })
    }

    // Create confirmation
    await db.eventConfirmation.create({
      data: {
        eventId,
        userId: user.id
      }
    })

    // Get updated confirmation count
    const confirmationCount = await db.eventConfirmation.count({
      where: { eventId }
    })

    // Auto-confirm event if it reaches the threshold (3 confirmations)
    const CONFIRMATION_THRESHOLD = 3
    if (confirmationCount >= CONFIRMATION_THRESHOLD && !event.confirmed) {
      await db.event.update({
        where: { id: eventId },
        data: { confirmed: true }
      })
    }

    return NextResponse.json({ 
      success: true, 
      confirmationCount,
      eventConfirmed: confirmationCount >= CONFIRMATION_THRESHOLD
    })
  } catch (error) {
    console.error('Error confirming event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventId = params.id

    // Check if event exists
    const event = await db.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Remove confirmation
    await db.eventConfirmation.deleteMany({
      where: {
        eventId,
        userId: user.id
      }
    })

    // Get updated confirmation count
    const confirmationCount = await db.eventConfirmation.count({
      where: { eventId }
    })

    // Un-confirm event if it falls below the threshold (3 confirmations)
    const CONFIRMATION_THRESHOLD = 3
    if (confirmationCount < CONFIRMATION_THRESHOLD && event.confirmed) {
      await db.event.update({
        where: { id: eventId },
        data: { confirmed: false }
      })
    }

    return NextResponse.json({ 
      success: true, 
      confirmationCount,
      eventConfirmed: confirmationCount >= CONFIRMATION_THRESHOLD
    })
  } catch (error) {
    console.error('Error removing event confirmation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 