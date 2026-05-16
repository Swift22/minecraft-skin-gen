import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '../env'

function assertSupabaseEnv(): { url: string; anonKey: string; serviceKey: string } {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars are required outside LOCAL_MODE')
  }
  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

/** Server-side anon Supabase client using cookie adapter for Next.js App Router sessions */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = assertSupabaseEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // setAll called from a Server Component — cookies will be set by the middleware
        }
      },
    },
  })
}

/** Server-side service-role Supabase client — bypasses RLS; never expose to client */
export async function createServiceClient() {
  const cookieStore = await cookies()
  const { url, serviceKey } = assertSupabaseEnv()

  return createServerClient(url, serviceKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // setAll called from a Server Component
        }
      },
    },
  })
}
