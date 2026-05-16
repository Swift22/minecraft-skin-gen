# Quickstart: AI Minecraft Skin Generator

**Feature**: `001-ai-skin-gen`
**Branch**: `001-ai-skin-gen`

---

## Prerequisites

- Node.js 18.17.0 or later
- A [Supabase](https://supabase.com) project (free tier)
- A [Stripe](https://stripe.com) account (free to start)
- A Google Gemini API key (already in `.env` as `GEMINI_API_KEY`)
- Stripe CLI (for local webhook testing): `winget install Stripe.StripeCLI`

---

## 1. Install Dependencies

```bash
npm install
```

Key packages this project uses:

| Package | Purpose |
|---------|---------|
| `next` | Full-stack framework |
| `@supabase/ssr` | Supabase Auth with cookie-based sessions for Next.js |
| `@supabase/supabase-js` | Supabase client |
| `drizzle-orm` | Database ORM |
| `drizzle-kit` | Schema migrations |
| `@google/genai` | Gemini API (image generation + structured output) |
| `sharp` | Image processing (resize to 64×64 PNG) |
| `stripe` | Stripe Billing SDK |
| `zod` | Runtime validation (API inputs, Gemini structured output) |
| `tailwindcss` | Styling |

---

## 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
# Supabase — from your Supabase project dashboard → Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...          # Never expose to client

# Gemini — already set in .env
GEMINI_API_KEY=...

# Stripe — from Stripe Dashboard → Developers → API Keys
STRIPE_SECRET_KEY=sk_test_...          # Use sk_test_ for local dev
STRIPE_WEBHOOK_SECRET=whsec_...        # Set after step 5 (Stripe CLI)
STRIPE_PRO_PRICE_ID=price_...          # Create in Stripe Dashboard
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# AdSense — from AdSense dashboard (leave blank for local dev)
NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXXX

# App URL — used for Stripe redirect URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Database Setup

### 3a. Run Drizzle Migrations

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

This creates the four tables in your Supabase PostgreSQL database:
- `users`
- `subscriptions`
- `skin_generations`
- `webhook_events`

### 3b. Enable Row Level Security

In the Supabase SQL Editor, run:

```sql
-- Enable RLS on all app tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE skin_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- users: each user can read and update their own row
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- subscriptions: each user can read their own subscription
CREATE POLICY "subscriptions_select_own" ON subscriptions FOR SELECT USING (auth.uid() = user_id);

-- skin_generations: each user can read their own generations
CREATE POLICY "skin_generations_select_own" ON skin_generations FOR SELECT USING (auth.uid() = user_id);

-- webhook_events: no client access (service role only)
-- (no policies — defaults to deny all for authenticated clients)
```

### 3c. Create a Supabase Auth Trigger

When a user signs up, automatically insert a row into the public `users` table:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();
```

### 3d. Create Supabase Storage Buckets

In the Supabase dashboard → Storage, create two private buckets:
- `skins` — stores generated 64×64 PNG skin files
- `references` — stores user-uploaded reference images

Set both to **private** (signed URLs required for access).

---

## 4. Create a Stripe Product and Price

In the Stripe Dashboard:
1. Products → Add product → Name: "Minecraft Skin Generator Pro"
2. Add a recurring price: e.g., $4.99/month
3. Copy the **Price ID** (`price_...`) → set as `STRIPE_PRO_PRICE_ID`

---

## 5. Set Up Local Stripe Webhook Forwarding

```bash
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` value shown and set it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## 6. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 7. Test the Key Flows

### Test: Skin generation (text input)

```bash
# Requires a valid Supabase session cookie — use the browser after signing up
# Or test via the UI at http://localhost:3000/generate
```

### Test: Generation limit enforcement

Sign up with a free account, generate 3 skins, then attempt a 4th. The UI should block the generation and show the upgrade prompt.

### Test: Stripe subscription flow

1. Click "Upgrade" → redirects to Stripe Checkout (use test card `4242 4242 4242 4242`)
2. Complete checkout → redirected back to the app
3. Verify `subscriptions` table has a new row with `status = 'active'`
4. Verify generation limit is now 50/day

### Test: Webhook idempotency

Replay a Stripe event using the CLI:
```bash
stripe events resend evt_...
```
Verify the `webhook_events` table does not get a duplicate row and the handler logs "already processed."

---

## 8. Key File Locations

```
app/
├── (auth)/login/page.tsx          # Login page
├── (auth)/signup/page.tsx         # Sign-up page
├── (app)/generate/page.tsx        # Skin generator (protected)
├── api/
│   ├── generate/route.ts          # POST — skin generation endpoint
│   ├── generate/[id]/download/route.ts  # GET — signed skin download URL
│   ├── user/me/route.ts           # GET — current user + credits
│   ├── subscription/checkout/route.ts   # POST — Stripe checkout session
│   ├── subscription/portal/route.ts     # POST — Stripe portal session
│   └── webhooks/stripe/route.ts         # POST — Stripe webhook handler
│
lib/
├── db/schema.ts                   # Drizzle schema (source of truth for DB)
├── db/index.ts                    # Drizzle client
├── supabase/client.ts             # Browser Supabase client
├── supabase/server.ts             # Server Supabase client (uses service role)
├── gemini.ts                      # Gemini API wrapper (generateSkin function)
├── skin-builder.ts                # Sharp-based 64x64 PNG construction + resize
├── credits.ts                     # hasActiveSubscription + checkAndDeductCredit
└── stripe.ts                      # Stripe client singleton

middleware.ts                      # Auth guard — redirects /generate to /login if no session
```

---

## 9. Constitution Gates (must pass before merging)

Before raising a pull request, verify:

- [ ] `npm run lint` — zero errors
- [ ] `npm run test` — all tests pass, coverage ≥ 80% for new code
- [ ] `npm run build` — production build succeeds
- [ ] Skin generation P95 latency is under 15 seconds (test with `npm run bench:generate`)
- [ ] Initial page load renders interactive content within 3 seconds (Lighthouse)
- [ ] No raw stack traces or internal error codes exposed to the UI
- [ ] All interactive elements meet WCAG 2.1 AA contrast requirements
