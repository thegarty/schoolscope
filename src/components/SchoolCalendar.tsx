"use client"

import { useState, useCallback } from 'react'
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
    <div className="min-w-0 space-y-4" aria-busy={loading}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between gap-2">
        <h3 className="min-w-0 text-base font-semibold text-foreground sm:text-lg">
          {MONTH_NAMES[month - 1]} {year}
          {loading && <span className="block text-sm font-normal text-muted-foreground" role="status">Loading…</span>}
        </h3>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)} disabled={loading} aria-label="Previous month">
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate(1)} disabled={loading} aria-label="Next month">
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div aria-label={`${MONTH_NAMES[month - 1]} ${year}`} className={`grid min-w-0 grid-cols-7 gap-1 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground sm:text-sm">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="min-h-14 rounded-xl bg-background sm:min-h-20" aria-hidden="true" />
          }

          const dayEvents = getEventsForDay(day)
          const isToday =
            new Date().toDateString() ===
            new Date(year, month - 1, day).toDateString()

          const date = new Date(year, month - 1, day)
          const isSelected = selectedDate?.toDateString() === date.toDateString()
          return (
            <button
              key={day}
              type="button"
              disabled={loading}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}${isToday ? ', today' : ''}`}
              className={`min-h-14 min-w-0 rounded-xl border p-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-wait sm:min-h-20 sm:p-2 ${
                isSelected ? 'border-primary bg-[#eeebfa]' : isToday ? 'border-[#c6b9eb] bg-[#f5f2ff]' : 'border-border bg-white hover:bg-background'
              }`}
              onClick={() => setSelectedDate(date)}
            >
              <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold sm:mx-0 ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>{day}</span>
              <span className="mt-1 flex justify-center gap-1 sm:hidden" aria-hidden="true">
                {dayEvents.slice(0, 3).map(event => <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${event.confirmed ? 'bg-[#4e8a66]' : 'bg-[#b66a31]'}`} />)}
              </span>
              <span className="mt-1 hidden space-y-1 sm:block" aria-hidden="true">
                {dayEvents.slice(0, 2).map(event => (
                  <span key={event.id} className={`block truncate rounded-md px-1 py-0.5 text-xs ${event.confirmed ? 'bg-[#e7f4ed] text-[#37684d]' : 'bg-[#fff0e6] text-[#8e542e]'}`} title={event.title}>{event.title}</span>
                ))}
                {dayEvents.length > 2 && <span className="block text-xs text-muted-foreground">+{dayEvents.length - 2} more</span>}
              </span>
            </button>
          )
        })}
      </div>

      {/* Selected Date Events */}
      {selectedDate && (
        <div className="mt-6 rounded-2xl border border-border bg-background p-4" aria-live="polite">
          <h4 className="font-semibold mb-3">
            Events for {selectedDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h4>
          {(() => {
            const dayEvents = getEventsForDay(selectedDate.getDate())
            return dayEvents.length > 0 ? (
              <div className="space-y-2">
                {dayEvents.map(event => (
                  <div key={event.id} className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row sm:justify-between">
                    <div className="min-w-0">
                      <h5 className="break-words text-base font-semibold text-foreground">{event.title}</h5>
                      <p className="text-sm text-muted-foreground">{event.category}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      event.confirmed
                        ? 'bg-[#e7f4ed] text-[#37684d]'
                        : 'bg-[#fff0e6] text-[#8e542e]'
                    }`}>
                      {event.confirmed ? 'Confirmed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No events on this date</p>
            )
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl bg-background p-3 text-xs text-muted-foreground">
        <div className="flex items-center">
          <div className="mr-2 h-2.5 w-2.5 rounded-full bg-[#4e8a66]" aria-hidden="true" />
          <span>Confirmed Events</span>
        </div>
        <div className="flex items-center">
          <div className="mr-2 h-2.5 w-2.5 rounded-full bg-[#b66a31]" aria-hidden="true" />
          <span>Pending Events</span>
        </div>
      </div>
    </div>
  )
}
