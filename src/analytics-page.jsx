import React, { useState as useS, useMemo as useM } from "react";
import { AMPLIFICATION, BUSINESS_TILES, COHORT_DATA, ENGAGEMENT_DAYS, FUNNEL, KPIS, PLATFORM_PERF, REGION_DATA, fmtNum } from "./data.jsx";
import { BarList, Donut, EngagementChart } from "./charts.jsx";
/* Analytics Page — consolidated analytics dashboard */


export function AnalyticsPage() {
  const [chartTab, setChartTab] = useS("engagement");
  const [compare, setCompare] = useS(true);
  const [segTab, setSegTab] = useS("region");

  return (
    <div style={{ padding: "20px 28px 28px", display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Analytics</div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Campaign performance across all channels and placements</div>
        </div>
        <button style={{
          padding: "9px 16px", borderRadius: 10, border: "1px solid var(--line)",
          background: "var(--surface)", fontSize: 13, fontWeight: 500,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          color: "var(--ink-2)",
        }}>↓ Export report</button>
      </div>

      {/* KPI strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
        {KPIS.map(kpi => (
          <AnalyticsKpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      {/* Trend chart */}
      <div className="card" style={{ padding: "18px 18px 14px", marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase" }} className="mono">Trend · Daily</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6 }}>
              <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">487,210</div>
              <div style={{ fontSize: 13, color: "var(--good)", background: "var(--good-soft)", padding: "2px 7px", borderRadius: 999, fontWeight: 600 }} className="mono tnum">↑ 12.4%</div>
              <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>total engagements · last 30 days</div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <button title="Download CSV" style={analyticsIconBtn}>↓ CSV</button>
            <button title="Download PNG" style={analyticsIconBtn}>↓ PNG</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 12 }}>
          {[
            { id: "engagement", label: "Engagements" },
            { id: "viewability", label: "Viewability" },
            { id: "recall", label: "Recall" },
            { id: "cpe", label: "Cost / engagement" },
          ].map(tb => (
            <button key={tb.id} onClick={() => setChartTab(tb.id)} style={{
              border: "none", background: "transparent",
              padding: "8px 12px", fontSize: 13,
              color: tb.id === chartTab ? "var(--ink)" : "var(--ink-3)",
              fontWeight: tb.id === chartTab ? 600 : 500,
              borderBottom: `2px solid ${tb.id === chartTab ? "var(--primary)" : "transparent"}`,
              marginBottom: -1, cursor: "pointer",
            }}>{tb.label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 8, fontSize: 11.5, color: "var(--ink-2)" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 14, height: 2, background: "var(--primary)" }} /> This period
            </span>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", color: "var(--ink-3)" }}>
              <input type="checkbox" checked={compare} onChange={e => setCompare(e.target.checked)} style={{ accentColor: "var(--primary)" }} />
              <span style={{ width: 14, height: 0, borderTop: "2px dashed oklch(0.78 0.04 285)" }} /> Previous
            </label>
          </div>
        </div>
        <EngagementChart data={ENGAGEMENT_DAYS} height={280} showPrevious={compare} />
      </div>

      {/* Two-column: Funnel + Platform performance */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Funnel */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>Exposure → conversion funnel</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Attributed to campaign · 30d</div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", gap: 14, fontSize: 11.5, color: "var(--ink-2)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "var(--primary)" }} /> Mobile
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: "oklch(0.62 0.15 50)" }} /> WebGL
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {FUNNEL.map((step, i) => {
              const maxV = FUNNEL[0].value;
              const w = (step.value / maxV) * 100;
              const mobShare = i === 0 ? 67 : i === 1 ? 66 : i === 2 ? 65 : i === 3 ? 58 : 51;
              return (
                <div key={step.stage} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 150, fontSize: 12.5, color: "var(--ink-2)" }}>{step.stage}</div>
                  <div style={{ flex: 1, height: 24, background: "var(--surface-2)", borderRadius: 6, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, width: `${w}%`, display: "flex" }}>
                      <div style={{ width: `${mobShare}%`, background: "var(--primary)", borderRadius: "6px 0 0 6px" }} />
                      <div style={{ width: `${100 - mobShare}%`, background: "oklch(0.62 0.15 50)" }} />
                    </div>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 11, color: "white", fontWeight: 600, mixBlendMode: "difference" }} className="mono tnum">
                      {fmtNum(step.value)}
                    </div>
                  </div>
                  <div style={{ width: 50, textAlign: "right", fontSize: 11.5, color: "var(--ink-3)" }} className="mono tnum">{step.pct < 10 ? step.pct.toFixed(2) : step.pct.toFixed(1)}%</div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, fontSize: 12 }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--primary)" }} />
            <span><b>0.48%</b> impression-to-conversion is <b style={{ color: "var(--good)" }}>2.4× the in-game median.</b></span>
          </div>
        </div>

        {/* Platform performance */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Platform performance</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>Comparison across platforms · 30d</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PLATFORM_PERF.map(p => (
              <div key={p.id} style={{
                padding: 14, background: "var(--surface-2)", borderRadius: 10,
                border: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 14,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 2 }}>{p.reach}M reach · {p.sessionLen} min avg session</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 500 }} className="mono tnum">{p.ctr}%</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>eng. rate</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 500 }} className="mono tnum">{p.roas}×</div>
                  <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>ROAS</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column: Segment breakdown + Business tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        {/* Segment breakdown */}
        <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ fontSize: 14.5, fontWeight: 600 }}>Segment breakdown</div>
            <div style={{ flex: 1 }} />
            <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 8, padding: 3 }}>
              {[["region", "Region"], ["cohort", "Cohort"]].map(([id, lab]) => (
                <button key={id} onClick={() => setSegTab(id)} style={{
                  border: "none", background: segTab === id ? "var(--surface)" : "transparent",
                  boxShadow: segTab === id ? "var(--shadow-sm)" : "none",
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                  color: segTab === id ? "var(--ink)" : "var(--ink-3)", cursor: "pointer",
                }}>{lab}</button>
              ))}
            </div>
          </div>
          {segTab === "region" ? <AnalyticsRegionView /> : <AnalyticsCohortView />}
        </div>

        {/* Business impact tiles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600, marginBottom: 4 }}>Business impact</div>
          {BUSINESS_TILES.map(tile => (
            <div key={tile.id} className="card" style={{ padding: 14, display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{tile.label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">{tile.value}</span>
                  <span style={{ fontSize: 11, color: "var(--good)", background: "var(--good-soft)", padding: "1px 6px", borderRadius: 999, fontWeight: 600 }} className="mono tnum">↑ {tile.delta}</span>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 3 }}>{tile.sub}</div>
              </div>
              <div style={{ width: 1, alignSelf: "stretch", background: "var(--line-2)" }} />
              <div style={{ width: 160, fontSize: 11, color: "var(--ink-2)", lineHeight: 1.45 }}>{tile.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Social + Influencer */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Social amplification */}
        <div className="card" style={{ padding: 18 }}>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Social amplification</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Owned + earned mentions across platforms · 30d</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
            <span style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">{fmtNum(AMPLIFICATION.socialMentions)}</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>mentions</span>
            <span style={{ fontSize: 11.5, color: "var(--good)", background: "var(--good-soft)", padding: "1px 6px", borderRadius: 999, fontWeight: 600 }} className="mono tnum">↑ {AMPLIFICATION.socialDelta}%</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} className="mono">Sentiment</div>
            <AnalyticsSentimentBar s={AMPLIFICATION.sentiment} />
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 12 }}>
            <span style={{ fontSize: 14 }}>✎</span>
            <span><b className="mono tnum">{fmtNum(AMPLIFICATION.ugc)}</b> player-generated screenshots / clips tagged this week.</span>
          </div>
        </div>

        {/* Influencer table */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 600 }}>Influencer exposure</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Creators driving organic + sponsored reach</div>
            </div>
          </div>
          <div className="table-scroll">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead style={{ background: "var(--surface-2)" }}>
              <tr>
                <th style={analyticsThStyle}>Creator</th>
                <th style={analyticsThStyle}>Platform</th>
                <th style={{ ...analyticsThStyle, textAlign: "right" }}>Reach</th>
                <th style={{ ...analyticsThStyle, textAlign: "right" }}>Type</th>
              </tr>
            </thead>
            <tbody>
              {AMPLIFICATION.topInfluencers.map((inf, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 999, background: `linear-gradient(135deg, oklch(0.65 0.13 ${i * 73 % 360}), oklch(0.5 0.16 ${(i * 73 + 60) % 360}))`, color: "white", display: "grid", placeItems: "center", fontSize: 9, fontWeight: 600 }}>
                        {inf.name[0].toUpperCase()}
                      </span>
                      <span style={{ fontWeight: 500, fontSize: 12.5 }} className="mono">{inf.name}</span>
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", color: "var(--ink-2)", fontSize: 12.5 }}>{inf.platform}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right", fontSize: 12.5 }} className="mono tnum">{fmtNum(inf.reach)}</td>
                  <td style={{ padding: "10px 14px", textAlign: "right" }}>
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: 999,
                      color: inf.tag === "official" ? "var(--primary)" : "var(--ink-2)",
                      background: inf.tag === "official" ? "var(--primary-soft)" : "var(--surface-2)",
                      border: "1px solid var(--line-2)",
                    }} className="mono">{inf.tag}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Analytics sub-components ── */

export function AnalyticsKpiCard({ kpi }) {
  const isGood = kpi.delta > 0;
  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 6 }}>{kpi.label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">
          {typeof kpi.value === "number" ? kpi.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : kpi.value}
        </span>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{kpi.unit}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: "1px 6px", borderRadius: 999,
          color: isGood ? "var(--good)" : "var(--bad)",
          background: isGood ? "var(--good-soft)" : "var(--bad-soft, oklch(0.94 0.04 25))",
        }} className="mono tnum">{isGood ? "↑" : "↓"} {Math.abs(kpi.delta).toFixed(1)}%</span>
        <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{kpi.sub}</span>
      </div>
    </div>
  );
}

export function AnalyticsSentimentBar({ s }) {
  return (
    <div>
      <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: "var(--surface-2)" }}>
        <div style={{ width: `${s.positive}%`, background: "var(--good)" }} />
        <div style={{ width: `${s.neutral}%`, background: "oklch(0.78 0.04 80)" }} />
        <div style={{ width: `${s.negative}%`, background: "var(--bad)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11, color: "var(--ink-2)" }}>
        <span><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--good)", display: "inline-block", marginRight: 5 }} />Positive <b className="mono tnum">{s.positive}%</b></span>
        <span><span style={{ width: 6, height: 6, borderRadius: 3, background: "oklch(0.78 0.04 80)", display: "inline-block", marginRight: 5 }} />Neutral <b className="mono tnum">{s.neutral}%</b></span>
        <span><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--bad)", display: "inline-block", marginRight: 5 }} />Negative <b className="mono tnum">{s.negative}%</b></span>
      </div>
    </div>
  );
}

export function AnalyticsRegionView() {
  const segments = REGION_DATA.map((r, i) => ({
    value: r.share,
    color: ["var(--primary)", "oklch(0.58 0.16 35)", "oklch(0.55 0.13 175)", "oklch(0.7 0.12 60)"][i],
  }));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ position: "relative" }}>
          <Donut segments={segments} size={120} thickness={14} />
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">14.1M</div>
              <div style={{ fontSize: 10, color: "var(--ink-3)" }} className="mono">IMPRESSIONS</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
          {REGION_DATA.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: segments[i].color }} />
              <span style={{ flex: 1 }}>{r.label}</span>
              <span className="mono tnum" style={{ color: "var(--ink-3)" }}>{r.impressions}M</span>
              <span className="mono tnum" style={{ fontWeight: 600 }}>{r.share}%</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Engagement lift by region</div>
      <BarList items={REGION_DATA} valueKey="lift" suffix="%" color="var(--primary)" />
    </div>
  );
}

export function AnalyticsCohortView() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
        {COHORT_DATA.map(c => (
          <div key={c.id} style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--line-2)" }}>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{c.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 17, fontWeight: 500 }} className="tnum">{c.reach}</span>
              <span style={{ fontSize: 10.5, color: "var(--ink-3)" }}>% reach</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Recall · by cohort</div>
      <BarList items={COHORT_DATA} valueKey="recall" suffix="%" color="oklch(0.58 0.16 35)" />
      <div style={{ height: 10 }} />
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Engagement lift · by cohort</div>
      <BarList items={COHORT_DATA} valueKey="lift" suffix="%" color="var(--primary)" />
    </div>
  );
}

export const analyticsIconBtn = {
  background: "var(--surface)", border: "1px solid var(--line)",
  padding: "6px 10px", borderRadius: 8, fontSize: 11.5, color: "var(--ink-2)", cursor: "pointer",
};

export const analyticsThStyle = {
  textAlign: "left", fontSize: 10.5, color: "var(--ink-3)", fontWeight: 500,
  padding: "9px 14px", letterSpacing: "0.06em", textTransform: "uppercase",
};
