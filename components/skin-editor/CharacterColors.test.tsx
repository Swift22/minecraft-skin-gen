import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CharacterColors } from './CharacterColors'
import type { SkinIntent } from '@/lib/intent/schema'

const CHAR: SkinIntent['character'] = {
  skin_tone: '#C4956A', eye_shape: 'round', eye_color: '#1E3A7A', eye_white: '#F0EFEB',
  brows: 'flat', mouth: 'smile', mouth_color: '#000000', nose: 'dot', nose_shadow: '#000000',
  hair_style: 'classic', hair_length: 'medium', hair_color: '#3B2507', hair_accent_color: '#5A3D14',
  ear_template: 'none', ear_color: '#3B2507', inner_ear_color: '#FFB8CC',
}

describe('CharacterColors', () => {
  it('renders color pickers for each character color field', () => {
    render(<CharacterColors character={CHAR} onChange={vi.fn()} />)
    expect(screen.getByLabelText(/skin tone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/eye color/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/hair color/i)).toBeInTheDocument()
  })

  it('calls onChange with the new color', () => {
    const onChange = vi.fn()
    render(<CharacterColors character={CHAR} onChange={onChange} />)
    fireEvent.change(screen.getByLabelText(/skin tone/i), { target: { value: '#E0BFA0' } })
    expect(onChange).toHaveBeenCalledWith('skin_tone', '#E0BFA0')
  })
})
