import Link from 'next/link'
import { Hammer } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t-2 border-border bg-card/80 mt-8">
      {/* Pixel stripe top */}
      <div className="flex h-1">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 ${i % 2 === 0 ? 'bg-primary/30' : 'bg-accent/30'}`}
          />
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Hammer className="h-4 w-4 text-primary" />
              <span className="font-pixel text-xs">SkinForge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              AI-powered Minecraft skin generator. Create unique skins in seconds.
            </p>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <h4 className="font-pixel text-[10px] text-muted-foreground">PRODUCT</h4>
            <nav className="flex flex-col gap-2">
              <Link href="/generate" className="text-sm text-muted-foreground hover:text-primary transition-none">
                &gt; Generate
              </Link>
              <Link href="/gallery" className="text-sm text-muted-foreground hover:text-primary transition-none">
                &gt; Gallery
              </Link>
              <Link href="/signup" className="text-sm text-muted-foreground hover:text-primary transition-none">
                &gt; Sign Up
              </Link>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <h4 className="font-pixel text-[10px] text-muted-foreground">LEGAL</h4>
            <nav className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">&gt; Terms of Service</span>
              <span className="text-sm text-muted-foreground">&gt; Privacy Policy</span>
            </nav>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t-2 border-border">
          <p className="font-pixel text-[9px] text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} SKINFORGE &mdash; NOT AFFILIATED WITH MOJANG OR MICROSOFT
          </p>
        </div>
      </div>
    </footer>
  )
}
