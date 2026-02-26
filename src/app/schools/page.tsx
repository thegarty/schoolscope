import { db } from '@/lib/db'
import { validateRequest } from '@/auth/lucia'
import { logout } from '@/lib/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SuburbSearch } from '@/components/ui/suburb-search'
import { School, Search, MapPin } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSchoolSlug } from '@/lib/school-utils'
import { Suspense } from 'react'
import { SchoolSearchTracker } from '@/components/SchoolSearchTracker'

export const dynamic = 'force-dynamic'

export default async function BrowseSchoolsPage({ searchParams }: { searchParams?: Record<string, string> }) {
  const { user } = await validateRequest()
  // Filters
  const name = searchParams?.name?.trim() || ''
  const suburb = searchParams?.suburb?.trim() || ''
  const state = searchParams?.state || ''
  const type = searchParams?.type || ''
  const sector = searchParams?.sector || ''
  const page = parseInt(searchParams?.page || '1', 10)
  const pageSize = 20

  // Get distinct values for filters
  const [states, types, sectors, suburbs] = await Promise.all([
    db.school.findMany({ distinct: ['state'], select: { state: true }, orderBy: { state: 'asc' } }),
    db.school.findMany({ distinct: ['type'], select: { type: true }, orderBy: { type: 'asc' } }),
    db.school.findMany({ distinct: ['sector'], select: { sector: true }, orderBy: { sector: 'asc' } }),
    db.school.findMany({ distinct: ['suburb'], select: { suburb: true }, orderBy: { suburb: 'asc' } })
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={null}>
        <SchoolSearchTracker />
      </Suspense>
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
                  <form action={logout}>
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
            Search by school name, suburb, state, type, and sector to find schools and view their events and information.
          </p>
        </div>
        
        {/* Search Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Search className="h-5 w-5 mr-2" />
              Search Australian Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                name="name"
                placeholder="School name..."
                defaultValue={name}
                className="border rounded-md px-3 py-2 w-full"
              />
              <SuburbSearch 
                suburbs={suburbs.map(s => s.suburb)}
                defaultValue={suburb}
                name="suburb"
                placeholder="Search suburbs..."
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
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results
                <span className="text-gray-500 text-lg ml-2">({total.toLocaleString()} schools)</span>
              </h3>
              {(name || suburb || state || type || sector) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {name && <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">Name: {name}</span>}
                  {suburb && <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm">Suburb: {suburb}</span>}
                  {state && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">State: {state}</span>}
                  {type && <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">Type: {type}</span>}
                  {sector && <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">Sector: {sector}</span>}
                  <Link href="/schools" className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm hover:bg-gray-200">
                    Clear all filters
                  </Link>
                </div>
              )}
              <p className="text-sm text-gray-600">
                Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, total)} of {total} results
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {schools.map((school) => (
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
            <div className="flex justify-center mt-8 space-x-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={`?name=${encodeURIComponent(name)}&suburb=${encodeURIComponent(suburb)}&state=${encodeURIComponent(state)}&type=${encodeURIComponent(type)}&sector=${encodeURIComponent(sector)}&page=${p}`}
                  className={`px-3 py-1 rounded-md border ${p === page ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'}`}
                >
                  {p}
                </Link>
              ))}
            </div>
          </>
        )}
      </main>

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
              © 2026 SchoolScope. All rights reserved.
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