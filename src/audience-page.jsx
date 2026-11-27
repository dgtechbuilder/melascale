import React, { useState as useS, useMemo as useM } from "react";
import { fmtNum } from "./data.jsx";
import { Donut } from "./charts.jsx";
/* Audience Page */


export const AGE_GROUPS = [
  { label: "13–17", value: 8.2, color: "oklch(0.65 0.14 285)" },
  { label: "18–24", value: 34.6, color: "var(--primary)" },
  { label: "25–34", value: 28.1, color: "oklch(0.55 0.16 35)" },
  { label: "35–44", value: 18.4, color: "oklch(0.55 0.13 175)" },
  { label: "45+", value: 10.7, color: "oklch(0.7 0.12 60)" },
];

export const GENDER_SPLIT = [
  { label: "Male", value: 58, color: "var(--primary)" },
  { label: "Female", value: 36, color: "oklch(0.58 0.16 35)" },
  { label: "Other / undisclosed", value: 6, color: "oklch(0.7 0.08 80)" },
];

export const GEO_DATA = [
  { country: "Nigeria", users: 3240000, share: 26.1, growth: 18.4 },
  { country: "Kenya", users: 2180000, share: 17.6, growth: 12.8 },
  { country: "South Africa", users: 1860000, share: 15.0, growth: 8.2 },
  { country: "Ghana", users: 1420000, share: 11.5, growth: 22.1 },
  { country: "Tanzania", users: 980000, share: 7.9, growth: 15.6 },
  { country: "Uganda", users: 860000, share: 6.9, growth: 19.3 },
  { country: "Other", users: 1860000, share: 15.0, growth: 11.7 },
];

export const RETENTION_DAYS = [
  { day: "D1", exposed: 68, control: 62 },
  { day: "D3", exposed: 52, control: 44 },
  { day: "D7", exposed: 38, control: 30 },
  { day: "D14", exposed: 28, control: 21 },
  { day: "D30", exposed: 18, control: 12 },
];

export const PLAYER_SEGMENTS = [
  { label: "Casual farmers", pct: 42, sessions: 2.1, engagement: "Low", recallRate: 34 },
  { label: "Core grinders", pct: 28, sessions: 5.8, engagement: "High", recallRate: 61 },
  { label: "Social players", pct: 18, sessions: 3.4, engagement: "Medium", recallRate: 48 },
  { label: "Completionists", pct: 12, sessions: 7.2, engagement: "Very High", recallRate: 72 },
];

export const SESSION_BY_HOUR = [
  4, 3, 2, 1, 1, 2, 5, 12, 18, 14, 11, 10,
  12, 14, 13, 11, 14, 18, 22, 20, 16, 12, 8, 5,
];

export function AudiencePage() {
  return (
    <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Audience</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Demographics, retention, and player segment analysis</div>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total MAU", value: "12.4M", delta: "+14.6%" },
          { label: "Avg. age", value: "26.8", delta: "yrs", plain: true },
          { label: "D30 retention (exposed)", value: "18%", delta: "+50% vs ctrl" },
          { label: "Avg. sessions / week", value: "3.8", delta: "+0.6 vs prev" },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 26, fontWeight: 500 }} className="tnum">{k.value}</div>
            <div style={{ fontSize: 11, color: k.plain ? "var(--ink-3)" : "var(--good)", marginTop: 4, fontWeight: 600 }} className="mono">{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Demographics row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Age distribution */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>Age distribution</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {AGE_GROUPS.map(g => (
              <div key={g.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: "var(--ink-2)" }}>{g.label}</span>
                  <span className="mono tnum" style={{ fontWeight: 600 }}>{g.value}%</span>
                </div>
                <div style={{ height: 8, background: "var(--line-2)", borderRadius: 999 }}>
                  <div style={{ height: "100%", borderRadius: 999, background: g.color, width: `${(g.value / 34.6) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Gender split */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 14 }}>Gender split</div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <Donut segments={GENDER_SPLIT.map(g => ({ value: g.value, color: g.color }))} size={130} thickness={18} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {GENDER_SPLIT.map(g => (
              <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: g.color }} />
                <span style={{ flex: 1 }}>{g.label}</span>
                <span className="mono tnum" style={{ fontWeight: 600 }}>{g.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Session by hour */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Peak play hours</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 14 }}>Sessions by hour (UTC)</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 120 }}>
            {SESSION_BY_HOUR.map((v, i) => {
              const maxV = Math.max(...SESSION_BY_HOUR);
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{
                    width: "100%", height: (v / maxV) * 100,
                    background: v >= 18 ? "var(--primary)" : "var(--line-2)",
                    borderRadius: 3,
                  }} />
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 9.5, color: "var(--ink-3)" }} className="mono">
            <span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>
        </div>
      </div>

      {/* Retention curve + Geo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Retention curve */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Retention curve</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>Exposed vs control cohort retention</div>
          <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--ink-2)", marginBottom: 12 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--primary)" }} /> Exposed</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--ink-3)" }} /> Control</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 180 }}>
            {RETENTION_DAYS.map(d => (
              <div key={d.day} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", width: "100%" }}>
                  <div style={{ flex: 1, height: (d.exposed / 70) * 160, background: "var(--primary)", borderRadius: "4px 4px 0 0" }}>
                    <div style={{ fontSize: 9, textAlign: "center", color: "white", fontWeight: 600, paddingTop: 4 }} className="mono">{d.exposed}%</div>
                  </div>
                  <div style={{ flex: 1, height: (d.control / 70) * 160, background: "var(--ink-3)", borderRadius: "4px 4px 0 0", opacity: 0.4 }}>
                    <div style={{ fontSize: 9, textAlign: "center", color: "var(--ink)", fontWeight: 600, paddingTop: 4 }} className="mono">{d.control}%</div>
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{d.day}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Geography */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Top markets</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Users by country</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--surface-2)" }}>
              <tr>
                <th style={audThStyle}>Country</th>
                <th style={{ ...audThStyle, textAlign: "right" }}>Users</th>
                <th style={{ ...audThStyle, textAlign: "right" }}>Share</th>
                <th style={{ ...audThStyle, textAlign: "right" }}>Growth</th>
              </tr>
            </thead>
            <tbody>
              {GEO_DATA.map((g, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "10px 14px", fontSize: 12.5, fontWeight: 500 }}>{g.country}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{fmtNum(g.users)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12 }} className="mono tnum">{g.share}%</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--good)" }} className="mono tnum">+{g.growth}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Player segments */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Player segments</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Behavioral segmentation and ad recall by player type</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--surface-2)" }}>
            <tr>
              <th style={audThStyle}>Segment</th>
              <th style={{ ...audThStyle, textAlign: "right" }}>% of players</th>
              <th style={{ ...audThStyle, textAlign: "right" }}>Avg sessions/day</th>
              <th style={{ ...audThStyle, textAlign: "center" }}>Engagement</th>
              <th style={{ ...audThStyle, textAlign: "right" }}>Ad recall rate</th>
              <th style={audThStyle}>Recall distribution</th>
            </tr>
          </thead>
          <tbody>
            {PLAYER_SEGMENTS.map((s, i) => {
              const engColor = s.engagement === "Very High" ? "var(--good)" : s.engagement === "High" ? "oklch(0.52 0.14 155)" : s.engagement === "Medium" ? "oklch(0.52 0.14 55)" : "var(--ink-3)";
              return (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "12px 14px", fontSize: 13, fontWeight: 500 }}>{s.label}</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12.5 }} className="mono tnum">{s.pct}%</td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12.5 }} className="mono tnum">{s.sessions}</td>
                  <td style={{ padding: "12px 14px", textAlign: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 6, color: engColor, background: engColor.replace(")", " / 0.12)").replace("var(", "").replace("oklch", "oklch") }}>{s.engagement}</span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right", fontSize: 12.5, fontWeight: 600 }} className="mono tnum">{s.recallRate}%</td>
                  <td style={{ padding: "12px 14px", width: 160 }}>
                    <div style={{ height: 8, background: "var(--line-2)", borderRadius: 999 }}>
                      <div style={{ height: "100%", borderRadius: 999, background: "var(--primary)", width: `${s.recallRate}%` }} />
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

export const audThStyle = {
  textAlign: "left", fontSize: 10.5, color: "var(--ink-3)", fontWeight: 500,
  padding: "9px 14px", letterSpacing: "0.06em", textTransform: "uppercase",
};
