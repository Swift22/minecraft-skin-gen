'use client'
import type { SkinIntent } from '@/lib/intent/schema'

type Char = SkinIntent['character']

interface Props {
  character: Char
  onChange: (field: keyof Char, value: string) => void
}

const COLOR_FIELDS: { field: keyof Char; label: string }[] = [
  { field: 'skin_tone', label: 'Skin tone' },
  { field: 'eye_color', label: 'Eye color' },
  { field: 'eye_white', label: 'Eye white' },
  { field: 'mouth_color', label: 'Mouth color' },
  { field: 'nose_shadow', label: 'Nose shadow' },
  { field: 'hair_color', label: 'Hair color' },
  { field: 'hair_accent_color', label: 'Hair accent' },
  { field: 'ear_color', label: 'Ear color' },
  { field: 'inner_ear_color', label: 'Inner ear' },
]

export function CharacterColors({ character, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Character colors</h3>
      <div className="grid grid-cols-2 gap-2">
        {COLOR_FIELDS.map(({ field, label }) => (
          <label key={field} className="flex flex-col text-xs gap-1">
            <span>{label}</span>
            <input
              type="color"
              aria-label={label}
              value={character[field] as string}
              onChange={(e) => onChange(field, e.target.value.toUpperCase())}
              className="h-8 w-full border rounded"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
