import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaletteSwatches } from './PaletteSwatches'

describe('PaletteSwatches', () => {
  it('renders one swatch per palette color', () => {
    render(<PaletteSwatches palette={['#1C3D73','#2A5099','#6B4A20']} onChange={vi.fn()} />)
    expect(screen.getAllByRole('button').length).toBe(3)
  })

  it('calls onChange when a swatch is updated', () => {
    const onChange = vi.fn()
    render(<PaletteSwatches palette={['#1C3D73','#2A5099','#6B4A20']} onChange={onChange} />)
    const colorInput = screen.getAllByLabelText(/palette color/i)[0]!
    fireEvent.change(colorInput, { target: { value: '#FF0000' } })
    expect(onChange).toHaveBeenCalledWith(0, '#FF0000')
  })
})
