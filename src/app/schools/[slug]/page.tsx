import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Button } from '@/components/ui/button'
import { School, MapPin, Phone, Globe, Users } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { UserNavButton } from '@/components/UserNavButton'
import { SchoolPageTabs } from '@/components/SchoolPageTabs'
import { findSchoolBySlug, createSchoolSlug } from '@/lib/school-utils'

// ISR: re-render in background every 30 days; calendar navigation is client-side so events stay live
export const revalidate = 2592000
export const dynamicParams = true

export async function generateStaticParams() {
  try {
    const schools = await db.school.findMany({
      select: { name: true, suburb: true, state: true, _count: { select: { events: true, children: true } } },
      orderBy: [{ events: { _count: 'desc' } }, { children: { _count: 'desc' } }],
      take: 300,
    })
    return schools.map(s => ({ slug: createSchoolSlug(s.name, s.suburb, s.state) }))
  } catch {
    return []
  }
}

interface SchoolPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const schoolId = await findSchoolBySlug(params.slug, db)

  if (!schoolId) {
    return { title: 'School Not Found', description: 'The requested school could not be found.' }
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { name: true, suburb: true, state: true, type: true, sector: true, postcode: true },
  })

  if (!school) {
    return { title: 'School Not Found', description: 'The requested school could not be found.' }
  }

  return {
    title: `${school.name} - ${school.suburb}, ${school.state} | SchoolScope`,
    description: `View events, calendar and information for ${school.name}, a ${school.type} ${school.sector} school in ${school.suburb}, ${school.state} ${school.postcode}. Stay connected with the school community.`,
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
    alternates: { canonical: `/schools/${params.slug}` },
  }
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const schoolId = await findSchoolBySlug(params.slug, db)

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <School className="h-8 w-8 text-blue-600 mr-3" />
              <Link href="/" className="text-2xl font-bold text-gray-900">SchoolScope</Link>
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
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h1 className="text-4xl font-bold mb-4">{school.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-blue-100 mb-4">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{school.suburb}, {school.state} {school.postcode}</span>
                </div>
                <div className="flex items-center">
                  <School className="h-5 w-5 mr-2" />
                  <span>{school.type} • {school.sector}</span>
                </div>
                {school.website && (
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 mr-2" />
                    <a href={school.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      Visit Website
                    </a>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    <a href={`tel:${school.phone}`} className="hover:underline">{school.phone}</a>
                  </div>
                )}
              </div>
              <p className="text-blue-100 text-lg">
                Stay connected with {school.name}'s community through our event calendar and school information.
              </p>
            </div>
            <div className="lg:col-span-1">
              <div className="bg-blue-700 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Students on Platform:</span>
                    <span className="font-semibold">{totalStudents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Events:</span>
                    <span className="font-semibold">{totalEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Upcoming Events:</span>
                    <span className="font-semibold">{upcomingEvents.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs + Content (client component) */}
      <SchoolPageTabs
        school={schoolForClient}
        schoolSlug={params.slug}
        monthEvents={serializedMonthEvents}
        upcomingEvents={serializedUpcomingEvents}
        currentMonth={currentMonth}
        currentYear={currentYear}
      />

      {/* SEO Content */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About {school.name}</h2>
            <p className="text-gray-600 mb-4">
              {school.name} is a {school.type.toLowerCase()} {school.sector.toLowerCase()} school located in {school.suburb}, {school.state}.
              Our school community uses SchoolScope to stay connected and informed about important events, activities, and announcements.
            </p>
            <p className="text-gray-600 mb-4">
              Join our growing community of {totalStudents} students and families who use SchoolScope to never miss important school events.
              From academic activities to sports events, parent meetings to school holidays, our calendar keeps everyone in the loop.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">School Events and Activities</h3>
            <p className="text-gray-600">
              Stay up to date with all the latest happenings at {school.name}. Our community-driven calendar includes events across all year levels,
              from Kindergarten to Year 12. Whether you're looking for academic events, sports activities, arts and culture programs, or social events,
              you'll find everything you need to stay connected with your school community.
            </p>
          </div>
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
    </div>
  )
}
