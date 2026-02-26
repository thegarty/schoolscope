"use client"

import { useState } from 'react'
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
  const [activeTab, setActiveTab] = useState<'calendar' | 'info'>('calendar')

  return (
    <>
      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Calendar & Events
            </button>
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              School Information
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'calendar' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-6 w-6 mr-2" />
                    School Calendar
                  </CardTitle>
                  <CardDescription>
                    View all events and important dates for {school.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
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

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.slice(0, 5).map(event => (
                        <div key={event.id} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">{event.category}</p>
                        </div>
                      ))}
                      {upcomingEvents.length > 5 && (
                        <Link
                          href={`/schools/${schoolSlug}/events`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View all {upcomingEvents.length} upcoming events →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No upcoming events</p>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Get Involved</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <SchoolUserActions schoolId={school.id} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <SchoolInfoEditorLoader school={school} />
          </div>
        )}
      </main>
    </>
  )
}
