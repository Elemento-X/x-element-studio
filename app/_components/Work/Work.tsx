import type { ReactNode } from 'react'
import { Reveal } from '../Reveal/Reveal'
import { SectionHead } from '../SectionHead/SectionHead'
import {
  BarsViz,
  ChartViz,
  CrosshairViz,
  LayersViz,
  OrbitViz,
  VizGridBg,
} from './visualizations'
import styles from './Work.module.css'

interface CaseStat {
  k: string
  v: string
  signal?: boolean
}

interface CaseProps {
  client: string
  title: string
  copy?: string
  stats: CaseStat[]
  viz: ReactNode
  vizLabels: {
    topLeft?: string
    topRight?: string
    bottomLeft?: string
    bottomRight?: string
  }
  tall?: boolean
  signalLabel?: string
}

function CaseCard({
  client,
  title,
  copy,
  stats,
  viz,
  vizLabels,
  tall = false,
}: CaseProps) {
  return (
    <Reveal as="article" className={styles.case}>
      <div className={styles.head}>
        <span className={styles.client}>{client}</span>
        <span className={styles.status}>Operational</span>
      </div>
      <figure className={`${styles.viz} ${tall ? styles.vizTall : ''}`}>
        <VizGridBg />
        {viz}
        <figcaption className={styles.vizLabels}>
          {vizLabels.topLeft && (
            <span className={`${styles.label} ${styles.topLeft}`}>
              {vizLabels.topLeft}
            </span>
          )}
          {vizLabels.topRight && (
            <span
              className={`${styles.label} ${styles.topRight} ${styles.signal}`}
            >
              {vizLabels.topRight}
            </span>
          )}
          {vizLabels.bottomLeft && (
            <span className={`${styles.label} ${styles.bottomLeft}`}>
              {vizLabels.bottomLeft}
            </span>
          )}
          {vizLabels.bottomRight && (
            <span
              className={`${styles.label} ${styles.bottomRight} ${styles.signal}`}
            >
              {vizLabels.bottomRight}
            </span>
          )}
        </figcaption>
      </figure>
      <h3 className={styles.title}>{title}</h3>
      {copy && <p className={styles.copy}>{copy}</p>}
      <div className={styles.stats}>
        {stats.map((s) => (
          <div key={s.k} className={styles.stat}>
            <span className={styles.k}>{s.k}</span>
            <span className={`${styles.v} ${s.signal ? styles.vSignal : ''}`}>
              {s.v}
            </span>
          </div>
        ))}
      </div>
    </Reveal>
  )
}

export function Work() {
  return (
    <section className={`${styles.section} block`} id="work">
      <div className="container-wide container">
        <SectionHead
          eyebrow="Signal"
          number="005 · IMPACT"
          title={
            <>
              Selected
              <br />
              impact
            </>
          }
          copy="A partial record. Specifics intentionally understated. Most of what we ship is invisible to end users — measured by what stops breaking, not by what gets announced."
        />

        <div className={styles.grid}>
          <CaseCard
            client="EX-2049 · Internal media operations"
            title="190 hours a year, recovered from a media operations team."
            copy="A daily multi-tool process — manual exports, spreadsheet stitching, Slack approvals — replaced by an event-driven pipeline with a single audit surface. The team got their week back."
            stats={[
              { k: 'Hours / year', v: '+190', signal: true },
              { k: 'Manual steps', v: '12 → 1' },
              { k: 'Error rate', v: 'near zero' },
            ]}
            viz={<ChartViz />}
            vizLabels={{
              topLeft: 'MANUAL OPS · HRS/WK',
              bottomLeft: 'Q1 — Q4',
              topRight: 'SIGNAL ↑ 190H/Y',
            }}
            tall
          />

          <CaseCard
            client="EX-2112 · Operations team (NDA)"
            title="A private knowledge agent for a 200-person operations team."
            copy="Retrieval over internal documents, structured evals, role-scoped access. Vendor APIs never touch customer data. Answers in seconds replaced threads in days."
            stats={[
              { k: 'Queries / day', v: '4.2k' },
              { k: 'Eval score', v: '94%', signal: true },
              { k: 'Time-to-answer', v: '2d → 4s' },
            ]}
            viz={<OrbitViz />}
            vizLabels={{
              topLeft: 'AGENT MESH · 12 NODES',
              bottomRight: 'ACTIVE',
            }}
          />
        </div>

        <div className={styles.row}>
          <CaseCard
            client="EX-1984 · Logistics (NDA)"
            title="Dispatch throughput tripled, with the same team."
            stats={[
              { k: 'Throughput', v: '3.2×', signal: true },
              { k: 'Errors', v: '−41%' },
              { k: 'Headcount', v: 'unchanged' },
            ]}
            viz={<BarsViz />}
            vizLabels={{
              topLeft: 'DISPATCH · WK',
              topRight: '↑ 3.2×',
            }}
          />

          <CaseCard
            client="EX-2277 · Multi-product platform (NDA)"
            title="Five product surfaces, one tokenized system."
            stats={[
              { k: 'Components', v: '147' },
              { k: 'Release time', v: '−62%', signal: true },
              { k: 'Visual drift', v: 'closed' },
            ]}
            viz={<LayersViz />}
            vizLabels={{
              topLeft: 'TOKENS · COMPONENTS · DOCS',
              bottomRight: 'v2.4',
            }}
          />

          <CaseCard
            client="EX-2318 · Finance ops (NDA)"
            title="Seven tabs collapsed into one operations console."
            stats={[
              { k: 'Context switches', v: '−74%', signal: true },
              { k: 'Resolution time', v: '12m avg' },
              { k: 'Tickets / month', v: '−48%' },
            ]}
            viz={<CrosshairViz />}
            vizLabels={{
              topLeft: 'TARGET · OPS',
              bottomRight: '98.5%',
            }}
          />
        </div>
      </div>
    </section>
  )
}
