import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runPatch, applyPatch } from '@/lib/intent/patch'
import { runArtist } from '@/lib/intent/artist'
import { buildSkinPngV2 } from '@/lib/skin-builder-v2'
import { skinIntentSchema, skinPixelsSchema, type BodyRegion } from '@/lib/intent/schema'
import { IS_LOCAL_MODE } from '@/lib/local-mode'

const bodySchema = z.object({ instruction: z.string().min(1).max(500) })

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: generationId } = await ctx.params
  const body = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const rows = await db.select().from(skinGenerations).where(eq(skinGenerations.id, generationId))
  const gen = rows[0]
  if (!gen || !gen.intent || !gen.pixels) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== gen.userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const currentIntent = skinIntentSchema.parse(gen.intent)
  const currentPixels = gen.pixels as Record<string, string[][]>
  const overrides = new Set<string>((gen.manualOverrides as string[]) ?? [])

  // 1. Patch LLM
  const patch = await runPatch({ intent: currentIntent, instruction: body.data.instruction })

  // Empty patch → 422
  if (
    patch.affected_regions.length === 0 &&
    !patch.affects_character &&
    !patch.palette_changes &&
    !patch.character_changes &&
    !patch.outfit_changes
  ) {
    return NextResponse.json(
      {
        error: 'unactionable',
        message: "I'm not sure what to change. Try editing the palette directly or be more specific.",
      },
      { status: 422 }
    )
  }

  // 2. Apply patch to intent
  const nextIntent = applyPatch(currentIntent, patch)

  // 3. Repaint affected body regions (skip manually-locked ones)
  const regionsToRepaint = patch.affected_regions.filter((r) => !overrides.has(r)) as BodyRegion[]
  let nextPixels = currentPixels
  if (regionsToRepaint.length > 0) {
    const repainted = await runArtist({
      intent: nextIntent,
      regions: regionsToRepaint,
      context: currentPixels as Partial<import('@/lib/intent/schema').SkinPixels>,
    })
    nextPixels = { ...currentPixels, ...repainted }
  }
  const validatedPixels = skinPixelsSchema.parse(nextPixels)

  // 4. Rebuild PNG and persist
  const png = await buildSkinPngV2(nextIntent, validatedPixels)
  let newSignedUrl: string | undefined
  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const skinPath = gen.resultPath ?? `skins/${gen.userId}/${generationId}.png`
    await supabase.storage.from('skins').upload(skinPath, png, { contentType: 'image/png', upsert: true })
    const { data } = await supabase.storage.from('skins').createSignedUrl(skinPath, 3600)
    newSignedUrl = data?.signedUrl
  }

  const updatedIntent = {
    ...nextIntent,
    refinement_history: [
      ...nextIntent.refinement_history,
      {
        type: 'patch' as const,
        at: new Date().toISOString(),
        description: body.data.instruction,
        affected_regions: regionsToRepaint,
      },
    ],
  }
  await db
    .update(skinGenerations)
    .set({ intent: updatedIntent, pixels: validatedPixels })
    .where(eq(skinGenerations.id, generationId))

  return NextResponse.json({ intent: updatedIntent, pixels: validatedPixels, skinUrl: newSignedUrl })
}
