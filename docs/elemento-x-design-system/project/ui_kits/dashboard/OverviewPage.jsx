function OverviewPage() {
  const signalData = useMemo(() => [
    42, 44, 41, 45, 48, 52, 49, 55, 58, 62, 60, 65, 72, 78, 84, 90,
    88, 92, 96, 94, 98, 101, 97, 93, 89, 85, 82, 78, 74, 70, 68, 66
  ], []);

  return (
    <div className="fade-in">
      <div className="page-head">
        <div>
          <Eyebrow>Control · 03:14 UTC</Eyebrow>
          <h1 className="title">Overview</h1>
          <div className="sub">128 pipelines active. 24 live signals. No regressions detected in the last 24h.</div>
        </div>
        <div className="actions">
          <Button icon="download">Export</Button>
          <Button icon="plus" variant="primary">New pipeline</Button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard label="Signals · live"       value="24"    delta="+3 vs. yesterday"    deltaDir="up" signal/>
        <StatCard label="Automations · active" value="128"   delta="stable"/>
        <StatCard label="Uptime · 7d"          value="98.5"  unit="%" delta="+0.2"   deltaDir="up"/>
        <StatCard label="Latency · p95"        value="42"    unit="ms" delta="-8ms" deltaDir="up"/>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <div className="panel">
          <div className="panel-header">
            <div>
              <Eyebrow>Performance</Eyebrow>
              <div className="panel-title" style={{ marginTop: 6 }}>Signal throughput · 24h</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button small>24H</Button>
              <Button small>7D</Button>
              <Button small>30D</Button>
            </div>
          </div>
          <SignalChart data={signalData}/>
          <div style={{ display: 'flex', gap: 24, marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line-hairline)' }}>
            <div>
              <div className="eyebrow">Total</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--fg-1)', marginTop: 4 }}>2,184,920</div>
            </div>
            <div>
              <div className="eyebrow">Peak</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: '#F5C21A', marginTop: 4 }}>101.0 /s</div>
            </div>
            <div>
              <div className="eyebrow">Anomalies</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--fg-1)', marginTop: 4 }}>0</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <Eyebrow>Activity</Eyebrow>
              <div className="panel-title" style={{ marginTop: 6 }}>Recent events</div>
            </div>
            <Button small icon="arrow-right">All</Button>
          </div>
          <ActivityFeed items={[
            { time: '03:14:22', kind: 'signal', msg: '<b>EX-2049</b> — Signal ingestion restored', tag: 'CORE' },
            { time: '03:12:08', kind: 'ok',     msg: '<b>orbital.relay</b> — 128 flows synced',   tag: 'RELAY' },
            { time: '03:09:55', kind: '',       msg: '<b>agent.x</b> deployed v2.4.1',            tag: 'DEPLOY' },
            { time: '03:01:02', kind: 'warn',   msg: '<b>EX-2011</b> — Latency spike resolved',   tag: 'ALERT' },
            { time: '02:48:14', kind: 'ok',     msg: '<b>query.engine</b> scale-out · +4 nodes',   tag: 'INFRA' },
            { time: '02:31:40', kind: '',       msg: '<b>ruleset.v7</b> applied · 43 pipelines',   tag: 'POLICY' },
          ]}/>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <Eyebrow>Systems</Eyebrow>
            <div className="panel-title" style={{ marginTop: 6 }}>Automation pipelines</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button small icon="filter">Filter</Button>
            <Button small icon="arrow-up-down">Sort</Button>
          </div>
        </div>
        <PipelineTable rows={[
          { name: 'ingestion.core',       id: 'EX-2049', status: 'Signal',       statusKind: 'signal',  dot: '#F5C21A', trigger: 'Event · continuous', owner: 'agent.x',    latency: 42,  runs: 18420 },
          { name: 'orbital.relay',        id: 'EX-2011', status: 'Operational',  statusKind: 'ok',      dot: '#8BB89A', trigger: 'Cron · */5 min',     owner: 'agent.n',    latency: 61,  runs: 12218 },
          { name: 'query.engine',         id: 'EX-1907', status: 'Operational',  statusKind: 'ok',      dot: '#8BB89A', trigger: 'On-demand',           owner: 'agent.n',    latency: 88,  runs: 9403  },
          { name: 'ruleset.v7',           id: 'EX-1843', status: 'Standby',      statusKind: 'neutral',                  trigger: 'Manual',              owner: 'agent.k',    latency: 0,   runs: 204   },
          { name: 'vault.sync',           id: 'EX-1712', status: 'Operational',  statusKind: 'ok',      dot: '#8BB89A', trigger: 'Cron · hourly',       owner: 'agent.m',    latency: 112, runs: 7820  },
          { name: 'audit.stream',         id: 'EX-1600', status: 'Review',       statusKind: 'warn',    dot: '#E87264', trigger: 'Event · policy',      owner: 'agent.x',    latency: 204, runs: 4455  },
        ]}/>
      </div>
    </div>
  );
}
Object.assign(window, { OverviewPage });
