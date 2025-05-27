import { redirect } from 'next/navigation'
import { validateRequest } from '@/auth/lucia'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, School, MapPin, Clock, Users, Lock, Globe, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import EventConfirmation from '@/components/EventConfirmation'
import CalendarExport from '@/components/CalendarExport'
import AppHeader from '@/components/AppHeader'

export default async function EventsPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const { user } = await validateRequest()
  
  if (!user) {
    redirect('/login')
  }

  // Get user's children and their schools
  const children = await db.child.findMany({
    where: { userId: user.id },
    include: { school: true }
  })

  const schoolIds = children.map(child => child.schoolId)

  // Filters
  const category = searchParams?.category || ''
  const confirmed = searchParams?.confirmed || ''
  const eventType = searchParams?.eventType || '' // 'public', 'private', or ''
  const page = parseInt(searchParams?.page || '1', 10)
  const pageSize = 20

  // Build query for public events
  const publicWhere: any = {
    schoolId: { in: schoolIds },
    isPrivate: false
  }
  
  // Build query for private events
  const privateWhere: any = {
    userId: user.id,
    isPrivate: true
  }
  
  if (category) {
    publicWhere.category = category
    privateWhere.category = category
  }
  if (confirmed === 'true') {
    publicWhere.confirmed = true
    privateWhere.confirmed = true
  }
  if (confirmed === 'false') {
    publicWhere.confirmed = false
    privateWhere.confirmed = false
  }

  // Determine which events to fetch based on filter
  let events: any[] = []
  let total = 0

  if (eventType === 'private') {
    // Only private events
    const [privateEvents, privateTotal] = await Promise.all([
      db.event.findMany({
        where: privateWhere,
        include: {
          school: true,
          user: true,
          child: true,
          confirmations: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.event.count({ where: privateWhere })
    ])
    events = privateEvents
    total = privateTotal
  } else if (eventType === 'public') {
    // Only public events
    const [publicEvents, publicTotal] = await Promise.all([
      db.event.findMany({
        where: publicWhere,
        include: {
          school: true,
          user: true,
          confirmations: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.event.count({ where: publicWhere })
    ])
    events = publicEvents
    total = publicTotal
  } else {
    // Both public and private events
    const [publicEvents, privateEvents] = await Promise.all([
      db.event.findMany({
        where: publicWhere,
        include: {
          school: true,
          user: true,
          confirmations: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      }),
      db.event.findMany({
        where: privateWhere,
        include: {
          school: true,
          user: true,
          child: true,
          confirmations: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          }
        }
      })
    ])
    
    // Combine and sort by date
    const allEvents = [...publicEvents, ...privateEvents].sort((a, b) => 
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )
    
    // Paginate combined results
    events = allEvents.slice((page - 1) * pageSize, page * pageSize)
    total = allEvents.length
  }

  const totalPages = Math.ceil(total / pageSize)

  // Get distinct categories for filter
  const categories = await db.event.findMany({
    where: { 
      OR: [
        { schoolId: { in: schoolIds }, isPrivate: false },
        { userId: user.id, isPrivate: true }
      ]
    },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader user={user} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-900">School Events</h2>
            <Button asChild>
              <Link href="/events/create">Create Event</Link>
            </Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select name="eventType" defaultValue={eventType} className="border rounded-md px-3 py-2">
                  <option value="">All Events</option>
                  <option value="public">Public Events Only</option>
                  <option value="private">My Private Events</option>
                </select>
                <select name="category" defaultValue={category} className="border rounded-md px-3 py-2">
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>{cat.category}</option>
                  ))}
                </select>
                <select name="confirmed" defaultValue={confirmed} className="border rounded-md px-3 py-2">
                  <option value="">All Events</option>
                  <option value="true">Confirmed Only</option>
                  <option value="false">Pending Only</option>
                </select>
                <Button type="submit">Apply Filters</Button>
              </form>
            </CardContent>
          </Card>

          {/* Events List */}
          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
                <p className="text-gray-500 mb-4">
                  {schoolIds.length === 0 
                    ? "Add children to see their school events"
                    : "No events match your current filters"
                  }
                </p>
                {schoolIds.length === 0 ? (
                  <Button asChild>
                    <Link href="/children/add">Add Child</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/events/create">Create Event</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {events.map((event) => {
                const userHasConfirmed = event.confirmations?.some((c: any) => c.user.id === user.id) || false
                const isEventOwner = event.userId === user.id
                
                return (
                  <Card key={event.id} className={event.isPrivate ? 'border-blue-200 bg-blue-50' : ''}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center">
                            {event.isPrivate ? (
                              <Lock className="h-4 w-4 mr-2 text-blue-600" />
                            ) : (
                              <Globe className="h-4 w-4 mr-2 text-green-600" />
                            )}
                            {event.title}
                            {event.isPrivate ? (
                              <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Personal Event
                              </span>
                            ) : (
                              <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.confirmed 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {event.confirmed ? 'Confirmed' : 'Pending'}
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {event.description}
                          </CardDescription>
                          {event.isPrivate && event.child && (
                            <p className="text-sm text-blue-600 mt-1">
                              For: {event.child.name} ({event.child.yearLevel})
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString()} 
                              {event.startDate !== event.endDate && 
                                ` - ${new Date(event.endDate).toLocaleDateString()}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>
                              {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {event.startDate !== event.endDate && 
                                ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <School className="h-4 w-4 mr-2" />
                            <span>{event.school.name}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-center text-sm text-gray-600">
                              <MapPin className="h-4 w-4 mr-2" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {!event.isPrivate && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="h-4 w-4 mr-2" />
                              <span>Year Levels: {event.yearLevels.join(', ')}</span>
                            </div>
                          )}
                          <div className="text-sm text-gray-500">
                            Category: {event.category}
                          </div>
                          <div className="text-xs text-gray-400">
                            Created by: {event.user.name || event.user.email}
                          </div>
                        </div>
                      </div>

                      {/* Event Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex items-center space-x-4">
                          {/* Event Confirmations - Only for public events */}
                          {!event.isPrivate && (
                            <EventConfirmation
                              eventId={event.id}
                              confirmationCount={event.confirmations?.length || 0}
                              userHasConfirmed={userHasConfirmed}
                              isEventOwner={isEventOwner}
                            />
                          )}
                        </div>
                        
                        {/* Calendar Export */}
                        <CalendarExport event={event} />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?eventType=${encodeURIComponent(eventType)}&category=${encodeURIComponent(category)}&confirmed=${encodeURIComponent(confirmed)}&page=${p}`}
                  className={`px-3 py-1 rounded-md border ${
                    p === page ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 