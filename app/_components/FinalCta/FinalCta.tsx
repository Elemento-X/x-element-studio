import { Button } from '../Button/Button'
import { Reveal } from '../Reveal/Reveal'
import styles from './FinalCta.module.css'

const BRIEF_ROWS = [
  { k: 'Availability', v: 'Q2 · 2026', signal: true },
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
              Book a
              <br />
              <span className={styles.gold}>discovery call.</span>
            </h2>
            <p className={styles.body}>
              30 minutes. One call. We listen first. If there&rsquo;s a fit, we
              scope a two-week diagnostic and send a written thesis within five
              business days. If there isn&rsquo;t, we say so &mdash; and point
              you somewhere better.
            </p>
            <div className={styles.cta}>
              <Button href="#" variant="primary" withArrow>
                Start a project
              </Button>
              <Button href="mailto:contact@elemento-x.com" variant="ghost">
                contact@elemento-x.com
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
              Engagements are admitted in cohorts. We only onboard a partnership
              when we believe we can make a measurable, defensible difference to
              the system.
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
