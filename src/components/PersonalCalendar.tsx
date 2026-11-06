"use client"

import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Lock, Globe, MapPin, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  useEffect(() => setSelectedDay(null), [currentMonth, currentYear])

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
  const firstDayOfMonth = new Date(currentYear, currentMonth - 1, 1).getDay()
  const calendarDays: (number | null)[] = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ]
  const getEventsForDay = (day: number) => {
    const dayDate = new Date(currentYear, currentMonth - 1, day)
    return events.filter(event => {
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      return dayDate >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
        dayDate <= new Date(end.getFullYear(), end.getMonth(), end.getDate())
    })
  }
  const previous = new Date(currentYear, currentMonth - 2, 1)
  const next = new Date(currentYear, currentMonth, 1)
  const prevUrl = `/dashboard?month=${previous.getMonth() + 1}&year=${previous.getFullYear()}`
  const nextUrl = `/dashboard?month=${next.getMonth() + 1}&year=${next.getFullYear()}`
  const formatTime = (date: Date | string) => new Date(date).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })
  const selectedDate = selectedDay === null ? null : new Date(currentYear, currentMonth - 1, selectedDay)
  const selectedEvents = selectedDay === null ? [] : getEventsForDay(selectedDay)
  const eventColour = (event: Event) => event.isPrivate
    ? 'bg-[#eeebfa] text-[#5946a8]'
    : event.confirmed ? 'bg-[#e7f4ed] text-[#37684d]' : 'bg-[#fff0e6] text-[#8e542e]'

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="pl-1 text-base font-semibold text-foreground sm:text-xl">{monthNames[currentMonth - 1]} {currentYear}</h3>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon"><Link href={prevUrl} aria-label="Previous month"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></Link></Button>
          <Button asChild variant="outline" size="icon"><Link href={nextUrl} aria-label="Next month"><ChevronRight className="h-5 w-5" aria-hidden="true" /></Link></Button>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-7 gap-1" aria-label={`${monthNames[currentMonth - 1]} ${currentYear}`}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2 text-center text-xs font-medium text-muted-foreground sm:text-sm">{day}</div>)}
        {calendarDays.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} className="min-h-14 rounded-xl bg-[#f8f7fc] sm:min-h-24" aria-hidden="true" />
          const dayEvents = getEventsForDay(day)
          const date = new Date(currentYear, currentMonth - 1, day)
          const isToday = new Date().toDateString() === date.toDateString()
          const isSelected = selectedDay === day
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              aria-pressed={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={`${date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}${isToday ? ', today' : ''}`}
              className={`min-h-14 min-w-0 rounded-xl border p-1 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:min-h-24 sm:p-2 ${isSelected ? 'border-primary bg-[#eeebfa]' : isToday ? 'border-[#c6b9eb] bg-[#f5f2ff]' : 'border-border bg-white hover:bg-[#f8f7fc]'}`}
            >
              <span className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold sm:mx-0 ${isToday ? 'bg-primary text-white' : 'text-foreground'}`}>{day}</span>
              <span className="mt-1 flex justify-center gap-1 sm:hidden" aria-hidden="true">{dayEvents.slice(0, 3).map(event => <span key={event.id} className={`h-1.5 w-1.5 rounded-full ${event.isPrivate ? 'bg-[#6551c7]' : event.confirmed ? 'bg-[#4e8a66]' : 'bg-[#b66a31]'}`} />)}</span>
              <span className="mt-1 hidden space-y-1 sm:block" aria-hidden="true">
                {dayEvents.slice(0, 2).map(event => <span key={event.id} className={`block truncate rounded-md px-1 py-0.5 text-xs ${eventColour(event)}`}>{event.title}</span>)}
                {dayEvents.length > 2 && <span className="block text-xs text-muted-foreground">+{dayEvents.length - 2} more</span>}
              </span>
            </button>
          )
        })}
      </div>

      <div aria-live="polite" aria-atomic="false">
        {selectedDate ? (
          <section className="rounded-2xl border border-border bg-[#f8f7fc] p-4 sm:p-5" aria-label="Events on the selected date">
            <h4 className="mb-4 font-semibold text-foreground">{selectedDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</h4>
            {selectedEvents.length ? (
              <div className="space-y-3">
                {selectedEvents.map(event => (
                  <article key={event.id} className="min-w-0 rounded-2xl border border-border bg-white p-4">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${eventColour(event)}`}>
                        {event.isPrivate ? <Lock className="h-3 w-3" aria-hidden="true" /> : <Globe className="h-3 w-3" aria-hidden="true" />}
                        {event.isPrivate ? 'Personal' : event.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                      <span className="text-xs text-muted-foreground">{event.category}</span>
                    </div>
                    <h5 className="mb-2 break-words font-semibold text-foreground">{event.title}</h5>
                    <p className="mb-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{event.description}</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2"><Calendar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{formatTime(event.startDate)}{new Date(event.startDate).getTime() !== new Date(event.endDate).getTime() && ` – ${formatTime(event.endDate)}`}</span></p>
                      <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-words">{event.school.name}{event.location && <span className="block">{event.location}</span>}</span></p>
                      {event.isPrivate && event.child && <p className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{event.child.name} · {event.child.yearLevel}</span></p>}
                      {!event.isPrivate && event.yearLevels.length > 0 && <p className="flex items-start gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>Year levels: {event.yearLevels.join(', ')}</span></p>}
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No events on this date.</p>}
          </section>
        ) : <p className="text-center text-sm text-muted-foreground">Choose a date to see what's happening.</p>}
      </div>

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 rounded-2xl bg-[#f8f7fc] p-3 text-xs text-muted-foreground" aria-label="Event colours">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#4e8a66]" aria-hidden="true" />Confirmed</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#b66a31]" aria-hidden="true" />Pending</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#6551c7]" aria-hidden="true" />Personal</span>
      </div>
    </div>
  )
}
