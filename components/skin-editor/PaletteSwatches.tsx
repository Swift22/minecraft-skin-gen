'use client'

interface Props {
  palette: string[]
  onChange: (index: number, newHex: string) => void
}

export function PaletteSwatches({ palette, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Palette</h3>
      <div className="flex gap-2">
        {palette.map((hex, i) => (
          <Swatch key={i} hex={hex} index={i} onChange={onChange} />
        ))}
      </div>
    </div>
  )
}

function Swatch({ hex, index, onChange }: { hex: string; index: number; onChange: (i: number, v: string) => void }) {
  const id = `palette-swatch-${index}`
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        Palette color {index + 1}
      </label>
      <button
        type="button"
        aria-label={`Swatch ${hex}`}
        className="w-10 h-10 rounded border border-zinc-300"
        style={{ backgroundColor: hex }}
        onClick={() => document.getElementById(id)?.click()}
      />
      <input
        id={id}
        aria-label={`palette color ${hex}`}
        type="color"
        value={hex}
        onChange={(e) => onChange(index, e.target.value.toUpperCase())}
        className="sr-only"
      />
    </div>
  )
}
