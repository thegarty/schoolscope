"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Edit, Check, X, Clock, User } from 'lucide-react'

interface School {
  id: string
  name: string
  website?: string | null
  phone?: string | null
  email?: string | null
  principalName?: string | null
  address?: string | null
}

interface SchoolEdit {
  id: string
  field: string
  oldValue?: string
  newValue: string
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  user: {
    id: string
    name?: string
    email: string
  }
  votes: Array<{
    id: string
    vote: 'APPROVE' | 'REJECT'
    user: {
      id: string
      name?: string
      email: string
    }
  }>
  createdAt: string
}

interface SchoolInfoEditorProps {
  school: School
  pendingEdits: SchoolEdit[]
  currentUserId: string
}

const EDITABLE_FIELDS = [
  { key: 'website', label: 'Website', type: 'url' },
  { key: 'phone', label: 'Phone', type: 'tel' },
  { key: 'email', label: 'Email', type: 'email' },
  { key: 'principalName', label: 'Principal Name', type: 'text' },
  { key: 'address', label: 'Address', type: 'text' },
]

export default function SchoolInfoEditor({ school, pendingEdits, currentUserId }: SchoolInfoEditorProps) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [newValue, setNewValue] = useState('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = (field: string) => {
    setEditingField(field)
    setNewValue((school as any)[field] || '')
    setReason('')
  }

  const handleCancel = () => {
    setEditingField(null)
    setNewValue('')
    setReason('')
  }

  const handleSubmit = async () => {
    if (!editingField || !newValue.trim()) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/schools/${school.id}/edits`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          field: editingField,
          newValue: newValue.trim(),
          reason: reason.trim() || undefined,
        }),
      })

      if (response.ok) {
        handleCancel()
        // Refresh the page to show the new edit
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit edit')
      }
    } catch (error) {
      console.error('Error submitting edit:', error)
      alert('Failed to submit edit')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (editId: string, vote: 'APPROVE' | 'REJECT') => {
    try {
      const response = await fetch(`/api/schools/edits/${editId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      })

      if (response.ok) {
        // Refresh to show updated votes
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to vote')
      }
    } catch (error) {
      console.error('Error voting:', error)
      alert('Failed to vote')
    }
  }

  const getFieldValue = (field: string) => {
    return (school as any)[field] || 'Not set'
  }

  const getPendingEditForField = (field: string) => {
    return pendingEdits.find(edit => edit.field === field)
  }

  const getUserVote = (edit: SchoolEdit) => {
    return edit.votes.find(vote => vote.user.id === currentUserId)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>School Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {EDITABLE_FIELDS.map((field) => {
            const pendingEdit = getPendingEditForField(field.key)
            const isEditing = editingField === field.key

            return (
              <div key={field.key} className="border-b pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                    </label>
                    {isEditing ? (
                      <div className="space-y-2">
                        <Input
                          type={field.type}
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          placeholder={`Enter ${field.label.toLowerCase()}`}
                        />
                        <Input
                          type="text"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="Reason for change (optional)"
                        />
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            onClick={handleSubmit}
                            disabled={isSubmitting || !newValue.trim()}
                          >
                            {isSubmitting ? 'Submitting...' : 'Submit'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancel}
                            disabled={isSubmitting}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{getFieldValue(field.key)}</span>
                        {!pendingEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(field.key)}
                            className="ml-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {pendingEdit && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center text-sm text-yellow-800">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>Pending Change</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        by {pendingEdit.user.name || pendingEdit.user.email}
                      </span>
                    </div>
                    <div className="text-sm">
                      <div className="mb-1">
                        <strong>Proposed:</strong> {pendingEdit.newValue}
                      </div>
                      {pendingEdit.reason && (
                        <div className="mb-2 text-gray-600">
                          <strong>Reason:</strong> {pendingEdit.reason}
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Votes: {pendingEdit.votes.filter(v => v.vote === 'APPROVE').length} approve, {' '}
                          {pendingEdit.votes.filter(v => v.vote === 'REJECT').length} reject
                        </div>
                        {pendingEdit.user.id !== currentUserId && (
                          <div className="flex space-x-1">
                            {getUserVote(pendingEdit)?.vote !== 'APPROVE' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVote(pendingEdit.id, 'APPROVE')}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {getUserVote(pendingEdit)?.vote !== 'REJECT' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleVote(pendingEdit.id, 'REJECT')}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
} 