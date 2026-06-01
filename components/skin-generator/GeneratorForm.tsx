'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StylePresets } from './StylePresets'
import { FaceTemplatePicker } from './FaceTemplatePicker'
import { EarTemplatePicker } from './EarTemplatePicker'
import { Upload, X } from 'lucide-react'

const MAX_PROMPT_LENGTH = 1000

interface GenerationResult {
  generationId: string
  status: 'completed' | 'failed'
  skinUrl?: string
}

interface GeneratorFormProps {
  onResult: (result: GenerationResult) => void
  onError: (message: string) => void
  onLoadingChange?: (loading: boolean) => void
  disabled?: boolean
}

export function GeneratorForm({ onResult, onError, onLoadingChange, disabled = false }: GeneratorFormProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedPresets, setSelectedPresets] = useState<string[]>([])
  const [faceTemplate, setFaceTemplate] = useState<number | null>(null)
  const [earTemplate, setEarTemplate] = useState(0)
  const [referenceFile, setReferenceFile] = useState<File | null>(null)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('Generating your skin\u2026')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const slowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isLoading) {
      slowTimerRef.current = setTimeout(() => {
        setLoadingMessage('Still working, this can take up to 30 seconds\u2026')
      }, 5000)
    } else {
      if (slowTimerRef.current) {
        clearTimeout(slowTimerRef.current)
      }
      setLoadingMessage('Generating your skin\u2026')
    }
    return () => {
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current)
    }
  }, [isLoading])

  function handlePresetToggle(keywords: string) {
    setSelectedPresets((prev) =>
      prev.includes(keywords) ? prev.filter((k) => k !== keywords) : [...prev, keywords]
    )
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const file = event.target.files?.[0] ?? null
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError('Reference image must be under 10 MB.')
        event.target.value = ''
        return
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setFileError('Only JPEG and PNG images are accepted.')
        event.target.value = ''
        return
      }
      setThumbnailUrl(URL.createObjectURL(file))
    }
    setReferenceFile(file)
  }

  function clearFile() {
    if (thumbnailUrl) URL.revokeObjectURL(thumbnailUrl)
    setReferenceFile(null)
    setThumbnailUrl(null)
    setFileError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading || disabled) return

    setIsLoading(true)
    onLoadingChange?.(true)

    const fullPrompt = [prompt.trim(), ...selectedPresets].filter(Boolean).join('. ')
    const formData = new FormData()
    if (fullPrompt) formData.append('prompt', fullPrompt)
    if (referenceFile) formData.append('referenceImage', referenceFile)
    if (faceTemplate !== null) formData.append('faceTemplate', String(faceTemplate))
    if (earTemplate > 0) formData.append('earTemplate', String(earTemplate))

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        onError(data.message ?? 'Generation failed. Please try again.')
        return
      }

      onResult(data as GenerationResult)
    } catch {
      onError('A network error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      onLoadingChange?.(false)
    }
  }

  const charsLeft = MAX_PROMPT_LENGTH - prompt.length
  const canSubmit = (prompt.trim().length > 0 || !!referenceFile || selectedPresets.length > 0) && !disabled

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <StylePresets selected={selectedPresets} onToggle={handlePresetToggle} />

      <FaceTemplatePicker value={faceTemplate} onChange={setFaceTemplate} />

      <EarTemplatePicker value={earTemplate} onChange={setEarTemplate} />

      <div className="space-y-1">
        <Label htmlFor="prompt">Describe your skin</Label>
        <Textarea
          id="prompt"
          placeholder="e.g. A knight in silver armor with a red cape and a closed visor"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={MAX_PROMPT_LENGTH}
          rows={4}
          disabled={isLoading || disabled}
          aria-describedby="prompt-counter"
        />
        <p id="prompt-counter" className="text-xs text-muted-foreground text-right">
          {charsLeft} characters remaining
        </p>
      </div>

      <div className="space-y-2">
        <Label>Reference image (optional)</Label>
        {!referenceFile ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || disabled}
            className="w-full rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <Upload className="h-6 w-6" />
            <span className="text-sm">Click to upload</span>
            <span className="text-xs text-muted-foreground">JPEG or PNG, max 10 MB</span>
          </button>
        ) : (
          <div className="relative rounded-lg border border-border p-3 flex items-center gap-3">
            {thumbnailUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={thumbnailUrl}
                alt="Reference preview"
                className="h-16 w-16 rounded object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{referenceFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(referenceFile.size / 1024).toFixed(0)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Remove reference image"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={isLoading || disabled}
          className="hidden"
          aria-label="Upload a JPEG or PNG reference image (max 10 MB)"
        />
        {fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={!canSubmit || isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {loadingMessage}
          </span>
        ) : (
          'Generate Skin'
        )}
      </Button>
    </form>
  )
}
