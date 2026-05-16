# Quickstart: Generator UI & Retro Pixel Art Experience

**Branch**: `002-generator-ui`
**Date**: 2026-02-22

---

## Prerequisites

All prerequisites from the `001-ai-skin-gen` feature remain required (Supabase, Stripe, Gemini, environment variables). See `specs/001-ai-skin-gen/quickstart.md`.

No new environment variables, packages, or external services are introduced by this feature.

---

## Step 1: Install Dependencies

No new dependencies. Verify the existing lockfile is up to date:

```bash
npm install
```

---

## Step 2: Run Dev Server

```bash
npm run dev
```

Navigate to `http://localhost:3000`. You should see the retro-themed landing page after this feature is implemented.

---

## Step 3: Verify the Design System

After implementing the CSS token changes:

1. The page background should be near-black (`#0d1017` range).
2. Primary buttons should render in Minecraft green.
3. Headings should use the Press Start 2P pixel font.
4. Border radius on cards should be visually square/blocky.

---

## Step 4: Verify Style Presets

On the generator page (`/generate`):

1. Six style preset chips appear below the prompt textarea.
2. Clicking a chip highlights it and appends its keywords to the prompt before submission.
3. Clicking an active chip deselects it and removes its keywords.
4. Multiple chips can be active simultaneously.

---

## Step 5: Verify Image Thumbnail

1. Click "Upload reference image" and select a JPEG or PNG.
2. A 48×48 thumbnail of the image appears immediately next to the remove button.
3. Clicking "Remove" clears both the thumbnail and the selected file.

---

## Step 6: Run Tests & Lint

```bash
npm test
npm run lint
```

All tests must pass. No lint errors are permitted before merging.

---

## Troubleshooting

### Font not loading
- Ensure `next/font/google` import in `layout.tsx` matches the export name exactly (`Press_Start_2P`, not `PressStart2P`).
- Check that the CSS variable `--font-pixel` is applied on the `<html>` element.

### Dark mode not applied
- Confirm `class="dark"` is set on the `<html>` element in `layout.tsx`, not just on `<body>`.

### Style preset keywords not in prompt
- Verify `presetKeywords` prop flows from `GeneratorPageClient` → `StylePresets` → `GeneratorForm`.
- Check that `GeneratorForm.handleSubmit` concatenates `presetKeywords` before `prompt.trim()`.

### Object URL thumbnail not appearing
- Ensure `URL.createObjectURL(file)` is called inside the `handleFileChange` function, not in a `useEffect`.
- Confirm the `<img>` element's `src` is set to the object URL and `alt` is descriptive.
