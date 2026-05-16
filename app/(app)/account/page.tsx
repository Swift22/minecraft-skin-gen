import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { users, subscriptions, skinGenerations } from '@/lib/db/schema'
import { eq, and, gt, count } from 'drizzle-orm'
import { getDailyLimit } from '@/lib/credits'
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
          createdAt: new Date().toISOString(),
          isSubscriber: LOCAL_USER.isSubscriber,
          subscriptionEndsAt: null,
          creditsRemaining: LOCAL_USER.creditsRemaining,
          dailyLimit: LOCAL_USER.dailyLimit,
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
      generationsToday: users.generationsToday,
      generationsResetAt: users.generationsResetAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1)

  if (!userRow) redirect('/login')

  const now = new Date()
  const todayUtcStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  const [subscription] = await db
    .select({
      stripeCurrentPeriodEnd: subscriptions.stripeCurrentPeriodEnd,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, user.id),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.stripeCurrentPeriodEnd, now)
      )
    )
    .limit(1)

  const isSubscriber = !!subscription
  const dailyLimit = getDailyLimit(isSubscriber)
  const effectiveGenerationsToday =
    userRow.generationsResetAt < todayUtcStart ? 0 : userRow.generationsToday
  const creditsRemaining = Math.max(0, dailyLimit - effectiveGenerationsToday)

  const [totalResult] = await db
    .select({ value: count() })
    .from(skinGenerations)
    .where(eq(skinGenerations.userId, user.id))

  return (
    <AccountPageClient
      data={{
        email: userRow.email,
        createdAt: userRow.createdAt.toISOString(),
        isSubscriber,
        subscriptionEndsAt: subscription?.stripeCurrentPeriodEnd?.toISOString() ?? null,
        creditsRemaining,
        dailyLimit,
        totalGenerations: totalResult?.value ?? 0,
      }}
    />
  )
}
