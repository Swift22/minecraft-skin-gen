import { describe, it, expect, beforeAll } from 'vitest'
import { PixelBuffer, type Pixel } from './pixel-buffer'

// jsdom doesn't provide ImageData — polyfill for tests
beforeAll(() => {
  if (typeof globalThis.ImageData === 'undefined') {
    ;(globalThis as Record<string, unknown>).ImageData = class ImageData {
      data: Uint8ClampedArray
      width: number
      height: number
      constructor(data: Uint8ClampedArray, width: number, height?: number) {
        this.data = data
        this.width = width
        this.height = height ?? data.length / (width * 4)
      }
    }
  }
})

describe('PixelBuffer', () => {
  it('initializes with all transparent black pixels', () => {
    const buf = new PixelBuffer()
    expect(buf.getPixel(0, 0)).toEqual([0, 0, 0, 0])
    expect(buf.getPixel(63, 63)).toEqual([0, 0, 0, 0])
  })

  it('sets and gets a pixel', () => {
    const buf = new PixelBuffer()
    const color: Pixel = [255, 128, 64, 255]
    buf.setPixel(10, 20, color)
    expect(buf.getPixel(10, 20)).toEqual(color)
  })

  it('does not affect other pixels when setting one', () => {
    const buf = new PixelBuffer()
    buf.setPixel(5, 5, [255, 0, 0, 255])
    expect(buf.getPixel(5, 6)).toEqual([0, 0, 0, 0])
    expect(buf.getPixel(6, 5)).toEqual([0, 0, 0, 0])
  })

  it('clone creates an independent copy', () => {
    const buf = new PixelBuffer()
    buf.setPixel(0, 0, [100, 200, 50, 255])
    const clone = buf.clone()
    expect(clone.getPixel(0, 0)).toEqual([100, 200, 50, 255])

    // Modifying clone does not affect original
    clone.setPixel(0, 0, [0, 0, 0, 0])
    expect(buf.getPixel(0, 0)).toEqual([100, 200, 50, 255])
  })

  it('fromImageData creates buffer from ImageData', () => {
    const data = new Uint8ClampedArray(64 * 64 * 4)
    // Set pixel at (1, 0) = index 4
    data[4] = 10
    data[5] = 20
    data[6] = 30
    data[7] = 255
    const imageData = new ImageData(data, 64, 64)
    const buf = PixelBuffer.fromImageData(imageData)
    expect(buf.getPixel(1, 0)).toEqual([10, 20, 30, 255])
  })

  it('toImageData returns correct data', () => {
    const buf = new PixelBuffer()
    buf.setPixel(0, 0, [255, 0, 0, 128])
    const imageData = buf.toImageData()
    expect(imageData.width).toBe(64)
    expect(imageData.height).toBe(64)
    expect(imageData.data[0]).toBe(255)
    expect(imageData.data[1]).toBe(0)
    expect(imageData.data[2]).toBe(0)
    expect(imageData.data[3]).toBe(128)
  })

  it('data buffer has correct size', () => {
    const buf = new PixelBuffer()
    expect(buf.data.length).toBe(64 * 64 * 4)
  })
})
