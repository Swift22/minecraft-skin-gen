import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { skinIntentSchema, skinPixelsSchema } from '@/lib/intent/schema'
import { buildSkinPngV2 } from '@/lib/skin-builder-v2'
import { IS_LOCAL_MODE } from '@/lib/local-mode'

const bodySchema = z.object({
  intent: skinIntentSchema,
  pixels: skinPixelsSchema,
  manual_overrides: z.array(z.string()),
})

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: generationId } = await ctx.params
  const body = bodySchema.safeParse(await request.json().catch(() => ({})))
  if (!body.success) return NextResponse.json({ error: 'invalid_body', details: body.error.format() }, { status: 400 })

  const rows = await db.select().from(skinGenerations).where(eq(skinGenerations.id, generationId))
  const gen = rows[0]
  if (!gen) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== gen.userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  // Rebuild PNG with the saved state
  const png = await buildSkinPngV2(body.data.intent, body.data.pixels)
  let skinUrl: string | undefined

  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const skinPath = gen.resultPath ?? `skins/${gen.userId}/${generationId}.png`
    await supabase.storage.from('skins').upload(skinPath, png, { contentType: 'image/png', upsert: true })
    const { data } = await supabase.storage.from('skins').createSignedUrl(skinPath, 3600)
    skinUrl = data?.signedUrl
  }

  await db.update(skinGenerations).set({
    intent: body.data.intent,
    pixels: body.data.pixels,
    manualOverrides: body.data.manual_overrides,
  }).where(eq(skinGenerations.id, generationId))

  return NextResponse.json({ ok: true, skinUrl })
}
