import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * Sized for serverless: each Lambda holds its own pool, so each pool stays small.
 * Use Supabase's pgBouncer-pooled connection string (port 6543) in DATABASE_URL.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 1,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
})

/** Drizzle ORM client connected to Supabase PostgreSQL via service-role direct connection */
export const db = drizzle(pool, { schema })
