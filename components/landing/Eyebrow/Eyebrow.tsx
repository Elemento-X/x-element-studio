import type { ReactNode } from 'react'
import styles from './Eyebrow.module.css'

interface EyebrowProps {
  children: ReactNode
  signal?: boolean
  className?: string
}

export function Eyebrow({ children, signal = false, className }: EyebrowProps) {
  const classes = [styles.eyebrow, signal && styles.signal, className]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}
