# Skin Gen v2 — Plan C: Refinement UX

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the v2 pipeline into the existing skin-editor with four refinement entry points (parameter controls, region re-roll, natural-language patch, variations) and a credit model that's free for refinements and paid per variation.

**Architecture:** Three new API endpoints (`reroll`, `patch`, `variations`). The editor's existing `use-editor-state.ts` hook is extended to hold `SkinIntent`, `SkinPixels`, and `manual_overrides`. New sidebar components (palette swatches, character parameter grid, outfit text editor) and a chat refinement input live in `components/skin-editor/`.

**Tech Stack:** Same as Plan B. Adds nothing new.

**Prerequisite:** Plan B complete (Director / Artist / Patch / schema / migration / route handler all exist).

---

## Task C1: Region re-roll API endpoint

**Files:**
- Create: `app/api/generate/[id]/reroll/route.ts`
- Create: `app/api/generate/[id]/reroll/route.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// app/api/generate/[id]/reroll/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))
vi.mock('@/lib/intent/artist', () => ({
  runArtist: vi.fn().mockResolvedValue({
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#E63946')),
  }),
}))

const STORED_INTENT = {
  version: 1, seed: 1, style: 'retro',
  palette: ['#1C3D73','#2A5099','#6B4A20'], palette_mode: 'soft',
  character: {
    skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
    brows: 'flat', mouth: 'smile', mouth_color: '#8B5040',
    nose: 'dot', nose_shadow: '#A07050',
    hair_style: 'classic', hair_length: 'medium',
    hair_color: '#3B2507', hair_accent_color: '#5A3D14',
    ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ id: 'abc', intent: STORED_INTENT, pixels: {}, manual_overrides: [] }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

describe('POST /api/generate/:id/reroll', () => {
  it('reruns the Artist for one region and returns new pixels', async () => {
    const req = new Request('http://test/api/generate/abc/reroll', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ regions: ['torso_front'] }),
    })
    const res = await POST(req as any, { params: { id: 'abc' } } as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.pixels.torso_front[0][0]).toBe('#E63946')
  })

  it('rejects rerolling a manually overridden region', async () => {
    const mod = await import('@/lib/db')
    vi.mocked(mod.db.where).mockResolvedValueOnce([{ id: 'abc', intent: STORED_INTENT, pixels: {}, manual_overrides: ['torso_front'] }])
    const req = new Request('http://test/api/generate/abc/reroll', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ regions: ['torso_front'] }),
    })
    const res = await POST(req as any, { params: { id: 'abc' } } as any)
    expect(res.status).toBe(409)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run app/api/generate/\[id\]/reroll/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the handler**

```ts
// app/api/generate/[id]/reroll/route.ts
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

export async function POST(request: NextRequest, ctx: { params: { id: string } }) {
  const generationId = ctx.params.id
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

  const overrides = new Set<string>((gen.manual_overrides as string[]) ?? [])
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
    context: currentPixels as any,
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
        { type: 'region_reroll', at: new Date().toISOString(), description: `Re-rolled ${requestedRegions.join(', ')}`, affected_regions: requestedRegions },
      ],
    },
  }).where(eq(skinGenerations.id, generationId))

  return NextResponse.json({ pixels: validatedPixels, skinUrl: newSignedUrl })
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run app/api/generate/\[id\]/reroll/route.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/\[id\]/reroll/
git commit -m "feat(api): add /api/generate/:id/reroll endpoint for region re-roll"
```

---

## Task C2: Patch refinement API endpoint

**Files:**
- Create: `app/api/generate/[id]/patch/route.ts`
- Create: `app/api/generate/[id]/patch/route.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// app/api/generate/[id]/patch/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))

vi.mock('@/lib/intent/patch', () => ({
  runPatch: vi.fn().mockResolvedValue({
    palette_changes: [{ index: 0, new_hex: '#E63946' }],
    outfit_changes: { torso: 'red tunic' },
    affected_regions: ['torso_front','torso_back','torso_side'],
    affects_character: false,
  }),
  applyPatch: vi.fn().mockImplementation((intent, patch) => ({
    ...intent,
    palette: ['#E63946', ...intent.palette.slice(1)],
    outfit: { ...intent.outfit, torso: 'red tunic' },
  })),
}))

vi.mock('@/lib/intent/artist', () => ({
  runArtist: vi.fn().mockResolvedValue({
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#E63946')),
    torso_back: Array(12).fill(null).map(() => Array(8).fill('#E63946')),
    torso_side: Array(12).fill(null).map(() => Array(4).fill('#B82A38')),
  }),
}))

const STORED_INTENT = {
  version: 1, seed: 1, style: 'retro',
  palette: ['#1C3D73','#2A5099','#6B4A20'], palette_mode: 'soft',
  character: {
    skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
    brows: 'flat', mouth: 'smile', mouth_color: '#8B5040',
    nose: 'dot', nose_shadow: '#A07050',
    hair_style: 'classic', hair_length: 'medium',
    hair_color: '#3B2507', hair_accent_color: '#5A3D14',
    ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ id: 'abc', intent: STORED_INTENT, pixels: { torso_front: [], torso_back: [], torso_side: [] }, manual_overrides: [] }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

describe('POST /api/generate/:id/patch', () => {
  it('applies a patch and returns updated intent + pixels', async () => {
    const req = new Request('http://test/api/generate/abc/patch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instruction: 'make the shirt redder' }),
    })
    const res = await POST(req as any, { params: { id: 'abc' } } as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.intent.palette[0]).toBe('#E63946')
    expect(json.intent.outfit.torso).toBe('red tunic')
    expect(json.pixels.torso_front[0][0]).toBe('#E63946')
  })

  it('returns 422 on empty patch with explanatory message', async () => {
    const mod = await import('@/lib/intent/patch')
    vi.mocked(mod.runPatch).mockResolvedValueOnce({
      affected_regions: [], affects_character: false,
    })
    const req = new Request('http://test/api/generate/abc/patch', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ instruction: 'do something cool' }),
    })
    const res = await POST(req as any, { params: { id: 'abc' } } as any)
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.message).toMatch(/not sure what to change/i)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run app/api/generate/\[id\]/patch/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the handler**

```ts
// app/api/generate/[id]/patch/route.ts
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

export async function POST(request: NextRequest, ctx: { params: { id: string } }) {
  const generationId = ctx.params.id
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
  const overrides = new Set<string>((gen.manual_overrides as string[]) ?? [])

  // 1. Patch LLM
  const patch = await runPatch({ intent: currentIntent, instruction: body.data.instruction })

  // Empty patch → 422
  if (patch.affected_regions.length === 0 && !patch.affects_character &&
      !patch.palette_changes && !patch.character_changes && !patch.outfit_changes) {
    return NextResponse.json(
      { error: 'unactionable', message: "I'm not sure what to change. Try editing the palette directly or be more specific." },
      { status: 422 }
    )
  }

  // 2. Apply patch
  const nextIntent = applyPatch(currentIntent, patch)

  // 3. Repaint affected body regions (skip manually-locked ones)
  const regionsToRepaint = patch.affected_regions.filter((r) => !overrides.has(r)) as BodyRegion[]
  let nextPixels = currentPixels
  if (regionsToRepaint.length > 0) {
    const repainted = await runArtist({ intent: nextIntent, regions: regionsToRepaint, context: currentPixels as any })
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
      { type: 'patch', at: new Date().toISOString(), description: body.data.instruction, affected_regions: regionsToRepaint },
    ],
  }
  await db.update(skinGenerations).set({ intent: updatedIntent, pixels: validatedPixels }).where(eq(skinGenerations.id, generationId))

  return NextResponse.json({ intent: updatedIntent, pixels: validatedPixels, skinUrl: newSignedUrl })
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run app/api/generate/\[id\]/patch/route.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/\[id\]/patch/
git commit -m "feat(api): add /api/generate/:id/patch endpoint for natural-language refinement"
```

---

## Task C3: Variations API endpoint

**Files:**
- Create: `app/api/generate/[id]/variations/route.ts`
- Create: `app/api/generate/[id]/variations/route.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// app/api/generate/[id]/variations/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))
vi.mock('@/lib/intent/artist', () => ({
  runArtist: vi.fn().mockResolvedValue({
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_back: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_front: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    arm_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_back: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    leg_front: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
    leg_side: Array(12).fill(null).map(() => Array(4).fill('#141020')),
    leg_back: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
  }),
}))

const STORED_INTENT = {
  version: 1, seed: 1, style: 'retro',
  palette: ['#1C3D73','#2A5099','#6B4A20'], palette_mode: 'soft',
  character: {
    skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
    brows: 'flat', mouth: 'smile', mouth_color: '#8B5040',
    nose: 'dot', nose_shadow: '#A07050',
    hair_style: 'classic', hair_length: 'medium',
    hair_color: '#3B2507', hair_accent_color: '#5A3D14',
    ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ id: 'abc', intent: STORED_INTENT, pixels: {}, userId: 'u1' }]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: 'v1' }, { id: 'v2' }, { id: 'v3' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

describe('POST /api/generate/:id/variations', () => {
  it('returns N variations for N <= 5', async () => {
    const req = new Request('http://test/api/generate/abc/variations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count: 3 }),
    })
    const res = await POST(req as any, { params: { id: 'abc' } } as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.variations.length).toBe(3)
    for (const v of json.variations) {
      expect(v.generationId).toBeTruthy()
    }
  })

  it('rejects count > 5', async () => {
    const req = new Request('http://test/api/generate/abc/variations', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ count: 10 }),
    })
    const res = await POST(req as any, { params: { id: 'abc' } } as any)
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run app/api/generate/\[id\]/variations/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the handler**

```ts
// app/api/generate/[id]/variations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { checkAndDeductCredit, refundCredit } from '@/lib/credits'
import { runArtist } from '@/lib/intent/artist'
import { buildSkinPngV2 } from '@/lib/skin-builder-v2'
import { skinIntentSchema, skinPixelsSchema, type BodyRegion } from '@/lib/intent/schema'
import { IS_LOCAL_MODE } from '@/lib/local-mode'
import { randomUUID } from 'crypto'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const bodySchema = z.object({ count: z.number().int().min(1).max(5) })

const ALL_BODY_REGIONS: BodyRegion[] = [
  'torso_front','torso_back','torso_side','arm_front','arm_side','arm_back','leg_front','leg_side','leg_back',
]

export async function POST(request: NextRequest, ctx: { params: { id: string } }) {
  const generationId = ctx.params.id
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

    // Charge N credits up front
    for (let i = 0; i < body.data.count; i++) {
      const r = await checkAndDeductCredit(user.id)
      if (!r.allowed) {
        // Refund any already deducted
        for (let j = 0; j < i; j++) await refundCredit(user.id)
        return NextResponse.json({ error: 'generation_limit_reached', message: `Not enough credits for ${body.data.count} variations.` }, { status: 402 })
      }
    }
  }

  const userId = gen.userId

  // Generate N variations in parallel
  const results = await Promise.allSettled(
    Array.from({ length: body.data.count }, (_, i) => generateVariation(baseIntent, baseIntent.seed + i + 1, userId, generationId))
  )

  const variations: { generationId: string; skinUrl: string }[] = []
  const failures: number[] = []
  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'fulfilled') variations.push(r.value)
    else failures.push(i)
  }

  // Refund failed variations
  if (!IS_LOCAL_MODE) {
    for (const _ of failures) await refundCredit(userId)
  }

  return NextResponse.json({ variations, failedCount: failures.length })
}

async function generateVariation(baseIntent: any, seed: number, userId: string, parentId: string): Promise<{ generationId: string; skinUrl: string }> {
  const intent = { ...baseIntent, seed }
  const pixelsPartial = await runArtist({ intent, regions: ALL_BODY_REGIONS })
  const pixels = skinPixelsSchema.parse(pixelsPartial)
  const png = await buildSkinPngV2(intent, pixels)

  if (IS_LOCAL_MODE) {
    const generationId = randomUUID()
    const dir = path.join(process.cwd(), 'public', 'local-skins')
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, `${generationId}.png`), png)
    return { generationId, skinUrl: `/local-skins/${generationId}.png` }
  }

  const supabase = await createClient()
  const [row] = await db.insert(skinGenerations).values({
    userId, prompt: null, status: 'pending', schema_version: 'v2',
  }).returning({ id: skinGenerations.id })
  const generationId = row.id

  const skinPath = `skins/${userId}/${generationId}.png`
  const { error } = await supabase.storage.from('skins').upload(skinPath, png, { contentType: 'image/png' })
  if (error) throw new Error(`Upload failed: ${error.message}`)

  await db.update(skinGenerations).set({
    status: 'completed', resultPath: skinPath, completedAt: new Date(),
    intent, pixels, manual_overrides: [],
  }).where(eq(skinGenerations.id, generationId))

  const { data } = await supabase.storage.from('skins').createSignedUrl(skinPath, 3600)
  return { generationId, skinUrl: data?.signedUrl ?? '' }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run app/api/generate/\[id\]/variations/route.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/\[id\]/variations/
git commit -m "feat(api): add /api/generate/:id/variations endpoint for paid variations"
```

---

## Task C4: GET endpoint to load a generation (for editor)

The editor needs to fetch the persisted `intent`, `pixels`, `manual_overrides`, and signed `skinUrl` for a given generation ID.

**Files:**
- Create: `app/api/generate/[id]/route.ts`
- Create: `app/api/generate/[id]/route.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// app/api/generate/[id]/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { GET } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{
      id: 'abc',
      userId: 'u1',
      intent: { version: 1, seed: 1, style: 'retro', palette: ['#FFF','#000','#888'], palette_mode: 'soft',
        character: { skin_tone:'#C4956A', eye_shape:'round', eye_color:'#000', eye_white:'#FFF',
          brows:'flat', mouth:'smile', mouth_color:'#000', nose:'dot', nose_shadow:'#000',
          hair_style:'classic', hair_length:'medium', hair_color:'#000', hair_accent_color:'#000',
          ear_template:'none', ear_color:'#000', inner_ear_color:'#FFB8CC' },
        outfit: { torso:'a', arms:'b', legs:'c' }, refinement_history: [] },
      pixels: { torso_front: [], torso_back: [], torso_side: [], arm_front: [], arm_side: [], arm_back: [], leg_front: [], leg_side: [], leg_back: [] },
      manual_overrides: [],
      resultPath: 'skins/u1/abc.png',
    }]),
  },
}))

describe('GET /api/generate/:id', () => {
  it('returns intent, pixels, manual_overrides, skinUrl', async () => {
    const res = await GET({} as any, { params: { id: 'abc' } } as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.intent.version).toBe(1)
    expect(Array.isArray(json.pixels.torso_front)).toBe(true)
    expect(Array.isArray(json.manual_overrides)).toBe(true)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run app/api/generate/\[id\]/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// app/api/generate/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { skinGenerations } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { IS_LOCAL_MODE } from '@/lib/local-mode'

export async function GET(_request: NextRequest, ctx: { params: { id: string } }) {
  const rows = await db.select().from(skinGenerations).where(eq(skinGenerations.id, ctx.params.id))
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
    skinUrl = `/local-skins/${ctx.params.id}.png`
  }

  return NextResponse.json({
    generationId: gen.id,
    intent: gen.intent,
    pixels: gen.pixels,
    manual_overrides: gen.manual_overrides ?? [],
    schemaVersion: gen.schema_version ?? 'v1',
    skinUrl,
  })
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run app/api/generate/\[id\]/route.test.ts`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/\[id\]/route.ts app/api/generate/\[id\]/route.test.ts
git commit -m "feat(api): add GET /api/generate/:id for editor load"
```

---

## Task C5: Save endpoint for editor persistence

When a user edits in the editor and saves, persist updated `intent`, `pixels`, and `manual_overrides`.

**Files:**
- Create: `app/api/generate/[id]/save/route.ts`
- Create: `app/api/generate/[id]/save/route.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// app/api/generate/[id]/save/route.test.ts
import { describe, it, expect, vi } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([{ id: 'abc', userId: 'u1' }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}))

const VALID = {
  intent: { version: 1, seed: 1, style: 'retro', palette: ['#FFF','#000','#888'], palette_mode: 'soft',
    character: { skin_tone:'#C4956A', eye_shape:'round', eye_color:'#000', eye_white:'#FFF',
      brows:'flat', mouth:'smile', mouth_color:'#000', nose:'dot', nose_shadow:'#000',
      hair_style:'classic', hair_length:'medium', hair_color:'#000', hair_accent_color:'#000',
      ear_template:'none', ear_color:'#000', inner_ear_color:'#FFB8CC' },
    outfit: { torso:'a', arms:'b', legs:'c' }, refinement_history: [] },
  pixels: {
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_back:  Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_side:  Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_front:   Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    arm_side:    Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_back:    Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    leg_front:   Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
    leg_side:    Array(12).fill(null).map(() => Array(4).fill('#141020')),
    leg_back:    Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
  },
  manual_overrides: ['torso_front'],
}

describe('POST /api/generate/:id/save', () => {
  it('persists intent, pixels, and manual_overrides', async () => {
    const req = new Request('http://test/api/generate/abc/save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(VALID),
    })
    const res = await POST(req as any, { params: { id: 'abc' } } as any)
    expect(res.status).toBe(200)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run app/api/generate/\[id\]/save/route.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
// app/api/generate/[id]/save/route.ts
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

export async function POST(request: NextRequest, ctx: { params: { id: string } }) {
  const generationId = ctx.params.id
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
    manual_overrides: body.data.manual_overrides,
  }).where(eq(skinGenerations.id, generationId))

  return NextResponse.json({ ok: true, skinUrl })
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run app/api/generate/\[id\]/save/route.test.ts`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/\[id\]/save/
git commit -m "feat(api): add /api/generate/:id/save endpoint for editor persistence"
```

---

## Task C6: Extend editor state hook

The existing `hooks/use-editor-state.ts` manages canvas pixel paint state. Extend it to carry `intent`, `pixels`, `manual_overrides`, and refinement history.

**Files:**
- Modify: `hooks/use-editor-state.ts`
- Create: `hooks/use-editor-state.test.ts` if not present, otherwise add to it

- [ ] **Step 1: Read existing hook**

Read `hooks/use-editor-state.ts` and identify the current state shape (likely just pixel buffer + history).

- [ ] **Step 2: Write failing test for new fields**

```ts
// hooks/use-editor-state.test.ts (add to existing or create new)
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEditorState } from './use-editor-state'

describe('useEditorState v2 fields', () => {
  it('exposes intent, pixels, manual_overrides, and setters', () => {
    const { result } = renderHook(() => useEditorState())
    expect(result.current.intent).toBeNull()
    expect(result.current.pixels).toBeNull()
    expect(result.current.manualOverrides).toEqual(new Set())

    act(() => {
      result.current.loadFromGeneration({
        intent: { /* minimal valid intent */ } as any,
        pixels: {} as any,
        manualOverrides: ['torso_front'],
      })
    })
    expect(result.current.intent).not.toBeNull()
    expect(result.current.manualOverrides.has('torso_front')).toBe(true)
  })

  it('locks a region when user paints', () => {
    const { result } = renderHook(() => useEditorState())
    act(() => result.current.markRegionManual('torso_front'))
    expect(result.current.manualOverrides.has('torso_front')).toBe(true)
  })
})
```

- [ ] **Step 3: Verify fail**

Run: `npx vitest run hooks/use-editor-state.test.ts`
Expected: FAIL.

- [ ] **Step 4: Extend the hook**

Add fields and methods to `useEditorState`:

```ts
// hooks/use-editor-state.ts — additions
import type { SkinIntent, SkinPixels } from '@/lib/intent/schema'

export function useEditorState() {
  // ... existing state ...
  const [intent, setIntent] = useState<SkinIntent | null>(null)
  const [pixels, setPixels] = useState<SkinPixels | null>(null)
  const [manualOverrides, setManualOverrides] = useState<Set<string>>(new Set())

  const loadFromGeneration = useCallback(({ intent, pixels, manualOverrides }: {
    intent: SkinIntent
    pixels: SkinPixels
    manualOverrides: string[]
  }) => {
    setIntent(intent)
    setPixels(pixels)
    setManualOverrides(new Set(manualOverrides))
  }, [])

  const markRegionManual = useCallback((region: string) => {
    setManualOverrides((prev) => new Set([...prev, region]))
  }, [])

  const clearManualLock = useCallback((region: string) => {
    setManualOverrides((prev) => {
      const next = new Set(prev)
      next.delete(region)
      return next
    })
  }, [])

  return {
    // ... existing returns ...
    intent, setIntent,
    pixels, setPixels,
    manualOverrides,
    loadFromGeneration,
    markRegionManual,
    clearManualLock,
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run hooks/use-editor-state.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add hooks/use-editor-state.ts hooks/use-editor-state.test.ts
git commit -m "feat(editor): extend useEditorState with intent/pixels/manualOverrides"
```

---

## Task C7: Palette swatches sidebar component

**Files:**
- Create: `components/skin-editor/PaletteSwatches.tsx`
- Create: `components/skin-editor/PaletteSwatches.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/skin-editor/PaletteSwatches.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaletteSwatches } from './PaletteSwatches'

describe('PaletteSwatches', () => {
  it('renders one swatch per palette color', () => {
    render(<PaletteSwatches palette={['#1C3D73','#2A5099','#6B4A20']} onChange={vi.fn()} />)
    expect(screen.getAllByRole('button').length).toBe(3)
  })

  it('calls onChange when a swatch is updated', () => {
    const onChange = vi.fn()
    render(<PaletteSwatches palette={['#1C3D73','#2A5099','#6B4A20']} onChange={onChange} />)
    const colorInput = screen.getAllByLabelText(/palette color/i)[0]
    fireEvent.change(colorInput, { target: { value: '#FF0000' } })
    expect(onChange).toHaveBeenCalledWith(0, '#FF0000')
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run components/skin-editor/PaletteSwatches.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// components/skin-editor/PaletteSwatches.tsx
'use client'
import { useState } from 'react'

interface Props {
  palette: string[]
  onChange: (index: number, newHex: string) => void
}

export function PaletteSwatches({ palette, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Palette</h3>
      <div className="flex gap-2">
        {palette.map((hex, i) => (
          <Swatch key={i} hex={hex} onChange={(v) => onChange(i, v)} />
        ))}
      </div>
    </div>
  )
}

function Swatch({ hex, onChange }: { hex: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Palette color ${hex}`}
        className="w-10 h-10 rounded border border-zinc-300"
        style={{ backgroundColor: hex }}
        onClick={() => setOpen((v) => !v)}
      />
      {open && (
        <input
          aria-label={`palette color ${hex} picker`}
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          onBlur={() => setOpen(false)}
          className="absolute top-12 left-0 z-10"
          autoFocus
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/skin-editor/PaletteSwatches.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/skin-editor/PaletteSwatches.tsx components/skin-editor/PaletteSwatches.test.tsx
git commit -m "feat(editor): add palette swatches sidebar component"
```

---

## Task C8: Character parameter grid component

Dropdowns for `eye_shape`, `mouth`, `brows`, `nose`, `hair_style`, `hair_length`, `ear_template`.

**Files:**
- Create: `components/skin-editor/CharacterParameters.tsx`
- Create: `components/skin-editor/CharacterParameters.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/skin-editor/CharacterParameters.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterParameters } from './CharacterParameters'

const CHAR = {
  skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#000', eye_white: '#FFF',
  brows: 'flat', mouth: 'smile', mouth_color: '#000', nose: 'dot', nose_shadow: '#000',
  hair_style: 'classic', hair_length: 'medium', hair_color: '#000', hair_accent_color: '#000',
  ear_template: 'none', ear_color: '#000', inner_ear_color: '#FFB8CC',
}

describe('CharacterParameters', () => {
  it('renders dropdowns for each parametric field', () => {
    render(<CharacterParameters character={CHAR as any} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/eye shape/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mouth/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hair style/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ear template/i)).toBeInTheDocument()
  })

  it('calls onChange with the new value', () => {
    const onChange = vi.fn()
    render(<CharacterParameters character={CHAR as any} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/eye shape/i), { target: { value: 'almond' } })
    expect(onChange).toHaveBeenCalledWith('eye_shape', 'almond')
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run components/skin-editor/CharacterParameters.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// components/skin-editor/CharacterParameters.tsx
'use client'
import type { SkinIntent } from '@/lib/intent/schema'

const EYES = ['round','almond','wide','close_set','sleepy','dot','square','mono']
const MOUTHS = ['none','smile','wide_smile','frown','open','smirk']
const BROWS = ['none','flat','angled_up','angled_down','bushy']
const NOSES = ['none','bridge','dot','wide']
const HAIR_STYLES = ['classic','bangs','side_part','mohawk','fluffy','curtain','bald','bun','ponytail','spiky','undercut','dreads']
const HAIR_LENGTHS = ['short','medium','long','very_long']
const EARS = ['none','round','pointy','cat','fox','bunny','wolf','elf']

type Char = SkinIntent['character']

interface Props {
  character: Char
  onChange: (field: keyof Char, value: string) => void
}

export function CharacterParameters({ character, onChange }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Character</h3>
      <Field label="Eye shape" field="eye_shape" value={character.eye_shape} options={EYES} onChange={onChange} />
      <Field label="Mouth" field="mouth" value={character.mouth} options={MOUTHS} onChange={onChange} />
      <Field label="Brows" field="brows" value={character.brows} options={BROWS} onChange={onChange} />
      <Field label="Nose" field="nose" value={character.nose} options={NOSES} onChange={onChange} />
      <Field label="Hair style" field="hair_style" value={character.hair_style} options={HAIR_STYLES} onChange={onChange} />
      <Field label="Hair length" field="hair_length" value={character.hair_length} options={HAIR_LENGTHS} onChange={onChange} />
      <Field label="Ear template" field="ear_template" value={character.ear_template} options={EARS} onChange={onChange} />
    </div>
  )
}

function Field({ label, field, value, options, onChange }: { label: string; field: keyof Char; value: string; options: string[]; onChange: Props['onChange'] }) {
  return (
    <label className="flex flex-col text-xs gap-1">
      <span>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(field, e.target.value)}
        className="border rounded px-2 py-1"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/skin-editor/CharacterParameters.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/skin-editor/CharacterParameters.tsx components/skin-editor/CharacterParameters.test.tsx
git commit -m "feat(editor): add character parameter grid component"
```

---

## Task C9: Character color pickers

Color pickers for `skin_tone`, `eye_color`, `hair_color`, `hair_accent_color`, `ear_color`, `inner_ear_color`.

**Files:**
- Create: `components/skin-editor/CharacterColors.tsx`
- Create: `components/skin-editor/CharacterColors.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/skin-editor/CharacterColors.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterColors } from './CharacterColors'

const CHAR = {
  skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
  brows: 'flat', mouth: 'smile', mouth_color: '#000', nose: 'dot', nose_shadow: '#000',
  hair_style: 'classic', hair_length: 'medium', hair_color: '#3B2507', hair_accent_color: '#5A3D14',
  ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
}

describe('CharacterColors', () => {
  it('renders color pickers for each character color field', () => {
    render(<CharacterColors character={CHAR as any} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/skin tone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/eye color/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hair color/i)).toBeInTheDocument()
  })

  it('calls onChange with the new color', () => {
    const onChange = vi.fn()
    render(<CharacterColors character={CHAR as any} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/skin tone/i), { target: { value: '#E0BFA0' } })
    expect(onChange).toHaveBeenCalledWith('skin_tone', '#E0BFA0')
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run components/skin-editor/CharacterColors.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// components/skin-editor/CharacterColors.tsx
'use client'
import type { SkinIntent } from '@/lib/intent/schema'

type Char = SkinIntent['character']

interface Props {
  character: Char
  onChange: (field: keyof Char, value: string) => void
}

const COLOR_FIELDS: { field: keyof Char; label: string }[] = [
  { field: 'skin_tone', label: 'Skin tone' },
  { field: 'eye_color', label: 'Eye color' },
  { field: 'eye_white', label: 'Eye white' },
  { field: 'mouth_color', label: 'Mouth color' },
  { field: 'nose_shadow', label: 'Nose shadow' },
  { field: 'hair_color', label: 'Hair color' },
  { field: 'hair_accent_color', label: 'Hair accent' },
  { field: 'ear_color', label: 'Ear color' },
  { field: 'inner_ear_color', label: 'Inner ear' },
]

export function CharacterColors({ character, onChange }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Character colors</h3>
      <div className="grid grid-cols-2 gap-2">
        {COLOR_FIELDS.map(({ field, label }) => (
          <label key={field} className="flex flex-col text-xs gap-1">
            <span>{label}</span>
            <input
              type="color"
              aria-label={label}
              value={character[field] as string}
              onChange={(e) => onChange(field, e.target.value.toUpperCase())}
              className="h-8 w-full border rounded"
            />
          </label>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/skin-editor/CharacterColors.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/skin-editor/CharacterColors.tsx components/skin-editor/CharacterColors.test.tsx
git commit -m "feat(editor): add character color pickers"
```

---

## Task C10: Region re-roll button on the canvas

Add right-click context menu (or a button overlay) on the canvas that lets the user re-roll a specific body region.

**Files:**
- Modify: `components/skin-editor/SkinCanvas.tsx`
- Create: `components/skin-editor/RegionContextMenu.tsx`
- Create: `components/skin-editor/RegionContextMenu.test.tsx`

- [ ] **Step 1: Write failing test for the menu**

```tsx
// components/skin-editor/RegionContextMenu.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegionContextMenu } from './RegionContextMenu'

describe('RegionContextMenu', () => {
  it('shows re-roll option for the region', () => {
    render(<RegionContextMenu region="torso_front" x={10} y={10} onReroll={vi.fn()} onClose={vi.fn()} locked={false} />)
    expect(screen.getByText(/re-roll torso_front/i)).toBeInTheDocument()
  })

  it('shows lock indicator and disables re-roll when locked', () => {
    render(<RegionContextMenu region="torso_front" x={10} y={10} onReroll={vi.fn()} onClose={vi.fn()} locked={true} />)
    const button = screen.getByText(/re-roll torso_front/i).closest('button')
    expect(button).toBeDisabled()
  })

  it('calls onReroll when clicked', () => {
    const onReroll = vi.fn()
    render(<RegionContextMenu region="torso_front" x={10} y={10} onReroll={onReroll} onClose={vi.fn()} locked={false} />)
    fireEvent.click(screen.getByText(/re-roll torso_front/i))
    expect(onReroll).toHaveBeenCalledWith('torso_front')
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run components/skin-editor/RegionContextMenu.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement RegionContextMenu**

```tsx
// components/skin-editor/RegionContextMenu.tsx
'use client'
import { useEffect, useRef } from 'react'

interface Props {
  region: string
  x: number
  y: number
  locked: boolean
  onReroll: (region: string) => void
  onClose: () => void
}

export function RegionContextMenu({ region, x, y, locked, onReroll, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 bg-white border rounded shadow-lg p-1 text-sm"
      style={{ top: y, left: x }}
    >
      <button
        type="button"
        disabled={locked}
        onClick={() => { onReroll(region); onClose() }}
        className="block w-full text-left px-3 py-1.5 hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {locked ? '🔒 ' : ''}Re-roll {region}
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Wire context menu into SkinCanvas**

Edit `components/skin-editor/SkinCanvas.tsx` to detect right-clicks on body regions and open the menu. Map click coordinates to a region using the UV layout from `lib/skin-builder-v2.ts` (same Region table). For each body region (`torso_front`, `arm_front`, etc.), test if `(canvasX, canvasY)` falls inside its UV bounds; if so, store the region name and open the menu at the cursor position.

```tsx
// SkinCanvas.tsx additions
const BODY_REGIONS = [
  { name: 'torso_front', x: 20, y: 20, w: 8, h: 12 },
  { name: 'torso_back',  x: 32, y: 20, w: 8, h: 12 },
  { name: 'torso_side',  x: 16, y: 20, w: 4, h: 12 },   // right side bounds — left side mirrors
  { name: 'arm_front',   x: 44, y: 20, w: 4, h: 12 },
  { name: 'arm_side',    x: 40, y: 20, w: 4, h: 12 },
  { name: 'arm_back',    x: 52, y: 20, w: 4, h: 12 },
  { name: 'leg_front',   x: 4,  y: 20, w: 4, h: 12 },
  { name: 'leg_side',    x: 0,  y: 20, w: 4, h: 12 },
  { name: 'leg_back',    x: 12, y: 20, w: 4, h: 12 },
] as const

function findRegion(canvasX: number, canvasY: number): string | null {
  for (const r of BODY_REGIONS) {
    if (canvasX >= r.x && canvasX < r.x + r.w && canvasY >= r.y && canvasY < r.y + r.h) {
      return r.name
    }
  }
  return null
}

// In SkinCanvas component:
// onContextMenu={(e) => { e.preventDefault(); const region = findRegion(...); if (region) setMenu({ region, x: e.clientX, y: e.clientY }) }}
```

The wire-up specifics depend on how `SkinCanvas` translates DOM coords to UV coords today — follow the existing pattern in the component.

- [ ] **Step 5: Run tests**

Run: `npx vitest run components/skin-editor/`
Expected: All editor component tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/skin-editor/RegionContextMenu.tsx components/skin-editor/RegionContextMenu.test.tsx components/skin-editor/SkinCanvas.tsx
git commit -m "feat(editor): add region right-click re-roll menu"
```

---

## Task C11: Refinement chat input

**Files:**
- Create: `components/skin-editor/RefinementChat.tsx`
- Create: `components/skin-editor/RefinementChat.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/skin-editor/RefinementChat.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RefinementChat } from './RefinementChat'

describe('RefinementChat', () => {
  it('calls onSubmit with the instruction', () => {
    const onSubmit = vi.fn()
    render(<RefinementChat onSubmit={onSubmit} loading={false} />)
    const input = screen.getByPlaceholderText(/redder shirt/i)
    fireEvent.change(input, { target: { value: 'make the shirt redder' } })
    fireEvent.submit(input.closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith('make the shirt redder')
  })

  it('disables submit while loading', () => {
    render(<RefinementChat onSubmit={vi.fn()} loading={true} />)
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
  })

  it('shows error message when provided', () => {
    render(<RefinementChat onSubmit={vi.fn()} loading={false} error="Not sure what to change" />)
    expect(screen.getByText(/not sure what to change/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run components/skin-editor/RefinementChat.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// components/skin-editor/RefinementChat.tsx
'use client'
import { useState } from 'react'

interface Props {
  onSubmit: (instruction: string) => void
  loading: boolean
  error?: string
}

export function RefinementChat({ onSubmit, loading, error }: Props) {
  const [text, setText] = useState('')
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (text.trim()) { onSubmit(text.trim()); setText('') } }}
      className="flex flex-col gap-1 border-t pt-2"
    >
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. make the shirt redder, longer hair, sunglasses"
          className="flex-1 border rounded px-2 py-1.5 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-4 py-1.5 bg-zinc-900 text-white rounded text-sm disabled:opacity-50"
        >
          {loading ? 'Applying…' : 'Apply'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/skin-editor/RefinementChat.test.tsx`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/skin-editor/RefinementChat.tsx components/skin-editor/RefinementChat.test.tsx
git commit -m "feat(editor): add refinement chat input component"
```

---

## Task C12: Variations grid component

**Files:**
- Create: `components/skin-editor/VariationsGrid.tsx`
- Create: `components/skin-editor/VariationsGrid.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/skin-editor/VariationsGrid.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VariationsGrid } from './VariationsGrid'

describe('VariationsGrid', () => {
  it('renders N variation thumbnails', () => {
    render(<VariationsGrid variations={[
      { generationId: 'a', skinUrl: '/a.png' },
      { generationId: 'b', skinUrl: '/b.png' },
      { generationId: 'c', skinUrl: '/c.png' },
    ]} onSelect={vi.fn()} />)
    expect(screen.getAllByRole('img').length).toBe(3)
  })

  it('calls onSelect when a thumbnail is clicked', () => {
    const onSelect = vi.fn()
    render(<VariationsGrid variations={[{ generationId: 'a', skinUrl: '/a.png' }]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('a')
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run components/skin-editor/VariationsGrid.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

```tsx
// components/skin-editor/VariationsGrid.tsx
'use client'

interface Props {
  variations: { generationId: string; skinUrl: string }[]
  onSelect: (generationId: string) => void
}

export function VariationsGrid({ variations, onSelect }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {variations.map((v) => (
        <button
          key={v.generationId}
          type="button"
          onClick={() => onSelect(v.generationId)}
          className="border-2 border-zinc-300 rounded hover:border-zinc-900 p-2 flex flex-col items-center"
        >
          <img src={v.skinUrl} alt="variation" className="w-full h-auto image-rendering-pixelated" style={{ imageRendering: 'pixelated' }} />
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run components/skin-editor/VariationsGrid.test.tsx`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/skin-editor/VariationsGrid.tsx components/skin-editor/VariationsGrid.test.tsx
git commit -m "feat(editor): add variations grid component"
```

---

## Task C13: Wire all components into EditPageClient

Compose the new sidebar components, refinement chat, region re-roll handler, and variations grid into the editor page.

**Files:**
- Modify: `app/(app)/edit/EditPageClient.tsx`

- [ ] **Step 1: Read the current EditPageClient**

Read `app/(app)/edit/EditPageClient.tsx` to understand its current layout.

- [ ] **Step 2: Plumb intent loading from URL `?id=`**

```tsx
// EditPageClient.tsx — additions
const generationId = searchParams.get('id')
const editor = useEditorState()

useEffect(() => {
  if (!generationId) return
  fetch(`/api/generate/${generationId}`)
    .then((r) => r.json())
    .then((data) => {
      editor.loadFromGeneration({
        intent: data.intent,
        pixels: data.pixels,
        manualOverrides: data.manual_overrides,
      })
      setSkinUrl(data.skinUrl)
    })
}, [generationId])
```

- [ ] **Step 3: Wire the sidebar**

In the JSX, add the three sidebar sections:

```tsx
{editor.intent && (
  <aside className="flex flex-col gap-4 w-64 border-l p-4">
    <PaletteSwatches
      palette={editor.intent.palette}
      onChange={(i, hex) => handlePaletteChange(i, hex)}
    />
    <CharacterParameters
      character={editor.intent.character}
      onChange={(field, value) => handleCharacterChange(field, value)}
    />
    <CharacterColors
      character={editor.intent.character}
      onChange={(field, value) => handleCharacterChange(field, value)}
    />
  </aside>
)}
```

- [ ] **Step 4: Implement handlers**

```tsx
async function handlePaletteChange(index: number, hex: string) {
  if (!editor.intent) return
  const nextIntent = { ...editor.intent, palette: editor.intent.palette.map((c, i) => i === index ? hex : c) }
  editor.setIntent(nextIntent)
  await rebuildClientSide(nextIntent, editor.pixels)
}

async function handleCharacterChange(field: string, value: string) {
  if (!editor.intent) return
  const nextIntent = { ...editor.intent, character: { ...editor.intent.character, [field]: value } }
  editor.setIntent(nextIntent)
  await rebuildClientSide(nextIntent, editor.pixels)
}

async function rebuildClientSide(intent: SkinIntent, pixels: SkinPixels | null) {
  if (!pixels) return
  // Call save endpoint to rebuild + persist + get new signed URL
  const res = await fetch(`/api/generate/${generationId}/save`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ intent, pixels, manual_overrides: [...editor.manualOverrides] }),
  })
  const json = await res.json()
  if (json.skinUrl) setSkinUrl(json.skinUrl)
}
```

- [ ] **Step 5: Wire region re-roll handler**

```tsx
async function handleReroll(region: string) {
  setRerollingRegion(region)
  const res = await fetch(`/api/generate/${generationId}/reroll`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ regions: [region] }),
  })
  setRerollingRegion(null)
  if (!res.ok) { toast.error('Re-roll failed'); return }
  const json = await res.json()
  editor.setPixels(json.pixels)
  if (json.skinUrl) setSkinUrl(json.skinUrl)
}
```

Pass `handleReroll` into the SkinCanvas (or RegionContextMenu) wiring.

- [ ] **Step 6: Wire refinement chat**

```tsx
const [chatLoading, setChatLoading] = useState(false)
const [chatError, setChatError] = useState<string | undefined>()

async function handlePatch(instruction: string) {
  setChatLoading(true); setChatError(undefined)
  const res = await fetch(`/api/generate/${generationId}/patch`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ instruction }),
  })
  setChatLoading(false)
  if (res.status === 422) {
    const j = await res.json(); setChatError(j.message); return
  }
  if (!res.ok) { setChatError('Patch failed'); return }
  const j = await res.json()
  editor.setIntent(j.intent)
  editor.setPixels(j.pixels)
  if (j.skinUrl) setSkinUrl(j.skinUrl)
}

// In JSX (bottom of editor):
<RefinementChat onSubmit={handlePatch} loading={chatLoading} error={chatError} />
```

- [ ] **Step 7: Manual smoke test in dev**

Run: `npm run dev`. Generate a new skin in `/generate`, click "Open in Editor".
- Verify sidebar shows palette swatches, character parameters, character colors
- Change `hair_style` — preview should update with new hair (client-side re-render after server save)
- Click a palette swatch, change color — preview updates
- Right-click on the torso region — context menu appears with "Re-roll torso_front"
- Click re-roll — preview updates with newly-painted torso
- Type "make the shirt redder" in chat — preview updates

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/edit/EditPageClient.tsx
git commit -m "feat(editor): wire palette/character/refinement/reroll into edit page"
```

---

## Task C14: Manual override tracking

When user paints with the existing pixel brush tool, mark that region as manually-overridden so it's protected from auto-repaint.

**Files:**
- Modify: `components/skin-editor/SkinCanvas.tsx` (or wherever paint commits happen)

- [ ] **Step 1: Identify where paint commits**

Read SkinCanvas and find where a pointer-down/pointer-up triggers writing to the pixel buffer.

- [ ] **Step 2: Map paint coordinate to region**

When a paint commits, determine which body region the painted pixel falls in (using the same `BODY_REGIONS` lookup from Task C10). Call `editor.markRegionManual(region)` for that region.

```tsx
// Inside the paint commit handler:
const region = findRegion(canvasX, canvasY)
if (region) editor.markRegionManual(region)
```

- [ ] **Step 3: Visual indicator**

When a region is in `manualOverrides`, show a small lock icon overlay on the canvas at the corner of that region. (Use the existing canvas overlay machinery, or a simple absolutely-positioned div.)

- [ ] **Step 4: Test the lock**

Run: `npm run dev`. In editor, paint a single pixel on the torso. Right-click → "Re-roll torso_front" — option should be disabled (locked). Verify chat refinement also skips that region (Plan C2 already filters `regionsToRepaint` by overrides).

- [ ] **Step 5: Commit**

```bash
git add components/skin-editor/SkinCanvas.tsx
git commit -m "feat(editor): lock regions from auto-repaint when user paints manually"
```

---

## Task C15: Persist on save (existing save button → use new API)

Wire the editor's existing "Save" button to POST to `/api/generate/:id/save` with the current intent, pixels, and manual_overrides.

**Files:**
- Modify: `app/(app)/edit/EditPageClient.tsx`

- [ ] **Step 1: Identify the existing save handler**

Find the existing save button or auto-save logic in the editor.

- [ ] **Step 2: Replace with v2 save call**

```tsx
async function handleSave() {
  if (!editor.intent || !editor.pixels) return
  const res = await fetch(`/api/generate/${generationId}/save`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      intent: editor.intent,
      pixels: editor.pixels,
      manual_overrides: [...editor.manualOverrides],
    }),
  })
  if (!res.ok) { toast.error('Save failed'); return }
  const j = await res.json()
  if (j.skinUrl) setSkinUrl(j.skinUrl)
  toast.success('Saved')
}
```

- [ ] **Step 3: Manual smoke test**

In editor, make a change (e.g., change hair color). Click Save. Refresh the page → confirm the change persisted by checking the editor sidebar values still reflect the change.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/edit/EditPageClient.tsx
git commit -m "feat(editor): wire Save to v2 save endpoint"
```

---

## Task C16: Variations UI on generator result page

After a first-gen completes, the generator page shows a "Generate 3 variations" button. Clicking it calls `/api/generate/:id/variations` with `count: 3`, displays a `VariationsGrid`, and lets the user open one in the editor.

**Files:**
- Modify: `app/(app)/generate/GeneratorPageClient.tsx`

- [ ] **Step 1: Add variations state**

```tsx
const [variations, setVariations] = useState<{ generationId: string; skinUrl: string }[]>([])
const [variationsLoading, setVariationsLoading] = useState(false)

async function handleGenerateVariations() {
  if (!result) return
  setVariationsLoading(true)
  const res = await fetch(`/api/generate/${result.generationId}/variations`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count: 3 }),
  })
  setVariationsLoading(false)
  if (res.status === 402) { toast.error('Not enough credits for variations'); return }
  if (!res.ok) { toast.error('Variations failed'); return }
  const j = await res.json()
  setVariations(j.variations)
}
```

- [ ] **Step 2: Add UI**

```tsx
{result && (
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
```

- [ ] **Step 3: Manual smoke test**

In `/generate`, generate a skin. Click "Generate 3 variations". Wait for the grid to appear. Click one → editor opens with that variation loaded.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/generate/GeneratorPageClient.tsx
git commit -m "feat(ui): add variations grid to generator result page"
```

---

## Task C17: Plan C integration check

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: All tests pass — every Plan A/B/C test included.

- [ ] **Step 2: Lint and type check**

Run: `npm run lint && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manual end-to-end flow**

Run: `npm run dev`. Walk through the full user journey:

1. `/generate` — submit "cyberpunk hacker with neon visor"
2. Wait for first-gen — verify skin appears, 1 credit consumed
3. Click "Generate 3 variations" — verify 3 thumbnails appear, 3 credits consumed
4. Click thumbnail #2 — opens in editor
5. In editor, change `hair_style` to "mohawk" — preview updates
6. Click palette swatch #1, change color — preview updates
7. Right-click on torso region — context menu appears, click "Re-roll torso_front" — torso repaints
8. Type "make the shirt redder" in chat — preview updates with redder shirt
9. Paint a pixel on the torso → lock icon appears on torso → re-roll button now disabled for torso
10. Click Save — toast confirms save
11. Refresh page → editor reloads with all changes intact

- [ ] **Step 4: Marker commit**

```bash
git commit --allow-empty -m "chore: Plan C (refinement UX) complete"
```

---

## Plan C self-review

**Coverage check:**
- Region re-roll endpoint: C1
- Patch endpoint: C2
- Variations endpoint: C3
- Load endpoint (GET): C4
- Save endpoint: C5
- Editor state extension: C6
- Palette swatches sidebar: C7
- Character parameter grid: C8
- Character color pickers: C9
- Region re-roll context menu + canvas wiring: C10
- Refinement chat input: C11
- Variations grid component: C12
- EditPageClient wiring: C13
- Manual override tracking: C14
- Save wiring: C15
- Variations UI on generator: C16
- Integration check: C17

**Open follow-ups not in this plan:**
- Undo/redo in `HistoryControls.tsx`: spec mentions append-only `refinement_history` with client-side snapshot stack. Wiring undo to restore prior intent + pixels snapshots is a small follow-up — recommend a separate task after C17 if undo is needed at launch.
- Skin tone exclusion from palette snap: the spec says palette snap only applies to body region pixels, not face/hair/ear composer output. Verify in Plan A's builder that composer output is blitted *before* `paintHexGrid` calls (it is — section 4 of `buildSkinPngV2` only snaps body grids), so this is already correct.
- One-time legacy `face_template` → parametric mapping for "open old skin in v2 editor": parked in spec section 10. If wanted later, ~1 day of work.
