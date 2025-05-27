import { NextRequest, NextResponse } from 'next/server'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const schoolId = params.id

    // Get pending edits for this school
    const edits = await db.schoolEdit.findMany({
      where: { 
        schoolId,
        status: 'PENDING'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ edits })
  } catch (error) {
    console.error('Error fetching school edits:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user } = await validateRequest()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schoolId = params.id
    const body = await request.json()
    const { field, newValue, reason } = body

    // Validate required fields
    if (!field || !newValue) {
      return NextResponse.json({ error: 'Field and new value are required' }, { status: 400 })
    }

    // Get current school data
    const school = await db.school.findUnique({
      where: { id: schoolId }
    })

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    // Get current value for the field
    const oldValue = (school as any)[field] || null

    // Check if there's already a pending edit for this field
    const existingEdit = await db.schoolEdit.findFirst({
      where: {
        schoolId,
        field,
        status: 'PENDING'
      }
    })

    if (existingEdit) {
      return NextResponse.json({ 
        error: 'There is already a pending edit for this field' 
      }, { status: 400 })
    }

    // Create the edit suggestion
    const edit = await db.schoolEdit.create({
      data: {
        schoolId,
        field,
        oldValue,
        newValue,
        reason,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        votes: true
      }
    })

    return NextResponse.json({ edit })
  } catch (error) {
    console.error('Error creating school edit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 