function TopBar({ onOpenPalette }) {
  return (
    <header className="topbar">
      <div className="wordmark">
        <svg className="mark" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="32" cy="38" r="22"/>
          <path d="M27 4h10v7a2 2 0 0 0 .8 1.6l2 1.5a2 2 0 0 1 .8 1.6V22"/>
          <path d="M23 22v-5.3a2 2 0 0 1 .8-1.6l2-1.5A2 2 0 0 0 26.6 12V4"/>
          <path d="M16 44c4 2 8 2 12 0s8-2 12 0 8 2 14 0"/>
          <text x="32" y="46" textAnchor="middle" fontFamily="Exo 2, sans-serif" fontSize="22" fontWeight="700" fill="currentColor" stroke="none" letterSpacing="0.02em">X</text>
        </svg>
        ELEMENTO-X
      </div>

      <div className="top-search" onClick={onOpenPalette}>
        <Icon name="search" size={14}/>
        <span>Search signals, pipelines, operators…</span>
        <span className="kbd">⌘K</span>
      </div>

      <div className="top-status">
        <span className="dot"/>
        <span>System · operational</span>
      </div>

      <div className="top-operator">
        <div className="avatar">AX</div>
        <div className="name">agent.x</div>
        <Icon name="chevron-down" size={12} style={{ color: 'var(--fg-3)' }}/>
      </div>
    </header>
  );
}
Object.assign(window, { TopBar });
