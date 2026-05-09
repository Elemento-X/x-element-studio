'use client'

import type { ReactNode } from 'react'
import { useInViewOnce } from './useInViewOnce'
import styles from './Process.module.css'

export function IllustrationWrapper({ children }: { children: ReactNode }) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>()
  return (
    <div
      ref={ref}
      className={`${styles.illust} ${inView ? styles.illustIn : ''}`}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}
