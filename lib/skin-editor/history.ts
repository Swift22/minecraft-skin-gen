import { PixelBuffer } from './pixel-buffer'

const MAX_SNAPSHOTS = 100

/**
 * Undo/redo history backed by PixelBuffer snapshots.
 * Each snapshot is ~16KB (64×64×4 bytes). Max 100 = ~1.6MB.
 */
export class UndoHistory {
  private stack: Uint8ClampedArray[] = []
  private pointer = -1

  /** Push a snapshot (clone of current buffer). Truncates any redo states. */
  push(buffer: PixelBuffer): void {
    // Discard redo stack
    this.stack.length = this.pointer + 1
    this.stack.push(new Uint8ClampedArray(buffer.data))
    // Enforce max
    if (this.stack.length > MAX_SNAPSHOTS) {
      this.stack.shift()
    }
    this.pointer = this.stack.length - 1
  }

  /** Undo: returns the previous buffer, or null if at the beginning */
  undo(): PixelBuffer | null {
    if (this.pointer <= 0) return null
    this.pointer--
    return new PixelBuffer(this.stack[this.pointer])
  }

  /** Redo: returns the next buffer, or null if at the end */
  redo(): PixelBuffer | null {
    if (this.pointer >= this.stack.length - 1) return null
    this.pointer++
    return new PixelBuffer(this.stack[this.pointer])
  }

  get canUndo(): boolean {
    return this.pointer > 0
  }

  get canRedo(): boolean {
    return this.pointer < this.stack.length - 1
  }

  get length(): number {
    return this.stack.length
  }
}
