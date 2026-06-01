'use client'
import type { SkinIntent } from '@/lib/intent/schema'

const EYES = ['round', 'almond', 'wide', 'close_set', 'sleepy', 'dot', 'square', 'mono']
const MOUTHS = ['none', 'smile', 'wide_smile', 'frown', 'open', 'smirk']
const BROWS = ['none', 'flat', 'angled_up', 'angled_down', 'bushy']
const NOSES = ['none', 'bridge', 'dot', 'wide']
const HAIR_STYLES = ['classic', 'bangs', 'side_part', 'mohawk', 'fluffy', 'curtain', 'bald', 'bun', 'ponytail', 'spiky', 'undercut', 'dreads']
const HAIR_LENGTHS = ['short', 'medium', 'long', 'very_long']
const EARS = ['none', 'round', 'pointy', 'cat', 'fox', 'bunny', 'wolf', 'elf']

type Char = SkinIntent['character']

interface Props {
  character: Char
  onChange: (field: keyof Char, value: string) => void
}

export function CharacterParameters({ character, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Character</h3>
      <Field label="Eye shape" field="eye_shape" value={character.eye_shape} options={EYES} onChange={onChange} />
      <Field label="Mouth" field="mouth" value={character.mouth} options={MOUTHS} onChange={onChange} />
      <Field label="Brows" field="brows" value={character.brows} options={BROWS} onChange={onChange} />
      <Field label="Nose" field="nose" value={character.nose} options={NOSES} onChange={onChange} />
      <Field label="Hair style" field="hair_style" value={character.hair_style} options={HAIR_STYLES} onChange={onChange} />
      <Field label="Hair length" field="hair_length" value={character.hair_length} options={HAIR_LENGTHS} onChange={onChange} />
      <Field label="Ear template" field="ear_template" value={character.ear_template} options={EARS} onChange={onChange} />
    </div>
  )
}

function Field({
  label,
  field,
  value,
  options,
  onChange,
}: {
  label: string
  field: keyof Char
  value: string
  options: string[]
  onChange: Props['onChange']
}) {
  const id = `char-param-${field}`
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </label>
      <select
        id={id}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  )
}
