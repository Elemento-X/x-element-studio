import { getTranslations } from 'next-intl/server'
import { env } from '@/config/env'
import { Button } from '../Button/Button'
import { ContactForm } from '../ContactForm/ContactFormLazy'
import { Reveal } from '../Reveal/Reveal'
import styles from './FinalCta.module.css'

// Stable list of brief rows. `signal: true` flags the row that gets
// the gold treatment when the dormant (mailto) state is rendered.
const BRIEF_KEYS: { key: string; signal?: boolean }[] = [
  { key: 'availability', signal: true },
  { key: 'response' },
  { key: 'engagements' },
  { key: 'diagnostic' },
  { key: 'minScope' },
  { key: 'regions' },
]

export async function FinalCta() {
  const t = await getTranslations('finalCta')
  const formEnabled = env.NEXT_PUBLIC_CONTACT_FORM_ENABLED

  // Brand rule: 1 gold per primary viewport. With the form active, the
  // single gold of the FinalCta is the .card::before hairline (designer
  // spec). The intro eyebrow's gold modifier and the h2's gold word both
  // cede so they don't compete; the eyebrow's own ::before hairline also
  // cedes via .eyebrowMuted (otherwise on desktop ≥1024px the 14×1px
  // hairline of the intro eyebrow coexists with the 40×1px hairline of
  // the card, totaling 2 golds in the same viewport row). Lexical
  // emphasis on "brief." comes from line-break + last-word position.
  // In the dormant (mailto) state the gold modifier still applies,
  // since the card is the only other gold.
  const eyebrowClassName = formEnabled
    ? `${styles.eyebrow} ${styles.eyebrowMuted}`
    : `${styles.eyebrow} ${styles.signal}`
  const briefClassName = formEnabled ? undefined : styles.gold

  return (
    <section className={styles.section} id="contact">
      <div className="container-wide container">
        <div className={styles.inner}>
          <Reveal>
            <span className={eyebrowClassName}>{t('eyebrow')}</span>
            <h2 className={styles.title}>
              {t('titleLine1')}
              <br />
              <span className={briefClassName}>{t('titleLine2')}</span>
            </h2>
            <p className={styles.body}>{t('body')}</p>
            {!formEnabled && (
              <div className={styles.cta}>
                <Button
                  href="mailto:contact@elemento-x.com"
                  variant="primary"
                  withArrow
                >
                  {t('ctaPrimary')}
                </Button>
                <Button href="mailto:contact@elemento-x.com" variant="ghost">
                  {t('ctaGhost')}
                </Button>
              </div>
            )}
          </Reveal>

          <Reveal className={styles.card}>
            {formEnabled ? (
              <>
                <span className={`${styles.eyebrow} ${styles.eyebrowMuted}`}>
                  {t('cardEyebrow')}
                </span>
                <ContactForm />
              </>
            ) : (
              <>
                <span className={styles.eyebrow}>{t('cardEyebrow')}</span>
                <dl className={styles.brief}>
                  {BRIEF_KEYS.map((r) => (
                    <div key={r.key} className={styles.row}>
                      <dt className={styles.k}>{t(`brief.${r.key}.k`)}</dt>
                      <dd
                        className={`${styles.v} ${r.signal ? styles.vSignal : ''}`}
                      >
                        {t(`brief.${r.key}.v`)}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className={styles.disclaimer}>{t('disclaimer')}</div>
              </>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
