"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Clock, User, Vote } from 'lucide-react'
import Link from 'next/link'

interface SchoolEdit {
  id: string
  field: string
  oldValue?: string | null
  newValue: string
  reason?: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  user: {
    id: string
    name?: string | null
    email: string
  }
  school: {
    id: string
    name: string
    suburb: string
    state: string
  }
  votes: Array<{
    id: string
    vote: 'APPROVE' | 'REJECT'
    user: {
      id: string
      name?: string | null
      email: string
    }
  }>
  createdAt: string | Date
}

interface DashboardVotingProps {
  schoolEdits: SchoolEdit[]
  currentUserId: string
}

export default function DashboardVoting({ schoolEdits, currentUserId }: DashboardVotingProps) {
  const [votingStates, setVotingStates] = useState<Record<string, boolean>>({})

  const handleVote = async (editId: string, vote: 'APPROVE' | 'REJECT') => {
    setVotingStates(prev => ({ ...prev, [editId]: true }))
    
    try {
      const response = await fetch(`/api/schools/edits/${editId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      })

      if (response.ok) {
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Error voting on edit:', error)
      alert('Failed to vote')
    } finally {
      setVotingStates(prev => ({ ...prev, [editId]: false }))
    }
  }

  const getUserVote = (edit: SchoolEdit) => {
    return edit.votes.find(vote => vote.user.id === currentUserId)
  }

  const getFieldDisplayName = (field: string) => {
    const fieldNames: Record<string, string> = {
      website: 'Website',
      phone: 'Phone',
      email: 'Email',
      principalName: 'Principal Name',
      address: 'Address'
    }
    return fieldNames[field] || field
  }

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (schoolEdits.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Vote className="h-5 w-5 mr-2" />
          School Updates Needing Your Vote
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schoolEdits.map((edit) => {
            const userVote = getUserVote(edit)
            const approveCount = edit.votes.filter(v => v.vote === 'APPROVE').length
            const rejectCount = edit.votes.filter(v => v.vote === 'REJECT').length
            const isVoting = votingStates[edit.id]

            return (
              <div key={edit.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-yellow-600 mr-2" />
                      <h4 className="font-medium text-gray-900">
                        {getFieldDisplayName(edit.field)} Update
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>School:</strong> {edit.school.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Proposed by:</strong> {edit.user.name || edit.user.email}
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Proposed:</strong> {edit.newValue}
                    </p>
                    {edit.reason && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Reason:</strong> {edit.reason}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatDate(edit.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-xs text-gray-500">
                      Votes: {approveCount} approve, {rejectCount} reject
                    </div>
                    {userVote && (
                      <div className="text-xs">
                        <span className={`px-2 py-1 rounded-full ${
                          userVote.vote === 'APPROVE' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          You voted: {userVote.vote.toLowerCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    {edit.user.id !== currentUserId && (
                      <>
                        {(!userVote || userVote.vote !== 'APPROVE') && (
                          <Button
                            size="sm"
                            onClick={() => handleVote(edit.id, 'APPROVE')}
                            disabled={isVoting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {isVoting ? 'Voting...' : 'Approve'}
                          </Button>
                        )}
                        {(!userVote || userVote.vote !== 'REJECT') && (
                          <Button
                            size="sm"
                            onClick={() => handleVote(edit.id, 'REJECT')}
                            disabled={isVoting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <X className="h-4 w-4 mr-1" />
                            {isVoting ? 'Voting...' : 'Reject'}
                          </Button>
                        )}
                      </>
                    )}
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/schools/${edit.school.name.toLowerCase().replace(/\s+/g, '-')}`}>
                        View School
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
} 