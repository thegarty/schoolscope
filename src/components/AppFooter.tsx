import Link from 'next/link'
import { SchoolScopeBrand } from './SchoolScopeBrand'

const states = [['nsw', 'New South Wales'], ['vic', 'Victoria'], ['qld', 'Queensland'], ['wa', 'Western Australia'], ['sa', 'South Australia'], ['tas', 'Tasmania'], ['nt', 'Northern Territory'], ['act', 'ACT']]

export default function AppFooter() {
  return <footer className="scope-footer">
    <div className="scope-footer-inner">
      <div className="scope-footer-intro"><SchoolScopeBrand compact /><p>A little discovery for every school day. Made for Australian school communities.</p></div>
      <nav aria-label="Footer"><Link href="/schools">Find a school</Link><Link href="/events">School events</Link><Link href="/tutor/demo">Meet Ripple</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
    </div>
    <div className="scope-footer-bottom"><details><summary>Find schools by state</summary><nav aria-label="Schools by state">{states.map(([slug, name]) => <Link key={slug} href={`/schools/state/${slug}`}>{name}</Link>)}</nav></details><br />© {new Date().getFullYear()} SchoolScope</div>
  </footer>
}
