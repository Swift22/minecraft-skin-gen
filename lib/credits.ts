import { db } from './db'
import { users, subscriptions } from './db/schema'
import { eq, and, gt, sql } from 'drizzle-orm'

export const FREE_DAILY_LIMIT = 3
export const PRO_DAILY_LIMIT = 50

/**
 * Pure helper: given the user's stored counter and the current time, return the
 * effective credits remaining. Extracted so it's testable without a database.
 */
export function computeCreditsRemaining(args: {
  generationsToday: number
  generationsResetAt: Date
  isSubscriber: boolean
  now?: Date
}): { creditsRemaining: number; dailyLimit: number } {
  const now = args.now ?? new Date()
  const todayUtcStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )
  const dailyLimit = getDailyLimit(args.isSubscriber)
  const effective = args.generationsResetAt < todayUtcStart ? 0 : args.generationsToday
  return { creditsRemaining: Math.max(0, dailyLimit - effective), dailyLimit }
}

export interface UserCredits {
  id: string
  email: string
  creditsRemaining: number
  dailyLimit: number
  isSubscriber: boolean
  subscriptionEndsAt: string | null
}

/**
 * Resolve a user's effective credit balance and subscription status.
 * Used by both the /api/user/me route and the Generate page server component.
 * Returns null if the user row does not exist.
 */
export async function getUserCredits(userId: string): Promise<UserCredits | null> {
  const now = new Date()

  const [userRow] = await db
    .select({
      id: users.id,
      email: users.email,
      generationsToday: users.generationsToday,
      generationsResetAt: users.generationsResetAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!userRow) return null

  const [subscription] = await db
    .select({
      stripeCurrentPeriodEnd: subscriptions.stripeCurrentPeriodEnd,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.stripeCurrentPeriodEnd, now)
      )
    )
    .limit(1)

  const isSubscriber = !!subscription
  const { creditsRemaining, dailyLimit } = computeCreditsRemaining({
    generationsToday: userRow.generationsToday,
    generationsResetAt: userRow.generationsResetAt,
    isSubscriber,
    now,
  })

  return {
    id: userRow.id,
    email: userRow.email,
    creditsRemaining,
    dailyLimit,
    isSubscriber,
    subscriptionEndsAt: subscription?.stripeCurrentPeriodEnd?.toISOString() ?? null,
  }
}

/**
 * Check whether a user has an active paid subscription.
 * A subscription is active when status = 'active' AND stripe_current_period_end > now().
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const result = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        gt(subscriptions.stripeCurrentPeriodEnd, new Date())
      )
    )
    .limit(1)

  return result.length > 0
}

/** Get the daily generation limit for a user based on their subscription status */
export function getDailyLimit(isSubscriber: boolean): number {
  return isSubscriber ? PRO_DAILY_LIMIT : FREE_DAILY_LIMIT
}

interface CreditCheckResult {
  allowed: boolean
  remaining: number
  reason?: string
}

/**
 * Atomically check and deduct a generation credit for the user.
 * - Resets daily counter if generations_reset_at is before the current UTC day
 * - Returns { allowed: false } if the user has exhausted their daily limit
 * - Uses an atomic WHERE guard to prevent race conditions
 */
export async function checkAndDeductCredit(userId: string): Promise<CreditCheckResult> {
  const isSubscriber = await hasActiveSubscription(userId)
  const dailyLimit = getDailyLimit(isSubscriber)

  const now = new Date()
  const todayUtcStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  // Load current user record
  const userRows = await db
    .select({
      generationsToday: users.generationsToday,
      generationsResetAt: users.generationsResetAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const user = userRows[0]
  if (!user) {
    return { allowed: false, remaining: 0, reason: 'user_not_found' }
  }

  // Reset counter if we've crossed into a new UTC day
  if (user.generationsResetAt < todayUtcStart) {
    await db
      .update(users)
      .set({
        generationsToday: 0,
        generationsResetAt: todayUtcStart,
        updatedAt: now,
      })
      .where(eq(users.id, userId))

    user.generationsToday = 0
  }

  // Atomic decrement with WHERE guard — prevents race conditions
  const updated = await db
    .update(users)
    .set({
      generationsToday: sql`${users.generationsToday} + 1`,
      updatedAt: now,
    })
    .where(and(eq(users.id, userId), sql`${users.generationsToday} < ${dailyLimit}`))
    .returning({ generationsToday: users.generationsToday })

  const updatedRow = updated[0]
  if (!updatedRow) {
    // WHERE guard failed — user has hit their limit
    return { allowed: false, remaining: 0, reason: 'no_credits' }
  }

  return { allowed: true, remaining: dailyLimit - updatedRow.generationsToday }
}

/**
 * Refund a generation credit by decrementing the counter.
 * Called when the AI generation fails after a credit was deducted.
 */
export async function refundCredit(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      generationsToday: sql`GREATEST(0, ${users.generationsToday} - 1)`,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
}
