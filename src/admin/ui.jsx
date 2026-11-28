/* Admin portal building blocks, in the Mela Scale design language:
   warm-grey surfaces, hairline borders, ink buttons, mono numbers, Unicode glyph icons. */
import React, { useEffect, useRef, useState } from "react";

export function Page({ title, sub, actions, children }) {
  return (
    <div className="adm-page">
      <div className="adm-page-head">
        <div style={{ minWidth: 0, flex: 1 }}>
          <h1 className="adm-h1">{title}</h1>
          {sub && <div className="adm-sub">{sub}</div>}
        </div>
        {actions && <div className="adm-actions">{actions}</div>}
      </div>
      {children}
    </div>
  );
}

export function Card({ title, sub, actions, children, pad = true, style }) {
  return (
    <section className="card adm-card" style={style}>
      {(title || actions) && (
        <div className="adm-card-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            {title && <h2 className="adm-h2">{title}</h2>}
            {sub && <div className="adm-card-sub">{sub}</div>}
          </div>
          {actions && <div className="adm-actions">{actions}</div>}
        </div>
      )}
      <div style={pad ? { padding: 16 } : undefined}>{children}</div>
    </section>
  );
}

export function Button({ kind = "primary", children, ...rest }) {
  return <button type="button" className={`adm-btn adm-btn-${kind}`} {...rest}>{children}</button>;
}

export function Badge({ tone = "muted", children, dot }) {
  return (
    <span className={`adm-badge adm-tone-${tone}`}>
      {dot && <span className="adm-badge-dot" />}
      {children}
    </span>
  );
}

export function Stat({ label, value, unit, delta, sub }) {
  const up = delta != null && delta >= 0;
  return (
    <div className="card adm-stat">
      <div className="adm-stat-top">
        <span>{label}</span>
        {delta != null && Number.isFinite(delta) && (
          <span className={`adm-delta ${up ? "up" : "down"} mono tnum`}>{up ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}%</span>
        )}
      </div>
      <div className="adm-stat-val">
        <span className="tnum">{value}</span>
        {unit && <span className="adm-stat-unit">{unit}</span>}
      </div>
      {sub && <div className="adm-stat-sub">{sub}</div>}
    </div>
  );
}

export function Table({ columns, rows, empty, onRow, rowKey = (r, i) => r.id || i }) {
  if (!rows.length) return <Empty>{empty || "Nothing here yet."}</Empty>;
  return (
    <div className="table-scroll">
      <table className="adm-table">
        <thead>
          <tr>{columns.map(c => <th key={c.key} style={{ textAlign: c.align || "left", width: c.width }}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={rowKey(r, i)} className={onRow ? "clickable" : undefined} onClick={onRow ? () => onRow(r) : undefined}>
              {columns.map(c => <td key={c.key} style={{ textAlign: c.align || "left" }}>{c.render ? c.render(r) : r[c.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Empty({ children, action }) {
  return (
    <div className="adm-empty">
      <div>{children}</div>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null);
  useEffect(() => {
    const onKey = e => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const first = ref.current && ref.current.querySelector("input, select, textarea, button");
    if (first) first.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="adm-scrim" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} className={`adm-modal${wide ? " wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="adm-modal-head">
          <h2 className="adm-h2">{title}</h2>
          <button type="button" className="adm-x" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <div className="adm-modal-body">{children}</div>
        {footer && <div className="adm-modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Field({ label, id, hint, children }) {
  return (
    <div className="adm-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <div className="adm-hint">{hint}</div>}
    </div>
  );
}

export function Input(props) { return <input className="adm-input" {...props} />; }
export function Select({ options, ...props }) {
  return (
    <select className="adm-input" {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="adm-tabs" role="tablist">
      {tabs.map(t => (
        <button key={t.id} type="button" role="tab" aria-selected={value === t.id}
          className={value === t.id ? "on" : ""} onClick={() => onChange(t.id)}>
          {t.label}{t.count != null && <span className="adm-tab-count mono">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function CopyButton({ text, label = "Copy" }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); }
    catch (e) { setDone(false); }
  };
  return <Button kind="ghost" onClick={copy}>{done ? "Copied" : label}</Button>;
}

export function Code({ children, copy = true, label }) {
  return (
    <div className="adm-code">
      {(label || copy) && (
        <div className="adm-code-head">
          <span className="mono">{label}</span>
          {copy && <CopyButton text={children} />}
        </div>
      )}
      <pre><code>{children}</code></pre>
    </div>
  );
}

export function GameChip({ game, size = 24 }) {
  if (!game) return null;
  return (
    <span className="adm-chip" style={{ width: size, height: size, background: `oklch(0.55 0.14 ${game.hue ?? 80})`, fontSize: size * 0.38 }} aria-hidden="true">
      {game.abbr || (game.name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function Notice({ tone = "muted", children }) {
  return <div className={`adm-notice adm-tone-${tone}`}>{children}</div>;
}

export function ErrorText({ error }) {
  if (!error) return null;
  return <div className="adm-error" role="alert">{error}</div>;
}

/* Poll an async loader; reruns when deps change or the store notifies. */
export function useLoad(loader, deps, { interval, subscribe } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    const run = () => loader().then(data => alive && setState({ data, error: null, loading: false }))
      .catch(e => alive && setState(s => ({ ...s, error: e.message, loading: false })));
    run();
    const t = interval ? setInterval(run, interval) : null;
    const off = subscribe ? subscribe(run) : null;
    return () => { alive = false; if (t) clearInterval(t); if (off) off(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick(x => x + 1) };
}
