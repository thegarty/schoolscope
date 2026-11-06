import Link from 'next/link'
import Image from 'next/image'

export function SchoolScopeBrand({ href = '/', compact = false, subtitle }: { href?: string; compact?: boolean; subtitle?: string }) {
  return (
    <Link href={href} className={`scope-brand ${compact ? 'scope-brand-compact' : ''}`} aria-label="SchoolScope home">
      <span className="scope-brand-mark"><Image src="/brand/ripple-mark.png" alt="" width={64} height={76} priority /></span>
      <span><span className="scope-brand-name">School<span>Scope</span></span>{subtitle && <span className="scope-brand-subtitle">{subtitle}</span>}</span>
    </Link>
  )
}
