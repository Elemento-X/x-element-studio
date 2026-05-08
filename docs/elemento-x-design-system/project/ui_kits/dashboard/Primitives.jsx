// Shared primitives for the Elemento-X Ops Console
const { useState, useEffect, useRef, useMemo } = React;

function Icon({ name, size = 16, color, style }) {
  const ref = useRef(null);
  useEffect(() => { if (window.lucide) window.lucide.createIcons({ nameAttr: 'data-lucide' }); }, [name]);
  return <i ref={ref} data-lucide={name} style={{ width: size, height: size, color, display: 'inline-flex', ...style }}></i>;
}

function Eyebrow({ children, style }) {
  return <div className="eyebrow" style={style}>{children}</div>;
}

function Button({ variant = 'ghost', small, children, onClick, icon }) {
  const cls = `btn ${variant === 'primary' ? 'btn-primary' : 'btn-ghost'} ${small ? 'btn-small' : ''}`;
  return <button className={cls} onClick={onClick}>{icon && <Icon name={icon} size={12}/>}{children}</button>;
}

function Badge({ kind = 'neutral', children, dot }) {
  return (
    <span className={`badge b-${kind}`}>
      {dot && <span className="dot" style={{ background: dot }}/>}
      {children}
    </span>
  );
}

Object.assign(window, { Icon, Eyebrow, Button, Badge });
