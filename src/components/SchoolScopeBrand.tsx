import Link from 'next/link'
import Image from 'next/image'

export function SchoolScopeBrand({ href = '/', compact = false, subtitle }: { href?: string; compact?: boolean; subtitle?: string }) {
  return (
    <Link href={href} className={`scope-brand ${compact ? 'scope-brand-compact' : ''}`} aria-label="SchoolScope home">
      <span className="scope-brand-mark" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Image src="/brand/ripple-mark.png" alt="" width={276} height={384} style={{ display: 'block', width: '100%', height: '100%', minWidth: 0, minHeight: 0, objectFit: 'contain' }} priority /></span>
      <span><span className="scope-brand-name" style={{ lineHeight: 1 }}>School<span>Scope</span></span>{subtitle && <span className="scope-brand-subtitle">{subtitle}</span>}</span>
    </Link>
  )
}
