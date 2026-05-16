'use client'

import { Progress } from '@/components/ui/progress'

export function CreditCounter({
  creditsRemaining,
  dailyLimit,
}: {
  creditsRemaining: number
  dailyLimit: number
}) {
  const percentage = dailyLimit > 0 ? (creditsRemaining / dailyLimit) * 100 : 0
  const isExhausted = creditsRemaining === 0
  const isUrgent = creditsRemaining <= 1 && creditsRemaining > 0

  return (
    <div className="space-y-2" aria-label="Daily generation credits">
      <div className="flex items-center justify-between text-sm">
        <span className={isUrgent ? 'text-destructive font-medium' : 'text-muted-foreground'}>
          {creditsRemaining} / {dailyLimit} generations remaining today
        </span>
        {isExhausted && (
          <span className="text-xs text-muted-foreground">Resets at midnight UTC</span>
        )}
      </div>
      <Progress
        value={percentage}
        className="h-2"
        aria-valuenow={creditsRemaining}
        aria-valuemin={0}
        aria-valuemax={dailyLimit}
      />
    </div>
  )
}
