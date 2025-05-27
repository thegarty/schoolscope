import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, School, MapPin, Phone, Globe, Users, Clock, Edit } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import SchoolCalendar from '@/components/SchoolCalendar'
import SchoolInfoEditor from '@/components/SchoolInfoEditor'
import { validateRequest } from '@/auth/lucia'
import { createSchoolSlug, findSchoolBySlug } from '@/lib/school-utils'

interface SchoolPageProps {
  params: { slug: string }
  searchParams?: { month?: string; year?: string; tab?: string }
}



export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const schoolId = await findSchoolBySlug(params.slug, db)
  
  if (!schoolId) {
    return {
      title: 'School Not Found',
      description: 'The requested school could not be found.'
    }
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { 
      name: true, 
      suburb: true, 
      state: true, 
      type: true, 
      sector: true,
      postcode: true
    }
  })

  if (!school) {
    return {
      title: 'School Not Found',
      description: 'The requested school could not be found.'
    }
  }

  return {
    title: `${school.name} - ${school.suburb}, ${school.state} | SchoolScope`,
    description: `View events, calendar and information for ${school.name}, a ${school.type} ${school.sector} school in ${school.suburb}, ${school.state} ${school.postcode}. Stay connected with the school community.`,
    keywords: [
      school.name,
      school.suburb,
      school.state,
      school.type,
      school.sector,
      'school events',
      'school calendar',
      'Australian schools',
      'school community'
    ],
    openGraph: {
      title: `${school.name} - SchoolScope`,
      description: `Events and calendar for ${school.name} in ${school.suburb}, ${school.state}`,
      type: 'website',
      locale: 'en_AU',
    },
    alternates: {
      canonical: `/schools/${params.slug}`
    }
  }
}

export default async function SchoolPage({ params, searchParams }: SchoolPageProps) {
  const schoolId = await findSchoolBySlug(params.slug, db)
  
  if (!schoolId) {
    notFound()
  }

  // Get current user for school editing permissions
  const { user } = await validateRequest()

  const school = await db.school.findUnique({
    where: { id: schoolId },
    include: {
      events: {
        where: {
          startDate: { gte: new Date() },
          isPrivate: false // Only show public events
        },
        orderBy: { startDate: 'asc' },
        take: 10,
        include: {
          user: true
        }
      },
      children: {
        include: {
          user: true
        }
      }
    }
  })

  if (!school) {
    notFound()
  }

  // Get pending school edits if user is logged in
  let pendingEdits: any[] = []
  if (user) {
    try {
      pendingEdits = await db.schoolEdit.findMany({
        where: { 
          schoolId: school.id,
          status: 'PENDING'
        },
        include: {
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
        orderBy: { createdAt: 'desc' }
      })
    } catch (error) {
      // If the table doesn't exist yet, just continue without edits
      console.log('School edits table not available yet')
    }
  }

  // Get current month/year for calendar
  const currentDate = new Date()
  const month = searchParams?.month ? parseInt(searchParams.month) : currentDate.getMonth() + 1
  const year = searchParams?.year ? parseInt(searchParams.year) : currentDate.getFullYear()
  const activeTab = searchParams?.tab || 'calendar'

  // Get events for the calendar month
  const startOfMonth = new Date(year, month - 1, 1)
  const endOfMonth = new Date(year, month, 0)
  
  const monthEvents = await db.event.findMany({
    where: {
      schoolId: school.id,
      isPrivate: false, // Only show public events
      startDate: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    orderBy: { startDate: 'asc' }
  })

  const totalStudents = school.children.length
  const totalEvents = await db.event.count({
    where: { 
      schoolId: school.id,
      isPrivate: false // Only count public events
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
              <Link href="/" className="text-2xl font-bold text-gray-900">SchoolScope</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/schools">Browse Schools</Link>
              </Button>
              {user ? (
                <Button asChild variant="outline">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/login">Login</Link>
                </Button>
              )}
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
                    <a 
                      href={school.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
                {school.phone && (
                  <div className="flex items-center">
                    <Phone className="h-5 w-5 mr-2" />
                    <a href={`tel:${school.phone}`} className="hover:underline">
                      {school.phone}
                    </a>
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
                    <span className="font-semibold">{school.events.length}</span>
                  </div>
                  {pendingEdits.length > 0 && (
                    <div className="flex justify-between">
                      <span>Pending Updates:</span>
                      <span className="font-semibold text-yellow-200">{pendingEdits.length}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <Link
              href={`/schools/${params.slug}?tab=calendar`}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'calendar'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Calendar & Events
            </Link>
            {user && (
              <Link
                href={`/schools/${params.slug}?tab=info`}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'info'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                School Information
                {pendingEdits.length > 0 && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {pendingEdits.length}
                  </span>
                )}
              </Link>
            )}
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
                    schoolSlug={params.slug}
                    events={monthEvents}
                    currentMonth={month}
                    currentYear={year}
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
                  {school.events.length > 0 ? (
                    <div className="space-y-4">
                      {school.events.slice(0, 5).map((event) => (
                        <div key={event.id} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-semibold text-sm">{event.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {new Date(event.startDate).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.category}
                          </p>
                        </div>
                      ))}
                      {school.events.length > 5 && (
                        <Link 
                          href={`/schools/${params.slug}/events`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View all {school.events.length} upcoming events →
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
                  {user ? (
                    <>
                      <Button asChild className="w-full">
                        <Link href={`/children/add?schoolId=${school.id}`}>
                          <Users className="h-4 w-4 mr-2" />
                          Add Child to This School
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href="/events/create">
                          <Calendar className="h-4 w-4 mr-2" />
                          Create Event
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-3">
                        Login to add children and create events
                      </p>
                      <Button asChild className="w-full">
                        <Link href="/login">
                          Login / Register
                        </Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          // School Information Tab
          user && (
            <div className="max-w-4xl mx-auto">
              <SchoolInfoEditor 
                school={school}
                pendingEdits={pendingEdits}
                currentUserId={user.id}
              />
            </div>
          )
        )}
      </main>

      {/* SEO Content */}
      <section className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About {school.name}
            </h2>
            <p className="text-gray-600 mb-4">
              {school.name} is a {school.type.toLowerCase()} {school.sector.toLowerCase()} school located in {school.suburb}, {school.state}. 
              Our school community uses SchoolScope to stay connected and informed about important events, activities, and announcements.
            </p>
            <p className="text-gray-600 mb-4">
              Join our growing community of {totalStudents} students and families who use SchoolScope to never miss important school events. 
              From academic activities to sports events, parent meetings to school holidays, our calendar keeps everyone in the loop.
            </p>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              School Events and Activities
            </h3>
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
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center mb-4">
                <School className="h-6 w-6 mr-2" />
                <span className="font-bold text-xl">SchoolScope</span>
              </div>
              <p className="text-gray-400 text-sm">
                Connecting Australian school communities through events, calendars, and information sharing.
              </p>
            </div>

            {/* Schools by State */}
            <div>
              <h3 className="font-semibold mb-4">Schools by State</h3>
              <div className="space-y-2">
                <Link href="/schools/state/nsw" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  New South Wales Schools
                </Link>
                <Link href="/schools/state/vic" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Victoria Schools
                </Link>
                <Link href="/schools/state/qld" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Queensland Schools
                </Link>
                <Link href="/schools/state/wa" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Western Australia Schools
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">More States</h3>
              <div className="space-y-2">
                <Link href="/schools/state/sa" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  South Australia Schools
                </Link>
                <Link href="/schools/state/tas" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Tasmania Schools
                </Link>
                <Link href="/schools/state/nt" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Northern Territory Schools
                </Link>
                <Link href="/schools/state/act" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  ACT Schools
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link href="/schools" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Browse All Schools
                </Link>
                <Link href="/register" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Join SchoolScope
                </Link>
                <Link href="/privacy" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block text-sm text-gray-400 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-xs text-gray-400">
              © 2024 SchoolScope. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-2 sm:mt-0">
              Connecting 10,000+ Australian schools nationwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

 