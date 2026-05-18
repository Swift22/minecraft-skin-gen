'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function ShotInner() {
  const params = useSearchParams()
  const url = params.get('url') ?? ''
  const yaw = parseFloat(params.get('yaw') ?? '0.4')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!url || !canvasRef.current) return
    const canvas = canvasRef.current
    let viewer: { dispose(): void } | null = null
    let active = true

    import('skinview3d').then(({ SkinViewer }) => {
      if (!active || !canvas) return
      const v = new SkinViewer({ canvas, width: 600, height: 800, skin: url })
      v.autoRotate = false
      // Static pose — slight yaw + nominal pitch for a 3/4 view
      v.playerObject.rotation.y = yaw
      v.playerObject.rotation.x = 0
      viewer = v
      // Render twice then mark ready so headless screenshotter knows when to snap
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setReady(true)
        document.title = 'READY'
      }))
    })

    return () => {
      active = false
      viewer?.dispose()
    }
  }, [url, yaw])

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <canvas ref={canvasRef} width={600} height={800} data-ready={ready ? '1' : '0'} />
    </div>
  )
}

export default function ThreeDShotPage() {
  return (
    <Suspense fallback={null}>
      <ShotInner />
    </Suspense>
  )
}
