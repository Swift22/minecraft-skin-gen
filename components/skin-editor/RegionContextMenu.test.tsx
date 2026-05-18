import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegionContextMenu } from './RegionContextMenu'

describe('RegionContextMenu', () => {
  it('shows re-roll option for the region', () => {
    render(<RegionContextMenu region="torso_front" x={10} y={10} onReroll={vi.fn()} onClose={vi.fn()} locked={false} />)
    expect(screen.getByText(/re-roll torso_front/i)).toBeInTheDocument()
  })

  it('shows lock indicator and disables re-roll when locked', () => {
    render(<RegionContextMenu region="torso_front" x={10} y={10} onReroll={vi.fn()} onClose={vi.fn()} locked={true} />)
    const button = screen.getByText(/re-roll torso_front/i).closest('button')
    expect(button).toBeDisabled()
  })

  it('calls onReroll when clicked', () => {
    const onReroll = vi.fn()
    render(<RegionContextMenu region="torso_front" x={10} y={10} onReroll={onReroll} onClose={vi.fn()} locked={false} />)
    fireEvent.click(screen.getByText(/re-roll torso_front/i))
    expect(onReroll).toHaveBeenCalledWith('torso_front')
  })
})
