'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CreditCounter } from '@/components/skin-generator/CreditCounter'
import { GeneratorForm } from '@/components/skin-generator/GeneratorForm'
import { SkinPreview } from '@/components/skin-generator/SkinPreview'
import { UpgradePrompt } from '@/components/skin-generator/UpgradePrompt'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { AdUnit } from '@/components/ads/AdUnit'
import { VariationsGrid } from '@/components/skin-editor/VariationsGrid'
import type { SkinIntent } from '@/lib/intent/schema'

const AD_BANNER_SLOT = '1234567890'

interface UserData {
  id: string
  email: string
  creditsRemaining: number
  dailyLimit: number
  isSubscriber: boolean
  subscriptionEndsAt: string | null
}

interface GenerationResult {
  generationId: string
  status: 'completed' | 'failed'
  skinUrl?: string
  intent?: SkinIntent
  creditsRemaining: number
}

interface GeneratorPageClientProps {
  initialUser: UserData
}

export function GeneratorPageClient({ initialUser }: GeneratorPageClientProps) {
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
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
    setUser((prev) => ({ ...prev, creditsRemaining: result.creditsRemaining }))
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
    if (res.status === 402) {
      toast.error('Not enough credits for variations')
      return
    }
    if (!res.ok) {
      toast.error('Variations failed')
      return
    }
    const j = await res.json()
    setVariations(j.variations)
  }

  const isExhausted = user.creditsRemaining === 0

  return (
    <div className="animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {!user.isSubscriber && <AdUnit slot={AD_BANNER_SLOT} />}

        <CreditCounter creditsRemaining={user.creditsRemaining} dailyLimit={user.dailyLimit} />

        <Separator />

        {isExhausted && !user.isSubscriber && <UpgradePrompt />}

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
                  {variationsLoading ? 'Generating variations…' : 'Generate 3 variations (3 credits)'}
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
              disabled={isExhausted}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
