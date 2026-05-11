import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { Reveal } from '../Reveal/Reveal'
import styles from './Manifesto.module.css'

export async function Manifesto() {
  const t = await getTranslations('manifesto')

  return (
    <section
      id="manifesto"
      className={styles.manifesto}
      aria-label={t('ariaLabel')}
    >
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.glow} />
        <div className={styles.shaft} />
        <div className={styles.floor} />
      </div>

      <Reveal className={`container ${styles.content}`}>
        <span className={styles.flask} aria-hidden="true">
          <Image src="/assets/logo-flask.png" alt="" width={96} height={96} />
        </span>

        <blockquote className={styles.lines}>
          <p className={styles.line}>{t('line1')}</p>
          <p className={`${styles.line} ${styles.gold}`}>{t('line2')}</p>
          <p className={styles.line}>{t('line3')}</p>
        </blockquote>

        <p className={styles.body}>
          {t.rich('body', {
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </p>

        <footer className={styles.sig}>
          <cite>{t('sig')}</cite>
        </footer>
      </Reveal>
    </section>
  )
}
