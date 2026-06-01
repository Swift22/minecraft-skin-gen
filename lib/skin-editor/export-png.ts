import { PixelBuffer } from './pixel-buffer'

/**
 * Renders a PixelBuffer to a PNG Blob and triggers a browser download.
 */
export function downloadPng(buffer: PixelBuffer, filename?: string): void {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(buffer.toImageData(), 0, 0)

  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename ?? `skinforge-edit-${Date.now()}.png`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }, 'image/png')
}
