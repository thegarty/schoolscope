import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const revalidate = 86400 // Revalidate once per day

function createSchoolSlug(name: string, suburb: string, state: string): string {
  const combined = `${name} ${suburb} ${state}`
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://schoolscope.com.au'

  // Static public content pages (no auth/utility pages)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/schools`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // State listing pages
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']
  const statePages: MetadataRoute.Sitemap = states.map(state => ({
    url: `${baseUrl}/schools/state/${state.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  let schoolPages: MetadataRoute.Sitemap = []
  let schoolEventPages: MetadataRoute.Sitemap = []

  try {
    // Fetch all schools with their latest public event date for lastModified
    const schools = await db.school.findMany({
      select: {
        name: true,
        suburb: true,
        state: true,
        updatedAt: true,
        _count: {
          select: { events: { where: { isPrivate: false } } },
        },
        events: {
          where: { isPrivate: false },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { updatedAt: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    schoolPages = schools.map(school => ({
      url: `${baseUrl}/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`,
      lastModified: school.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    // Only include events pages for schools that have at least one public event
    schoolEventPages = schools
      .filter(school => school._count.events > 0)
      .map(school => ({
        url: `${baseUrl}/schools/${createSchoolSlug(school.name, school.suburb, school.state)}/events`,
        lastModified: school.events[0]?.updatedAt ?? school.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.6,
      }))
  } catch (error) {
    console.error('Error fetching schools for sitemap:', error)
  }

  return [
    ...staticPages,
    ...statePages,
    ...schoolPages,
    ...schoolEventPages,
  ]
} 