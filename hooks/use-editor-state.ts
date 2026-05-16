'use client'

import { useState, useCallback, useRef } from 'react'
import { PixelBuffer, type Pixel } from '@/lib/skin-editor/pixel-buffer'
import { UndoHistory } from '@/lib/skin-editor/history'
import { floodFill } from '@/lib/skin-editor/flood-fill'
import { downloadPng } from '@/lib/skin-editor/export-png'
import type { SkinRegion } from '@/lib/skin-regions'
import type { SkinIntent, SkinPixels } from '@/lib/intent/schema'

export type EditorTool = 'pencil' | 'eraser' | 'eyedropper' | 'fill'

const ZOOM_LEVELS = [4, 6, 8, 10, 12, 16] as const
const DEFAULT_ZOOM_INDEX = 2 // 8x

export interface EditorState {
  buffer: PixelBuffer
  activeTool: EditorTool
  foregroundColor: Pixel
  zoomLevel: number
  showGrid: boolean
  showRegions: boolean
  hoveredRegion: SkinRegion | null
  isDirty: boolean
  canUndo: boolean
  canRedo: boolean
  recentColors: string[]
}

export interface EditorActions {
  setTool: (tool: EditorTool) => void
  setForegroundColor: (color: Pixel) => void
  setForegroundColorHex: (hex: string) => void
  zoomIn: () => void
  zoomOut: () => void
  toggleGrid: () => void
  toggleRegions: () => void
  setHoveredRegion: (region: SkinRegion | null) => void
  undo: () => void
  redo: () => void
  /** Called on mousedown/touchstart — begins a new stroke */
  beginStroke: () => void
  /** Called for each pixel drawn in a stroke */
  drawPixel: (x: number, y: number) => void
  /** Called on mouseup/touchend — finalizes the stroke */
  endStroke: () => void
  /** Eyedropper: pick color from pixel */
  pickColor: (x: number, y: number) => void
  /** Fill tool action */
  fillAt: (x: number, y: number) => void
  download: () => void
  /** Get current data URL for 3D preview */
  getDataUrl: () => string
}

function hexToPixel(hex: string): Pixel {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
    255,
  ]
}

function pixelToHex(pixel: Pixel): string {
  return `#${pixel[0].toString(16).padStart(2, '0')}${pixel[1].toString(16).padStart(2, '0')}${pixel[2].toString(16).padStart(2, '0')}`
}

export function useEditorState(initialBuffer?: PixelBuffer): {
  state: EditorState
  actions: EditorActions
  intent: SkinIntent | null
  setIntent: (intent: SkinIntent | null) => void
  pixels: SkinPixels | null
  setPixels: (pixels: SkinPixels | null) => void
  manualOverrides: Set<string>
  loadFromGeneration: (args: {
    intent: SkinIntent
    pixels: SkinPixels
    manualOverrides: string[]
  }) => void
  markRegionManual: (region: string) => void
  clearManualLock: (region: string) => void
} {
  const resolvedBuffer = initialBuffer ?? new PixelBuffer()
  const [buffer, setBuffer] = useState<PixelBuffer>(() => resolvedBuffer)
  const [activeTool, setActiveTool] = useState<EditorTool>('pencil')
  const [foregroundColor, setForegroundColor] = useState<Pixel>([0, 0, 0, 255])
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [showGrid, setShowGrid] = useState(true)
  const [showRegions, setShowRegions] = useState(false)
  const [hoveredRegion, setHoveredRegion] = useState<SkinRegion | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [recentColors, setRecentColors] = useState<string[]>(['#000000'])
  const [, forceRender] = useState(0)

  // v2 fields
  const [intent, setIntent] = useState<SkinIntent | null>(null)
  const [pixels, setPixels] = useState<SkinPixels | null>(null)
  const [manualOverrides, setManualOverrides] = useState<Set<string>>(new Set())

  const historyRef = useRef<UndoHistory>(new UndoHistory())
  const isStrokingRef = useRef(false)
  const lastPixelRef = useRef<{ x: number; y: number } | null>(null)

  // Initialize history with the first state
  const initializedRef = useRef(false)
  if (!initializedRef.current) {
    historyRef.current.push(resolvedBuffer)
    initializedRef.current = true
  }

  const addRecentColor = useCallback((hex: string) => {
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== hex)
      return [hex, ...filtered].slice(0, 16)
    })
  }, [])

  const syncHistoryState = useCallback(() => {
    setCanUndo(historyRef.current.canUndo)
    setCanRedo(historyRef.current.canRedo)
  }, [])

  const setTool = useCallback((tool: EditorTool) => {
    setActiveTool(tool)
  }, [])

  const setForegroundColorAction = useCallback(
    (color: Pixel) => {
      setForegroundColor(color)
      addRecentColor(pixelToHex(color))
    },
    [addRecentColor]
  )

  const setForegroundColorHex = useCallback(
    (hex: string) => {
      setForegroundColor(hexToPixel(hex))
      addRecentColor(hex.toLowerCase())
    },
    [addRecentColor]
  )

  const zoomIn = useCallback(() => {
    setZoomIndex((i) => Math.min(i + 1, ZOOM_LEVELS.length - 1))
  }, [])

  const zoomOut = useCallback(() => {
    setZoomIndex((i) => Math.max(i - 1, 0))
  }, [])

  const toggleGrid = useCallback(() => {
    setShowGrid((v) => !v)
  }, [])

  const toggleRegions = useCallback(() => {
    setShowRegions((v) => !v)
  }, [])

  const beginStroke = useCallback(() => {
    isStrokingRef.current = true
    lastPixelRef.current = null
  }, [])

  const drawPixel = useCallback(
    (x: number, y: number) => {
      if (x < 0 || x >= 64 || y < 0 || y >= 64) return

      const color: Pixel = activeTool === 'eraser' ? [0, 0, 0, 0] : foregroundColor

      // Bresenham interpolation between last and current pixel
      const last = lastPixelRef.current
      if (last && (last.x !== x || last.y !== y)) {
        const dx = Math.abs(x - last.x)
        const dy = Math.abs(y - last.y)
        const sx = last.x < x ? 1 : -1
        const sy = last.y < y ? 1 : -1
        let err = dx - dy
        let cx = last.x
        let cy = last.y

        while (cx !== x || cy !== y) {
          if (cx >= 0 && cx < 64 && cy >= 0 && cy < 64) {
            buffer.setPixel(cx, cy, color)
          }
          const e2 = 2 * err
          if (e2 > -dy) {
            err -= dy
            cx += sx
          }
          if (e2 < dx) {
            err += dx
            cy += sy
          }
        }
      }

      buffer.setPixel(x, y, color)
      lastPixelRef.current = { x, y }
      setIsDirty(true)
      forceRender((n) => n + 1)
    },
    [buffer, activeTool, foregroundColor]
  )

  const endStroke = useCallback(() => {
    if (isStrokingRef.current) {
      isStrokingRef.current = false
      lastPixelRef.current = null
      historyRef.current.push(buffer)
      syncHistoryState()
    }
  }, [buffer, syncHistoryState])

  const pickColor = useCallback(
    (x: number, y: number) => {
      if (x < 0 || x >= 64 || y < 0 || y >= 64) return
      const pixel = buffer.getPixel(x, y)
      setForegroundColor(pixel)
      addRecentColor(pixelToHex(pixel))
    },
    [buffer, addRecentColor]
  )

  const fillAt = useCallback(
    (x: number, y: number) => {
      if (x < 0 || x >= 64 || y < 0 || y >= 64) return
      floodFill(buffer, x, y, foregroundColor)
      historyRef.current.push(buffer)
      setIsDirty(true)
      syncHistoryState()
      forceRender((n) => n + 1)
    },
    [buffer, foregroundColor, syncHistoryState]
  )

  const undo = useCallback(() => {
    const prev = historyRef.current.undo()
    if (prev) {
      setBuffer(prev)
      setIsDirty(true)
      syncHistoryState()
    }
  }, [syncHistoryState])

  const redo = useCallback(() => {
    const next = historyRef.current.redo()
    if (next) {
      setBuffer(next)
      setIsDirty(true)
      syncHistoryState()
    }
  }, [syncHistoryState])

  const download = useCallback(() => {
    downloadPng(buffer)
  }, [buffer])

  const getDataUrl = useCallback(() => {
    return buffer.toDataUrl()
  }, [buffer])

  // v2 methods
  const loadFromGeneration = useCallback(
    (args: { intent: SkinIntent; pixels: SkinPixels; manualOverrides: string[] }) => {
      setIntent(args.intent)
      setPixels(args.pixels)
      setManualOverrides(new Set(args.manualOverrides))
    },
    []
  )

  const markRegionManual = useCallback((region: string) => {
    setManualOverrides((prev) => new Set([...prev, region]))
  }, [])

  const clearManualLock = useCallback((region: string) => {
    setManualOverrides((prev) => {
      const next = new Set(prev)
      next.delete(region)
      return next
    })
  }, [])

  return {
    state: {
      buffer,
      activeTool,
      foregroundColor,
      zoomLevel: ZOOM_LEVELS[zoomIndex] ?? ZOOM_LEVELS[DEFAULT_ZOOM_INDEX]!,
      showGrid,
      showRegions,
      hoveredRegion,
      isDirty,
      canUndo,
      canRedo,
      recentColors,
    },
    actions: {
      setTool,
      setForegroundColor: setForegroundColorAction,
      setForegroundColorHex,
      zoomIn,
      zoomOut,
      toggleGrid,
      toggleRegions,
      setHoveredRegion: (region: SkinRegion | null) => setHoveredRegion(region),
      undo,
      redo,
      beginStroke,
      drawPixel,
      endStroke,
      pickColor,
      fillAt,
      download,
      getDataUrl,
    },
    intent,
    setIntent,
    pixels,
    setPixels,
    manualOverrides,
    loadFromGeneration,
    markRegionManual,
    clearManualLock,
  }
}
