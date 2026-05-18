import { pgTable, uuid, text, integer, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/** Mirrors auth.users.id from Supabase Auth — stores subscription and credit tracking */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // mirrors auth.users.id
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

/** One-to-one with users — created/updated by Stripe webhook events */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull().unique().references(() => users.id),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripePriceId: text('stripe_price_id').notNull(),
  stripeCurrentPeriodEnd: timestamp('stripe_current_period_end', {
    withTimezone: true,
  }).notNull(),
  status: text('status').notNull(), // 'active' | 'canceled' | 'past_due' | 'unpaid'
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})

/** Audit log of every skin generation attempt */
export const skinGenerations = pgTable('skin_generations', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  prompt: text('prompt'),
  referenceImagePath: text('reference_image_path'),
  resultPath: text('result_path'),
  status: text('status').notNull().default('pending'), // 'pending' | 'completed' | 'failed'
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  intent: jsonb('intent'),                      // SkinIntent | null
  pixels: jsonb('pixels'),                      // SkinPixels | null
  manualOverrides: jsonb('manual_overrides'),   // string[] | null
  schemaVersion: text('schema_version').default('v1'), // 'v1' | 'v2'
})

/** Idempotency table for Stripe webhook processing */
export const webhookEvents = pgTable('webhook_events', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
})
