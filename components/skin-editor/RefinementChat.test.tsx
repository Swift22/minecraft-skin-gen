import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RefinementChat } from './RefinementChat'

describe('RefinementChat', () => {
  it('calls onSubmit with the instruction', () => {
    const onSubmit = vi.fn()
    render(<RefinementChat onSubmit={onSubmit} loading={false} />)
    const input = screen.getByPlaceholderText(/redder shirt/i)
    fireEvent.change(input, { target: { value: 'make the shirt redder' } })
    fireEvent.submit(input.closest('form')!)
    expect(onSubmit).toHaveBeenCalledWith('make the shirt redder')
  })

  it('disables submit while loading', () => {
    render(<RefinementChat onSubmit={vi.fn()} loading={true} />)
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled()
  })

  it('shows error message when provided', () => {
    render(<RefinementChat onSubmit={vi.fn()} loading={false} error="Not sure what to change" />)
    expect(screen.getByText(/not sure what to change/i)).toBeInTheDocument()
  })
})
