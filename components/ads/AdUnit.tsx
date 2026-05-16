'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdUnitProps {
  /** AdSense ad slot ID */
  slot: string
}

/**
 * Google AdSense ad unit component.
 * Renders a grey placeholder in development; loads the real ad in production.
 */
export function AdUnit({ slot }: AdUnitProps) {
  const pathname = usePathname()

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return

    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
    } catch (error) {
      console.error('AdSense push error:', error)
    }
  }, [pathname])

  if (process.env.NODE_ENV !== 'production') {
    return (
      <div
        className="flex items-center justify-center rounded-md bg-muted text-xs text-muted-foreground"
        style={{ minHeight: '90px', width: '100%' }}
        aria-hidden="true"
      >
        [Ad - {slot}]
      </div>
    )
  }

  return (
    <div style={{ minHeight: '90px' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}
