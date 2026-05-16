'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface SkinItem {
  id: string
  prompt: string | null
  imageUrl?: string | null
  createdAt: string
}

interface SkinDetailDialogProps {
  skin: SkinItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SkinDetailDialog({ skin, open, onOpenChange }: SkinDetailDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!open || !skin?.imageUrl || !canvasRef.current) return

    const canvas = canvasRef.current
    let viewer: { dispose(): void } | null = null
    let active = true

    import('skinview3d').then(({ SkinViewer, WalkingAnimation }) => {
      if (!active || !canvas) return
      const v = new SkinViewer({
        canvas,
        width: 280,
        height: 380,
        skin: skin.imageUrl!,
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
  }, [open, skin?.imageUrl])

  if (!skin) return null

  async function handleDownload() {
    const response = await fetch(`/api/generate/${skin!.id}/download`)
    const data = await response.json()
    if (data.url) {
      const anchor = document.createElement('a')
      anchor.href = data.url
      anchor.download = `skinforge-${Date.now()}.png`
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    }
  }

  const generateSimilarUrl = skin.prompt
    ? `/generate?prompt=${encodeURIComponent(skin.prompt)}`
    : '/generate'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogTitle className="sr-only">Skin details</DialogTitle>
        <div className="flex flex-col items-center gap-4">
          {skin.imageUrl && (
            <div className="border border-border rounded-lg bg-[#1a1a2e] p-2">
              <canvas
                ref={canvasRef}
                width={280}
                height={380}
                style={{ display: 'block' }}
                aria-label="3D skin preview"
              />
            </div>
          )}

          {skin.prompt && (
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-1">Prompt</p>
              <p className="text-sm">{skin.prompt}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground w-full">
            Created {new Date(skin.createdAt).toLocaleDateString()}
          </p>

          <div className="flex gap-2 w-full">
            <Button onClick={handleDownload} className="flex-1">
              Download
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/edit?id=${skin.id}`}>Edit</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={generateSimilarUrl}>Generate Similar</Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
