"use client"

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Lock, Globe, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  description: string
  startDate: Date | string
  endDate: Date | string
  category: string
  confirmed: boolean
  isPrivate: boolean
  location?: string | null
  yearLevels: string[]
  school: {
    id: string
    name: string
    suburb: string
    state: string
  }
  child?: {
    id: string
    name: string
    yearLevel: string
  } | null
  user: {
    id: string
    name?: string | null
    email: string
  }
}

interface PersonalCalendarProps {
  events: Event[]
  currentMonth: number
  currentYear: number
}

export default function PersonalCalendar({ events, currentMonth, currentYear }: PersonalCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay()
  
  // Create calendar grid
  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth - 1, day)
    return events.filter(event => {
      const eventStart = new Date(event.startDate)
      const eventEnd = new Date(event.endDate)
      return dayDate >= new Date(eventStart.getFullYear(), eventStart.getMonth(), eventStart.getDate()) &&
             dayDate <= new Date(eventEnd.getFullYear(), eventEnd.getMonth(), eventEnd.getDate())
    })
  }

  // Navigation URLs
  const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
  const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1
  const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear

  const prevUrl = `/dashboard?month=${prevMonth}&year=${prevYear}`
  const nextUrl = `/dashboard?month=${nextMonth}&year=${nextYear}`

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {monthNames[currentMonth - 1]} {currentYear}
        </h3>
        <div className="flex space-x-2">
          <Button asChild variant="outline" size="sm">
            <Link href={prevUrl}>
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={nextUrl}>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-2 h-24 bg-gray-50"></div>
          }

          const dayEvents = getEventsForDay(day)
          const isToday = new Date().toDateString() === new Date(currentYear, currentMonth - 1, day).toDateString()

          return (
            <div
              key={day}
              className={`p-1 h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, day))}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-1 py-0.5 rounded truncate flex items-center ${
                      event.isPrivate
                        ? 'bg-blue-100 text-blue-800'
                        : event.confirmed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                    title={`${event.title} - ${event.school.name}${event.child ? ` (${event.child.name})` : ''}`}
                  >
                    {event.isPrivate ? (
                      <Lock className="h-2 w-2 mr-1 flex-shrink-0" />
                    ) : (
                      <Globe className="h-2 w-2 mr-1 flex-shrink-0" />
                    )}
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
                    +{dayEvents.length - 2} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Events for {selectedDate.toLocaleDateString('en-AU', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const selectedDayEvents = getEventsForDay(selectedDate.getDate())
              return selectedDayEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedDayEvents.map(event => (
                    <div key={event.id} className={`p-3 rounded-lg border ${
                      event.isPrivate ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            {event.isPrivate ? (
                              <Lock className="h-4 w-4 mr-2 text-blue-600" />
                            ) : (
                              <Globe className="h-4 w-4 mr-2 text-green-600" />
                            )}
                            <h4 className="font-medium text-sm">{event.title}</h4>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2">{event.description}</p>
                          
                          <div className="space-y-1">
                            <div className="flex items-center text-xs text-gray-500">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>
                                {formatTime(event.startDate)}
                                {event.startDate !== event.endDate && ` - ${formatTime(event.endDate)}`}
                              </span>
                            </div>
                            
                            <div className="flex items-center text-xs text-gray-500">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>{event.school.name}</span>
                            </div>
                            
                            {event.location && (
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{event.location}</span>
                              </div>
                            )}
                            
                            {event.isPrivate && event.child && (
                              <div className="flex items-center text-xs text-blue-600">
                                <Users className="h-3 w-3 mr-1" />
                                <span>For: {event.child.name} ({event.child.yearLevel})</span>
                              </div>
                            )}
                            
                            {!event.isPrivate && event.yearLevels.length > 0 && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Users className="h-3 w-3 mr-1" />
                                <span>Year Levels: {event.yearLevels.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-3 flex flex-col items-end space-y-1">
                          {event.isPrivate ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Personal
                            </span>
                          ) : (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              event.confirmed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.confirmed ? 'Confirmed' : 'Pending'}
                            </span>
                          )}
                          
                          <span className="text-xs text-gray-400">{event.category}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm text-center py-4">No events on this date</p>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 rounded mr-2"></div>
          <span>Confirmed Public Events</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-100 rounded mr-2"></div>
          <span>Pending Public Events</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-100 rounded mr-2"></div>
          <span>Personal Events</span>
        </div>
      </div>
    </div>
  )
} 