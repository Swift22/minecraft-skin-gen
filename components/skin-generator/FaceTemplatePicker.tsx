'use client'

import { cn } from '@/lib/utils'
import { FACE_TEMPLATES, type Px } from '@/lib/legacy/face-templates'

/** Preview palette for rendering template thumbnails */
const PX_COLORS: Record<Px, string> = {
  H: '#4A3728',
  h: '#6B5240',
  S: '#E8B887',
  W: '#FFFFFF',
  E: '#3B82F6',
  M: '#C07050',
  N: '#D4A574',
  I: '#FFB8CC',
  '.': 'transparent',
}

const SHORT_LABELS: Record<number, string> = {
  0: 'Classic',
  1: 'Bangs',
  2: 'Side Part',
  3: 'Wide Face',
  4: 'Dot Eyes',
  5: 'Mohawk',
  6: 'Fluffy',
  7: 'Long Hair',
  8: 'Round',
  9: 'Serious',
  10: 'Bald',
  11: 'Close Eyes',
  12: 'Wide Eyes',
  13: 'Nose+Mouth',
  14: 'Sleepy',
  15: 'Feminine',
}

function PixelPreview({ grid }: { grid: Px[][] }) {
  return (
    <div
      className="grid w-8 h-8 rounded-sm overflow-hidden"
      style={{ gridTemplateColumns: 'repeat(8, 1fr)', gridTemplateRows: 'repeat(8, 1fr)' }}
    >
      {grid.flat().map((px, i) => (
        <div
          key={i}
          style={{
            backgroundColor: PX_COLORS[px],
            aspectRatio: '1',
          }}
        />
      ))}
    </div>
  )
}

interface FaceTemplatePickerProps {
  value: number | null
  onChange: (index: number | null) => void
}

export function FaceTemplatePicker({ value, onChange }: FaceTemplatePickerProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Face template</p>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
        {/* Auto option */}
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            'flex flex-col items-center gap-1 rounded-md border p-1.5 transition-colors',
            value === null
              ? 'bg-primary/20 border-primary'
              : 'border-border hover:border-primary/40'
          )}
        >
          <div className="w-8 h-8 rounded-sm bg-muted flex items-center justify-center text-xs text-muted-foreground">
            AI
          </div>
          <span className="text-[9px] leading-tight text-center">Auto</span>
        </button>

        {/* Template options */}
        {FACE_TEMPLATES.map((template) => (
          <button
            key={template.id}
            type="button"
            onClick={() => onChange(template.id)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-md border p-1.5 transition-colors',
              value === template.id
                ? 'bg-primary/20 border-primary'
                : 'border-border hover:border-primary/40'
            )}
          >
            <PixelPreview grid={template.front} />
            <span className="text-[9px] leading-tight text-center line-clamp-1">
              {SHORT_LABELS[template.id] ?? template.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
