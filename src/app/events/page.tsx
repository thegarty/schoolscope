import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, School, MapPin, Clock, Users, Lock, Globe, Plus } from 'lucide-react'
import Link from 'next/link'
import EventConfirmation from '@/components/EventConfirmation'
import CalendarExport from '@/components/CalendarExport'
import AppHeader from '@/components/AppHeader'

export default async function EventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>
}) {
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
  const resolvedSearchParams = (await searchParams) ?? {}
  const category = resolvedSearchParams.category || ''
  const confirmed = resolvedSearchParams.confirmed || ''
  const eventType = resolvedSearchParams.eventType || '' // 'public', 'private', or ''
  const page = parseInt(resolvedSearchParams.page || '1', 10)
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
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="min-w-0">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="mb-2 text-sm font-semibold text-primary">YOUR SCHOOL DAY, SIMPLIFIED</p><h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">School events</h1><p className="mt-3 text-base text-muted-foreground">School plans and personal reminders, all together.</p></div>
            <Button asChild className="gap-2 sm:shrink-0"><Link href="/events/create"><Plus className="h-4 w-4" aria-hidden="true" />Create event</Link></Button>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">Find an event</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
                <label className="min-w-0 text-sm font-medium text-foreground">Event type<select name="eventType" defaultValue={eventType} className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <option value="">All Events</option>
                  <option value="public">Public Events Only</option>
                  <option value="private">My Private Events</option>
                </select></label>
                <label className="min-w-0 text-sm font-medium text-foreground">Category<select name="category" defaultValue={category} className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.category} value={cat.category}>{cat.category}</option>
                  ))}
                </select></label>
                <label className="min-w-0 text-sm font-medium text-foreground">Confirmation<select name="confirmed" defaultValue={confirmed} className="mt-2 min-h-12 w-full min-w-0 rounded-xl border border-input bg-white px-3 py-2 text-base font-normal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <option value="">All Events</option>
                  <option value="true">Confirmed Only</option>
                  <option value="false">Pending Only</option>
                </select></label>
                <Button type="submit" className="min-h-12 sm:self-end">Apply filters</Button>
              </form>
            </CardContent>
          </Card>

          {/* Events List */}
          {events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
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
                  <Card key={event.id} className={event.isPrivate ? 'border-[#ded7f5] bg-[#f6f3ff]' : ''}>
                    <CardHeader>
                      <div className="flex min-w-0 items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="flex flex-wrap items-center gap-x-2 gap-y-3 break-words text-xl leading-snug">
                            {event.isPrivate ? (
                              <Lock className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                            ) : (
                              <Globe className="h-5 w-5 shrink-0 text-[#37684d]" aria-hidden="true" />
                            )}
                            <span className="min-w-0 break-words">{event.title}</span>
                            {event.isPrivate ? (
                              <span className="inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#eeebfa] text-[#5946a8]">
                                Personal Event
                              </span>
                            ) : (
                              <span className={`inline-flex shrink-0 items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                event.confirmed
                                  ? 'bg-[#e7f4ed] text-[#37684d]'
                                  : 'bg-[#fff0e6] text-[#8e542e]'
                              }`}>
                                {event.confirmed ? 'Confirmed' : 'Pending'}
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="mt-3 whitespace-pre-wrap break-words leading-relaxed">
                            {event.description}
                          </CardDescription>
                          {event.isPrivate && event.child && (
                            <p className="text-sm text-primary mt-1">
                              For: {event.child.name} ({event.child.yearLevel})
                            </p>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2 break-words text-sm text-muted-foreground">
                            <Calendar className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>
                              {new Date(event.startDate).toLocaleDateString()}
                              {event.startDate !== event.endDate &&
                                ` - ${new Date(event.endDate).toLocaleDateString()}`
                              }
                            </span>
                          </div>
                          <div className="flex items-start gap-2 break-words text-sm text-muted-foreground">
                            <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>
                              {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {event.startDate !== event.endDate &&
                                ` - ${new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              }
                            </span>
                          </div>
                          <div className="flex items-start gap-2 break-words text-sm text-muted-foreground">
                            <School className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{event.school.name}</span>
                          </div>
                          {event.location && (
                            <div className="flex items-start gap-2 break-words text-sm text-muted-foreground">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                              <span>{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          {!event.isPrivate && (
                            <div className="flex items-start gap-2 break-words text-sm text-muted-foreground">
                              <Users className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                              <span>Year Levels: {event.yearLevels.join(', ')}</span>
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            Category: {event.category}
                          </div>
                          <div className="break-words text-sm text-muted-foreground">
                            Created by: {event.user.name || event.user.email}
                          </div>
                        </div>
                      </div>

                      {/* Event Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                        <div className="flex min-w-0 flex-wrap items-center gap-3">
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
            <nav aria-label="Event pages" className="mt-8 flex flex-wrap justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?eventType=${encodeURIComponent(eventType)}&category=${encodeURIComponent(category)}&confirmed=${encodeURIComponent(confirmed)}&page=${p}`}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border px-3 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    p === page ? 'border-primary bg-primary text-white' : 'border-border bg-white text-primary hover:bg-secondary'
                  }`}
                >
                  {p}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </main>
    </div>
  )
}
