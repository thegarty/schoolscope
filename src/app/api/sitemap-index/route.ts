import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Sitemap 0 = static/state pages, sitemaps 1–8 = one per Australian state
const SITEMAP_IDS = [0, 1, 2, 3, 4, 5, 6, 7, 8]

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://schoolscope.com.au'

  const sitemapEntries = SITEMAP_IDS.map(
    id => `  <sitemap>\n    <loc>${baseUrl}/sitemap/${id}.xml</loc>\n  </sitemap>`
  ).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
