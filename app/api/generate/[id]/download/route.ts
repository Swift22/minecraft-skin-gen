import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { IS_LOCAL_MODE } from '@/lib/local-mode'

/** GET /api/generate/[id]/download — returns a fresh 1-hour signed URL for downloading a skin */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: generationId } = await params

  if (IS_LOCAL_MODE) {
    return NextResponse.json({
      url: `/local-skins/${generationId}.png`,
      filename: `minecraft-skin-${generationId}.png`,
    })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized', message: 'Not authenticated.' }, { status: 401 })
  }

  const [generation] = await db
    .select({
      userId: skinGenerations.userId,
      status: skinGenerations.status,
      resultPath: skinGenerations.resultPath,
    })
    .from(skinGenerations)
    .where(eq(skinGenerations.id, generationId))
    .limit(1)

  if (!generation || generation.status !== 'completed' || !generation.resultPath) {
    return NextResponse.json(
      { error: 'not_found', message: 'Generation not found or not yet completed.' },
      { status: 404 }
    )
  }

  if (generation.userId !== user.id) {
    return NextResponse.json(
      { error: 'forbidden', message: 'You do not have access to this generation.' },
      { status: 403 }
    )
  }

  const { data: signedUrlData } = await supabase.storage
    .from('skins')
    .createSignedUrl(generation.resultPath, 3600)

  if (!signedUrlData?.signedUrl) {
    return NextResponse.json(
      { error: 'storage_error', message: 'Failed to generate download URL.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    url: signedUrlData.signedUrl,
    filename: `minecraft-skin-${generationId}.png`,
  })
}
