'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { CalendarDays, School, Users, Plus, House, Menu, X, Settings, Sparkles } from 'lucide-react'
import { UserButton } from '@allauth/react'
import { Button } from '@/components/ui/button'
import { SchoolScopeBrand } from './SchoolScopeBrand'
import NotificationBell from './NotificationBell'
import { useAdmin } from '@/lib/hooks/useAdmin'

interface User { id: string; name?: string | null; email: string }
interface AppHeaderProps { user?: User | null; showNotifications?: boolean }

export default function AppHeader({ user, showNotifications = true }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const { isAdmin } = useAdmin()
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const nav = [
    { href: user ? '/dashboard' : '/', label: 'Home', Icon: House },
    { href: '/schools', label: 'Schools', Icon: School },
    { href: '/tutor/demo', label: 'Tutor', Icon: Sparkles },
    { href: '/events', label: 'Events', Icon: CalendarDays },
  ]
  const active = (href: string) => href === '/' ? pathname === '/' : href === '/dashboard' ? pathname === '/' || pathname.startsWith('/dashboard') : href === '/tutor/demo' ? pathname.startsWith('/tutor') : pathname.startsWith(href)

  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); triggerRef.current?.focus() } }
    document.addEventListener('click', close)
    document.addEventListener('keydown', escape)
    return () => { document.removeEventListener('click', close); document.removeEventListener('keydown', escape) }
  }, [menuOpen])

  return (
    <>
      {pathname === '/' && <a href="#main-content" className="scope-skip-link">Skip to content</a>}
      <header className="scope-header">
        <div className="scope-header-inner">
          <SchoolScopeBrand href={user ? '/dashboard' : '/'} />
          <nav className="scope-desktop-nav" aria-label="Main navigation">
            {nav.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} className={active(href) ? 'active' : ''}><Icon size={18} aria-hidden="true" />{label}</Link>)}
          </nav>
          <div className="scope-header-actions">
            {user ? <>
              {showNotifications && <NotificationBell />}
              <UserButton variant="avatar" managementMode="modal" />
              <div className="scope-menu-container">
                <Button ref={triggerRef} variant="outline" size="icon" aria-label={menuOpen ? 'Close more options' : 'More options'} aria-expanded={menuOpen} aria-controls="scope-more-menu" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</Button>
                {menuOpen && <div ref={menuRef} className="scope-more-menu" id="scope-more-menu">
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)}><CalendarDays size={19} />My calendar</Link>
                  <Link href="/children" onClick={() => setMenuOpen(false)}><Users size={19} />My children</Link>
                  <Link href="/events/create" onClick={() => setMenuOpen(false)}><Plus size={19} />Add an event</Link>
                  {isAdmin && <Link href="/admin" onClick={() => setMenuOpen(false)}><Settings size={19} />Admin</Link>}
                </div>}
              </div>
            </> : <>
              <Button variant="ghost" size="sm" asChild><Link href="/sign-in">Log in</Link></Button>
              <Button className="scope-signup" size="sm" asChild><Link href="/sign-up">Join us</Link></Button>
            </>}
          </div>
        </div>
      </header>
      <nav className="scope-mobile-nav" aria-label="Main navigation">
        {nav.map(({ href, label, Icon }) => <Link key={href} href={href} aria-current={active(href) ? 'page' : undefined} className={active(href) ? 'active' : ''}><span><Icon size={22} aria-hidden="true" /></span>{label}</Link>)}
      </nav>
    </>
  )
}
