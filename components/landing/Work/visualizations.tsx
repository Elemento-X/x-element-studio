export function VizGridBg() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        backgroundImage:
          'linear-gradient(to right, rgba(234,234,234,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(234,234,234,0.03) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }}
    />
  )
}

export function ChartViz() {
  return (
    <svg
      viewBox="0 0 600 260"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="goldFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#F5C21A" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#F5C21A" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,200 C80,195 130,205 200,190 C280,172 340,188 420,176 C490,166 540,172 600,160"
        fill="none"
        stroke="#3A3A3E"
        strokeWidth="1.2"
      />
      <path
        d="M0,220 C80,210 140,215 200,190 C260,165 320,160 380,120 C440,82 490,60 600,32"
        fill="none"
        stroke="#F5C21A"
        strokeWidth="1.8"
      />
      <path
        d="M0,220 C80,210 140,215 200,190 C260,165 320,160 380,120 C440,82 490,60 600,32 L600,260 L0,260 Z"
        fill="url(#goldFill)"
      />
      <circle cx="380" cy="120" r="3" fill="#F5C21A" />
      <circle cx="600" cy="32" r="3.5" fill="#F5C21A" />
      <line x1="0" y1="244" x2="600" y2="244" stroke="rgba(234,234,234,0.06)" />
    </svg>
  )
}

export function OrbitViz() {
  return (
    <svg
      viewBox="0 0 260 200"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <g stroke="rgba(234,234,234,0.14)" strokeWidth="1" fill="none">
        <circle cx="130" cy="100" r="78" />
        <circle cx="130" cy="100" r="54" />
        <circle cx="130" cy="100" r="30" />
      </g>
      <g stroke="#F5C21A" strokeWidth="1.2" fill="none" opacity="0.8">
        <circle cx="130" cy="100" r="78" strokeDasharray="4 6" />
      </g>
      <circle cx="130" cy="100" r="4" fill="#F5C21A" />
      <circle cx="208" cy="100" r="3" fill="#F5C21A" />
      <circle cx="130" cy="46" r="2.5" fill="#EAEAEA" />
      <circle cx="76" cy="100" r="2.5" fill="#EAEAEA" />
      <circle cx="130" cy="154" r="2.5" fill="#EAEAEA" />
    </svg>
  )
}

export function BarsViz() {
  return (
    <svg
      viewBox="0 0 260 200"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <g fill="#2B2B2E">
        <rect x="20" y="120" width="14" height="60" />
        <rect x="44" y="100" width="14" height="80" />
        <rect x="68" y="108" width="14" height="72" />
        <rect x="92" y="90" width="14" height="90" />
        <rect x="116" y="78" width="14" height="102" />
        <rect x="140" y="88" width="14" height="92" />
        <rect x="164" y="64" width="14" height="116" />
        <rect x="188" y="52" width="14" height="128" />
      </g>
      <rect x="212" y="28" width="14" height="152" fill="#F5C21A" />
      <line
        x1="10"
        y1="180"
        x2="250"
        y2="180"
        stroke="rgba(234,234,234,0.08)"
      />
    </svg>
  )
}

export function LayersViz() {
  return (
    <svg
      viewBox="0 0 260 200"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <g stroke="rgba(234,234,234,0.18)" strokeWidth="1" fill="none">
        <rect x="40" y="50" width="180" height="28" />
        <rect x="40" y="86" width="180" height="28" />
        <rect x="40" y="122" width="180" height="28" />
      </g>
      <rect
        x="40"
        y="50"
        width="180"
        height="28"
        fill="none"
        stroke="#F5C21A"
        strokeWidth="1.2"
      />
      <circle cx="130" cy="64" r="2.5" fill="#F5C21A" />
      <circle cx="130" cy="100" r="2.5" fill="#EAEAEA" />
      <circle cx="130" cy="136" r="2.5" fill="#EAEAEA" />
    </svg>
  )
}

export function CrosshairViz() {
  return (
    <svg
      viewBox="0 0 260 200"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden="true"
    >
      <g stroke="rgba(234,234,234,0.12)" strokeWidth="1" fill="none">
        <line x1="0" y1="100" x2="260" y2="100" />
        <line x1="130" y1="0" x2="130" y2="200" />
        <circle cx="130" cy="100" r="60" />
        <circle cx="130" cy="100" r="30" />
      </g>
      <g stroke="#F5C21A" strokeWidth="1.4" fill="none">
        <line x1="130" y1="70" x2="130" y2="130" opacity="0.6" />
        <line x1="100" y1="100" x2="160" y2="100" opacity="0.6" />
      </g>
      <circle cx="130" cy="100" r="4" fill="#F5C21A" />
      <circle cx="170" cy="72" r="3" fill="#EAEAEA" />
    </svg>
  )
}
