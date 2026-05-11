function SideRail({ active, onChange }) {
  const primary = [
    { id: 'overview', icon: 'layout-grid' },
    { id: 'signals', icon: 'activity' },
    { id: 'pipelines', icon: 'workflow' },
    { id: 'data', icon: 'database' },
    { id: 'agents', icon: 'cpu' },
  ];
  const secondary = [
    { id: 'logs', icon: 'terminal' },
    { id: 'security', icon: 'shield' },
    { id: 'settings', icon: 'sliders' },
  ];
  const Btn = ({ id, icon }) => (
    <div className={`rail-btn ${active === id ? 'active' : ''}`} onClick={() => onChange(id)} title={id}>
      <Icon name={icon} size={18}/>
    </div>
  );
  return (
    <nav className="siderail">
      {primary.map(p => <Btn key={p.id} {...p}/>)}
      <div className="rail-sep"/>
      {secondary.map(p => <Btn key={p.id} {...p}/>)}
    </nav>
  );
}
Object.assign(window, { SideRail });
