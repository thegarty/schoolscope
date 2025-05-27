import { db } from '@/lib/db'
import { validateRequest } from '@/auth/lucia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { School, Search, MapPin } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

// Helper function to create a slug from school name and suburb
function createSchoolSlug(name: string, suburb: string, state: string): string {
  const combined = `${name} ${suburb} ${state}`
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .trim()
}

export const dynamic = 'force-dynamic'

export default async function BrowseSchoolsPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const { user } = await validateRequest()
  // Filters
  const q = searchParams?.q?.trim() || ''
  const state = searchParams?.state || ''
  const type = searchParams?.type || ''
  const sector = searchParams?.sector || ''
  const page = parseInt(searchParams?.page || '1', 10)
  const pageSize = 20

  // Get distinct values for filters
  const [states, types, sectors] = await Promise.all([
    db.school.findMany({ distinct: ['state'], select: { state: true }, orderBy: { state: 'asc' } }),
    db.school.findMany({ distinct: ['type'], select: { type: true }, orderBy: { type: 'asc' } }),
    db.school.findMany({ distinct: ['sector'], select: { sector: true }, orderBy: { sector: 'asc' } })
  ])

  // Build query dynamically
  const where: any = {}
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { suburb: { contains: q, mode: 'insensitive' } },
      { postcode: { contains: q, mode: 'insensitive' } }
    ]
  }
  if (state) where.state = state
  if (type) where.type = type
  if (sector) where.sector = sector

  // Only show results if at least one filter or search is set
  const hasQuery = !!q || !!state || !!type || !!sector
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
              {user ? (
                <>
                  <Button asChild variant="outline">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <span className="text-sm text-gray-700">Welcome, {user.name || user.email}</span>
                  <form action="/api/auth/logout" method="POST">
                    <Button variant="outline" type="submit">
                      Logout
                    </Button>
                  </form>
                </>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Register</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Browse Australian Schools</h1>
            <p className="text-xl text-blue-100 mb-6">
              Discover schools across Australia and connect with their communities
            </p>
            <div className="flex items-center justify-center text-blue-100">
              <MapPin className="h-5 w-5 mr-2" />
              <span>10,868+ schools across all states and territories</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Find Your School</h2>
          <p className="text-gray-600">
            Search by school name, suburb, or postcode to find schools and view their events and information.
          </p>
        </div>
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                name="q"
                placeholder="Search by name, suburb, postcode..."
                defaultValue={q}
                className="border rounded-md px-3 py-2 w-full"
              />
              <select name="state" defaultValue={state} className="border rounded-md px-3 py-2 w-full">
                <option value="">All States</option>
                {states.map((s) => (
                  <option key={s.state} value={s.state}>{s.state}</option>
                ))}
              </select>
              <select name="type" defaultValue={type} className="border rounded-md px-3 py-2 w-full">
                <option value="">All Types</option>
                {types.map((t) => (
                  <option key={t.type} value={t.type}>{t.type}</option>
                ))}
              </select>
              <select name="sector" defaultValue={sector} className="border rounded-md px-3 py-2 w-full">
                <option value="">All Sectors</option>
                {sectors.map((s) => (
                  <option key={s.sector} value={s.sector}>{s.sector}</option>
                ))}
              </select>
              <Button type="submit" className="md:col-span-4 w-full mt-2">
                <Search className="h-4 w-4 mr-2" />
                Search Schools
              </Button>
            </form>
          </CardContent>
        </Card>

        {!hasQuery && (
          <Card>
            <CardContent className="text-center py-16">
              <School className="h-16 w-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Ready to Find Schools?</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Use the search form above to find schools by name, location, or filter by state, type, and sector. 
                We have over 10,000 Australian schools in our database.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto text-sm text-gray-500">
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
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No schools found</h3>
              <p className="text-gray-600 mb-4">
                No schools match your current search criteria. Try adjusting your search terms or filters.
              </p>
              <div className="text-sm text-gray-500">
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
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {total} school{total !== 1 ? 's' : ''} found
                </h3>
                <p className="text-sm text-gray-600">
                  Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total} results
                </p>
              </div>
              {user && (
                <div className="text-sm text-gray-600">
                  Click "View School" to see events and calendar
                </div>
              )}
            </div>
            
            <div className="grid gap-4">
              {schools.map((school) => (
                <Card key={school.id}>
                  <CardHeader>
                    <CardTitle>{school.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-sm text-gray-700">{school.suburb}, {school.state} {school.postcode}</div>
                        <div className="text-xs text-gray-500">{school.type} | {school.sector}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`}>View School</Link>
                        </Button>
                        {user && (
                          <form action={`/children/add`} method="GET">
                            <input type="hidden" name="schoolId" value={school.id} />
                            <Button type="submit" size="sm">Add to My Children</Button>
                          </form>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {/* Pagination */}
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?q=${encodeURIComponent(q)}&state=${encodeURIComponent(state)}&type=${encodeURIComponent(type)}&sector=${encodeURIComponent(sector)}&page=${p}`}
                  className={`px-3 py-1 rounded-md border ${p === page ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
} 