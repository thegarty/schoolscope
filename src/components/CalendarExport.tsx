"use client"

import { Button } from '@/components/ui/button'
import { Calendar, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { trackCalendar } from '@/lib/analytics'

interface Event {
  id: string
  title: string
  description: string
  startDate: Date | string
  endDate: Date | string
  location?: string
  school: {
    name: string
    suburb: string
    state: string
  }
}

interface CalendarExportProps {
  event: Event
}

export default function CalendarExport({ event }: CalendarExportProps) {
  const formatDateForCalendar = (date: Date | string) => {
    const d = new Date(date)
    return format(d, "yyyyMMdd'T'HHmmss'Z'")
  }

  const createICSContent = () => {
    const startDate = formatDateForCalendar(event.startDate)
    const endDate = formatDateForCalendar(event.endDate)
    const location = event.location || `${event.school.name}, ${event.school.suburb}, ${event.school.state}`
    
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SchoolScope//Event Export//EN
BEGIN:VEVENT
UID:${event.id}@schoolscope.app
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${event.title}
DESCRIPTION:${event.description.replace(/\n/g, '\\n')}
LOCATION:${location}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`

    return icsContent
  }

  const downloadICS = () => {
    const icsContent = createICSContent()
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    trackCalendar('export', 'ics')
  }

  const createGoogleCalendarUrl = () => {
    const startDate = format(new Date(event.startDate), "yyyyMMdd'T'HHmmss'Z'")
    const endDate = format(new Date(event.endDate), "yyyyMMdd'T'HHmmss'Z'")
    const location = event.location || `${event.school.name}, ${event.school.suburb}, ${event.school.state}`
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${startDate}/${endDate}`,
      details: event.description,
      location: location,
      trp: 'false'
    })

    return `https://calendar.google.com/calendar/render?${params.toString()}`
  }

  const createOutlookUrl = () => {
    const startDate = new Date(event.startDate).toISOString()
    const endDate = new Date(event.endDate).toISOString()
    const location = event.location || `${event.school.name}, ${event.school.suburb}, ${event.school.state}`
    
    const params = new URLSearchParams({
      subject: event.title,
      startdt: startDate,
      enddt: endDate,
      body: event.description,
      location: location,
      allday: 'false',
      uid: event.id
    })

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          trackCalendar('export', 'google')
          window.open(createGoogleCalendarUrl(), '_blank')
        }}
        className="flex items-center space-x-1"
      >
        <ExternalLink className="h-4 w-4" />
        <span>Google Calendar</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          trackCalendar('export', 'outlook')
          window.open(createOutlookUrl(), '_blank')
        }}
        className="flex items-center space-x-1"
      >
        <ExternalLink className="h-4 w-4" />
        <span>Outlook</span>
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={downloadICS}
        className="flex items-center space-x-1"
      >
        <Download className="h-4 w-4" />
        <span>Download .ics</span>
      </Button>
    </div>
  )
} 