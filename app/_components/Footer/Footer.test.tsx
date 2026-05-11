import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Footer } from './Footer'

describe('Footer (integration)', () => {
  it('renders 3 navigation landmarks with distinct aria-labels', async () => {
    render(await Footer())
    const navs = screen.getAllByRole('navigation')
    const labels = navs.map((n) => n.getAttribute('aria-label'))
    expect(labels).toEqual(['Practice', 'Contact', 'Signal'])
  })

  it('contains a contentinfo landmark (the <footer>)', async () => {
    render(await Footer())
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
  })

  it('has zero href="#" placeholders', async () => {
    render(await Footer())
    const links = screen.getAllByRole('link')
    for (const link of links) {
      expect(link.getAttribute('href')).not.toBe('#')
      expect(link.getAttribute('href')).not.toBe('')
    }
  })

  it('renders heading hierarchy with H3 per nav (no skipped levels)', async () => {
    render(await Footer())
    const headings = screen.getAllByRole('heading', { level: 3 })
    expect(headings).toHaveLength(3)
  })
})
