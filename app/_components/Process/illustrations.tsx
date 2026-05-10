/**
 * Process step illustrations — codified motifs.
 * Each maps 1:1 to a phase and uses currentColor + tokens.
 *  01 Discover  → observer eye + crosshair scanning a system
 *  02 Architect → stacked isometric layers (gold = signal layer)
 *  03 Build     → codebase columns / pipeline assembly
 *  04 Scale     → orbital system + target (autonomous)
 */

export function DiscoverIllust() {
  return (
    <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="eye-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5C21A" stopOpacity="0.5" />
          <stop offset="60%" stopColor="#F5C21A" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#F5C21A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="120" r="78" fill="url(#eye-glow)" />

      <circle
        cx="100"
        cy="120"
        r="68"
        fill="none"
        stroke="rgba(234,234,234,0.10)"
        strokeWidth="0.8"
      />
      <circle
        className="disc-ring-dash"
        cx="100"
        cy="120"
        r="52"
        fill="none"
        stroke="rgba(234,234,234,0.14)"
        strokeWidth="0.8"
        strokeDasharray="3 5"
      />
      <circle
        cx="100"
        cy="120"
        r="36"
        fill="none"
        stroke="rgba(234,234,234,0.20)"
        strokeWidth="0.8"
      />

      <path
        className="disc-iris"
        d="M50 120 C 70 96, 130 96, 150 120 C 130 144, 70 144, 50 120 Z"
        fill="none"
        stroke="rgba(234,234,234,0.55)"
        strokeWidth="1.3"
      />
      <circle
        className="disc-iris-gold"
        cx="100"
        cy="120"
        r="14"
        fill="none"
        stroke="#F5C21A"
        strokeWidth="1.3"
      />
      <circle className="disc-pupil" cx="100" cy="120" r="4" fill="#F5C21A" />

      <g stroke="rgba(234,234,234,0.30)" strokeWidth="0.8">
        <line className="disc-ch-l" x1="20" y1="120" x2="44" y2="120" />
        <line className="disc-ch-r" x1="156" y1="120" x2="180" y2="120" />
        <line className="disc-ch-t" x1="100" y1="40" x2="100" y2="64" />
        <line className="disc-ch-b" x1="100" y1="176" x2="100" y2="200" />
      </g>

      <g fill="rgba(234,234,234,0.40)">
        <circle cx="40" cy="60" r="1.6" />
        <circle cx="68" cy="42" r="1.2" />
        <circle cx="160" cy="56" r="1.6" />
        <circle cx="172" cy="86" r="1.2" />
        <circle cx="32" cy="180" r="1.6" />
        <circle cx="58" cy="206" r="1.2" />
        <circle cx="148" cy="196" r="1.6" />
        <circle cx="178" cy="170" r="1.2" />
      </g>
      <circle className="disc-node" cx="160" cy="56" r="3" fill="#F5C21A" />
      <path
        className="disc-trace-draw"
        d="M100 120 L160 56"
        fill="none"
        stroke="#F5C21A"
        strokeWidth="1.0"
        strokeLinecap="round"
        pathLength="1"
      />
      <line
        className="disc-trace"
        x1="100"
        y1="120"
        x2="160"
        y2="56"
        stroke="#F5C21A"
        strokeWidth="0.7"
        strokeDasharray="2 3"
        opacity="0.6"
      />

      <g
        fontFamily="'JetBrains Mono', monospace"
        fontSize="6.5"
        fill="rgba(234,234,234,0.45)"
        letterSpacing="0.08em"
      >
        <text className="disc-sig" x="44" y="232">
          SIG · 0.94
        </text>
        <text x="120" y="232">
          NODES · 18
        </text>
      </g>
    </svg>
  )
}

export function ArchitectIllust() {
  return (
    <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(40 50)">
        <g
          className="arch-l4"
          transform="translate(0 0)"
          stroke="rgba(234,234,234,0.18)"
          strokeWidth="0.9"
          fill="none"
        >
          <path d="M0 30 L60 0 L120 30 L60 60 Z" />
          <line
            x1="20"
            y1="20"
            x2="80"
            y2="50"
            strokeDasharray="2 3"
            opacity="0.7"
          />
          <line
            x1="40"
            y1="10"
            x2="100"
            y2="40"
            strokeDasharray="2 3"
            opacity="0.7"
          />
        </g>

        <g
          className="arch-l3"
          transform="translate(0 32)"
          stroke="rgba(234,234,234,0.32)"
          strokeWidth="0.9"
          fill="none"
        >
          <path d="M0 30 L60 0 L120 30 L60 60 Z" />
          <circle
            cx="60"
            cy="30"
            r="2.5"
            fill="rgba(234,234,234,0.5)"
            stroke="none"
          />
          <circle
            cx="30"
            cy="44"
            r="1.5"
            fill="rgba(234,234,234,0.4)"
            stroke="none"
          />
          <circle
            cx="90"
            cy="44"
            r="1.5"
            fill="rgba(234,234,234,0.4)"
            stroke="none"
          />
        </g>

        <g
          className="arch-l2"
          transform="translate(0 64)"
          stroke="#F5C21A"
          strokeWidth="1.1"
          fill="none"
        >
          <path
            className="arch-l2-fill"
            d="M0 30 L60 0 L120 30 L60 60 Z"
            fill="rgba(245,194,26,0.06)"
          />
          <circle cx="60" cy="30" r="3" fill="#F5C21A" stroke="none" />
          <line
            x1="40"
            y1="20"
            x2="80"
            y2="40"
            stroke="#F5C21A"
            strokeWidth="0.7"
            strokeDasharray="2 3"
            opacity="0.7"
          />
          <line
            x1="80"
            y1="20"
            x2="40"
            y2="40"
            stroke="#F5C21A"
            strokeWidth="0.7"
            strokeDasharray="2 3"
            opacity="0.7"
          />
        </g>

        <g
          className="arch-l1"
          transform="translate(0 96)"
          stroke="rgba(234,234,234,0.45)"
          strokeWidth="0.9"
          fill="none"
        >
          <path d="M0 30 L60 0 L120 30 L60 60 Z" />
          <path
            d="M20 30 L60 10 L100 30 L60 50 Z"
            strokeDasharray="2 3"
            opacity="0.7"
          />
        </g>

        <line
          className="arch-connector"
          x1="60"
          y1="30"
          x2="60"
          y2="156"
          stroke="rgba(234,234,234,0.18)"
          strokeWidth="0.6"
          pathLength="1"
          strokeDasharray="1"
        />

        <g className="arch-labels">
          <g
            fontFamily="'JetBrains Mono', monospace"
            fontSize="6"
            fill="rgba(234,234,234,0.55)"
            letterSpacing="0.08em"
          >
            <text x="-30" y="34">
              L4
            </text>
            <text x="-30" y="66">
              L3
            </text>
            <text x="-30" y="98" fill="#F5C21A">
              L2
            </text>
            <text x="-30" y="130">
              L1
            </text>
          </g>
          <g stroke="rgba(234,234,234,0.30)" strokeWidth="0.6">
            <line x1="-22" y1="32" x2="-8" y2="32" />
            <line x1="-22" y1="64" x2="-8" y2="64" />
            <line x1="-22" y1="96" x2="-8" y2="96" stroke="#F5C21A" />
            <line x1="-22" y1="128" x2="-8" y2="128" />
          </g>
        </g>
      </g>
    </svg>
  )
}

export function BuildIllust() {
  return (
    <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet">
      <g transform="translate(28 48)">
        {/* Column 1 */}
        <g className="build-col-1">
          <rect
            x="0"
            y="20"
            width="22"
            height="120"
            fill="rgba(234,234,234,0.025)"
            stroke="rgba(234,234,234,0.16)"
            strokeWidth="0.7"
          />
          <g stroke="rgba(234,234,234,0.30)" strokeWidth="0.6">
            <line x1="3" y1="32" x2="19" y2="32" />
            <line x1="3" y1="48" x2="14" y2="48" />
            <line x1="3" y1="64" x2="19" y2="64" />
            <line x1="3" y1="80" x2="11" y2="80" />
            <line x1="3" y1="96" x2="17" y2="96" />
            <line x1="3" y1="112" x2="13" y2="112" />
            <line x1="3" y1="128" x2="19" y2="128" />
          </g>
        </g>

        {/* Column 2 */}
        <g className="build-col-2">
          <rect
            x="30"
            y="0"
            width="22"
            height="140"
            fill="rgba(234,234,234,0.025)"
            stroke="rgba(234,234,234,0.16)"
            strokeWidth="0.7"
          />
          <g stroke="rgba(234,234,234,0.30)" strokeWidth="0.6">
            <line x1="33" y1="14" x2="49" y2="14" />
            <line x1="33" y1="30" x2="44" y2="30" />
            <line x1="33" y1="46" x2="49" y2="46" />
            <line x1="33" y1="62" x2="40" y2="62" />
            <line x1="33" y1="78" x2="49" y2="78" />
            <line x1="33" y1="94" x2="46" y2="94" />
            <line x1="33" y1="110" x2="49" y2="110" />
            <line x1="33" y1="126" x2="42" y2="126" />
          </g>
        </g>

        {/* Column 3 */}
        <g className="build-col-3">
          <rect
            x="60"
            y="32"
            width="22"
            height="108"
            fill="rgba(234,234,234,0.025)"
            stroke="rgba(234,234,234,0.16)"
            strokeWidth="0.7"
          />
          <g stroke="rgba(234,234,234,0.30)" strokeWidth="0.6">
            <line x1="63" y1="44" x2="79" y2="44" />
            <line x1="63" y1="60" x2="74" y2="60" />
            <line x1="63" y1="76" x2="79" y2="76" />
            <line x1="63" y1="92" x2="71" y2="92" />
            <line x1="63" y1="108" x2="79" y2="108" />
            <line x1="63" y1="124" x2="76" y2="124" />
          </g>
        </g>

        {/* Column 4 — gold signal column */}
        <g className="build-col-4">
          <rect
            x="90"
            y="14"
            width="22"
            height="126"
            fill="rgba(245,194,26,0.10)"
            stroke="#F5C21A"
            strokeWidth="1"
          />
          <g stroke="#F5C21A" strokeWidth="0.8">
            <line x1="93" y1="26" x2="109" y2="26" />
            <line x1="93" y1="42" x2="104" y2="42" />
            <line x1="93" y1="58" x2="109" y2="58" />
            <line x1="93" y1="74" x2="101" y2="74" />
            <line x1="93" y1="90" x2="109" y2="90" />
            <line x1="93" y1="106" x2="106" y2="106" />
            <line x1="93" y1="122" x2="109" y2="122" />
          </g>
        </g>

        {/* Column 5 */}
        <g className="build-col-5">
          <rect
            x="120"
            y="40"
            width="22"
            height="100"
            fill="rgba(234,234,234,0.025)"
            stroke="rgba(234,234,234,0.16)"
            strokeWidth="0.7"
          />
          <g stroke="rgba(234,234,234,0.30)" strokeWidth="0.6">
            <line x1="123" y1="52" x2="139" y2="52" />
            <line x1="123" y1="68" x2="134" y2="68" />
            <line x1="123" y1="84" x2="139" y2="84" />
            <line x1="123" y1="100" x2="131" y2="100" />
            <line x1="123" y1="116" x2="139" y2="116" />
            <line x1="123" y1="132" x2="136" y2="132" />
          </g>
        </g>

        {/* Pipeline — line draws L→R, dots fade in with the group */}
        <g className="build-pipeline">
          <line
            className="build-pipeline-line"
            x1="0"
            y1="156"
            x2="142"
            y2="156"
            stroke="rgba(234,234,234,0.25)"
            strokeWidth="0.8"
            pathLength="1"
            strokeDasharray="1"
          />
          <circle cx="11" cy="156" r="2" fill="rgba(234,234,234,0.50)" />
          <circle cx="41" cy="156" r="2" fill="rgba(234,234,234,0.50)" />
          <circle cx="71" cy="156" r="2" fill="rgba(234,234,234,0.50)" />
          <circle cx="131" cy="156" r="2" fill="rgba(234,234,234,0.50)" />
        </g>

        <circle
          className="build-dot-gold"
          cx="101"
          cy="156"
          r="3"
          fill="#F5C21A"
        />

        <g className="build-arrow">
          <line
            x1="142"
            y1="156"
            x2="156"
            y2="156"
            stroke="#F5C21A"
            strokeWidth="0.8"
          />
          <path
            d="M152 152 l4 4 -4 4"
            fill="none"
            stroke="#F5C21A"
            strokeWidth="0.8"
          />
        </g>
      </g>
    </svg>
  )
}

export function ScaleIllust() {
  return (
    <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="orbit-core-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F5C21A" stopOpacity="0.45" />
          <stop offset="80%" stopColor="#F5C21A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="100" cy="125" r="60" fill="url(#orbit-core-glow)" />

      <circle
        cx="100"
        cy="125"
        r="78"
        fill="none"
        stroke="rgba(234,234,234,0.10)"
        strokeWidth="0.7"
      />
      <circle
        className="scale-ring-dash"
        cx="100"
        cy="125"
        r="58"
        fill="none"
        stroke="rgba(234,234,234,0.18)"
        strokeWidth="0.7"
        strokeDasharray="3 5"
      />
      <circle
        cx="100"
        cy="125"
        r="38"
        fill="none"
        stroke="rgba(234,234,234,0.32)"
        strokeWidth="0.7"
      />

      <g className="scale-core" stroke="#F5C21A" strokeWidth="0.9">
        <circle cx="100" cy="125" r="14" fill="none" />
        <line x1="80" y1="125" x2="92" y2="125" />
        <line x1="108" y1="125" x2="120" y2="125" />
        <line x1="100" y1="105" x2="100" y2="117" />
        <line x1="100" y1="133" x2="100" y2="145" />
      </g>
      <circle className="scale-center" cx="100" cy="125" r="3" fill="#F5C21A" />

      <circle
        className="scale-n-0"
        cx="138"
        cy="125"
        r="2.4"
        fill="rgba(234,234,234,0.7)"
      />
      <circle
        className="scale-n-1"
        cx="100"
        cy="67"
        r="2"
        fill="rgba(234,234,234,0.5)"
      />
      <circle
        className="scale-n-2"
        cx="62"
        cy="125"
        r="2"
        fill="rgba(234,234,234,0.5)"
      />
      <circle
        className="scale-gold-node"
        cx="100"
        cy="183"
        r="2.4"
        fill="#F5C21A"
      />
      <circle
        className="scale-n-3"
        cx="158"
        cy="89"
        r="1.6"
        fill="rgba(234,234,234,0.4)"
      />
      <circle
        className="scale-n-4"
        cx="42"
        cy="161"
        r="1.6"
        fill="rgba(234,234,234,0.4)"
      />

      <path
        className="scale-trace"
        d="M100 125 Q 130 100, 158 89"
        fill="none"
        stroke="rgba(234,234,234,0.20)"
        strokeWidth="0.5"
        pathLength="1"
        strokeDasharray="1"
      />

      <g
        className="scale-target"
        stroke="rgba(234,234,234,0.45)"
        strokeWidth="0.7"
        fill="none"
      >
        <line x1="178" y1="50" x2="156" y2="72" />
        <path d="M178 50 l -10 1 M178 50 l 1 -10" />
      </g>

      <g
        fontFamily="'JetBrains Mono', monospace"
        fontSize="6.5"
        fill="rgba(234,234,234,0.45)"
        letterSpacing="0.08em"
      >
        <text x="44" y="225">
          FLOWS · 128
        </text>
        <text className="scale-allok" x="124" y="225" fill="#F5C21A">
          ALL · OK
        </text>
      </g>
    </svg>
  )
}
