'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Button } from '../Button/Button'
import styles from './Nav.module.css'

// Stable structural data (anchors, numbers) lives in code; the visible
// label is the only translatable surface and comes from messages.
const NAV_LINKS = [
  { num: '01', key: 'capabilities', href: '#capabilities' },
  { num: '02', key: 'process', href: '#process' },
  { num: '03', key: 'signal', href: '#work' },
  { num: '04', key: 'contact', href: '#contact' },
] as const

function useUtcClock() {
  const [time, setTime] = useState('--:--')

  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const hh = String(d.getUTCHours()).padStart(2, '0')
      const mm = String(d.getUTCMinutes()).padStart(2, '0')
      setTime(`${hh}:${mm}`)
    }
    tick()
    const id = setInterval(tick, 20000)
    return () => clearInterval(id)
  }, [])

  return time
}

export function Nav() {
  const t = useTranslations('nav')
  const time = useUtcClock()

  return (
    <header className={styles.nav}>
      <div className={`container-wide container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={t('brandLabel')}>
          <span className={styles.logoChip} aria-hidden="true">
            <Image src="/assets/logo-flask.png" alt="" width={32} height={32} />
          </span>
          <span className={styles.wordmark}>Elemento&#8209;X</span>
        </Link>

        <nav aria-label={t('primaryLabel')}>
          <ul className={styles.links}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <span className={styles.num}>{link.num}</span>
                  {t(`links.${link.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.cta}>
          <div className={styles.status} suppressHydrationWarning>
            <span className={styles.dot} />
            <span>{t('statusOperational', { time })}</span>
          </div>
          <Button href="#contact" variant="ghost" withArrow>
            {t('cta')}
          </Button>
        </div>
      </div>
    </header>
  )
}
