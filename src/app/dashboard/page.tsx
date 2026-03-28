import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { School, Users, Calendar, MapPin, Lock, Globe, Edit } from 'lucide-react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import DashboardVoting from '@/components/DashboardVoting'
import PersonalCalendar from '@/components/PersonalCalendar'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string; year?: string }>
}) {
  const { user } = await validateRequest()
  
  if (!user) {
    redirect('/login')
  }

  // Get current month/year for calendar
  const resolvedSearchParams = (await searchParams) ?? {}
  const currentDate = new Date()
  const month = resolvedSearchParams.month
    ? parseInt(resolvedSearchParams.month)
    : currentDate.getMonth() + 1
  const year = resolvedSearchParams.year
    ? parseInt(resolvedSearchParams.year)
    : currentDate.getFullYear()

  // Get user's children and their schools
  const children = await db.child.findMany({
    where: { userId: user.id },
    include: {
      school: true
    }
  })

  // Get events for calendar and upcoming events
  const schoolIds = children.map(child => child.schoolId)
  
  // Get events for the calendar month
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0)
  
  const calendarEvents = await db.event.findMany({
    where: {
      OR: [
        // Public events from schools where user has children
        {
          schoolId: { in: schoolIds },
          isPrivate: false,
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        // User's own private events
        {
          userId: user.id,
          isPrivate: true,
          startDate: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        }
      ]
    },
    include: {
      school: true,
      child: true,
      user: true
    },
    orderBy: { startDate: 'asc' }
  })
  
  const upcomingEvents = await db.event.findMany({
    where: {
      OR: [
        // Public events from schools where user has children
        {
          schoolId: { in: schoolIds },
          isPrivate: false,
          startDate: { gte: new Date() }
        },
        // User's own private events
        {
          userId: user.id,
          isPrivate: true,
          startDate: { gte: new Date() }
        }
      ]
    },
    include: {
      school: true,
      child: true // Include child info for private events
    },
    orderBy: { startDate: 'asc' },
    take: 6 // Reduced since calendar is now the main focus
  })

  // Get some statistics for the user
  const totalPublicEvents = await db.event.count({
    where: {
      schoolId: { in: schoolIds },
      isPrivate: false,
      startDate: { gte: new Date() }
    }
  })

  const totalPrivateEvents = await db.event.count({
    where: {
      userId: user.id,
      isPrivate: true,
      startDate: { gte: new Date() }
    }
  })

  // Get pending school edits that need user's vote
  const pendingSchoolEdits = schoolIds.length > 0 ? await db.schoolEdit.findMany({
    where: {
      schoolId: { in: schoolIds },
      status: 'PENDING',
      userId: { not: user.id }, // Can't vote on own edits
      votes: {
        none: {
          userId: user.id // User hasn't voted on this edit yet
        }
      }
    },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          suburb: true,
          state: true
        }
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      votes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  }) : []

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard
              </h2>
              <p className="text-gray-600">
                Your at-a-glance view of children, events, and community activity.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button asChild variant="outline" size="sm">
                <Link href="/children/add">Add Child</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/events/create">Create Event</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/events">All Events</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/schools">Schools</Link>
              </Button>
            </div>
          </div>

          {/* At-a-glance stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Users className="h-6 w-6 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Children</p>
                    <p className="text-xl font-bold text-gray-900">{children.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Globe className="h-6 w-6 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Public Events</p>
                    <p className="text-xl font-bold text-gray-900">{totalPublicEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Lock className="h-6 w-6 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Private Events</p>
                    <p className="text-xl font-bold text-gray-900">{totalPrivateEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <School className="h-6 w-6 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Schools</p>
                    <p className="text-xl font-bold text-gray-900">{new Set(children.map(c => c.schoolId)).size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Above-the-fold focus area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Upcoming Events
                  </CardTitle>
                  <CardDescription>
                    Next events across your schools and private calendar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingEvents.slice(0, 4).map((event) => (
                        <div key={event.id} className={`border rounded-lg p-3 ${
                          event.isPrivate ? 'border-blue-200 bg-blue-50' : ''
                        }`}>
                          <div className="flex justify-between items-start gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center mb-1">
                                {event.isPrivate ? (
                                  <Lock className="h-4 w-4 mr-2 text-blue-600" />
                                ) : (
                                  <Globe className="h-4 w-4 mr-2 text-green-600" />
                                )}
                                <h3 className="font-semibold truncate">{event.title}</h3>
                              </div>
                              <p className="text-sm text-gray-600 truncate">
                                {event.school.name} • {new Date(event.startDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                              event.isPrivate
                                ? 'bg-blue-100 text-blue-800'
                                : event.confirmed
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.isPrivate ? 'Private' : event.confirmed ? 'Confirmed' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      ))}
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/events">View All Events</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Calendar className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500 mb-4">No upcoming events</p>
                      <Button asChild>
                        <Link href="/events/create">Create Event</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Family Snapshot
                  </CardTitle>
                  <CardDescription>
                    Quick access to children management
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {children.slice(0, 3).map((child) => (
                      <div key={child.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div>
                          <p className="font-medium text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-500">{child.yearLevel} • {child.school.name}</p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/children/${child.id}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    ))}
                    <div className="pt-2 flex gap-2">
                      <Button asChild variant="outline" className="flex-1">
                        <Link href="/children">Manage Children</Link>
                      </Button>
                      <Button asChild className="flex-1">
                        <Link href="/children/add">Add Child</Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {pendingSchoolEdits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Edit className="h-5 w-5 mr-2" />
                      Community Votes
                    </CardTitle>
                    <CardDescription>
                      {pendingSchoolEdits.length} school update{pendingSchoolEdits.length > 1 ? 's' : ''} need your vote
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild variant="outline" className="w-full">
                      <Link href="#pending-edits">Review Pending Edits</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Personal Calendar */}
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-6 w-6 mr-2" />
                  Your Personal Calendar
                </CardTitle>
                <CardDescription>
                  All events for your children across all their schools
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PersonalCalendar 
                  events={calendarEvents}
                  currentMonth={month}
                  currentYear={year}
                />
              </CardContent>
            </Card>
          </div>

          {/* Voting Section */}
          {pendingSchoolEdits.length > 0 && (
            <div className="mb-8" id="pending-edits">
              <DashboardVoting 
                schoolEdits={pendingSchoolEdits} 
                currentUserId={user.id}
              />
            </div>
          )}

          {/* Children Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Your Children
              </CardTitle>
              <CardDescription>
                Manage your children's school information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {children.length > 0 ? (
                <div className="space-y-4">
                  {children.map((child) => (
                    <div key={child.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{child.name}</h3>
                          <p className="text-sm text-gray-600">{child.yearLevel}</p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4 mr-1" />
                            {child.school.name}
                          </div>
                          <p className="text-xs text-gray-400">
                            {child.school.suburb}, {child.school.state}
                          </p>
                        </div>
                        <div className="ml-4">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/children/${child.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t flex space-x-2">
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/children">Manage Children</Link>
                    </Button>
                    <Button asChild variant="outline" className="flex-1">
                      <Link href="/children/add">Add Child</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No children added yet</p>
                  <Button asChild>
                    <Link href="/children/add">Add Child</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 