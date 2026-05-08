import Image from 'next/image'
import Link from 'next/link'
import styles from './Footer.module.css'

const COLS = [
  {
    title: 'Practice',
    links: [
      { label: 'Capabilities', href: '#capabilities' },
      { label: 'Process', href: '#process' },
      { label: 'Signal', href: '#work' },
      { label: 'Manifesto', href: '#' },
    ],
  },
  {
    title: 'Contact',
    links: [
      {
        label: 'contact@elemento-x.com',
        href: 'mailto:contact@elemento-x.com',
      },
      { label: 'Book discovery', href: '#' },
      { label: 'Press / brand', href: '#' },
      { label: 'Careers', href: '#' },
    ],
  },
  {
    title: 'Signal',
    links: [
      { label: 'LinkedIn', href: '#' },
      { label: 'GitHub', href: '#' },
      { label: 'X / Twitter', href: '#' },
      { label: 'Dribbble', href: '#' },
    ],
  },
]

export function Footer() {
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
            <p>
              Intelligent systems. Real impact. We build what no one sees — so
              that everything works.
            </p>
          </div>

          {COLS.map((c) => (
            <nav key={c.title} className={styles.col} aria-label={c.title}>
              <h3>{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <div className={styles.left}>
            <span>© 2026 ELEMENTO-X</span>
            <span className={styles.dim}>·</span>
            <span>EX-CORE-01 · OPERATIONAL</span>
          </div>
          <div className={styles.right}>
            <Link href="#">Privacy</Link>
            <Link href="#">Terms</Link>
            <span className={styles.diamond} aria-hidden="true">
              ◆
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
