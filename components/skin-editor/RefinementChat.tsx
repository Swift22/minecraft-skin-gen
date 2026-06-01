'use client'
import { useState } from 'react'

interface Props {
  onSubmit: (instruction: string) => void
  loading: boolean
  error?: string
}

export function RefinementChat({ onSubmit, loading, error }: Props) {
  const [text, setText] = useState('')
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (text.trim()) {
          onSubmit(text.trim())
          setText('')
        }
      }}
      className="flex flex-col gap-1 border-t pt-2"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. redder shirt, longer hair, sunglasses"
          className="flex-1 border rounded px-2 py-1.5 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          aria-label="Apply"
          disabled={loading || !text.trim()}
          className="px-4 py-1.5 bg-zinc-900 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
