export function HeroGlyph() {
  return (
    <svg
      viewBox="0 0 640 720"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="hg-fade" cx="50%" cy="48%" r="52%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </radialGradient>
        <filter id="hg-glow">
          <feGaussianBlur stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <ellipse cx="320" cy="390" rx="280" ry="310" fill="url(#hg-fade)" />

      {/* Flask body */}
      <rect
        x="276"
        y="80"
        width="16"
        height="90"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <rect
        x="348"
        y="80"
        width="16"
        height="90"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <rect
        x="262"
        y="68"
        width="116"
        height="20"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.7"
      />
      <path
        d="M276 170 C276 195, 220 230, 190 290"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <path
        d="M364 170 C364 195, 420 230, 450 290"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      <circle
        cx="320"
        cy="430"
        r="190"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.55"
      />
      <line
        x1="170"
        y1="560"
        x2="470"
        y2="560"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.45"
      />

      {/* Orbit rings */}
      <circle
        cx="320"
        cy="430"
        r="230"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeDasharray="4 8"
        fill="none"
        opacity="0.28"
      />
      <circle
        cx="320"
        cy="430"
        r="268"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="2 10"
        fill="none"
        opacity="0.18"
      />

      {/* X mark */}
      <g
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.85"
        filter="url(#hg-glow)"
      >
        <line x1="240" y1="340" x2="400" y2="520" />
        <line x1="400" y1="340" x2="240" y2="520" />
      </g>

      {/* Liquid waves */}
      <path
        d="M148 490 C200 475, 260 495, 320 482 C380 469, 432 488, 492 476"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M145 508 C200 492, 262 512, 320 498 C378 484, 435 505, 495 492"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        opacity="0.28"
      />

      {/* Nodes */}
      <circle cx="320" cy="430" r="5" fill="currentColor" opacity="0.9" />
      <circle
        cx="510"
        cy="430"
        r="3.5"
        fill="currentColor"
        opacity="0.8"
        filter="url(#hg-glow)"
      />
      <circle cx="320" cy="200" r="3" fill="currentColor" opacity="0.7" />
      <circle cx="130" cy="430" r="3" fill="currentColor" opacity="0.5" />
      <circle cx="430" cy="265" r="2.5" fill="currentColor" opacity="0.5" />
      <circle cx="210" cy="265" r="2.5" fill="currentColor" opacity="0.5" />

      {/* Connectors */}
      <line
        x1="320"
        y1="430"
        x2="510"
        y2="430"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="3 5"
        opacity="0.35"
      />
      <line
        x1="320"
        y1="430"
        x2="320"
        y2="200"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="3 5"
        opacity="0.28"
      />
      <line
        x1="320"
        y1="430"
        x2="130"
        y2="430"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeDasharray="3 5"
        opacity="0.22"
      />

      {/* Crosshair ticks */}
      <g stroke="currentColor" strokeWidth="0.8" opacity="0.35">
        <line x1="42" y1="430" x2="90" y2="430" />
        <line x1="550" y1="430" x2="598" y2="430" />
        <line x1="320" y1="640" x2="320" y2="688" />
        <line x1="320" y1="30" x2="320" y2="52" />
      </g>

      <text
        x="96"
        y="427"
        fontFamily="'JetBrains Mono','IBM Plex Mono',monospace"
        fontSize="9"
        fill="currentColor"
        opacity="0.4"
        letterSpacing="0.08em"
      >
        SIG
      </text>
      <text
        x="556"
        y="427"
        fontFamily="'JetBrains Mono','IBM Plex Mono',monospace"
        fontSize="9"
        fill="currentColor"
        opacity="0.4"
        letterSpacing="0.08em"
      >
        OUT
      </text>
      <text
        x="290"
        y="702"
        fontFamily="'JetBrains Mono','IBM Plex Mono',monospace"
        fontSize="9"
        fill="currentColor"
        opacity="0.35"
        letterSpacing="0.08em"
      >
        EX
      </text>

      <g
        fontFamily="'JetBrains Mono','IBM Plex Mono',monospace"
        fontSize="9"
        fill="currentColor"
        opacity="0.45"
        letterSpacing="0.06em"
      >
        <text x="470" y="600">
          LAT · 42ms
        </text>
        <text x="470" y="614">
          SIG · 0.98
        </text>
        <text x="470" y="628">
          NODE · 01
        </text>
      </g>
    </svg>
  )
}
