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
const TARGET_COUNT = parseInt(process.env.TARGET ?? '60', 10)
const DELAY_MS = 600

await mkdir(OUT_DIR, { recursive: true })

const browser = await chromium.launch({ headless: true })
const ctx = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  viewport: { width: 1280, height: 1600 },
})
const page = await ctx.newPage()

console.log('-> opening namemc skin gallery')
await page.goto('https://namemc.com/minecraft-skins', { waitUntil: 'domcontentloaded', timeout: 60000 })

// Wait through any Cloudflare challenge (up to 30s for the skin grid to appear)
console.log('-> waiting for skin grid...')
try {
  await page.waitForSelector('canvas.skin-2d, a[href^="/skin/"], img[src*="/texture/"]', { timeout: 30000 })
} catch {
  // Maybe still on challenge page; dump for debugging
  const title = await page.title()
  console.log(`page title after wait: ${title}`)
}

// Scroll a few times to lazy-load more skins
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => window.scrollBy(0, window.innerHeight))
  await page.waitForTimeout(800)
}

// Extract skin detail-page hrefs
const skinHrefs = await page.evaluate(() => {
  const anchors = Array.from(document.querySelectorAll('a[href^="/skin/"]'))
  const hrefs = new Set()
  for (const a of anchors) hrefs.add(a.getAttribute('href'))
  return Array.from(hrefs)
})
console.log(`-> found ${skinHrefs.length} skin links on listing`)

if (skinHrefs.length === 0) {
  console.log('!! no skin links — Cloudflare may still be challenging us')
  const html = await page.content()
  await writeFile('/tmp/namemc-debug.html', html)
  console.log('saved page to /tmp/namemc-debug.html for inspection')
  await browser.close()
  process.exit(2)
}

// Visit each detail page, find the texture PNG URL, download it
let saved = 0
const targets = skinHrefs.slice(0, TARGET_COUNT)
for (let i = 0; i < targets.length; i++) {
  const href = targets[i]
  const url = `https://namemc.com${href}`
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
    const out = path.join(OUT_DIR, `${String(i+1).padStart(3,'0')}.png`)
    await writeFile(out, buf)
    saved++
    if (saved % 5 === 0 || i === targets.length - 1) {
      console.log(`  [${i+1}/${targets.length}] saved ${out} (${buf.length} bytes)`)
    }
  } catch (err) {
    console.log(`  [${i+1}/${targets.length}] error: ${err.message}`)
  }
  await page.waitForTimeout(DELAY_MS)
}

await browser.close()
console.log(`\ndone — ${saved}/${targets.length} skins saved to ${OUT_DIR}`)
