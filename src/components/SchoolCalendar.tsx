"use client"

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function SchoolCalendar({
  schoolId,
  events: initialEvents,
  currentMonth: initialMonth,
  currentYear: initialYear,
}: SchoolCalendarProps) {
  const [month, setMonth] = useState(initialMonth)
  const [year, setYear] = useState(initialYear)
  const [events, setEvents] = useState<Event[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const fetchEvents = useCallback(async (m: number, y: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/schools/${schoolId}/calendar?month=${m}&year=${y}`)
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events)
      }
    } catch {
      // keep existing events on error
    } finally {
      setLoading(false)
    }
  }, [schoolId])

  const navigate = (dir: -1 | 1) => {
    let m = month + dir
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m)
    setYear(y)
    setSelectedDate(null)
    fetchEvents(m, y)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()

  const calendarDays: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const getEventsForDay = (day: number) => {
    const dayDate = new Date(year, month - 1, day)
    return events.filter(event => {
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      return (
        dayDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
        dayDate <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
      )
    })
  }

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {MONTH_NAMES[month - 1]} {year}
          {loading && <span className="ml-2 text-sm font-normal text-gray-400">Loading...</span>}
        </h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)} disabled={loading}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)} disabled={loading}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className={`grid grid-cols-7 gap-1 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={index} className="p-2 h-20 bg-gray-50" />
          }

          const dayEvents = getEventsForDay(day)
          const isToday =
            new Date().toDateString() ===
            new Date(year, month - 1, day).toDateString()

          return (
            <div
              key={day}
              className={`p-1 h-20 border border-gray-200 cursor-pointer hover:bg-gray-50 ${
                isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
              onClick={() => setSelectedDate(new Date(year, month - 1, day))}
            >
              <div className={`text-sm font-medium ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                {day}
              </div>
              <div className="space-y-1 mt-1">
                {dayEvents.slice(0, 2).map(event => (
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
                  <div className="text-xs text-gray-500">+{dayEvents.length - 2} more</div>
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
            const dayEvents = getEventsForDay(selectedDate.getDate())
            return dayEvents.length > 0 ? (
              <div className="space-y-2">
                {dayEvents.map(event => (
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
          <div className="w-3 h-3 bg-green-100 rounded mr-1" />
          <span>Confirmed Events</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-100 rounded mr-1" />
          <span>Pending Events</span>
        </div>
      </div>
    </div>
  )
}
