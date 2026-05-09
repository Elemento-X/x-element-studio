import { Button } from '../Button/Button'
import { Reveal } from '../Reveal/Reveal'
import { SectionHead } from '../SectionHead/SectionHead'
import styles from './Capabilities.module.css'

const SERVICES = [
  {
    num: '01 / 07',
    title: 'Product Strategy',
    copy: 'We translate business outcomes into system architecture. Roadmaps with teeth. Scope with a reason.',
    meta: 'Discovery · Thesis · Roadmap',
    duration: '14d',
  },
  {
    num: '02 / 07',
    title: 'UI · UX Design',
    copy: 'Interfaces engineered for decisions. Dense where it needs to be, silent everywhere else.',
    meta: 'Research · Flows · Fidelity',
    duration: '4–8w',
  },
  {
    num: '03 / 07',
    title: 'Design Systems',
    copy: 'Tokenized primitives and component libraries that compound across teams and years.',
    meta: 'Tokens · Components · Docs',
    duration: '6–10w',
  },
  {
    num: '04 / 07',
    title: 'Full Stack Development',
    copy: 'Typed end-to-end. Observable by default. Built to survive the next three rewrites.',
    meta: 'Web · API · Infra',
    duration: 'ongoing',
  },
  {
    num: '05 / 07',
    title: 'AI Engineering',
    copy: 'Model selection, evals, retrieval, and guardrails. Quiet inference that actually ships.',
    meta: 'LLM · RAG · Evals',
    duration: '3–12w',
  },
  {
    num: '06 / 07',
    title: 'Automation Workflows',
    copy: 'Event-driven pipelines that eliminate manual work between systems, people, and time zones.',
    meta: 'Pipelines · Agents · Webhooks',
    duration: '2–6w',
  },
  {
    num: '07 / 07',
    title: 'Internal Tools',
    copy: 'Ops consoles, admin surfaces, and dashboards your team will actually open every morning.',
    meta: 'Admin · Ops · Analytics',
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
          copy="Seven disciplines, operated by one team. Every engagement draws the minimum necessary — nothing ceremonial, nothing performative. We come in to architect, ship, and quietly hand over systems that keep working after we leave."
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
                Sprint. Retainer. Or embed. We scope the partnership to the
                system, not the calendar.
              </div>
            </div>
            <Button href="#contact" variant="ghost" withArrow>
              Start a project
            </Button>
          </Reveal>
        </ul>
      </div>
    </section>
  )
}
