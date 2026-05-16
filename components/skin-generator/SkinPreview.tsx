'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { SkinIntent } from '@/lib/intent/schema'

interface SkinPreviewProps {
  skinUrl: string | null
  generationId: string | null
  onRegenerate: () => void
  isGenerating?: boolean
  /** TODO(Plan C): forwarded to editor page via state/context once editor is implemented */
  intent?: SkinIntent | null
}

// 4×4 pixel-art face: 'g' = green (bg-primary), 'e' = eye/mouth (bg-background)
const FACE_PIXELS = [
  ['g', 'g', 'g', 'g'],
  ['g', 'e', 'e', 'g'],
  ['g', 'g', 'g', 'g'],
  ['g', 'e', 'e', 'g'],
] as const

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SkinPreview({ skinUrl, generationId, onRegenerate, isGenerating = false, intent: _intent }: SkinPreviewProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!skinUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    let viewer: { dispose(): void } | null = null
    let active = true

    import('skinview3d').then(({ SkinViewer, WalkingAnimation }) => {
      if (!active || !canvas) return
      const v = new SkinViewer({
        canvas,
        width: 300,
        height: 400,
        skin: skinUrl,
      })
      v.animation = new WalkingAnimation()
      v.autoRotate = true
      v.autoRotateSpeed = 1.5
      viewer = v
    })

    return () => {
      active = false
      viewer?.dispose()
    }
  }, [skinUrl])

  async function handleDownload() {
    if (!generationId || isDownloading) return
    setIsDownloading(true)

    try {
      const response = await fetch(`/api/generate/${generationId}/download`)
      const data = await response.json()

      if (!response.ok || !data.url) {
        console.error('Download failed:', data.message)
        return
      }

      const anchor = document.createElement('a')
      anchor.href = data.url
      anchor.download = `skinforge-${Date.now()}.png`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    } catch (error) {
      console.error('Download error:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  // Generating state
  if (isGenerating) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border border-border bg-card p-8 text-center"
        style={{ minHeight: '300px' }}
      >
        <Skeleton className="w-[200px] h-[280px] rounded-lg mb-4" />
        <p className="text-sm text-muted-foreground animate-pulse">Generating your skin...</p>
      </div>
    )
  }

  // Empty state
  if (!skinUrl) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/10 p-8 text-center"
        style={{ minHeight: '300px' }}
        aria-label="Skin preview placeholder"
      >
        <div className="mb-4" aria-hidden="true">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 16px)', gap: '2px' }}>
            {FACE_PIXELS.map((row, r) =>
              row.map((pixel, c) => (
                <div
                  key={`${r}-${c}`}
                  className={pixel === 'g' ? 'bg-primary/60' : 'bg-background'}
                  style={{ width: 16, height: 16 }}
                />
              ))
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Your skin will appear here
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Describe it and hit Generate
        </p>
      </div>
    )
  }

  // Preview state
  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="border border-border rounded-lg bg-[#1a1a2e] p-2">
          <canvas
            ref={canvasRef}
            width={300}
            height={400}
            style={{ display: 'block' }}
            aria-label="3D Minecraft skin preview"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        <Button onClick={handleDownload} disabled={isDownloading} aria-busy={isDownloading}>
          {isDownloading ? 'Downloading\u2026' : 'Download Skin'}
        </Button>
        <Button asChild variant="outline">
          <Link href={`/edit?id=${generationId}`}>Edit Skin</Link>
        </Button>
        <Button variant="outline" onClick={onRegenerate} aria-label="Regenerate skin with same inputs">
          Regenerate
        </Button>
      </div>
    </div>
  )
}
