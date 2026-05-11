import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import styles from './Footer.module.css'

// Stable column structure (anchors + link keys); labels come from
// messages. The contact-column hrefs all map to the operator inbox.
const CONTACT_EMAIL = 'mailto:contact@elemento-x.com'

const COLS = [
  {
    colKey: 'practice',
    links: [
      { key: 'capabilities', href: '#capabilities' },
      { key: 'process', href: '#process' },
      { key: 'signal', href: '#work' },
      { key: 'manifesto', href: '#manifesto' },
    ],
  },
  {
    colKey: 'contact',
    links: [
      { key: 'email', href: CONTACT_EMAIL },
      { key: 'discovery', href: CONTACT_EMAIL },
      { key: 'press', href: CONTACT_EMAIL },
      { key: 'careers', href: CONTACT_EMAIL },
    ],
  },
  {
    colKey: 'signal',
    links: [
      { key: 'linkedin', href: CONTACT_EMAIL },
      { key: 'github', href: CONTACT_EMAIL },
      { key: 'twitter', href: CONTACT_EMAIL },
      { key: 'dribbble', href: CONTACT_EMAIL },
    ],
  },
] as const

export async function Footer() {
  const t = await getTranslations('footer')

  return (
    <footer className={styles.footer}>
      <div className="container-wide container">
        <div className={styles.grid}>
          <div className={styles.brand}>
            <span className={styles.logoChip} aria-hidden="true">
              <Image
                src="/assets/logo-flask.png"
                alt=""
                width={44}
                height={44}
              />
            </span>
            <div className={styles.wordmark}>Elemento&#8209;X</div>
            <p>{t('tagline')}</p>
          </div>

          {COLS.map((c) => {
            const title = t(`cols.${c.colKey}.title`)
            return (
              <nav key={c.colKey} className={styles.col} aria-label={title}>
                <h3>{title}</h3>
                <ul>
                  {c.links.map((l) => (
                    <li key={l.key}>
                      <Link href={l.href}>
                        {t(`cols.${c.colKey}.links.${l.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )
          })}
        </div>

        <div className={styles.bottom}>
          <div className={styles.left}>
            <span>{t('copyright')}</span>
            <span className={styles.dim}>·</span>
            <span>{t('nodeStatus')}</span>
          </div>
          <div className={styles.right}>
            <Link href={CONTACT_EMAIL}>{t('privacy')}</Link>
            <Link href={CONTACT_EMAIL}>{t('terms')}</Link>
            <span className={styles.diamond} aria-hidden="true">
              ◆
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
