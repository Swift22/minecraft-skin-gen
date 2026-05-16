'use client'
import { useEffect, useRef } from 'react'

interface Props {
  region: string
  x: number
  y: number
  locked: boolean
  onReroll: (region: string) => void
  onClose: () => void
}

export function RegionContextMenu({ region, x, y, locked, onReroll, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 bg-white border rounded shadow-lg p-1 text-sm"
      style={{ top: y, left: x }}
    >
      <button
        type="button"
        disabled={locked}
        onClick={() => { onReroll(region); onClose() }}
        className="block w-full text-left px-3 py-1.5 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {locked ? '🔒 ' : ''}Re-roll {region}
      </button>
    </div>
  )
}
