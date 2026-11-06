import Image from 'next/image'
import Link from 'next/link'
import { Nunito } from 'next/font/google'
import { CalendarDays, ChevronRight, School, Users } from 'lucide-react'
import AppHeader from '@/components/AppHeader'
import { validateRequest } from '@/lib/auth'
import './home.css'

const nunito = Nunito({ subsets: ['latin'], display: 'swap', variable: '--font-discovery' })
const states = [['nsw', 'New South Wales'], ['vic', 'Victoria'], ['qld', 'Queensland'], ['wa', 'Western Australia'], ['sa', 'South Australia'], ['tas', 'Tasmania'], ['nt', 'Northern Territory'], ['act', 'ACT']]

export default async function HomePage() {
  const { user } = await validateRequest()
  return (
    <div className={`${nunito.variable} scope-discovery`}>
      <AppHeader user={user} />
      <main id="main-content">
        <section className="discovery-hero" aria-labelledby="discovery-title">
          <div className="discovery-hero-inner">
            <div className="discovery-copy">
              <span className="discovery-kicker">Maths, at your pace</span>
              <h1 id="discovery-title">Big questions.<span>Little lightbulbs.</span></h1>
              <p>Meet Ripple. A patient AI tutor to help you work it out, one small step at a time.</p>
              <Link className="discovery-primary" href="/tutor/demo">Meet Ripple</Link>
              <p className="discovery-preview">Adult preview · Fictional learner · Years 3–6</p>
            </div>
            <figure className="discovery-illustration">
              <Image src="/illustrations/ripple-fractions.png" alt="Ripple, a smiling lightbulb, shows four equal pieces with two shaded: 2 out of 4 is one half." width={1556} height={1011} sizes="(max-width: 767px) 90vw, 48vw" priority />
            </figure>
          </div>
        </section>
        <section className="discovery-school-day" aria-labelledby="school-day-title">
          <h2 id="school-day-title">And for the rest of your school day…</h2>
          <div className="discovery-actions">
            <Link href="/schools" className="discovery-action">
              <span className="discovery-action-icon discovery-school-icon"><School size={52} strokeWidth={2.1} aria-hidden="true" /></span>
              <span className="discovery-action-copy"><h3>Find my school</h3><p>School details and your community.</p></span>
              <ChevronRight className="discovery-action-chevron" size={30} strokeWidth={3} aria-hidden="true" />
            </Link>
            <Link href={user ? '/dashboard' : '/sign-in?redirect_url=%2Fdashboard'} className="discovery-action">
              <span className="discovery-action-icon discovery-calendar-icon"><CalendarDays size={52} strokeWidth={2.1} aria-hidden="true" /></span>
              <span className="discovery-action-copy"><h3>Open my calendar</h3><p>Keep important dates together.</p></span>
              <ChevronRight className="discovery-action-chevron" size={30} strokeWidth={3} aria-hidden="true" />
            </Link>
          </div>
          <p className="discovery-community"><Users size={25} aria-hidden="true" />Made for Australian school communities.</p>
        </section>
      </main>
      <footer className="discovery-footer">
        <details><summary>Find schools by state</summary><nav aria-label="Schools by state">{states.map(([slug, name]) => <Link key={slug} href={`/schools/state/${slug}`}>{name}</Link>)}</nav></details>
        <div className="discovery-legal"><span>© 2026 SchoolScope</span><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div>
      </footer>
    </div>
  )
}
