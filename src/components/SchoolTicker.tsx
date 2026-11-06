'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, MapPin, School } from 'lucide-react'

interface TickerSchool { id: string; name: string; suburb: string; state: string }
interface TickerData { schools: TickerSchool[]; totalSchools: number }
function schoolSlug(school: TickerSchool) {
  return `${school.name} ${school.suburb} ${school.state}`.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

export default function SchoolTicker() {
  const [data, setData] = useState<TickerData | null>(null)
  useEffect(() => {
    const controller = new AbortController()
    void fetch('/api/schools/ticker', { cache: 'no-store', signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(value => { if (value && typeof value.totalSchools === 'number' && Array.isArray(value.schools)) setData(value) })
      .catch(() => {})
    return () => controller.abort()
  }, [])
  if (!data?.schools.length) return null
  return (
    <section className="scope-schools-section" aria-labelledby="scope-schools-heading">
      <div className="scope-container">
        <div className="scope-section-heading"><div><span className="scope-eyebrow">YOUR COMMUNITY STARTS HERE</span><h2 id="scope-schools-heading">A school for every school day.</h2><p>Explore {data.totalSchools.toLocaleString()} Australian school profiles.</p></div><Link href="/schools" className="scope-text-link">Browse all schools <ArrowRight size={17} /></Link></div>
        <div className="scope-school-grid">{data.schools.slice(0, 3).map(school => <Link href={`/schools/${schoolSlug(school)}`} key={school.id} className="scope-school-tile"><School size={23} aria-hidden="true" /><span><h3>{school.name}</h3><span><MapPin size={14} aria-hidden="true" />{school.suburb}, {school.state}</span></span><ArrowRight size={18} aria-hidden="true" /></Link>)}</div>
      </div>
    </section>
  )
}
