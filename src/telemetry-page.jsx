import React, { useState as useS } from "react";
import { fmtNum } from "./data.jsx";
/* Game Telemetry Page */


export const TELEMETRY_KPIS = [
  { label: "Events ingested (30d)", value: "12.7M", delta: "+8.4%" },
  { label: "Avg. latency", value: "42ms", delta: "-12ms", good: true },
  { label: "Active SDK versions", value: "3", delta: "" },
  { label: "Error rate", value: "0.02%", delta: "-0.01%", good: true },
];

export const SDK_VERSIONS = [
  { version: "v3.4.2", games: 4, events: 8420000, status: "current" },
  { version: "v3.3.1", games: 2, events: 3180000, status: "supported" },
  { version: "v3.2.0", games: 1, events: 1100000, status: "deprecated" },
];

export const EVENT_TYPES = [
  { event: "impression", count: 4820000, pctTotal: 38.0, avgLatency: 38 },
  { event: "click", count: 1240000, pctTotal: 9.8, avgLatency: 42 },
  { event: "view_complete", count: 2180000, pctTotal: 17.2, avgLatency: 45 },
  { event: "engagement", count: 1860000, pctTotal: 14.6, avgLatency: 41 },
  { event: "conversion", count: 620000, pctTotal: 4.9, avgLatency: 52 },
  { event: "session_start", count: 1180000, pctTotal: 9.3, avgLatency: 35 },
  { event: "session_end", count: 800000, pctTotal: 6.3, avgLatency: 36 },
];

export const PIPELINE_STAGES = [
  { stage: "Ingestion", status: "healthy", throughput: "42K/min", latency: "12ms", errors: 0 },
  { stage: "Validation", status: "healthy", throughput: "42K/min", latency: "8ms", errors: 2 },
  { stage: "Enrichment", status: "healthy", throughput: "41K/min", latency: "18ms", errors: 0 },
  { stage: "Aggregation", status: "healthy", throughput: "41K/min", latency: "22ms", errors: 0 },
  { stage: "Storage", status: "healthy", throughput: "41K/min", latency: "6ms", errors: 0 },
];

export const GAME_INTEGRATIONS = [
  { game: "LIMA Farming Game", sdkVersion: "v3.4.2", status: "connected", lastSync: "2 min ago", events24h: 4210000 },
  { game: "MAZU Runner", sdkVersion: "v3.4.2", status: "connected", lastSync: "5 min ago", events24h: 2840000 },
  { game: "HIRU Game", sdkVersion: "v3.3.1", status: "connected", lastSync: "8 min ago", events24h: 1920000 },
  { game: "SANGO Platformer", sdkVersion: "v3.3.1", status: "connected", lastSync: "12 min ago", events24h: 1480000 },
  { game: "KUSHABA Fighting Game", sdkVersion: "v3.4.2", status: "warning", lastSync: "1h ago", events24h: 860000 },
  { game: "IMAGINARIUM Map Game", sdkVersion: "v3.2.0", status: "connected", lastSync: "15 min ago", events24h: 1390000 },
];

export const LATENCY_HOURLY = [38, 41, 39, 42, 45, 44, 40, 38, 36, 42, 48, 52, 46, 44, 41, 39, 38, 40, 43, 46, 44, 41, 39, 37];

export function TelemetryPage() {
  const [pipelineExpanded, setPipelineExpanded] = useS(false);

  return (
    <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Game telemetry</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>SDK integrations, event pipeline, and data health</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "var(--good-soft)", fontSize: 12, fontWeight: 600, color: "var(--good)" }}>
          <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--good)" }} /> All systems operational
        </span>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {TELEMETRY_KPIS.map(k => (
          <div key={k.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500 }} className="tnum">{k.value}</div>
            {k.delta && <div style={{ fontSize: 11, color: "var(--good)", marginTop: 4, fontWeight: 600 }} className="mono">{k.delta}</div>}
          </div>
        ))}
      </div>

      {/* Pipeline + Latency */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Data pipeline */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Data pipeline</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>Real-time processing stages</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {PIPELINE_STAGES.map((s, i) => (
              <div key={s.stage} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--line-2)",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: s.status === "healthy" ? "var(--good)" : "var(--accent)", flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{s.stage}</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{s.throughput}</span>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{s.latency}</span>
                {s.errors > 0 && <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: "var(--accent-soft, oklch(0.94 0.04 25))", color: "var(--accent)" }} className="mono">{s.errors} err</span>}
                {i < PIPELINE_STAGES.length - 1 && <span style={{ position: "absolute", left: "50%", bottom: -6, color: "var(--ink-3)", fontSize: 10 }}>↓</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Latency chart */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Latency (24h)</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>Average event processing latency by hour</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 140 }}>
            {LATENCY_HOURLY.map((v, i) => {
              const maxV = Math.max(...LATENCY_HOURLY);
              const isHigh = v >= 48;
              return (
                <div key={i} title={`${v}ms at ${i}:00`} style={{
                  flex: 1, height: (v / maxV) * 120,
                  background: isHigh ? "var(--accent)" : "var(--primary)",
                  borderRadius: 3, opacity: isHigh ? 1 : 0.7,
                  cursor: "default",
                }} />
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9.5, color: "var(--ink-3)" }} className="mono">
            <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>
          <div style={{ marginTop: 12, padding: "8px 12px", background: "var(--surface-2)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--good)" }} />
            <span style={{ color: "var(--ink-2)" }}>P99 latency: <b className="mono tnum">52ms</b> — well within 100ms SLA</span>
          </div>
        </div>
      </div>

      {/* Event types + SDK versions */}
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Event types */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Event types</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Volume and latency by event type · 30d</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--surface-2)" }}>
              <tr>
                <th style={telThStyle}>Event</th>
                <th style={{ ...telThStyle, textAlign: "right" }}>Count</th>
                <th style={{ ...telThStyle, textAlign: "right" }}>% total</th>
                <th style={telThStyle}>Distribution</th>
                <th style={{ ...telThStyle, textAlign: "right" }}>Avg latency</th>
              </tr>
            </thead>
            <tbody>
              {EVENT_TYPES.map((e, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 12.5, fontWeight: 500, fontFamily: "var(--font-mono)" }}>{e.event}</span>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{fmtNum(e.count)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{e.pctTotal}%</td>
                  <td style={{ padding: "10px 14px", width: 120 }}>
                    <div style={{ height: 6, background: "var(--line-2)", borderRadius: 999 }}>
                      <div style={{ height: "100%", borderRadius: 999, background: "var(--primary)", width: `${(e.pctTotal / 38) * 100}%` }} />
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12, color: e.avgLatency > 50 ? "var(--accent)" : "var(--ink-2)" }} className="mono tnum">{e.avgLatency}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SDK versions */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>SDK versions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SDK_VERSIONS.map(s => {
              const statusColor = s.status === "current" ? "var(--good)" : s.status === "supported" ? "oklch(0.52 0.14 55)" : "var(--accent)";
              return (
                <div key={s.version} style={{
                  padding: 14, background: "var(--surface-2)", borderRadius: 10,
                  border: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }} className="mono">{s.version}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{s.games} games · {fmtNum(s.events)} events</div>
                  </div>
                  <span style={{
                    fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 6,
                    color: statusColor, background: s.status === "current" ? "var(--good-soft)" : "var(--surface)",
                    border: `1px solid ${statusColor}`,
                  }}>{s.status}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game integrations */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Game integrations</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>SDK connection status and event volume per game</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--surface-2)" }}>
            <tr>
              <th style={telThStyle}>Game</th>
              <th style={telThStyle}>SDK version</th>
              <th style={telThStyle}>Status</th>
              <th style={telThStyle}>Last sync</th>
              <th style={{ ...telThStyle, textAlign: "right" }}>Events (24h)</th>
              <th style={telThStyle}>Volume</th>
            </tr>
          </thead>
          <tbody>
            {GAME_INTEGRATIONS.map((g, i) => {
              const stColor = g.status === "connected" ? "var(--good)" : "var(--accent)";
              const maxEv = Math.max(...GAME_INTEGRATIONS.map(x => x.events24h));
              return (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 500 }}>{g.game}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", color: "var(--ink-2)" }}>{g.sdkVersion}</span>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                      <span style={{ width: 6, height: 6, borderRadius: 3, background: stColor }} />
                      <span style={{ fontSize: 12, color: stColor, fontWeight: 500 }}>{g.status}</span>
                    </span>
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: "var(--ink-3)" }} className="mono">{g.lastSync}</td>
                  <td style={{ padding: "11px 14px", textAlign: "right", fontSize: 12.5 }} className="mono tnum">{fmtNum(g.events24h)}</td>
                  <td style={{ padding: "11px 14px", width: 120 }}>
                    <div style={{ height: 6, background: "var(--line-2)", borderRadius: 999 }}>
                      <div style={{ height: "100%", borderRadius: 999, background: stColor, width: `${(g.events24h / maxEv) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const telThStyle = {
  textAlign: "left", fontSize: 10.5, color: "var(--ink-3)", fontWeight: 500,
  padding: "9px 14px", letterSpacing: "0.06em", textTransform: "uppercase",
};
