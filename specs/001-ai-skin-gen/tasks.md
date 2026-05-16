---
description: "Task list for AI Minecraft Skin Generator"
---

# Tasks: AI Minecraft Skin Generator

**Input**: Design documents from `/specs/001-ai-skin-gen/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Tests**: Not explicitly requested in spec. Test framework setup is included in Phase 1. Individual test tasks are excluded per template rules; testing is enforced at PR time per the constitution (Principle II).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.
**Generation approach**: Gemini outputs a structured Region Color Map (hex codes per named UV region face) via `gemini-2.5-flash` text model with JSON schema. The skin-builder paints those colors onto a 64×64 PNG grid using top-lit shading. No image generation model is used.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on sibling tasks)
- **[Story]**: Which user story this task belongs to (US1–US5 from spec.md)

## Path Conventions

Web application — single Next.js 15 repository. All paths relative to repo root.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, tooling, and directory structure.

- [X] T001 Initialize Next.js 15 project with TypeScript (`npx create-next-app@latest . --typescript --tailwind --app --src-dir no --import-alias "@/*"`)
- [X] T002 Install all project dependencies: `@supabase/ssr @supabase/supabase-js drizzle-orm drizzle-kit @google/genai sharp stripe zod zod-to-json-schema tailwindcss @tailwindcss/typography shadcn-ui`
- [X] T003 [P] Configure ESLint with `@typescript-eslint` rules and Prettier with `prettier-plugin-tailwindcss` in `.eslintrc.json` and `.prettierrc`
- [X] T004 [P] Initialize shadcn/ui with `npx shadcn@latest init` and add components: button, input, textarea, label, card, badge, alert, separator
- [X] T005 Set up environment variable files: create `.env.local` with all required keys from `quickstart.md` and `.env.example` with placeholder values and inline documentation
- [X] T006 [P] Configure `drizzle.config.ts` at repo root pointing to `lib/db/schema.ts` and Supabase PostgreSQL connection string
- [X] T007 [P] Configure `next.config.ts` with Content-Security-Policy headers allowlisting AdSense domains (`pagead2.googlesyndication.com`, `adservice.google.com`, `googleads.g.doubleclick.net`, `tpc.googlesyndication.com`) per `quickstart.md` CSP section
- [X] T008 Create full directory structure as specified in `plan.md`: `app/(auth)/login`, `app/(auth)/signup`, `app/(app)/generate`, `app/api/generate/[id]/download`, `app/api/user/me`, `app/api/subscription/checkout`, `app/api/subscription/portal`, `app/api/webhooks/stripe`, `components/skin-generator`, `components/ads`, `lib/db`, `lib/supabase`, `public`
- [X] T009 [P] Set up Vitest for unit + integration tests: install `vitest @vitest/coverage-v8 @testing-library/react` and create `vitest.config.ts` with 80% coverage threshold per constitution Principle II
- [X] T010 [P] Create `public/ads.txt` with placeholder publisher line per `quickstart.md` (replace with real publisher ID when AdSense account is approved)

**Checkpoint**: Tooling ready. `npm run dev` starts without errors. `npm run lint` passes.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, Supabase configuration, auth infrastructure, and shared utilities that MUST be complete before any user story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T011 Implement all four Drizzle table schemas in `lib/db/schema.ts`: `users` (id, email, stripe_customer_id, generations_today, generations_reset_at, created_at, updated_at), `subscriptions` (id, user_id, stripe_subscription_id, stripe_price_id, stripe_current_period_end, status, created_at, updated_at), `skin_generations` (id, user_id, prompt, reference_image_path, result_path, status, error_message, created_at, completed_at), `webhook_events` (id, stripe_event_id, type, processed_at) — exact field types and constraints from `data-model.md`
- [ ] T012 Generate and run Drizzle migration: `npx drizzle-kit generate && npx drizzle-kit migrate` against Supabase PostgreSQL instance
- [ ] T013 Enable Row Level Security and create all RLS policies in Supabase SQL Editor as documented in `quickstart.md` Step 3b: `users_select_own`, `users_update_own`, `subscriptions_select_own`, `skin_generations_select_own`, and deny-all for `webhook_events`
- [ ] T014 Create the `on_auth_user_created` PostgreSQL trigger in Supabase SQL Editor per `quickstart.md` Step 3c — automatically inserts a row into `public.users` when a new `auth.users` record is created
- [ ] T015 Create Supabase Storage buckets: `skins` (generated skin PNGs) and `references` (uploaded reference images), both set to private with signed-URL access; configure 10 MB file size limit on `references` bucket
- [X] T016 [P] Implement `lib/supabase/client.ts` — browser-side Supabase client using `createBrowserClient` from `@supabase/ssr`, using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [X] T017 [P] Implement `lib/supabase/server.ts` — server-side Supabase client using `createServerClient` from `@supabase/ssr` with cookie adapter for Next.js App Router; export both an anon client and a service-role client using `SUPABASE_SERVICE_ROLE_KEY`
- [X] T018 [P] Implement `lib/db/index.ts` — Drizzle ORM client connected to Supabase PostgreSQL via `SUPABASE_SERVICE_ROLE_KEY` direct connection string; export typed `db` instance
- [X] T019 [P] Implement `lib/stripe.ts` — Stripe client singleton using `stripe` npm package with `STRIPE_SECRET_KEY`; export typed `stripe` instance
- [X] T020 Implement `middleware.ts` — auth guard using `@supabase/ssr` session cookie check; redirect unauthenticated requests to `/login` for all routes under `/(app)/` and `/api/generate`, `/api/user`, `/api/subscription`; allow unauthenticated access to `/(auth)/`, `/api/webhooks/stripe`, and public pages
- [X] T021 Create `app/(auth)/login/page.tsx` — login form with email and password fields using shadcn/ui Input and Button; calls `supabase.auth.signInWithPassword`; redirects to `/generate` on success; shows inline error on failure
- [X] T022 Create `app/(auth)/signup/page.tsx` — signup form with email and password fields; calls `supabase.auth.signUp`; shows success message with email verification prompt; links to login page
- [X] T023 [P] Create `app/layout.tsx` — root layout with HTML shell, Tailwind base styles, and a `{children}` slot; AdSense script injection will be added in US5 phase (T051); keep simple for now
- [X] T024 [P] Create `app/page.tsx` — minimal marketing landing page (SSG) with app name, one-line description, and a "Get Started" link to `/signup`; rendered as static HTML

**Checkpoint**: Database migrations applied, RLS active, auth working end-to-end. A user can sign up, be redirected to login, log in, and be redirected to `/generate` (which can show a placeholder). Unauthenticated access to `/generate` redirects to `/login`.

---

## Phase 3: User Story 1 - Text Description to Skin (Priority: P1) 🎯 MVP

**Goal**: A logged-in user enters a text description and receives a valid, downloadable 64×64 Minecraft skin PNG whose colors visually reflect the description.

**Independent Test**: Sign up, log in, enter "a knight in silver armor with a red cape", click Generate. Verify: (1) a 64×64 PNG preview is displayed, (2) the skin file downloads without errors, (3) the PNG can be imported into Minecraft without errors, (4) the user's generation count decrements by 1.

### Implementation for User Story 1

- [X] T025 [P] [US1] Define all Minecraft skin UV region constants in `lib/skin-regions.ts` — export a typed array of all ~76 named region faces (inner + outer layer), each with `name`, `x`, `y`, `width`, `height`, and `layer` (`'inner' | 'outer'`) fields; coordinates from the `minotar/skin-spec` UV map documented in `research.md`; inner regions include head faces, body faces, arm faces, leg faces; outer regions include hat, jacket, sleeve, and pants overlay faces
- [X] T026 [P] [US1] Define the Zod schema for the Region Color Map in `lib/region-color-map.ts` — schema accepts an object keyed by region name (all ~76 names); each value is an object with `base` (required hex string, e.g. `"#8B6914"`), `highlight` (optional hex string), `shadow` (optional hex string); inner layer regions are required fields; outer layer regions are optional (default transparent); export `RegionColorMap` TypeScript type inferred from the schema
- [X] T027 [US1] Implement `lib/skin-builder.ts` with three exported functions: (1) `fillRegion(buffer: Buffer, region: SkinRegion, base: string, highlight?: string, shadow?: string): void` — paints a rectangular UV region in a 64×64 RGBA raw buffer using top-lit shading (top pixel row = highlight, middle rows = base, bottom pixel row = shadow; if only base provided, fills entire region with base); (2) `buildSkinPng(colorMap: RegionColorMap): Promise<Buffer>` — allocates a 64×64 RGBA buffer, iterates all regions from `skin-regions.ts`, calls `fillRegion` for each, encodes result to PNG via Sharp; (3) `validateSkin(buffer: Buffer): Promise<boolean>` — decodes PNG metadata via Sharp and confirms dimensions are exactly 64×64
- [X] T028 [US1] Implement `lib/credits.ts` with two exported functions: (1) `hasActiveSubscription(userId: string): Promise<boolean>` — queries `subscriptions` table; returns true only if `status = 'active'` AND `stripe_current_period_end > now()`; (2) `checkAndDeductCredit(userId: string): Promise<{ allowed: boolean; remaining: number; reason?: string }>` — checks `generations_reset_at` date against current UTC date and resets `generations_today` to tier limit if a new day; then attempts atomic decrement with `WHERE generations_today < dailyLimit` guard; returns `{ allowed: false, remaining: 0, reason: 'no_credits' }` if guard fails; returns `{ allowed: true, remaining: N }` on success
- [X] T029 [US1] Implement `lib/gemini.ts` with one exported function: `generateRegionColorMap(prompt: string, referenceImageBase64?: string): Promise<RegionColorMap>` — builds Gemini request using `@google/genai` SDK with model `gemini-2.5-flash`; sets `responseMimeType: "application/json"` and `responseJsonSchema` from the Zod schema's JSON schema (via `zod-to-json-schema`); system instruction describes the Minecraft UV layout and instructs the model to output colors that match the user's description; parses response text as JSON; validates against Zod schema; on validation failure retries once (same request, no additional credit consumed); throws if second attempt also fails validation; reference image (if provided) is included as an `inlineData` part alongside the text prompt
- [X] T030 [US1] Implement `POST /api/generate` Route Handler in `app/api/generate/route.ts` — authenticate request via Supabase server client; call `checkAndDeductCredit`; if not allowed return 402 with `{ error: 'generation_limit_reached', message, resetAt }`; call `generateRegionColorMap(prompt)` (image handling added in US2); call `buildSkinPng(colorMap)`; call `validateSkin` and throw if invalid; upload PNG to Supabase Storage at `skins/{userId}/{generationId}.png`; insert `skin_generations` record with `status: 'completed'`; generate signed URL (1 hour) and return `{ generationId, status: 'completed', skinUrl, creditsRemaining }`; on AI or build error increment `generations_today` by 1 (credit refund), update `skin_generations` record with `status: 'failed'`, return 500 with `{ error: 'generation_failed', message }`
- [X] T031 [P] [US1] Implement `GET /api/user/me` Route Handler in `app/api/user/me/route.ts` — authenticate via Supabase server client; query `users` table joined with `subscriptions`; compute `creditsRemaining` and `dailyLimit` using `hasActiveSubscription`; perform daily reset check if `generations_reset_at` is before current UTC day; return `{ id, email, creditsRemaining, dailyLimit, isSubscriber, subscriptionEndsAt }`
- [X] T032 [P] [US1] Implement `GET /api/generate/[id]/download` Route Handler in `app/api/generate/[id]/download/route.ts` — authenticate request; query `skin_generations` by id; verify `user_id` matches authenticated user (return 403 if not); verify `status = 'completed'`; generate fresh 1-hour signed URL from Supabase Storage; return `{ url }`
- [X] T033 [P] [US1] Create `components/skin-generator/CreditCounter.tsx` — Client Component; accepts `creditsRemaining: number` and `dailyLimit: number` props; renders "{creditsRemaining} / {dailyLimit} generations remaining today" with a visual progress indicator; displays reset time ("Resets at midnight UTC") when `creditsRemaining === 0`
- [X] T034 [P] [US1] Create `components/skin-generator/GeneratorForm.tsx` — Client Component; renders a textarea for the text prompt (max 1000 chars with character counter) and a "Generate" button; on submit calls `POST /api/generate` via fetch; displays a loading spinner (visible within 300ms of submit, per constitution Principle III); calls `onResult(result)` callback with the API response on success; calls `onError(message)` on failure; disables form during in-flight request; accepts optional `disabled` prop (used when credits = 0)
- [X] T035 [P] [US1] Create `components/skin-generator/SkinPreview.tsx` — Client Component; accepts `skinUrl: string | null` and `generationId: string | null` props; when `skinUrl` is provided renders the 64×64 PNG at 8× zoom using CSS `image-rendering: pixelated` for crisp pixel-art display; shows a "Download" button that fetches `/api/generate/{id}/download` and triggers browser file save with filename `minecraft-skin-{timestamp}.png`; shows a "Regenerate" button that calls `onRegenerate()` callback; shows placeholder illustration when `skinUrl` is null
- [X] T036 [US1] Create `app/(app)/generate/page.tsx` — Server Component wrapper; fetches initial user data via `/api/user/me`; renders `CreditCounter`, `GeneratorForm`, and `SkinPreview` in a responsive layout; manages `skinUrl` / `generationId` state (lifted to page via client-side state in a `'use client'` wrapper component `GeneratorPageClient.tsx`); passes `onResult` from GeneratorForm to update SkinPreview; shows a dismissible alert banner when `creditsRemaining === 0` and renders disabled GeneratorForm

**Checkpoint**: Text-to-skin flow is fully functional end-to-end. A logged-in user can type a description, generate a skin, see the 8× zoomed preview, and download the PNG. Generation count decrements. Credit refund works on AI failure. All FR-001, FR-004, FR-004a, FR-004b, FR-005, FR-006, FR-007, FR-008, FR-008a, FR-010 are satisfied.

---

## Phase 4: User Story 2 - Image Reference to Skin (Priority: P2)

**Goal**: A logged-in user uploads a reference image (JPEG or PNG), and the AI extracts dominant colors per body area from the image and maps them to the corresponding skin region hex values when generating the skin.

**Independent Test**: Upload a photo of a character wearing a red outfit on a white background. Verify the generated skin has predominantly red colors in the body/arm/leg regions and appropriate skin-tone colors in the head region.

### Implementation for User Story 2

- [X] T037 [P] [US2] Extend `components/skin-generator/GeneratorForm.tsx` to add an optional image file input — add a file picker accepting `image/jpeg, image/png` with max 10 MB client-side size validation; display the selected filename and a clear button; include the file in the `FormData` when submitting to `POST /api/generate`; show a client-side error if the file exceeds 10 MB before sending
- [X] T038 [US2] Update `POST /api/generate` route in `app/api/generate/route.ts` to handle `multipart/form-data` — parse the uploaded file using `request.formData()`; validate file MIME type (`image/jpeg` or `image/png`) and size (≤ 10 MB); return 400 with `{ error: 'invalid_file', message }` on failure WITHOUT consuming a credit (satisfying FR-009); if valid, read file as `ArrayBuffer`, convert to base64 string, upload a copy to Supabase Storage at `references/{userId}/{generationId}.{ext}`, store path in `skin_generations.reference_image_path`; pass base64 string to `generateRegionColorMap`
- [X] T039 [US2] Update `lib/gemini.ts` `generateRegionColorMap` function to accept and use the optional `referenceImageBase64` parameter — when provided, add the reference image as an `inlineData` part with `mimeType: 'image/jpeg'` or `image/png`; update the system instruction to direct the model to extract dominant colors per body area from the reference image (face/skin tone → head regions, hair → head top, torso color → body/arm regions, leg color → leg regions) and use those as the primary hex values; the text prompt (if also provided) acts as refinement or style guidance on top of the extracted colors
- [ ] T040 [US2] Add acceptance scenario test path: verify that when both a reference image and a text description are provided, the API correctly passes both to `generateRegionColorMap` and returns a valid skin — manually test by uploading a reference image and adding a text refinement like "but make the hair blue"

**Checkpoint**: Image-to-skin flow works. Uploading a reference photo produces a skin with colors visibly matching the reference. Invalid files are rejected before credit deduction. FR-002, FR-003, FR-009 are satisfied.

---

## Phase 5: User Story 3 - Skin Preview (Priority: P3)

**Goal**: After generation, the user sees a crisp, zoomed pixel-art preview of the skin directly in the browser, can identify regions visually, and can download or regenerate from the preview without any additional navigation.

**Independent Test**: Generate a skin with a bright red description. The preview renders at 8× zoom with visible pixel-art crispness (no blurring). The Download button saves a file named `minecraft-skin-{timestamp}.png` to disk. Clicking Regenerate re-submits the same form inputs.

### Implementation for User Story 3

- [X] T041 [P] [US3] Add `image-rendering: pixelated` CSS property and explicit `width: 512px; height: 512px` (8× of 64px) to the `<img>` element in `components/skin-generator/SkinPreview.tsx`; add a region label overlay (optional visual aid) showing named body part areas as faint grid lines; ensure the container is responsive and collapses gracefully on mobile
- [X] T042 [P] [US3] Update `GET /api/generate/[id]/download` in `app/api/generate/[id]/download/route.ts` to include a `Content-Disposition: attachment; filename="minecraft-skin-{generationId}.png"` header in the signed URL redirect, or return the filename as part of the JSON response so the client can set the `download` attribute on the anchor tag used for saving
- [X] T043 [US3] Verify and harden the loading state in `components/skin-generator/GeneratorForm.tsx` — confirm the spinner/skeleton becomes visible within 300ms of the Generate button being clicked (use `requestAnimationFrame` timing if needed); add a progress message ("Generating your skin…") that updates after 5 seconds to "Still working, this can take up to 30 seconds…"

**Checkpoint**: Preview is crisp and correctly sized. Download works with a meaningful filename. Loading feedback is immediate and informative. FR-005, FR-006 are fully satisfied.

---

## Phase 6: User Story 5 - Generation Limits & Subscription (Priority: P5)

**Goal**: Free users see Google Ads and have a daily generation limit (3/day). When exhausted, they see an upgrade prompt. Subscribers have a higher limit (50/day) and no ads. Payment is handled via Stripe Checkout.

**Independent Test**: (1) As a free user, exhaust 3 generations — verify UpgradePrompt appears and further generation is blocked. (2) Complete Stripe Checkout with test card — verify subscription record created in DB, credit limit updates to 50, and ads no longer render on the page.

### Implementation for User Story 5

- [X] T044 [US5] Implement `POST /api/subscription/checkout` Route Handler in `app/api/subscription/checkout/route.ts` — authenticate request; check if user already has an active subscription (return 400 if so); retrieve or create Stripe customer (`stripe.customers.create` if `stripe_customer_id` is null, then save to `users` table); create Stripe Checkout session with `mode: 'subscription'`, `line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }]`, `success_url`, `cancel_url`; price is resolved from `STRIPE_PRO_PRICE_ID` env var (never from client input); return `{ url: session.url }`
- [X] T045 [P] [US5] Implement `POST /api/subscription/portal` Route Handler in `app/api/subscription/portal/route.ts` — authenticate request; verify user has a `stripe_customer_id`; create Stripe Billing Portal session; return `{ url: session.url }`
- [X] T046 [US5] Implement `POST /api/webhooks/stripe` Route Handler in `app/api/webhooks/stripe/route.ts` — parse raw request body using `await req.text()` (not `req.json()`); verify Stripe signature using `stripe.webhooks.constructEvent`; check `webhook_events` table for `stripe_event_id` duplicate (return 200 immediately if found); handle events: `customer.subscription.created` and `customer.subscription.updated` → upsert `subscriptions` table with `stripe_current_period_end`, `status`, `stripe_price_id`; if `status = 'active'` set `users.generations_today = 50`; `customer.subscription.deleted` → update `subscriptions.status = 'canceled'` (do not immediately revoke credits — `hasActiveSubscription` checks `stripe_current_period_end`); `invoice.payment_failed` → log warning; record event in `webhook_events` AFTER successful handling; return 200 for all cases including unknown event types
- [X] T047 [P] [US5] Create `components/skin-generator/UpgradePrompt.tsx` — Client Component; displayed when `creditsRemaining === 0` and user is not a subscriber; shows "You've used all 3 of today's free generations" message, a prominent "Upgrade to Pro" button that POSTs to `/api/subscription/checkout` and redirects to the returned URL, and a "Resets at midnight UTC" note; uses shadcn/ui Card and Button components
- [X] T048 [US5] Integrate `UpgradePrompt` into `app/(app)/generate/page.tsx` — conditionally render `UpgradePrompt` in place of the disabled `GeneratorForm` when `creditsRemaining === 0` AND `!isSubscriber`; add a "Manage subscription" link (POSTs to `/api/subscription/portal`) to the page header when `isSubscriber === true`
- [X] T049 [P] [US5] Create `components/ads/AdUnit.tsx` — Client Component; accepts `slot: string` prop; renders `<ins class="adsbygoogle">` with `data-ad-client` and `data-ad-slot` from `NEXT_PUBLIC_ADSENSE_CLIENT` env; calls `(window.adsbygoogle = window.adsbygoogle || []).push({})` in `useEffect` guarded by `typeof window !== 'undefined'`; adds `useEffect` dependency on `pathname` (from `usePathname`) so impression is re-registered on SPA route changes; in development (`NODE_ENV !== 'production'`) renders a grey placeholder div with fixed height 90px and label `[Ad - {slot}]` to prevent layout shift; wraps entire component with `min-height: 90px` container to prevent CLS
- [X] T050 [US5] Integrate `AdUnit` into `app/(app)/generate/page.tsx` — conditionally render one `AdUnit` banner slot at the top of the page for free users only (`!isSubscriber`); pass `slot` from a hardcoded constant (placeholder until real AdSense slot is assigned)
- [X] T051 [US5] Update `app/layout.tsx` to conditionally load the AdSense script — in the Server Component, call `getUser()` and `hasActiveSubscription()`; conditionally render `<Script src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client={NEXT_PUBLIC_ADSENSE_CLIENT}" strategy="afterInteractive" crossOrigin="anonymous" />` only when `!isSubscriber && NODE_ENV === 'production'`; note: during AdSense account verification period, temporarily load script unconditionally (see `quickstart.md` AdSense note) then revert

**Checkpoint**: Free users hit the limit, see UpgradePrompt, and can complete Stripe Checkout. Subscribers have 50/day limit, no ads, and can manage via billing portal. Webhook idempotency verified (replay a Stripe event — no duplicate rows in `webhook_events`). FR-015 through FR-026 satisfied.

---

## Phase 7: User Story 4 - Auth UX Polish (Priority: P4)

**Goal**: The login and signup flows have complete form validation, meaningful error messages, correct redirect behavior, and a logout action. The auth experience is smooth and accessible.

**Independent Test**: (1) Attempt login with wrong password — verify inline error "Invalid email or password" appears within 1 second. (2) Attempt signup with an existing email — verify "An account with this email already exists" error. (3) While logged in, visit `/login` — verify redirect to `/generate`. (4) Click logout — verify redirect to `/login`.

### Implementation for User Story 4

- [X] T052 [P] [US4] Add full form validation and error display to `app/(auth)/login/page.tsx` — client-side validation (non-empty email, non-empty password) before submit; map Supabase Auth error codes to user-friendly messages ("Invalid login credentials" → "Invalid email or password"); display errors inline below the relevant field using shadcn/ui's form error pattern; prevent double-submit while request is in flight
- [X] T053 [P] [US4] Add full form validation and error display to `app/(auth)/signup/page.tsx` — client-side: valid email format, password minimum 8 characters; map Supabase Auth errors: `user_already_exists` → "An account with this email already exists", `weak_password` → "Password must be at least 8 characters"; after successful signup show a confirmation message "Check your email to confirm your account" before redirecting
- [X] T054 [US4] Update `middleware.ts` to redirect already-authenticated users away from `/(auth)/login` and `/(auth)/signup` to `/generate` — prevents logged-in users from seeing the auth forms
- [X] T055 [P] [US4] Expand `app/page.tsx` marketing landing page — add feature highlights (AI skin generation, image reference support, subscription tiers), a "Sign Up Free" CTA button linking to `/signup`, and a "Log In" link; keep page static (SSG, no auth checks)
- [X] T056 [P] [US4] Add a header bar to `app/(app)/generate/page.tsx` — displays the app name/logo, user email, remaining credit count (from `CreditCounter`), and a "Log Out" button that calls `supabase.auth.signOut()` and redirects to `/login`

**Checkpoint**: Complete auth UX. Users can sign up, confirm email, log in with error handling, see their email in the header, and log out cleanly. Logged-in users cannot accidentally land on login/signup pages. FR-011 through FR-014 fully satisfied.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, error hardening, performance verification, and release readiness.

- [ ] T057 [P] Add WCAG 2.1 AA accessible labels to all interactive elements across `components/skin-generator/` and `app/(auth)/` — ensure every `<input>` has an associated `<label>`, every `<button>` has descriptive text or `aria-label`, and focus ring styles are visible; verify with keyboard-only navigation
- [ ] T058 [P] Audit all API Route Handlers (`app/api/**`) to confirm no raw stack traces, Supabase error objects, or internal codes are ever included in response bodies — all error responses must match the `ErrorResponse` schema from `contracts/openapi.yaml`
- [ ] T059 Verify skin generation P95 latency using a manual timing script — make 10 consecutive `POST /api/generate` calls with varied prompts and record total time from request to PNG URL returned; confirm all calls complete within 15 seconds (constitution Principle IV gate)
- [ ] T060 [P] Verify initial page load score — run Lighthouse audit on `/generate` (authenticated) and confirm "Time to Interactive" is under 3 seconds on simulated broadband (25 Mbps); address any issues found
- [ ] T061 [P] Run the full `quickstart.md` setup walkthrough from scratch in a clean environment — verify every step produces the documented result; update `quickstart.md` if any steps are incorrect or missing
- [ ] T062 [P] Manual end-to-end Minecraft import test — generate 5 skins with varied prompts, download each, import into Minecraft Java Edition skin slot, verify no import errors and skin displays on the character model; confirm `test-skin.png` in the repo root also imports cleanly as a baseline reference
- [ ] T063 Validate the outer layer (hat/jacket) transparency — generate a skin with a prompt like "wizard with a purple hat" and verify the hat region (outer layer) has non-transparent pixels while unused outer regions are fully transparent (alpha = 0) in the downloaded PNG

**Checkpoint**: App is release-ready. All constitution gates pass. Skin PNGs import into Minecraft correctly. Auth, generation, and subscription flows work end-to-end.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user story phases
- **US1 (Phase 3)**: Depends on Phase 2 — first implementable story
- **US2 (Phase 4)**: Depends on Phase 3 — extends `GeneratorForm` and `generateRegionColorMap`
- **US3 (Phase 5)**: Depends on Phase 3 — enhances `SkinPreview` and download flow
- **US5 (Phase 6)**: Depends on Phase 2 — Stripe webhooks write to the same `users`/`subscriptions` tables; can start in parallel with US1 after Phase 2 completes
- **US4 (Phase 7)**: Depends on Phase 2 — polishes auth pages built in Phase 2; can run in parallel with US1–US5
- **Polish (Phase 8)**: Depends on all prior phases

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no dependency on other user stories
- **US2 (P2)**: After US1 — extends the generation pipeline built in US1
- **US3 (P3)**: After US1 — enhances the preview and download components from US1
- **US5 (P5)**: After Phase 2 — independent of US1 (can develop Stripe/Ads in parallel with US1)
- **US4 (P4)**: After Phase 2 — auth UX polish is independent of skin generation

### Within Each User Story

- Shared libs (skin-builder, gemini, credits) before API route
- API route before UI components
- UI components before page integration

### Parallel Opportunities

All tasks within Phase 1 and Phase 2 marked `[P]` can run in parallel. Within each user story phase, all tasks marked `[P]` can run in parallel. US5 and US4 can run in parallel with US1–US3 after Phase 2 completes.

---

## Parallel Example: User Story 1

```
# After Phase 2 completes, launch in parallel:
T025 — lib/skin-regions.ts (UV constants)
T026 — lib/region-color-map.ts (Zod schema)
T033 — components/skin-generator/CreditCounter.tsx
T034 — components/skin-generator/GeneratorForm.tsx
T035 — components/skin-generator/SkinPreview.tsx

# After T025 + T026 complete, launch in parallel:
T027 — lib/skin-builder.ts (depends on T025)
T028 — lib/credits.ts
T031 — app/api/user/me/route.ts
T032 — app/api/generate/[id]/download/route.ts

# After T026 + T027 complete:
T029 — lib/gemini.ts (depends on T026 schema)

# After T028 + T029 + T027 complete:
T030 — app/api/generate/route.ts

# After T030 + T033 + T034 + T035 complete:
T036 — app/(app)/generate/page.tsx (integration)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL** — blocks everything)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Can a user sign up, log in, type a description, generate a skin, preview it, and download it?
5. Deploy to Vercel and share for feedback

### Incremental Delivery

1. Setup + Foundational → login/signup works, DB ready
2. US1 → core text-to-skin pipeline working (MVP!)
3. US2 → image reference support added
4. US3 → preview polish (crisp zoom, better filename)
5. US5 → subscription, limits, ads live
6. US4 → auth UX hardened
7. Polish → production-ready

### Suggested MVP Scope

Phases 1–3 (T001–T036) = **36 tasks** = fully working skin generator with auth and generation. Ship this and get user feedback before adding subscription, ads, and image references.

---

## Notes

- `[P]` tasks = operate on different files with no sibling dependencies; safe to run in parallel
- `[Story]` label maps each task to a user story for traceability
- The generation pipeline uses `gemini-2.5-flash` (text model + structured JSON output) — **not** an image generation model. See `research.md` Decision 1 and spec Clarifications section.
- Outer layer regions in the Region Color Map are optional; default to fully transparent (alpha = 0) when omitted
- Top-lit shading rule: top pixel row(s) = highlight, middle rows = base, bottom row(s) = shadow (see FR-004b)
- Reference image processing: Gemini extracts dominant colors per body area and maps them to skin region hex values (see FR-002, research.md Decision 1)
- Credit deduction uses atomic DB guard (`WHERE generations_today < dailyLimit`) — never a read-then-write pattern
- Stripe webhook handler must use `req.text()` not `req.json()` for signature verification
- Always return HTTP 200 from the Stripe webhook handler, including for duplicate events
- Commit after each completed task or logical group before moving to the next
- Stop at each phase checkpoint to validate the story works independently before proceeding
