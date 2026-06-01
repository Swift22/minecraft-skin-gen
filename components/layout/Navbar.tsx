'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { UserMenu } from './UserMenu'
import { MobileNav } from './MobileNav'
import { cn } from '@/lib/utils'

interface NavUser {
  email: string
}

const NAV_LINKS = [
  { href: '/', label: 'Home', authOnly: false },
  { href: '/generate', label: 'Generate', authOnly: true },
  { href: '/gallery', label: 'Gallery', authOnly: true },
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState<NavUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUser() {
      try {
        const supabase = createClient()
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (authUser) {
          const response = await fetch('/api/user/me')
          if (response.ok) {
            const data = await response.json()
            setUser({
              email: data.email,
            })
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [pathname])

  const isAuthenticated = !!user
  const visibleLinks = NAV_LINKS.filter(
    (link) => !link.authOnly || isAuthenticated
  )

  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-border shadow-[0_2px_0_0_hsl(var(--border))]">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Left: Logo */}
        <Logo isAuthenticated={isAuthenticated} />

        {/* Center: Nav links (desktop) */}
        <nav className="hidden md:flex items-center gap-0">
          {visibleLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'px-3 py-1.5 text-sm border-2 transition-none',
                pathname === link.href
                  ? 'text-foreground bg-secondary border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary border-transparent'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {!loading && (
            <>
              {isAuthenticated && user ? (
                <UserMenu email={user.email} />
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Button asChild variant="ghost" size="sm">
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              )}
            </>
          )}
          <MobileNav
            isAuthenticated={isAuthenticated}
            email={user?.email}
          />
        </div>
      </div>
    </header>
  )
}
