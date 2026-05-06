function ActivityFeed({ items }) {
  return (
    <div className="feed">
      {items.map((it, i) => (
        <div className="feed-row" key={i}>
          <div className="feed-time">{it.time}</div>
          <div className={`feed-dot ${it.kind || ''}`}/>
          <div className="feed-msg" dangerouslySetInnerHTML={{ __html: it.msg }}/>
          <div className="feed-tag">{it.tag}</div>
        </div>
      ))}
    </div>
  );
}
Object.assign(window, { ActivityFeed });
