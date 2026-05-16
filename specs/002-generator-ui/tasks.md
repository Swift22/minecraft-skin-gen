# Tasks: Generator UI & Retro Pixel Art Experience

**Input**: Design documents from `specs/002-generator-ui/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/components.md ✅, quickstart.md ✅

**Tests**: Test tasks included for logic-bearing components (`StylePresets`, `GeneratorForm` prompt assembly) per constitution Principle II (TDD preferred). Visual-only changes do not require additional tests beyond existing coverage.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking dependencies)
- **[Story]**: Which user story this task belongs to (US1–US6)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm dev environment is functional on the feature branch. No new dependencies.

- [ ] T001 Verify `npm install` resolves cleanly and `npm run dev` starts without errors on branch `002-generator-ui`

---

## Phase 2: Foundational (Design System — Blocking Prerequisites)

**Purpose**: Establish the retro arcade design token system. ALL user story phases depend on these tokens being in place first.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete — every component inherits the CSS custom properties and font variable set here.

- [ ] T002 [P] Replace the `:root` and `.dark` CSS custom property sets in `app/globals.css` with the arcade dark palette from `research.md` (near-black background `220 20% 6%`, Minecraft green primary `127 60% 45%`, gold accent `38 95% 58%`, reduced radius `0.25rem`). Also add `.pixel-art { image-rendering: pixelated; image-rendering: crisp-edges; }` utility class
- [ ] T003 [P] Extend `tailwind.config.ts` theme: add `fontFamily: { pixel: ['var(--font-pixel)', 'monospace'] }` inside `theme.extend`
- [ ] T004 Update `app/layout.tsx`: import `Press_Start_2P` from `next/font/google` with `weight: '400'`, `subsets: ['latin']`, `display: 'swap'`; expose as CSS variable `--font-pixel` on the `<html>` element; add `className="dark"` to `<html>` to force dark mode globally

**Checkpoint**: Design system ready. Run `npm run dev` — the page should now render with a dark background and Minecraft green buttons.

---

## Phase 3: User Story 1 — Compelling Landing Page (Priority: P1) 🎯 MVP

**Goal**: Replace the bare-bones homepage with a striking retro arcade landing page that drives sign-up conversion.

**Independent Test**: Visit `http://localhost:3000` — the page renders with a dark background, pixel font headline, three feature cards, pricing info (Free 3/day / Pro 50/day), and CTA links to `/signup` and `/login`.

- [ ] T005 [US1] Rewrite `app/page.tsx` hero section: full-viewport dark hero (`min-h-screen bg-background flex flex-col items-center justify-center`), `<h1>` with `font-pixel` class for "Minecraft Skin Generator", one-sentence value proposition in `text-foreground`, primary CTA Button (`size="lg"`) linking to `/signup`, secondary outline Button linking to `/login`
- [ ] T006 [US1] Add feature grid to `app/page.tsx` (below hero): three `bg-card border rounded` cards arranged in `grid-cols-1 md:grid-cols-3` with lucide-react icons (`Wand2`, `ImagePlus`, `Download`) for text-to-skin, image reference, and instant download features — each with a bold heading and two-line description
- [ ] T007 [US1] Add pricing strip to `app/page.tsx` (below feature grid): two-column `bg-secondary rounded` panel comparing Free (3 skins/day) and Pro (50/day, no ads, priority) tiers with `text-sm` labels; include a note "Free — no credit card required"

**Checkpoint**: Landing page is fully functional and independently testable. Users can navigate to `/signup` and `/login` from CTAs.

---

## Phase 4: User Story 2 — Intuitive Skin Generator Form (Priority: P1)

**Goal**: Enhance the generator form with a reference image thumbnail preview and retro arcade placeholder copy, improving the generation UX.

**Independent Test**: Navigate to `/generate` (requires auth). The prompt textarea shows retro arcade placeholder examples. Selecting an image file shows a thumbnail. Submitting triggers the loading state and returns a skin.

- [ ] T008 [US2] Update `components/skin-generator/GeneratorForm.tsx`: add `thumbnailUrl: string | null` state; in `handleFileChange` after validation passes, call `URL.createObjectURL(file)` and store in state; in `clearFile`, call `URL.revokeObjectURL(thumbnailUrl)` before clearing; add a `useEffect` cleanup that revokes the URL on unmount; render `<img src={thumbnailUrl} alt="Reference image preview" className="h-12 w-12 rounded object-cover pixel-art" />` adjacent to the remove button when `referenceFile` is set
- [ ] T009 [US2] Update `components/skin-generator/GeneratorForm.tsx` textarea `placeholder` prop to: `"e.g. retro knight in red armor, cyberpunk hacker with neon visor, 90s arcade fighter with electric blue jacket…"`

**Checkpoint**: Generator form shows image thumbnails and retro placeholder copy. The form submits and generates skins correctly (no regression on existing behaviour).

---

## Phase 5: User Story 3 — Skin Preview & Download (Priority: P1)

**Goal**: Polish the skin preview empty state and container to match the retro arcade aesthetic. The 3D viewer (skinview3d) is already functional — no changes to rendering logic.

**Independent Test**: Navigate to `/generate`. The empty state shows a pixel-art block figure (CSS-drawn) and updated copy. After generating a skin, the 3D viewer loads and the Download button is visible.

- [ ] T010 [US3] Update `components/skin-generator/SkinPreview.tsx` empty state (the `if (!skinUrl)` branch): replace the 🎮 emoji with a simple CSS pixel-art Minecraft face using nested `<div>` elements styled with `bg-primary` (green), `bg-secondary`, and `bg-foreground` blocks at `w-4 h-4` size — or an equivalent inline SVG pixel figure; update copy to: "Your skin will appear here — describe it and hit Generate."
- [ ] T011 [US3] Update `components/skin-generator/SkinPreview.tsx` viewer container: wrap the existing `<canvas>` in a `border-2 border-border rounded` container; ensure the dark background `bg-[#1a1a2e]` remains for the 3D render area

**Checkpoint**: Empty state is visually retro. 3D viewer renders correctly in its updated container. Download and Regenerate buttons remain functional.

---

## Phase 6: User Story 4 — Style Presets for Retro Pixel Art Quality (Priority: P2)

**Goal**: Add a row of 6 toggleable style preset chips above the generator form that append keyword strings to the prompt, steering the AI toward high-quality retro pixel art output.

**Independent Test**: On `/generate`, 6 chips are visible. Clicking "Retro Arcade" highlights it and its keywords appear in the prompt before submission. Clicking it again deselects it. Multiple chips can be active simultaneously.

### Tests for User Story 4

> **Write these tests FIRST — confirm they FAIL — then implement**

- [ ] T012 [P] [US4] Write unit tests for `StylePresets` in a new file `components/skin-generator/__tests__/StylePresets.test.tsx`: test (a) clicking a chip calls `onPresetsChange` with the chip's keywords, (b) clicking an active chip calls `onPresetsChange("")`, (c) selecting two chips calls `onPresetsChange` with both keywords joined, (d) `disabled` prop renders chips with `disabled` attribute, (e) each chip has `aria-pressed` set to `"true"` when active and `"false"` when inactive
- [ ] T013 [P] [US4] Write unit tests for the prompt assembly logic in `components/skin-generator/__tests__/GeneratorForm.test.tsx`: test (a) `presetKeywords` is prepended to prompt before submit (`"keywords. user text"`), (b) `presetKeywords` alone (no user text) produces valid prompt (`"keywords"`), (c) no `presetKeywords` uses prompt as-is

### Implementation for User Story 4

- [ ] T014 [US4] Create `components/skin-generator/StylePresets.tsx`: define `StylePreset` interface (`id`, `label`, `keywords`); define `PRESETS` const array with the 6 presets from `research.md`; implement `StylePresetsProps` (`onPresetsChange: (keywords: string) => void`, `disabled?: boolean`); manage `activeIds` as `Set<string>` in state; toggle handler: add/remove id, join active keywords with `", "`, call `onPresetsChange`; render `<div className="flex flex-wrap gap-2">` containing one `<button>` per preset with `aria-pressed={activeIds.has(preset.id).toString()}`, active style `bg-primary text-primary-foreground`, inactive style `bg-secondary text-secondary-foreground hover:bg-secondary/80`, `rounded-sm text-xs px-3 py-1` (blocky feel), `disabled={disabled}`
- [ ] T015 [US4] Update `app/(app)/generate/GeneratorPageClient.tsx`: add `const [presetKeywords, setPresetKeywords] = useState('')`; render `<StylePresets onPresetsChange={setPresetKeywords} disabled={isExhausted} />` in the form column above `<GeneratorForm>`; pass `presetKeywords={presetKeywords}` to `<GeneratorForm>`
- [ ] T016 [US4] Update `components/skin-generator/GeneratorForm.tsx`: add `presetKeywords?: string` to `GeneratorFormProps`; in `handleSubmit`, replace the direct `prompt.trim()` append with: `const base = prompt.trim(); const finalPrompt = presetKeywords ? \`${presetKeywords}${base ? \`. ${base}\` : ''}\` : base`; use `finalPrompt` in `formData.append('prompt', finalPrompt)` — only append if `finalPrompt` is non-empty

**Checkpoint**: Style presets are functional. Selecting chips and submitting sends the combined keywords+prompt to the generation API. Existing generation flow is unaffected when no chips are selected.

---

## Phase 7: User Story 5 — Credit Counter & Upgrade UX (Priority: P2)

**Goal**: Polish the credit counter with urgency styling, properly integrate the UpgradePrompt component, and apply retro styling to the header and upgrade card.

**Independent Test**: On `/generate`, the credit counter bar is amber/gold. With 1 credit left, the label turns red. With 0 credits, the `UpgradePrompt` card is shown (not an inline Alert). Clicking "Upgrade to Pro" navigates to Stripe checkout.

- [ ] T017 [P] [US5] Update `components/skin-generator/CreditCounter.tsx`: change progress bar class from `bg-primary` to `bg-accent` (gold/amber); add conditional label class: `creditsRemaining <= 1 && creditsRemaining > 0 ? 'text-destructive font-bold' : 'text-muted-foreground'`; when `isExhausted`, show "Resets at midnight UTC" inline with the label (remove the right-aligned span, put it inline with the counter text)
- [ ] T018 [P] [US5] Update `components/skin-generator/UpgradePrompt.tsx`: add `font-pixel text-sm` to `<CardTitle>`; change `CardContent` border class to `border-primary/30`; replace the `✓` list markers with `▶ ` (pixel-appropriate character); ensure the Button uses full-width primary styling (already correct — confirm no regression)
- [ ] T019 [US5] Update `app/(app)/generate/GeneratorPageClient.tsx`: remove the inline `<Alert>` block that shows when `isExhausted && !user.isSubscriber` and replace it with `<UpgradePrompt />` (already imported — fix the import if needed); the `UpgradePrompt` component handles its own checkout fetch, so remove the duplicated checkout `fetch` call from the inline block
- [ ] T020 [US5] Update `app/(app)/generate/GeneratorPageClient.tsx` header `<h1>`: add `font-pixel text-lg` classes to the site name; ensure the header `border-b` uses `border-border` token (picks up the new palette)

**Checkpoint**: Credit counter is amber with urgency styling. UpgradePrompt card renders when credits are exhausted. Header renders in pixel font. Existing subscription management link still works for Pro users.

---

## Phase 8: User Story 6 — Responsive & Accessible Layout (Priority: P3)

**Goal**: Confirm the full layout is responsive at 375px mobile viewport and all interactive elements meet accessibility requirements (aria-pressed, labels, focus states).

**Independent Test**: Resize browser to 375px — no horizontal overflow, form and preview stack vertically. Tab through the generator page — all interactive elements are reachable and labelled.

- [ ] T021 [P] [US6] Audit `app/(app)/generate/GeneratorPageClient.tsx` mobile layout: confirm the two-column grid (`grid-cols-1 md:grid-cols-2`) is present; add `overflow-x-hidden` to the `<main>` element if any child causes overflow; verify the `<StylePresets>` chip row uses `flex-wrap` so chips wrap on narrow viewports (already specified in T014 — confirm)
- [ ] T022 [P] [US6] Audit `app/page.tsx` mobile layout: ensure the feature grid uses `grid-cols-1 md:grid-cols-3` (specified in T006 — confirm); ensure the hero buttons are stacked on mobile (`flex-col sm:flex-row`) or full-width; verify no element has a fixed pixel width that would cause overflow at 375px
- [ ] T023 [US6] Accessibility audit across modified components: verify `StylePresets` chips have `aria-pressed` (implemented in T014 — confirm); verify `GeneratorForm` image upload `<input>` retains its `aria-label` after T008 thumbnail changes; verify `CreditCounter` progressbar `role="progressbar"` and `aria-valuenow`/`aria-valuemin`/`aria-valuemax` attributes are intact after T017 changes; verify `UpgradePrompt` Button has legible focus ring under the new palette

**Checkpoint**: Layout is responsive. All interactive elements are keyboard-navigable and screen-reader labelled.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final quality gates before PR.

- [ ] T024 [P] Run `npm run lint` — fix any ESLint errors introduced by this feature (pay attention to unused variables from the inline upgrade block removed in T019, and object URL cleanup in T008)
- [ ] T025 [P] Run `npx tsc --noEmit` — fix any TypeScript errors (check `StylePresets.tsx` prop types, `GeneratorForm.tsx` updated props, `GeneratorPageClient.tsx` imports)
- [ ] T026 Run `npm test` — ensure all existing tests pass and new tests from T012/T013 pass; confirm coverage does not regress below baseline
- [ ] T027 Complete the manual smoke test checklist from `plan.md`: dark retro theme visible ✓, pixel font on headings ✓, 6 preset chips ✓, chip toggle + prompt prepend ✓, image thumbnail ✓, skin generation ✓, 3D preview loads ✓, download works ✓, credit counter updates ✓, upgrade prompt on 0 credits ✓, 375px no horizontal scroll ✓

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user story work**
- **User Stories (Phases 3–8)**: All depend on Phase 2 completion
  - US1, US2, US3 are all P1 — can proceed in sequence or parallel after Phase 2
  - US4 depends on US2 (adds `presetKeywords` prop to `GeneratorForm` modified in T009)
  - US5 depends on US2 layout being in place
  - US6 audits all prior phases — must come last among user stories
- **Polish (Phase 9)**: Depends on all user story phases complete

### User Story Dependencies

- **US1 (Landing Page)**: Independent after Phase 2 — touches only `app/page.tsx`
- **US2 (Generator Form)**: Independent after Phase 2 — touches only `GeneratorForm.tsx`
- **US3 (Skin Preview)**: Independent after Phase 2 — touches only `SkinPreview.tsx`
- **US4 (Style Presets)**: Depends on US2 completing T009 (shares `GeneratorForm.tsx`)
- **US5 (Credits & Upgrade)**: Depends on US2 completing T009 (shares `GeneratorPageClient.tsx` layout)
- **US6 (Responsive)**: Depends on US1–US5 complete (audits all components)

### Within Each User Story

- Tests (T012, T013) written and confirmed failing BEFORE implementation (T014–T016)
- New component (T014) created before it is integrated (T015)
- Integration (T015) before GeneratorForm receives the prop (T016)

### Parallel Opportunities

- T002 and T003 can run in parallel (different files: `globals.css` vs `tailwind.config.ts`)
- T004 (layout.tsx) can run in parallel with T002 and T003
- T005–T007 are sequential (all in `app/page.tsx`)
- T012 and T013 (test stubs) can run in parallel (different test files)
- T017 and T018 can run in parallel (`CreditCounter.tsx` vs `UpgradePrompt.tsx`)
- T021 and T022 can run in parallel (`GeneratorPageClient.tsx` vs `page.tsx`)
- T024 and T025 can run in parallel (lint vs tsc — no shared state)

---

## Parallel Example: User Story 4 (Style Presets)

```bash
# Step 1 — Write tests in parallel (different files):
Task T012: StylePresets.test.tsx — chip toggle, aria-pressed, disabled
Task T013: GeneratorForm.test.tsx — presetKeywords prompt assembly

# Step 2 — Implement after tests written (sequential):
Task T014: Create StylePresets.tsx (new file — no conflicts)
Task T015: Wire StylePresets in GeneratorPageClient.tsx
Task T016: Add presetKeywords prop to GeneratorForm.tsx
```

---

## Implementation Strategy

### MVP First (US1 only — Landing Page)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Design System (T002–T004)
3. Complete Phase 3: Landing Page (T005–T007)
4. **STOP and VALIDATE**: Visit root URL — retro arcade landing page renders with pixel font, dark theme, CTA links
5. This is a shippable increment — the landing page redesign alone is meaningful

### Incremental Delivery

1. Phase 1 + 2 → Design system ready
2. Phase 3 (US1) → Landing page ships ✅
3. Phase 4 (US2) → Generator form with thumbnail ships ✅
4. Phase 5 (US3) → Skin preview polished ✅
5. Phase 6 (US4) → Style presets ship ✅
6. Phase 7 (US5) → Credit/upgrade UX polished ✅
7. Phase 8 (US6) → Responsive + a11y confirmed ✅
8. Phase 9 → Polish and PR

### Solo Developer Strategy

Work sequentially through phases 1 → 9. At each **Checkpoint**, verify the independent test criterion before continuing. If a checkpoint fails, fix before proceeding.

---

## Notes

- `[P]` tasks touch different files — they can be implemented in any order or simultaneously
- `[Story]` label maps each task to a specific user story for traceability
- T012/T013 test stubs MUST fail before T014–T016 implementation (constitution Principle II: TDD)
- T019 removes duplicate checkout fetch code — double-check `UpgradePrompt` handles its own fetch before deleting the inline code
- Object URL lifecycle: `URL.createObjectURL` in `handleFileChange`, `URL.revokeObjectURL` in `clearFile` AND in `useEffect` cleanup (T008)
- The `font-pixel` Tailwind utility class requires T003 (tailwind.config.ts) AND T004 (layout.tsx CSS variable) to both be complete
