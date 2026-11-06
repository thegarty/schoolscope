"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
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
      <section className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <Card className="overflow-hidden border-border shadow-sm">
            <CardHeader className="border-b border-border bg-white">
              <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                <Calendar className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                School Calendar
              </CardTitle>
              <CardDescription>
                View upcoming activities and key dates for {school.name}.
              </CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 bg-white px-3 pt-6 sm:px-6">
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
          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="flex items-center gap-2 text-xl text-foreground">
                <Clock className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-6">
              {upcomingEvents.length > 0 ? (
                <>
                  {upcomingEvents.slice(0, 5).map(event => (
                    <div key={event.id} className="rounded-2xl border border-border bg-background p-4">
                      <h4 className="break-words text-base font-semibold text-foreground">{event.title}</h4>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {new Date(event.startDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.category}</p>
                    </div>
                  ))}
                  {upcomingEvents.length > 5 && (
                    <Link
                      href={`/schools/${schoolSlug}/events`}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-medium text-primary hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      View all {upcomingEvents.length} upcoming events <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-xl text-foreground">Get Involved</CardTitle>
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
          <h2 className="text-2xl font-bold tracking-tight text-foreground">School Information</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Public details maintained by the school community.
          </p>
        </div>
        <SchoolInfoEditorLoader school={school} />
      </section>
    </main>
  )
}
