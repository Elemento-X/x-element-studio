'use client'

import type { ReactNode } from 'react'
import { useInViewOnce } from './useInViewOnce'
import styles from './Process.module.css'

export function ProcessGrid({ children }: { children: ReactNode }) {
  const [ref, inView] = useInViewOnce<HTMLOListElement>()
  return (
    <ol
      ref={ref}
      className={`${styles.grid} ${inView ? styles.gridActive : ''}`}
    >
      {children}
    </ol>
  )
}
