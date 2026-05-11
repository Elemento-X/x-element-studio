import { getTranslations } from 'next-intl/server'
import { Button } from '../Button/Button'
import { HeroGlyph } from './HeroGlyph'
import styles from './Hero.module.css'

export async function Hero() {
  const t = await getTranslations('hero')

  return (
    <section className={styles.hero}>
      <div className={styles.grid} aria-hidden="true" />
      <div className={styles.shaft} aria-hidden="true" />

      <div className={styles.glyph} aria-hidden="true">
        <HeroGlyph />
      </div>

      <div className={`container-wide container ${styles.content}`}>
        <div className={styles.meta}>
          <span className={`${styles.eyebrow} ${styles.eyebrowSignal}`}>
            {t('eyebrow')}
          </span>
          <span className={styles.pill}>
            <span className={styles.signalDiamond}>◆</span>
            {t('pillSystemActive')}
          </span>
          <span className={`${styles.pill} ${styles.pillMono}`}>
            {t('pillLatency')}
          </span>
        </div>

        <h1 className={styles.headline}>
          {t('headlineLine1')}
          <br />
          <span className={styles.thin}>{t('headlineLine2')}</span>
          <br />
          <span className={styles.gold}>{t('headlineLine3')}</span>.
        </h1>

        <p className={styles.sub}>{t('sub')}</p>

        <div className={styles.cta}>
          <Button href="#contact" variant="primary" withArrow>
            {t('ctaPrimary')}
          </Button>
          <Button href="#contact" variant="ghost">
            {t('ctaGhost')}
          </Button>
        </div>
      </div>

      <div className={`container-wide container ${styles.bottom}`}>
        <div className={styles.bottomInner}>
          <div className={styles.scroll}>
            <span className={styles.scrollLine} />
            <span>{t('scrollHint')}</span>
          </div>
          <div className={styles.coords}>
            <div>
              <span className={styles.key}>{t('coords.latLabel')}</span>
              <span className={styles.val}>{t('coords.latValue')}</span>
            </div>
            <div>
              <span className={styles.key}>{t('coords.lngLabel')}</span>
              <span className={styles.val}>{t('coords.lngValue')}</span>
            </div>
            <div>
              <span className={styles.key}>{t('coords.nodeLabel')}</span>
              <span className={styles.val}>{t('coords.nodeValue')}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
