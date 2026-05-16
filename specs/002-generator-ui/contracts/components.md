# Component Contracts: Generator UI

**Branch**: `002-generator-ui`
**Phase**: 1 — Design & Contracts
**Date**: 2026-02-22

No new API endpoints are introduced by this feature. Contracts are defined for new and modified components.

---

## New Component: StylePresets

**File**: `components/skin-generator/StylePresets.tsx`

**Purpose**: Renders a row of toggleable chip buttons, each representing a style preset. When chips are toggled, they call `onPresetsChange` with the combined keyword string for all active presets.

### Props

```typescript
interface StylePreset {
  id: string
  label: string
  keywords: string
}

interface StylePresetsProps {
  /** Called whenever the active set of presets changes.
   *  The argument is the full keyword string for all active presets (space-joined),
   *  or an empty string if none are selected. */
  onPresetsChange: (combinedKeywords: string) => void
  /** Whether the chips are interactive (false when form is disabled/loading) */
  disabled?: boolean
}
```

### Behaviour

- Active preset chips are visually highlighted (use `bg-primary text-primary-foreground` vs `bg-secondary`).
- Multiple presets can be selected simultaneously.
- Clicking an active chip deselects it.
- When no presets are active, `onPresetsChange("")` is called.
- The combined keyword string is the `keywords` values of all active presets joined with `, `.

---

## Modified Component: GeneratorForm

**File**: `components/skin-generator/GeneratorForm.tsx`

**Changes**:
1. Accepts `presetKeywords` prop (string) — prepended to the prompt before submission.
2. Renders a thumbnail preview (`<img>`) when a reference file is selected, using `URL.createObjectURL`.
3. Updates placeholder text to use retro arcade examples.
4. Revokes the object URL on file clear or unmount.

### Updated Props

```typescript
interface GeneratorFormProps {
  onResult: (result: GenerationResult) => void
  onError: (message: string) => void
  disabled?: boolean
  /** Keywords from active style presets — prepended to the prompt on submit */
  presetKeywords?: string
}
```

### Submission Logic Change

```
finalPrompt = presetKeywords
  ? `${presetKeywords}. ${prompt.trim()}`
  : prompt.trim()
```

---

## Modified Component: GeneratorPageClient

**File**: `app/(app)/generate/GeneratorPageClient.tsx`

**Changes**:
1. Adds `StylePresets` component above `GeneratorForm`, passing `presetKeywords` state down to the form.
2. Replaces the inline upgrade `<Alert>` with the `UpgradePrompt` component (already exists, not wired up).
3. Layout polish: consistent spacing, retro-themed header.

### New State

```typescript
const [presetKeywords, setPresetKeywords] = useState('')
```

---

## Modified Component: CreditCounter

**File**: `components/skin-generator/CreditCounter.tsx`

**Changes**: Visual-only. Bold text when credits are critical (≤1 remaining), amber/gold colour for the progress bar instead of default primary, pixel-style label.

No prop changes.

---

## Modified Component: SkinPreview

**File**: `components/skin-generator/SkinPreview.tsx`

**Changes**: Empty state redesign — replace the 🎮 emoji with a pixelated placeholder illustration (SVG or CSS-only block art) and update the copy. Container gets a dark retro border treatment.

No prop changes.

---

## Modified File: globals.css

**File**: `app/globals.css`

**Changes**: Replace both `:root` (light) and `.dark` CSS custom property sets with the arcade palette defined in `research.md`. Add `image-rendering: pixelated` utility class `.pixel-art` for future use.

---

## Modified File: layout.tsx

**File**: `app/layout.tsx`

**Changes**:
1. Import `Press_Start_2P` from `next/font/google`.
2. Apply font variable to `<html>` tag.
3. Add `class="dark"` to `<html>` to force dark mode by default.
4. Add CSS variable `--font-pixel` mapped to the loaded font.

---

## Modified File: tailwind.config.ts

**File**: `tailwind.config.ts`

**Changes**:
1. Extend `fontFamily` with `pixel: ['var(--font-pixel)', 'monospace']`.
2. Add `imageRendering: { pixelated: 'pixelated' }` if not already available via arbitrary values.

---

## Modified File: app/page.tsx

**File**: `app/page.tsx`

**Changes**: Full redesign. Structure:
- Dark hero section with `font-pixel` headline
- Feature grid with bold icon blocks
- Pricing tier summary (Free vs Pro)
- Primary CTA button (Minecraft green)
- No new data fetching — purely static

---

## No New API Routes

This feature is entirely frontend. The existing API surface is unchanged:

| Route | Status |
|-------|--------|
| `POST /api/generate` | Unchanged |
| `GET /api/generate/[id]/download` | Unchanged |
| `POST /api/subscription/checkout` | Unchanged |
| `POST /api/subscription/portal` | Unchanged |
| `GET /api/user/me` | Unchanged |
