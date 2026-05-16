import type { Pixel } from './pixel-buffer'
import { PixelBuffer } from './pixel-buffer'

const WIDTH = 64
const HEIGHT = 64

function pixelsEqual(a: Pixel, b: Pixel): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
}

/**
 * Queue-based 4-connected flood fill.
 * Replaces all pixels matching the target color (at startX, startY) with fillColor.
 */
export function floodFill(
  buffer: PixelBuffer,
  startX: number,
  startY: number,
  fillColor: Pixel
): void {
  const targetColor = buffer.getPixel(startX, startY)

  // No-op if fill color matches target
  if (pixelsEqual(targetColor, fillColor)) return

  const visited = new Uint8Array(WIDTH * HEIGHT)
  const queue: [number, number][] = [[startX, startY]]
  visited[startY * WIDTH + startX] = 1

  while (queue.length > 0) {
    const [x, y] = queue.shift()!
    buffer.setPixel(x, y, fillColor)

    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]] as const) {
      const nx = x + dx
      const ny = y + dy
      if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) continue
      const idx = ny * WIDTH + nx
      if (visited[idx]) continue
      visited[idx] = 1
      if (pixelsEqual(buffer.getPixel(nx, ny), targetColor)) {
        queue.push([nx, ny])
      }
    }
  }
}
