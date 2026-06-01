'use client'

import { cn } from '@/lib/utils'

const EAR_OPTIONS = [
  { value: 0, label: 'None' },
  { value: 1, label: 'Cat Ears' },
] as const

interface EarTemplatePickerProps {
  value: number
  onChange: (value: number) => void
}

export function EarTemplatePicker({ value, onChange }: EarTemplatePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Ear style</p>
      <div className="flex gap-2">
        {EAR_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs border transition-colors',
              value === opt.value
                ? 'bg-primary/20 border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
