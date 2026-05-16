import { describe, it, expect } from 'vitest'
import { mirrorHorizontal } from './mirror'

describe('mirrorHorizontal', () => {
  it('mirrors columns left-to-right', () => {
    const input = [
      ['a', 'b', 'c', 'd'],
      ['1', '2', '3', '4'],
    ]
    expect(mirrorHorizontal(input)).toEqual([
      ['d', 'c', 'b', 'a'],
      ['4', '3', '2', '1'],
    ])
  })
  it('preserves rows and empty string transparency', () => {
    const input = [['x', '', 'y']]
    expect(mirrorHorizontal(input)).toEqual([['y', '', 'x']])
  })
  it('handles single-column grids', () => {
    expect(mirrorHorizontal([['a'], ['b']])).toEqual([['a'], ['b']])
  })
})
