"use client"

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Event {
  id: string
  title: string
  startDate: Date | string
  endDate: Date | string
  category: string
  confirmed: boolean
}

interface SchoolCalendarProps {
  schoolId: string
  schoolSlug?: string
  events: Event[]
  currentMonth: number
  currentYear: number
}

export default function SchoolCalendar({ schoolId, schoolSlug, events, currentMonth, currentYear }: SchoolCalendarProps) {
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

  const baseUrl = schoolSlug ? `/schools/${schoolSlug}` : `/schools/${schoolId}`
  const prevUrl = `${baseUrl}?month=${prevMonth}&year=${prevYear}`
  const nextUrl = `${baseUrl}?month=${nextMonth}&year=${nextYear}`

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
            return <div key={index} className="p-2 h-20 bg-gray-50"></div>
          }

          const dayEvents = getEventsForDay(day)
          const isToday = new Date().toDateString() === new Date(currentYear, currentMonth - 1, day).toDateString()

          return (
            <div
              key={day}
              className={`p-1 h-20 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
              onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, day))}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 2).map((event, eventIndex) => (
                  <div
                    key={event.id}
                    className={`text-xs px-1 py-0.5 rounded truncate ${
                      event.confirmed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                    title={event.title}
                  >
                    {event.title}
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
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold mb-3">
            Events for {selectedDate.toLocaleDateString()}
          </h4>
          {(() => {
            const selectedDayEvents = getEventsForDay(selectedDate.getDate())
            return selectedDayEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDayEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div>
                      <h5 className="font-medium text-sm">{event.title}</h5>
                      <p className="text-xs text-gray-500">{event.category}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      event.confirmed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No events on this date</p>
            )
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center space-x-4 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
          <span>Confirmed Events</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-100 rounded mr-1"></div>
          <span>Pending Events</span>
        </div>
      </div>
    </div>
  )
} 