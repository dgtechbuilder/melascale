import React, { useState, useMemo, useRef, useEffect } from "react";
/* Chart primitives — pure SVG, original */


export function buildPath(values, w, h, padY = 6) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1);
  return values.map((v, i) => {
    const x = i * stepX;
    const y = padY + (h - padY * 2) * (1 - (v - min) / range);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}

export function buildSmoothPath(values, w, h, padY = 8) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = w / (values.length - 1);
  const pts = values.map((v, i) => [
    i * stepX,
    padY + (h - padY * 2) * (1 - (v - min) / range),
  ]);
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return { d, pts };
}

export function Sparkline({ values, color = "var(--primary)", height = 36, width = 120, fill = true, dotIndex, stretch = false }) {
  const { d, pts } = useMemo(() => buildSmoothPath(values, width, height, 4), [values, width, height]);
  const area = d + ` L ${width},${height} L 0,${height} Z`;
  const id = useMemo(() => "spk-" + Math.random().toString(36).slice(2, 8), []);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={stretch ? "100%" : width} height={height} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${id})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {dotIndex != null && pts[dotIndex] && (
        <circle cx={pts[dotIndex][0]} cy={pts[dotIndex][1]} r="2.5" fill={color} />
      )}
    </svg>
  );
}

/* Big engagement chart with two series, hover crosshair, axis labels */
export function EngagementChart({ data, height = 280, currentColor = "var(--primary)", previousColor = "oklch(0.78 0.04 285)", showPrevious = true }) {
  const ref = useRef(null);
  const [w, setW] = useState(800);
  const [hover, setHover] = useState(null);
  const padL = 40, padR = 16, padT = 16, padB = 28;
  const innerW = w - padL - padR;
  const innerH = height - padT - padB;

  useEffect(() => {
    if (!ref.current) return;
    const obs = new ResizeObserver(([e]) => setW(e.contentRect.width));
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const cur = data.map(d => d.current);
  const prv = data.map(d => d.previous);
  const all = [...cur, ...prv];
  const max = Math.max(...all);
  const min = Math.min(...all);
  const range = max - min || 1;
  const stepX = innerW / (data.length - 1);
  const y = (v) => padT + innerH * (1 - (v - min) / range);

  const curPath = useMemo(() => buildSmoothPath(cur, innerW, innerH, 0), [cur, innerW, innerH]);
  const prvPath = useMemo(() => buildSmoothPath(prv, innerW, innerH, 0), [prv, innerW, innerH]);

  // y-axis ticks
  const ticks = 4;
  const tickVals = Array.from({ length: ticks + 1 }, (_, i) => min + (range * i) / ticks);

  function handleMove(e) {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - padL;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(x / stepX)));
    setHover(idx);
  }

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} onMouseMove={handleMove} onMouseLeave={() => setHover(null)} style={{ display: "block" }}>
        {/* grid */}
        {tickVals.map((tv, i) => (
          <g key={i}>
            <line x1={padL} x2={w - padR} y1={padT + (innerH * i) / ticks} y2={padT + (innerH * i) / ticks} stroke="var(--line-2)" strokeDasharray={i === ticks ? "0" : "2 4"} />
            <text x={padL - 8} y={padT + (innerH * i) / ticks + 4} fontSize="10" textAnchor="end" fill="var(--ink-3)" className="mono">{tickVals[tickVals.length - 1 - i].toFixed(0)}</text>
          </g>
        ))}
        {/* x labels — every 5 days */}
        {data.map((d, i) => i % 5 === 0 ? (
          <text key={i} x={padL + i * stepX} y={height - 8} fontSize="10" textAnchor="middle" fill="var(--ink-3)" className="mono">{d.label}</text>
        ) : null)}
        {/* previous series */}
        {showPrevious && (
          <g transform={`translate(${padL},${padT})`}>
            <path d={prvPath.d} fill="none" stroke={previousColor} strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
          </g>
        )}
        {/* current */}
        <g transform={`translate(${padL},${padT})`}>
          <defs>
            <linearGradient id="curFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={currentColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={curPath.d + ` L ${innerW},${innerH} L 0,${innerH} Z`} fill="url(#curFill)" />
          <path d={curPath.d} fill="none" stroke={currentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        {/* crosshair */}
        {hover != null && (
          <g>
            <line x1={padL + hover * stepX} x2={padL + hover * stepX} y1={padT} y2={padT + innerH} stroke="var(--ink-2)" strokeOpacity="0.25" strokeDasharray="2 2" />
            <circle cx={padL + hover * stepX} cy={y(cur[hover])} r="4" fill="var(--surface)" stroke={currentColor} strokeWidth="2" />
            {showPrevious && <circle cx={padL + hover * stepX} cy={y(prv[hover])} r="3" fill="var(--surface)" stroke={previousColor} strokeWidth="1.5" />}
          </g>
        )}
      </svg>
      {hover != null && (
        <div style={{
          position: "absolute", top: 8, left: Math.min(w - 200, padL + hover * stepX + 8),
          background: "var(--surface)", boxShadow: "var(--shadow-md)", borderRadius: 10, padding: "8px 10px",
          fontSize: 12, pointerEvents: "none", border: "1px solid var(--line)", minWidth: 180,
        }}>
          <div style={{ fontSize: 11, color: "var(--ink-3)", marginBottom: 4 }} className="mono">Day {data[hover].label} · May {hover + 1}, 2026</div>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: currentColor }} />This period</span>
            <span className="mono tnum" style={{ fontWeight: 600 }}>{cur[hover].toFixed(1)}K eng.</span>
          </div>
          {showPrevious && (
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, marginTop: 2 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 2, background: previousColor }} />Previous</span>
              <span className="mono tnum" style={{ color: "var(--ink-2)" }}>{prv[hover].toFixed(1)}K</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* Horizontal bar list — for region/cohort breakdowns */
export function BarList({ items, valueKey, max, color = "var(--primary)", suffix = "", barHeight = 8 }) {
  const m = max || Math.max(...items.map(i => i[valueKey]));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {items.map(it => (
        <div key={it.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
            <span style={{ color: "var(--ink-2)" }}>{it.label}</span>
            <span className="mono tnum" style={{ fontWeight: 600 }}>{it[valueKey]}{suffix}</span>
          </div>
          <div style={{ background: "var(--line-2)", height: barHeight, borderRadius: 999 }}>
            <div style={{
              height: "100%", borderRadius: 999, background: color,
              width: `${(it[valueKey] / m) * 100}%`, transition: "width .4s ease",
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Donut for placement share */
export function Donut({ segments, size = 140, thickness = 18 }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const R = (size - thickness) / 2;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`translate(${size / 2},${size / 2}) rotate(-90)`}>
        <circle r={R} cx="0" cy="0" fill="none" stroke="var(--line-2)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const dash = `${len} ${C - len}`;
          const dashoffset = -offset;
          offset += len;
          return (
            <circle key={i} r={R} cx="0" cy="0" fill="none" stroke={s.color}
              strokeWidth={thickness} strokeDasharray={dash} strokeDashoffset={dashoffset} strokeLinecap="butt" />
          );
        })}
      </g>
    </svg>
  );
}
