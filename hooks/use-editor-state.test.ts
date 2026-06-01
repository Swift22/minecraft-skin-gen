import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type { SkinIntent, SkinPixels } from '@/lib/intent/schema'
import { useEditorState } from './use-editor-state'

const STUB_INTENT: SkinIntent = {
  version: 1,
  seed: 42,
  style: 'retro',
  palette: ['#000000', '#111111', '#222222'],
  palette_mode: 'soft',
  character: {
    skin_tone: '#C4956A',
    eye_shape: 'round',
    eye_color: '#1E3A7A',
    eye_white: '#F0EFEB',
    brows: 'flat',
    mouth: 'smile',
    mouth_color: '#8B5040',
    nose: 'dot',
    nose_shadow: '#A07050',
    hair_style: 'classic',
    hair_length: 'medium',
    hair_color: '#3B2507',
    hair_accent_color: '#5A3D14',
    ear_template: 'none',
    ear_color: '#3B2507',
    inner_ear_color: '#FFB8CC',
  },
  outfit: { torso: 'shirt', arms: 'sleeves', legs: 'pants' },
  refinement_history: [],
}

const ROW = Array(8).fill('#000000') as string[]
const STUB_PIXELS: SkinPixels = {
  torso_front: Array(12).fill(ROW) as string[][],
  torso_back: Array(12).fill(ROW) as string[][],
  torso_side: Array(12).fill(ROW) as string[][],
  arm_front: Array(12).fill(ROW) as string[][],
  arm_side: Array(12).fill(ROW) as string[][],
  arm_back: Array(12).fill(ROW) as string[][],
  leg_front: Array(12).fill(ROW) as string[][],
  leg_side: Array(12).fill(ROW) as string[][],
  leg_back: Array(12).fill(ROW) as string[][],
}

describe('useEditorState v2 fields', () => {
  it('exposes intent, pixels, manualOverrides with null/empty defaults', () => {
    const { result } = renderHook(() => useEditorState())
    expect(result.current.intent).toBeNull()
    expect(result.current.pixels).toBeNull()
    expect(result.current.manualOverrides).toEqual(new Set())
  })

  it('loadFromGeneration bulk-loads intent, pixels, manualOverrides', () => {
    const { result } = renderHook(() => useEditorState())

    act(() => {
      result.current.loadFromGeneration({
        intent: STUB_INTENT,
        pixels: STUB_PIXELS,
        manualOverrides: ['torso_front'],
      })
    })

    expect(result.current.intent).not.toBeNull()
    expect(result.current.pixels).not.toBeNull()
    expect(result.current.manualOverrides.has('torso_front')).toBe(true)
  })

  it('markRegionManual locks a region', () => {
    const { result } = renderHook(() => useEditorState())
    act(() => result.current.markRegionManual('torso_front'))
    expect(result.current.manualOverrides.has('torso_front')).toBe(true)
  })

  it('clearManualLock removes a region', () => {
    const { result } = renderHook(() => useEditorState())
    act(() => result.current.markRegionManual('torso_front'))
    act(() => result.current.clearManualLock('torso_front'))
    expect(result.current.manualOverrides.has('torso_front')).toBe(false)
  })

  it('setIntent and setPixels work independently', () => {
    const { result } = renderHook(() => useEditorState())

    act(() => result.current.setIntent(STUB_INTENT))
    expect(result.current.intent).toEqual(STUB_INTENT)

    act(() => result.current.setPixels(STUB_PIXELS))
    expect(result.current.pixels).toEqual(STUB_PIXELS)
  })

  it('existing state/actions are still present', () => {
    const { result } = renderHook(() => useEditorState())
    expect(result.current.state).toBeDefined()
    expect(result.current.actions).toBeDefined()
    expect(result.current.state.activeTool).toBe('pencil')
  })
})
