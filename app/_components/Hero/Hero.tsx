import { Button } from '../Button/Button'
import { HeroGlyph } from './HeroGlyph'
import styles from './Hero.module.css'

export function Hero() {
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
            EX · 001 &nbsp;/&nbsp; STUDIO
          </span>
          <span className={styles.pill}>
            <span className={styles.signalDiamond}>◆</span>SYSTEM ACTIVE
          </span>
          <span className={`${styles.pill} ${styles.pillMono}`}>
            SIG · 42MS LATENCY
          </span>
        </div>

        <h1 className={styles.headline}>
          We build
          <br />
          <span className={styles.thin}>the systems that</span>
          <br />
          <span className={styles.gold}>erase manual work</span>.
        </h1>

        <p className={styles.sub}>
          Elemento-X is a technology studio for teams paying the cost of manual
          work. We design, ship, and hand over systems that recover hours
          &mdash; measured in production, not in slides.
        </p>

        <div className={styles.cta}>
          <Button href="#contact" variant="primary" withArrow>
            Send brief
          </Button>
          <Button href="#contact" variant="ghost">
            Talk to founders
          </Button>
        </div>
      </div>

      <div className={`container-wide container ${styles.bottom}`}>
        <div className={styles.bottomInner}>
          <div className={styles.scroll}>
            <span className={styles.scrollLine} />
            <span>Scroll to explore</span>
          </div>
          <div className={styles.coords}>
            <div>
              <span className={styles.key}>LAT</span>
              <span className={styles.val}>—23.5489°S</span>
            </div>
            <div>
              <span className={styles.key}>LNG</span>
              <span className={styles.val}>—46.6388°W</span>
            </div>
            <div>
              <span className={styles.key}>NODE</span>
              <span className={styles.val}>EX-CORE-01</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
