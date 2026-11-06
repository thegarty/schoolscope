import AppFooter from '@/components/AppFooter'
import { db } from '@/lib/db'
import { validateRequest } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SuburbSearch } from '@/components/ui/suburb-search'
import { School, Search, MapPin } from 'lucide-react'
import Link from 'next/link'
import { createSchoolSlug } from '@/lib/school-utils'
import { Suspense } from 'react'
import { SchoolSearchTracker } from '@/components/SchoolSearchTracker'
import AppHeader from '@/components/AppHeader'

export const dynamic = 'force-dynamic'

export default async function BrowseSchoolsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string>>
}) {
  const { user } = await validateRequest()
  const resolvedSearchParams = (await searchParams) ?? {}
  // Filters
  const name = resolvedSearchParams.name?.trim() || ''
  const suburb = resolvedSearchParams.suburb?.trim() || ''
  const state = resolvedSearchParams.state || ''
  const type = resolvedSearchParams.type || ''
  const sector = resolvedSearchParams.sector || ''
  const page = parseInt(resolvedSearchParams.page || '1', 10)
  const pageSize = 20

  // Get distinct values for filters
  const [states, types, sectors, suburbs, totalSchoolCount] = await Promise.all([
    db.school.findMany({ distinct: ['state'], select: { state: true }, orderBy: { state: 'asc' } }),
    db.school.findMany({ distinct: ['type'], select: { type: true }, orderBy: { type: 'asc' } }),
    db.school.findMany({ distinct: ['sector'], select: { sector: true }, orderBy: { sector: 'asc' } }),
    db.school.findMany({ distinct: ['suburb'], select: { suburb: true }, orderBy: { suburb: 'asc' } }),
    db.school.count()
  ])

  // Build query dynamically
  const where: any = {}
  if (name) {
    where.name = { contains: name, mode: 'insensitive' }
  }
  if (suburb) where.suburb = suburb
  if (state) where.state = state
  if (type) where.type = type
  if (sector) where.sector = sector

  // Only show results if at least one filter or search is set
  const hasQuery = !!name || !!suburb || !!state || !!type || !!sector
  let schools: any[] = []
  let total = 0
  let totalPages = 0
  if (hasQuery) {
    [schools, total] = await Promise.all([
      db.school.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize
      }),
      db.school.count({ where })
    ])
    totalPages = Math.ceil(total / pageSize)
  }

  const pageLink = (targetPage: number) => `?name=${encodeURIComponent(name)}&suburb=${encodeURIComponent(suburb)}&state=${encodeURIComponent(state)}&type=${encodeURIComponent(type)}&sector=${encodeURIComponent(sector)}&page=${targetPage}`
  const visiblePages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => Math.min(Math.max(1, page - 2), Math.max(1, totalPages - 4)) + index)

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={null}>
        <SchoolSearchTracker />
      </Suspense>
      <AppHeader user={user} />

      {/* Hero Section */}
      <section className="bg-secondary/60 text-foreground py-6 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Find your school</h1>
            <p className="text-base sm:text-lg text-muted-foreground mb-3">
              School details, events, and community, all in one place.
            </p>
            <div className="flex items-center justify-center text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 mr-2" />
              <span>{totalSchoolCount.toLocaleString()} schools across Australia</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
        {/* Search Form */}
        <Card className="mb-8">

          <CardContent className="pt-5 sm:pt-6">
            <form className="grid grid-cols-1 md:grid-cols-5 gap-4 [&_input]:min-h-12 [&_input]:rounded-xl [&_input]:text-base [&_input]:pr-12 [&_button]:min-h-11">
              <input
                type="text"
                name="name"
                aria-label="School name"
                placeholder="School name..."
                defaultValue={name}
                className="min-h-12 border border-input rounded-xl bg-white text-base px-3 py-3 w-full"
              />
              <SuburbSearch 
                suburbs={suburbs.map(s => s.suburb)}
                defaultValue={suburb}
                name="suburb"
                placeholder="Search suburbs..."
              />
              <select aria-label="State or territory" name="state" defaultValue={state} className="min-h-12 border border-input rounded-xl bg-white text-base px-3 py-3 w-full">
                <option value="">All States</option>
                {states.map((s) => (
                  <option key={s.state} value={s.state}>{s.state}</option>
                ))}
              </select>
              <select aria-label="School type" name="type" defaultValue={type} className="min-h-12 border border-input rounded-xl bg-white text-base px-3 py-3 w-full">
                <option value="">All Types</option>
                {types.map((t) => (
                  <option key={t.type} value={t.type}>{t.type}</option>
                ))}
              </select>
              <select aria-label="School sector" name="sector" defaultValue={sector} className="min-h-12 border border-input rounded-xl bg-white text-base px-3 py-3 w-full">
                <option value="">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s.sector} value={s.sector}>{s.sector}</option>
                ))}
              </select>
              <Button type="submit" className="md:col-span-5 w-full">
                <Search className="h-4 w-4 mr-2" />
                Search Schools
              </Button>
            </form>
          </CardContent>
        </Card>

        {!hasQuery && (
          <Card>
            <CardContent className="text-center py-16">
              <School className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-4">Ready to Find Schools?</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Use the search form above to find schools by name, location, or filter by state, type, and sector. 
                We have over 10,000 Australian schools in our database.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-sm text-muted-foreground">
                <div className="flex items-center justify-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>All States</span>
                </div>
                <div className="flex items-center justify-center">
                  <School className="h-4 w-4 mr-1" />
                  <span>All Types</span>
                </div>
                <div className="flex items-center justify-center">
                  <Search className="h-4 w-4 mr-1" />
                  <span>Easy Search</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasQuery && schools.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No schools found</h3>
              <p className="text-muted-foreground mb-4">
                No schools match your current search criteria. Try adjusting your search terms or filters.
              </p>
              <div className="text-sm text-muted-foreground">
                <p>Search tips:</p>
                <ul className="mt-2 space-y-1">
                  <li>• Try searching with just the suburb name</li>
                  <li>• Remove some filters to broaden your search</li>
                  <li>• Check your spelling</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {hasQuery && schools.length > 0 && (
          <>
            {/* Results Summary */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Search Results
                <span className="text-muted-foreground text-lg ml-2">({total.toLocaleString()} schools)</span>
              </h3>
              {(name || suburb || state || type || sector) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {name && <span className="bg-secondary text-primary px-2 py-1 rounded text-sm">Name: {name}</span>}
                  {suburb && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Suburb: {suburb}</span>}
                  {state && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">State: {state}</span>}
                  {type && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">Type: {type}</span>}
                  {sector && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Sector: {sector}</span>}
                  <Link href="/schools" className="bg-secondary text-foreground px-2 py-1 rounded-xl min-h-11 inline-flex items-center text-sm hover:bg-accent">
                    Clear all filters
                  </Link>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total} results
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
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
                      <div className="flex flex-col sm:flex-row gap-2 pt-2">
                        <Button asChild variant="outline" size="sm" className="flex-1">
                          <Link href={`/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`}>
                            View School
                          </Link>
                        </Button>
                        {user && (
                          <form action={`/children/add`} method="GET" className="flex-1">
                            <input type="hidden" name="schoolId" value={school.id} />
                            <Button type="submit" size="sm" className="w-full">Add Child</Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Pagination */}
            <nav aria-label="School search pages" className="flex flex-wrap justify-center items-center gap-2 mt-8">
              {page > 1 && <Button asChild variant="outline" size="sm"><Link href={pageLink(page - 1)}>Previous</Link></Button>}
              {visiblePages.map(p => (
                <Link
                  key={p}
                  href={pageLink(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                  className={`inline-flex min-h-11 min-w-11 items-center justify-center px-3 py-2 rounded-xl border font-semibold ${p === page ? 'bg-primary text-primary-foreground' : 'bg-white text-primary hover:bg-accent'}`}
                >
                  {p}
                </Link>
              ))}
              {page < totalPages && <Button asChild variant="outline" size="sm"><Link href={pageLink(page + 1)}>Next</Link></Button>}
            </nav>
          </>
        )}
      </main>

      {/* Footer */}
      <AppFooter />
    </div>
  )
} 