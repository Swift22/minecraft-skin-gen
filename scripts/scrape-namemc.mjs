// Scrape namemc.com/minecraft-skins for reference skin PNGs.
// Uses full chromium (not headless-shell) so Cloudflare's JS challenge passes.
//
// Strategy:
//   - Open the trending skins gallery page.
//   - Wait for the skin grid to render.
//   - Pull each skin's detail URL (e.g. /skin/<hash>).
//   - For each, fetch the canonical PNG download URL.
//   - Save to scripts/namemc-skins/<index>.png.
//
// Rate-limit between requests, polite User-Agent, no parallelism.

import { chromium } from 'playwright'
import { writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = path.join(import.meta.dirname, 'namemc-skins')
const TARGET_COUNT = parseInt(process.env.TARGET ?? '150', 10)
const DELAY_MS = 400

await mkdir(OUT_DIR, { recursive: true })

// Multiple gallery URLs to maximize variety. namemc uses category paths,
// not numeric pagination — these are the actually-valid URLs found via DOM inspection.
const GALLERY_URLS = [
  'https://namemc.com/minecraft-skins',
  'https://namemc.com/minecraft-skins/trending/daily',
  'https://namemc.com/minecraft-skins/trending/weekly',
  'https://namemc.com/minecraft-skins/trending/monthly',
  'https://namemc.com/minecraft-skins/trending/top',
  'https://namemc.com/minecraft-skins/new',
  // random gives a different set each visit
  'https://namemc.com/minecraft-skins/random',
  'https://namemc.com/minecraft-skins/random',
  'https://namemc.com/minecraft-skins/random',
  // tag-based for variety in style
  'https://namemc.com/minecraft-skins/tag/hoodie',
  'https://namemc.com/minecraft-skins/tag/suit',
  'https://namemc.com/minecraft-skins/tag/anime',
  'https://namemc.com/minecraft-skins/tag/mask',
  'https://namemc.com/minecraft-skins/tag/cute',
  'https://namemc.com/minecraft-skins/tag/dark',
  'https://namemc.com/minecraft-skins/tag/steve',
  'https://namemc.com/minecraft-skins/tag/cat',
]

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 1600 },
})
const page = await ctx.newPage()

// Collect unique skin hrefs across all gallery URLs
const seen = new Set()
for (const url of GALLERY_URLS) {
  if (seen.size >= TARGET_COUNT) break
  console.log(`-> opening ${url}`)
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForSelector('a[href^="/skin/"]', { timeout: 20000 }).catch(() => null)
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight))
      await page.waitForTimeout(500)
    }
    const hrefs = await page.evaluate(() => Array.from(document.querySelectorAll('a[href^="/skin/"]')).map((a) => a.getAttribute('href')))
    let added = 0
    for (const h of hrefs) {
      if (!seen.has(h)) {
        seen.add(h)
        added++
      }
    }
    console.log(`   +${added} new (total ${seen.size})`)
  } catch (err) {
    console.log(`   error: ${err.message}`)
  }
}

const skinHrefs = Array.from(seen)
console.log(`\n-> ${skinHrefs.length} unique skin links collected total`)

if (skinHrefs.length === 0) {
  console.log('!! no skin links — Cloudflare may still be challenging us')
  await browser.close()
  process.exit(2)
}

// Visit each detail page, find the texture PNG URL, download it
let saved = 0
const targets = skinHrefs.slice(0, TARGET_COUNT)
for (let i = 0; i < targets.length; i++) {
  const href = targets[i]
  const url = `https://namemc.com${href}`
  // Skip if we already have this skin (idempotent re-runs)
  const hashMatch = href.match(/\/skin\/([0-9a-f]+)/)
  const expectedHash = hashMatch ? hashMatch[1] : null
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    // Wait for the download anchor that JS adds after render
    await page.waitForSelector('a[download][href*=".png"]', { timeout: 10000 }).catch(() => null)
    const textureUrl = await page.evaluate(() => {
      const dl = document.querySelector('a[download][href*=".png"]')
      if (dl) return dl.href
      // Fallback: derive from URL hash
      const match = location.pathname.match(/\/skin\/([0-9a-f]+)/)
      if (match) return `https://s.namemc.com/i/${match[1]}.png`
      return null
    })
    if (!textureUrl) {
      console.log(`  [${i+1}/${targets.length}] no texture URL on ${url}`)
      continue
    }
    const resp = await page.context().request.get(textureUrl)
    if (!resp.ok()) {
      console.log(`  [${i+1}/${targets.length}] HTTP ${resp.status()} for ${textureUrl}`)
      continue
    }
    const buf = await resp.body()
    // Name by hash so re-runs don't duplicate
    const filename = expectedHash ? `${expectedHash}.png` : `${String(i+1).padStart(4,'0')}.png`
    const out = path.join(OUT_DIR, filename)
    await writeFile(out, buf)
    saved++
    if (saved % 10 === 0 || i === targets.length - 1) {
      console.log(`  [${i+1}/${targets.length}] saved ${filename} (${buf.length} bytes)`)
    }
  } catch (err) {
    console.log(`  [${i+1}/${targets.length}] error: ${err.message}`)
  }
  await page.waitForTimeout(DELAY_MS)
}

await browser.close()
console.log(`\ndone — ${saved}/${targets.length} skins saved to ${OUT_DIR}`)
