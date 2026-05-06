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
      <div className={`${styles.viz} ${tall ? styles.vizTall : ''}`}>
        <VizGridBg />
        {viz}
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
      </div>
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
          copy="A partial record. Specifics intentionally understated. Most of what we build is, by design, invisible to end users — measured by what stops breaking, not by what gets announced."
        />

        <div className={styles.grid}>
          <CaseCard
            client="EX-2049 · Fintech SaaS"
            title="Reconciliation moved from 14 hours a week to a 9-minute background job."
            copy="We replaced a spreadsheet-driven month-end close with an event-sourced ledger, automated exception routing, and a compact audit console for the finance team."
            stats={[
              { k: 'Ops time', v: '—88%', signal: true },
              { k: 'Close cycle', v: '9d → 1d' },
              { k: 'Accuracy', v: '99.98%' },
            ]}
            viz={<ChartViz />}
            vizLabels={{
              topLeft: 'MANUAL OPS · HRS/WK',
              bottomLeft: 'Q1 — Q4',
              topRight: 'SIGNAL ↓ 88%',
            }}
            tall
          />

          <CaseCard
            client="EX-2112 · Internal AI"
            title="A private knowledge agent for a 200-person operations team."
            copy="Retrieval over internal docs, structured evals, and role-scoped access — without exposing vendor APIs to customer data."
            stats={[
              { k: 'Queries / day', v: '4.2k' },
              { k: 'Eval score', v: '94%', signal: true },
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
            client="EX-1984 · Logistics"
            title="Dispatch throughput multiplied without adding headcount."
            stats={[
              { k: 'Throughput', v: '3.2×', signal: true },
              { k: 'Errors', v: '—41%' },
            ]}
            viz={<BarsViz />}
            vizLabels={{
              topLeft: 'DISPATCH · WK',
              topRight: '↑ 3.2×',
            }}
          />

          <CaseCard
            client="EX-2277 · Design System"
            title="Cross-team UI consolidated into one tokenized system."
            stats={[
              { k: 'Components', v: '147' },
              { k: 'Release time', v: '—62%', signal: true },
            ]}
            viz={<LayersViz />}
            vizLabels={{
              topLeft: 'TOKENS · COMPONENTS · DOCS',
              bottomRight: 'v2.4',
            }}
          />

          <CaseCard
            client="EX-2318 · Ops Console"
            title="A single console replaced seven internal tabs for the ops team."
            stats={[
              { k: 'Context switches', v: '—74%', signal: true },
              { k: 'Resolution', v: '12m avg' },
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
