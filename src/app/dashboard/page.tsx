import { redirect } from 'next/navigation'
import { validateRequest } from '@/lib/auth'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { School, Users, Calendar, MapPin, Lock, Globe, Edit, Sparkles, ArrowRight, Plus } from 'lucide-react'
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
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-primary">YOUR SCHOOL DAY, SIMPLIFIED</p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Hello, {user.name?.split(' ')[0] || 'there'}.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
            A little less to remember. A little more room to learn.
          </p>
        </div>

        <section aria-label="Your family at a glance" className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: 'Children', value: children.length, Icon: Users, colour: 'bg-[#eeebfa] text-primary' },
            { label: 'School events', value: totalPublicEvents, Icon: Globe, colour: 'bg-[#e7f4ed] text-[#37684d]' },
            { label: 'Personal events', value: totalPrivateEvents, Icon: Lock, colour: 'bg-[#fff0e6] text-[#8e542e]' },
            { label: 'Schools', value: new Set(children.map(child => child.schoolId)).size, Icon: School, colour: 'bg-[#eeebfa] text-primary' },
          ].map(({ label, value, Icon, colour }) => (
            <Card key={label}>
              <CardContent className="flex items-center gap-3 p-4 sm:p-5">
                <span className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl min-[360px]:flex ${colour}`}><Icon className="h-5 w-5" aria-hidden="true" /></span>
                <div className="min-w-0"><p className="text-2xl font-bold text-foreground">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section aria-labelledby="tutor-title" className="mb-8 flex flex-col gap-5 rounded-3xl border border-[#ded7f5] bg-[#eeebfa] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-start gap-4">
            <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-primary sm:flex"><Sparkles className="h-7 w-7" aria-hidden="true" /></span>
            <div>
              <span className="mb-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-primary">Adult preview</span>
              <h2 id="tutor-title" className="mb-2 text-2xl font-bold tracking-tight text-foreground">Meet your learning sidekick.</h2>
              <p className="max-w-xl text-sm leading-relaxed text-[#615575]">Explore maths with Ripple, one friendly step at a time. Try the tutor with a fictional learner.</p>
            </div>
          </div>
          <Button asChild className="shrink-0 gap-2"><Link href="/tutor/demo">Meet Ripple <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></Button>
        </section>

        <div className="mb-8 grid min-w-0 gap-6 lg:grid-cols-[1.1fr_1fr]">
          <Card className="min-w-0">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-xl"><Calendar className="h-5 w-5 text-primary" aria-hidden="true" />Coming up</CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1"><Link href="/events/create"><Plus className="h-4 w-4" aria-hidden="true" />Add event</Link></Button>
              </div>
              <CardDescription>Your school and personal events, together.</CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length ? (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 4).map(event => (
                    <article key={event.id} className="rounded-2xl border border-border p-4">
                      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-primary">{new Date(event.startDate).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${event.isPrivate ? 'bg-[#eeebfa] text-[#5946a8]' : event.confirmed ? 'bg-[#e7f4ed] text-[#37684d]' : 'bg-[#fff0e6] text-[#8e542e]'}`}>
                          {event.isPrivate ? 'Personal' : event.confirmed ? 'Confirmed' : 'Pending'}
                        </span>
                      </div>
                      <h3 className="break-words font-semibold leading-snug text-foreground">{event.title}</h3>
                      <p className="mt-1 break-words text-sm text-muted-foreground">{event.school.name}</p>
                    </article>
                  ))}
                  <Button asChild variant="outline" className="w-full"><Link href="/events">See all events</Link></Button>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#f8f7fc] px-5 py-8 text-center">
                  <Calendar className="mx-auto mb-3 h-9 w-9 text-primary" aria-hidden="true" />
                  <p className="mb-1 font-semibold text-foreground">A little breathing room.</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">You have no upcoming events. Add one when you're ready.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-xl"><Users className="h-5 w-5 text-primary" aria-hidden="true" />Your family</CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1"><Link href="/children/add"><Plus className="h-4 w-4" aria-hidden="true" />Add child</Link></Button>
              </div>
              <CardDescription>School details and learning, in one place.</CardDescription>
            </CardHeader>
            <CardContent>
              {children.length ? (
                <div className="space-y-3">
                  {children.map(child => (
                    <article key={child.id} className="rounded-2xl border border-border p-4">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="break-words text-lg font-semibold text-foreground">{child.name}</h3>
                          <p className="text-sm text-muted-foreground">{child.yearLevel}</p>
                        </div>
                        <Button asChild variant="ghost" size="icon" className="shrink-0"><Link href={`/children/${child.id}/edit`} aria-label={`Edit ${child.name}'s details`}><Edit className="h-4 w-4" aria-hidden="true" /></Link></Button>
                      </div>
                      <p className="mb-1 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span className="break-words">{child.school.name}<span className="mt-1 block text-xs">{child.school.suburb}, {child.school.state}</span></span></p>
                      <Button asChild variant="outline" className="mt-3 w-full gap-2"><Link href={`/tutor/children/${child.id}`}><Sparkles className="h-4 w-4" aria-hidden="true" />Open tutoring</Link></Button>
                    </article>
                  ))}
                  <Button asChild variant="outline" className="w-full"><Link href="/children">Manage children</Link></Button>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#f8f7fc] px-5 py-8 text-center">
                  <Users className="mx-auto mb-3 h-9 w-9 text-primary" aria-hidden="true" />
                  <p className="mb-1 font-semibold text-foreground">Let's bring your school day together.</p>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">Add your child to see events from their school.</p>
                  <Button asChild><Link href="/children/add">Add your first child</Link></Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl"><Calendar className="h-5 w-5 text-primary" aria-hidden="true" />Your calendar</CardTitle>
            <CardDescription>A clear view of the month ahead. Tap a date for the details.</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
            <PersonalCalendar events={calendarEvents} currentMonth={month} currentYear={year} />
          </CardContent>
        </Card>

        {pendingSchoolEdits.length > 0 && (
          <section id="pending-edits" className="mb-8 scroll-mt-24">
            <DashboardVoting schoolEdits={pendingSchoolEdits} currentUserId={user.id} />
          </section>
        )}
      </main>
    </div>
  )
}
