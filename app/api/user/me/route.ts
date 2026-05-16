import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserCredits } from '@/lib/credits'
import { IS_LOCAL_MODE, LOCAL_USER } from '@/lib/local-mode'

/** GET /api/user/me — returns current user profile including credit balance and subscription status */
export async function GET() {
  if (IS_LOCAL_MODE) {
    return NextResponse.json(LOCAL_USER)
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized', message: 'Not authenticated.' }, { status: 401 })
  }

  const credits = await getUserCredits(user.id)
  if (!credits) {
    return NextResponse.json({ error: 'not_found', message: 'User profile not found.' }, { status: 404 })
  }

  return NextResponse.json(credits)
}
