'use client'

import { useRef, useEffect } from 'react'

interface EditorPreviewProps {
  dataUrl: string
}

export function EditorPreview({ dataUrl }: EditorPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewerRef = useRef<{ dispose(): void } | null>(null)
  const activeRef = useRef(true)

  // Initialize viewer once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    activeRef.current = true

    import('skinview3d').then(({ SkinViewer, WalkingAnimation }) => {
      if (!activeRef.current || !canvas) return
      const v = new SkinViewer({
        canvas,
        width: 280,
        height: 380,
        skin: dataUrl,
      })
      v.animation = new WalkingAnimation()
      v.autoRotate = true
      v.autoRotateSpeed = 1.5
      viewerRef.current = v
    })

    return () => {
      activeRef.current = false
      viewerRef.current?.dispose()
      viewerRef.current = null
    }
    // Only initialize once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update skin texture when dataUrl changes (debounced by parent)
  useEffect(() => {
    const viewer = viewerRef.current as { loadSkin(url: string): void } | null
    if (viewer && dataUrl) {
      viewer.loadSkin(dataUrl)
    }
  }, [dataUrl])

  return (
    <div className="border border-border rounded-lg bg-[#1a1a2e] p-2">
      <canvas
        ref={canvasRef}
        width={280}
        height={380}
        style={{ display: 'block' }}
        aria-label="3D skin preview"
      />
    </div>
  )
}
