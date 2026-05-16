import { describe, it, expect } from 'vitest'
import { PixelBuffer } from './pixel-buffer'
import { UndoHistory } from './history'

describe('UndoHistory', () => {
  function makeBuffer(r: number): PixelBuffer {
    const buf = new PixelBuffer()
    buf.setPixel(0, 0, [r, 0, 0, 255])
    return buf
  }

  it('starts with no undo/redo capability', () => {
    const history = new UndoHistory()
    expect(history.canUndo).toBe(false)
    expect(history.canRedo).toBe(false)
  })

  it('can undo after two pushes', () => {
    const history = new UndoHistory()
    history.push(makeBuffer(100))
    history.push(makeBuffer(200))
    expect(history.canUndo).toBe(true)
    const prev = history.undo()
    expect(prev).not.toBeNull()
    expect(prev!.getPixel(0, 0)[0]).toBe(100)
  })

  it('cannot undo past the first state', () => {
    const history = new UndoHistory()
    history.push(makeBuffer(100))
    expect(history.canUndo).toBe(false)
    expect(history.undo()).toBeNull()
  })

  it('can redo after undo', () => {
    const history = new UndoHistory()
    history.push(makeBuffer(100))
    history.push(makeBuffer(200))
    history.undo()
    expect(history.canRedo).toBe(true)
    const next = history.redo()
    expect(next).not.toBeNull()
    expect(next!.getPixel(0, 0)[0]).toBe(200)
  })

  it('push after undo truncates redo stack', () => {
    const history = new UndoHistory()
    history.push(makeBuffer(100))
    history.push(makeBuffer(200))
    history.push(makeBuffer(300))
    history.undo() // back to 200
    history.push(makeBuffer(400)) // should discard 300
    expect(history.canRedo).toBe(false)
    expect(history.length).toBe(3)
  })

  it('undo returns independent snapshots', () => {
    const history = new UndoHistory()
    const buf1 = makeBuffer(100)
    history.push(buf1)
    const buf2 = makeBuffer(200)
    history.push(buf2)

    const restored = history.undo()!
    // Modify restored — should not affect history
    restored.setPixel(0, 0, [0, 0, 0, 0])
    history.redo()
    // Redo gives us state at position 2 (buf2), undo to position 1 (buf1)
    const backToBuf1 = history.undo()!
    expect(backToBuf1.getPixel(0, 0)[0]).toBe(100)
    // Try to undo past the first state
    const check = history.undo()
    expect(check).toBeNull()
  })

  it('enforces max snapshots limit', () => {
    const history = new UndoHistory()
    for (let i = 0; i < 110; i++) {
      history.push(makeBuffer(i % 256))
    }
    expect(history.length).toBe(100)
  })
})
