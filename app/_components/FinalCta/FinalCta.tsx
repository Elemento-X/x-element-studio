import { env } from '@/config/env'
import { Button } from '../Button/Button'
import { ContactForm } from '../ContactForm/ContactFormLazy'
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
  const formEnabled = env.NEXT_PUBLIC_CONTACT_FORM_ENABLED

  // Brand rule: 1 gold per primary viewport. With the form active, the
  // single gold of the FinalCta is the .card::before hairline (designer
  // spec). The intro eyebrow's gold modifier and the h2's gold word both
  // cede so they don't compete; lexical emphasis on "brief." comes from
  // line-break + last-word position. In the dormant (mailto) state the
  // gold modifier still applies, since the card is the only other gold.
  const eyebrowClassName = formEnabled
    ? styles.eyebrow
    : `${styles.eyebrow} ${styles.signal}`
  const briefClassName = formEnabled ? undefined : styles.gold

  return (
    <section className={styles.section} id="contact">
      <div className="container-wide container">
        <div className={styles.inner}>
          <Reveal>
            <span className={eyebrowClassName}>
              Initiate contact &nbsp;·&nbsp; 006
            </span>
            <h2 className={styles.title}>
              Send the
              <br />
              <span className={briefClassName}>brief.</span>
            </h2>
            <p className={styles.body}>
              One page. The system you want fixed. A measurable outcome. We
              answer in 24 hours &mdash; yes, no, or how.
            </p>
            {!formEnabled && (
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
            )}
          </Reveal>

          <Reveal className={styles.card}>
            {formEnabled ? (
              <>
                <span className={`${styles.eyebrow} ${styles.eyebrowMuted}`}>
                  Engagement brief
                </span>
                <ContactForm />
              </>
            ) : (
              <>
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
                  We partner with a select number of teams each quarter.
                  Selection is by fit &mdash; can we make the system measurably
                  better. The deal closing is secondary.
                </div>
              </>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
