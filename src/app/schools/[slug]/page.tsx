import AppFooter from '@/components/AppFooter'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { School, MapPin, Phone, Globe } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import AppHeader from '@/components/AppHeader'
import { validateRequest } from '@/lib/auth'
import { SchoolPageTabs } from '@/components/SchoolPageTabs'
import { findSchoolBySlug } from '@/lib/school-utils'

export const dynamic = 'force-dynamic'

interface SchoolPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const { slug } = await params
  const schoolId = await findSchoolBySlug(slug, db)

  if (!schoolId) {
    return { title: 'School Not Found', description: 'The requested school could not be found.' }
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { name: true, suburb: true, state: true, type: true, sector: true, postcode: true, aboutSummary: true },
  })

  if (!school) {
    return { title: 'School Not Found', description: 'The requested school could not be found.' }
  }

  return {
    title: `${school.name} - ${school.suburb}, ${school.state} | SchoolScope`,
    description:
      school.aboutSummary ||
      `View events, calendar and information for ${school.name}, a ${school.type} ${school.sector} school in ${school.suburb}, ${school.state} ${school.postcode}. Stay connected with the school community.`,
    keywords: [
      school.name, school.suburb, school.state, school.type, school.sector,
      'school events', 'school calendar', 'Australian schools', 'school community',
    ],
    openGraph: {
      title: `${school.name} - SchoolScope`,
      description: `Events and calendar for ${school.name} in ${school.suburb}, ${school.state}`,
      type: 'website',
      locale: 'en_AU',
    },
    alternates: { canonical: `/schools/${slug}` },
  }
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { user } = await validateRequest()
  const { slug } = await params
  const schoolId = await findSchoolBySlug(slug, db)

  if (!schoolId) notFound()

  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  const [school, monthEvents, upcomingEvents, totalEvents] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      include: {
        children: { select: { id: true } },
      },
    }),
    db.event.findMany({
      where: {
        schoolId,
        isPrivate: false,
        startDate: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lte: new Date(currentYear, currentMonth, 0, 23, 59, 59),
        },
      },
      orderBy: { startDate: 'asc' },
      select: { id: true, title: true, startDate: true, endDate: true, category: true, confirmed: true },
    }),
    db.event.findMany({
      where: { schoolId, isPrivate: false, startDate: { gte: currentDate } },
      orderBy: { startDate: 'asc' },
      take: 10,
      select: { id: true, title: true, startDate: true, category: true },
    }),
    db.event.count({ where: { schoolId, isPrivate: false } }),
  ])

  if (!school) notFound()

  const totalStudents = school.children.length

  // Serialize dates for client components
  const serializedMonthEvents = monthEvents.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
    endDate: e.endDate.toISOString(),
  }))
  const serializedUpcomingEvents = upcomingEvents.map(e => ({
    ...e,
    startDate: e.startDate.toISOString(),
  }))

  const schoolForClient = {
    id: school.id,
    name: school.name,
    website: school.website,
    phone: school.phone,
    email: school.email,
    principalName: school.principalName,
    address: school.address,
  }

  const schoolJsonLd = {
    "@context": "https://schema.org",
    "@type": "School",
    name: school.name,
    url: school.website || undefined,
    email: school.email || undefined,
    telephone: school.phone || undefined,
    address: school.address
      ? {
          "@type": "PostalAddress",
          streetAddress: school.address,
          addressLocality: school.suburb,
          addressRegion: school.state,
          postalCode: school.postcode,
          addressCountry: "AU",
        }
      : undefined,
    description:
      school.aboutSummary ||
      `${school.name} is a ${school.type.toLowerCase()} ${school.sector.toLowerCase()} school located in ${school.suburb}, ${school.state}.`,
  }

  const eventJsonLd = upcomingEvents.slice(0, 10).map((event) => ({
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.startDate.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: school.name,
      address: `${school.suburb}, ${school.state} ${school.postcode}`,
    },
    organizer: {
      "@type": "School",
      name: school.name,
    },
  }))

  return (
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />

      {/* School Header */}
      <section className="relative bg-secondary/60 text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-7 md:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8">
              <div className="lg:col-span-2">
                <div className="mb-4 inline-flex items-center rounded-full border border-primary/10 bg-white px-3 py-1 text-xs font-medium text-primary">
                  {school.type} · {school.sector}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight break-words mb-5">{school.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-muted-foreground mb-5">
                  <div className="inline-flex items-center rounded-full bg-white/80 px-3 py-1.5">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{school.suburb}, {school.state} {school.postcode}</span>
                  </div>
                  <div className="hidden sm:inline-flex items-center rounded-full bg-white/80 px-3 py-1.5">
                    <School className="h-4 w-4 mr-2" />
                    <span>School Profile</span>
                  </div>
                  {school.website && (
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-full bg-white/80 px-3 py-1.5 hover:bg-white transition-colors"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  )}
                  {school.phone && (
                    <a
                      href={`tel:${school.phone}`}
                      className="inline-flex min-h-11 items-center rounded-full bg-white/80 px-3 py-1.5 hover:bg-white transition-colors"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {school.phone}
                    </a>
                  )}
                </div>
                <p className="max-w-3xl text-base md:text-lg text-muted-foreground leading-relaxed">
                  School details, important dates, and your community.
                </p>
              </div>
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-border bg-white p-4 lg:p-6">
                  <h3 className="sr-only lg:not-sr-only lg:text-lg lg:font-semibold lg:mb-4">School activity</h3>
                  <div className="grid grid-cols-3 gap-2 lg:block lg:space-y-3">
                    <div className="flex flex-col-reverse lg:flex-row justify-between rounded-lg bg-white/80 px-1 lg:px-3 py-2 text-center lg:text-left">
                      <span className="text-xs lg:text-sm text-muted-foreground">Connected students</span>
                      <span className="text-xl lg:text-base font-semibold">{totalStudents}</span>
                    </div>
                    <div className="flex flex-col-reverse lg:flex-row justify-between rounded-lg bg-white/80 px-1 lg:px-3 py-2 text-center lg:text-left">
                      <span className="text-xs lg:text-sm text-muted-foreground">All events</span>
                      <span className="text-xl lg:text-base font-semibold">{totalEvents}</span>
                    </div>
                    <div className="flex flex-col-reverse lg:flex-row justify-between rounded-lg bg-white/80 px-1 lg:px-3 py-2 text-center lg:text-left">
                      <span className="text-xs lg:text-sm text-muted-foreground">Coming up</span>
                      <span className="text-xl lg:text-base font-semibold">{upcomingEvents.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-border bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-muted-foreground">
            Home / Schools / <span className="font-medium text-foreground">{school.name}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-8 min-w-0">
        <SchoolPageTabs
          school={schoolForClient}
          schoolSlug={slug}
          monthEvents={serializedMonthEvents}
          upcomingEvents={serializedUpcomingEvents}
          currentMonth={currentMonth}
          currentYear={currentYear}
        />
      </div>

      {/* SEO Content */}
      <section className="bg-white py-12 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">About {school.name}</h2>
          {school.aboutContent ? (
            <p className="text-muted-foreground mb-4 whitespace-pre-line leading-relaxed">{school.aboutContent}</p>
          ) : (
            <>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                {school.name} is a {school.type.toLowerCase()} {school.sector.toLowerCase()} school located in {school.suburb}, {school.state}.
                Our school community uses SchoolScope to stay connected and informed about important events, activities, and announcements.
              </p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Join our growing community of {totalStudents} students and families who use SchoolScope to never miss important school events.
                From academic activities to sports events, parent meetings to school holidays, our calendar keeps everyone in the loop.
              </p>
            </>
          )}
          <h3 className="text-xl font-semibold text-foreground mb-3 mt-8">School Events and Activities</h3>
          <p className="text-muted-foreground leading-relaxed">
            Stay up to date with all the latest happenings at {school.name}. Our community-driven calendar includes events across all year levels,
            from Kindergarten to Year 12. Whether you're looking for academic events, sports activities, arts and culture programs, or social events,
            you'll find everything you need to stay connected with your school community.
          </p>
        </div>
      </section>

      {/* Footer */}
      <AppFooter />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }}
      />
    </div>
  )
}
