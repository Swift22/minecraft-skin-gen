'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { PixelBuffer } from '@/lib/skin-editor/pixel-buffer'
import type { EditorTool } from '@/hooks/use-editor-state'
import { getRegionAt } from '@/lib/skin-editor/region-lookup'

interface SkinCanvasProps {
  buffer: PixelBuffer
  zoomLevel: number
  showGrid: boolean
  showRegions: boolean
  activeTool: EditorTool
  onBeginStroke: () => void
  onDrawPixel: (x: number, y: number) => void
  onEndStroke: () => void
  onPickColor: (x: number, y: number) => void
  onFillAt: (x: number, y: number) => void
  onHover: (x: number, y: number) => void
  onHoverLeave: () => void
}

const CHECKERBOARD_LIGHT = '#3a3a4a'
const CHECKERBOARD_DARK = '#2a2a3a'
const GRID_COLOR = 'rgba(255, 255, 255, 0.12)'
const REGION_BORDER_COLOR = 'rgba(34, 197, 94, 0.5)'

export function SkinCanvas({
  buffer,
  zoomLevel,
  showGrid,
  showRegions,
  activeTool,
  onBeginStroke,
  onDrawPixel,
  onEndStroke,
  onPickColor,
  onFillAt,
  onHover,
  onHoverLeave,
}: SkinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)

  const canvasWidth = 64 * zoomLevel
  const canvasHeight = 64 * zoomLevel

  const toPixelCoords = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const x = Math.floor((e.clientX - rect.left) / zoomLevel)
      const y = Math.floor((e.clientY - rect.top) / zoomLevel)
      if (x < 0 || x >= 64 || y < 0 || y >= 64) return null
      return { x, y }
    },
    [zoomLevel]
  )

  // Render the canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    // Checkerboard background (transparency visualization)
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        ctx.fillStyle = (x + y) % 2 === 0 ? CHECKERBOARD_LIGHT : CHECKERBOARD_DARK
        ctx.fillRect(x * zoomLevel, y * zoomLevel, zoomLevel, zoomLevel)
      }
    }

    // Draw pixels
    const imageData = buffer.toImageData()
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 64; x++) {
        const i = (y * 64 + x) * 4
        const a = imageData.data[i + 3] ?? 0
        if (a === 0) continue
        const r = imageData.data[i] ?? 0
        const g = imageData.data[i + 1] ?? 0
        const b = imageData.data[i + 2] ?? 0
        ctx.fillStyle = `rgba(${r},${g},${b},${a / 255})`
        ctx.fillRect(x * zoomLevel, y * zoomLevel, zoomLevel, zoomLevel)
      }
    }

    // Region borders
    if (showRegions) {
      ctx.strokeStyle = REGION_BORDER_COLOR
      ctx.lineWidth = 1
      // Track unique regions by building a set
      const drawn = new Set<string>()
      for (let y = 0; y < 64; y++) {
        for (let x = 0; x < 64; x++) {
          const region = getRegionAt(x, y)
          if (!region) continue
          const key = region.name
          if (drawn.has(key)) continue
          drawn.add(key)
          ctx.strokeRect(
            region.x * zoomLevel + 0.5,
            region.y * zoomLevel + 0.5,
            region.width * zoomLevel - 1,
            region.height * zoomLevel - 1
          )
        }
      }
    }

    // Grid
    if (showGrid) {
      ctx.strokeStyle = GRID_COLOR
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let x = 0; x <= 64; x++) {
        ctx.moveTo(x * zoomLevel + 0.5, 0)
        ctx.lineTo(x * zoomLevel + 0.5, canvasHeight)
      }
      for (let y = 0; y <= 64; y++) {
        ctx.moveTo(0, y * zoomLevel + 0.5)
        ctx.lineTo(canvasWidth, y * zoomLevel + 0.5)
      }
      ctx.stroke()
    }
  }, [buffer, zoomLevel, showGrid, showRegions, canvasWidth, canvasHeight])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const coords = toPixelCoords(e)
      if (!coords) return

      if (activeTool === 'eyedropper') {
        onPickColor(coords.x, coords.y)
        return
      }
      if (activeTool === 'fill') {
        onFillAt(coords.x, coords.y)
        return
      }

      isDrawingRef.current = true
      onBeginStroke()
      onDrawPixel(coords.x, coords.y)
    },
    [activeTool, toPixelCoords, onBeginStroke, onDrawPixel, onPickColor, onFillAt]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = toPixelCoords(e)
      if (coords) {
        onHover(coords.x, coords.y)
      }
      if (!isDrawingRef.current || !coords) return
      onDrawPixel(coords.x, coords.y)
    },
    [toPixelCoords, onDrawPixel, onHover]
  )

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      onEndStroke()
    }
  }, [onEndStroke])

  const handleMouseLeave = useCallback(() => {
    onHoverLeave()
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      onEndStroke()
    }
  }, [onEndStroke, onHoverLeave])

  // Touch support
  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      const touch = e.touches[0]
      if (!touch) return
      const coords = toPixelCoords(touch)
      if (!coords) return

      if (activeTool === 'eyedropper') {
        onPickColor(coords.x, coords.y)
        return
      }
      if (activeTool === 'fill') {
        onFillAt(coords.x, coords.y)
        return
      }

      isDrawingRef.current = true
      onBeginStroke()
      onDrawPixel(coords.x, coords.y)
    },
    [activeTool, toPixelCoords, onBeginStroke, onDrawPixel, onPickColor, onFillAt]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (!isDrawingRef.current) return
      const touch = e.touches[0]
      if (!touch) return
      const coords = toPixelCoords(touch)
      if (!coords) return
      onDrawPixel(coords.x, coords.y)
    },
    [toPixelCoords, onDrawPixel]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (isDrawingRef.current) {
        isDrawingRef.current = false
        onEndStroke()
      }
    },
    [onEndStroke]
  )

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        width: canvasWidth,
        height: canvasHeight,
        cursor: 'crosshair',
        touchAction: 'none',
      }}
      className="block border border-border rounded"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Skin pixel editor canvas"
    />
  )
}
