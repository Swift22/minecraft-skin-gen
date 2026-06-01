import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/** Mirrors auth.users.id from Supabase Auth. */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(), // mirrors auth.users.id
  email: text('email').notNull().unique(),
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
