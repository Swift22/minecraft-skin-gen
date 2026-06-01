import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { runArtist } from '@/lib/intent/artist'
import { buildSkinPngV2 } from '@/lib/skin-builder-v2'
import { skinIntentSchema, skinPixelsSchema, type SkinIntent, type SkinPixels, type BodyRegion } from '@/lib/intent/schema'
import { IS_LOCAL_MODE } from '@/lib/local-mode'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const bodySchema = z.object({ count: z.number().int().min(1).max(5) })

const ALL_BODY_REGIONS: BodyRegion[] = [
  'torso_front', 'torso_back', 'torso_side',
  'arm_front', 'arm_side', 'arm_back',
  'leg_front', 'leg_side', 'leg_back',
]

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: generationId } = await ctx.params
  const body = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'invalid_body' }, { status: 400 })

  const rows = await db.select().from(skinGenerations).where(eq(skinGenerations.id, generationId))
  const gen = rows[0]
  if (!gen || !gen.intent) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  const baseIntent = skinIntentSchema.parse(gen.intent)

  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== gen.userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }

  }

  const userId = gen.userId

  // Generate N variations in parallel
  const results = await Promise.allSettled(
    Array.from({ length: body.data.count }, (_, i) =>
      generateVariation(baseIntent, baseIntent.seed + i + 1, userId, generationId)
    )
  )

  const variations: { generationId: string; skinUrl: string }[] = []
  const failures: number[] = []
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') variations.push(r.value)
    else failures.push(i)
  })

  return NextResponse.json({ variations, failedCount: failures.length })
}

async function generateVariation(
  baseIntent: SkinIntent,
  seed: number,
  userId: string,
  parentId: string
): Promise<{ generationId: string; skinUrl: string }> {
  void parentId // reserved for future parent tracking

  const intent: SkinIntent = { ...baseIntent, seed }
  const pixelsPartial = await runArtist({ intent, regions: ALL_BODY_REGIONS })
  const pixels: SkinPixels = skinPixelsSchema.parse(pixelsPartial)
  const png = await buildSkinPngV2(intent, pixels)

  if (IS_LOCAL_MODE) {
    const varId = randomUUID()
    const dir = path.join(process.cwd(), 'public', 'local-skins')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, `${varId}.png`), png)
    return { generationId: varId, skinUrl: `/local-skins/${varId}.png` }
  }

  const supabase = await createClient()
  const insertResult = await db.insert(skinGenerations).values({
    userId,
    prompt: null,
    status: 'pending',
    schemaVersion: 'v2',
  }).returning({ id: skinGenerations.id })
  const row = insertResult[0]
  if (!row) throw new Error('Insert returned no row')
  const varId = row.id

  const skinPath = `skins/${userId}/${varId}.png`
  const { error } = await supabase.storage.from('skins').upload(skinPath, png, { contentType: 'image/png' })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  await db.update(skinGenerations).set({
    status: 'completed',
    resultPath: skinPath,
    completedAt: new Date(),
    intent,
    pixels,
    manualOverrides: [],
  }).where(eq(skinGenerations.id, varId))

  const { data } = await supabase.storage.from('skins').createSignedUrl(skinPath, 3600)
  return { generationId: varId, skinUrl: data?.signedUrl ?? '' }
}
