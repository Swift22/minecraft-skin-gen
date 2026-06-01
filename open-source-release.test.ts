import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const removedPaths = [
  'app/api/subscription',
  'app/api/webhooks/stripe',
  'components/ads/AdUnit.tsx',
  'components/skin-generator/CreditCounter.tsx',
  'components/skin-generator/UpgradePrompt.tsx',
  'lib/credits.ts',
  'lib/credits.test.ts',
  'lib/stripe.ts',
  'lib/stripe-webhook.ts',
  'lib/stripe-webhook.test.ts',
  'public/ads.txt',
]

const sourceDirs = ['app', 'components', 'lib']
const ignoredDirs = new Set(['node_modules', '.git', '.next', '.serena'])
const bannedSourcePatterns = [
  /@\/lib\/credits/,
  /checkAndDeductCredit/,
  /refundCredit/,
  /hasActiveSubscription/,
  /FREE_DAILY_LIMIT/,
  /PRO_DAILY_LIMIT/,
  /AdUnit/,
  /UpgradePrompt/,
  /NEXT_PUBLIC_ADSENSE_CLIENT/,
  /adsbygoogle/,
  /pagead2\.googlesyndication/,
  /\/api\/subscription/,
  /\bsubscriptions\b/,
  /Stripe/,
  /stripe_/,
  /@\/lib\/stripe/,
  /webhooks\/stripe/,
  /creditsRemaining/,
  /dailyLimit/,
  /isSubscriber/,
  /subscriptionEndsAt/,
]

function walkFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(root, relativeDir)
  if (!existsSync(absoluteDir)) return []

  return readdirSync(absoluteDir).flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry)
    const absolutePath = path.join(root, relativePath)
    const stat = statSync(absolutePath)

    if (stat.isDirectory()) {
      return ignoredDirs.has(entry) ? [] : walkFiles(relativePath)
    }

    return /\.(tsx?|mts|cts)$/.test(entry) ? [relativePath] : []
  })
}

describe('open-source release cleanup', () => {
  it('removes monetization-only files', () => {
    expect(removedPaths.filter((file) => existsSync(path.join(root, file)))).toEqual([])
  })

  it('removes monetization dependencies and env vars', () => {
    const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
    }
    expect(pkg.dependencies?.stripe).toBeUndefined()

    const lockfile = readFileSync(path.join(root, 'package-lock.json'), 'utf8')
    expect(lockfile).not.toMatch(/"stripe"|"node_modules\/stripe"/)

    const envExample = readFileSync(path.join(root, '.env.example'), 'utf8')
    expect(envExample).not.toMatch(/STRIPE_|NEXT_PUBLIC_STRIPE|ADSENSE|DAILY_LIMIT/)
  })

  it('keeps fresh database bootstrap free of monetization tables and quota columns', () => {
    const bootstrapMigration = readFileSync(
      path.join(root, 'drizzle/0000_powerful_vivisector.sql'),
      'utf8'
    )

    expect(bootstrapMigration).not.toMatch(
      /stripe|subscriptions|webhook_events|generations_today|generations_reset_at/i
    )
  })

  it('keeps application source free of monetization and quota gates', () => {
    const offenders = sourceDirs
      .flatMap(walkFiles)
      .filter((file) => file !== 'open-source-release.test.ts')
      .flatMap((file) => {
        const text = readFileSync(path.join(root, file), 'utf8')
        return bannedSourcePatterns
          .filter((pattern) => pattern.test(text))
          .map((pattern) => `${file}: ${pattern}`)
      })

    expect(offenders).toEqual([])
  })
})
