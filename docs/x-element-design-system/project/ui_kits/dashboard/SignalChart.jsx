function SignalChart({ data }) {
  // Map data -> polyline points in an 800x220 viewBox.
  const W = 800, H = 220, P = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = (W - 2 * P) / (data.length - 1);
  const points = data.map((v, i) => {
    const x = P + i * step;
    const y = H - P - ((v - min) / range) * (H - 2 * P);
    return [x, y];
  });
  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaD = pathD + ` L${points[points.length-1][0].toFixed(1)},${H-P} L${P},${H-P} Z`;
  const peakIdx = data.indexOf(max);
  const [px, py] = points[peakIdx];

  // Muted baseline series (lagging indicator)
  const base = data.map((v, i) => v * 0.72 + (i % 7) * 1.5);
  const baseMax = Math.max(...base), baseMin = Math.min(...base), br = baseMax - baseMin || 1;
  const basePts = base.map((v, i) => [P + i * step, H - P - ((v - baseMin) / br) * (H - 2 * P)]);
  const baseD = basePts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gold-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F5C21A" stopOpacity="0.18"/>
          <stop offset="1" stopColor="#F5C21A" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* gridlines */}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={P} x2={W - P} y1={P + f * (H - 2 * P)} y2={P + f * (H - 2 * P)} stroke="rgba(234,234,234,0.05)" strokeDasharray="2 4"/>
      ))}
      {/* baseline muted series */}
      <path d={baseD} fill="none" stroke="#2B2B2E" strokeWidth="1.5"/>
      {/* gold area + line */}
      <path d={areaD} fill="url(#gold-fade)"/>
      <path d={pathD} fill="none" stroke="#F5C21A" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      {/* peak marker */}
      <circle cx={px} cy={py} r="3.5" fill="#F5C21A"/>
      <circle cx={px} cy={py} r="8" fill="none" stroke="#F5C21A" strokeOpacity="0.3"/>
      <text x={px + 12} y={py - 10} fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#F5C21A">{max.toFixed(1)} peak</text>
      {/* axis labels */}
      {['00:00','04:00','08:00','12:00','16:00','20:00','24:00'].map((t, i) => (
        <text key={t} x={P + i * ((W - 2*P) / 6)} y={H - 4} fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#6A6A6F" textAnchor="middle">{t}</text>
      ))}
    </svg>
  );
}
Object.assign(window, { SignalChart });
