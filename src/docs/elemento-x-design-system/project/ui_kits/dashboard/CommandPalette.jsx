function CommandPalette({ open, onClose }) {
  const [q, setQ] = useState('');
  const inputRef = useRef(null);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 20); else setQ(''); }, [open]);

  const items = [
    { group: 'Actions', list: [
      { label: 'Create automation pipeline', k: '⌘N', icon: 'plus' },
      { label: 'Trigger signal dispatch', k: '⌘D', icon: 'zap' },
      { label: 'Open query console', k: '⌘\\', icon: 'terminal' },
    ]},
    { group: 'Navigation', list: [
      { label: 'Overview · command', icon: 'layout-grid' },
      { label: 'Signals · live', icon: 'activity' },
      { label: 'Pipelines · 128 active', icon: 'workflow' },
      { label: 'Agents · 12 online', icon: 'cpu' },
    ]},
    { group: 'Recent', list: [
      { label: 'EX-2049 · ingestion.core', icon: 'history' },
      { label: 'EX-2011 · orbital.relay', icon: 'history' },
    ]},
  ];
  const filtered = items.map(g => ({ ...g, list: g.list.filter(it => it.label.toLowerCase().includes(q.toLowerCase())) })).filter(g => g.list.length);

  return (
    <div className={`palette-scrim ${open ? 'open' : ''}`} onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <div className="palette-input">
          <Icon name="search" size={16} style={{ color: 'var(--fg-3)' }}/>
          <input ref={inputRef} placeholder="Command or search…" value={q} onChange={e => setQ(e.target.value)}/>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--fg-3)' }}>ESC</span>
        </div>
        <div className="palette-list">
          {filtered.map((g, gi) => (
            <div key={gi}>
              <div className="palette-group">{g.group}</div>
              {g.list.map((it, i) => (
                <div key={i} className={`palette-item ${gi === 0 && i === 0 ? 'active' : ''}`}>
                  <Icon name={it.icon} size={14}/>
                  <span>{it.label}</span>
                  {it.k && <span className="k">{it.k}</span>}
                </div>
              ))}
            </div>
          ))}
          {!filtered.length && <div style={{ padding: '20px', fontSize: 13, color: 'var(--fg-3)', textAlign: 'center' }}>No match.</div>}
        </div>
      </div>
    </div>
  );
}
Object.assign(window, { CommandPalette });
