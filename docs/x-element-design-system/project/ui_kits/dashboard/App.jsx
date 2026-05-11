function App() {
  const [section, setSection] = useState('overview');
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      else if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="app">
      <SideRail active={section} onChange={setSection}/>
      <TopBar onOpenPalette={() => setPaletteOpen(true)}/>
      <main className="main">
        {section === 'overview' && <OverviewPage/>}
        {section !== 'overview' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'flex-start' }}>
            <Eyebrow>{section}</Eyebrow>
            <h1 className="title" style={{ fontFamily: 'var(--font-display)', fontSize: 40, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{section}</h1>
            <div style={{ color: 'var(--fg-3)', fontSize: 14, maxWidth: 520 }}>This surface is not part of the UI kit scope. Open <b style={{color:'var(--fg-1)'}}>Overview</b> from the left rail to see the kit in action.</div>
            <Button icon="arrow-left" onClick={() => setSection('overview')}>Back to overview</Button>
          </div>
        )}
      </main>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('app')).render(<App/>);
