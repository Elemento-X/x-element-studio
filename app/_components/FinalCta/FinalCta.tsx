import { Button } from '../Button/Button'
import { Reveal } from '../Reveal/Reveal'
import styles from './FinalCta.module.css'

const BRIEF_ROWS = [
  { k: 'Availability', v: 'Q3 · 2026', signal: true },
  { k: 'Response', v: '< 24 hours' },
  { k: 'Engagements', v: '3 active / 2 open' },
  { k: 'Diagnostic', v: '14 days' },
  { k: 'Minimum scope', v: '1 system' },
  { k: 'Regions', v: 'Global · Remote' },
]

export function FinalCta() {
  return (
    <section className={styles.section} id="contact">
      <div className="container-wide container">
        <div className={styles.inner}>
          <Reveal>
            <span className={`${styles.eyebrow} ${styles.signal}`}>
              Initiate contact &nbsp;·&nbsp; 006
            </span>
            <h2 className={styles.title}>
              Send the
              <br />
              <span className={styles.gold}>brief.</span>
            </h2>
            <p className={styles.body}>
              One page. The system you want fixed. A measurable outcome. We
              answer in 24 hours &mdash; yes, no, or how.
            </p>
            <div className={styles.cta}>
              <Button
                href="mailto:contact@elemento-x.com"
                variant="primary"
                withArrow
              >
                Send brief
              </Button>
              <Button href="mailto:contact@elemento-x.com" variant="ghost">
                Talk to founders
              </Button>
            </div>
          </Reveal>

          <Reveal className={styles.card}>
            <span className={styles.eyebrow}>Engagement brief</span>
            <dl className={styles.brief}>
              {BRIEF_ROWS.map((r) => (
                <div key={r.k} className={styles.row}>
                  <dt className={styles.k}>{r.k}</dt>
                  <dd
                    className={`${styles.v} ${r.signal ? styles.vSignal : ''}`}
                  >
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
            <div className={styles.disclaimer}>
              We partner with a select number of teams each quarter. Selection
              is by fit &mdash; measured by whether we can make the system
              measurably better, not whether the deal closes.
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
