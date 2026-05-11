function StatCard({ label, value, unit, delta, deltaDir, signal }) {
  return (
    <div className={`stat ${signal ? 'signal' : ''}`}>
      <Eyebrow>{label}</Eyebrow>
      <div className="stat-value">
        {value}
        {unit && <span style={{ fontSize: 20, color: 'var(--fg-3)', marginLeft: 4 }}>{unit}</span>}
      </div>
      <div className="stat-meta">
        <span className={`stat-delta ${deltaDir || ''}`}>{delta}</span>
        <Icon name={deltaDir === 'up' ? 'trending-up' : deltaDir === 'down' ? 'trending-down' : 'minus'} size={14} style={{ color: 'var(--fg-3)' }}/>
      </div>
    </div>
  );
}
Object.assign(window, { StatCard });
