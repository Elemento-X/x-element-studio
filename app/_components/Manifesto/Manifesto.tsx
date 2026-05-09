import Image from 'next/image'
import { Reveal } from '../Reveal/Reveal'
import styles from './Manifesto.module.css'

export function Manifesto() {
  return (
    <section id="manifesto" className={styles.manifesto} aria-label="Manifesto">
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
          <p className={styles.line}>We are not seen.</p>
          <p className={`${styles.line} ${styles.gold}`}>
            But everything works
          </p>
          <p className={styles.line}>because of us.</p>
        </blockquote>

        <p className={styles.body}>
          We are the team called when the system has to work. When downtime is
          expensive. When the people closest to the problem need{' '}
          <strong className={styles.gold}>leverage</strong>, not another
          meeting.
        </p>

        <footer className={styles.sig}>
          <cite>
            Elemento&#8209;X &nbsp;·&nbsp; Manifesto &nbsp;·&nbsp; 2026
          </cite>
        </footer>
      </Reveal>
    </section>
  )
}
