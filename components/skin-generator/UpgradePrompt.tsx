'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

export function UpgradePrompt() {
  const [isLoading, setIsLoading] = useState(false)

  async function handleUpgrade() {
    if (isLoading) return
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/checkout', { method: 'POST' })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="text-base">Daily limit reached</CardTitle>
        <CardDescription>
          You&apos;ve used all 3 of today&apos;s free generations. Upgrade to keep creating.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {['50 skin generations per day', 'No ads', 'Priority generation'].map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary flex-shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
        <Button
          className="w-full"
          onClick={handleUpgrade}
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Redirecting\u2026' : 'Upgrade to Pro'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">Resets at midnight UTC</p>
      </CardContent>
    </Card>
  )
}
