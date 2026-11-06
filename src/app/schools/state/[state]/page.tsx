import AppFooter from '@/components/AppFooter'
import { db } from '@/lib/db'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SuburbSearch } from '@/components/ui/suburb-search'
import { School, Search, MapPin, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createSchoolSlug } from '@/lib/school-utils'
import AppHeader from '@/components/AppHeader'
import { validateRequest } from '@/lib/auth'

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
  params: Promise<{ state: string }>
  searchParams?: Promise<{ page?: string; type?: string; sector?: string; suburb?: string }>
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: rawState } = await params
  const state = rawState.toUpperCase()

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
  const { user } = await validateRequest()
  const { state: rawState } = await params
  const state = rawState.toUpperCase()
  const resolvedSearchParams = (await searchParams) ?? {}

  if (!VALID_STATES.includes(state)) notFound()

  const type = resolvedSearchParams.type || ''
  const sector = resolvedSearchParams.sector || ''
  const suburb = resolvedSearchParams.suburb || ''
  const page = parseInt(resolvedSearchParams.page || '1', 10)
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
    <div className="min-h-screen bg-background">
      <AppHeader user={user} />

      {/* Hero Section */}
      <section className="bg-secondary/60 text-foreground py-10 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">{stateName} Schools</h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-6">
              Discover and connect with {totalSchools.toLocaleString()} schools across {stateName}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold">{totalSchools.toLocaleString()}</div>
                <div className="text-muted-foreground">Schools</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{totalEvents.toLocaleString()}</div>
                <div className="text-muted-foreground">Upcoming Events</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {schools.reduce((sum, s) => sum + s._count.children, 0).toLocaleString()}
                </div>
                <div className="text-muted-foreground">Students Connected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <li><Link href="/" className="inline-flex items-center min-h-11 hover:text-primary">Home</Link></li>
            <li>/</li>
            <li><Link href="/schools" className="inline-flex items-center min-h-11 hover:text-primary">Schools</Link></li>
            <li>/</li>
            <li className="text-foreground">{stateName}</li>
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
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4 [&_input]:min-h-12 [&_input]:rounded-xl [&_input]:text-base [&_input]:pr-12 [&_button]:min-h-11">
              <select aria-label="School type" name="type" defaultValue={type} className="min-h-12 border border-input rounded-xl bg-white text-base px-3 py-3 w-full">
                <option value="">All Types</option>
                {types.map(t => <option key={t.type} value={t.type}>{t.type}</option>)}
              </select>
              <select aria-label="School sector" name="sector" defaultValue={sector} className="min-h-12 border border-input rounded-xl bg-white text-base px-3 py-3 w-full">
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
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {total === totalSchools ? 'All Schools' : 'Filtered Results'}
            <span className="text-muted-foreground text-lg ml-2">({total.toLocaleString()} schools)</span>
          </h2>
          {(type || sector || suburb) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {type && <span className="bg-secondary text-primary px-2 py-1 rounded text-sm">Type: {type}</span>}
              {sector && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Sector: {sector}</span>}
              {suburb && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Suburb: {suburb}</span>}
              <Link href={`/schools/state/${state.toLowerCase()}`} className="bg-secondary text-foreground px-2 py-1 rounded-xl min-h-11 inline-flex items-center text-sm hover:bg-accent">
                Clear filters
              </Link>
            </div>
          )}
        </div>

        {/* Schools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {schools.map(school => (
            <Card key={school.id} className="hover:border-primary/30 hover:shadow-sm transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg break-words">{school.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {school.suburb}, {school.state} {school.postcode}
                  </div>
                  <div className="flex flex-wrap gap-2 items-center justify-between text-sm">
                    <span className="bg-secondary px-2 py-1 rounded">{school.type}</span>
                    <span className="bg-secondary text-primary px-2 py-1 rounded">{school.sector}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center justify-between text-sm text-muted-foreground">
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
          <div className="flex flex-wrap justify-center items-center gap-3">
            {page > 1 && (
              <Button asChild variant="outline">
                <Link href={`/schools/state/${state.toLowerCase()}?page=${page - 1}${type ? `&type=${type}` : ''}${sector ? `&sector=${sector}` : ''}${suburb ? `&suburb=${suburb}` : ''}`}>
                  Previous
                </Link>
              </Button>
            )}
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
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
          <h2 className="text-2xl font-bold text-foreground mb-4">About Schools in {stateName}</h2>
          <p className="text-muted-foreground mb-4">
            {stateName} is home to {totalSchools.toLocaleString()} schools across government, Catholic, and independent sectors.
            From primary schools to secondary colleges, {state} offers diverse educational opportunities for students of all ages.
          </p>
          <p className="text-muted-foreground mb-4">
            SchoolScope helps families across {stateName} stay connected with their school communities through our comprehensive
            event calendar and school information platform. Join thousands of families who use SchoolScope to never miss
            important school events, from academic activities to sports events and community gatherings.
          </p>
          <h3 className="text-xl font-semibold text-foreground mb-3">Popular School Types in {stateName}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose">
            {types.slice(0, 6).map(t => (
              <Link
                key={t.type}
                href={`/schools/state/${state.toLowerCase()}?type=${encodeURIComponent(t.type)}`}
                className="block p-4 min-h-12 border rounded-2xl bg-white hover:bg-background transition-colors"
              >
                <div className="font-medium text-foreground">{t.type} Schools</div>
                <div className="text-sm text-muted-foreground">Browse {t.type.toLowerCase()} schools in {stateName}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  )
}
