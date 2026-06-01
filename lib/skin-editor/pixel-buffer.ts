const WIDTH = 64
const HEIGHT = 64
const CHANNELS = 4

/** RGBA pixel tuple */
export type Pixel = [r: number, g: number, b: number, a: number]

/**
 * Wraps a 64×64 RGBA pixel buffer for direct manipulation.
 * Backed by a flat Uint8ClampedArray (64 * 64 * 4 = 16384 bytes).
 */
export class PixelBuffer {
  readonly data: Uint8ClampedArray

  constructor(source?: Uint8ClampedArray) {
    this.data = source
      ? new Uint8ClampedArray(source)
      : new Uint8ClampedArray(WIDTH * HEIGHT * CHANNELS)
  }

  private offset(x: number, y: number): number {
    return (y * WIDTH + x) * CHANNELS
  }

  getPixel(x: number, y: number): Pixel {
    const o = this.offset(x, y)
    return [this.data[o] ?? 0, this.data[o + 1] ?? 0, this.data[o + 2] ?? 0, this.data[o + 3] ?? 0]
  }

  setPixel(x: number, y: number, pixel: Pixel): void {
    const o = this.offset(x, y)
    this.data[o] = pixel[0]
    this.data[o + 1] = pixel[1]
    this.data[o + 2] = pixel[2]
    this.data[o + 3] = pixel[3]
  }

  /** Deep copy */
  clone(): PixelBuffer {
    return new PixelBuffer(this.data)
  }

  /** Convert to ImageData for canvas rendering */
  toImageData(): ImageData {
    return new ImageData(new Uint8ClampedArray(this.data), WIDTH, HEIGHT)
  }

  /** Render to a data URL via off-screen canvas */
  toDataUrl(): string {
    const canvas = document.createElement('canvas')
    canvas.width = WIDTH
    canvas.height = HEIGHT
    const ctx = canvas.getContext('2d')!
    ctx.putImageData(this.toImageData(), 0, 0)
    return canvas.toDataURL('image/png')
  }

  /** Create from an existing ImageData */
  static fromImageData(imageData: ImageData): PixelBuffer {
    return new PixelBuffer(imageData.data)
  }
}
