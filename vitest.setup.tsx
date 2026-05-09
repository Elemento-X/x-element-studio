import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import type { ImgHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react'

afterEach(() => {
  cleanup()
})

// next/image: render as plain <img> in jsdom (skip optimizer/loader, which
// are heavy and irrelevant for component-level tests).
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    ...rest
  }: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element -- jsdom mock; next/image isn't usable in unit tests
    <img src={src} alt={alt} {...rest} />
  ),
}))

// next/link: render as plain <a> so role-based queries work and href values
// can be asserted directly.
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...rest
  }: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string
    children: ReactNode
  }) => (
    // eslint-disable-next-line react/jsx-no-target-blank -- jsdom mock; tests assert on attributes directly, defense-in-depth lives in real Link/Button components.
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))
