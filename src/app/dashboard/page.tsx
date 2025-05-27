import { redirect } from 'next/navigation'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { School, Users, Calendar, MapPin, Lock, Globe, Edit } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const { user } = await validateRequest()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's children and their schools
  const children = await db.child.findMany({
    where: { userId: user.id },
    include: {
      school: true
    }
  })

  // Get upcoming events - both public events from children's schools and user's private events
  const schoolIds = children.map(child => child.schoolId)
  
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
    take: 8 // Increased to show more events since we now have two types
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <School className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">SchoolScope</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user.name || user.email}</span>
              <form action="/api/auth/logout" method="POST">
                <Button variant="outline" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user.name || 'Parent'}!
            </h2>
            <p className="text-gray-600">
              Here's what's happening with your children's schools and your personal events.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Children</p>
                    <p className="text-2xl font-bold text-gray-900">{children.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Globe className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Public Events</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPublicEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Lock className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Private Events</p>
                    <p className="text-2xl font-bold text-gray-900">{totalPrivateEvents}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <School className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Schools</p>
                    <p className="text-2xl font-bold text-gray-900">{new Set(children.map(c => c.schoolId)).size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            {/* Upcoming Events */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>
                  Your personal events and public school events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <div key={event.id} className={`border rounded-lg p-4 ${
                        event.isPrivate ? 'border-blue-200 bg-blue-50' : ''
                      }`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              {event.isPrivate ? (
                                <Lock className="h-4 w-4 mr-2 text-blue-600" />
                              ) : (
                                <Globe className="h-4 w-4 mr-2 text-green-600" />
                              )}
                              <h3 className="font-semibold">{event.title}</h3>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {event.description}
                            </p>
                            {event.isPrivate && event.child && (
                              <p className="text-sm text-blue-600 mt-1">
                                For: {event.child.name}
                              </p>
                            )}
                            <div className="flex items-center mt-2 text-sm text-gray-500">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(event.startDate).toLocaleDateString()}
                              {event.startDate !== event.endDate && (
                                <span> - {new Date(event.endDate).toLocaleDateString()}</span>
                              )}
                            </div>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <School className="h-4 w-4 mr-1" />
                              {event.school.name}
                            </div>
                            {event.location && (
                              <div className="flex items-center mt-1 text-sm text-gray-500">
                                <MapPin className="h-4 w-4 mr-1" />
                                {event.location}
                              </div>
                            )}
                          </div>
                          <div className="ml-4 flex flex-col items-end space-y-1">
                            {event.isPrivate ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Personal Event
                              </span>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.confirmed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {event.confirmed ? 'Confirmed' : 'Pending'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/events">View All Events</Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No upcoming events</p>
                    <Button asChild>
                      <Link href="/events/create">Create Event</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button asChild variant="outline" className="h-20">
                <Link href="/schools" className="flex flex-col items-center">
                  <School className="h-6 w-6 mb-2" />
                  Browse Schools
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20">
                <Link href="/events" className="flex flex-col items-center">
                  <Calendar className="h-6 w-6 mb-2" />
                  View All Events
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20">
                <Link href="/children" className="flex flex-col items-center">
                  <Users className="h-6 w-6 mb-2" />
                  Manage Children
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20">
                <Link href="/events/create" className="flex flex-col items-center">
                  <Calendar className="h-6 w-6 mb-2" />
                  Create Event
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 