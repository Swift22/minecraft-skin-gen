import { SKIN_REGIONS, type SkinRegion } from '@/lib/skin-regions'

const WIDTH = 64
const HEIGHT = 64

/**
 * Pre-built 64×64 grid mapping each pixel to its SkinRegion.
 * Outer-layer regions overwrite inner where they overlap (last match wins).
 */
let cachedGrid: (SkinRegion | null)[] | null = null

function buildGrid(): (SkinRegion | null)[] {
  const grid = new Array<SkinRegion | null>(WIDTH * HEIGHT).fill(null)
  for (const region of SKIN_REGIONS) {
    for (let dy = 0; dy < region.height; dy++) {
      for (let dx = 0; dx < region.width; dx++) {
        const x = region.x + dx
        const y = region.y + dy
        if (x < WIDTH && y < HEIGHT) {
          grid[y * WIDTH + x] = region
        }
      }
    }
  }
  return grid
}

/** Returns the SkinRegion at (x, y), or null if outside any mapped region */
export function getRegionAt(x: number, y: number): SkinRegion | null {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return null
  if (!cachedGrid) {
    cachedGrid = buildGrid()
  }
  return cachedGrid[y * WIDTH + x] ?? null
}
