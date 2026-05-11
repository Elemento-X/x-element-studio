'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerRef = useRef<HTMLElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  // Escape key closes the menu — table-stakes for a drawer pattern.
  // `useCallback` keeps the listener identity stable so we don't
  // attach/detach on every render.
  const closeMenu = useCallback(() => setMenuOpen(false), [])

  useEffect(() => {
    if (!menuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [menuOpen, closeMenu])

  // Focus-trap inside the drawer while open. Keyboard users tabbing
  // through the drawer should cycle through its links, not escape into
  // the page below. On open: focus moves to the first link; on close:
  // focus returns to the toggle (only when the close was triggered by
  // Escape or the toggle itself — link-click navigations let the
  // browser handle focus naturally with the anchor target).
  useEffect(() => {
    const drawer = drawerRef.current
    if (!menuOpen || !drawer) return

    const focusables = drawer.querySelectorAll<HTMLElement>(
      'a, button, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    first?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first?.focus()
      }
    }

    drawer.addEventListener('keydown', onKeyDown)
    return () => drawer.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])

  // When the drawer closes via Escape or toggle (not via link click,
  // which transfers focus to the navigated content), restore focus to
  // the toggle so keyboard users land on a predictable target.
  const previousOpenRef = useRef(false)
  useEffect(() => {
    if (previousOpenRef.current && !menuOpen) {
      const activeElementInDrawer = drawerRef.current?.contains(
        document.activeElement,
      )
      if (activeElementInDrawer || document.activeElement === document.body) {
        toggleRef.current?.focus()
      }
    }
    previousOpenRef.current = menuOpen
  }, [menuOpen])

  return (
    <header className={styles.nav}>
      <div className={`container-wide container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label={t('brandLabel')}>
          <span className={styles.logoChip} aria-hidden="true">
            <Image src="/assets/logo-flask.png" alt="" width={32} height={32} />
          </span>
          <span className={styles.wordmark}>X&nbsp;Element</span>
        </Link>

        <nav
          id="primary-nav"
          aria-label={t('primaryLabel')}
          ref={drawerRef}
          className={`${styles.primaryNav} ${menuOpen ? styles.primaryNavOpen : ''}`}
        >
          <ul className={styles.links}>
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={closeMenu}>
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
          {/* Mobile-only toggle. Hidden on desktop via CSS — we don't
              short-circuit it in JS to keep SSR markup identical across
              breakpoints (avoids hydration mismatch when JS races with
              CSS media-query resolution). */}
          <button
            type="button"
            ref={toggleRef}
            className={styles.menuToggle}
            aria-expanded={menuOpen}
            aria-controls="primary-nav"
            aria-label={menuOpen ? t('menuClose') : t('menuOpen')}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span
              className={`${styles.menuIcon} ${menuOpen ? styles.menuIconOpen : ''}`}
              aria-hidden="true"
            >
              <span className={styles.menuIconBars}>
                <span />
                <span />
                <span />
              </span>
              <span className={styles.menuIconX}>
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <line x1="3" y1="3" x2="13" y2="13" />
                  <line x1="13" y1="3" x2="3" y2="13" />
                </svg>
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
