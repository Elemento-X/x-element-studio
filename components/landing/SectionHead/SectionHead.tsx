import type { ReactNode } from 'react'
import { Reveal } from '../Reveal/Reveal'
import styles from './SectionHead.module.css'

interface SectionHeadProps {
  eyebrow: string
  number: string
  title: ReactNode
  copy: ReactNode
}

export function SectionHead({
  eyebrow,
  number,
  title,
  copy,
}: SectionHeadProps) {
  return (
    <div className={styles.head}>
      <Reveal className={styles.left}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <span className={styles.number}>{number}</span>
        <h2 className={styles.title}>{title}</h2>
      </Reveal>
      <Reveal className={styles.right}>{copy}</Reveal>
    </div>
  )
}
