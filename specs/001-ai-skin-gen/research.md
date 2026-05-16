# Research: AI Minecraft Skin Generator

**Feature**: `001-ai-skin-gen`
**Phase**: 0 — Research
**Date**: 2026-02-21

---

## Decision 1: Skin Generation Strategy

**Decision**: Use `gemini-2.5-flash-image` (native image output) as the primary generation path, with Sharp for post-processing. Use a JSON color-map via `gemini-2.5-flash` as a fallback for reliability.

**Rationale**:
Gemini does not expose a parameter to control output image dimensions — all image-generation models produce at 1024×1024 by default. There is no native 64×64 output. The solution is:
1. Call `gemini-2.5-flash-image` with `responseModalities: ["TEXT", "IMAGE"]`
2. Pass the user's text prompt and/or reference image as `inlineData` parts
3. Also pass `skin-chart.png` (already in the project root) as a third `inlineData` part — the model sees the UV layout and matches it
4. Receive base64-encoded PNG in the response
5. Resize from 1024×1024 → 64×64 using Sharp with `kernel: 'nearest'` (nearest-neighbor preserves pixel-art block edges)
6. Validate dimensions before serving

**Prompt engineering requirement**: The system prompt must explicitly state the Minecraft UV flat-sprite-sheet format and reference the skin chart image. The Minecraft UV coordinate grid (per `minotar/skin-spec`):

```
Head inner:  Top(8,0)-(16,8), Front(8,8)-(16,16), Right(0,8)-(8,16), Left(16,8)-(24,16), Back(24,8)-(32,16)
Head layer2: Right(32,8)-(40,16), Front(40,8)-(48,16), Left(48,8)-(56,16), Back(56,8)-(64,16)
Torso:       Top(20,16)-(28,20), Front(20,20)-(28,32), Right(16,20)-(20,32), Left(28,20)-(32,32), Back(32,20)-(40,32)
Right Arm:   Top(44,16)-(48,20), Front(44,20)-(48,32), Right(40,20)-(44,32), Left(48,20)-(52,32), Back(52,20)-(56,32)
Right Leg:   Top(4,16)-(8,20), Front(4,20)-(8,32), Right(0,20)-(4,32), Left(8,20)-(12,32), Back(12,20)-(16,32)
Left Arm:    Top(36,48)-(40,52), Front(36,52)-(40,64), Right(32,52)-(36,64), Left(40,52)-(44,64), Back(44,52)-(48,64)
Left Leg:    Top(20,48)-(24,52), Front(20,52)-(24,64), Right(16,52)-(20,64), Left(24,52)-(28,64), Back(28,52)-(32,64)
```

**Fallback path (JSON color-map)**: If the primary path produces an invalid or clearly wrong image (detected post-resize), the server retries using `gemini-2.5-flash` (text model) with structured JSON output (`responseMimeType: "application/json"`, Zod schema). This returns a color palette per region, which is then painted programmatically via Sharp onto a 64×64 RGBA buffer using `fillRegion()`. This guarantees layout correctness but produces flat solid-color skins.

**Typical response times**:
- `gemini-2.5-flash-image`: 3–8s typical, ~12s P95
- Sharp resize + encode (64×64): <20ms
- End-to-end: well within the 15s P95 constitution target for the primary path

**Alternatives considered**:
- *Imagen 4*: Text-to-image only; does not accept reference images as visual input. Ruled out because User Story 2 (image reference upload) requires multimodal vision input.
- *Pure JSON color-map (no image model)*: Guaranteed layout correctness but visually flat (solid blocks per region). Retained as fallback, not primary, because it cannot achieve SC-003 (85% of skins visually reflect intent).
- *Two-phase hybrid*: Text model extracts an art direction brief (Phase 1), then image model generates from that brief (Phase 2). Higher quality ceiling but ~2× latency. Reserved for a future quality tier, not MVP.

---

## Decision 2: Tech Stack

**Decision**: Next.js 15 (App Router) + TypeScript + Supabase (Auth + PostgreSQL + Storage) + Drizzle ORM + Stripe Billing + Google AdSense + Tailwind CSS + shadcn/ui, deployed on Vercel.

**Rationale**:

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 15 App Router | Full-stack in one repo; API routes co-located; hybrid SSG/SSR; first-class Vercel deployment; best Gemini/Stripe/Supabase ecosystem support |
| Language | TypeScript | Type safety across API routes, schema, and client components; mandatory given constitution Principle I (Code Quality) |
| Auth | Supabase Auth | 50K MAU free tier; cookie-based sessions via `@supabase/ssr`; native integration with Supabase Postgres; no separate vendor or self-managed JWT needed |
| Database | Supabase PostgreSQL | Co-located with auth; 500 MB free; Row Level Security prevents data leaks; no separate DB vendor |
| ORM | Drizzle | Minimal bundle size; <500ms serverless cold start (vs Prisma's heavier runtime); SQL-close API; excellent Supabase Postgres compatibility |
| File storage | Supabase Storage | Same vendor as auth + DB; 1 GB free; stores reference image uploads and generated skin PNGs; signed URLs for access control |
| AI | `@google/genai` SDK | Official Google Gen AI JS SDK; supports `gemini-2.5-flash-image` native image generation; accepts inline base64 image parts for multimodal input |
| Image processing | Sharp | Native bindings via libvips; 4–5× faster than Jimp; nearest-neighbor resize for pixel-perfect 64×64 output; widely used in Next.js API routes |
| Payments | Stripe Billing | Lower transaction fees than Lemon Squeezy (2.9% + $0.30 vs 5% + $0.50); best-in-class Next.js SDK; full subscription webhook lifecycle |
| Ads | Google AdSense | User-specified; loaded via `next/script strategy="afterInteractive"`; conditionally excluded for subscribers |
| Styling | Tailwind CSS + shadcn/ui | Design token system (Principle III); accessible components (WCAG 2.1 AA); zero runtime CSS |
| Hosting | Vercel Hobby | Zero-config Next.js deployment; free for MVP; automatic preview deployments |

**Alternatives considered**:
- *Remix*: Strong mutations/forms model but narrower ecosystem; Next.js hybrid rendering better fits the mix of static landing + dynamic authenticated generator
- *Separate SPA + Express backend*: Doubles deployment complexity; no shared types without extra tooling; no benefit given the Gemini API is called over HTTP anyway
- *Clerk for auth*: Fastest DX but 10K MAU free tier vs Supabase's 50K; separate DB vendor still required
- *Prisma for ORM*: Heavier runtime; serverless cold start concern; Drizzle preferred for edge/serverless deployments
- *Lemon Squeezy for payments*: Higher per-transaction fee; Stripe's global adoption and Next.js documentation is superior

---

## Decision 3: Subscription + Credit Gating Pattern

**Decision**: Store subscription state in a Drizzle-managed `subscriptions` table; enforce credit limits server-side in Next.js Route Handlers using an atomic database update with a `WHERE credits >= 1` guard.

**Rationale**:
- Credits are never evaluated client-side. The Route Handler at `POST /api/generate` checks and atomically decrements credits before calling Gemini.
- Stripe webhooks update subscription state via `customer.subscription.created/updated/deleted` events handled in `POST /api/webhooks/stripe`.
- Idempotency is enforced via a `webhook_events` table keyed on Stripe's `event.id`; duplicate events return HTTP 200 without reprocessing.
- Daily reset logic: compare `generations_reset_at` date to current UTC date; if different, reset `generations_today` to tier limit before checking.
- Subscription validity check: `status === 'active' AND stripe_current_period_end > now()` — the period-end check catches the lag between Stripe's cancellation event and status propagation.
- FR-020 (no credit loss on system error): the Route Handler increments the credit back if the Gemini call throws.

**Alternatives considered**:
- *Client-reported credit state*: Never acceptable; trivially bypassed.
- *Stripe metered billing*: More flexible for usage-based pricing but significantly more complex to implement and unsuitable for a simple daily credit model.

---

## Decision 4: Google AdSense Integration Pattern

**Decision**: Load the AdSense script via `next/script strategy="afterInteractive"` in the root layout, gated by `!isSubscriber` server-side. Individual ad units are Client Components that call `window.adsbygoogle.push({})` in `useEffect`, with a `pathname` dependency to re-register impressions on soft navigation.

**Key pitfalls documented**:
1. Never call `adsbygoogle.push()` during SSR — always guard with `typeof window !== 'undefined'` and `useEffect`.
2. Return 200 from Stripe webhooks even on duplicate events — returning 4xx triggers retries indefinitely.
3. Use `req.text()` (not `req.json()`) in the Stripe webhook Route Handler for raw body access during signature verification.
4. Place `ads.txt` in `public/ads.txt` at repo root for AdSense account verification.
5. Reserve fixed height for ad slots (e.g., `min-height: 90px`) to prevent CLS (Core Web Vitals).
6. During the AdSense account verification period, the script must be present site-wide (not subscriber-gated). Switch to fully conditional after approval.

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # server-side only

# Gemini
GEMINI_API_KEY=...             # already in .env

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# AdSense
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXXX

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## Open Questions (None — All Resolved)

All NEEDS CLARIFICATION items from the spec have been resolved:
- FR-011: Full login/auth system → Supabase Auth
- SC-006: No iterative refinement → each generation is standalone

No further clarification needed before Phase 1.
