"use client"

import { useState, useEffect, useRef } from 'react'
import { Bell, Calendar, Vote, Clock, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface NotificationData {
  eventId?: string
  editId?: string
  eventTitle?: string
  schoolName?: string
  startDate?: string
  confirmationCount?: number
  field?: string
  newValue?: string
  reason?: string
  approveCount?: number
  rejectCount?: number
  isPrivate?: boolean
  childName?: string
  daysUntil?: number
}

interface Notification {
  id: string
  type: 'EVENT_CONFIRMATION' | 'SCHOOL_EDIT_VOTE' | 'UPCOMING_EVENT'
  title: string
  message: string
  data: NotificationData
  createdAt: string
  priority: 'high' | 'medium' | 'low'
}

interface NotificationCounts {
  total: number
  eventsNeedingConfirmation: number
  schoolEditsNeedingVotes: number
  upcomingEvents: number
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [counts, setCounts] = useState<NotificationCounts>({ total: 0, eventsNeedingConfirmation: 0, schoolEditsNeedingVotes: 0, upcomingEvents: 0 })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!isOpen) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setIsOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [isOpen])

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        setCounts(data.counts)
      } else if (response.status === 401) {
        // User not authenticated, don't show error
        setNotifications([])
        setCounts({ total: 0, eventsNeedingConfirmation: 0, schoolEditsNeedingVotes: 0, upcomingEvents: 0 })
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      // Set empty state on error
      setNotifications([])
      setCounts({ total: 0, eventsNeedingConfirmation: 0, schoolEditsNeedingVotes: 0, upcomingEvents: 0 })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch notifications in the browser
    if (typeof window !== 'undefined') {
      fetchNotifications()
      // Refresh notifications every 5 minutes
      const interval = setInterval(fetchNotifications, 5 * 60 * 1000)
      return () => clearInterval(interval)
    }
  }, [])

  const handleConfirmEvent = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/${eventId}/confirm`, {
        method: 'POST'
      })
      if (response.ok) {
        fetchNotifications() // Refresh notifications
      }
    } catch (error) {
      console.error('Error confirming event:', error)
    }
  }

  const handleVoteOnEdit = async (editId: string, vote: 'APPROVE' | 'REJECT') => {
    try {
      const response = await fetch(`/api/schools/edits/${editId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote }),
      })
      if (response.ok) {
        fetchNotifications() // Refresh notifications
      }
    } catch (error) {
      console.error('Error voting on edit:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'EVENT_CONFIRMATION':
        return <Calendar className="h-4 w-4 text-violet-600" />
      case 'SCHOOL_EDIT_VOTE':
        return <Vote className="h-4 w-4 text-purple-600" />
      case 'UPCOMING_EVENT':
        return <Clock className="h-4 w-4 text-green-600" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50'
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50'
      case 'low':
        return 'border-l-violet-500 bg-violet-50'
      default:
        return 'border-l-gray-500 bg-background'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        ref={triggerRef}
        aria-label={counts.total ? `Notifications, ${counts.total} unread` : 'Notifications'}
        aria-expanded={isOpen}
        aria-controls="scope-notifications"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {counts.total > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {counts.total > 99 ? '99+' : counts.total}
          </span>
        )}
      </Button>

      {isOpen && (
        <div id="scope-notifications" role="region" aria-label="Notifications" className="fixed inset-x-4 top-20 max-h-[70dvh] overflow-y-auto bg-white border border-border rounded-2xl shadow-lg z-50 sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {counts.total > 0 && (
              <p className="text-sm text-gray-600">
                {counts.eventsNeedingConfirmation} events to confirm, {counts.schoolEditsNeedingVotes} votes needed, {counts.upcomingEvents} upcoming
              </p>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 border-l-4 ${getPriorityColor(notification.priority)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      
                      {notification.type === 'EVENT_CONFIRMATION' && (
                        <div className="mt-2 flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleConfirmEvent(notification.data.eventId!)}
                            className="text-xs"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Confirm Event
                          </Button>
                          <Link href={`/events`}>
                            <Button size="sm" variant="outline" className="text-xs">
                              View Details
                            </Button>
                          </Link>
                        </div>
                      )}

                      {notification.type === 'SCHOOL_EDIT_VOTE' && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-2">
                            Proposed: {notification.data.newValue}
                            {notification.data.reason && ` (${notification.data.reason})`}
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleVoteOnEdit(notification.data.editId!, 'APPROVE')}
                              className="text-xs bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleVoteOnEdit(notification.data.editId!, 'REJECT')}
                              className="text-xs bg-red-600 hover:bg-red-700"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      )}

                      {notification.type === 'UPCOMING_EVENT' && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            {formatDate(notification.data.startDate!)}
                            {notification.data.isPrivate && notification.data.childName && 
                              ` • ${notification.data.childName}`
                            }
                          </p>
                          <Link href={`/events`}>
                            <Button size="sm" variant="outline" className="text-xs mt-1">
                              View Event
                            </Button>
                          </Link>
                        </div>
                      )}

                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-background">
              <div className="flex justify-between">
                <Link href="/dashboard">
                  <Button size="sm" variant="outline" className="text-xs">
                    View Dashboard
                  </Button>
                </Link>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchNotifications}
                  className="text-xs"
                >
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
} 