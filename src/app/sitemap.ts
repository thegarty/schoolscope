import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://schoolscope.com.au'

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/schools`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // State pages
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']
  const statePages = states.map(state => ({
    url: `${baseUrl}/schools/state/${state.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Get all schools for individual school pages
  const schools = await db.school.findMany({
    select: {
      name: true,
      suburb: true,
      state: true,
      updatedAt: true,
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  const schoolPages = schools.map(school => ({
    url: `${baseUrl}/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`,
    lastModified: school.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Combine all pages
  return [
    ...staticPages,
    ...statePages,
    ...schoolPages,
  ]
} 