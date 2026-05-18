'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Upload, Download, Grid3X3, Eye, EyeOff, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { PixelBuffer } from '@/lib/skin-editor/pixel-buffer'
import { useEditorState } from '@/hooks/use-editor-state'
import { SkinCanvas } from '@/components/skin-editor/SkinCanvas'
import { EditorToolbar } from '@/components/skin-editor/EditorToolbar'
import { ColorPalette } from '@/components/skin-editor/ColorPalette'
import { EditorPreview } from '@/components/skin-editor/EditorPreview'
import { HistoryControls } from '@/components/skin-editor/HistoryControls'
import { ZoomControls } from '@/components/skin-editor/ZoomControls'
import { PaletteSwatches } from '@/components/skin-editor/PaletteSwatches'
import { CharacterParameters } from '@/components/skin-editor/CharacterParameters'
import { CharacterColors } from '@/components/skin-editor/CharacterColors'
import { RefinementChat } from '@/components/skin-editor/RefinementChat'
import { getRegionAt } from '@/lib/skin-editor/region-lookup'
import type { SkinIntent, SkinPixels } from '@/lib/intent/schema'

interface EditPageClientProps {
  skinUrl?: string | null
  generationId?: string
}

function loadImageToBuffer(src: string): Promise<PixelBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      if (img.width !== 64 || img.height !== 64) {
        reject(new Error(`Invalid dimensions: ${img.width}x${img.height}. Must be 64x64.`))
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const imageData = ctx.getImageData(0, 0, 64, 64)
      resolve(PixelBuffer.fromImageData(imageData))
    }
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export function EditPageClient({ skinUrl: initialSkinUrl, generationId }: EditPageClientProps) {
  const [buffer, setBuffer] = useState<PixelBuffer | null>(null)
  const [skinUrl, setSkinUrl] = useState<string | null | undefined>(initialSkinUrl)
  const [loading, setLoading] = useState(!!initialSkinUrl)
  const [error, setError] = useState<string | null>(null)

  // Load skin from URL
  useEffect(() => {
    if (!skinUrl) return
    setLoading(true)
    loadImageToBuffer(skinUrl)
      .then((buf) => {
        setBuffer(buf)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
        toast.error('Failed to load skin')
      })
  }, [skinUrl])

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/png')) {
      toast.error('Please upload a PNG file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      loadImageToBuffer(reader.result as string)
        .then((buf) => {
          setBuffer(buf)
          setError(null)
          toast.success('Skin loaded!')
        })
        .catch((err) => {
          toast.error(err.message)
        })
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (!file) return

    if (!file.type.startsWith('image/png')) {
      toast.error('Please upload a PNG file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      loadImageToBuffer(reader.result as string)
        .then((buf) => {
          setBuffer(buf)
          setError(null)
          toast.success('Skin loaded!')
        })
        .catch((err) => {
          toast.error(err.message)
        })
    }
    reader.readAsDataURL(file)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-muted-foreground animate-pulse">Loading skin...</p>
      </div>
    )
  }

  if (error && !buffer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <UploadDropzone onFileUpload={handleFileUpload} onDrop={handleDrop} />
      </div>
    )
  }

  if (!buffer) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-fade-in">
        <h1 className="text-lg font-semibold mb-6 text-center">Edit Skin</h1>
        <UploadDropzone onFileUpload={handleFileUpload} onDrop={handleDrop} />
      </div>
    )
  }

  return (
    <Editor
      initialBuffer={buffer}
      generationId={generationId}
      onSkinUrlChange={setSkinUrl}
    />
  )
}

function UploadDropzone({
  onFileUpload,
  onDrop,
}: {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary/40 transition-colors cursor-pointer"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      onClick={() => document.getElementById('skin-upload')?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          document.getElementById('skin-upload')?.click()
        }
      }}
    >
      <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
      <p className="text-sm text-muted-foreground mb-1">
        Drop a 64x64 PNG here or click to upload
      </p>
      <p className="text-xs text-muted-foreground">Minecraft Java Edition skin format</p>
      <input
        id="skin-upload"
        type="file"
        accept="image/png"
        onChange={onFileUpload}
        className="hidden"
        aria-label="Upload skin PNG"
      />
    </div>
  )
}

interface EditorProps {
  initialBuffer: PixelBuffer
  generationId?: string
  onSkinUrlChange: (url: string) => void
}

function Editor({ initialBuffer, generationId, onSkinUrlChange }: EditorProps) {
  const editor = useEditorState(initialBuffer)
  const { state, actions } = editor
  const [previewDataUrl, setPreviewDataUrl] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // v2 UI state
  const [rerollingRegion, setRerollingRegion] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | undefined>(undefined)

  // Fetch generation data on mount if generationId present
  useEffect(() => {
    if (!generationId) return
    fetch(`/api/generate/${generationId}`)
      .then((r) => r.json())
      .then((json: { intent?: SkinIntent; pixels?: SkinPixels; manual_overrides?: string[]; skinUrl?: string }) => {
        if (json.intent && json.pixels) {
          editor.loadFromGeneration({
            intent: json.intent,
            pixels: json.pixels,
            manualOverrides: json.manual_overrides ?? [],
          })
        }
        if (json.skinUrl) {
          onSkinUrlChange(json.skinUrl)
        }
      })
      .catch(() => toast.error('Failed to load generation data'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generationId])

  // Debounced 3D preview update
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPreviewDataUrl(actions.getDataUrl())
    }, 50)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // Trigger when buffer changes (indicated by isDirty or canUndo/canRedo state changes)
  }, [state.buffer, state.isDirty, state.canUndo, state.canRedo, actions])

  // Initial preview
  useEffect(() => {
    setPreviewDataUrl(actions.getDataUrl())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't trigger shortcuts when typing in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.shiftKey && e.key.toLowerCase() === 'z') {
          e.preventDefault()
          actions.redo()
        } else if (e.key.toLowerCase() === 'z') {
          e.preventDefault()
          actions.undo()
        }
        return
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          actions.setTool('pencil')
          break
        case 'e':
          actions.setTool('eraser')
          break
        case 'i':
          actions.setTool('eyedropper')
          break
        case 'g':
          actions.setTool('fill')
          break
        case '=':
        case '+':
          actions.zoomIn()
          break
        case '-':
          actions.zoomOut()
          break
        case '#':
          actions.toggleGrid()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions])

  // beforeunload warning
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (state.isDirty) {
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [state.isDirty])

  const handleHover = useCallback(
    (x: number, y: number) => {
      const region = getRegionAt(x, y)
      actions.setHoveredRegion(region)
    },
    [actions]
  )

  // v2 handlers

  async function rebuildAndSave(intent: SkinIntent, pixels: SkinPixels) {
    if (!generationId) return
    const res = await fetch(`/api/generate/${generationId}/save`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ intent, pixels, manual_overrides: [...editor.manualOverrides] }),
    })
    const json = await res.json() as { skinUrl?: string }
    if (json.skinUrl) onSkinUrlChange(json.skinUrl)
  }

  async function handlePaletteChange(index: number, hex: string) {
    if (!editor.intent || !editor.pixels) return
    const nextIntent: SkinIntent = {
      ...editor.intent,
      palette: editor.intent.palette.map((c, i) => (i === index ? hex : c)),
    }
    editor.setIntent(nextIntent)
    await rebuildAndSave(nextIntent, editor.pixels)
  }

  async function handleCharacterChange(field: keyof SkinIntent['character'], value: string) {
    if (!editor.intent || !editor.pixels) return
    const nextIntent: SkinIntent = {
      ...editor.intent,
      character: { ...editor.intent.character, [field]: value },
    }
    editor.setIntent(nextIntent)
    await rebuildAndSave(nextIntent, editor.pixels)
  }

  async function handleReroll(region: string) {
    if (!generationId) return
    setRerollingRegion(region)
    const res = await fetch(`/api/generate/${generationId}/reroll`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ regions: [region] }),
    })
    setRerollingRegion(null)
    if (!res.ok) {
      toast.error('Re-roll failed')
      return
    }
    const json = await res.json() as { pixels?: SkinPixels; skinUrl?: string }
    if (json.pixels) editor.setPixels(json.pixels)
    if (json.skinUrl) onSkinUrlChange(json.skinUrl)
  }

  async function handlePatch(instruction: string) {
    if (!generationId) return
    setChatLoading(true)
    setChatError(undefined)
    const res = await fetch(`/api/generate/${generationId}/patch`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instruction }),
    })
    setChatLoading(false)
    if (res.status === 422) {
      const j = await res.json() as { message?: string }
      setChatError(j.message ?? 'Unactionable instruction')
      return
    }
    if (!res.ok) {
      setChatError('Patch failed')
      return
    }
    const j = await res.json() as { intent?: SkinIntent; pixels?: SkinPixels; skinUrl?: string }
    if (j.intent) editor.setIntent(j.intent)
    if (j.pixels) editor.setPixels(j.pixels)
    if (j.skinUrl) onSkinUrlChange(j.skinUrl)
  }

  async function handleSave() {
    if (!generationId || !editor.intent || !editor.pixels) return
    const res = await fetch(`/api/generate/${generationId}/save`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        intent: editor.intent,
        pixels: editor.pixels,
        manual_overrides: [...editor.manualOverrides],
      }),
    })
    if (!res.ok) {
      toast.error('Save failed')
      return
    }
    const j = await res.json() as { skinUrl?: string }
    if (j.skinUrl) onSkinUrlChange(j.skinUrl)
    toast.success('Saved')
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Edit Skin</h1>
          {state.isDirty && (
            <Badge variant="outline" className="text-xs">
              Unsaved changes
            </Badge>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <EditorToolbar activeTool={state.activeTool} onToolChange={actions.setTool} />

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          <HistoryControls
            canUndo={state.canUndo}
            canRedo={state.canRedo}
            onUndo={actions.undo}
            onRedo={actions.redo}
          />

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          <div className="flex items-center gap-1">
            <Button
              variant={state.showGrid ? 'default' : 'outline'}
              size="icon"
              onClick={actions.toggleGrid}
              aria-label="Toggle grid (#)"
              aria-pressed={state.showGrid}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={state.showRegions ? 'default' : 'outline'}
              size="icon"
              onClick={actions.toggleRegions}
              aria-label="Toggle region borders"
              aria-pressed={state.showRegions}
            >
              {state.showRegions ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Separator orientation="vertical" className="h-8 hidden sm:block" />

          <ZoomControls
            zoomLevel={state.zoomLevel}
            onZoomIn={actions.zoomIn}
            onZoomOut={actions.zoomOut}
          />

          <div className="ml-auto flex items-center gap-2">
            {generationId && (
              <Button variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
            <Button onClick={actions.download}>
              <Download className="h-4 w-4 mr-2" />
              Download PNG
            </Button>
          </div>
        </div>

        <Separator />

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr_300px] gap-6">
          {/* Left: Color palette + v2 sidebar */}
          <div className="lg:order-1 order-2 flex flex-col gap-4">
            <ColorPalette
              foregroundColor={state.foregroundColor}
              recentColors={state.recentColors}
              onColorChange={actions.setForegroundColorHex}
            />

            {state.hoveredRegion && (
              <div className="p-2 rounded border border-border bg-card">
                <p className="text-xs text-muted-foreground">Region</p>
                <p className="text-sm font-medium">
                  {state.hoveredRegion.name.replace(/_/g, ' ')}
                </p>
                <Badge variant="outline" className="text-xs mt-1">
                  {state.hoveredRegion.layer}
                </Badge>
              </div>
            )}

            {editor.intent && (
              <>
                <PaletteSwatches
                  palette={editor.intent.palette}
                  onChange={handlePaletteChange}
                />
                <CharacterParameters
                  character={editor.intent.character}
                  onChange={handleCharacterChange}
                />
                <CharacterColors
                  character={editor.intent.character}
                  onChange={handleCharacterChange}
                />
              </>
            )}
          </div>

          {/* Center: Canvas */}
          <div className="lg:order-2 order-1 flex flex-col gap-2">
            <div className="flex justify-center overflow-auto">
              <SkinCanvas
                buffer={state.buffer}
                zoomLevel={state.zoomLevel}
                showGrid={state.showGrid}
                showRegions={state.showRegions}
                activeTool={state.activeTool}
                onBeginStroke={actions.beginStroke}
                onDrawPixel={actions.drawPixel}
                onEndStroke={actions.endStroke}
                onPickColor={actions.pickColor}
                onFillAt={actions.fillAt}
                onHover={handleHover}
                onHoverLeave={() => actions.setHoveredRegion(null)}
                onReroll={generationId ? handleReroll : undefined}
                lockedRegions={editor.manualOverrides}
                onPaintInRegion={editor.markRegionManual}
              />
            </div>
            {rerollingRegion && (
              <p className="text-xs text-muted-foreground text-center animate-pulse">
                Re-rolling {rerollingRegion.replace(/_/g, ' ')}…
              </p>
            )}
            {generationId && (
              <RefinementChat
                onSubmit={handlePatch}
                loading={chatLoading}
                error={chatError}
              />
            )}
          </div>

          {/* Right: 3D Preview */}
          <div className="lg:order-3 order-3 flex flex-col items-center">
            <p className="text-xs text-muted-foreground mb-2">Live Preview</p>
            {previewDataUrl && <EditorPreview dataUrl={previewDataUrl} />}
          </div>
        </div>
      </div>
    </div>
  )
}
