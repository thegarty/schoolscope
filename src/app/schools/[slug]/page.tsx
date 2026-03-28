import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { School, MapPin, Phone, Globe } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { UserNavButton } from '@/components/UserNavButton'
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="rounded-lg bg-blue-100 p-2 mr-3">
                <School className="h-5 w-5 text-blue-700" />
              </div>
              <Link href="/" className="text-xl font-bold text-slate-900">SchoolScope</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/schools">Browse Schools</Link>
              </Button>
              <UserNavButton />
            </div>
          </div>
        </div>
      </header>

      {/* School Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="h-full w-full bg-[radial-gradient(circle_at_20%_20%,white,transparent_35%),radial-gradient(circle_at_80%_20%,white,transparent_30%),radial-gradient(circle_at_50%_80%,white,transparent_25%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative py-12 md:py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="mb-4 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-medium text-blue-50">
                  {school.type} · {school.sector}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">{school.name}</h1>
                <div className="flex flex-wrap items-center gap-3 text-blue-100 mb-5">
                  <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{school.suburb}, {school.state} {school.postcode}</span>
                  </div>
                  <div className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5">
                    <School className="h-4 w-4 mr-2" />
                    <span>School Profile</span>
                  </div>
                  {school.website && (
                    <a
                      href={school.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20 transition-colors"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Visit Website
                    </a>
                  )}
                  {school.phone && (
                    <a
                      href={`tel:${school.phone}`}
                      className="inline-flex items-center rounded-full bg-white/10 px-3 py-1.5 hover:bg-white/20 transition-colors"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      {school.phone}
                    </a>
                  )}
                </div>
                <p className="max-w-3xl text-base md:text-lg text-blue-50/95 leading-relaxed">
                  Stay connected with {school.name}'s community through our event calendar and school information.
                </p>
              </div>
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-white/25 bg-white/10 p-6 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between rounded-lg bg-white/10 px-3 py-2">
                      <span className="text-blue-100">Students on Platform</span>
                      <span className="font-semibold">{totalStudents}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-white/10 px-3 py-2">
                      <span className="text-blue-100">Total Events</span>
                      <span className="font-semibold">{totalEvents}</span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-white/10 px-3 py-2">
                      <span className="text-blue-100">Upcoming Events</span>
                      <span className="font-semibold">{upcomingEvents.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-b border-slate-200 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <p className="text-sm text-slate-600">
            Home / Schools / <span className="font-medium text-slate-900">{school.name}</span>
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="py-8">
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
      <section className="bg-white py-12 border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">About {school.name}</h2>
          {school.aboutContent ? (
            <p className="text-slate-700 mb-4 whitespace-pre-line leading-relaxed">{school.aboutContent}</p>
          ) : (
            <>
              <p className="text-slate-700 mb-4 leading-relaxed">
                {school.name} is a {school.type.toLowerCase()} {school.sector.toLowerCase()} school located in {school.suburb}, {school.state}.
                Our school community uses SchoolScope to stay connected and informed about important events, activities, and announcements.
              </p>
              <p className="text-slate-700 mb-4 leading-relaxed">
                Join our growing community of {totalStudents} students and families who use SchoolScope to never miss important school events.
                From academic activities to sports events, parent meetings to school holidays, our calendar keeps everyone in the loop.
              </p>
            </>
          )}
          <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-8">School Events and Activities</h3>
          <p className="text-slate-700 leading-relaxed">
            Stay up to date with all the latest happenings at {school.name}. Our community-driven calendar includes events across all year levels,
            from Kindergarten to Year 12. Whether you're looking for academic events, sports activities, arts and culture programs, or social events,
            you'll find everything you need to stay connected with your school community.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <School className="h-6 w-6 mr-2" />
                <span className="font-bold text-xl">SchoolScope</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting Australian school communities through events, calendars, and information sharing.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Schools by State</h3>
              <div className="space-y-2">
                <Link href="/schools/state/nsw" className="block text-sm text-gray-400 hover:text-white transition-colors">New South Wales Schools</Link>
                <Link href="/schools/state/vic" className="block text-sm text-gray-400 hover:text-white transition-colors">Victoria Schools</Link>
                <Link href="/schools/state/qld" className="block text-sm text-gray-400 hover:text-white transition-colors">Queensland Schools</Link>
                <Link href="/schools/state/wa" className="block text-sm text-gray-400 hover:text-white transition-colors">Western Australia Schools</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">More States</h3>
              <div className="space-y-2">
                <Link href="/schools/state/sa" className="block text-sm text-gray-400 hover:text-white transition-colors">South Australia Schools</Link>
                <Link href="/schools/state/tas" className="block text-sm text-gray-400 hover:text-white transition-colors">Tasmania Schools</Link>
                <Link href="/schools/state/nt" className="block text-sm text-gray-400 hover:text-white transition-colors">Northern Territory Schools</Link>
                <Link href="/schools/state/act" className="block text-sm text-gray-400 hover:text-white transition-colors">ACT Schools</Link>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/schools" className="block text-sm text-gray-400 hover:text-white transition-colors">Browse All Schools</Link>
                <Link href="/register" className="block text-sm text-gray-400 hover:text-white transition-colors">Join SchoolScope</Link>
                <Link href="/privacy" className="block text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-gray-400">© 2026 SchoolScope. All rights reserved.</p>
            <p className="text-xs text-gray-400 mt-2 sm:mt-0">Connecting 10,000+ Australian schools nationwide</p>
          </div>
        </div>
      </footer>
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
