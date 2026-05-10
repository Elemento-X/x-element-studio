import { Button } from '../Button/Button'
import { Reveal } from '../Reveal/Reveal'
import { SectionHead } from '../SectionHead/SectionHead'
import styles from './Capabilities.module.css'

const SERVICES = [
  {
    num: '01 / 07',
    title: 'Full-stack engineering',
    copy: 'Typed end-to-end. Observable on day one. Built to survive three rewrites without anyone calling for help.',
    meta: 'Web · API · Infra',
    duration: 'ongoing',
  },
  {
    num: '02 / 07',
    title: 'AI engineering',
    copy: 'Model selection, retrieval, evaluation, guardrails. Inference that ships in production — not in a demo notebook.',
    meta: 'LLM · RAG · Evals',
    duration: '3–12w',
  },
  {
    num: '03 / 07',
    title: 'Automation pipelines',
    copy: 'Event-driven workflows that remove the human from the seam between two systems, two timezones, or two spreadsheets.',
    meta: 'Pipelines · Agents · Webhooks',
    duration: '2–6w',
  },
  {
    num: '04 / 07',
    title: 'Internal tools',
    copy: 'Operations consoles your team opens before email. Dashboards that surface the number that actually moves.',
    meta: 'Admin · Ops · Analytics',
    duration: '4–8w',
  },
  {
    num: '05 / 07',
    title: 'Product strategy',
    copy: 'Roadmaps with teeth. Scope tied to a measurable outcome — and the scope that gets cut for the same reason.',
    meta: 'Discovery · Thesis · Roadmap',
    duration: '14d',
  },
  {
    num: '06 / 07',
    title: 'Design systems',
    copy: 'Tokenized primitives and component libraries that compound across teams, products, and the next three years of hiring.',
    meta: 'Tokens · Components · Docs',
    duration: '6–10w',
  },
  {
    num: '07 / 07',
    title: 'Interface design',
    copy: 'Interfaces engineered for decisions. Dense where density helps, silent everywhere else. No screen exists without a reason.',
    meta: 'Research · Flows · Fidelity',
    duration: '4–8w',
  },
]

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

export function Capabilities() {
  return (
    <section className={`${styles.section} block`} id="capabilities">
      <div className="container-wide container">
        <SectionHead
          eyebrow="Capabilities"
          number="003 · CORE"
          title="What we build"
          copy="Seven disciplines. One team. Each engagement uses the minimum that solves the system — nothing ceremonial, nothing for the wall. We come in to architect, ship, and hand over operations that keep running after we leave."
        />

        <ul className={styles.grid}>
          {SERVICES.map((s) => (
            <Reveal key={s.num} as="li" className={styles.svc}>
              <div className={styles.svcHead}>
                <span className={styles.svcNum}>{s.num}</span>
                <Arrow />
              </div>
              <h3 className={styles.svcTitle}>{s.title}</h3>
              <p className={styles.svcCopy}>{s.copy}</p>
              <div className={styles.svcMeta}>
                <span>{s.meta}</span>
                <span>{s.duration}</span>
              </div>
            </Reveal>
          ))}

          <Reveal as="li" className={`${styles.svc} ${styles.tagline}`}>
            <div className={styles.taglineCopy}>
              <div className={styles.taglineEyebrow}>Engagement model</div>
              <div className={styles.taglineLine}>
                Sprint, retainer, or embed. We scope the partnership to the
                system &mdash; not to the calendar.
              </div>
            </div>
            <Button href="#contact" variant="ghost" withArrow>
              Send brief
            </Button>
          </Reveal>
        </ul>
      </div>
    </section>
  )
}
