'use client'

interface Props {
  variations: { generationId: string; skinUrl: string }[]
  onSelect: (generationId: string) => void
}

export function VariationsGrid({ variations, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {variations.map((v) => (
        <button
          key={v.generationId}
          type="button"
          onClick={() => onSelect(v.generationId)}
          className="border-2 border-zinc-300 rounded hover:border-zinc-900 p-2 flex flex-col items-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={v.skinUrl}
            alt="variation"
            className="w-full h-auto"
            style={{ imageRendering: 'pixelated' }}
          />
        </button>
      ))}
    </div>
  )
}
