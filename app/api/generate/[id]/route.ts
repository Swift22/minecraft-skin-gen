import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { IS_LOCAL_MODE } from '@/lib/local-mode'

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const rows = await db.select().from(skinGenerations).where(eq(skinGenerations.id, id))
  const gen = rows[0]
  if (!gen) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  if (!IS_LOCAL_MODE) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.id !== gen.userId) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  let skinUrl: string | undefined
  if (gen.resultPath && !IS_LOCAL_MODE) {
    const supabase = await createClient()
    const { data } = await supabase.storage.from('skins').createSignedUrl(gen.resultPath, 3600)
    skinUrl = data?.signedUrl
  } else if (gen.resultPath && IS_LOCAL_MODE) {
    skinUrl = `/local-skins/${id}.png`
  }

  return NextResponse.json({
    generationId: gen.id,
    intent: gen.intent,
    pixels: gen.pixels,
    manual_overrides: gen.manualOverrides ?? [],
    schemaVersion: gen.schemaVersion ?? 'v1',
    skinUrl,
  })
}
