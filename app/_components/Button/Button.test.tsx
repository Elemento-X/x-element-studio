import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders as <a> by default with href', () => {
    render(<Button href="/foo">Click</Button>)
    const link = screen.getByRole('link', { name: 'Click' })
    expect(link).toHaveAttribute('href', '/foo')
  })

  it('renders as <button> when as="button"', () => {
    render(<Button as="button">Submit</Button>)
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
  })

  it('forces rel="noopener noreferrer" when target="_blank" (CWE-1022 defense)', () => {
    render(
      <Button href="https://elsewhere.example" target="_blank">
        External
      </Button>,
    )
    const link = screen.getByRole('link', { name: 'External' })
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('does not add rel when target is not _blank', () => {
    render(<Button href="/internal">Internal</Button>)
    const link = screen.getByRole('link', { name: 'Internal' })
    expect(link).not.toHaveAttribute('rel')
  })
})
