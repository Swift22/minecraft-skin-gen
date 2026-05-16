import { describe, it, expect } from 'vitest'
import {
  computeCreditsRemaining,
  getDailyLimit,
  FREE_DAILY_LIMIT,
  PRO_DAILY_LIMIT,
} from './credits'

const NOON_UTC = new Date('2026-05-16T12:00:00Z')
const TODAY_START = new Date('2026-05-16T00:00:00Z')
const YESTERDAY = new Date('2026-05-15T00:00:00Z')

describe('getDailyLimit', () => {
  it('returns the free tier limit for non-subscribers', () => {
    expect(getDailyLimit(false)).toBe(FREE_DAILY_LIMIT)
  })
  it('returns the pro tier limit for subscribers', () => {
    expect(getDailyLimit(true)).toBe(PRO_DAILY_LIMIT)
  })
})

describe('computeCreditsRemaining', () => {
  it('returns full free balance when counter is zero', () => {
    expect(
      computeCreditsRemaining({
        generationsToday: 0,
        generationsResetAt: TODAY_START,
        isSubscriber: false,
        now: NOON_UTC,
      })
    ).toEqual({ creditsRemaining: FREE_DAILY_LIMIT, dailyLimit: FREE_DAILY_LIMIT })
  })

  it('returns full pro balance when counter is zero', () => {
    // Note: this tests the math given a zero counter. The webhook handler's
    // responsibility to write zero (not the daily limit) is exercised in
    // lib/stripe-webhook.test.ts.
    expect(
      computeCreditsRemaining({
        generationsToday: 0,
        generationsResetAt: NOON_UTC,
        isSubscriber: true,
        now: NOON_UTC,
      })
    ).toEqual({ creditsRemaining: PRO_DAILY_LIMIT, dailyLimit: PRO_DAILY_LIMIT })
  })

  it('clamps remaining at zero when over limit', () => {
    expect(
      computeCreditsRemaining({
        generationsToday: 10,
        generationsResetAt: NOON_UTC,
        isSubscriber: false,
        now: NOON_UTC,
      }).creditsRemaining
    ).toBe(0)
  })

  it('treats stale generationsResetAt as a fresh day', () => {
    // Counter says 3 used yesterday, but the reset timestamp is older than today's UTC start.
    // Should report a full daily balance until the row is actually updated.
    expect(
      computeCreditsRemaining({
        generationsToday: 3,
        generationsResetAt: YESTERDAY,
        isSubscriber: false,
        now: NOON_UTC,
      })
    ).toEqual({ creditsRemaining: FREE_DAILY_LIMIT, dailyLimit: FREE_DAILY_LIMIT })
  })

  it('reports partial balance mid-day', () => {
    expect(
      computeCreditsRemaining({
        generationsToday: 1,
        generationsResetAt: TODAY_START,
        isSubscriber: false,
        now: NOON_UTC,
      })
    ).toEqual({ creditsRemaining: 2, dailyLimit: FREE_DAILY_LIMIT })
  })
})
