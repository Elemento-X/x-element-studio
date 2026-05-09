'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './Reveal.module.css'

interface RevealProps {
  children: ReactNode
  as?: 'div' | 'section' | 'article' | 'span' | 'li'
  className?: string
  delay?: number
}

export function Reveal({
  children,
  as: Tag = 'div',
  className,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- One-shot fallback for environments without IntersectionObserver (SSR/jsdom tests). The effect exits immediately after; no cascading renders.
      setShown(true)
      return
    }
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const classes = [styles.reveal, shown && styles.in, className]
    .filter(Boolean)
    .join(' ')

  const style = delay ? { transitionDelay: `${delay}ms` } : undefined

  // Polymorphic ref via `as never`: required because the discriminated union of
  // accepted tags makes the ref type mutually incompatible. NEVER add void
  // elements (img, hr, br, input) to the `as` union — they don't accept children.
  return (
    <Tag ref={ref as never} className={classes} style={style}>
      {children}
    </Tag>
  )
}
