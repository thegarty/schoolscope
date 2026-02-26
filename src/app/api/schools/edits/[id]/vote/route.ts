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

    const editId = params.id
    const body = await request.json()
    const { vote } = body // 'APPROVE' or 'REJECT'

    if (!vote || !['APPROVE', 'REJECT'].includes(vote)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 })
    }

    // Check if edit exists and is pending
    const edit = await db.schoolEdit.findUnique({
      where: { id: editId },
      include: { votes: true }
    })

    if (!edit) {
      return NextResponse.json({ error: 'Edit not found' }, { status: 404 })
    }

    if (edit.status !== 'PENDING') {
      return NextResponse.json({ error: 'Edit is no longer pending' }, { status: 400 })
    }

    // Check if user already voted
    const existingVote = await db.schoolEditVote.findUnique({
      where: {
        schoolEditId_userId: {
          schoolEditId: editId,
          userId: user.id
        }
      }
    })

    if (existingVote) {
      // Update existing vote
      await db.schoolEditVote.update({
        where: { id: existingVote.id },
        data: { vote }
      })
    } else {
      // Create new vote
      await db.schoolEditVote.create({
        data: {
          schoolEditId: editId,
          userId: user.id,
          vote
        }
      })
    }

    // Get updated vote counts
    const votes = await db.schoolEditVote.findMany({
      where: { schoolEditId: editId }
    })

    const approveCount = votes.filter((v: typeof votes[number]) => v.vote === 'APPROVE').length
    const rejectCount = votes.filter((v: typeof votes[number]) => v.vote === 'REJECT').length

    // Auto-approve/reject based on vote threshold (e.g., 3 votes)
    const VOTE_THRESHOLD = 3
    let newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = edit.status

    if (approveCount >= VOTE_THRESHOLD) {
      newStatus = 'APPROVED'
      // Apply the change to the school
      await db.school.update({
        where: { id: edit.schoolId },
        data: {
          [edit.field]: edit.newValue
        }
      })
    } else if (rejectCount >= VOTE_THRESHOLD) {
      newStatus = 'REJECTED'
    }

    // Update edit status if changed
    if (newStatus !== edit.status) {
      await db.schoolEdit.update({
        where: { id: editId },
        data: { status: newStatus }
      })
    }

    return NextResponse.json({ 
      success: true,
      approveCount,
      rejectCount,
      status: newStatus
    })
  } catch (error) {
    console.error('Error voting on school edit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 