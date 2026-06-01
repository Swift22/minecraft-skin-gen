import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runDirector } from '@/lib/intent/director'
import { runArtist } from '@/lib/intent/artist'
import { buildSkinPngV2, validateSkinV2 } from '@/lib/skin-builder-v2'
import { skinPixelsSchema, type BodyRegion } from '@/lib/intent/schema'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { IS_LOCAL_MODE } from '@/lib/local-mode'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const MAX_REFERENCE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

const ALL_BODY_REGIONS: BodyRegion[] = [
  'torso_front', 'torso_back', 'torso_side',
  'arm_front', 'arm_side', 'arm_back',
  'leg_front', 'leg_side', 'leg_back',
  // OUTER LAYERS — must be requested or the Artist never paints them
  'jacket_front', 'jacket_back', 'jacket_side',
  'sleeve_front', 'pants_outer_front',
]

type ParsedInput =
  | { ok: true; prompt: string | null; referenceImageBase64?: string; referenceImageMimeType?: AllowedMimeType; referenceImageExt?: string }
  | { ok: false; status: number; error: string; message: string }

async function parseInput(request: NextRequest): Promise<ParsedInput> {
  let prompt: string | null = null
  let referenceImageBase64: string | undefined
  let referenceImageMimeType: AllowedMimeType | undefined
  let referenceImageExt: string | undefined

  const contentType = request.headers.get('content-type') ?? ''
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    prompt = (formData.get('prompt') as string | null)?.trim() || null
    const file = formData.get('referenceImage') as File | null
    if (file && file.size > 0) {
      if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType) || file.size > MAX_REFERENCE_SIZE_BYTES) {
        return { ok: false, status: 400, error: 'invalid_file', message: 'Reference image must be a JPEG or PNG under 10 MB.' }
      }
      const arr = await file.arrayBuffer()
      referenceImageBase64 = Buffer.from(arr).toString('base64')
      referenceImageMimeType = file.type as AllowedMimeType
      referenceImageExt = file.type === 'image/png' ? 'png' : 'jpg'
    }
  } else {
    const body = await request.json().catch(() => ({}))
    prompt = typeof body.prompt === 'string' ? body.prompt.trim() || null : null
  }

  return { ok: true, prompt, referenceImageBase64, referenceImageMimeType, referenceImageExt }
}

export async function POST(request: NextRequest) {
  if (IS_LOCAL_MODE) return handleLocalMode(request)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized', message: 'Not authenticated.' }, { status: 401 })

  const parsed = await parseInput(request)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, message: parsed.message }, { status: parsed.status })
  }
  const { prompt, referenceImageBase64, referenceImageMimeType, referenceImageExt } = parsed

  if (!prompt && !referenceImageBase64) {
    return NextResponse.json({ error: 'no_input', message: 'Please provide a description or upload a reference image.' }, { status: 400 })
  }

  const [generation] = await db.insert(skinGenerations).values({
    userId: user.id, prompt, status: 'pending', schemaVersion: 'v2',
  }).returning({ id: skinGenerations.id })
  const generationId = generation!.id

  try {
    let referenceImagePath: string | undefined
    if (referenceImageBase64 && referenceImageMimeType && referenceImageExt) {
      const refPath = `references/${user.id}/${generationId}.${referenceImageExt}`
      const { error } = await supabase.storage.from('references').upload(refPath, Buffer.from(referenceImageBase64, 'base64'), { contentType: referenceImageMimeType })
      if (!error) referenceImagePath = refPath
    }

    const intent = await runDirector({ prompt: prompt ?? '', referenceImageBase64, referenceImageMimeType })
    const pixelsPartial = await runArtist({ intent, regions: ALL_BODY_REGIONS })
    const pixels = skinPixelsSchema.parse(pixelsPartial)

    const png = await buildSkinPngV2(intent, pixels)
    if (!(await validateSkinV2(png))) throw new Error('Generated skin failed dimension validation')

    const skinPath = `skins/${user.id}/${generationId}.png`
    const { error: uploadErr } = await supabase.storage.from('skins').upload(skinPath, png, { contentType: 'image/png' })
    if (uploadErr) throw new Error(`Failed to upload skin: ${uploadErr.message}`)

    await db.update(skinGenerations).set({
      status: 'completed',
      resultPath: skinPath,
      completedAt: new Date(),
      intent,
      pixels,
      manualOverrides: [],
      schemaVersion: 'v2',
      referenceImagePath,
    }).where(eq(skinGenerations.id, generationId))

    const { data: signedUrlData } = await supabase.storage.from('skins').createSignedUrl(skinPath, 3600)

    return NextResponse.json({
      generationId,
      status: 'completed',
      skinUrl: signedUrlData?.signedUrl,
      intent,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    await db.update(skinGenerations).set({ status: 'failed', errorMessage }).where(eq(skinGenerations.id, generationId))
    console.error('Skin generation v2 failed:', errorMessage)
    return NextResponse.json({ error: 'generation_failed', message: 'Skin generation failed. Please try again.' }, { status: 500 })
  }
}

async function handleLocalMode(request: NextRequest) {
  const parsed = await parseInput(request)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error, message: parsed.message }, { status: parsed.status })
  }
  const { prompt, referenceImageBase64, referenceImageMimeType } = parsed
  if (!prompt && !referenceImageBase64) {
    return NextResponse.json({ error: 'no_input', message: 'Please provide a description or upload a reference image.' }, { status: 400 })
  }

  try {
    const intent = await runDirector({ prompt: prompt ?? '', referenceImageBase64, referenceImageMimeType })
    const pixelsPartial = await runArtist({ intent, regions: ALL_BODY_REGIONS })
    const pixels = skinPixelsSchema.parse(pixelsPartial)
    const png = await buildSkinPngV2(intent, pixels)
    if (!(await validateSkinV2(png))) throw new Error('Generated skin failed dimension validation')

    const generationId = randomUUID()
    const localSkinsDir = path.join(process.cwd(), 'public', 'local-skins')
    await mkdir(localSkinsDir, { recursive: true })
    await writeFile(path.join(localSkinsDir, `${generationId}.png`), png)

    return NextResponse.json({
      generationId,
      status: 'completed',
      skinUrl: `/local-skins/${generationId}.png`,
      intent,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Local mode v2 failed:', errorMessage)
    return NextResponse.json({ error: 'generation_failed', message: 'Skin generation failed. Please try again.' }, { status: 500 })
  }
}
