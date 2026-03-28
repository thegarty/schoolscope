"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import SchoolCalendar from '@/components/SchoolCalendar'
import { SchoolUserActions } from '@/components/SchoolUserActions'
import { SchoolInfoEditorLoader } from '@/components/SchoolInfoEditorLoader'

interface Event {
  id: string
  title: string
  startDate: string | Date
  endDate: string | Date
  category: string
  confirmed: boolean
}

interface UpcomingEvent {
  id: string
  title: string
  startDate: string | Date
  category: string
}

interface School {
  id: string
  name: string
  website?: string | null
  phone?: string | null
  email?: string | null
  principalName?: string | null
  address?: string | null
}

interface SchoolPageTabsProps {
  school: School
  schoolSlug: string
  monthEvents: Event[]
  upcomingEvents: UpcomingEvent[]
  currentMonth: number
  currentYear: number
}

export function SchoolPageTabs({
  school,
  schoolSlug,
  monthEvents,
  upcomingEvents,
  currentMonth,
  currentYear,
}: SchoolPageTabsProps) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <Card className="overflow-hidden border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white">
              <CardTitle className="flex items-center text-slate-900">
                <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                School Calendar
              </CardTitle>
              <CardDescription>
                View upcoming activities and key dates for {school.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-white pt-6">
              <SchoolCalendar
                schoolId={school.id}
                schoolSlug={schoolSlug}
                events={monthEvents}
                currentMonth={currentMonth}
                currentYear={currentYear}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6 lg:col-span-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center text-slate-900">
                <Clock className="mr-2 h-5 w-5 text-blue-600" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {upcomingEvents.length > 0 ? (
                <>
                  {upcomingEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="rounded-lg border border-slate-200 p-3">
                      <h4 className="text-sm font-semibold text-slate-900">{event.title}</h4>
                      <p className="mt-1 text-xs text-slate-600">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500">{event.category}</p>
                    </div>
                  ))}
                  {upcomingEvents.length > 5 && (
                    <Link
                      href={`/schools/${schoolSlug}/events`}
                      className="inline-flex text-sm font-medium text-blue-700 hover:underline"
                    >
                      View all {upcomingEvents.length} upcoming events →
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-slate-900">Get Involved</CardTitle>
              <CardDescription>
                Join the community and contribute updates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              <SchoolUserActions schoolId={school.id} />
            </CardContent>
          </Card>
        </aside>
      </section>

      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">School Information</h2>
          <p className="mt-1 text-sm text-slate-600">
            Public details maintained by the school community.
          </p>
        </div>
        <SchoolInfoEditorLoader school={school} />
      </section>
    </main>
  )
}
