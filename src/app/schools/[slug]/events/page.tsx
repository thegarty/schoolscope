import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, School, MapPin, Clock, Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { createSchoolSlug } from '../page'

interface SchoolEventsPageProps {
  params: { slug: string }
  searchParams?: { category?: string; confirmed?: string; page?: string }
}

// Helper function to find school by slug
async function findSchoolBySlug(slug: string) {
  const schools = await db.school.findMany({
    select: {
      id: true,
      name: true,
      suburb: true,
      state: true
    }
  })

  const school = schools.find(s => 
    createSchoolSlug(s.name, s.suburb, s.state) === slug
  )

  return school?.id || null
}

export async function generateMetadata({ params }: SchoolEventsPageProps): Promise<Metadata> {
  const schoolId = await findSchoolBySlug(params.slug)
  
  if (!schoolId) {
    return {
      title: 'School Not Found',
      description: 'The requested school could not be found.'
    }
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { name: true, suburb: true, state: true }
  })

  if (!school) {
    return {
      title: 'School Not Found',
      description: 'The requested school could not be found.'
    }
  }

  return {
    title: `Events at ${school.name} - ${school.suburb}, ${school.state} | SchoolScope`,
    description: `View all upcoming and past events at ${school.name} in ${school.suburb}, ${school.state}. Stay connected with school activities, meetings, and important dates.`,
    alternates: {
      canonical: `/schools/${params.slug}/events`
    }
  }
}

export default async function SchoolEventsPage({ params, searchParams }: SchoolEventsPageProps) {
  const schoolId = await findSchoolBySlug(params.slug)
  
  if (!schoolId) {
    notFound()
  }

  const school = await db.school.findUnique({
    where: { id: schoolId },
    select: { 
      id: true,
      name: true, 
      suburb: true, 
      state: true, 
      postcode: true,
      type: true,
      sector: true
    }
  })

  if (!school) {
    notFound()
  }

  // Filters
  const category = searchParams?.category || ''
  const confirmed = searchParams?.confirmed || ''
  const page = parseInt(searchParams?.page || '1', 10)
  const pageSize = 20

  // Build query
  const where: any = {
    schoolId: school.id
  }
  
  if (category) where.category = category
  if (confirmed === 'true') where.confirmed = true
  if (confirmed === 'false') where.confirmed = false

  // Get events
  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      include: {
        user: true
      },
      orderBy: { startDate: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    db.event.count({ where })
  ])

  const totalPages = Math.ceil(total / pageSize)

  // Get distinct categories for filter
  const categories = await db.event.findMany({
    where: { schoolId: school.id },
    distinct: ['category'],
    select: { category: true },
    orderBy: { category: 'asc' }
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
                <Link href={`/schools/${params.slug}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to School
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* School Header */}
      <section className="bg-blue-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center mb-4">
            <Link 
              href={`/schools/${params.slug}`}
              className="text-blue-200 hover:text-white mr-4"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{school.name} Events</h1>
              <div className="flex items-center text-blue-100 mt-2">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{school.suburb}, {school.state} {school.postcode}</span>
                <span className="mx-2">•</span>
                <span>{school.type} • {school.sector}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Filters */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filter Events</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Button type="submit" className="md:col-span-2">Apply Filters</Button>
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
                  No events match your current filters for {school.name}.
                </p>
                <Button asChild>
                  <Link href="/events/create">Create Event</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Showing {events.length} of {total} events
              </div>
              <div className="space-y-4">
                {events.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="flex items-center">
                            {event.title}
                            <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.confirmed 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.confirmed ? 'Confirmed' : 'Pending'}
                            </span>
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {event.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>Year Levels: {event.yearLevels.join(', ')}</span>
                          </div>
                          <div className="text-sm text-gray-500">
                            Category: {event.category}
                          </div>
                          <div className="text-xs text-gray-400">
                            Created by: {event.user.name || event.user.email}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?category=${encodeURIComponent(category)}&confirmed=${encodeURIComponent(confirmed)}&page=${p}`}
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