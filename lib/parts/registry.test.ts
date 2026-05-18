import { describe, it, expect } from 'vitest'
import { createRegistry } from './registry'

describe('createRegistry', () => {
  it('returns a part by name', () => {
    const reg = createRegistry({ alpha: 1, beta: 2 })
    expect(reg.get('alpha')).toBe(1)
  })
  it('lists all part names', () => {
    const reg = createRegistry({ alpha: 1, beta: 2 })
    expect(reg.names()).toEqual(['alpha', 'beta'])
  })
  it('throws on unknown part', () => {
    const reg = createRegistry({ alpha: 1 })
    expect(() => reg.get('missing' as 'alpha')).toThrow(/missing/)
  })
})
