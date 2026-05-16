'use client'

import { cn } from '@/lib/utils'

const PRESETS = [
  { label: 'Medieval', keywords: 'medieval knight armor' },
  { label: 'Sci-Fi', keywords: 'sci-fi futuristic space suit' },
  { label: 'Fantasy', keywords: 'fantasy mage wizard robes' },
  { label: 'Modern', keywords: 'modern casual streetwear' },
  { label: 'Anime', keywords: 'anime style character' },
  { label: 'Pixel Art', keywords: 'pixel art retro style' },
  { label: 'Horror', keywords: 'horror dark creepy undead' },
  { label: 'Cute', keywords: 'cute kawaii pastel' },
]

interface StylePresetsProps {
  selected: string[]
  onToggle: (keywords: string) => void
}

export function StylePresets({ selected, onToggle }: StylePresetsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Style presets</p>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ label, keywords }) => {
          const isActive = selected.includes(keywords)
          return (
            <button
              key={label}
              type="button"
              onClick={() => onToggle(keywords)}
              className={cn(
                'rounded-full px-3 py-1 text-xs border transition-colors',
                isActive
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
              )}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
