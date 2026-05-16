# Skin Gen v2 — Plan B: New Pipeline

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single-call Gemini pipeline with a Director → Artist → Builder pipeline backed by a versioned `SkinIntent` document. New generations use the v2 path; old skins keep rendering via the legacy renderer (already moved to `lib/legacy/` in Plan A).

**Architecture:** Three Gemini calls with Zod-validated structured outputs. The `SkinIntent` schema lives in `lib/intent/schema.ts` and is persisted alongside `skin_generations` rows. The Patch LLM stage is *defined* in this plan (used by refinement APIs in Plan C) but not yet wired into a user-facing endpoint here.

**Tech Stack:** TypeScript 5.x, Zod 3.24, @google/genai 1.0, Drizzle, sharp 0.33. No new deps.

**Prerequisite:** Plan A must be complete (composers + `skin-builder-v2.ts` exist).

---

## Task B1: SkinIntent + SkinPixels Zod schemas

**Files:**
- Create: `lib/intent/schema.ts`
- Create: `lib/intent/schema.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/intent/schema.test.ts
import { describe, it, expect } from 'vitest'
import { skinIntentSchema, skinPixelsSchema } from './schema'

const VALID_INTENT = {
  version: 1,
  seed: 1,
  style: 'retro',
  palette: ['#1C3D73', '#2A5099', '#6B4A20'],
  palette_mode: 'soft',
  character: {
    skin_tone: '#C4956A',
    eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
    brows: 'flat', mouth: 'smile', mouth_color: '#8B5040',
    nose: 'dot', nose_shadow: '#A07050',
    hair_style: 'classic', hair_length: 'medium',
    hair_color: '#3B2507', hair_accent_color: '#5A3D14',
    ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

describe('skinIntentSchema', () => {
  it('accepts a valid intent', () => {
    expect(() => skinIntentSchema.parse(VALID_INTENT)).not.toThrow()
  })
  it('rejects intent with invalid eye_shape', () => {
    const bad = { ...VALID_INTENT, character: { ...VALID_INTENT.character, eye_shape: 'banana' } }
    expect(() => skinIntentSchema.parse(bad)).toThrow()
  })
  it('rejects palette shorter than 3 colors', () => {
    const bad = { ...VALID_INTENT, palette: ['#FFFFFF', '#000000'] }
    expect(() => skinIntentSchema.parse(bad)).toThrow()
  })
  it('rejects palette longer than 5 colors', () => {
    const bad = { ...VALID_INTENT, palette: ['#F00','#F00','#F00','#F00','#F00','#F00'] }
    expect(() => skinIntentSchema.parse(bad)).toThrow()
  })
  it('defaults palette_mode to "soft" when omitted', () => {
    const { palette_mode, ...rest } = VALID_INTENT
    const parsed = skinIntentSchema.parse(rest)
    expect(parsed.palette_mode).toBe('soft')
  })
})

describe('skinPixelsSchema', () => {
  it('accepts a valid pixels object', () => {
    const pixels = {
      torso_front: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
      torso_back: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
      torso_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
      arm_front: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
      arm_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
      arm_back: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
      leg_front: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
      leg_side: Array(12).fill(null).map(() => Array(4).fill('#141020')),
      leg_back: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
    }
    expect(() => skinPixelsSchema.parse(pixels)).not.toThrow()
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/intent/schema.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement schema.ts**

```ts
// lib/intent/schema.ts
import { z } from 'zod'

const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Hex color required')

export const eyeShapeEnum = z.enum(['round','almond','wide','close_set','sleepy','dot','square','mono'])
export const browShapeEnum = z.enum(['none','flat','angled_up','angled_down','bushy'])
export const mouthShapeEnum = z.enum(['none','smile','wide_smile','frown','open','smirk'])
export const noseShapeEnum = z.enum(['none','bridge','dot','wide'])
export const hairStyleEnum = z.enum(['classic','bangs','side_part','mohawk','fluffy','curtain','bald','bun','ponytail','spiky','undercut','dreads'])
export const hairLengthEnum = z.enum(['short','medium','long','very_long'])
export const earTemplateEnum = z.enum(['none','round','pointy','cat','fox','bunny','wolf','elf'])
export const styleEnum = z.enum(['retro','cyberpunk','fantasy','modern','arcade','medieval','futuristic','horror'])

export const characterSchema = z.object({
  skin_tone: hex,
  eye_shape: eyeShapeEnum,
  eye_color: hex,
  eye_white: hex.default('#F0EFEB'),
  brows: browShapeEnum,
  mouth: mouthShapeEnum,
  mouth_color: hex,
  nose: noseShapeEnum,
  nose_shadow: hex,
  hair_style: hairStyleEnum,
  hair_length: hairLengthEnum,
  hair_color: hex,
  hair_accent_color: hex,
  ear_template: earTemplateEnum,
  ear_color: hex,
  inner_ear_color: hex,
})

export const outfitSchema = z.object({
  torso: z.string().min(1),
  arms: z.string().min(1),
  legs: z.string().min(1),
  jacket: z.string().optional(),
  sleeves: z.string().optional(),
  pants_outer: z.string().optional(),
  accessories: z.string().optional(),
})

export const refinementEventSchema = z.object({
  type: z.enum(['region_reroll','patch','param_edit','manual_paint']),
  at: z.string(),
  description: z.string(),
  affected_regions: z.array(z.string()),
})

export const skinIntentSchema = z.object({
  version: z.literal(1),
  seed: z.number().int().min(0).max(99999),
  style: styleEnum,
  palette: z.array(hex).min(3).max(5),
  palette_mode: z.enum(['soft','hard']).default('soft'),
  character: characterSchema,
  outfit: outfitSchema,
  refinement_history: z.array(refinementEventSchema).default([]),
})
export type SkinIntent = z.infer<typeof skinIntentSchema>

const pixelGrid = z.array(z.array(z.string()))

export const skinPixelsSchema = z.object({
  torso_front: pixelGrid,
  torso_back: pixelGrid,
  torso_side: pixelGrid,
  arm_front: pixelGrid,
  arm_side: pixelGrid,
  arm_back: pixelGrid,
  leg_front: pixelGrid,
  leg_side: pixelGrid,
  leg_back: pixelGrid,
  jacket_front: pixelGrid.optional(),
  jacket_back: pixelGrid.optional(),
  jacket_side: pixelGrid.optional(),
  sleeve_front: pixelGrid.optional(),
  pants_outer_front: pixelGrid.optional(),
})
export type SkinPixels = z.infer<typeof skinPixelsSchema>

export type BodyRegion = keyof SkinPixels
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/intent/schema.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/intent/
git commit -m "feat(intent): add SkinIntent and SkinPixels Zod schemas"
```

---

## Task B2: Drizzle migration for new columns

**Files:**
- Modify: `lib/db/schema.ts` (or wherever `skinGenerations` is defined)
- Create: a new Drizzle migration file via `npx drizzle-kit generate`

- [ ] **Step 1: Inspect current schema**

Run: `cat lib/db/schema.ts | head -50`
Identify the `skinGenerations` table and the current JSON column for color map.

- [ ] **Step 2: Add new columns**

Edit `lib/db/schema.ts` — add three new nullable columns to `skinGenerations`:

```ts
// inside skinGenerations table definition
intent: jsonb('intent'),                         // SkinIntent | null
pixels: jsonb('pixels'),                         // SkinPixels | null
manual_overrides: jsonb('manual_overrides'),     // string[] | null — region names locked from auto-repaint
schema_version: text('schema_version').default('v1'),  // 'v1' | 'v2'
```

(Use the existing pattern in the file for nullable JSON columns — likely `jsonb` from `drizzle-orm/pg-core`.)

- [ ] **Step 3: Generate migration**

Run: `npx drizzle-kit generate`
Expected: A new file appears in your migrations dir (check `drizzle.config.ts` for the output path). Inspect it — it should add the three columns and the `schema_version` default.

- [ ] **Step 4: Apply migration locally**

Run the project's migration command (e.g., `npx drizzle-kit migrate` or whatever the project uses).
Verify locally with `psql` (or Supabase dashboard) that the `skin_generations` table has the new columns.

- [ ] **Step 5: Write a sanity test**

```ts
// lib/db/schema.test.ts
import { describe, it, expect } from 'vitest'
import { skinGenerations } from './schema'

describe('skinGenerations schema', () => {
  it('exposes the new v2 columns', () => {
    expect(skinGenerations.intent).toBeDefined()
    expect(skinGenerations.pixels).toBeDefined()
    expect(skinGenerations.manual_overrides).toBeDefined()
    expect(skinGenerations.schema_version).toBeDefined()
  })
})
```

Run: `npx vitest run lib/db/schema.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/db/schema.ts lib/db/schema.test.ts drizzle/  # adjust path to migrations dir
git commit -m "feat(db): add intent/pixels/manual_overrides columns for v2 schema"
```

---

## Task B3: Director LLM stage

**Files:**
- Create: `lib/intent/director.ts`
- Create: `lib/intent/director.test.ts`
- Create: `lib/intent/director-prompt.ts` (system instruction in its own file for readability)

- [ ] **Step 1: Write failing test (with mocked Gemini)**

```ts
// lib/intent/director.test.ts
import { describe, it, expect, vi } from 'vitest'
import { runDirector } from './director'

// Mock @google/genai
vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          version: 1,
          seed: 42,
          style: 'retro',
          palette: ['#1C3D73', '#2A5099', '#6B4A20'],
          palette_mode: 'soft',
          character: {
            skin_tone: '#C4956A',
            eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
            brows: 'flat', mouth: 'smile', mouth_color: '#8B5040',
            nose: 'dot', nose_shadow: '#A07050',
            hair_style: 'classic', hair_length: 'medium',
            hair_color: '#3B2507', hair_accent_color: '#5A3D14',
            ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
          },
          outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
          refinement_history: [],
        }),
      }),
    },
  })),
}))

describe('runDirector', () => {
  it('returns a valid SkinIntent for a text prompt', async () => {
    const intent = await runDirector({ prompt: 'a knight in blue tunic' })
    expect(intent.style).toBe('retro')
    expect(intent.palette.length).toBeGreaterThanOrEqual(3)
    expect(intent.character.hair_style).toBe('classic')
  })

  it('throws on invalid Gemini output after retry', async () => {
    const { GoogleGenAI } = await import('@google/genai')
    vi.mocked(GoogleGenAI).mockImplementation(() => ({
      models: { generateContent: vi.fn().mockResolvedValue({ text: '{ "invalid": true }' }) },
    } as any))
    await expect(runDirector({ prompt: 'x' })).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/intent/director.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement director-prompt.ts**

```ts
// lib/intent/director-prompt.ts
export const DIRECTOR_SYSTEM_INSTRUCTION = `You are a Minecraft skin character director. Read the user's prompt and optional reference image, and produce a SkinIntent JSON describing the character.

Required fields:
- version: always 1
- seed: integer 0-99999
- style: one of "retro" | "cyberpunk" | "fantasy" | "modern" | "arcade" | "medieval" | "futuristic" | "horror"
- palette: 3-5 hex colors for the OUTFIT (not skin/hair/eyes). Bold, saturated, readable in 4-8px pixel art.
- palette_mode: "soft" (default)
- character: parametric face/hair/ear parts. Allowed values:
  - skin_tone: warm lifelike hex (e.g. #C4956A warm, #F5D6B8 light, #8D5524 dark — never gray or pure white)
  - eye_shape: round | almond | wide | close_set | sleepy | dot | square | mono
  - eye_color: hex
  - eye_white: hex (default #F0EFEB)
  - brows: none | flat | angled_up | angled_down | bushy
  - mouth: none | smile | wide_smile | frown | open | smirk
  - mouth_color: hex
  - nose: none | bridge | dot | wide
  - nose_shadow: hex (slightly darker than skin_tone)
  - hair_style: classic | bangs | side_part | mohawk | fluffy | curtain | bald | bun | ponytail | spiky | undercut | dreads
  - hair_length: short | medium | long | very_long
  - hair_color: hex
  - hair_accent_color: hex (lighter or contrasting streak/tip)
  - ear_template: none | round | pointy | cat | fox | bunny | wolf | elf
  - ear_color: hex (defaults to hair_color if matching)
  - inner_ear_color: hex (light pink or near-white inner accent)
- outfit: SHORT vivid free-text descriptors per region. Mention pattern, trim, belt, cuffs, boots.
  - torso (REQUIRED)
  - arms (REQUIRED)
  - legs (REQUIRED)
  - jacket (optional outer coat/robe)
  - sleeves (optional outer sleeves)
  - pants_outer (optional outer pants)
  - accessories (optional, e.g. "small star on left chest")
- refinement_history: []

Rules:
- Never use #000000 or #FFFFFF. Use #1A1A1A and #F0F0F0.
- If reference image present, extract every visible detail faithfully.
- Choose parametric character values that match the prompt's vibe.

Output ONLY valid JSON matching the schema. No prose, no markdown fences.

Example (minimal prompt):
Input: "cyberpunk hacker with neon visor"
Output: {
  "version": 1,
  "seed": 47301,
  "style": "cyberpunk",
  "palette": ["#0A0E27", "#00F0FF", "#FF1F9C"],
  "palette_mode": "soft",
  "character": {
    "skin_tone": "#D4A878",
    "eye_shape": "mono", "eye_color": "#00F0FF", "eye_white": "#F0EFEB",
    "brows": "angled_down", "mouth": "smirk", "mouth_color": "#5A2848",
    "nose": "dot", "nose_shadow": "#A07050",
    "hair_style": "undercut", "hair_length": "short",
    "hair_color": "#1A1A1A", "hair_accent_color": "#FF1F9C",
    "ear_template": "none", "ear_color": "#1A1A1A", "inner_ear_color": "#FFB8CC"
  },
  "outfit": {
    "torso": "black tech jacket with neon pink trim and zipper",
    "arms": "matching black sleeves with cyan accent stripes",
    "legs": "dark utility pants",
    "accessories": "small neon pink chest patch"
  },
  "refinement_history": []
}`
```

- [ ] **Step 4: Implement director.ts**

```ts
// lib/intent/director.ts
import { GoogleGenAI, type Part } from '@google/genai'
import { skinIntentSchema, type SkinIntent } from './schema'
import { DIRECTOR_SYSTEM_INSTRUCTION } from './director-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface DirectorInput {
  prompt: string
  referenceImageBase64?: string
  referenceImageMimeType?: 'image/jpeg' | 'image/png'
}

export async function runDirector(input: DirectorInput): Promise<SkinIntent> {
  const parts: Part[] = []
  if (input.referenceImageBase64 && input.referenceImageMimeType) {
    parts.push({
      inlineData: { data: input.referenceImageBase64, mimeType: input.referenceImageMimeType },
    })
  }
  parts.push({ text: input.prompt || 'A classic adventurer Minecraft skin.' })

  async function attempt(): Promise<SkinIntent> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: DIRECTOR_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
    const text = response.text
    if (!text) throw new Error('Empty Director response')
    return skinIntentSchema.parse(JSON.parse(text))
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/intent/director.test.ts`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/intent/director.ts lib/intent/director-prompt.ts lib/intent/director.test.ts
git commit -m "feat(intent): add Director LLM stage with structured SkinIntent output"
```

---

## Task B4: Artist LLM stage

**Files:**
- Create: `lib/intent/artist.ts`
- Create: `lib/intent/artist-prompt.ts`
- Create: `lib/intent/artist.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/intent/artist.test.ts
import { describe, it, expect, vi } from 'vitest'
import { runArtist } from './artist'
import type { SkinIntent } from './schema'

vi.mock('@google/genai', () => {
  const mockPixels: Record<string, string[][]> = {
    torso_front: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_back: Array(12).fill(null).map(() => Array(8).fill('#1C3D73')),
    torso_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_front: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    arm_side: Array(12).fill(null).map(() => Array(4).fill('#163060')),
    arm_back: Array(12).fill(null).map(() => Array(4).fill('#1C3D73')),
    leg_front: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
    leg_side: Array(12).fill(null).map(() => Array(4).fill('#141020')),
    leg_back: Array(12).fill(null).map(() => Array(4).fill('#1A1428')),
  }
  return {
    GoogleGenAI: vi.fn().mockImplementation(() => ({
      models: {
        generateContent: vi.fn().mockResolvedValue({ text: JSON.stringify(mockPixels) }),
      },
    })),
  }
})

const INTENT: SkinIntent = {
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

describe('runArtist', () => {
  it('returns SkinPixels for all required body regions', async () => {
    const pixels = await runArtist({
      intent: INTENT,
      regions: ['torso_front','torso_back','torso_side','arm_front','arm_side','arm_back','leg_front','leg_side','leg_back'],
    })
    expect(pixels.torso_front.length).toBe(12)
    expect(pixels.torso_front[0].length).toBe(8)
    expect(pixels.arm_front.length).toBe(12)
  })

  it('accepts optional context for region re-roll', async () => {
    const partial = await runArtist({
      intent: INTENT,
      regions: ['torso_front'],
      context: { torso_back: Array(12).fill(null).map(() => Array(8).fill('#000000')) } as any,
    })
    expect(partial.torso_front).toBeDefined()
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/intent/artist.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement artist-prompt.ts**

```ts
// lib/intent/artist-prompt.ts
import type { SkinIntent, BodyRegion, SkinPixels } from './schema'

export function buildArtistPrompt(intent: SkinIntent, regions: BodyRegion[], context?: Partial<SkinPixels>): string {
  const regionList = regions.join(', ')
  const ctx = context && Object.keys(context).length > 0
    ? `\nExisting context pixels (match this style):\n${JSON.stringify(context, null, 2)}`
    : ''
  return `Paint Minecraft skin BODY pixel grids for the regions: ${regionList}

Character intent:
  Style: ${intent.style}
  Palette: [${intent.palette.join(', ')}]
  Outfit:
    torso:  "${intent.outfit.torso}"
    arms:   "${intent.outfit.arms}"
    legs:   "${intent.outfit.legs}"
    ${intent.outfit.jacket ? `jacket: "${intent.outfit.jacket}"` : ''}
    ${intent.outfit.sleeves ? `sleeves: "${intent.outfit.sleeves}"` : ''}
    ${intent.outfit.pants_outer ? `pants_outer: "${intent.outfit.pants_outer}"` : ''}
    ${intent.outfit.accessories ? `accessories: "${intent.outfit.accessories}"` : ''}

Region dimensions (rows × cols):
  torso_front: 12×8       torso_back: 12×8       torso_side: 12×4
  arm_front: 12×4         arm_side: 12×4         arm_back: 12×4
  leg_front: 12×4         leg_side: 12×4         leg_back: 12×4
  jacket_front/back: 12×8  jacket_side: 12×4
  sleeve_front: 12×4      pants_outer_front: 12×4

Layout (rows are 0-indexed top-to-bottom):
  Torso: rows 0-1 collar/shoulder, 2-7 body, 8-9 belt, 10-11 lower garment
  Arm:   row 0 shoulder cap, 1-9 main, 10-11 cuff
  Leg:   rows 0-7 pants, 8-11 boots

Output: ONE JSON object with one key per region listed above. Each value is a 2D array
of hex color strings (row major). Use "" for transparent pixels (only in outer/optional layers).

Symmetry note: ONLY paint torso_side, arm_front, arm_side, arm_back, leg_front, leg_side,
leg_back. The system mirrors them to the left side automatically — do NOT include left_* keys.

${ctx}`
}

export const ARTIST_SYSTEM_INSTRUCTION = `You are a Minecraft skin pixel artist. You draw pixel grids for body regions of a 64×64 player skin. Draw from the palette; you may use a few transition shades for shading. Never use #000000 or #FFFFFF — use #1A1A1A and #F0F0F0. Output ONLY valid JSON. No prose, no markdown fences.`
```

- [ ] **Step 4: Implement artist.ts**

```ts
// lib/intent/artist.ts
import { GoogleGenAI } from '@google/genai'
import { skinPixelsSchema, type SkinIntent, type SkinPixels, type BodyRegion } from './schema'
import { ARTIST_SYSTEM_INSTRUCTION, buildArtistPrompt } from './artist-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export interface ArtistInput {
  intent: SkinIntent
  regions: BodyRegion[]
  context?: Partial<SkinPixels>
}

export async function runArtist(input: ArtistInput): Promise<Partial<SkinPixels>> {
  const prompt = buildArtistPrompt(input.intent, input.regions, input.context)

  async function attempt(): Promise<Partial<SkinPixels>> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: ARTIST_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
    const text = response.text
    if (!text) throw new Error('Empty Artist response')
    const parsed = JSON.parse(text)
    // Validate only the requested keys are present and have valid pixel grids
    const partialSchema = skinPixelsSchema.partial()
    return partialSchema.parse(parsed)
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}
```

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/intent/artist.test.ts`
Expected: 2 tests pass.

- [ ] **Step 6: Commit**

```bash
git add lib/intent/artist.ts lib/intent/artist-prompt.ts lib/intent/artist.test.ts
git commit -m "feat(intent): add Artist LLM stage for body pixel grids"
```

---

## Task B5: Patch LLM stage (for refinement in Plan C)

Defined here so Plan C can import it; not yet wired to a user endpoint.

**Files:**
- Create: `lib/intent/patch.ts`
- Create: `lib/intent/patch-prompt.ts`
- Create: `lib/intent/patch.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/intent/patch.test.ts
import { describe, it, expect, vi } from 'vitest'
import { runPatch } from './patch'
import type { SkinIntent } from './schema'

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: vi.fn().mockResolvedValue({
        text: JSON.stringify({
          palette_changes: [{ index: 0, new_hex: '#E63946' }],
          affected_regions: ['torso_front','torso_back','torso_side'],
          affects_character: false,
        }),
      }),
    },
  })),
}))

const INTENT: SkinIntent = {
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

describe('runPatch', () => {
  it('returns a SkinIntentPatch for "make the shirt redder"', async () => {
    const patch = await runPatch({ intent: INTENT, instruction: 'make the shirt redder' })
    expect(patch.palette_changes?.[0].new_hex).toBe('#E63946')
    expect(patch.affected_regions).toContain('torso_front')
    expect(patch.affects_character).toBe(false)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/intent/patch.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement patch-prompt.ts and patch.ts**

```ts
// lib/intent/patch-prompt.ts
import type { SkinIntent } from './schema'

export const PATCH_SYSTEM_INSTRUCTION = `You translate a natural-language refinement instruction into a SkinIntentPatch JSON. The patch describes how to change an existing SkinIntent.

Output schema:
{
  "palette_changes": [{ "index": 0|1|2|3|4, "new_hex": "#RRGGBB" }],   // optional
  "character_changes": { /* any subset of character fields */ },        // optional
  "outfit_changes": { /* any subset of outfit fields */ },              // optional
  "affected_regions": [ "torso_front", "torso_back", ... ],             // required — which BODY regions need repainting
  "affects_character": true|false                                        // required — true if character (face/hair/ears) changed
}

Allowed body regions: torso_front, torso_back, torso_side, arm_front, arm_side, arm_back,
leg_front, leg_side, leg_back, jacket_front, jacket_back, jacket_side, sleeve_front, pants_outer_front.

Rules:
- "redder shirt" / "darker boots" → palette_changes (rotate or replace) + outfit_changes (update torso/legs text) + relevant affected_regions.
- "longer hair" / "different eyes" / "sunglasses" → character_changes + affects_character: true. affected_regions stays empty if only character changed.
- "swap boots for sandals" → outfit_changes.legs updated + affected_regions: [leg_front, leg_side, leg_back].
- If the instruction is too vague to act on, return: { "affected_regions": [], "affects_character": false }.

Output ONLY JSON. No prose.`

export function buildPatchPrompt(intent: SkinIntent, instruction: string): string {
  return `Current intent:
${JSON.stringify(intent, null, 2)}

User instruction: "${instruction}"

Return the SkinIntentPatch.`
}
```

```ts
// lib/intent/patch.ts
import { z } from 'zod'
import { GoogleGenAI } from '@google/genai'
import { skinIntentSchema, type SkinIntent, type BodyRegion } from './schema'
import { PATCH_SYSTEM_INSTRUCTION, buildPatchPrompt } from './patch-prompt'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

const skinIntentPatchSchema = z.object({
  palette_changes: z.array(z.object({
    index: z.number().int().min(0).max(4),
    new_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  })).optional(),
  character_changes: skinIntentSchema.shape.character.partial().optional(),
  outfit_changes: skinIntentSchema.shape.outfit.partial().optional(),
  affected_regions: z.array(z.string()),
  affects_character: z.boolean(),
})
export type SkinIntentPatch = z.infer<typeof skinIntentPatchSchema>

export interface PatchInput {
  intent: SkinIntent
  instruction: string
}

export async function runPatch(input: PatchInput): Promise<SkinIntentPatch> {
  const prompt = buildPatchPrompt(input.intent, input.instruction)

  async function attempt(): Promise<SkinIntentPatch> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: PATCH_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
      },
    })
    const text = response.text
    if (!text) throw new Error('Empty Patch response')
    return skinIntentPatchSchema.parse(JSON.parse(text))
  }

  try {
    return await attempt()
  } catch {
    return await attempt()
  }
}

export function applyPatch(intent: SkinIntent, patch: SkinIntentPatch): SkinIntent {
  const next: SkinIntent = JSON.parse(JSON.stringify(intent))
  if (patch.palette_changes) {
    for (const c of patch.palette_changes) {
      if (c.index < next.palette.length) next.palette[c.index] = c.new_hex
    }
  }
  if (patch.character_changes) {
    Object.assign(next.character, patch.character_changes)
  }
  if (patch.outfit_changes) {
    Object.assign(next.outfit, patch.outfit_changes)
  }
  return next
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/intent/patch.test.ts`
Expected: 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add lib/intent/patch.ts lib/intent/patch-prompt.ts lib/intent/patch.test.ts
git commit -m "feat(intent): add Patch LLM stage for natural-language refinement"
```

---

## Task B6: New /api/generate v2 flow

Replace the existing `app/api/generate/route.ts` handler with the v2 pipeline. Keep the legacy code path callable via an explicit query flag for now (`?legacy=1`) so old paths can still be exercised manually during rollout.

**Files:**
- Modify: `app/api/generate/route.ts`
- Create: `app/api/generate/route.test.ts` (high-level integration test against mocked LLMs)

- [ ] **Step 1: Write failing test**

```ts
// app/api/generate/route.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

vi.mock('@/lib/intent/director', () => ({
  runDirector: vi.fn().mockResolvedValue({
    version: 1, seed: 42, style: 'retro',
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
  }),
}))

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

vi.mock('@/lib/local-mode', () => ({ IS_LOCAL_MODE: true }))

describe('POST /api/generate (v2 local mode)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns a skin URL for a valid prompt', async () => {
    const req = new Request('http://test/api/generate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ prompt: 'a blue tunic knight' }),
    })
    const res = await POST(req as any)
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.status).toBe('completed')
    expect(json.skinUrl).toMatch(/\.png$/)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run app/api/generate/route.test.ts`
Expected: FAIL — the route still uses legacy generator.

- [ ] **Step 3: Rewrite the route handler**

Edit `app/api/generate/route.ts` — replace the legacy `generateRegionColorMap` + `buildSkinPng` calls with v2 pipeline. Full new file:

```ts
// app/api/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAndDeductCredit, refundCredit } from '@/lib/credits'
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
  'torso_front','torso_back','torso_side',
  'arm_front','arm_side','arm_back',
  'leg_front','leg_side','leg_back',
]

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

  const creditResult = await checkAndDeductCredit(user.id)
  if (!creditResult.allowed) {
    const tomorrow = new Date()
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
    tomorrow.setUTCHours(0, 0, 0, 0)
    return NextResponse.json(
      { error: 'generation_limit_reached', message: 'You have used all your generations for today. Upgrade for more.', resetAt: tomorrow.toISOString() },
      { status: 402 }
    )
  }

  const [generation] = await db.insert(skinGenerations).values({
    userId: user.id, prompt, status: 'pending', schema_version: 'v2',
  }).returning({ id: skinGenerations.id })
  const generationId = generation.id

  try {
    let referenceImagePath: string | undefined
    if (referenceImageBase64 && referenceImageMimeType && referenceImageExt) {
      const refPath = `references/${user.id}/${generationId}.${referenceImageExt}`
      const { error } = await supabase.storage.from('references').upload(refPath, Buffer.from(referenceImageBase64, 'base64'), { contentType: referenceImageMimeType })
      if (!error) referenceImagePath = refPath
    }

    // 1. Director → SkinIntent
    const intent = await runDirector({ prompt: prompt ?? '', referenceImageBase64, referenceImageMimeType })

    // 2. Artist → SkinPixels (all body regions)
    const pixelsPartial = await runArtist({ intent, regions: ALL_BODY_REGIONS })
    const pixels = skinPixelsSchema.parse(pixelsPartial)

    // 3. Builder → PNG
    const png = await buildSkinPngV2(intent, pixels)
    if (!(await validateSkinV2(png))) throw new Error('Generated skin failed dimension validation')

    // 4. Upload
    const skinPath = `skins/${user.id}/${generationId}.png`
    const { error: uploadErr } = await supabase.storage.from('skins').upload(skinPath, png, { contentType: 'image/png' })
    if (uploadErr) throw new Error(`Failed to upload skin: ${uploadErr.message}`)

    await db.update(skinGenerations).set({
      status: 'completed',
      resultPath: skinPath,
      completedAt: new Date(),
      intent,
      pixels,
      manual_overrides: [],
      schema_version: 'v2',
      referenceImagePath,
    }).where(eq(skinGenerations.id, generationId))

    const { data: signedUrlData } = await supabase.storage.from('skins').createSignedUrl(skinPath, 3600)

    return NextResponse.json({
      generationId,
      status: 'completed',
      skinUrl: signedUrlData?.signedUrl,
      intent,
      creditsRemaining: creditResult.remaining,
    })
  } catch (err) {
    await refundCredit(user.id)
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    await db.update(skinGenerations).set({ status: 'failed', errorMessage }).where(eq(skinGenerations.id, generationId))
    console.error('Skin generation v2 failed:', errorMessage)
    return NextResponse.json({ error: 'generation_failed', message: 'Skin generation failed. Your credit has been refunded. Please try again.' }, { status: 500 })
  }
}

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
      creditsRemaining: 999,
    })
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error('Local mode v2 failed:', errorMessage)
    return NextResponse.json({ error: 'generation_failed', message: 'Skin generation failed. Please try again.' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Run tests + lint**

Run: `npm test && npm run lint`
Expected: All tests pass including the new route test. No lint errors.

- [ ] **Step 5: Commit**

```bash
git add app/api/generate/route.ts app/api/generate/route.test.ts
git commit -m "feat(api): switch /api/generate to v2 Director→Artist→Builder pipeline"
```

---

## Task B7: Update GeneratorPageClient to display + persist intent

The generator UI already submits form data and shows the result. Update it to:
- Save the returned `intent` to local state so the result page knows what was generated (used by Plan C variations/refinement)
- Pass `intent` and `generationId` through to the editor link

**Files:**
- Modify: `app/(app)/generate/GeneratorPageClient.tsx`

- [ ] **Step 1: Identify current generation handler**

Read the file and find where the API response is consumed (likely a `handleSubmit` or `onSubmit` function).

- [ ] **Step 2: Add intent state**

Add a state slot for the returned intent. In the response handler, save `intent` from the JSON response to state. Pass it (or the `generationId`) to the "Open in Editor" link.

```tsx
// Inside GeneratorPageClient.tsx
const [result, setResult] = useState<{ generationId: string; skinUrl: string; intent: SkinIntent } | null>(null)

// In the submit handler, after fetch:
const data = await res.json()
if (data.status === 'completed') {
  setResult({ generationId: data.generationId, skinUrl: data.skinUrl, intent: data.intent })
}
```

Update the editor link to include `?id=${result.generationId}` so the editor can load the persisted intent + pixels.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`
Open `/generate`, submit "blue knight". Confirm the skin renders, the response includes `intent`, and the "Open in Editor" link points at `/edit?id=<uuid>`.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/generate/GeneratorPageClient.tsx
git commit -m "feat(ui): plumb v2 intent through generator client state"
```

---

## Task B8: Backward-compatible download route

The existing download endpoint `app/api/generate/[id]/download/route.ts` fetches a skin by id. Ensure it works for both v1 and v2 generations.

**Files:**
- Modify: `app/api/generate/[id]/download/route.ts`

- [ ] **Step 1: Read the current handler**

It probably fetches the row, gets `resultPath`, and returns a signed URL or buffer.

- [ ] **Step 2: Verify it's schema-agnostic**

The download route serves the stored PNG file directly — it does not need to know which renderer produced it. Confirm by reading the file and verifying no schema-specific logic.

If it IS schema-aware (e.g., re-renders from color_map), then add a branch:
- If `schema_version === 'v2'`: use the stored `intent` + `pixels` columns and call `buildSkinPngV2`.
- Else: use the legacy `color_map` and call `buildSkinPng` from `lib/legacy/skin-builder`.

- [ ] **Step 3: Commit any changes**

```bash
git add app/api/generate/\[id\]/download/route.ts
git commit -m "fix(api): ensure download route handles both v1 and v2 generations"
```

---

## Task B9: Cleanup — remove unused legacy imports

After B6 lands, the old `generateRegionColorMap` from `lib/gemini.ts` is no longer used by the main generation route. It's still useful for legacy regeneration (if we ever need it). Leave it in place but verify it's not imported from anywhere except `lib/legacy/` and any test fixtures.

- [ ] **Step 1: Search for usages**

```bash
git grep -l "generateRegionColorMap" -- ':!lib/legacy/' ':!lib/gemini.ts'
```
Expected: No output (or only test files).

- [ ] **Step 2: If route.ts no longer needs it, remove the import**

The new `app/api/generate/route.ts` from B6 should not import `generateRegionColorMap`. Verify by `git grep "generateRegionColorMap" app/api/generate/route.ts` → no output.

- [ ] **Step 3: Move `lib/gemini.ts` to `lib/legacy/gemini.ts`**

```bash
git mv lib/gemini.ts lib/legacy/gemini.ts
```

Search for any remaining imports and update:

```bash
git grep -l "from '@/lib/gemini'" | xargs -I{} sed -i '' "s|@/lib/gemini|@/lib/legacy/gemini|g" {}
```

(Use sed appropriate to OS — `sed -i ''` for macOS, `sed -i` for Linux.)

- [ ] **Step 4: Run tests + lint**

Run: `npm test && npm run lint && npx tsc --noEmit`
Expected: Pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move legacy gemini.ts to lib/legacy/"
```

---

## Task B10: Plan B integration check

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 2: Lint and type check**

Run: `npm run lint && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manual E2E in dev**

Run: `npm run dev`. Open `/generate`, submit a prompt, confirm a v2 skin is generated and saved.
Verify in DB: `select id, schema_version, intent is not null as has_intent from skin_generations order by created_at desc limit 5;` — newest row should have `schema_version = 'v2'` and `has_intent = true`.

- [ ] **Step 4: Marker commit**

```bash
git commit --allow-empty -m "chore: Plan B (new pipeline) complete"
```

---

## Plan B self-review

**Coverage check:**
- SkinIntent + SkinPixels Zod schemas: B1
- DB migration + columns: B2
- Director: B3
- Artist: B4
- Patch (for Plan C): B5
- Pipeline route handler: B6
- Generator UI plumbing: B7
- Download backward compat: B8
- Legacy cleanup: B9

**Out of scope for Plan B:**
- Refinement endpoints (re-roll, patch, variations) — Plan C
- Editor parameter controls — Plan C
- manual_overrides tracking (the column exists but is always written as `[]` in B6) — Plan C populates it
