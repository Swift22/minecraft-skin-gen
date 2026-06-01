import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, skinGenerations } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'
import { AccountPageClient } from './AccountPageClient'
import { IS_LOCAL_MODE, LOCAL_USER } from '@/lib/local-mode'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Account | SkinForge',
}

export default async function AccountPage() {
  if (IS_LOCAL_MODE) {
    return (
      <AccountPageClient
        data={{
          email: LOCAL_USER.email,
          createdAt: LOCAL_USER.createdAt,
          totalGenerations: 0,
        }}
      />
    )
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [userRow] = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!userRow) redirect('/login')

  const [totalResult] = await db
    .select({ value: count() })
    .from(skinGenerations)
    .where(eq(skinGenerations.userId, user.id))

  return (
    <AccountPageClient
      data={{
        email: userRow.email,
        createdAt: userRow.createdAt.toISOString(),
        totalGenerations: totalResult?.value ?? 0,
      }}
    />
  )
}
