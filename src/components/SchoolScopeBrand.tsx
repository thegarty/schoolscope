import Link from 'next/link'
import { School } from 'lucide-react'

export function SchoolScopeBrand({ href = '/', compact = false, subtitle }: { href?: string; compact?: boolean; subtitle?: string }) {
  return (
    <Link href={href} className={`scope-brand ${compact ? 'scope-brand-compact' : ''}`} aria-label="SchoolScope home">
      <span className="scope-brand-mark"><School size={24} strokeWidth={2.2} aria-hidden="true" /></span>
      <span><span className="scope-brand-name">School<span>Scope</span></span>{subtitle && <span className="scope-brand-subtitle">{subtitle}</span>}</span>
    </Link>
  )
}
