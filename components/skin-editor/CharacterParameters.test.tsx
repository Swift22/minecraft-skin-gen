import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterParameters } from './CharacterParameters'

const CHAR = {
  skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#000', eye_white: '#FFF',
  brows: 'flat', mouth: 'smile', mouth_color: '#000', nose: 'dot', nose_shadow: '#000',
  hair_style: 'classic', hair_length: 'medium', hair_color: '#000', hair_accent_color: '#000',
  ear_template: 'none', ear_color: '#000', inner_ear_color: '#FFB8CC',
}

describe('CharacterParameters', () => {
  it('renders dropdowns for each parametric field', () => {
    render(<CharacterParameters character={CHAR as unknown as import('@/lib/intent/schema').SkinIntent['character']} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/eye shape/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mouth/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hair style/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ear template/i)).toBeInTheDocument()
  })

  it('calls onChange with the new value', () => {
    const onChange = vi.fn()
    render(<CharacterParameters character={CHAR as unknown as import('@/lib/intent/schema').SkinIntent['character']} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/eye shape/i), { target: { value: 'almond' } })
    expect(onChange).toHaveBeenCalledWith('eye_shape', 'almond')
  })
})
