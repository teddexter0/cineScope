'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Bookmark, Compass, Home, Star, User } from 'lucide-react'

const ITEMS = [
  { href: '/dashboard', label: 'Home', icon: Home },
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/watchlist', label: 'Watchlist', icon: Bookmark },
  { href: '/ratings', label: 'Ratings', icon: Star },
  { href: '/people', label: 'People', icon: User },
]

const HIDDEN_PREFIXES = ['/', '/auth', '/onboarding']

export default function MobileBottomNav() {
  const pathname = usePathname()
  const { status } = useSession()
  const hidden = status !== 'authenticated' || HIDDEN_PREFIXES.some(prefix =>
    prefix === '/' ? pathname === '/' : pathname.startsWith(prefix)
  )

  if (hidden) return null

  return (
    <>
      <div className="h-[calc(5.25rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />
      <nav className="mobile-tab-bar md:hidden" aria-label="Primary navigation">
        {ITEMS.map(item => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-tab ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="mobile-tab-icon"><Icon aria-hidden="true" /></span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
