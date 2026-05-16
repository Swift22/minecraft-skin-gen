import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runArtist } from '@/lib/intent/artist'
import { buildSkinPngV2 } from '@/lib/skin-builder-v2'
import { skinIntentSchema, skinPixelsSchema, type BodyRegion } from '@/lib/intent/schema'
import { IS_LOCAL_MODE } from '@/lib/local-mode'

const bodySchema = z.object({
  regions: z.array(z.string()).min(1),
})

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: generationId } = await ctx.params
  const body = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!body.success) {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }
  const requestedRegions = body.data.regions as BodyRegion[]

  // Load the generation
  const rows = await db.select().from(skinGenerations).where(eq(skinGenerations.id, generationId))
  const gen = rows[0]
  if (!gen || !gen.intent || !gen.pixels) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const overrides = new Set<string>((gen.manualOverrides as string[]) ?? [])
  const blocked = requestedRegions.filter((r) => overrides.has(r))
  if (blocked.length > 0) {
    return NextResponse.json({ error: 'region_locked', regions: blocked }, { status: 409 })
  }

  // Auth (skip in local mode)
  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== gen.userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const intent = skinIntentSchema.parse(gen.intent)
  const currentPixels = gen.pixels as Record<string, string[][]>

  // Re-run Artist for the requested regions only
  const repaintedPartial = await runArtist({
    intent,
    regions: requestedRegions,
    context: currentPixels as Partial<import('@/lib/intent/schema').SkinPixels>,
  })

  // Merge into existing pixels
  const merged = { ...currentPixels, ...repaintedPartial }
  const validatedPixels = skinPixelsSchema.parse(merged)

  // Rebuild PNG
  const png = await buildSkinPngV2(intent, validatedPixels)

  // Update DB + storage
  let newSignedUrl: string | undefined
  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const skinPath = gen.resultPath ?? `skins/${gen.userId}/${generationId}.png`
    await supabase.storage.from('skins').upload(skinPath, png, { contentType: 'image/png', upsert: true })
    const { data } = await supabase.storage.from('skins').createSignedUrl(skinPath, 3600)
    newSignedUrl = data?.signedUrl
  }

  await db.update(skinGenerations).set({
    pixels: validatedPixels,
    intent: {
      ...intent,
      refinement_history: [
        ...intent.refinement_history,
        {
          type: 'region_reroll',
          at: new Date().toISOString(),
          description: `Re-rolled ${requestedRegions.join(', ')}`,
          affected_regions: requestedRegions,
        },
      ],
    },
  }).where(eq(skinGenerations.id, generationId))

  return NextResponse.json({ pixels: validatedPixels, skinUrl: newSignedUrl })
}
