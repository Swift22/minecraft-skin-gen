# Skin Gen v2 — Plan A: Builder Foundations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the rendering primitives for the v2 skin generation pipeline — soft palette snap, L/R mirror, parametric face/hair/ear composers, and a parts library — without touching the existing pipeline. All changes ship as new modules that pass golden tests; no user-visible change yet.

**Architecture:** New code lives under `lib/rendering/` (utilities + composers) and `lib/parts/` (mask data). The legacy `lib/skin-builder.ts` and `lib/face-templates.ts` move to `lib/legacy/` unchanged so old skins keep rendering. A new top-level `lib/skin-builder-v2.ts` orchestrator is added but gated — it accepts the new `SkinIntent` + `SkinPixels` shapes but those types only land in Plan B.

**Tech Stack:** TypeScript 5.x, Vitest 80% coverage, sharp 0.33 for PNG IO, no new deps.

**Note on pixel-mask authoring:** Some tasks involve designing 8×8 (or larger) pixel masks for face/hair/ear parts. The plan provides the data structures, tests, and visual briefs that reference `learn-faces/mc_skin_faces/` and `learnhair/`. The actual mask design is creative work done during implementation; tests verify structure and integration.

---

## Task A1: Palette snap utility

**Files:**
- Create: `lib/rendering/palette-snap.ts`
- Create: `lib/rendering/palette-snap.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/rendering/palette-snap.test.ts
import { describe, it, expect } from 'vitest'
import { rgbToLab, deltaE76, nearestPaletteColor, softSnap } from './palette-snap'

describe('rgbToLab', () => {
  it('converts pure red correctly (approx Lab 53.24, 80.09, 67.20)', () => {
    const lab = rgbToLab([255, 0, 0])
    expect(lab[0]).toBeCloseTo(53.24, 1)
    expect(lab[1]).toBeCloseTo(80.09, 1)
    expect(lab[2]).toBeCloseTo(67.20, 1)
  })
})

describe('deltaE76', () => {
  it('returns 0 for identical colors', () => {
    expect(deltaE76([50, 0, 0], [50, 0, 0])).toBe(0)
  })
  it('returns positive distance for different colors', () => {
    expect(deltaE76([50, 0, 0], [60, 0, 0])).toBeGreaterThan(0)
  })
})

describe('nearestPaletteColor', () => {
  it('returns the closest palette color and its distance', () => {
    const palette: [number, number, number][] = [[255, 0, 0], [0, 255, 0], [0, 0, 255]]
    const [color, dist] = nearestPaletteColor([250, 5, 5], palette)
    expect(color).toEqual([255, 0, 0])
    expect(dist).toBeGreaterThan(0)
    expect(dist).toBeLessThan(5)
  })
})

describe('softSnap', () => {
  it('keeps the input when within threshold', () => {
    const palette: [number, number, number][] = [[255, 0, 0]]
    expect(softSnap([250, 5, 5], palette, 24)).toEqual([250, 5, 5])
  })
  it('snaps to palette when outside threshold', () => {
    const palette: [number, number, number][] = [[255, 0, 0]]
    expect(softSnap([0, 255, 0], palette, 24)).toEqual([255, 0, 0])
  })
  it('hard-snaps when threshold is 0', () => {
    const palette: [number, number, number][] = [[255, 0, 0]]
    expect(softSnap([250, 5, 5], palette, 0)).toEqual([255, 0, 0])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/rendering/palette-snap.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement palette-snap.ts**

```ts
// lib/rendering/palette-snap.ts
export type RGB = [number, number, number]
export type Lab = [number, number, number]

const D65 = { X: 95.047, Y: 100.0, Z: 108.883 }

function srgbToLinear(c: number): number {
  const n = c / 255
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4)
}

function rgbToXyz(rgb: RGB): [number, number, number] {
  const r = srgbToLinear(rgb[0])
  const g = srgbToLinear(rgb[1])
  const b = srgbToLinear(rgb[2])
  return [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
    (r * 0.2126729 + g * 0.7151522 + b * 0.0721750) * 100,
    (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) * 100,
  ]
}

function f(t: number): number {
  return t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116
}

export function rgbToLab(rgb: RGB): Lab {
  const [x, y, z] = rgbToXyz(rgb)
  const fx = f(x / D65.X)
  const fy = f(y / D65.Y)
  const fz = f(z / D65.Z)
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
}

export function deltaE76(a: Lab, b: Lab): number {
  const dL = a[0] - b[0]
  const da = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dL * dL + da * da + db * db)
}

export function nearestPaletteColor(rgb: RGB, palette: RGB[]): [RGB, number] {
  const labIn = rgbToLab(rgb)
  let best: RGB = palette[0]
  let bestDist = Infinity
  for (const p of palette) {
    const dist = deltaE76(labIn, rgbToLab(p))
    if (dist < bestDist) {
      best = p
      bestDist = dist
    }
  }
  return [best, bestDist]
}

export function softSnap(rgb: RGB, palette: RGB[], threshold: number): RGB {
  const [nearest, dist] = nearestPaletteColor(rgb, palette)
  return dist < threshold ? rgb : nearest
}

export const DEFAULT_SNAP_THRESHOLD = 24
```

- [ ] **Step 4: Run tests, verify pass**

Run: `npx vitest run lib/rendering/palette-snap.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rendering/palette-snap.ts lib/rendering/palette-snap.test.ts
git commit -m "feat(rendering): add soft palette snap utility with CIE76 ΔE"
```

---

## Task A2: L/R mirror utility

**Files:**
- Create: `lib/rendering/mirror.ts`
- Create: `lib/rendering/mirror.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/rendering/mirror.test.ts
import { describe, it, expect } from 'vitest'
import { mirrorHorizontal } from './mirror'

describe('mirrorHorizontal', () => {
  it('mirrors columns left-to-right', () => {
    const input = [
      ['a', 'b', 'c', 'd'],
      ['1', '2', '3', '4'],
    ]
    expect(mirrorHorizontal(input)).toEqual([
      ['d', 'c', 'b', 'a'],
      ['4', '3', '2', '1'],
    ])
  })
  it('preserves rows and empty string transparency', () => {
    const input = [['x', '', 'y']]
    expect(mirrorHorizontal(input)).toEqual([['y', '', 'x']])
  })
  it('handles single-column grids', () => {
    expect(mirrorHorizontal([['a'], ['b']])).toEqual([['a'], ['b']])
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/rendering/mirror.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement mirror.ts**

```ts
// lib/rendering/mirror.ts
export function mirrorHorizontal<T>(pixels: T[][]): T[][] {
  return pixels.map((row) => [...row].reverse())
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/rendering/mirror.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rendering/mirror.ts lib/rendering/mirror.test.ts
git commit -m "feat(rendering): add horizontal mirror utility"
```

---

## Task A3: Part type system and registry helper

Establish shared types for all part files and a registry helper used by eyes/mouths/brows/noses/ears.

**Files:**
- Create: `lib/parts/types.ts`
- Create: `lib/parts/registry.ts`
- Create: `lib/parts/registry.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/registry.test.ts
import { describe, it, expect } from 'vitest'
import { createRegistry } from './registry'

describe('createRegistry', () => {
  it('returns a part by name', () => {
    const reg = createRegistry({ alpha: 1, beta: 2 })
    expect(reg.get('alpha')).toBe(1)
  })
  it('lists all part names', () => {
    const reg = createRegistry({ alpha: 1, beta: 2 })
    expect(reg.names()).toEqual(['alpha', 'beta'])
  })
  it('throws on unknown part', () => {
    const reg = createRegistry({ alpha: 1 })
    expect(() => reg.get('missing' as 'alpha')).toThrow(/missing/)
  })
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run lib/parts/registry.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement types.ts and registry.ts**

```ts
// lib/parts/types.ts
/**
 * Symbolic pixel value used in part masks.
 *
 * Letters route to colors in the rendering composers:
 * S = skin_tone, W = eye_white, E = eye_color,
 * M = mouth_color, N = nose_shadow,
 * H = hair_color, h = hair_accent_color,
 * I = inner_ear_color, R = ear_color (outer),
 * . = transparent (do not write)
 */
export type Px = 'S' | 'W' | 'E' | 'M' | 'N' | 'H' | 'h' | 'I' | 'R' | '.'

export type PartMask = Px[][]
```

```ts
// lib/parts/registry.ts
export interface Registry<K extends string, V> {
  get(name: K): V
  names(): K[]
  has(name: string): name is K
}

export function createRegistry<K extends string, V>(parts: Record<K, V>): Registry<K, V> {
  const names = Object.keys(parts) as K[]
  return {
    get(name) {
      const value = parts[name]
      if (value === undefined) throw new Error(`Part not found: ${name}`)
      return value
    },
    names() {
      return [...names]
    },
    has(name): name is K {
      return name in parts
    },
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/registry.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parts/types.ts lib/parts/registry.ts lib/parts/registry.test.ts
git commit -m "feat(parts): add Px type and registry helper"
```

---

## Task A4: Eye parts (8 shapes)

**Visual brief (reference: `learn-faces/mc_skin_faces/`):**
The 8 eye shapes are 8×8 masks positioned on rows 3–4 of `head_front`. Each mask uses `W` (eye white) and `E` (eye color); all other cells are `.` (transparent, composed over skin/hair).

| Name | Description |
|---|---|
| `round`     | 2-row eyes, eye whites cols 1-2 and 5-6, pupils in cols 2 and 5 |
| `almond`    | Single-row eyes (row 3), slight outer slant |
| `wide`      | 2-row eyes spreading to cols 0-2 and 5-7 (outer-set) |
| `close_set` | 2-row eyes pulled inward to cols 2-3 and 4-5 |
| `sleepy`    | Only bottom row visible (row 4); top row replaced by brow zone |
| `dot`       | Single pixel per eye in row 3, cols 2 and 5; no whites |
| `square`    | 2×2 solid `E` blocks at cols 1-2 and 5-6 (no whites) |
| `mono`      | One wide horizontal slit row 3, cols 1-6, alternating E/W |

**Files:**
- Create: `lib/parts/eyes/index.ts` (registry)
- Create: `lib/parts/eyes/round.ts`
- Create: `lib/parts/eyes/almond.ts`
- Create: `lib/parts/eyes/wide.ts`
- Create: `lib/parts/eyes/close_set.ts`
- Create: `lib/parts/eyes/sleepy.ts`
- Create: `lib/parts/eyes/dot.ts`
- Create: `lib/parts/eyes/square.ts`
- Create: `lib/parts/eyes/mono.ts`
- Create: `lib/parts/eyes/eyes.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/eyes/eyes.test.ts
import { describe, it, expect } from 'vitest'
import { eyes } from './index'

const NAMES = ['round', 'almond', 'wide', 'close_set', 'sleepy', 'dot', 'square', 'mono'] as const

describe('eye parts', () => {
  it('registers all 8 shapes', () => {
    expect(eyes.names().sort()).toEqual([...NAMES].sort())
  })

  for (const name of NAMES) {
    it(`${name} mask is 8 rows × 8 cols`, () => {
      const mask = eyes.get(name)
      expect(mask.length).toBe(8)
      for (const row of mask) {
        expect(row.length).toBe(8)
      }
    })

    it(`${name} mask uses only Px symbols (S|W|E|M|N|H|h|I|R|.)`, () => {
      const mask = eyes.get(name)
      const allowed = new Set(['S', 'W', 'E', 'M', 'N', 'H', 'h', 'I', 'R', '.'])
      for (const row of mask) {
        for (const cell of row) {
          expect(allowed.has(cell)).toBe(true)
        }
      }
    })
  }
})
```

- [ ] **Step 2: Run test, verify fail**

Run: `npx vitest run lib/parts/eyes/eyes.test.ts`
Expected: FAIL — modules not found.

- [ ] **Step 3: Author each eye mask**

Create each mask file in `lib/parts/eyes/<name>.ts` following the visual brief. Each file exports a single `PartMask`. Example structure:

```ts
// lib/parts/eyes/round.ts
import type { PartMask } from '../types'

export const round: PartMask = [
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 0
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 1
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 2
  ['.', 'W', 'E', '.', '.', 'W', 'E', '.'], // row 3 — eye whites + pupils
  ['.', 'W', 'W', '.', '.', 'W', 'W', '.'], // row 4
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 5
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 6
  ['.', '.', '.', '.', '.', '.', '.', '.'], // row 7
]
```

The other 7 files follow the same template — the `Px[][]` content for each follows the brief above. Author them now.

Create `lib/parts/eyes/index.ts`:

```ts
// lib/parts/eyes/index.ts
import { createRegistry } from '../registry'
import { round } from './round'
import { almond } from './almond'
import { wide } from './wide'
import { close_set } from './close_set'
import { sleepy } from './sleepy'
import { dot } from './dot'
import { square } from './square'
import { mono } from './mono'

export const eyes = createRegistry({
  round,
  almond,
  wide,
  close_set,
  sleepy,
  dot,
  square,
  mono,
})

export type EyeShape = ReturnType<typeof eyes.names>[number]
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/eyes/eyes.test.ts`
Expected: 17 tests pass (1 registry + 8 dimension + 8 symbol).

- [ ] **Step 5: Commit**

```bash
git add lib/parts/eyes/
git commit -m "feat(parts): add 8 parametric eye shapes"
```

---

## Task A5: Mouth parts (6 shapes)

**Visual brief:**
6 mouth shapes on rows 5–6 of `head_front`. Each is an 8×8 mask using `M` (mouth_color); rest `.` transparent.

| Name | Description |
|---|---|
| `none`       | Fully transparent — no mouth |
| `smile`      | Two cells: row 6 cols 2 and 5 (smile corners) |
| `wide_smile` | Row 6 cols 2,3,4,5 — wide grin |
| `frown`      | Row 5 cols 2 and 5 (corners up = frown shadow) |
| `open`       | 2×2 block row 5-6 cols 3-4 (open mouth) |
| `smirk`      | Asymmetric: row 6 col 2 only |

**Files:** Same pattern as Task A4 — one file per mouth + `index.ts`. Tests verify registry + dims + symbols.

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/mouths/mouths.test.ts
import { describe, it, expect } from 'vitest'
import { mouths } from './index'

const NAMES = ['none', 'smile', 'wide_smile', 'frown', 'open', 'smirk'] as const

describe('mouth parts', () => {
  it('registers all 6 shapes', () => {
    expect(mouths.names().sort()).toEqual([...NAMES].sort())
  })

  for (const name of NAMES) {
    it(`${name} mask is 8 rows × 8 cols`, () => {
      const mask = mouths.get(name)
      expect(mask.length).toBe(8)
      for (const row of mask) expect(row.length).toBe(8)
    })

    it(`${name} mask uses only Px symbols`, () => {
      const allowed = new Set(['S', 'W', 'E', 'M', 'N', 'H', 'h', 'I', 'R', '.'])
      for (const row of mouths.get(name)) for (const c of row) expect(allowed.has(c)).toBe(true)
    })
  }
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run lib/parts/mouths/mouths.test.ts`
Expected: FAIL.

- [ ] **Step 3: Author 6 mouth files + index**

Pattern matches Task A4. Each `lib/parts/mouths/<name>.ts` exports a `PartMask`. Example:

```ts
// lib/parts/mouths/smile.ts
import type { PartMask } from '../types'
export const smile: PartMask = [
  ['.','.','.','.','.','.','.','.'],
  ['.','.','.','.','.','.','.','.'],
  ['.','.','.','.','.','.','.','.'],
  ['.','.','.','.','.','.','.','.'],
  ['.','.','.','.','.','.','.','.'],
  ['.','.','.','.','.','.','.','.'],
  ['.','.','M','.','.','M','.','.'],
  ['.','.','.','.','.','.','.','.'],
]
```

Build `lib/parts/mouths/index.ts`:

```ts
// lib/parts/mouths/index.ts
import { createRegistry } from '../registry'
import { none } from './none'
import { smile } from './smile'
import { wide_smile } from './wide_smile'
import { frown } from './frown'
import { open } from './open'
import { smirk } from './smirk'

export const mouths = createRegistry({ none, smile, wide_smile, frown, open, smirk })
export type MouthShape = ReturnType<typeof mouths.names>[number]
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/mouths/mouths.test.ts`
Expected: 13 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parts/mouths/
git commit -m "feat(parts): add 6 parametric mouth shapes"
```

---

## Task A6: Brow parts (5 shapes)

**Visual brief:** rows 1–2 of `head_front`. Each is an 8×8 mask using `H` (hair_color) for brows.

| Name | Description |
|---|---|
| `none`         | Transparent everywhere |
| `flat`         | Row 2 cols 1-2 and 5-6 |
| `angled_up`    | Row 1 cols 2 and 5; row 2 cols 1 and 6 |
| `angled_down`  | Row 1 cols 1 and 6; row 2 cols 2 and 5 |
| `bushy`        | 2×2 blocks at row 1-2 cols 1-2 and 5-6 |

**Files / tests:** Same pattern as Task A5.

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/brows/brows.test.ts
import { describe, it, expect } from 'vitest'
import { brows } from './index'

const NAMES = ['none', 'flat', 'angled_up', 'angled_down', 'bushy'] as const

describe('brow parts', () => {
  it('registers all 5 shapes', () => {
    expect(brows.names().sort()).toEqual([...NAMES].sort())
  })
  for (const name of NAMES) {
    it(`${name} is 8×8 of valid Px`, () => {
      const m = brows.get(name)
      expect(m.length).toBe(8)
      for (const row of m) expect(row.length).toBe(8)
      const allowed = new Set(['S','W','E','M','N','H','h','I','R','.'])
      for (const row of m) for (const c of row) expect(allowed.has(c)).toBe(true)
    })
  }
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/parts/brows/brows.test.ts` → FAIL.

- [ ] **Step 3: Author files**

Create `lib/parts/brows/{none,flat,angled_up,angled_down,bushy}.ts` and `index.ts`. Each file exports a `PartMask` following the brief.

```ts
// lib/parts/brows/index.ts
import { createRegistry } from '../registry'
import { none } from './none'
import { flat } from './flat'
import { angled_up } from './angled_up'
import { angled_down } from './angled_down'
import { bushy } from './bushy'

export const brows = createRegistry({ none, flat, angled_up, angled_down, bushy })
export type BrowShape = ReturnType<typeof brows.names>[number]
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/brows/brows.test.ts`
Expected: 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parts/brows/
git commit -m "feat(parts): add 5 parametric brow shapes"
```

---

## Task A7: Nose parts (4 shapes)

**Visual brief:** row 5 of `head_front`. Uses `N` (nose_shadow).

| Name | Description |
|---|---|
| `none`   | Transparent everywhere |
| `bridge` | Row 4 col 3-4, row 5 cols 3-4 (vertical bridge) |
| `dot`    | Single pixel row 5 col 4 |
| `wide`   | Row 5 cols 3-4-5 |

**Files / tests:** Same pattern as Task A6.

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/noses/noses.test.ts
import { describe, it, expect } from 'vitest'
import { noses } from './index'

const NAMES = ['none', 'bridge', 'dot', 'wide'] as const

describe('nose parts', () => {
  it('registers all 4 shapes', () => {
    expect(noses.names().sort()).toEqual([...NAMES].sort())
  })
  for (const name of NAMES) {
    it(`${name} is 8×8 of valid Px`, () => {
      const m = noses.get(name)
      expect(m.length).toBe(8)
      for (const row of m) expect(row.length).toBe(8)
      const allowed = new Set(['S','W','E','M','N','H','h','I','R','.'])
      for (const row of m) for (const c of row) expect(allowed.has(c)).toBe(true)
    })
  }
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/parts/noses/noses.test.ts` → FAIL.

- [ ] **Step 3: Author files + index**

```ts
// lib/parts/noses/index.ts
import { createRegistry } from '../registry'
import { none } from './none'
import { bridge } from './bridge'
import { dot } from './dot'
import { wide } from './wide'

export const noses = createRegistry({ none, bridge, dot, wide })
export type NoseShape = ReturnType<typeof noses.names>[number]
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/noses/noses.test.ts`
Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parts/noses/
git commit -m "feat(parts): add 4 parametric nose shapes"
```

---

## Task A8: Hair-style bundle type and registry

Each hair style is NOT a single mask — it's a bundle of region masks covering all 6 head regions and 5 hat regions at once. Establish the bundle type and registry separately from authoring the 12 styles.

**Files:**
- Create: `lib/parts/hair-styles/types.ts`
- Create: `lib/parts/hair-styles/index.ts`
- Create: `lib/parts/hair-styles/hair-styles.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/hair-styles/hair-styles.test.ts
import { describe, it, expect } from 'vitest'
import { hairStyles } from './index'

const NAMES = [
  'classic','bangs','side_part','mohawk','fluffy','curtain',
  'bald','bun','ponytail','spiky','undercut','dreads'
] as const

describe('hair-style bundles', () => {
  it('registers all 12 styles', () => {
    expect(hairStyles.names().sort()).toEqual([...NAMES].sort())
  })

  for (const name of NAMES) {
    it(`${name} bundle has all required regions`, () => {
      const b = hairStyles.get(name)
      expect(b.head_front_overlay.length).toBe(8)
      expect(b.head_top.length).toBe(8)
      expect(b.head_right.length).toBe(8)
      expect(b.head_left.length).toBe(8)
      expect(b.head_back.length).toBe(8)
      expect(b.head_bottom.length).toBe(8)
      expect(b.hat_front.length).toBe(8)
      expect(b.hat_top.length).toBe(8)
      expect(b.hat_right.length).toBe(8)
      expect(b.hat_left.length).toBe(8)
      expect(b.hat_back.length).toBe(8)
    })
  }
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/parts/hair-styles/hair-styles.test.ts` → FAIL.

- [ ] **Step 3: Implement type + skeleton index**

```ts
// lib/parts/hair-styles/types.ts
import type { PartMask } from '../types'

export interface HairStyleBundle {
  head_front_overlay: PartMask  // covers face perimeter (cheeks, forehead) over skin
  head_top: PartMask
  head_right: PartMask
  head_left: PartMask
  head_back: PartMask
  head_bottom: PartMask          // usually all 'S' (skin under chin)
  hat_front: PartMask            // hair volume overlay; `.` = transparent
  hat_top: PartMask
  hat_right: PartMask
  hat_left: PartMask
  hat_back: PartMask
}
```

```ts
// lib/parts/hair-styles/index.ts
import { createRegistry } from '../registry'
import { classic } from './classic'
import { bangs } from './bangs'
import { side_part } from './side_part'
import { mohawk } from './mohawk'
import { fluffy } from './fluffy'
import { curtain } from './curtain'
import { bald } from './bald'
import { bun } from './bun'
import { ponytail } from './ponytail'
import { spiky } from './spiky'
import { undercut } from './undercut'
import { dreads } from './dreads'

export const hairStyles = createRegistry({
  classic, bangs, side_part, mohawk, fluffy, curtain,
  bald, bun, ponytail, spiky, undercut, dreads,
})
export type HairStyle = ReturnType<typeof hairStyles.names>[number]
```

- [ ] **Step 4: Stub all 12 bundle files**

Each file in `lib/parts/hair-styles/<name>.ts` exports a `HairStyleBundle`. Example skeleton (to be filled with actual pixel art):

```ts
// lib/parts/hair-styles/classic.ts
import type { HairStyleBundle } from './types'

const EMPTY = Array(8).fill(null).map(() => Array(8).fill('.')) as ('H'|'h'|'S'|'.')[][]

export const classic: HairStyleBundle = {
  head_front_overlay: EMPTY,
  head_top: EMPTY,
  head_right: EMPTY,
  head_left: EMPTY,
  head_back: EMPTY,
  head_bottom: EMPTY,
  hat_front: EMPTY,
  hat_top: EMPTY,
  hat_right: EMPTY,
  hat_left: EMPTY,
  hat_back: EMPTY,
}
```

Authoring each style's actual masks happens in Tasks A9–A20 below; this task only lands the scaffolding and dimension tests.

- [ ] **Step 5: Run tests**

Run: `npx vitest run lib/parts/hair-styles/hair-styles.test.ts`
Expected: 13 tests pass (registry + 12 region-shape checks).

- [ ] **Step 6: Commit**

```bash
git add lib/parts/hair-styles/
git commit -m "feat(parts): add hair-style bundle scaffold with 12 stubs"
```

---

## Task A9: Author the `classic` hair style

**Visual brief:** Reference `learn-faces/mc_skin_faces/` for examples. Classic style is short hair fully covering top/sides/back with a small forehead overlay. Aligns with today's default rendering.

**Files:**
- Modify: `lib/parts/hair-styles/classic.ts`
- Create: `lib/parts/hair-styles/classic.test.ts`

- [ ] **Step 1: Write failing assertion test for `classic`**

```ts
// lib/parts/hair-styles/classic.test.ts
import { describe, it, expect } from 'vitest'
import { classic } from './classic'

describe('classic hair', () => {
  it('head_top is mostly hair (>= 60 H/h cells)', () => {
    const count = classic.head_top.flat().filter((c) => c === 'H' || c === 'h').length
    expect(count).toBeGreaterThanOrEqual(60)
  })
  it('head_back is mostly hair (>= 50 H/h cells)', () => {
    const count = classic.head_back.flat().filter((c) => c === 'H' || c === 'h').length
    expect(count).toBeGreaterThanOrEqual(50)
  })
  it('head_bottom is mostly skin (S)', () => {
    const count = classic.head_bottom.flat().filter((c) => c === 'S').length
    expect(count).toBeGreaterThanOrEqual(40)
  })
  it('head_front_overlay covers forehead row 1', () => {
    const row1HairCount = classic.head_front_overlay[1].filter((c) => c === 'H' || c === 'h').length
    expect(row1HairCount).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run lib/parts/hair-styles/classic.test.ts`
Expected: FAIL (stub returns transparent everywhere).

- [ ] **Step 3: Author the actual `classic` masks**

Edit `lib/parts/hair-styles/classic.ts` and replace the EMPTY stubs with hand-authored 8×8 masks per region following the visual brief. Use `H` for primary hair, `h` for accent/lighter hair, `S` for skin, `.` for transparent. The dimension tests from A8 still pass automatically.

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/hair-styles/classic.test.ts lib/parts/hair-styles/hair-styles.test.ts`
Expected: 4 + 13 = 17 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parts/hair-styles/classic.ts lib/parts/hair-styles/classic.test.ts
git commit -m "feat(parts): author classic hair style masks"
```

---

## Tasks A10–A20: Author remaining 11 hair styles

For each of `bangs`, `side_part`, `mohawk`, `fluffy`, `curtain`, `bald`, `bun`, `ponytail`, `spiky`, `undercut`, `dreads`, follow the exact 5-step pattern from Task A9:

1. Write a test file `lib/parts/hair-styles/<name>.test.ts` with assertions appropriate to that style (e.g., `mohawk` should have hair only in center columns; `bald` should be mostly skin S in head_top).
2. Verify it fails.
3. Author the masks in `lib/parts/hair-styles/<name>.ts` replacing EMPTY stubs.
4. Run tests, verify pass.
5. Commit: `git add lib/parts/hair-styles/<name>.* && git commit -m "feat(parts): author <name> hair style masks"`

**Per-style visual briefs:**

| Style | Brief |
|---|---|
| `bangs`     | Drooping hair over forehead; head_front_overlay rows 1-2 fully hair |
| `side_part` | Asymmetric: head_top biased to one side; partial forehead overlay |
| `mohawk`    | Hair only in center 2 cols of head_top/back; head_right/left mostly skin |
| `fluffy`    | Irregular wisps; hat layer has scattered H pixels for volume |
| `curtain`   | Long bangs; head_front_overlay covers cols 0-1 and 6-7 of rows 1-5 |
| `bald`      | head_top/back/right/left all S (skin); no hat overlay |
| `bun`       | hat_top has a 2×2 block of H in center for the bun; rest similar to classic |
| `ponytail`  | hat_back has long H column extending down; head similar to classic |
| `spiky`     | hat_top has sparse spikes (1-pixel H columns); jagged top edge |
| `undercut`  | head_top H but head_right/left lower rows are S (shaved sides) |
| `dreads`    | hat_back, hat_right, hat_left have vertical H stripes simulating dreads |

---

## Task A21: Hair-length modifiers (4)

Hair length is a modifier applied AFTER the hair style is painted — it extends or trims hat-layer hair. Implement as a function rather than a mask bundle.

**Files:**
- Create: `lib/parts/hair-lengths/types.ts`
- Create: `lib/parts/hair-lengths/index.ts`
- Create: `lib/parts/hair-lengths/hair-lengths.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/hair-lengths/hair-lengths.test.ts
import { describe, it, expect } from 'vitest'
import { hairLengths } from './index'

const NAMES = ['short', 'medium', 'long', 'very_long'] as const

describe('hair length modifiers', () => {
  it('registers 4 length modifiers', () => {
    expect(hairLengths.names().sort()).toEqual([...NAMES].sort())
  })

  it('short trims the back/length rows', () => {
    const bundle = {
      hat_back: Array(8).fill(null).map(() => Array(8).fill('H')),
    }
    const mod = hairLengths.get('short')
    const out = mod(bundle as any)
    // short empties hat_back rows 4-7 (lower portion)
    expect(out.hat_back[7].every((c: string) => c === '.')).toBe(true)
  })

  it('very_long fills hat_back fully', () => {
    const bundle = {
      hat_back: Array(8).fill(null).map(() => Array(8).fill('.')),
    }
    const mod = hairLengths.get('very_long')
    const out = mod(bundle as any)
    const filledRows = out.hat_back.filter((row: string[]) => row.some((c) => c === 'H')).length
    expect(filledRows).toBeGreaterThanOrEqual(6)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/parts/hair-lengths/hair-lengths.test.ts` → FAIL.

- [ ] **Step 3: Implement modifiers**

```ts
// lib/parts/hair-lengths/types.ts
import type { HairStyleBundle } from '../hair-styles/types'
export type LengthModifier = (bundle: HairStyleBundle) => HairStyleBundle
```

```ts
// lib/parts/hair-lengths/short.ts
import type { HairStyleBundle } from '../hair-styles/types'
import type { LengthModifier } from './types'

export const short: LengthModifier = (b) => ({
  ...b,
  hat_back: b.hat_back.map((row, i) => i >= 4 ? row.map(() => '.' as const) : row),
})
```

```ts
// lib/parts/hair-lengths/medium.ts
import type { LengthModifier } from './types'
export const medium: LengthModifier = (b) => b  // identity — bundle is already medium length
```

```ts
// lib/parts/hair-lengths/long.ts
import type { LengthModifier } from './types'

export const long: LengthModifier = (b) => ({
  ...b,
  hat_back: b.hat_back.map((row) => row.map((c) => c === '.' ? 'H' : c)),
})
```

```ts
// lib/parts/hair-lengths/very_long.ts
import type { LengthModifier } from './types'

export const very_long: LengthModifier = (b) => ({
  ...b,
  hat_back: b.hat_back.map((row) => row.map((c) => c === '.' ? 'H' : c)),
  hat_right: b.hat_right.map((row, i) =>
    i >= 4 ? row.map((c, j) => (j === 0 ? 'H' : c)) : row
  ),
  hat_left: b.hat_left.map((row, i) =>
    i >= 4 ? row.map((c, j) => (j === 7 ? 'H' : c)) : row
  ),
})
```

```ts
// lib/parts/hair-lengths/index.ts
import { createRegistry } from '../registry'
import { short } from './short'
import { medium } from './medium'
import { long } from './long'
import { very_long } from './very_long'

export const hairLengths = createRegistry({ short, medium, long, very_long })
export type HairLength = ReturnType<typeof hairLengths.names>[number]
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/hair-lengths/hair-lengths.test.ts`
Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parts/hair-lengths/
git commit -m "feat(parts): add 4 hair length modifier functions"
```

---

## Task A22: Ear-template bundle type, registry, and scaffold

Ears paint onto hat-layer regions and may cut from head_right/head_left. Bundle type captures both directions.

**Files:**
- Create: `lib/parts/ears/types.ts`
- Create: `lib/parts/ears/index.ts`
- Create: `lib/parts/ears/ears.test.ts`
- Create: `lib/parts/ears/{none,round,pointy,cat,fox,bunny,wolf,elf}.ts` (stubs)

- [ ] **Step 1: Write failing test**

```ts
// lib/parts/ears/ears.test.ts
import { describe, it, expect } from 'vitest'
import { ears } from './index'

const NAMES = ['none', 'round', 'pointy', 'cat', 'fox', 'bunny', 'wolf', 'elf'] as const

describe('ear templates', () => {
  it('registers all 8 templates', () => {
    expect(ears.names().sort()).toEqual([...NAMES].sort())
  })
  for (const name of NAMES) {
    it(`${name} has 8×8 hat_right and hat_left masks`, () => {
      const b = ears.get(name)
      expect(b.hat_right.length).toBe(8)
      expect(b.hat_left.length).toBe(8)
      expect(b.hat_top.length).toBe(8)
    })
  }
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/parts/ears/ears.test.ts` → FAIL.

- [ ] **Step 3: Implement type + scaffold**

```ts
// lib/parts/ears/types.ts
import type { PartMask } from '../types'

export interface EarBundle {
  hat_top: PartMask
  hat_right: PartMask
  hat_left: PartMask
  head_right_cutout?: PartMask  // optional: pixels to replace in head_right (use `.` to leave alone, `S` to expose skin)
  head_left_cutout?: PartMask
}
```

Create 8 stub files (all-`.` masks) and `index.ts`:

```ts
// lib/parts/ears/index.ts
import { createRegistry } from '../registry'
import { none } from './none'
import { round } from './round'
import { pointy } from './pointy'
import { cat } from './cat'
import { fox } from './fox'
import { bunny } from './bunny'
import { wolf } from './wolf'
import { elf } from './elf'

export const ears = createRegistry({ none, round, pointy, cat, fox, bunny, wolf, elf })
export type EarTemplate = ReturnType<typeof ears.names>[number]
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/parts/ears/ears.test.ts`
Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parts/ears/
git commit -m "feat(parts): add ear bundle scaffold with 8 stubs"
```

---

## Tasks A23–A30: Author 8 ear templates

For each of `none`, `round`, `pointy`, `cat`, `fox`, `bunny`, `wolf`, `elf`, follow the 5-step pattern:

1. Write test asserting expected H-pixel count in hat_top and/or hat_right.
2. Verify fail.
3. Author the masks per the brief below.
4. Run tests, verify pass.
5. Commit: `git add lib/parts/ears/<name>.* && git commit -m "feat(parts): author <name> ear template"`

**Per-template briefs (reference `learn-faces/mc_skin_faces/` and existing `lib/ear-templates.ts`):**

| Template | Brief |
|---|---|
| `none`    | All transparent — no ears painted |
| `round`   | Small rounded ear bumps in hat_right cols 0-1 row 3, hat_left cols 6-7 row 3 |
| `pointy`  | Same as round but with one extra pixel R at hat_top corners for points |
| `cat`     | Triangular ears on hat_top corners (rows 5-7 cols 0-2 and 5-7); inner `I` color |
| `fox`     | Larger triangles than cat, extending further down hat_right/left; tipped with `R` |
| `bunny`   | Tall vertical ears in hat_top cols 2-3 and 4-5 reaching row 0; `I` inner |
| `wolf`    | Asymmetric pointed ears tilted forward; hat_top + hat_front edge |
| `elf`     | Elongated pointed ears extending into head_right_cutout / head_left_cutout (replace skin with R pixels along the diagonal) |

---

## Task A31: Face composer

Layers the parametric face parts onto a buffer for `head_front`.

**Files:**
- Create: `lib/rendering/face-composer.ts`
- Create: `lib/rendering/face-composer.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/rendering/face-composer.test.ts
import { describe, it, expect } from 'vitest'
import { composeFace, type FaceComposerInput } from './face-composer'

describe('composeFace', () => {
  it('returns an 8×8 RGBA buffer (256 bytes)', () => {
    const input: FaceComposerInput = {
      skin_tone: '#C4956A',
      eye_shape: 'round',
      eye_color: '#1E3A7A',
      eye_white: '#F0EFEB',
      brows: 'flat',
      mouth: 'smile',
      mouth_color: '#8B5040',
      nose: 'dot',
      nose_shadow: '#A07050',
      hair_color: '#3B2507',
      hair_accent_color: '#5A3D14',
      hair_style: 'classic',
    }
    const buf = composeFace(input)
    expect(buf.length).toBe(8 * 8 * 4)
  })

  it('row 4 has eye_white pixels for round eyes', () => {
    const input: FaceComposerInput = {
      skin_tone: '#C4956A',
      eye_shape: 'round',
      eye_color: '#1E3A7A',
      eye_white: '#F0EFEB',
      brows: 'none', mouth: 'none', nose: 'none',
      mouth_color: '#000000', nose_shadow: '#000000',
      hair_color: '#3B2507', hair_accent_color: '#5A3D14',
      hair_style: 'classic',
    }
    const buf = composeFace(input)
    // sample pixel at row 4 col 1: should be eye_white #F0EFEB
    const idx = (4 * 8 + 1) * 4
    expect(buf[idx]).toBe(0xF0)
    expect(buf[idx + 1]).toBe(0xEF)
    expect(buf[idx + 2]).toBe(0xEB)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/rendering/face-composer.test.ts` → FAIL.

- [ ] **Step 3: Implement face-composer.ts**

```ts
// lib/rendering/face-composer.ts
import { eyes, type EyeShape } from '@/lib/parts/eyes/index'
import { mouths, type MouthShape } from '@/lib/parts/mouths/index'
import { brows, type BrowShape } from '@/lib/parts/brows/index'
import { noses, type NoseShape } from '@/lib/parts/noses/index'
import { hairStyles, type HairStyle } from '@/lib/parts/hair-styles/index'
import type { Px, PartMask } from '@/lib/parts/types'

export interface FaceComposerInput {
  skin_tone: string         // hex
  eye_shape: EyeShape
  eye_color: string         // hex
  eye_white: string         // hex
  brows: BrowShape
  mouth: MouthShape
  mouth_color: string       // hex
  nose: NoseShape
  nose_shadow: string       // hex
  hair_color: string        // hex
  hair_accent_color: string // hex
  hair_style: HairStyle
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) throw new Error(`Bad hex: ${hex}`)
  return [
    parseInt(m[1].slice(0, 2), 16),
    parseInt(m[1].slice(2, 4), 16),
    parseInt(m[1].slice(4, 6), 16),
  ]
}

function pxColor(px: Px, ctx: FaceComposerInput): [number, number, number] | null {
  switch (px) {
    case 'S': return parseHex(ctx.skin_tone)
    case 'W': return parseHex(ctx.eye_white)
    case 'E': return parseHex(ctx.eye_color)
    case 'M': return parseHex(ctx.mouth_color)
    case 'N': return parseHex(ctx.nose_shadow)
    case 'H': return parseHex(ctx.hair_color)
    case 'h': return parseHex(ctx.hair_accent_color)
    case 'I': return null  // inner ear N/A on face
    case 'R': return null  // outer ear N/A on face
    case '.': return null
  }
}

function paintLayer(buf: Buffer, mask: PartMask, ctx: FaceComposerInput) {
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rgb = pxColor(mask[row][col], ctx)
      if (!rgb) continue
      const idx = (row * 8 + col) * 4
      buf[idx] = rgb[0]
      buf[idx + 1] = rgb[1]
      buf[idx + 2] = rgb[2]
      buf[idx + 3] = 255
    }
  }
}

export function composeFace(input: FaceComposerInput): Buffer {
  const buf = Buffer.alloc(8 * 8 * 4, 0)
  // 1. Base skin
  const skin = parseHex(input.skin_tone)
  for (let i = 0; i < 8 * 8; i++) {
    buf[i * 4] = skin[0]
    buf[i * 4 + 1] = skin[1]
    buf[i * 4 + 2] = skin[2]
    buf[i * 4 + 3] = 255
  }
  // 2. Brows
  paintLayer(buf, brows.get(input.brows), input)
  // 3. Eyes
  paintLayer(buf, eyes.get(input.eye_shape), input)
  // 4. Nose
  paintLayer(buf, noses.get(input.nose), input)
  // 5. Mouth
  paintLayer(buf, mouths.get(input.mouth), input)
  // 6. Hair front overlay
  paintLayer(buf, hairStyles.get(input.hair_style).head_front_overlay, input)
  return buf
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/rendering/face-composer.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rendering/face-composer.ts lib/rendering/face-composer.test.ts
git commit -m "feat(rendering): add parametric face composer"
```

---

## Task A32: Hair composer

Applies a hair-style bundle (modified by hair-length) to all 6 head regions and 5 hat regions.

**Files:**
- Create: `lib/rendering/hair-composer.ts`
- Create: `lib/rendering/hair-composer.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/rendering/hair-composer.test.ts
import { describe, it, expect } from 'vitest'
import { composeHair, type HairComposerInput } from './hair-composer'

describe('composeHair', () => {
  it('returns buffers for all 6 head regions and 5 hat regions', () => {
    const input: HairComposerInput = {
      hair_style: 'classic',
      hair_length: 'medium',
      hair_color: '#3B2507',
      hair_accent_color: '#5A3D14',
      skin_tone: '#C4956A',
    }
    const out = composeHair(input)
    expect(Object.keys(out).sort()).toEqual([
      'hat_back','hat_front','hat_left','hat_right','hat_top',
      'head_back','head_bottom','head_front_overlay','head_left','head_right','head_top',
    ])
    for (const buf of Object.values(out)) {
      expect((buf as Buffer).length).toBe(8 * 8 * 4)
    }
  })

  it('bald style produces head_top mostly skin tone', () => {
    const input: HairComposerInput = {
      hair_style: 'bald',
      hair_length: 'short',
      hair_color: '#3B2507',
      hair_accent_color: '#5A3D14',
      skin_tone: '#C4956A',
    }
    const out = composeHair(input)
    let skinPixels = 0
    for (let i = 0; i < 64; i++) {
      const idx = i * 4
      if (out.head_top[idx] === 0xC4 && out.head_top[idx + 1] === 0x95) skinPixels++
    }
    expect(skinPixels).toBeGreaterThan(30)
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/rendering/hair-composer.test.ts` → FAIL.

- [ ] **Step 3: Implement hair-composer.ts**

```ts
// lib/rendering/hair-composer.ts
import { hairStyles, type HairStyle } from '@/lib/parts/hair-styles/index'
import { hairLengths, type HairLength } from '@/lib/parts/hair-lengths/index'
import type { Px, PartMask } from '@/lib/parts/types'

export interface HairComposerInput {
  hair_style: HairStyle
  hair_length: HairLength
  hair_color: string         // hex
  hair_accent_color: string  // hex
  skin_tone: string          // hex
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) throw new Error(`Bad hex: ${hex}`)
  return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)]
}

function pxColor(px: Px, input: HairComposerInput): [number, number, number] | null {
  switch (px) {
    case 'S': return parseHex(input.skin_tone)
    case 'H': return parseHex(input.hair_color)
    case 'h': return parseHex(input.hair_accent_color)
    case '.': return null
    default: return null  // E/W/M/N/I/R not used in hair layers
  }
}

function maskToBuffer(mask: PartMask, input: HairComposerInput): Buffer {
  const buf = Buffer.alloc(8 * 8 * 4, 0)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rgb = pxColor(mask[row][col], input)
      if (!rgb) continue
      const idx = (row * 8 + col) * 4
      buf[idx] = rgb[0]; buf[idx+1] = rgb[1]; buf[idx+2] = rgb[2]; buf[idx+3] = 255
    }
  }
  return buf
}

export type HairOutput = {
  head_top: Buffer
  head_right: Buffer
  head_left: Buffer
  head_back: Buffer
  head_bottom: Buffer
  head_front_overlay: Buffer
  hat_front: Buffer
  hat_top: Buffer
  hat_right: Buffer
  hat_left: Buffer
  hat_back: Buffer
}

export function composeHair(input: HairComposerInput): HairOutput {
  const baseBundle = hairStyles.get(input.hair_style)
  const bundle = hairLengths.get(input.hair_length)(baseBundle)
  return {
    head_top:           maskToBuffer(bundle.head_top, input),
    head_right:         maskToBuffer(bundle.head_right, input),
    head_left:          maskToBuffer(bundle.head_left, input),
    head_back:          maskToBuffer(bundle.head_back, input),
    head_bottom:        maskToBuffer(bundle.head_bottom, input),
    head_front_overlay: maskToBuffer(bundle.head_front_overlay, input),
    hat_front:          maskToBuffer(bundle.hat_front, input),
    hat_top:            maskToBuffer(bundle.hat_top, input),
    hat_right:          maskToBuffer(bundle.hat_right, input),
    hat_left:           maskToBuffer(bundle.hat_left, input),
    hat_back:           maskToBuffer(bundle.hat_back, input),
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/rendering/hair-composer.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rendering/hair-composer.ts lib/rendering/hair-composer.test.ts
git commit -m "feat(rendering): add parametric hair composer"
```

---

## Task A33: Ear composer

**Files:**
- Create: `lib/rendering/ear-composer.ts`
- Create: `lib/rendering/ear-composer.test.ts`

- [ ] **Step 1: Write failing test**

```ts
// lib/rendering/ear-composer.test.ts
import { describe, it, expect } from 'vitest'
import { composeEars, type EarComposerInput } from './ear-composer'

describe('composeEars', () => {
  it('returns buffers for hat_top, hat_right, hat_left and optional cutouts', () => {
    const input: EarComposerInput = {
      ear_template: 'cat',
      ear_color: '#3B2507',
      inner_ear_color: '#FFB8CC',
      skin_tone: '#C4956A',
    }
    const out = composeEars(input)
    expect(out.hat_top.length).toBe(8 * 8 * 4)
    expect(out.hat_right.length).toBe(8 * 8 * 4)
    expect(out.hat_left.length).toBe(8 * 8 * 4)
  })

  it('none template returns transparent buffers', () => {
    const out = composeEars({
      ear_template: 'none',
      ear_color: '#3B2507',
      inner_ear_color: '#FFB8CC',
      skin_tone: '#C4956A',
    })
    // alpha bytes should all be 0
    for (let i = 3; i < out.hat_top.length; i += 4) {
      expect(out.hat_top[i]).toBe(0)
    }
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/rendering/ear-composer.test.ts` → FAIL.

- [ ] **Step 3: Implement ear-composer.ts**

```ts
// lib/rendering/ear-composer.ts
import { ears, type EarTemplate } from '@/lib/parts/ears/index'
import type { Px, PartMask } from '@/lib/parts/types'

export interface EarComposerInput {
  ear_template: EarTemplate
  ear_color: string
  inner_ear_color: string
  skin_tone: string
}

function parseHex(hex: string): [number, number, number] {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) throw new Error(`Bad hex: ${hex}`)
  return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)]
}

function pxColor(px: Px, input: EarComposerInput): [number, number, number] | null {
  switch (px) {
    case 'R': return parseHex(input.ear_color)
    case 'I': return parseHex(input.inner_ear_color)
    case 'S': return parseHex(input.skin_tone)
    default: return null
  }
}

function maskToBuffer(mask: PartMask | undefined, input: EarComposerInput): Buffer {
  const buf = Buffer.alloc(8 * 8 * 4, 0)
  if (!mask) return buf
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const rgb = pxColor(mask[row][col], input)
      if (!rgb) continue
      const idx = (row * 8 + col) * 4
      buf[idx] = rgb[0]; buf[idx+1] = rgb[1]; buf[idx+2] = rgb[2]; buf[idx+3] = 255
    }
  }
  return buf
}

export interface EarOutput {
  hat_top: Buffer
  hat_right: Buffer
  hat_left: Buffer
  head_right_cutout?: Buffer
  head_left_cutout?: Buffer
}

export function composeEars(input: EarComposerInput): EarOutput {
  const bundle = ears.get(input.ear_template)
  return {
    hat_top: maskToBuffer(bundle.hat_top, input),
    hat_right: maskToBuffer(bundle.hat_right, input),
    hat_left: maskToBuffer(bundle.hat_left, input),
    head_right_cutout: bundle.head_right_cutout ? maskToBuffer(bundle.head_right_cutout, input) : undefined,
    head_left_cutout: bundle.head_left_cutout ? maskToBuffer(bundle.head_left_cutout, input) : undefined,
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/rendering/ear-composer.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/rendering/ear-composer.ts lib/rendering/ear-composer.test.ts
git commit -m "feat(rendering): add parametric ear composer"
```

---

## Task A34: Move legacy renderer

Preserve the existing builder + face/ear templates so old skins render unchanged.

**Files:**
- Move: `lib/skin-builder.ts` → `lib/legacy/skin-builder.ts`
- Move: `lib/face-templates.ts` → `lib/legacy/face-templates.ts`
- Move: `lib/ear-templates.ts` → `lib/legacy/ear-templates.ts`
- Move: `lib/skin-regions.ts` → `lib/legacy/skin-regions.ts` (also used by new code — duplicate later if needed)
- Move: `lib/region-color-map.ts` → `lib/legacy/region-color-map.ts`
- Modify: imports in `lib/gemini.ts`, `app/api/generate/route.ts`

- [ ] **Step 1: Move files**

```bash
mkdir -p lib/legacy
git mv lib/skin-builder.ts lib/legacy/skin-builder.ts
git mv lib/face-templates.ts lib/legacy/face-templates.ts
git mv lib/ear-templates.ts lib/legacy/ear-templates.ts
git mv lib/region-color-map.ts lib/legacy/region-color-map.ts
cp lib/skin-regions.ts lib/legacy/skin-regions.ts   # kept in both locations for now
```

- [ ] **Step 2: Update imports in `lib/gemini.ts`**

Edit `lib/gemini.ts` lines 1–3:

```ts
// before
import { regionColorMapSchema, type RegionColorMap } from './region-color-map'
import { INNER_REGION_NAMES, OUTER_REGION_NAMES } from './skin-regions'

// after
import { regionColorMapSchema, type RegionColorMap } from './legacy/region-color-map'
import { INNER_REGION_NAMES, OUTER_REGION_NAMES } from './legacy/skin-regions'
```

- [ ] **Step 3: Update imports in `app/api/generate/route.ts`**

Edit `app/api/generate/route.ts` lines 4–5:

```ts
// before
import { generateRegionColorMap } from '@/lib/gemini'
import { buildSkinPng, validateSkin } from '@/lib/skin-builder'

// after
import { generateRegionColorMap } from '@/lib/gemini'
import { buildSkinPng, validateSkin } from '@/lib/legacy/skin-builder'
```

- [ ] **Step 4: Run full test + lint**

Run: `npm test && npm run lint`
Expected: All existing tests pass (legacy code is unchanged). No lint errors.

- [ ] **Step 5: Commit**

```bash
git add lib/ app/api/generate/route.ts
git commit -m "refactor: move v1 renderer to lib/legacy/ ahead of v2"
```

---

## Task A35: New v2 builder orchestrator (skin-builder-v2.ts)

The new builder accepts `SkinIntent` + `SkinPixels` shapes (typed locally for now — Plan B introduces the canonical schemas) and produces a 64×64 PNG. Uses parametric composers, soft snap, and L/R mirror.

**Files:**
- Create: `lib/skin-builder-v2.ts`
- Create: `lib/skin-builder-v2.test.ts`
- Create: `lib/rendering/regions.ts` (UV region coordinates — copy from `lib/legacy/skin-regions.ts` with the body region names used by SkinPixels)

- [ ] **Step 1: Write failing test**

```ts
// lib/skin-builder-v2.test.ts
import { describe, it, expect } from 'vitest'
import { buildSkinPngV2 } from './skin-builder-v2'
import sharp from 'sharp'

const TEST_INTENT = {
  version: 1 as const,
  seed: 1,
  style: 'retro' as const,
  palette: ['#1C3D73', '#2A5099', '#6B4A20'] as [string, string, string],
  palette_mode: 'soft' as const,
  character: {
    skin_tone: '#C4956A',
    eye_shape: 'round' as const,
    eye_color: '#1E3A7A',
    eye_white: '#F0EFEB',
    brows: 'flat' as const,
    mouth: 'smile' as const,
    mouth_color: '#8B5040',
    nose: 'dot' as const,
    nose_shadow: '#A07050',
    hair_style: 'classic' as const,
    hair_length: 'medium' as const,
    hair_color: '#3B2507',
    hair_accent_color: '#5A3D14',
    ear_template: 'none' as const,
    ear_color: '#3B2507',
    inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'blue tunic', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

const TEST_PIXELS = {
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

describe('buildSkinPngV2', () => {
  it('produces a 64×64 PNG', async () => {
    const buf = await buildSkinPngV2(TEST_INTENT, TEST_PIXELS)
    const meta = await sharp(buf).metadata()
    expect(meta.width).toBe(64)
    expect(meta.height).toBe(64)
    expect(meta.format).toBe('png')
  })

  it('mirrors arm_front identically to right and left arm regions', async () => {
    const buf = await buildSkinPngV2(TEST_INTENT, TEST_PIXELS)
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true })
    // right_arm_front and left_arm_front pixels at same row should match (post-mirror)
    // Sample pixel: right_arm_front top-left (UV col 44, row 20) and left_arm_front top-right (UV col 39, row 20)
    const idxR = (20 * info.width + 44) * info.channels
    const idxL = (20 * info.width + 39) * info.channels
    expect(data[idxR]).toBe(data[idxL])
    expect(data[idxR + 1]).toBe(data[idxL + 1])
    expect(data[idxR + 2]).toBe(data[idxL + 2])
  })
})
```

- [ ] **Step 2: Verify fail**

Run: `npx vitest run lib/skin-builder-v2.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement skin-builder-v2.ts**

```ts
// lib/skin-builder-v2.ts
import sharp from 'sharp'
import { composeFace } from './rendering/face-composer'
import { composeHair } from './rendering/hair-composer'
import { composeEars } from './rendering/ear-composer'
import { softSnap, type RGB, DEFAULT_SNAP_THRESHOLD } from './rendering/palette-snap'
import { mirrorHorizontal } from './rendering/mirror'
import type { EyeShape } from './parts/eyes/index'
import type { MouthShape } from './parts/mouths/index'
import type { BrowShape } from './parts/brows/index'
import type { NoseShape } from './parts/noses/index'
import type { HairStyle } from './parts/hair-styles/index'
import type { HairLength } from './parts/hair-lengths/index'
import type { EarTemplate } from './parts/ears/index'

const W = 64
const H = 64
const C = 4

// Local types — Plan B introduces canonical SkinIntent + SkinPixels schemas
export interface SkinIntent {
  version: 1
  seed: number
  style: string
  palette: string[]
  palette_mode: 'soft' | 'hard'
  character: {
    skin_tone: string
    eye_shape: EyeShape
    eye_color: string
    eye_white: string
    brows: BrowShape
    mouth: MouthShape
    mouth_color: string
    nose: NoseShape
    nose_shadow: string
    hair_style: HairStyle
    hair_length: HairLength
    hair_color: string
    hair_accent_color: string
    ear_template: EarTemplate
    ear_color: string
    inner_ear_color: string
  }
  outfit: { torso: string; arms: string; legs: string; jacket?: string; sleeves?: string; pants_outer?: string; accessories?: string }
  refinement_history: unknown[]
}

export interface SkinPixels {
  torso_front: string[][]
  torso_back: string[][]
  torso_side: string[][]
  arm_front: string[][]
  arm_side: string[][]
  arm_back: string[][]
  leg_front: string[][]
  leg_side: string[][]
  leg_back: string[][]
  jacket_front?: string[][]
  jacket_back?: string[][]
  jacket_side?: string[][]
  sleeve_front?: string[][]
  pants_outer_front?: string[][]
}

interface Region { x: number; y: number; w: number; h: number }

// UV coordinates per the Minecraft Java skin layout
const R = {
  head_top:    { x: 8,  y: 0,  w: 8, h: 8 },
  head_bottom: { x: 16, y: 0,  w: 8, h: 8 },
  head_right:  { x: 0,  y: 8,  w: 8, h: 8 },
  head_front:  { x: 8,  y: 8,  w: 8, h: 8 },
  head_left:   { x: 16, y: 8,  w: 8, h: 8 },
  head_back:   { x: 24, y: 8,  w: 8, h: 8 },
  hat_top:     { x: 40, y: 0,  w: 8, h: 8 },
  hat_bottom:  { x: 48, y: 0,  w: 8, h: 8 },
  hat_right:   { x: 32, y: 8,  w: 8, h: 8 },
  hat_front:   { x: 40, y: 8,  w: 8, h: 8 },
  hat_left:    { x: 48, y: 8,  w: 8, h: 8 },
  hat_back:    { x: 56, y: 8,  w: 8, h: 8 },
  torso_front: { x: 20, y: 20, w: 8, h: 12 },
  torso_right: { x: 16, y: 20, w: 4, h: 12 },
  torso_left:  { x: 28, y: 20, w: 4, h: 12 },
  torso_back:  { x: 32, y: 20, w: 8, h: 12 },
  right_arm_front: { x: 44, y: 20, w: 4, h: 12 },
  right_arm_right: { x: 40, y: 20, w: 4, h: 12 },
  right_arm_left:  { x: 48, y: 20, w: 4, h: 12 },
  right_arm_back:  { x: 52, y: 20, w: 4, h: 12 },
  left_arm_front:  { x: 36, y: 52, w: 4, h: 12 },
  left_arm_right:  { x: 32, y: 52, w: 4, h: 12 },
  left_arm_left:   { x: 40, y: 52, w: 4, h: 12 },
  left_arm_back:   { x: 44, y: 52, w: 4, h: 12 },
  right_leg_front: { x: 4,  y: 20, w: 4, h: 12 },
  right_leg_right: { x: 0,  y: 20, w: 4, h: 12 },
  right_leg_left:  { x: 8,  y: 20, w: 4, h: 12 },
  right_leg_back:  { x: 12, y: 20, w: 4, h: 12 },
  left_leg_front:  { x: 20, y: 52, w: 4, h: 12 },
  left_leg_right:  { x: 16, y: 52, w: 4, h: 12 },
  left_leg_left:   { x: 24, y: 52, w: 4, h: 12 },
  left_leg_back:   { x: 28, y: 52, w: 4, h: 12 },
}

function parseHex(hex: string): RGB | null {
  const m = hex.match(/^#?([0-9A-Fa-f]{6})$/)
  if (!m) return null
  return [parseInt(m[1].slice(0,2),16), parseInt(m[1].slice(2,4),16), parseInt(m[1].slice(4,6),16)]
}

function writePixel(buf: Buffer, x: number, y: number, rgb: RGB) {
  const idx = (y * W + x) * C
  buf[idx] = rgb[0]; buf[idx+1] = rgb[1]; buf[idx+2] = rgb[2]; buf[idx+3] = 255
}

function blitRegion(buf: Buffer, region: Region, src: Buffer) {
  // src is region.w × region.h RGBA
  for (let row = 0; row < region.h; row++) {
    for (let col = 0; col < region.w; col++) {
      const sIdx = (row * region.w + col) * 4
      if (src[sIdx + 3] === 0) continue  // skip transparent source pixels
      writePixel(buf, region.x + col, region.y + row, [src[sIdx], src[sIdx+1], src[sIdx+2]])
    }
  }
}

function paintHexGrid(buf: Buffer, region: Region, grid: string[][], palette: RGB[], threshold: number) {
  for (let row = 0; row < region.h && row < grid.length; row++) {
    for (let col = 0; col < region.w && col < grid[row].length; col++) {
      const hex = grid[row][col]
      if (!hex || hex === '') continue
      const rgb = parseHex(hex)
      if (!rgb) continue
      const snapped = softSnap(rgb, palette, threshold)
      writePixel(buf, region.x + col, region.y + row, snapped)
    }
  }
}

export async function buildSkinPngV2(intent: SkinIntent, pixels: SkinPixels): Promise<Buffer> {
  const buf = Buffer.alloc(W * H * C, 0)
  const palette: RGB[] = intent.palette.map(parseHex).filter((p): p is RGB => p !== null)
  const threshold = intent.palette_mode === 'hard' ? 0 : DEFAULT_SNAP_THRESHOLD

  // 1. Parametric face → head_front
  const face = composeFace({
    skin_tone: intent.character.skin_tone,
    eye_shape: intent.character.eye_shape,
    eye_color: intent.character.eye_color,
    eye_white: intent.character.eye_white,
    brows: intent.character.brows,
    mouth: intent.character.mouth,
    mouth_color: intent.character.mouth_color,
    nose: intent.character.nose,
    nose_shadow: intent.character.nose_shadow,
    hair_color: intent.character.hair_color,
    hair_accent_color: intent.character.hair_accent_color,
    hair_style: intent.character.hair_style,
  })
  blitRegion(buf, R.head_front, face)

  // 2. Parametric hair → other head regions + hat layers
  const hair = composeHair({
    hair_style: intent.character.hair_style,
    hair_length: intent.character.hair_length,
    hair_color: intent.character.hair_color,
    hair_accent_color: intent.character.hair_accent_color,
    skin_tone: intent.character.skin_tone,
  })
  blitRegion(buf, R.head_top, hair.head_top)
  blitRegion(buf, R.head_right, hair.head_right)
  blitRegion(buf, R.head_left, hair.head_left)
  blitRegion(buf, R.head_back, hair.head_back)
  blitRegion(buf, R.head_bottom, hair.head_bottom)
  blitRegion(buf, R.hat_front, hair.hat_front)
  blitRegion(buf, R.hat_top, hair.hat_top)
  blitRegion(buf, R.hat_right, hair.hat_right)
  blitRegion(buf, R.hat_left, hair.hat_left)
  blitRegion(buf, R.hat_back, hair.hat_back)

  // 3. Ears overlay
  const ears = composeEars({
    ear_template: intent.character.ear_template,
    ear_color: intent.character.ear_color,
    inner_ear_color: intent.character.inner_ear_color,
    skin_tone: intent.character.skin_tone,
  })
  blitRegion(buf, R.hat_top, ears.hat_top)
  blitRegion(buf, R.hat_right, ears.hat_right)
  blitRegion(buf, R.hat_left, ears.hat_left)
  if (ears.head_right_cutout) blitRegion(buf, R.head_right, ears.head_right_cutout)
  if (ears.head_left_cutout) blitRegion(buf, R.head_left, ears.head_left_cutout)

  // 4. Body regions (palette-snapped)
  paintHexGrid(buf, R.torso_front, pixels.torso_front, palette, threshold)
  paintHexGrid(buf, R.torso_back, pixels.torso_back, palette, threshold)
  paintHexGrid(buf, R.torso_right, pixels.torso_side, palette, threshold)
  paintHexGrid(buf, R.torso_left, mirrorHorizontal(pixels.torso_side), palette, threshold)

  paintHexGrid(buf, R.right_arm_front, pixels.arm_front, palette, threshold)
  paintHexGrid(buf, R.left_arm_front, mirrorHorizontal(pixels.arm_front), palette, threshold)
  paintHexGrid(buf, R.right_arm_right, pixels.arm_side, palette, threshold)
  paintHexGrid(buf, R.left_arm_left, mirrorHorizontal(pixels.arm_side), palette, threshold)
  paintHexGrid(buf, R.right_arm_back, pixels.arm_back, palette, threshold)
  paintHexGrid(buf, R.left_arm_back, mirrorHorizontal(pixels.arm_back), palette, threshold)

  paintHexGrid(buf, R.right_leg_front, pixels.leg_front, palette, threshold)
  paintHexGrid(buf, R.left_leg_front, mirrorHorizontal(pixels.leg_front), palette, threshold)
  paintHexGrid(buf, R.right_leg_right, pixels.leg_side, palette, threshold)
  paintHexGrid(buf, R.left_leg_left, mirrorHorizontal(pixels.leg_side), palette, threshold)
  paintHexGrid(buf, R.right_leg_back, pixels.leg_back, palette, threshold)
  paintHexGrid(buf, R.left_leg_back, mirrorHorizontal(pixels.leg_back), palette, threshold)

  // 5. Optional outer layers (jacket / sleeves / pants_outer) — paint over body regions
  if (pixels.jacket_front) paintHexGrid(buf, R.torso_front, pixels.jacket_front, palette, threshold)
  if (pixels.jacket_back)  paintHexGrid(buf, R.torso_back, pixels.jacket_back, palette, threshold)
  if (pixels.jacket_side) {
    paintHexGrid(buf, R.torso_right, pixels.jacket_side, palette, threshold)
    paintHexGrid(buf, R.torso_left, mirrorHorizontal(pixels.jacket_side), palette, threshold)
  }
  if (pixels.sleeve_front) {
    paintHexGrid(buf, R.right_arm_front, pixels.sleeve_front, palette, threshold)
    paintHexGrid(buf, R.left_arm_front, mirrorHorizontal(pixels.sleeve_front), palette, threshold)
  }
  if (pixels.pants_outer_front) {
    paintHexGrid(buf, R.right_leg_front, pixels.pants_outer_front, palette, threshold)
    paintHexGrid(buf, R.left_leg_front, mirrorHorizontal(pixels.pants_outer_front), palette, threshold)
  }

  return await sharp(buf, { raw: { width: W, height: H, channels: C } }).png().toBuffer()
}

export async function validateSkinV2(buffer: Buffer): Promise<boolean> {
  const m = await sharp(buffer).metadata()
  return m.width === W && m.height === H
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run lib/skin-builder-v2.test.ts`
Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/skin-builder-v2.ts lib/skin-builder-v2.test.ts
git commit -m "feat(rendering): add v2 builder orchestrator with parametric face/hair/ear + palette snap + mirror"
```

---

## Task A36: Golden image regression test

A snapshot test that locks the rendered output for a known intent + pixels fixture. Catches regressions when parts library changes.

**Files:**
- Create: `lib/__golden__/skin-builder-v2.golden.test.ts`
- Create: `lib/__golden__/fixtures/basic-skin.intent.json`
- Create: `lib/__golden__/fixtures/basic-skin.pixels.json`
- Create: `lib/__golden__/fixtures/basic-skin.png` (generated during step 4)

- [ ] **Step 1: Write the test**

```ts
// lib/__golden__/skin-builder-v2.golden.test.ts
import { describe, it, expect } from 'vitest'
import { buildSkinPngV2 } from '../skin-builder-v2'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const FIX = path.join(__dirname, 'fixtures')

describe('skin-builder-v2 golden', () => {
  it('basic-skin matches golden PNG byte-for-byte', async () => {
    const intent = JSON.parse(readFileSync(path.join(FIX, 'basic-skin.intent.json'), 'utf8'))
    const pixels = JSON.parse(readFileSync(path.join(FIX, 'basic-skin.pixels.json'), 'utf8'))
    const out = await buildSkinPngV2(intent, pixels)

    const goldenPath = path.join(FIX, 'basic-skin.png')
    if (!existsSync(goldenPath)) {
      throw new Error(`Golden missing — to seed: write the current output and commit:\n  cp <out> ${goldenPath}`)
    }
    const golden = readFileSync(goldenPath)
    expect(out.equals(golden)).toBe(true)
  })
})
```

- [ ] **Step 2: Create the intent + pixels fixtures**

```json
// lib/__golden__/fixtures/basic-skin.intent.json
{
  "version": 1,
  "seed": 42,
  "style": "retro",
  "palette": ["#1C3D73", "#2A5099", "#6B4A20", "#D4AA55", "#1A1428"],
  "palette_mode": "soft",
  "character": {
    "skin_tone": "#C4956A",
    "eye_shape": "round",
    "eye_color": "#1E3A7A",
    "eye_white": "#F0EFEB",
    "brows": "flat",
    "mouth": "smile",
    "mouth_color": "#8B5040",
    "nose": "dot",
    "nose_shadow": "#A07050",
    "hair_style": "classic",
    "hair_length": "medium",
    "hair_color": "#3B2507",
    "hair_accent_color": "#5A3D14",
    "ear_template": "none",
    "ear_color": "#3B2507",
    "inner_ear_color": "#FFB8CC"
  },
  "outfit": { "torso": "blue tunic", "arms": "blue sleeves", "legs": "dark trousers" },
  "refinement_history": []
}
```

For `basic-skin.pixels.json`, generate a simple 3-color hex grid for each required body region (use the same patterns as the existing test fixture in `lib/skin-builder-v2.test.ts`). Save as JSON.

- [ ] **Step 3: Seed the golden PNG**

Write a one-off seeder script (delete after use):

```ts
// scripts/seed-golden.ts (delete after running)
import { buildSkinPngV2 } from '../lib/skin-builder-v2'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'

const FIX = path.join(__dirname, '..', 'lib', '__golden__', 'fixtures')
const intent = JSON.parse(readFileSync(path.join(FIX, 'basic-skin.intent.json'), 'utf8'))
const pixels = JSON.parse(readFileSync(path.join(FIX, 'basic-skin.pixels.json'), 'utf8'))
buildSkinPngV2(intent, pixels).then((buf) => {
  writeFileSync(path.join(FIX, 'basic-skin.png'), buf)
  console.log('Golden seeded.')
})
```

Run: `npx tsx scripts/seed-golden.ts`
Then visually verify `lib/__golden__/fixtures/basic-skin.png` looks correct (open in image viewer). Adjust intent/pixels if needed and re-seed. Delete `scripts/seed-golden.ts` after.

- [ ] **Step 4: Run golden test**

Run: `npx vitest run lib/__golden__/skin-builder-v2.golden.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/__golden__/
git commit -m "test(rendering): add golden PNG regression test for v2 builder"
```

---

## Task A37: Plan A integration check

Final verification that all of Plan A landed cleanly and nothing regressed.

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: All tests pass — new tests + existing legacy tests.

- [ ] **Step 2: Lint and type check**

Run: `npm run lint && npx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manually generate a legacy skin to confirm no regression**

Start dev server: `npm run dev`
Open `/generate`, generate a skin with a simple prompt. Confirm the output PNG still renders correctly via the legacy pipeline (route handler still imports from `@/lib/legacy/skin-builder`).

- [ ] **Step 4: Commit (no code, marker commit)**

```bash
git commit --allow-empty -m "chore: Plan A (builder foundations) complete"
```

---

## Plan A self-review

**Coverage check:** Every section of the spec for builder upgrades (palette snap, mirror, parametric face/hair/ear, parts library, legacy migration, golden tests) is covered by tasks A1–A37.

**Out of scope for Plan A (handled in B/C):**
- `SkinIntent` Zod schema and persistence — Plan B
- Director / Artist / Patch LLM stages — Plan B
- API route wiring — Plan B
- Editor refinement flows — Plan C
- Variations grid — Plan C
