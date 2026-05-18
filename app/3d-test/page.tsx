'use client'

import { useEffect, useRef } from 'react'

const SKINS = [
  { url: '/local-skins/030bf88b-f726-4abe-bbde-2a2ba98abeee.png', title: '1 · Medieval knight', prompt: 'shining silver armor with red cape' },
  { url: '/local-skins/c32e57d8-7b4d-40cf-8b2f-3268f2b8bf21.png', title: '2 · Cyberpunk hacker', prompt: 'neon visor and black tech jacket' },
  { url: '/local-skins/a3e2dff2-0c11-4b72-8896-3960f7196677.png', title: '3 · Fantasy wizard', prompt: 'purple robe and golden trim' },
  { url: '/local-skins/deb7abcd-174a-4daf-b8aa-978594aad44c.png', title: '4 · Modern skater', prompt: 'striped hoodie and ripped jeans' },
]

function SkinCard({ url, title, prompt }: { url: string; title: string; prompt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let viewer: { dispose(): void } | null = null
    let active = true

    import('skinview3d').then(({ SkinViewer, WalkingAnimation }) => {
      if (!active || !canvas) return
      const v = new SkinViewer({ canvas, width: 300, height: 400, skin: url })
      v.animation = new WalkingAnimation()
      v.autoRotate = true
      v.autoRotateSpeed = 1.5
      viewer = v
    })

    return () => {
      active = false
      viewer?.dispose()
    }
  }, [url])

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="text-sm font-semibold text-sky-300">{title}</h2>
      <p className="mb-3 text-xs text-neutral-400">{prompt}</p>
      <canvas ref={canvasRef} width={300} height={400} className="mx-auto block rounded-lg bg-neutral-950" />
      <div className="mt-2 text-center text-xs text-neutral-500">walking · auto-rotating · drag to control</div>
    </div>
  )
}

export default function ThreeDTestPage() {
  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-neutral-100">
      <h1 className="mb-4 text-lg font-semibold">v2 smoke-battery · 3D view</h1>
      <p className="mb-6 max-w-3xl text-sm text-neutral-400">
        Throwaway dev page rendering the 4 skins from <code className="text-neutral-200">public/local-skins/</code> via the
        locally-installed <code className="text-neutral-200">skinview3d</code> package.
      </p>
      <div className="grid max-w-3xl grid-cols-1 gap-6 md:grid-cols-2">
        {SKINS.map((s) => (
          <SkinCard key={s.url} url={s.url} title={s.title} prompt={s.prompt} />
        ))}
      </div>
    </main>
  )
}
