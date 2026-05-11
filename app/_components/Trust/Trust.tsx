import { getTranslations } from 'next-intl/server'
import { Reveal } from '../Reveal/Reveal'
import styles from './Trust.module.css'

// Stable list of stat keys — order is intentional, copy lives in messages.
const STAT_KEYS = ['engagements', 'automation', 'uptime', 'timeSaved'] as const

export async function Trust() {
  const t = await getTranslations('trust')

  return (
    <section className={styles.trust} aria-label={t('ariaLabel')}>
      <div className="container-wide container">
        <Reveal className={styles.head}>
          <div>
            <span className={styles.eyebrow}>{t('eyebrow')}</span>
          </div>
          <div className={styles.headCopy}>{t('headCopy')}</div>
        </Reveal>

        <ul className={styles.grid} aria-label={t('gridLabel')}>
          {STAT_KEYS.map((k) => (
            <Reveal key={k} as="li" className={styles.cell}>
              <div className={styles.num}>{t(`stats.${k}.num`)}</div>
              <div className={styles.stat}>
                {t(`stats.${k}.stat`)}
                <span className={styles.unit}>{t(`stats.${k}.unit`)}</span>
              </div>
              <div className={styles.label}>{t(`stats.${k}.label`)}</div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
