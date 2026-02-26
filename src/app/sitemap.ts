import { MetadataRoute } from 'next'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

const STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT']

// id 0 = static/state-listing pages, ids 1–8 = one per Australian state
export async function generateSitemaps() {
  return [{ id: 0 }, ...STATES.map((_, i) => ({ id: i + 1 }))]
}

function createSchoolSlug(name: string, suburb: string, state: string): string {
  return `${name} ${suburb} ${state}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://schoolscope.com.au'

  // Sitemap 0: static pages + state browse pages
  if (id === 0) {
    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
      { url: `${baseUrl}/schools`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      ...STATES.map(state => ({
        url: `${baseUrl}/schools/state/${state.toLowerCase()}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ]
  }

  // Sitemaps 1–8: school + event pages per state
  const state = STATES[id - 1]
  if (!state) return []

  try {
    const schools = await db.school.findMany({
      where: { state },
      select: {
        name: true,
        suburb: true,
        state: true,
        updatedAt: true,
        _count: { select: { events: { where: { isPrivate: false } } } },
        events: {
          where: { isPrivate: false },
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { updatedAt: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    const schoolPages: MetadataRoute.Sitemap = schools.map(school => ({
      url: `${baseUrl}/schools/${createSchoolSlug(school.name, school.suburb, school.state)}`,
      lastModified: school.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    const eventPages: MetadataRoute.Sitemap = schools
      .filter(school => school._count.events > 0)
      .map(school => ({
        url: `${baseUrl}/schools/${createSchoolSlug(school.name, school.suburb, school.state)}/events`,
        lastModified: school.events[0]?.updatedAt ?? school.updatedAt,
        changeFrequency: 'daily',
        priority: 0.6,
      }))

    return [...schoolPages, ...eventPages]
  } catch (error) {
    console.error(`Sitemap error for state ${state}:`, error)
    return []
  }
}
