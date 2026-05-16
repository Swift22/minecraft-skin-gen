import { createBrowserClient } from '@supabase/ssr'

/** Browser-side Supabase client using the public anon key — safe to expose to the client */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  }
  return createBrowserClient(url, anonKey)
}
