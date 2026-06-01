'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { GeneratorForm } from '@/components/skin-generator/GeneratorForm'
import { SkinPreview } from '@/components/skin-generator/SkinPreview'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { VariationsGrid } from '@/components/skin-editor/VariationsGrid'
import type { SkinIntent } from '@/lib/intent/schema'

interface GenerationResult {
  generationId: string
  status: 'completed' | 'failed'
  skinUrl?: string
  intent?: SkinIntent
}

export function GeneratorPageClient() {
  const router = useRouter()
  const [skinUrl, setSkinUrl] = useState<string | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [intent, setIntent] = useState<SkinIntent | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [regenerateTrigger, setRegenerateTrigger] = useState(0)
  const [variations, setVariations] = useState<{ generationId: string; skinUrl: string }[]>([])
  const [variationsLoading, setVariationsLoading] = useState(false)

  function handleResult(result: GenerationResult) {
    if (result.status === 'completed' && result.skinUrl) {
      setSkinUrl(result.skinUrl)
      setGenerationId(result.generationId)
      setIntent(result.intent ?? null)
      toast.success('Skin generated!')
    } else {
      toast.error('Generation failed. Please try again.')
    }
  }

  function handleError(message: string) {
    toast.error(message)
  }

  function handleRegenerate() {
    setSkinUrl(null)
    setGenerationId(null)
    setIntent(null)
    setVariations([])
    setRegenerateTrigger((n) => n + 1)
  }

  async function handleGenerateVariations() {
    if (!generationId) return
    setVariationsLoading(true)
    const res = await fetch(`/api/generate/${generationId}/variations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count: 3 }),
    })
    setVariationsLoading(false)
    if (!res.ok) {
      toast.error('Variations failed')
      return
    }
    const j = await res.json()
    setVariations(j.variations)
  }

  return (
    <div className="animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Preview — shown first on mobile */}
          <div className="md:order-2 space-y-4">
            <h2 className="font-pixel text-[10px] text-muted-foreground mb-3">&gt; PREVIEW</h2>
            <SkinPreview
              skinUrl={skinUrl}
              generationId={generationId}
              onRegenerate={handleRegenerate}
              isGenerating={isGenerating}
              intent={intent}
            />
            {skinUrl && (
              <>
                <Button onClick={handleGenerateVariations} disabled={variationsLoading}>
                  {variationsLoading ? 'Generating variations…' : 'Generate 3 variations'}
                </Button>
                {variations.length > 0 && (
                  <VariationsGrid
                    variations={variations}
                    onSelect={(id) => router.push(`/edit?id=${id}`)}
                  />
                )}
              </>
            )}
          </div>

          {/* Form */}
          <div className="md:order-1">
            <h2 className="font-pixel text-[10px] text-muted-foreground mb-3">&gt; CREATE</h2>
            <GeneratorForm
              key={regenerateTrigger}
              onResult={handleResult}
              onError={handleError}
              onLoadingChange={setIsGenerating}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
