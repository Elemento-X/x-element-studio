import { Reveal } from '../Reveal/Reveal'
import styles from './Trust.module.css'

const STATS = [
  {
    num: '01 · ENGAGEMENTS',
    stat: '42',
    unit: '/ shipped',
    label:
      'Production systems delivered across SaaS, fintech, logistics, and internal ops.',
  },
  {
    num: '02 · AUTOMATION',
    stat: '128',
    unit: '/ flows',
    label:
      'Active pipelines replacing manual work across partner organizations.',
  },
  {
    num: '03 · UPTIME',
    stat: '99.98',
    unit: '%',
    label:
      'Measured across all Elemento-X-operated infrastructure, trailing 12 months.',
  },
  {
    num: '04 · TIME SAVED',
    stat: '11.4k',
    unit: 'hrs / yr',
    label:
      'Recovered engineering and operations hours through automation and tooling.',
  },
]

export function Trust() {
  return (
    <section className={styles.trust} aria-label="Positioning">
      <div className="container-wide container">
        <Reveal className={styles.head}>
          <div>
            <span className={styles.eyebrow}>
              Positioning &nbsp;·&nbsp; 002
            </span>
          </div>
          <div className={styles.headCopy}>
            A focused partner for teams building internal tools, SaaS platforms,
            AI-driven workflows, and automation infrastructure. Quiet execution.
            Measured outcomes.
          </div>
        </Reveal>

        <ul className={styles.grid} aria-label="Studio metrics">
          {STATS.map((s) => (
            <Reveal key={s.num} as="li" className={styles.cell}>
              <div className={styles.num}>{s.num}</div>
              <div className={styles.stat}>
                {s.stat}
                <span className={styles.unit}>{s.unit}</span>
              </div>
              <div className={styles.label}>{s.label}</div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
