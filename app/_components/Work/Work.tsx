import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
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

interface CaseStatValue {
  v: string
  signal?: boolean
}

interface CaseCardProps {
  client: string
  title: string
  copy?: string
  stats: { k: string; v: string; signal?: boolean }[]
  viz: ReactNode
  vizLabels: {
    topLeft?: string
    topRight?: string
    bottomLeft?: string
    bottomRight?: string
  }
  statusLabel: string
  tall?: boolean
}

// Case-card values (numbers, deltas, viz labels) are intentional code
// — they're part of the visual motif, not translatable copy. Only the
// labels (client name, title, body copy, stat keys) come from messages.
interface CaseStructure {
  key: 'mediaOps' | 'knowledgeAgent' | 'logistics' | 'platform' | 'financeOps'
  statValues: Record<string, CaseStatValue>
  vizLabels: CaseCardProps['vizLabels']
  viz: ReactNode
  tall?: boolean
  hasCopy?: boolean
}

const CASES_FEATURED: CaseStructure[] = [
  {
    key: 'mediaOps',
    statValues: {
      hours: { v: '+190', signal: true },
      manualSteps: { v: '12 → 1' },
      errorRate: { v: 'near zero' },
    },
    viz: <ChartViz />,
    vizLabels: {
      topLeft: 'MANUAL OPS · HRS/WK',
      bottomLeft: 'Q1 — Q4',
      topRight: 'SIGNAL ↑ 190H/Y',
    },
    tall: true,
    hasCopy: true,
  },
  {
    key: 'knowledgeAgent',
    statValues: {
      queries: { v: '4.2k' },
      evalScore: { v: '94%', signal: true },
      ttAnswer: { v: '2d → 4s' },
    },
    viz: <OrbitViz />,
    vizLabels: {
      topLeft: 'AGENT MESH · 12 NODES',
      bottomRight: 'ACTIVE',
    },
    hasCopy: true,
  },
]

const CASES_ROW: CaseStructure[] = [
  {
    key: 'logistics',
    statValues: {
      throughput: { v: '3.2×', signal: true },
      errors: { v: '−41%' },
      headcount: { v: 'unchanged' },
    },
    viz: <BarsViz />,
    vizLabels: {
      topLeft: 'DISPATCH · WK',
      topRight: '↑ 3.2×',
    },
  },
  {
    key: 'platform',
    statValues: {
      components: { v: '147' },
      releaseTime: { v: '−62%', signal: true },
      visualDrift: { v: 'closed' },
    },
    viz: <LayersViz />,
    vizLabels: {
      topLeft: 'TOKENS · COMPONENTS · DOCS',
      bottomRight: 'v2.4',
    },
  },
  {
    key: 'financeOps',
    statValues: {
      contextSwitches: { v: '−74%', signal: true },
      resolutionTime: { v: '12m avg' },
      tickets: { v: '−48%' },
    },
    viz: <CrosshairViz />,
    vizLabels: {
      topLeft: 'TARGET · OPS',
      bottomRight: '98.5%',
    },
  },
]

function CaseCard({
  client,
  title,
  copy,
  stats,
  viz,
  vizLabels,
  statusLabel,
  tall = false,
}: CaseCardProps) {
  return (
    <Reveal as="article" className={styles.case}>
      <div className={styles.head}>
        <span className={styles.client}>{client}</span>
        <span className={styles.status}>{statusLabel}</span>
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

export async function Work() {
  const t = await getTranslations('work')
  const statusLabel = t('statusLabel')

  function buildStats(c: CaseStructure) {
    return Object.entries(c.statValues).map(([statKey, val]) => ({
      k: t(`cases.${c.key}.stats.${statKey}`),
      v: val.v,
      signal: val.signal,
    }))
  }

  return (
    <section className={`${styles.section} block`} id="work">
      <div className="container-wide container">
        <SectionHead
          eyebrow={t('eyebrow')}
          number={t('number')}
          title={
            <>
              {t('titleLine1')}
              <br />
              {t('titleLine2')}
            </>
          }
          copy={t('copy')}
        />

        <div className={styles.grid}>
          {CASES_FEATURED.map((c) => (
            <CaseCard
              key={c.key}
              client={t(`cases.${c.key}.client`)}
              title={t(`cases.${c.key}.title`)}
              copy={c.hasCopy ? t(`cases.${c.key}.copy`) : undefined}
              stats={buildStats(c)}
              viz={c.viz}
              vizLabels={c.vizLabels}
              statusLabel={statusLabel}
              tall={c.tall}
            />
          ))}
        </div>

        <div className={styles.row}>
          {CASES_ROW.map((c) => (
            <CaseCard
              key={c.key}
              client={t(`cases.${c.key}.client`)}
              title={t(`cases.${c.key}.title`)}
              stats={buildStats(c)}
              viz={c.viz}
              vizLabels={c.vizLabels}
              statusLabel={statusLabel}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
