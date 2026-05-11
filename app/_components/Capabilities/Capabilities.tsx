import { getTranslations } from 'next-intl/server'
import { Button } from '../Button/Button'
import { Reveal } from '../Reveal/Reveal'
import { SectionHead } from '../SectionHead/SectionHead'
import styles from './Capabilities.module.css'

// Stable list of service keys — order is intentional, all copy/meta
// lives in messages.<locale>.json under capabilities.services.<key>.
const SERVICE_KEYS = [
  'fullStack',
  'ai',
  'automation',
  'internalTools',
  'productStrategy',
  'designSystems',
  'interfaceDesign',
] as const

const Arrow = () => (
  <svg
    className={styles.arrow}
    viewBox="0 0 14 14"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    aria-hidden="true"
  >
    <path d="M3 11L11 3M5 3h6v6" />
  </svg>
)

export async function Capabilities() {
  const t = await getTranslations('capabilities')

  return (
    <section className={`${styles.section} block`} id="capabilities">
      <div className="container-wide container">
        <SectionHead
          eyebrow={t('eyebrow')}
          number={t('number')}
          title={t('title')}
          copy={t('copy')}
        />

        <ul className={styles.grid}>
          {SERVICE_KEYS.map((k) => (
            <Reveal key={k} as="li" className={styles.svc}>
              <div className={styles.svcHead}>
                <span className={styles.svcNum}>{t(`services.${k}.num`)}</span>
                <Arrow />
              </div>
              <h3 className={styles.svcTitle}>{t(`services.${k}.title`)}</h3>
              <p className={styles.svcCopy}>{t(`services.${k}.copy`)}</p>
              <div className={styles.svcMeta}>
                <span>{t(`services.${k}.meta`)}</span>
                <span>{t(`services.${k}.duration`)}</span>
              </div>
            </Reveal>
          ))}

          <Reveal as="li" className={`${styles.svc} ${styles.tagline}`}>
            <div className={styles.taglineCopy}>
              <div className={styles.taglineEyebrow}>
                {t('tagline.eyebrow')}
              </div>
              <div className={styles.taglineLine}>{t('tagline.line')}</div>
            </div>
            <Button href="#contact" variant="ghost" withArrow>
              {t('tagline.cta')}
            </Button>
          </Reveal>
        </ul>
      </div>
    </section>
  )
}
