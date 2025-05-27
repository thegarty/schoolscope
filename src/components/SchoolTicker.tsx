'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { School, Calendar, Users, MapPin } from 'lucide-react'

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

interface School {
  id: string
  name: string
  suburb: string
  state: string
  _count: {
    events: number
    children: number
  }
}

interface TickerData {
  schools: School[]
  totalSchools: number
  totalEvents: number
  totalStudents: number
}

export default function SchoolTicker() {
  const [data, setData] = useState<TickerData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/schools/ticker')
        if (response.ok) {
          const tickerData = await response.json()
          setData(tickerData)
        }
      } catch (error) {
        console.error('Failed to fetch ticker data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              Connecting Australian Schools
            </h2>
            <p className="text-blue-100">Loading school data...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container px-4 md:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">
              Connecting 10,000+ Australian Schools
            </h2>
            <p className="text-blue-100">
              Thousands of upcoming events • Students connected nationwide
            </p>
            <div className="text-center mt-6">
              <Link 
                href="/schools" 
                className="inline-flex items-center text-blue-200 hover:text-white transition-colors"
              >
                <School className="h-4 w-4 mr-2" />
                Browse All Schools
              </Link>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Connecting {data.totalSchools.toLocaleString()}+ Australian Schools
          </h2>
          <p className="text-blue-100">
            {data.totalEvents.toLocaleString()} upcoming events • {data.totalStudents.toLocaleString()} students connected
          </p>
        </div>
        
        {/* Scrolling ticker */}
        <div className="relative">
          <div className="flex animate-scroll space-x-8">
            {/* First set of schools */}
            {data.schools.map((school) => (
              <Link
                key={`first-${school.id}`}
                href={`/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`}
                className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors min-w-[280px]"
              >
                <div className="flex items-start space-x-3">
                  <School className="h-6 w-6 text-blue-200 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {school.name}
                    </h3>
                    <div className="flex items-center text-blue-200 text-sm mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{school.suburb}, {school.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-100 text-xs mt-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {school._count.events} events
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {school._count.children} students
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {data.schools.map((school) => (
              <Link
                key={`second-${school.id}`}
                href={`/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`}
                className="flex-shrink-0 bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors min-w-[280px]"
              >
                <div className="flex items-start space-x-3">
                  <School className="h-6 w-6 text-blue-200 mt-1" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">
                      {school.name}
                    </h3>
                    <div className="flex items-center text-blue-200 text-sm mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{school.suburb}, {school.state}</span>
                    </div>
                    <div className="flex items-center justify-between text-blue-100 text-xs mt-2">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {school._count.events} events
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {school._count.children} students
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
        
        <div className="text-center mt-6">
          <Link 
            href="/schools" 
            className="inline-flex items-center text-blue-200 hover:text-white transition-colors"
          >
            <School className="h-4 w-4 mr-2" />
            Browse All Schools
          </Link>
        </div>
      </div>
    </section>
  )
} 