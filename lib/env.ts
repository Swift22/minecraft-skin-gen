import { z } from 'zod'

const isLocalMode = process.env.LOCAL_MODE === 'true'

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOCAL_MODE: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

const cloudSchema = baseSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
})

const localSchema = baseSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url().optional(),
})

const schema = isLocalMode ? localSchema : cloudSchema
const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n')
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

type CloudEnv = z.infer<typeof cloudSchema>
type LocalEnv = z.infer<typeof localSchema>

export const env = parsed.data as CloudEnv & LocalEnv
