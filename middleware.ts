import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { IS_LOCAL_MODE } from '@/lib/local-mode'
import { env } from '@/lib/env'

const PROTECTED_ROUTES = ['/generate', '/gallery', '/account', '/edit', '/api/generate', '/api/gallery', '/api/user']
const AUTH_ROUTES = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  if (IS_LOCAL_MODE) {
    // In local mode: bypass auth entirely, allow all routes
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase env vars are required outside LOCAL_MODE')
  }

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages (T054)
  if (isAuthRoute && user) {
    const generateUrl = request.nextUrl.clone()
    generateUrl.pathname = '/generate'
    return NextResponse.redirect(generateUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
