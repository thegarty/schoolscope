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

    return NextResponse.json({ 
      success: true, 
      confirmationCount 
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

    return NextResponse.json({ 
      success: true, 
      confirmationCount 
    })
  } catch (error) {
    console.error('Error removing event confirmation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 