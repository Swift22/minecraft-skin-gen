'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Logo } from './Logo'
import { Menu, Wand2, ImageIcon, User, LogOut } from 'lucide-react'

interface MobileNavProps {
  isAuthenticated: boolean
  email?: string
}

export function MobileNav({ isAuthenticated, email }: MobileNavProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push('/login')
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <div className="flex flex-col gap-6 pt-6">
          <Logo isAuthenticated={isAuthenticated} />

          <nav className="flex flex-col gap-1">
            {isAuthenticated ? (
              <>
                {email && (
                  <p className="px-3 py-2 text-sm text-muted-foreground truncate">{email}</p>
                )}
                <Link
                  href="/generate"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  <Wand2 className="h-4 w-4" />
                  Generate
                </Link>
                <Link
                  href="/gallery"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  Gallery
                </Link>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Account
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2 text-sm hover:bg-accent/10 transition-colors"
                >
                  Home
                </Link>
                <div className="flex flex-col gap-2 pt-4">
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  )
}
