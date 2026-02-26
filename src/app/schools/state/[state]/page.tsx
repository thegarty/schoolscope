import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SuburbSearch } from '@/components/ui/suburb-search'
import { School, Search, MapPin, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSchoolSlug } from '@/lib/school-utils'
import { UserNavButton } from '@/components/UserNavButton'

// Render at request time — DB (Railway internal) is not reachable during Docker build
export const dynamic = 'force-dynamic'

const VALID_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']

const STATE_NAMES: Record<string, string> = {
  NSW: 'New South Wales',
  VIC: 'Victoria',
  QLD: 'Queensland',
  WA: 'Western Australia',
  SA: 'South Australia',
  TAS: 'Tasmania',
  NT: 'Northern Territory',
  ACT: 'Australian Capital Territory',
}


interface StatePageProps {
  params: { state: string }
  searchParams?: { page?: string; type?: string; sector?: string; suburb?: string }
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const state = params.state.toUpperCase()

  if (!VALID_STATES.includes(state)) {
    return { title: 'State Not Found', description: 'The requested state could not be found.' }
  }

  const stateName = STATE_NAMES[state]
  const schoolCount = await db.school.count({ where: { state } })

  return {
    title: `${stateName} Schools - SchoolScope | ${schoolCount}+ Schools`,
    description: `Discover ${schoolCount}+ schools in ${stateName}, Australia. View school events, calendars, and connect with school communities across ${state}. Government, Catholic, and Independent schools.`,
    keywords: [
      `${stateName} schools`, `${state} schools`, 'Australian schools',
      'school events', 'school calendar', 'school community',
      'government schools', 'catholic schools', 'independent schools',
    ],
    openGraph: {
      title: `${stateName} Schools - SchoolScope`,
      description: `${schoolCount}+ schools in ${stateName}. Connect with school communities and stay updated with events.`,
      type: 'website',
      locale: 'en_AU',
    },
    alternates: { canonical: `/schools/state/${state.toLowerCase()}` },
  }
}

export default async function StateSchoolsPage({ params, searchParams }: StatePageProps) {
  const state = params.state.toUpperCase()

  if (!VALID_STATES.includes(state)) notFound()

  const type = searchParams?.type || ''
  const sector = searchParams?.sector || ''
  const suburb = searchParams?.suburb || ''
  const page = parseInt(searchParams?.page || '1', 10)
  const pageSize = 24

  const [types, sectors, suburbs] = await Promise.all([
    db.school.findMany({ where: { state }, distinct: ['type'], select: { type: true }, orderBy: { type: 'asc' } }),
    db.school.findMany({ where: { state }, distinct: ['sector'], select: { sector: true }, orderBy: { sector: 'asc' } }),
    db.school.findMany({ where: { state }, distinct: ['suburb'], select: { suburb: true }, orderBy: { suburb: 'asc' } }),
  ])

  const where: Record<string, string> = { state }
  if (type) where.type = type
  if (sector) where.sector = sector
  if (suburb) where.suburb = suburb

  const [schools, total, totalSchools, totalEvents] = await Promise.all([
    db.school.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            events: { where: { isPrivate: false, startDate: { gte: new Date() } } },
            children: true,
          },
        },
      },
    }),
    db.school.count({ where }),
    db.school.count({ where: { state } }),
    db.event.count({ where: { school: { state }, isPrivate: false, startDate: { gte: new Date() } } }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const stateName = STATE_NAMES[state]

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
                <Link href="/schools">All Schools</Link>
              </Button>
              <UserNavButton />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">{stateName} Schools</h1>
            <p className="text-xl text-blue-100 mb-6">
              Discover and connect with {totalSchools.toLocaleString()} schools across {stateName}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalSchools.toLocaleString()}</div>
                <div className="text-blue-200">Schools</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{totalEvents.toLocaleString()}</div>
                <div className="text-blue-200">Upcoming Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {schools.reduce((sum, s) => sum + s._count.children, 0).toLocaleString()}
                </div>
                <div className="text-blue-200">Students Connected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            <li><Link href="/" className="hover:text-blue-600">Home</Link></li>
            <li>/</li>
            <li><Link href="/schools" className="hover:text-blue-600">Schools</Link></li>
            <li>/</li>
            <li className="text-gray-900">{stateName}</li>
          </ol>
        </nav>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Filter {stateName} Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select name="type" defaultValue={type} className="border rounded-md px-3 py-2 w-full">
                <option value="">All Types</option>
                {types.map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
              </select>
              <select name="sector" defaultValue={sector} className="border rounded-md px-3 py-2 w-full">
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s.sector} value={s.sector}>{s.sector}</option>)}
              </select>
              <SuburbSearch
                suburbs={suburbs.map(s => s.suburb)}
                defaultValue={suburb}
                name="suburb"
                placeholder="Search suburbs..."
              />
              <Button type="submit" className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Filter Schools
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {total === totalSchools ? 'All Schools' : 'Filtered Results'}
            <span className="text-gray-500 text-lg ml-2">({total.toLocaleString()} schools)</span>
          </h2>
          {(type || sector || suburb) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {type && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Type: {type}</span>}
              {sector && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Sector: {sector}</span>}
              {suburb && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Suburb: {suburb}</span>}
              <Link href={`/schools/state/${state.toLowerCase()}`} className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm hover:bg-gray-200">
                Clear filters
              </Link>
            </div>
          )}
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {schools.map(school => (
            <Card key={school.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{school.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {school.suburb}, {school.state} {school.postcode}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="bg-gray-100 px-2 py-1 rounded">{school.type}</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{school.sector}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {school._count.events} events
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {school._count.children} students
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link href={`/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`}>
                        View School
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-2">
            {page > 1 && (
              <Button asChild variant="outline">
                <Link href={`/schools/state/${state.toLowerCase()}?page=${page - 1}${type ? `&type=${type}` : ''}${sector ? `&sector=${sector}` : ''}${suburb ? `&suburb=${suburb}` : ''}`}>
                  Previous
                </Link>
              </Button>
            )}
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            {page < totalPages && (
              <Button asChild variant="outline">
                <Link href={`/schools/state/${state.toLowerCase()}?page=${page + 1}${type ? `&type=${type}` : ''}${sector ? `&sector=${sector}` : ''}${suburb ? `&suburb=${suburb}` : ''}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        )}

        {/* SEO Content */}
        <section className="mt-12 prose max-w-none">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Schools in {stateName}</h2>
          <p className="text-gray-600 mb-4">
            {stateName} is home to {totalSchools.toLocaleString()} schools across government, Catholic, and independent sectors.
            From primary schools to secondary colleges, {state} offers diverse educational opportunities for students of all ages.
          </p>
          <p className="text-gray-600 mb-4">
            SchoolScope helps families across {stateName} stay connected with their school communities through our comprehensive
            event calendar and school information platform. Join thousands of families who use SchoolScope to never miss
            important school events, from academic activities to sports events and community gatherings.
          </p>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Popular School Types in {stateName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
            {types.slice(0, 6).map(t => (
              <Link
                key={t.type}
                href={`/schools/state/${state.toLowerCase()}?type=${encodeURIComponent(t.type)}`}
                className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{t.type} Schools</div>
                <div className="text-sm text-gray-500">Browse {t.type.toLowerCase()} schools in {stateName}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>

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
