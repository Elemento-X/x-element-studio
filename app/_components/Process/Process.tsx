import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { Reveal } from '../Reveal/Reveal'
import { SectionHead } from '../SectionHead/SectionHead'
import { ProcessGrid } from './ProcessGrid'
import {
  ArchitectIllust,
  BuildIllust,
  DiscoverIllust,
  ScaleIllust,
} from './illustrations'
import styles from './Process.module.css'

interface StepCoord {
  pos: 'tl' | 'tr' | 'bl' | 'br'
  text: string
  signal?: boolean
}

interface StepStructure {
  key: 'discover' | 'architect' | 'build' | 'scale'
  illust: ReactNode
  coords: StepCoord[]
}

// Stable per-step structure (illust + visualization coords). Visible
// copy (title, body, artifact) lives in messages under process.steps.<key>.
// The coord labels are intentionally code-like (SCAN · 01, BLUEPRINT ·
// 02 …) — they stay in source as part of the visual motif, not as
// translatable copy.
const STEPS: StepStructure[] = [
  {
    key: 'discover',
    illust: <DiscoverIllust />,
    coords: [
      { pos: 'tl', text: 'SCAN · 01' },
      { pos: 'tr', text: '◆ DETECT', signal: true },
      { pos: 'bl', text: 'LAT —23.55' },
      { pos: 'br', text: 'LNG —46.63' },
    ],
  },
  {
    key: 'architect',
    illust: <ArchitectIllust />,
    coords: [
      { pos: 'tl', text: 'BLUEPRINT · 02' },
      { pos: 'tr', text: 'REV.A' },
      { pos: 'bl', text: 'LAYERS · 04' },
      { pos: 'br', text: '◆ MODEL', signal: true },
    ],
  },
  {
    key: 'build',
    illust: <BuildIllust />,
    coords: [
      { pos: 'tl', text: 'PIPELINE · 03' },
      { pos: 'tr', text: '128 / FLOWS' },
      { pos: 'bl', text: '◆ DEPLOY', signal: true },
      { pos: 'br', text: 'v0.4.2' },
    ],
  },
  {
    key: 'scale',
    illust: <ScaleIllust />,
    coords: [
      { pos: 'tl', text: 'ORBIT · 04' },
      { pos: 'tr', text: '99.98%' },
      { pos: 'bl', text: 'UPTIME · 365D' },
      { pos: 'br', text: '◆ AUTONOMOUS', signal: true },
    ],
  },
]

const Arrow = () => (
  <svg
    className={styles.arrow}
    viewBox="0 0 18 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="square"
    aria-hidden="true"
  >
    <path d="M1 7h15M11 2l5 5-5 5" />
  </svg>
)

export async function Process() {
  const t = await getTranslations('process')

  return (
    <section className={`${styles.section} block`} id="process">
      <div className="container-wide container">
        <SectionHead
          eyebrow={t('eyebrow')}
          number={t('number')}
          title={t('title')}
          copy={t('copy')}
        />

        <ProcessGrid>
          {STEPS.map((s) => (
            <Reveal key={s.key} as="li" className={styles.step}>
              <div className={styles.head}>
                <span className={styles.num}>{t(`steps.${s.key}.num`)}</span>
                <Arrow />
              </div>
              <h3 className={styles.title}>{t(`steps.${s.key}.title`)}</h3>
              <p className={styles.copy}>{t(`steps.${s.key}.copy`)}</p>

              <div className={styles.illust} aria-hidden="true">
                <span className={`${styles.corner} ${styles.cornerTl}`} />
                <span className={`${styles.corner} ${styles.cornerTr}`} />
                <span className={`${styles.corner} ${styles.cornerBl}`} />
                <span className={`${styles.corner} ${styles.cornerBr}`} />
                {s.coords.map((c) => (
                  <span
                    key={c.pos}
                    className={[
                      styles.coord,
                      styles[`coord${c.pos.toUpperCase()}`],
                      c.signal && styles.coordSignal,
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {c.text}
                  </span>
                ))}
                {s.illust}
              </div>

              <div className={styles.tag}>
                <span className={styles.tagK}>{t('artifactLabel')}</span>
                <span className={styles.tagV}>
                  {t(`steps.${s.key}.artifact`)}
                </span>
              </div>
            </Reveal>
          ))}
        </ProcessGrid>
      </div>
    </section>
  )
}
