import { describe, it, expect } from 'vitest'
import { subscriptionActivationUpdate } from './stripe-webhook'

describe('subscriptionActivationUpdate', () => {
  const now = new Date('2026-05-16T12:00:00Z')

  it('resets generationsToday to 0 on active — NOT to the daily limit', () => {
    // Direct regression test for the original bug.
    // The prior code set generationsToday = PRO_DAILY_LIMIT, blocking all generation
    // until UTC midnight because the atomic guard `generationsToday < dailyLimit` failed.
    const update = subscriptionActivationUpdate('active', now)
    expect(update).not.toBeNull()
    expect(update!.generationsToday).toBe(0)
    expect(update!.generationsResetAt).toEqual(now)
    expect(update!.updatedAt).toEqual(now)
  })

  it('returns null for non-active statuses', () => {
    expect(subscriptionActivationUpdate('incomplete', now)).toBeNull()
    expect(subscriptionActivationUpdate('past_due', now)).toBeNull()
    expect(subscriptionActivationUpdate('canceled', now)).toBeNull()
    expect(subscriptionActivationUpdate('trialing', now)).toBeNull()
  })
})
