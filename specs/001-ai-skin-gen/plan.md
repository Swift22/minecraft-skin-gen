# Implementation Plan: AI Minecraft Skin Generator

**Branch**: `001-ai-skin-gen` | **Date**: 2026-02-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-skin-gen/spec.md`

---

## Summary

Build a web application that lets authenticated users generate valid Minecraft skin PNG files (64×64 pixels, standard UV layout) by providing a text description and/or a reference image. The AI backbone is Google Gemini (`gemini-2.5-flash-image` for direct image generation, `gemini-2.5-flash` for a JSON color-map fallback). The app is monetized with a free tier (3 generations/day + Google Ads) and a paid subscription tier (50 generations/day, no ads), implemented with Stripe Billing. The full stack is Next.js 15 (App Router) + TypeScript + Supabase (Auth + PostgreSQL + Storage) + Drizzle ORM, deployed on Vercel.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 18.17.0+
**Primary Dependencies**:
- `next` 15 (App Router)
- `@supabase/ssr` + `@supabase/supabase-js` (auth + database + storage)
- `drizzle-orm` + `drizzle-kit` (ORM + migrations)
- `@google/genai` (Gemini API — image generation + structured output)
- `sharp` (PNG post-processing — nearest-neighbor resize to 64×64)
- `stripe` (Stripe Billing SDK)
- `zod` (input validation + Gemini structured output schemas)
- `tailwindcss` + `shadcn/ui` (styling + accessible components)

**Storage**: Supabase PostgreSQL (Drizzle-managed schema), Supabase Storage (skin PNGs + reference images)
**Testing**: Vitest (unit + integration), Playwright (E2E for critical user flows)
**Target Platform**: Vercel (serverless, Node.js runtime), browser (modern Chrome/Firefox/Safari)
**Project Type**: Web application (full-stack Next.js — single repository)
**Performance Goals**:
- Skin generation P95 ≤ 15 seconds (constitution Principle IV)
- Initial page load interactive ≤ 3 seconds on ≥25 Mbps connection (Principle IV)
- Loading feedback visible within 300ms of triggering action (Principle III)
**Constraints**:
- Generation API calls are server-side only (never expose Gemini or Stripe keys to client)
- Credit deduction is atomic (DB-level guard, not a read-then-write)
- Stripe webhook handler uses raw request body for signature verification
- Skin output is exactly 64×64 RGBA PNG; any deviation is a hard error
**Scale/Scope**: MVP for personal/hobbyist use; free tier: 50K MAU (Supabase); target <1K active users at launch

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I — Code Quality

| Check | Status | Notes |
|-------|--------|-------|
| Single responsibility per function/module | PASS | Modules: `gemini.ts`, `skin-builder.ts`, `credits.ts`, `stripe.ts` each own one concern |
| Descriptive naming, no unexplained abbreviations | PASS | `px`, `RGB`, `uuid`, `RGBA` are universally understood; all others spelled out |
| No dead code before merge | PASS | New project; enforced via ESLint `no-unused-vars` |
| Cyclomatic complexity ≤ 10 per function | PASS | Generation pipeline is broken into small, composable steps; credit check is ≤5 branches |
| All public APIs documented | PASS | Route Handlers documented via JSDoc and OpenAPI spec at `contracts/openapi.yaml` |

**Verdict: PASS — No violations.**

### Principle II — Testing Standards

| Check | Status | Notes |
|-------|--------|-------|
| Unit tests for pure functions and helpers | REQUIRED | `fillRegion`, `hasActiveSubscription`, `checkAndDeductCredit`, `validateSkinDimensions` |
| Integration tests for every user-facing workflow | REQUIRED | Generation endpoint, Stripe webhook handler, auth guard middleware |
| New features merged only with passing tests | ENFORCED | CI gate on all PRs |
| Minimum 80% coverage for new code | REQUIRED | Enforced via Vitest coverage threshold |
| Deterministic tests, no flaky tests tolerated | REQUIRED | Gemini API calls mocked in tests |

**Verdict: PASS — Testing plan is complete. TDD workflow required (tests written before implementation).**

### Principle III — UX Consistency

| Check | Status | Notes |
|-------|--------|-------|
| Unified design tokens | PASS | Tailwind config + shadcn/ui design tokens; no one-off overrides |
| Error states with actionable guidance | PASS | All API errors map to user-facing messages (see openapi.yaml error examples) |
| Loading feedback within 300ms | REQUIRED | Generation takes 3–8s; must show a progress indicator immediately on submit |
| Consistent interaction patterns | PASS | shadcn/ui components maintain behavioral consistency |
| WCAG 2.1 AA accessibility | REQUIRED | All interactive elements (buttons, inputs, links) must meet contrast + keyboard nav |

**Verdict: PASS — Specific attention required on generation loading state (streaming progress indicator, not a static spinner) to satisfy Principle IV's streaming requirement and Principle III's 300ms feedback window.**

### Principle IV — Performance

| Check | Status | Notes |
|-------|--------|-------|
| Skin generation P95 ≤ 15s | CONDITIONAL PASS | `gemini-2.5-flash-image` typical: 3–8s, P95: ~12s. Within budget for single-phase path. Multi-phase hybrid approach (research Decision 1) may exceed 15s in worst case; reserved for a future quality tier, not MVP. |
| Initial page load ≤ 3s | PASS | Landing page is SSG; authenticated routes are Server Components with minimal JS |
| Image assets appropriately compressed | PASS | Skin PNGs are 64×64 (~2–5 KB) — inherently small; no optimization needed |
| Performance regressions >10% investigated before merge | REQUIRED | Benchmark suite needed for generation endpoint |
| Performance benchmarks in CI | REQUIRED | `npm run bench:generate` must be added to CI pipeline |

**Verdict: PASS — Single-phase Gemini image generation keeps P95 within the 15s budget. Multi-phase approach is explicitly excluded from MVP scope. Benchmark suite must be implemented alongside the generation endpoint.**

### Post-Design Re-check

*Completed after Phase 1 — no new violations introduced by the design. The 4-table data model is appropriately minimal. The 6-endpoint API surface matches the spec's functional requirements 1:1 with no over-engineering.*

---

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-skin-gen/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── openapi.yaml     # Phase 1 output — API contract
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx                          # Login form (Supabase Auth)
│   └── signup/
│       └── page.tsx                          # Registration form
├── (app)/
│   └── generate/
│       └── page.tsx                          # Skin generator (protected route)
├── api/
│   ├── generate/
│   │   ├── route.ts                          # POST /api/generate
│   │   └── [id]/
│   │       └── download/
│   │           └── route.ts                  # GET /api/generate/:id/download
│   ├── user/
│   │   └── me/
│   │       └── route.ts                      # GET /api/user/me
│   ├── subscription/
│   │   ├── checkout/
│   │   │   └── route.ts                      # POST /api/subscription/checkout
│   │   └── portal/
│   │       └── route.ts                      # POST /api/subscription/portal
│   └── webhooks/
│       └── stripe/
│           └── route.ts                      # POST /api/webhooks/stripe
├── layout.tsx                                # Root layout (AdSense script, auth)
└── page.tsx                                  # Marketing landing page (SSG)

components/
├── skin-generator/
│   ├── GeneratorForm.tsx                     # Prompt + image upload form
│   ├── SkinPreview.tsx                       # Generated skin preview + download
│   ├── CreditCounter.tsx                     # Remaining credits display
│   └── UpgradePrompt.tsx                     # CTA shown when credits exhausted
├── ads/
│   └── AdUnit.tsx                            # Google AdSense unit (Client Component)
└── ui/                                       # shadcn/ui components

lib/
├── db/
│   ├── schema.ts                             # Drizzle schema (source of truth)
│   └── index.ts                              # Drizzle client (Supabase Postgres)
├── supabase/
│   ├── client.ts                             # Browser Supabase client
│   └── server.ts                             # Server Supabase client (service role)
├── gemini.ts                                 # generateSkin() — Gemini API wrapper
├── skin-builder.ts                           # resizeTo64x64() + fillRegion() + validateSkin()
├── credits.ts                                # hasActiveSubscription() + checkAndDeductCredit()
└── stripe.ts                                 # Stripe client singleton

middleware.ts                                 # Auth guard — redirects unauthenticated users

public/
└── ads.txt                                   # Google AdSense publisher verification

tests/
├── unit/
│   ├── skin-builder.test.ts                  # fillRegion, validateSkin
│   ├── credits.test.ts                       # hasActiveSubscription, checkAndDeductCredit
│   └── gemini.test.ts                        # generateSkin (Gemini API mocked)
├── integration/
│   ├── generate.test.ts                      # POST /api/generate end-to-end
│   ├── webhooks-stripe.test.ts               # Stripe webhook handler + idempotency
│   └── subscription.test.ts                  # Checkout + portal session creation
└── e2e/
    ├── auth.spec.ts                          # Sign-up, login, logout
    ├── generate.spec.ts                      # Full generation flow
    └── subscription.spec.ts                  # Upgrade prompt + Stripe redirect

drizzle.config.ts                             # Drizzle Kit configuration
next.config.ts                                # Next.js config (CSP headers, AdSense domains)
```

**Structure Decision**: Web application (Option 2 variant — single Next.js repository containing both frontend and backend via App Router). No separate backend service is needed because all server-side logic (Gemini calls, Stripe, credit gating) runs in Next.js Route Handlers. This keeps the deployment surface to a single Vercel project.

---

## Complexity Tracking

> No constitution violations require justification. The design uses standard patterns throughout: a single Next.js app, one database, one storage provider, one AI provider, and one payment provider. No abstraction layers, Repository pattern, or additional projects have been introduced beyond what the feature directly requires.
