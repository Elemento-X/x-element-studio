'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button } from '../Button/Button'
import styles from './Nav.module.css'

const NAV_LINKS = [
  { num: '01', label: 'Capabilities', href: '#capabilities' },
  { num: '02', label: 'Process', href: '#process' },
  { num: '03', label: 'Signal', href: '#work' },
  { num: '04', label: 'Contact', href: '#contact' },
]

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
  const time = useUtcClock()

  return (
    <header className={styles.nav}>
      <div className={`container-wide container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Elemento-X home">
          <span className={styles.logoChip} aria-hidden="true">
            <Image src="/assets/logo-flask.png" alt="" width={32} height={32} />
          </span>
          <span className={styles.wordmark}>Elemento&#8209;X</span>
        </Link>

        <nav aria-label="Primary">
          <ul className={styles.links}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>
                  <span className={styles.num}>{link.num}</span>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.cta}>
          <div className={styles.status} suppressHydrationWarning>
            <span className={styles.dot} />
            <span>OPERATIONAL · {time} UTC</span>
          </div>
          <Button href="#contact" variant="ghost" withArrow>
            Start
          </Button>
        </div>
      </div>
    </header>
  )
}
