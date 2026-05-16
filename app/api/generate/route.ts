import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndDeductCredit, refundCredit } from '@/lib/credits'
import { generateRegionColorMap } from '@/lib/gemini'
import { buildSkinPng, validateSkin } from '@/lib/legacy/skin-builder'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { IS_LOCAL_MODE } from '@/lib/local-mode'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const MAX_REFERENCE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png'] as const
type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number]

interface GenerateRequest {
  prompt: string | null
  referenceImageBase64?: string
  referenceImageMimeType?: AllowedMimeType
  referenceImageExt?: 'png' | 'jpg'
  faceTemplate?: number
  earTemplate?: number
}

type ParseResult =
  | { ok: true; data: GenerateRequest }
  | { ok: false; response: NextResponse }

async function parseGenerateRequest(request: NextRequest): Promise<ParseResult> {
  let prompt: string | null = null
  let referenceImageBase64: string | undefined
  let referenceImageMimeType: AllowedMimeType | undefined
  let referenceImageExt: 'png' | 'jpg' | undefined
  let faceTemplate: number | undefined
  let earTemplate: number | undefined

  const contentType = request.headers.get('content-type') ?? ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData()
    prompt = (formData.get('prompt') as string | null)?.trim() || null

    const ftVal = formData.get('faceTemplate') as string | null
    if (ftVal !== null) faceTemplate = parseInt(ftVal, 10)
    const etVal = formData.get('earTemplate') as string | null
    if (etVal !== null) earTemplate = parseInt(etVal, 10)

    const file = formData.get('referenceImage') as File | null
    if (file && file.size > 0) {
      if (!ALLOWED_MIME_TYPES.includes(file.type as AllowedMimeType) || file.size > MAX_REFERENCE_SIZE_BYTES) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: 'invalid_file', message: 'Reference image must be a JPEG or PNG under 10 MB.' },
            { status: 400 }
          ),
        }
      }
      const arrayBuffer = await file.arrayBuffer()
      referenceImageBase64 = Buffer.from(arrayBuffer).toString('base64')
      referenceImageMimeType = file.type as AllowedMimeType
      referenceImageExt = file.type === 'image/png' ? 'png' : 'jpg'
    }
  } else {
    const body = await request.json().catch(() => ({}))
    prompt = typeof body.prompt === 'string' ? body.prompt.trim() || null : null
  }

  if (!prompt && !referenceImageBase64) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: 'no_input', message: 'Please provide a description or upload a reference image.' },
        { status: 400 }
      ),
    }
  }

  return {
    ok: true,
    data: { prompt, referenceImageBase64, referenceImageMimeType, referenceImageExt, faceTemplate, earTemplate },
  }
}

async function buildAndValidate(req: GenerateRequest) {
  const colorMap = await generateRegionColorMap(
    req.prompt ?? '',
    req.referenceImageBase64,
    req.referenceImageMimeType
  )
  if (req.faceTemplate !== undefined) colorMap.face.face_template = req.faceTemplate
  if (req.earTemplate !== undefined) colorMap.face.ear_template = req.earTemplate

  const skinPngBuffer = await buildSkinPng(colorMap)
  const isValid = await validateSkin(skinPngBuffer)
  if (!isValid) throw new Error('Generated skin failed dimension validation')
  return skinPngBuffer
}

/** POST /api/generate — authenticate, deduct credit, generate skin, upload, return signed URL */
export async function POST(request: NextRequest) {
  if (IS_LOCAL_MODE) {
    return handleLocalMode(request)
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized', message: 'Not authenticated.' }, { status: 401 })
  }

  const parsed = await parseGenerateRequest(request)
  if (!parsed.ok) return parsed.response
  const req = parsed.data

  // Check and atomically deduct credit before any AI work
  const creditResult = await checkAndDeductCredit(user.id)
  if (!creditResult.allowed) {
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    return NextResponse.json(
      {
        error: 'generation_limit_reached',
        message: 'You have used all your generations for today. Upgrade for more.',
        resetAt: tomorrow.toISOString(),
      },
      { status: 402 }
    )
  }

  // Insert a pending skin_generations record to get an ID
  const [generation] = await db
    .insert(skinGenerations)
    .values({ userId: user.id, prompt: req.prompt, status: 'pending' })
    .returning({ id: skinGenerations.id })

  if (!generation) {
    return NextResponse.json(
      { error: 'db_error', message: 'Failed to record generation.' },
      { status: 500 }
    )
  }
  const generationId = generation.id

  try {
    // Upload reference image to Supabase Storage if provided
    if (req.referenceImageBase64 && req.referenceImageMimeType && req.referenceImageExt) {
      const refPath = `references/${user.id}/${generationId}.${req.referenceImageExt}`
      const { error: uploadError } = await supabase.storage
        .from('references')
        .upload(refPath, Buffer.from(req.referenceImageBase64, 'base64'), {
          contentType: req.referenceImageMimeType,
        })
      if (uploadError) {
        console.error(`Reference image upload failed for ${refPath}:`, uploadError.message)
      } else {
        await db
          .update(skinGenerations)
          .set({ referenceImagePath: refPath })
          .where(eq(skinGenerations.id, generationId))
      }
    }

    const skinPngBuffer = await buildAndValidate(req)

    const skinPath = `skins/${user.id}/${generationId}.png`
    const { error: skinUploadError } = await supabase.storage
      .from('skins')
      .upload(skinPath, skinPngBuffer, { contentType: 'image/png' })

    if (skinUploadError) {
      throw new Error(`Failed to upload skin: ${skinUploadError.message}`)
    }

    await db
      .update(skinGenerations)
      .set({ status: 'completed', resultPath: skinPath, completedAt: new Date() })
      .where(eq(skinGenerations.id, generationId))

    const { data: signedUrlData } = await supabase.storage
      .from('skins')
      .createSignedUrl(skinPath, 3600)

    return NextResponse.json({
      generationId,
      status: 'completed',
      skinUrl: signedUrlData?.signedUrl,
      creditsRemaining: creditResult.remaining,
    })
  } catch (error) {
    // Refund on any generation failure. AI/upload retries are user-initiated and rate-limited
    // by the daily credit pool — abusive prompt loops are bounded by daily attempts.
    await refundCredit(user.id)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await db
      .update(skinGenerations)
      .set({ status: 'failed', errorMessage })
      .where(eq(skinGenerations.id, generationId))

    console.error('Skin generation failed:', errorMessage)

    return NextResponse.json(
      {
        error: 'generation_failed',
        message: 'Skin generation failed. Your credit has been refunded. Please try again.',
      },
      { status: 500 }
    )
  }
}

async function handleLocalMode(request: NextRequest) {
  const parsed = await parseGenerateRequest(request)
  if (!parsed.ok) return parsed.response
  const req = parsed.data

  try {
    const skinPngBuffer = await buildAndValidate(req)

    const generationId = randomUUID()
    const localSkinsDir = path.join(process.cwd(), 'public', 'local-skins')
    await mkdir(localSkinsDir, { recursive: true })
    await writeFile(path.join(localSkinsDir, `${generationId}.png`), skinPngBuffer)

    return NextResponse.json({
      generationId,
      status: 'completed',
      skinUrl: `/local-skins/${generationId}.png`,
      creditsRemaining: 999,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Local mode skin generation failed:', errorMessage)
    return NextResponse.json(
      { error: 'generation_failed', message: 'Skin generation failed. Please try again.' },
      { status: 500 }
    )
  }
}
