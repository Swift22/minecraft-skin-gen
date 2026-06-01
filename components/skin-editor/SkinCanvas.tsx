'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import type { PixelBuffer } from '@/lib/skin-editor/pixel-buffer'
import type { EditorTool } from '@/hooks/use-editor-state'
import { getRegionAt } from '@/lib/skin-editor/region-lookup'
import { RegionContextMenu } from './RegionContextMenu'

// UV body regions for the v2 skin layout (torso/arm/leg face breakdown)
const BODY_REGIONS = [
  { name: 'torso_front', x: 20, y: 20, w: 8, h: 12 },
  { name: 'torso_back',  x: 32, y: 20, w: 8, h: 12 },
  { name: 'torso_side',  x: 16, y: 20, w: 4, h: 12 },
  { name: 'arm_front',   x: 44, y: 20, w: 4, h: 12 },
  { name: 'arm_side',    x: 40, y: 20, w: 4, h: 12 },
  { name: 'arm_back',    x: 52, y: 20, w: 4, h: 12 },
  { name: 'leg_front',   x: 4,  y: 20, w: 4, h: 12 },
  { name: 'leg_side',    x: 0,  y: 20, w: 4, h: 12 },
  { name: 'leg_back',    x: 12, y: 20, w: 4, h: 12 },
] as const

function findRegion(uvX: number, uvY: number): string | null {
  for (const r of BODY_REGIONS) {
    if (uvX >= r.x && uvX < r.x + r.w && uvY >= r.y && uvY < r.y + r.h) return r.name
  }
  return null
}

interface ContextMenuState {
  region: string
  x: number
  y: number
}

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
  /** Optional: called when user re-rolls a region via right-click menu */
  onReroll?: (region: string) => void
  /** Optional: set of region names that are manually locked */
  lockedRegions?: Set<string>
  /** Optional: called when a stroke ends on a body region (for manual override tracking) */
  onPaintInRegion?: (region: string) => void
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
  onReroll,
  lockedRegions,
  onPaintInRegion,
}: SkinCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  // Track regions touched during the current stroke for batch reporting
  const strokeRegionsRef = useRef<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

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

    // Lock badges for manually-overridden regions
    if (lockedRegions && lockedRegions.size > 0) {
      ctx.font = `${Math.max(8, zoomLevel - 2)}px sans-serif`
      ctx.textBaseline = 'top'
      for (const r of BODY_REGIONS) {
        if (!lockedRegions.has(r.name)) continue
        ctx.fillText('🔒', r.x * zoomLevel + 1, r.y * zoomLevel + 1)
      }
    }
  }, [buffer, zoomLevel, showGrid, showRegions, canvasWidth, canvasHeight, lockedRegions])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      // Only handle left-click; right-click is handled by onContextMenu
      if (e.button !== 0) return
      e.preventDefault()
      const coords = toPixelCoords(e)
      if (!coords) return

      if (activeTool === 'eyedropper') {
        onPickColor(coords.x, coords.y)
        return
      }
      if (activeTool === 'fill') {
        onFillAt(coords.x, coords.y)
        // Track region for fill commits
        if (onPaintInRegion) {
          const region = findRegion(coords.x, coords.y)
          if (region) onPaintInRegion(region)
        }
        return
      }

      strokeRegionsRef.current = new Set()
      isDrawingRef.current = true
      onBeginStroke()
      onDrawPixel(coords.x, coords.y)
      // Track first pixel's region
      const region = findRegion(coords.x, coords.y)
      if (region) strokeRegionsRef.current.add(region)
    },
    [activeTool, toPixelCoords, onBeginStroke, onDrawPixel, onPickColor, onFillAt, onPaintInRegion]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const coords = toPixelCoords(e)
      if (coords) {
        onHover(coords.x, coords.y)
      }
      if (!isDrawingRef.current || !coords) return
      onDrawPixel(coords.x, coords.y)
      // Accumulate regions touched during this stroke
      const region = findRegion(coords.x, coords.y)
      if (region) strokeRegionsRef.current.add(region)
    },
    [toPixelCoords, onDrawPixel, onHover]
  )

  const flushStrokeRegions = useCallback(() => {
    if (onPaintInRegion) {
      for (const region of strokeRegionsRef.current) {
        onPaintInRegion(region)
      }
    }
    strokeRegionsRef.current = new Set()
  }, [onPaintInRegion])

  const handleMouseUp = useCallback(() => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      flushStrokeRegions()
      onEndStroke()
    }
  }, [onEndStroke, flushStrokeRegions])

  const handleMouseLeave = useCallback(() => {
    onHoverLeave()
    if (isDrawingRef.current) {
      isDrawingRef.current = false
      flushStrokeRegions()
      onEndStroke()
    }
  }, [onEndStroke, onHoverLeave, flushStrokeRegions])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!onReroll) return
      e.preventDefault()
      const coords = toPixelCoords(e)
      if (!coords) return
      const region = findRegion(coords.x, coords.y)
      if (region) {
        setContextMenu({ region, x: e.clientX, y: e.clientY })
      }
    },
    [onReroll, toPixelCoords]
  )

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
        if (onPaintInRegion) {
          const region = findRegion(coords.x, coords.y)
          if (region) onPaintInRegion(region)
        }
        return
      }

      strokeRegionsRef.current = new Set()
      isDrawingRef.current = true
      onBeginStroke()
      onDrawPixel(coords.x, coords.y)
      const region = findRegion(coords.x, coords.y)
      if (region) strokeRegionsRef.current.add(region)
    },
    [activeTool, toPixelCoords, onBeginStroke, onDrawPixel, onPickColor, onFillAt, onPaintInRegion]
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
      const region = findRegion(coords.x, coords.y)
      if (region) strokeRegionsRef.current.add(region)
    },
    [toPixelCoords, onDrawPixel]
  )

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault()
      if (isDrawingRef.current) {
        isDrawingRef.current = false
        flushStrokeRegions()
        onEndStroke()
      }
    },
    [onEndStroke, flushStrokeRegions]
  )

  return (
    <>
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
        onContextMenu={handleContextMenu}
        aria-label="Skin pixel editor canvas"
      />
      {contextMenu && onReroll && (
        <RegionContextMenu
          region={contextMenu.region}
          x={contextMenu.x}
          y={contextMenu.y}
          locked={lockedRegions?.has(contextMenu.region) ?? false}
          onReroll={onReroll}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
