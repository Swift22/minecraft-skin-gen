import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { IS_LOCAL_MODE, LOCAL_USER } from '@/lib/local-mode'

/** GET /api/user/me — returns the current user profile. */
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

  const [userRow] = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!userRow) {
    return NextResponse.json({ error: 'not_found', message: 'User profile not found.' }, { status: 404 })
  }

  return NextResponse.json({
    id: userRow.id,
    email: userRow.email,
    createdAt: userRow.createdAt.toISOString(),
  })
}
