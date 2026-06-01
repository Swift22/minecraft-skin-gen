import { describe, it, expect } from 'vitest'
import { PixelBuffer, type Pixel } from './pixel-buffer'
import { floodFill } from './flood-fill'

describe('floodFill', () => {
  it('fills a single pixel', () => {
    const buf = new PixelBuffer()
    buf.setPixel(10, 10, [255, 0, 0, 255])
    floodFill(buf, 10, 10, [0, 255, 0, 255])
    expect(buf.getPixel(10, 10)).toEqual([0, 255, 0, 255])
  })

  it('fills a connected region', () => {
    const buf = new PixelBuffer()
    // Paint a 3x3 red block
    for (let y = 5; y < 8; y++) {
      for (let x = 5; x < 8; x++) {
        buf.setPixel(x, y, [255, 0, 0, 255])
      }
    }
    // Fill from center
    floodFill(buf, 6, 6, [0, 0, 255, 255])
    // All 9 pixels should be blue
    for (let y = 5; y < 8; y++) {
      for (let x = 5; x < 8; x++) {
        expect(buf.getPixel(x, y)).toEqual([0, 0, 255, 255])
      }
    }
  })

  it('does not fill across different colors', () => {
    const buf = new PixelBuffer()
    // Paint a 3x3 red block
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        buf.setPixel(x, y, [255, 0, 0, 255])
      }
    }
    // Add a wall of green at x=3
    for (let y = 0; y < 3; y++) {
      buf.setPixel(3, y, [0, 255, 0, 255])
    }
    // Paint a 3x3 red block after the wall
    for (let y = 0; y < 3; y++) {
      for (let x = 4; x < 7; x++) {
        buf.setPixel(x, y, [255, 0, 0, 255])
      }
    }
    // Fill left block
    floodFill(buf, 1, 1, [0, 0, 255, 255])
    // Left block should be blue
    expect(buf.getPixel(1, 1)).toEqual([0, 0, 255, 255])
    // Right block should still be red
    expect(buf.getPixel(5, 1)).toEqual([255, 0, 0, 255])
    // Wall should still be green
    expect(buf.getPixel(3, 1)).toEqual([0, 255, 0, 255])
  })

  it('is a no-op when fill color matches target', () => {
    const buf = new PixelBuffer()
    const red: Pixel = [255, 0, 0, 255]
    buf.setPixel(0, 0, red)
    floodFill(buf, 0, 0, red)
    expect(buf.getPixel(0, 0)).toEqual(red)
  })

  it('fills transparent region', () => {
    const buf = new PixelBuffer()
    // All pixels start transparent [0,0,0,0]
    floodFill(buf, 0, 0, [128, 128, 128, 255])
    // Should fill the entire 64x64 image
    expect(buf.getPixel(0, 0)).toEqual([128, 128, 128, 255])
    expect(buf.getPixel(63, 63)).toEqual([128, 128, 128, 255])
    expect(buf.getPixel(32, 32)).toEqual([128, 128, 128, 255])
  })
})
