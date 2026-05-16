import { describe, it, expect } from 'vitest'
import { skinGenerations } from './schema'

describe('skinGenerations schema', () => {
  it('exposes the new v2 columns', () => {
    expect(skinGenerations.intent).toBeDefined()
    expect(skinGenerations.pixels).toBeDefined()
    expect(skinGenerations.manualOverrides).toBeDefined()
    expect(skinGenerations.schemaVersion).toBeDefined()
  })
})
