import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VariationsGrid } from './VariationsGrid'

describe('VariationsGrid', () => {
  it('renders N variation thumbnails', () => {
    render(<VariationsGrid variations={[
      { generationId: 'a', skinUrl: '/a.png' },
      { generationId: 'b', skinUrl: '/b.png' },
      { generationId: 'c', skinUrl: '/c.png' },
    ]} onSelect={vi.fn()} />)
    expect(screen.getAllByRole('img').length).toBe(3)
  })

  it('calls onSelect when a thumbnail is clicked', () => {
    const onSelect = vi.fn()
    render(<VariationsGrid variations={[{ generationId: 'a', skinUrl: '/a.png' }]} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('a')
  })
})
