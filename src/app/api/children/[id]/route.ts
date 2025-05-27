import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const childId = params.id
    const body = await request.json()
    const { name, yearLevel, schoolId } = body

    // Validate required fields
    if (!name || !yearLevel || !schoolId) {
      return NextResponse.json({ error: 'Name, year level, and school are required' }, { status: 400 })
    }

    // Check if child exists and belongs to the user
    const existingChild = await db.child.findFirst({
      where: {
        id: childId,
        userId: user.id
      }
    })

    if (!existingChild) {
      return NextResponse.json({ error: 'Child not found or access denied' }, { status: 404 })
    }

    // Verify school exists
    const school = await db.school.findUnique({
      where: { id: schoolId }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Update the child
    const updatedChild = await db.child.update({
      where: { id: childId },
      data: {
        name,
        yearLevel,
        schoolId
      },
      include: {
        school: true
      }
    })

    return NextResponse.json({ child: updatedChild })
  } catch (error) {
    console.error('Error updating child:', error)
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

    const childId = params.id

    // Check if child exists and belongs to the user
    const existingChild = await db.child.findFirst({
      where: {
        id: childId,
        userId: user.id
      }
    })

    if (!existingChild) {
      return NextResponse.json({ error: 'Child not found or access denied' }, { status: 404 })
    }

    // Delete the child (this will also cascade delete any private events)
    await db.child.delete({
      where: { id: childId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting child:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 