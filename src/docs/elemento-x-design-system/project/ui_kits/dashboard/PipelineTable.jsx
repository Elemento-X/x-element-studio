function PipelineTable({ rows, onSelect }) {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Pipeline</th>
          <th>Status</th>
          <th>Trigger</th>
          <th>Owner</th>
          <th style={{textAlign:'right'}}>Latency</th>
          <th style={{textAlign:'right'}}>Runs · 24h</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} onClick={() => onSelect?.(r)}>
            <td>
              <div className="name">{r.name}</div>
              <div className="mono">{r.id}</div>
            </td>
            <td><Badge kind={r.statusKind} dot={r.dot}>{r.status}</Badge></td>
            <td>{r.trigger}</td>
            <td>{r.owner}</td>
            <td className="num">{r.latency}ms</td>
            <td className="num">{r.runs.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
Object.assign(window, { PipelineTable });
