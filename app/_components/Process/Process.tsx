import type { ReactNode } from 'react'
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

interface Step {
  num: string
  title: string
  copy: string
  artifact: string
  illust: ReactNode
  coords: StepCoord[]
}

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Discover',
    copy: 'We map the system you already run. We surface the constraints nobody writes down. We name the one thing actually in the way — before anyone touches code.',
    artifact: 'Signal brief',
    illust: <DiscoverIllust />,
    coords: [
      { pos: 'tl', text: 'SCAN · 01' },
      { pos: 'tr', text: '◆ DETECT', signal: true },
      { pos: 'bl', text: 'LAT —23.55' },
      { pos: 'br', text: 'LNG —46.63' },
    ],
  },
  {
    num: '02',
    title: 'Architect',
    copy: 'We model the solution before we build it. Data contracts, interfaces, failure modes — written down, reviewed, signed. The build is execution, not discovery.',
    artifact: 'System blueprint',
    illust: <ArchitectIllust />,
    coords: [
      { pos: 'tl', text: 'BLUEPRINT · 02' },
      { pos: 'tr', text: 'REV.A' },
      { pos: 'bl', text: 'LAYERS · 04' },
      { pos: 'br', text: '◆ MODEL', signal: true },
    ],
  },
  {
    num: '03',
    title: 'Build',
    copy: 'Typed code, observable from the first commit, shipped in production-sized slices. No staging theatre. No demo branches. The system you see is the system that runs.',
    artifact: 'Shipped surface',
    illust: <BuildIllust />,
    coords: [
      { pos: 'tl', text: 'PIPELINE · 03' },
      { pos: 'tr', text: '128 / FLOWS' },
      { pos: 'bl', text: '◆ DEPLOY', signal: true },
      { pos: 'br', text: 'v0.4.2' },
    ],
  },
  {
    num: '04',
    title: 'Scale',
    copy: 'We harden it, document it, and hand over the keys. Your team operates the system without us. The engagement ends when the system runs alone — that is the point.',
    artifact: 'Operational handoff',
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

export function Process() {
  return (
    <section className={`${styles.section} block`} id="process">
      <div className="container-wide container">
        <SectionHead
          eyebrow="Process"
          number="004 · METHOD"
          title="Four phases. No ceremony."
          copy="Every engagement moves through the same four stages. Each phase produces an artifact the next one needs. No deck for the deck’s sake."
        />

        <ProcessGrid>
          {STEPS.map((s) => (
            <Reveal key={s.num} as="li" className={styles.step}>
              <div className={styles.head}>
                <span className={styles.num}>{s.num}</span>
                <Arrow />
              </div>
              <h3 className={styles.title}>{s.title}</h3>
              <p className={styles.copy}>{s.copy}</p>

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
                <span className={styles.tagK}>Artifact</span>
                <span className={styles.tagV}>{s.artifact}</span>
              </div>
            </Reveal>
          ))}
        </ProcessGrid>
      </div>
    </section>
  )
}
