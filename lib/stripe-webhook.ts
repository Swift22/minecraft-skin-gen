/**
 * Pure decision helpers for the Stripe webhook handler.
 * Extracted so they're testable without invoking Stripe or the DB.
 */

export interface UserCounterUpdate {
  generationsToday: number
  generationsResetAt: Date
  updatedAt: Date
}

/**
 * What to write to the users row when a subscription event arrives.
 *
 * For an `active` status: reset the counter to 0 and stamp generationsResetAt to now
 * so the new Pro daily limit applies immediately.
 *
 * Regression note: a prior implementation set `generationsToday: PRO_DAILY_LIMIT`,
 * which made the atomic `generationsToday < dailyLimit` guard in `checkAndDeductCredit`
 * always fail until UTC midnight rolled over the row. Setting to 0 fixes that.
 *
 * For any other status: return null (no update needed).
 */
export function subscriptionActivationUpdate(
  subscriptionStatus: string,
  now: Date
): UserCounterUpdate | null {
  if (subscriptionStatus !== 'active') return null
  return {
    generationsToday: 0,
    generationsResetAt: now,
    updatedAt: now,
  }
}
