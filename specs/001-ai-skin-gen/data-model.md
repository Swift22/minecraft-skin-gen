# Data Model: AI Minecraft Skin Generator

**Feature**: `001-ai-skin-gen`
**Phase**: 1 — Design
**Date**: 2026-02-21

---

## Overview

Four tables in PostgreSQL (via Supabase), managed by Drizzle ORM. Supabase Auth manages the `auth.users` table internally; the `users` public table mirrors the auth user's ID and adds app-specific fields.

---

## Entity: `users`

Mirrors `auth.users.id` from Supabase Auth. Stores subscription status and generation credit tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, references `auth.users(id)` | Supabase Auth user ID |
| `email` | `text` | NOT NULL, UNIQUE | User's email address |
| `stripe_customer_id` | `text` | UNIQUE, nullable | Stripe customer ID for payment association |
| `generations_today` | `integer` | NOT NULL, default `0` | Running count for the current reset period |
| `generations_reset_at` | `timestamptz` | NOT NULL, default `now()` | Last time the daily counter was reset |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Account creation timestamp |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last update timestamp |

**Validation rules**:
- `email` must be a valid email address (enforced at Supabase Auth level)
- `generations_today` must be `>= 0`
- `generations_reset_at` must be `<= now()`

**Derived values** (not stored):
- `is_subscriber`: computed from `subscriptions` table — `status = 'active' AND stripe_current_period_end > now()`
- `daily_limit`: 3 if free user, 50 if active subscriber
- `credits_remaining`: `daily_limit - generations_today` (after reset check)

---

## Entity: `subscriptions`

One-to-one with `users`. Created/updated by Stripe webhook events. Represents the user's active or historical subscription state.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Internal record ID |
| `user_id` | `uuid` | NOT NULL, UNIQUE, FK → `users(id)` | Owning user |
| `stripe_subscription_id` | `text` | NOT NULL, UNIQUE | Stripe subscription object ID (`sub_...`) |
| `stripe_price_id` | `text` | NOT NULL | Stripe price ID associated with the subscription |
| `stripe_current_period_end` | `timestamptz` | NOT NULL | When the current billing period ends; subscription remains valid until this date even after cancellation |
| `status` | `text` | NOT NULL | `active` \| `canceled` \| `past_due` \| `unpaid` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | When the subscription record was first created |
| `updated_at` | `timestamptz` | NOT NULL, default `now()` | Last webhook update timestamp |

**State transitions**:
```
[no record] → active         (customer.subscription.created, status=active)
active → past_due            (invoice.payment_failed → Stripe marks subscription)
past_due → active            (invoice.payment_succeeded)
active → canceled            (customer.subscription.deleted — fires at period end)
```

**Access rule**: A user is considered a subscriber when `status = 'active' AND stripe_current_period_end > NOW()`. The period-end check handles the window between cancellation and the end of the paid period.

---

## Entity: `skin_generations`

Audit log of every skin generation attempt. Used for debugging and (future) skin history features.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Record ID |
| `user_id` | `uuid` | NOT NULL, FK → `users(id)` | User who initiated the generation |
| `prompt` | `text` | nullable | Text description provided by the user |
| `reference_image_path` | `text` | nullable | Supabase Storage path for the uploaded reference image |
| `result_path` | `text` | nullable | Supabase Storage path for the generated skin PNG |
| `status` | `text` | NOT NULL, default `'pending'` | `pending` \| `completed` \| `failed` |
| `error_message` | `text` | nullable | Error detail if `status = 'failed'` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Generation request timestamp |
| `completed_at` | `timestamptz` | nullable | When the result was written |

**Validation rules**:
- At least one of `prompt` or `reference_image_path` must be non-null (enforced at application layer)
- `result_path` is set only when `status = 'completed'`
- `error_message` is set only when `status = 'failed'`

---

## Entity: `webhook_events`

Idempotency table for Stripe webhook processing. Prevents double-processing of retried events.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Record ID |
| `stripe_event_id` | `text` | NOT NULL, UNIQUE | Stripe event ID (`evt_...`) — the idempotency key |
| `type` | `text` | NOT NULL | Stripe event type (e.g., `customer.subscription.created`) |
| `processed_at` | `timestamptz` | NOT NULL, default `now()` | When this event was successfully processed |

**Rule**: A webhook handler MUST check for an existing `stripe_event_id` before processing. If found, return HTTP 200 immediately without processing. Record the event only AFTER successful handling. If handling throws, do NOT record — allow Stripe to retry.

---

## Entity: `Minecraft Skin PNG` (file, not database row)

Stored in Supabase Storage under the `skins` bucket. Path format: `skins/{user_id}/{generation_id}.png`.

| Property | Value |
|----------|-------|
| Format | PNG |
| Dimensions | 64 × 64 pixels |
| Color depth | 32-bit RGBA |
| UV layout | Standard Minecraft skin (Java Edition) |
| Outer layer | Supported (hat, jacket, sleeves, pants regions are valid) |

The `result_path` column in `skin_generations` stores the Supabase Storage object path. A signed URL is generated server-side at download time and is not persisted.

---

## Entity: `Reference Image` (file, not database row)

Stored in Supabase Storage under the `references` bucket. Path format: `references/{user_id}/{generation_id}.{ext}`.

| Property | Value |
|----------|-------|
| Accepted formats | JPEG, PNG |
| Maximum size | 10 MB |
| Retention | Deleted after generation completes (or after 24 hours for failed generations) |

---

## Drizzle Schema (TypeScript)

```typescript
// lib/db/schema.ts
import {
  pgTable, uuid, text, integer, timestamp, unique
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),                        // mirrors auth.users.id
  email: text('email').notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').unique(),
  generationsToday: integer('generations_today').notNull().default(0),
  generationsResetAt: timestamp('generations_reset_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().unique().references(() => users.id),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripePriceId: text('stripe_price_id').notNull(),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end', { withTimezone: true }).notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

export const skinGenerations = pgTable('skin_generations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().references(() => users.id),
  prompt: text('prompt'),
  referenceImagePath: text('reference_image_path'),
  resultPath: text('result_path'),
  status: text('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
```

---

## Relationships Summary

```
users (1) ─────── (0..1) subscriptions
users (1) ─────── (0..N) skin_generations
webhook_events    (standalone — no FK, idempotency only)
```

## Row Level Security (Supabase)

Enable RLS on all tables. Key policies:

| Table | Policy | Rule |
|-------|--------|------|
| `users` | SELECT own row | `auth.uid() = id` |
| `users` | UPDATE own row | `auth.uid() = id` |
| `subscriptions` | SELECT own row | `auth.uid() = user_id` |
| `skin_generations` | SELECT own rows | `auth.uid() = user_id` |
| `webhook_events` | No client access | Service role only |

The `webhook_events` and Stripe-related writes use the `SUPABASE_SERVICE_ROLE_KEY` server-side. Client code never writes directly to these tables.
