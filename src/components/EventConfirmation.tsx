"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Users } from 'lucide-react'

interface EventConfirmationProps {
  eventId: string
  confirmationCount: number
  userHasConfirmed: boolean
  isEventOwner: boolean
  isPrivate?: boolean
}

export default function EventConfirmation({ 
  eventId, 
  confirmationCount, 
  userHasConfirmed, 
  isEventOwner,
  isPrivate = false
}: EventConfirmationProps) {
  const [isConfirmed, setIsConfirmed] = useState(userHasConfirmed)
  const [count, setCount] = useState(confirmationCount)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirmation = async () => {
    setIsLoading(true)
    try {
      const method = isConfirmed ? 'DELETE' : 'POST'
      const response = await fetch(`/api/events/${eventId}/confirm`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        setIsConfirmed(!isConfirmed)
        setCount(data.confirmationCount)
      } else {
        console.error('Failed to update confirmation')
      }
    } catch (error) {
      console.error('Error updating confirmation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Private events don't need confirmation UI since they're automatically confirmed
  if (isPrivate) {
    return (
      <div className="flex items-center text-sm text-blue-600">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span>Personal Event</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center text-sm text-gray-600">
        <Users className="h-4 w-4 mr-1" />
        <span>{count} confirmation{count !== 1 ? 's' : ''}</span>
      </div>
      
      {!isEventOwner && (
        <Button
          variant={isConfirmed ? "outline" : "default"}
          size="sm"
          onClick={handleConfirmation}
          disabled={isLoading}
          className="flex items-center space-x-1"
        >
          {isConfirmed ? (
            <>
              <XCircle className="h-4 w-4" />
              <span>Unconfirm</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Confirm</span>
            </>
          )}
        </Button>
      )}
    </div>
  )
} 