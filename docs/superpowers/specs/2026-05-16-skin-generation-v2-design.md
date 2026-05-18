# Skin Generation v2 — Design

**Date:** 2026-05-16
**Status:** Design (approved, ready for implementation planning)
**Scope:** Full redesign of the skin generation pipeline. Combines three workstreams (pipeline rework, parametric primitives, refinement UX) under one spec.

## 1. Motivation

Today's pipeline is a single Gemini call that returns a full `RegionColorMap` (colors + pixel grids) which the builder paints into a 64×64 PNG. The system prompt is ~315 lines. The model is asked to produce identical L/R arm and leg grids twice. The user gets one shot per credit and cannot refine — no region re-roll, no variations, no natural-language tweaks. Faces come from a hardcoded LUT of 16 templates; ears have a single template (cat ears).

Three pain points motivated this redesign (cost was explicitly not a priority):

- **Quality / consistency.** Skins come out muddy. The "use 3–5 colors" rule is prompt text with no enforcement. L/R drift happens because the LLM has to produce the same grid twice.
- **Creative range.** 16 faces and 1 ear template feel samey. Limited hair variation.
- **Iteration / control.** No way to refine. "Make the shirt redder" requires a full re-generation that produces an entirely different character.

## 2. High-level architecture

The pipeline becomes three stages around a versioned `SkinIntent` document that is the single source of truth for what the user wants. Every refinement is a transformation of the intent.

```
                          ┌──────────────────────────────────┐
 prompt + ref image  ───► │ DIRECTOR (Gemini 2.5 Flash)      │
                          │ small prompt, structured output  │
                          │ → SkinIntent                     │
                          └─────────────┬────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────────────┐
                          │ ARTIST (Gemini 2.5 Flash)        │
                          │ paints BODY pixel grids only     │
                          │ (head/face/ears handled by code) │
                          │ → SkinPixels                     │
                          └─────────────┬────────────────────┘
                                        │
                                        ▼
                          ┌──────────────────────────────────┐
                          │ BUILDER (pure code)              │
                          │ • parametric face/hair/ears      │
                          │ • L→R mirror in code             │
                          │ • soft palette snap              │
                          │ → 64×64 PNG                      │
                          └──────────────────────────────────┘
```

A third LLM call — **Patch** — is invoked only on natural-language refinement ("make the shirt redder"). It produces a `SkinIntentPatch` that is applied to the current intent before re-running affected pipeline stages.

### What moves where vs today

| Concern | Today | New |
|---|---|---|
| Palette enforcement | Prompt rule, unverified | Hard invariant: soft-snap every output pixel |
| L/R arm/leg symmetry | Prompt rule, drifts | Code mirror in builder |
| 16 fixed face templates | Hardcoded LUT in `face-templates.ts` | Parametric composer (eye × mouth × brows × nose × hair_style × hair_length) |
| Hair styles | Bound to face template | Parametric `hair_style × hair_length` |
| Ears | 1 template (cat) | Parametric set, 8 styles |
| Body pixel art | LLM | LLM (unchanged here — Artist still paints) |
| System prompt size | ~315 lines | ~60–80 lines per stage |
| Refinement | None | Intent-doc transformations + region re-roll + variations |

## 3. Data contracts

Two documents define the system state for a given skin:

### 3.1 `SkinIntent`

The Director's output and the source of truth for all refinement. Stored as JSON alongside each `skin_generations` row.

```ts
interface SkinIntent {
  version: 1
  seed: number                              // randomness anchor for Artist + variations
  style: StyleTag                           // "retro" | "cyberpunk" | "fantasy" | "modern" | ...
  palette: [string, string, string, ...string[]]   // 3–5 hex colors, ordered most→least prominent
  palette_mode: "soft" | "hard"             // default "soft"

  character: {
    skin_tone: string                       // hex (separate from palette — never snapped)
    eye_shape: EyeShape                     // ~8 options
    eye_color: string                       // hex
    eye_white?: string                      // hex, default near-white
    brows: BrowShape                        // ~5 options
    mouth: MouthShape                       // ~6 options
    mouth_color?: string                    // hex, defaults to darkened skin_tone
    nose: NoseShape                         // ~4 options
    hair_style: HairStyle                   // ~12 options
    hair_length: HairLength                 // short | medium | long | very_long
    hair_color: string                      // hex
    hair_accent_color?: string              // hex, optional streaks/tips
    ear_template: EarTemplate               // 8 options: none|round|pointy|cat|fox|bunny|wolf|elf
    ear_color?: string                      // hex, defaults to hair
    inner_ear_color?: string                // hex, defaults to lerp(skin_tone, pink)
  }

  outfit: {
    torso: string                           // free-text descriptor for Artist
    arms: string
    legs: string
    jacket?: string                         // optional outer layer
    sleeves?: string                        // optional outer sleeves
    pants_outer?: string                    // optional outer pants
    accessories?: string                    // e.g. "small star on left chest"
  }

  refinement_history: RefinementEvent[]     // append-only audit log
}

interface RefinementEvent {
  type: "region_reroll" | "patch" | "param_edit" | "manual_paint"
  at: string                                // ISO timestamp
  description: string                       // human-readable: 'Re-rolled torso_front' or 'redder shirt'
  affected_regions: BodyRegion[]
  // snapshot of prior intent + pixels stored client-side for undo
}
```

### 3.2 `SkinPixels`

The Artist's output. Stored alongside `SkinIntent`. Body regions only — head/face/ears never appear here.

```ts
interface SkinPixels {
  torso_front: string[][]
  torso_back: string[][]
  torso_side: string[][]                    // single side; builder mirrors → torso_right + torso_left
  arm_front: string[][]                     // single arm; mirrored to right/left
  arm_side: string[][]                      // mirrored to right_arm_right + left_arm_left
  arm_back: string[][]
  leg_front: string[][]
  leg_side: string[][]
  leg_back: string[][]
  jacket_front?: string[][]
  jacket_back?: string[][]
  jacket_side?: string[][]
  sleeve_front?: string[][]
  pants_outer_front?: string[][]
  accessories?: { region: HatRegion; pixels: string[][] }[]
}
```

### 3.3 Key invariants enforced by the schema

- **Palette is the only color invariant.** Every Artist pixel gets soft-snapped to it. `skin_tone`, eye/hair/ear colors are not snapped — they're painted directly by the parametric composer.
- **L/R pairs collapsed.** The schema literally cannot drift between right and left arm/leg. Builder mirrors deterministically.
- **Parametric character is declarative.** No LLM has to "draw a face". Editor parameter controls edit these fields directly and trigger a re-render with no LLM call.
- **Outfit is free-text per region.** Where the Artist still has creative freedom.

## 4. LLM stages

All three stages use `gemini-2.5-flash` with `responseMimeType: 'application/json'` and Zod-validated response schemas. One retry on parse failure.

### 4.1 Director (first-gen only)

**Inputs:**
- User prompt text (optional if reference image provided)
- Reference image (optional, base64 JPEG/PNG, ≤10MB) — Director only; Artist never sees the reference
- Optional pre-selected style tag, face params, or ear template from the generator UI

**Output:** `SkinIntent` minus `refinement_history`

**Prompt shape (~60 lines):**
```
You are a Minecraft skin character director. Read the user's prompt and
optional reference image. Produce a SkinIntent JSON describing the character.

Required:
- palette: 3-5 hex colors for the OUTFIT (not skin/hair/eyes). Choose
  colors that read clearly in 4-8px wide pixel art.
- character: pick parametric face/hair/ear parts.
  See <enum reference> for available values.
- outfit: write a SHORT vivid descriptor per region. Mention pattern,
  trim, belt, cuffs, boots if relevant. The Artist will pixel this.
- style: one of <style enum>.
- seed: integer 0-99999 (random if unsure).

Rules:
- Never use pure black or pure white. Use #1A1A1A and #F0F0F0.
- Skin_tone must be warm and lifelike; never gray or pure white.
- If reference image present, extract every visible detail faithfully.

[examples × 2: one minimal prompt, one rich prompt+ref]
```

Token cost: Director output ~500 tokens vs today's ~5000-token full pixel JSON. ~70% reduction on this stage.

### 4.2 Artist (first-gen, variations, region re-roll)

**Inputs:**
- `SkinIntent` (read-only)
- `regions: BodyRegion[]` — which body regions to paint. `BodyRegion` is the union of `SkinPixels` keys (e.g. `"torso_front" | "arm_front" | ...`).
- Optional `context: SkinPixels` — existing pixels for non-target regions, included on re-rolls so the Artist matches established style

**Output:** Partial `SkinPixels` containing only the requested regions

**Prompt shape (~80 lines):**
```
You are a Minecraft skin pixel artist. Paint pixel grids for the BODY
regions of this character. Head, face, hair, and ears are handled separately —
do NOT include them.

Character intent:
  Style: {style}
  Palette: [color1, color2, color3, ...]
  Outfit:
    torso:  "blue tunic with white collar and gold trim"
    arms:   "matching blue sleeves"
    legs:   "dark trousers"
    jacket: "brown leather coat"   (or null)
    ...

Regions to paint: [torso_front, torso_back, torso_side, arm_front, ...]

Rules:
- DRAW from the palette. You MAY introduce a few transition shades for
  shading but stay close to palette colors (the builder soft-snaps).
- Body symmetry: only ONE side per L/R pair (torso_side, arm_front,
  arm_side, leg_front, leg_side). The system mirrors automatically.
- Standard rows: collar rows 0-1, body rows 2-7, belt rows 8-9,
  lower rows 10-11. Arms: shoulder row 0, cuff rows 10-11.
  Legs: pants rows 0-7, boot rows 8-11.
- {if context} Match the style and palette of the existing context
  pixels provided for non-target regions.
```

### 4.3 Patch (natural-language refinement)

**Purpose:** translate "make the shirt redder", "swap boots for sandals", "longer hair" into a structured intent diff.

**Inputs:**
- Current `SkinIntent`
- User instruction text

**Output:**
```ts
interface SkinIntentPatch {
  palette_changes?: { index: number; new_hex: string }[]
  character_changes?: Partial<SkinIntent["character"]>
  outfit_changes?: Partial<SkinIntent["outfit"]>
  affected_regions: BodyRegion[]            // which body regions need repainting
  affects_character: boolean                // true if face/hair/ear params changed
}
```

**Flow:**
1. Patch LLM call → `SkinIntentPatch`
2. Apply patch to current intent
3. If `affects_character` only → builder re-render face/hair/ear regions, no Artist call
4. If `affected_regions.length > 0` → call Artist with those regions + context
5. Append `RefinementEvent` to history. No credit charged.

## 5. Builder upgrades

`lib/skin-builder.ts` becomes a slim orchestrator. New modules added; legacy renderer kept intact for backwards compatibility.

```
lib/
  skin-builder.ts                   (orchestrator)
  rendering/
    palette-snap.ts                 NEW: soft snap, CIE76 ΔE, configurable threshold
    mirror.ts                       NEW: L/R region mirroring
    face-composer.ts                NEW: parametric face composition
    hair-composer.ts                NEW: hair_style × hair_length across head + hat layers
    ear-composer.ts                 NEW: ear_template overlays
  parts/
    eyes/{round,almond,wide,close_set,sleepy,dot,square,mono}.ts
    mouths/{none,smile,wide_smile,frown,open,smirk}.ts
    brows/{none,flat,angled_up,angled_down,bushy}.ts
    noses/{none,bridge,dot,wide}.ts
    hair-styles/{classic,bangs,side_part,mohawk,fluffy,curtain,bald,bun,ponytail,spiky,undercut,dreads}.ts
    hair-lengths/{short,medium,long,very_long}.ts
    ears/{none,round,pointy,cat,fox,bunny,wolf,elf}.ts
  legacy/
    skin-builder.ts                 (current code, moved here, kept intact)
    face-templates.ts               (current 16-template LUT)
    ear-templates.ts                (current cat-ear template)
```

### 5.1 Parametric face composer

The 8×8 `head_front` region is painted by layering masks:

1. Fill base with `skin_tone`
2. Paint brows mask (rows 1–2, hair_color)
3. Paint eyes mask (rows 3–4, eye_white + eye_color)
4. Paint nose mask (row 5, nose_shadow)
5. Paint mouth mask (rows 5–6, mouth_color)
6. Paint side hair from `hair_style.front_overlay` (covers cheeks/forehead per style)

Each part is an 8×8 mask using symbolic chars (`S`/`W`/`E`/`M`/`N`/`H`/`h`/`.`) — same convention as today's face templates.

**Combinations:** 8 × 6 × 5 × 4 = **960 face permutations** vs today's 16. Times hair_style (12) × hair_length (4) = ~46k character permutations before palette/outfit vary.

### 5.2 Hair composer

`hair_style` selects the shape across all 6 head regions and 5 hat regions simultaneously. `hair_length` modifies the hat layer:
- `short` — minimal hat layer, no back overflow
- `medium` — default
- `long` — extends into hat back rows
- `very_long` — fills hat back fully, optional torso_top overflow

The composer outputs templates that paint into the buffer at build time. No LLM involvement.

### 5.3 Ear composer

Outputs hat-layer overlays for the side faces. For ear styles that extend up (cat, fox, bunny), also paints into `hat_top`. For ears that wrap (e.g., elf), optionally cuts pixels from `head_right` / `head_left` to make room.

### 5.4 Deterministic L/R mirror

```ts
function mirrorPair(pixels: string[][], axis: "vertical" | "horizontal"): string[][]
```

Called by the orchestrator:
- `torso_side` painted directly into `torso_right`; horizontally mirrored into `torso_left`
- `arm_front` → `right_arm_front` direct, `left_arm_front` mirrored
- `arm_side` → `right_arm_right` direct, `left_arm_left` mirrored
- `arm_back` → mirrored to both
- Same pattern for legs and outer layers

Removes the symmetry rules from the Artist prompt entirely.

### 5.5 Soft palette snap

```ts
function softSnap(rgb: RGB, palette: RGB[], threshold: number): RGB {
  const [nearest, distance] = nearestPaletteColor(rgb, palette)
  return distance < threshold ? rgb : nearest
}
```

- **Distance metric:** CIE76 ΔE in Lab space (better perceptual match than RGB Euclidean)
- **Default threshold:** ~24 ΔE — tunable; documented as configurable constant
- **Scope:** applied as a final pass over Artist-painted regions only. Skin/hair/eye colors painted by composers are not snapped.
- `palette_mode: "hard"` setting (future user toggle) forces threshold to 0 → all pixels snap to palette.

### 5.6 Migration / backwards compatibility

Existing `skin_generations` rows have today's `RegionColorMap` JSON. Plan:

1. **Schema:** add a new `intent` JSON column on `skin_generations` (Drizzle migration). Existing `color_map` column kept as `legacy_color_map`.
2. **Renderer fallback:** the request handler detects which schema is present and routes to `lib/legacy/skin-builder.ts` (current code, moved intact) or the new builder. Old skins keep rendering exactly as they did. No retroactive data migration needed.
3. **Old → new mapping:** ship a one-time mapping table from `face_template: 0–15` to new `character` parameter sets so an old skin can be "opened in the new editor" if the user requests it. Optional V1 feature; mapping table can ship later.

## 6. Refinement UX (in skin-editor)

The existing `app/(app)/edit/` editor becomes the home for all refinement. The generator page handles first-gen and variations grid; deep iteration happens in the editor.

### 6.1 Editor state

```ts
EditorState {
  generationId: string
  intent: SkinIntent                  // editable
  pixels: SkinPixels                  // editable (manual paint overrides)
  png: Buffer | URL                   // current render
  manual_overrides: Set<Region>       // regions user has hand-painted — never auto-repainted
  history: RefinementEvent[]
}
```

**`manual_overrides` invariant:** once a user paints a pixel by hand in a region, that region is locked from automatic repaint (region re-roll, redder-shirt patches) until they explicitly clear it. Prevents losing hand-crafted detail to refinements.

**Persistence:** `manual_overrides` is persisted server-side alongside `intent` and `pixels` on save (as a JSON column on `skin_generations`). When a saved skin is reopened in the editor, the lock state is restored so the user's hand-painted regions remain protected across sessions.

### 6.2 Four refinement entry points

**Direct parameter controls** (sidebar)
- Palette swatches: click to open color picker → builder re-snaps + repaints affected regions
- Character dropdowns/grids: `eye_shape`, `mouth`, `brows`, `hair_style`, `hair_length`, `ear_template` → composer re-renders affected regions
- Color pickers: skin tone, eye color, hair color, hair accent, ear colors
- **All free. No LLM. Instant.**

**Region re-roll**
- Right-click a region on the canvas or 3D preview → "Re-roll this region"
- Calls Artist with `regions: [clicked]` + current pixels as context
- ~3–5s latency. Free. Loading spinner scoped to the affected region.

**Natural-language refinement**
- Chat-style text field at bottom of editor
- "Make the shirt redder", "darker boots", "give them sunglasses"
- Calls Patch LLM → applies `SkinIntentPatch` → re-renders character if needed + calls Artist for affected body regions
- ~3–7s latency. Free.

**Variations**
- Button on generator result page and in editor: "Generate 3 variations"
- Same `SkinIntent`, three different seeds, three parallel Artist calls
- 3 credits charged up front; refunded per-variation if any Artist call fails
- UI shows 1×3 grid; clicking one opens it in editor with fresh `generationId`

### 6.3 Latency / cost summary

| Action | Backend | Latency | Cost |
|---|---|---|---|
| Edit palette swatch | Builder re-snap | <100ms | 0 |
| Edit character parameter | Builder composer | <100ms | 0 |
| Region re-roll | Artist (1 region) | 3–5s | 0 credits |
| Natural-language patch | Patch LLM + Artist (affected) | 3–7s | 0 credits |
| 3 variations | 3 × Artist parallel | 4–7s | 3 credits |
| First-gen | Director + Artist (all body) | 6–12s | 1 credit |

### 6.4 Undo / redo

`refinement_history` is an append-only event log. Undo pops the last event and restores the previous `intent` + `pixels` snapshot from client-side state. Snapshots are stored in the editor; only the final state is persisted on save. The existing `components/skin-editor/HistoryControls.tsx` wraps this.

## 7. Credit model

| Action | Credits |
|---|---|
| First-gen | 1 |
| Region re-roll | 0 |
| Natural-language refinement | 0 |
| Parameter edit (palette / character control) | 0 |
| Variations | N credits for N variations |

Refund rules:
- First-gen failure → refund 1 credit (today's behavior, preserved)
- Per-variation Artist failure → refund 1 credit per failed variation

No soft cap on free actions in V1; revisit if abuse becomes observable.

## 8. Error handling

| Failure | Behavior |
|---|---|
| Director parse fail | Retry once; on second fail, surface "Generation failed", refund credit |
| Artist parse fail (first-gen) | Retry once; on second fail, refund credit |
| Artist parse fail (region re-roll / patch) | Retry once; on second fail, inline error "Re-roll failed, please try again" — no credit involved |
| Patch produces empty patch (no `affected_regions`, no `affects_character`) | Inline help: "I'm not sure what to change — try editing the palette directly or be more specific." |
| Reference image rejected (size / format) | Same as today: 400 with explanatory message before any LLM call |
| Storage upload failure | Mark generation as failed, refund credit, log error |

## 9. Parts library scope (V1)

Hand-author the full set for V1, accepting ~1–2 weeks of pixel art work upfront. The creative-range pain point is a top priority and a starter set would still feel samey.

**V1 deliverable:**
- 8 eye shapes
- 6 mouth shapes
- 5 brow shapes
- 4 nose shapes
- 12 hair styles
- 4 hair lengths (as modifiers to hair styles)
- 8 ear templates (none, round, pointy, cat, fox, bunny, wolf, elf)

The `learn-faces/mc_skin_faces/` (317 references) and `learnhair/` (18 references) folders are reference material for the hand-author work.

## 10. Out of scope (parked for V1.5+)

- **Vision critic loop.** Render → upscale → Gemini-vision critique → re-paint patches. Promising but vision-on-pixel-art at 64×64 (or even upscaled) is unreliable. Will revisit as an opt-in "high quality" toggle once V1 is stable.
- **Style transfer from reference image.** Today the reference image is passed to the Director as-is. Could be preprocessed (palette extraction, dominant feature detection) for more reliable adherence. V1 keeps current behavior.
- **Retroactive migration of old skins.** Old skins keep rendering via the legacy builder. A user-initiated "upgrade this skin to v2 editor" feature using the face_template mapping table is V1.5.
- **Multi-provider / AI Gateway routing.** Single Gemini provider for V1. Adding fallback / routing through Vercel AI Gateway is parked.

## 11. Open questions resolved during brainstorming

| Question | Decision |
|---|---|
| Pain points priority | Quality + creative range + iteration control (NOT cost) |
| Scope | Full redesign — pipeline + parametric primitives + refinement UX, one combined spec |
| Credit model | Tiered: first-gen 1 credit, refinements free, variations cost per |
| Palette enforcement | Soft snap (threshold-based), tunable per skin |
| Parts library scope | Full hand-authored set in V1 |
| Patch LLM | Keep it (natural-language refinement is the magic) |
| Region re-roll cap | None for V1 |
| Reference image scope | Director only, not Artist |
