import React, { useState as useS, useMemo as useM, useEffect as useE, useRef as useR } from "react";
import { TweakColor, TweakRadio, TweakSection, TweakToggle, TweaksPanel, useTweaks } from "./tweaks-panel.jsx";
import { ACTIVITY, AMPLIFICATION, BUSINESS_TILES, CAMPAIGN, COHORT_DATA, ENGAGEMENT_DAYS, FUNNEL, INSIGHTS, KPIS, PLACEMENT_ROWS, REGION_DATA, REPORTS, fmtDelta, fmtMoney, fmtNum } from "./data.jsx";
import { BarList, Donut, EngagementChart } from "./charts.jsx";
import { FilterBar, Header, KpiStrip, ProfileDropdown, Sidebar, avatarStyle } from "./panels.jsx";
import { PlacementsPage } from "./placements-page.jsx";
import { AIInsightsPage } from "./insights-page.jsx";
import { AnalyticsPage } from "./analytics-page.jsx";
import { BusinessImpactPage } from "./impact-page.jsx";
import { AudiencePage } from "./audience-page.jsx";
import { AmplificationPage } from "./amplification-page.jsx";
import { TelemetryPage } from "./telemetry-page.jsx";
/* Main app — Mela Scale Traction Analytics */


export const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "comfortable",
  "accent": "#5B4BCC",
  "showAI": true,
  "showActivity": true
}/*EDITMODE-END*/;

export const ACCENT_MAP = {
  "#5B4BCC": { primary: "oklch(0.42 0.16 285)", primarySoft: "oklch(0.92 0.04 285)" },
  "#D85A1F": { primary: "oklch(0.55 0.18 35)",  primarySoft: "oklch(0.94 0.04 50)" },
  "#3A6FB8": { primary: "oklch(0.48 0.14 220)", primarySoft: "oklch(0.92 0.04 220)" },
  "#3A8758": { primary: "oklch(0.45 0.12 155)", primarySoft: "oklch(0.92 0.04 155)" },
};

export function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = useS("overview");
  const [rangeIdx, setRangeIdx] = useS(2);
  const [compare, setCompare] = useS(true);
  const [filters, setFilters] = useS({ platform: "all", game: "all", placements: [], regions: [], cohorts: [] });
  const [reportOpen, setReportOpen] = useS(null);
  const [darkMode, setDarkMode] = useS(false);
  const [settingsOpen, setSettingsOpen] = useS(false);
  const [profileOpen, setProfileOpen] = useS(false);
  const [navOpen, setNavOpen] = useS(false);

  useE(() => {
    document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useE(() => {
    const a = ACCENT_MAP[t.accent] || ACCENT_MAP["#5B4BCC"];
    document.documentElement.style.setProperty("--primary", a.primary);
    document.documentElement.style.setProperty("--primary-soft", a.primarySoft);
  }, [t.accent]);

  return (
    <div className="app" onClick={() => profileOpen && setProfileOpen(false)}>
      <Sidebar active={active} setActive={(id) => { setNavOpen(false); if (id === "settings") { setSettingsOpen(true); } else { setActive(id); } }} darkMode={darkMode} setDarkMode={setDarkMode} navOpen={navOpen} />
      {navOpen && <div className="sidebar-scrim" onClick={() => setNavOpen(false)} />}
      <main>
        <Header rangeIdx={rangeIdx} setRangeIdx={setRangeIdx} compare={compare} setCompare={setCompare} onMenu={() => setNavOpen(v => !v)} />
        {active === "reports" ? (
          <ReportsPage onOpenReport={setReportOpen} />
        ) : active === "placements" ? (
          <PlacementsPage />
        ) : active === "activity" ? (
          <ActivityPage />
        ) : active === "insights" ? (
          <AIInsightsPage />
        ) : active === "analytics" ? (
          <AnalyticsPage />
        ) : active === "impact" ? (
          <BusinessImpactPage />
        ) : active === "audience" ? (
          <AudiencePage />
        ) : active === "amp" ? (
          <AmplificationPage />
        ) : active === "integrations" ? (
          <TelemetryPage />
        ) : (
          <React.Fragment>
            <FilterBar filters={filters} setFilters={setFilters} />
            <KpiStrip compare={compare} />
            <MainGrid showAI={t.showAI} compare={compare} />
            <BusinessImpactSection />
            <AmplificationSection />
            <SegmentGrid />
          </React.Fragment>
        )}
        <Footer />
      </main>
      <div style={{ position: "fixed", top: 7, right: 28, zIndex: 10 }}>
        <button onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }} style={{ ...avatarStyle, cursor: "pointer" }}>KO</button>
        {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
      </div>
      <TweaksUI t={t} setTweak={setTweak} />
      {reportOpen && <ReportDrawer report={reportOpen} onClose={() => setReportOpen(null)} />}
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} darkMode={darkMode} setDarkMode={setDarkMode} />}
    </div>
  );
}

/* ───────── Main Grid (Chart + AI Insights) ───────── */
export function MainGrid({ showAI, compare }) {
  const [chartTab, setChartTab] = useS("engagement");
  return (
    <div className="grid-1">
      <ChartCard tab={chartTab} setTab={setChartTab} compare={compare} />
    </div>
  );
}

export function ChartCard({ tab, setTab, compare }) {
  const tabs = [
    { id: "engagement", label: "Engagements" },
    { id: "viewability", label: "Viewability" },
    { id: "recall", label: "Recall" },
    { id: "cpe", label: "Cost / engagement" },
  ];
  return (
    <div className="card" style={{ padding: "18px 18px 14px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase" }} className="mono">Trend · Daily</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 6, flexWrap: "wrap" }}>
            <div style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">487,210</div>
            <div style={{ fontSize: 13, color: "var(--good)", background: "var(--good-soft)", padding: "2px 7px", borderRadius: 999, fontWeight: 600 }} className="mono tnum">↑ 12.4%</div>
            <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>total engagements · last 30 days</div>
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button title="Download CSV" style={iconBtn}>↓ CSV</button>
          <button title="Download PNG" style={iconBtn}>↓ PNG</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginBottom: 12, flexWrap: "wrap" }}>
        {tabs.map(tb => (
          <button key={tb.id} onClick={() => setTab(tb.id)} style={{
            border: "none", background: "transparent",
            padding: "8px 12px", fontSize: 13,
            color: tb.id === tab ? "var(--ink)" : "var(--ink-3)",
            fontWeight: tb.id === tab ? 600 : 500,
            borderBottom: `2px solid ${tb.id === tab ? "var(--primary)" : "transparent"}`,
            marginBottom: -1,
          }}>{tb.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 14, alignItems: "center", paddingBottom: 8, fontSize: 11.5, color: "var(--ink-2)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 14, height: 2, background: "var(--primary)" }} /> This period
          </span>
          {compare && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--ink-3)" }}>
              <span style={{ width: 14, height: 0, borderTop: "2px dashed oklch(0.78 0.04 285)" }} /> Previous
            </span>
          )}
        </div>
      </div>
      <EngagementChart data={ENGAGEMENT_DAYS} height={280} showPrevious={compare} />
    </div>
  );
}

export const iconBtn = {
  background: "var(--surface)", border: "1px solid var(--line)",
  padding: "6px 10px", borderRadius: 8, fontSize: 11.5, color: "var(--ink-2)",
};

/* ───────── AI Insights ───────── */
export function AIInsights() {
  const [generating, setGenerating] = useS(false);
  const [openIdx, setOpenIdx] = useS(0);
  return (
    <div className="card card-strong" style={{
      padding: 0, overflow: "hidden",
      background: "linear-gradient(180deg, var(--ai-grad-top) 0%, var(--surface) 60%)",
      border: "1px solid var(--line)",
    }}>
      <div style={{ padding: "16px 16px 12px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line-2)" }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, var(--primary), oklch(0.66 0.18 35))",
          display: "grid", placeItems: "center", color: "white", fontSize: 14, fontWeight: 600,
        }}>✦</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>What's driving traction</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Synthesized from 12.7M events · 4 min ago</div>
        </div>
        <button onClick={() => { setGenerating(true); setTimeout(() => setGenerating(false), 1400); }} style={{
          border: "1px solid var(--line)", background: "var(--surface)",
          padding: "5px 9px", borderRadius: 8, fontSize: 11.5, color: "var(--ink-2)",
        }}>{generating ? "Thinking…" : "↻ Regenerate"}</button>
      </div>
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, maxHeight: 360, overflow: "auto" }}>
        {INSIGHTS.map((ins, i) => (
          <InsightCard key={i} insight={ins} open={i === openIdx} onToggle={() => setOpenIdx(i === openIdx ? -1 : i)} loading={generating} />
        ))}
        <button style={{
          marginTop: 4, background: "transparent", border: "1px dashed var(--line)",
          padding: "8px 12px", borderRadius: 10, color: "var(--ink-2)", fontSize: 12.5,
        }}>+ Ask a question about this data</button>
      </div>
    </div>
  );
}

export function InsightCard({ insight, open, onToggle, loading }) {
  const impactColor = insight.impact === "high" ? "var(--accent)" : "var(--ink-3)";
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--line-2)",
      borderRadius: 12, padding: 12, opacity: loading ? 0.55 : 1, transition: "opacity .3s",
    }}>
      <div onClick={onToggle} style={{
        display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer",
      }}>
        <span style={{
          marginTop: 4, width: 8, height: 8, borderRadius: 2, background: impactColor,
          flexShrink: 0,
        }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{insight.title}</div>
          {open && (
            <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5, marginTop: 8 }} onClick={e => e.stopPropagation()}>
              {insight.body}
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                {insight.tags.map(tg => (
                  <span key={tg} style={{ fontSize: 10.5, color: "var(--ink-3)", background: "var(--surface-2)", padding: "2px 7px", borderRadius: 999, border: "1px solid var(--line-2)" }} className="mono">#{tg}</span>
                ))}
                <span style={{ flex: 1 }} />
                <button style={{ fontSize: 11.5, color: "var(--primary)", background: "transparent", border: "none", fontWeight: 600, padding: 0, cursor: "pointer" }}>Open analysis →</button>
              </div>
            </div>
          )}
        </div>
        <span style={{ color: "var(--ink-3)", fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s" }}>⌄</span>
      </div>
    </div>
  );
}

/* ───────── Business Impact ───────── */
export function BusinessImpactSection() {
  return (
    <div className="grid-2-mid">
      <FunnelCard />
    </div>
  );
}

export function FunnelCard() {
  const maxV = FUNNEL[0].value;
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Exposure → conversion funnel</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Attributed to Northwind Goods Spring Planting · 30d</div>
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
          const w = (step.value / maxV) * 100;
          const mobShare = i === 0 ? 67 : i === 1 ? 66 : i === 2 ? 65 : i === 3 ? 58 : 51;
          return (
            <div key={step.stage} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 170, fontSize: 13, color: "var(--ink-2)" }}>{step.stage}</div>
              <div style={{ flex: 1, height: 26, background: "var(--surface-2)", borderRadius: 6, position: "relative", overflow: "hidden" }}>
                <div style={{
                  position: "absolute", inset: 0,
                  width: `${w}%`,
                  display: "flex",
                }}>
                  <div style={{ width: `${mobShare}%`, background: "var(--primary)", borderRadius: "6px 0 0 6px" }} />
                  <div style={{ width: `${100 - mobShare}%`, background: "oklch(0.62 0.15 50)" }} />
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", paddingLeft: 10, fontSize: 11.5, color: "white", fontWeight: 600, mixBlendMode: "difference" }} className="mono tnum">
                  {fmtNum(step.value)}
                </div>
              </div>
              <div style={{ width: 56, textAlign: "right", fontSize: 12, color: "var(--ink-3)" }} className="mono tnum">{step.pct < 10 ? step.pct.toFixed(2) : step.pct.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 12, fontSize: 12.5 }}>
        <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--primary)" }} />
        <span><b>0.48%</b> impression-to-conversion is <b style={{ color: "var(--good)" }}>2.4× the in-game median.</b> WebGL funnel converts at 0.73%, Mobile at 0.36%.</span>
      </div>
    </div>
  );
}

export function BusinessTiles() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {BUSINESS_TILES.map(tile => (
        <div key={tile.id} className="card" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{tile.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">{tile.value}</span>
              <span style={{ fontSize: 11.5, color: "var(--good)", background: "var(--good-soft)", padding: "1px 6px", borderRadius: 999, fontWeight: 600 }} className="mono tnum">↑ {tile.delta}</span>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>{tile.sub}</div>
          </div>
          <div style={{ width: 1, alignSelf: "stretch", background: "var(--line-2)" }} />
          <div style={{ width: 180, fontSize: 11.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{tile.detail}</div>
        </div>
      ))}
    </div>
  );
}

/* ───────── Amplification ───────── */
export function AmplificationSection() {
  return (
    <div className="grid-2-flip">
      <SocialCard />
      <InfluencerTable />
    </div>
  );
}

export function SocialCard() {
  const s = AMPLIFICATION.sentiment;
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ fontSize: 14.5, fontWeight: 600 }}>Social amplification</div>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Owned + earned mentions across platforms · 30d</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
        <span style={{ fontSize: 30, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">{fmtNum(AMPLIFICATION.socialMentions)}</span>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>mentions</span>
        <span style={{ fontSize: 11.5, color: "var(--good)", background: "var(--good-soft)", padding: "1px 6px", borderRadius: 999, fontWeight: 600 }} className="mono tnum">↑ {AMPLIFICATION.socialDelta}%</span>
      </div>
      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }} className="mono">Sentiment</div>
        <div style={{ display: "flex", height: 10, borderRadius: 999, overflow: "hidden", background: "var(--surface-2)" }}>
          <div style={{ width: `${s.positive}%`, background: "var(--good)" }} title={`Positive ${s.positive}%`} />
          <div style={{ width: `${s.neutral}%`, background: "oklch(0.78 0.04 80)" }} title={`Neutral ${s.neutral}%`} />
          <div style={{ width: `${s.negative}%`, background: "var(--bad)" }} title={`Negative ${s.negative}%`} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11.5, color: "var(--ink-2)" }}>
          <span><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--good)", display: "inline-block", marginRight: 6 }} />Positive <b className="mono tnum">{s.positive}%</b></span>
          <span><span style={{ width: 6, height: 6, borderRadius: 3, background: "oklch(0.78 0.04 80)", display: "inline-block", marginRight: 6 }} />Neutral <b className="mono tnum">{s.neutral}%</b></span>
          <span><span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--bad)", display: "inline-block", marginRight: 6 }} />Negative <b className="mono tnum">{s.negative}%</b></span>
        </div>
      </div>
      <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--surface-2)", border: "1px solid var(--line-2)", borderRadius: 10, display: "flex", alignItems: "center", gap: 10, fontSize: 12.5 }}>
        <span style={{ fontSize: 16 }}>✎</span>
        <span><b className="mono tnum">{fmtNum(AMPLIFICATION.ugc)}</b> player-generated screenshots / clips tagged the campaign this week.</span>
      </div>
    </div>
  );
}

export function InfluencerTable() {
  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", borderBottom: "1px solid var(--line)" }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Influencer exposure</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Creators driving organic + sponsored reach</div>
        </div>
        <div style={{ flex: 1 }} />
        <button style={iconBtn}>Manage list</button>
      </div>
      <div className="table-scroll">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "var(--surface-2)" }}>
          <tr>
            <th style={thStyle}>Creator</th>
            <th style={thStyle}>Platform</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Reach</th>
            <th style={{ ...thStyle, textAlign: "right" }}>Type</th>
          </tr>
        </thead>
        <tbody>
          {AMPLIFICATION.topInfluencers.map((inf, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
              <td style={{ padding: "11px 14px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 24, height: 24, borderRadius: 999, background: "linear-gradient(135deg, oklch(0.65 0.13 " + (i * 73 % 360) + "), oklch(0.5 0.16 " + ((i * 73 + 60) % 360) + "))", color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 600 }}>
                    {inf.name[0].toUpperCase()}
                  </span>
                  <span style={{ fontWeight: 500 }} className="mono">{inf.name}</span>
                </span>
              </td>
              <td style={{ padding: "11px 14px", color: "var(--ink-2)" }}>{inf.platform}</td>
              <td style={{ padding: "11px 14px", textAlign: "right" }} className="mono tnum">{fmtNum(inf.reach)}</td>
              <td style={{ padding: "11px 14px", textAlign: "right" }}>
                <span style={{
                  fontSize: 10.5, fontWeight: 600,
                  padding: "2px 8px", borderRadius: 999,
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
  );
}

export const thStyle = {
  textAlign: "left", fontSize: 11, color: "var(--ink-3)", fontWeight: 500,
  padding: "10px 14px", letterSpacing: "0.06em", textTransform: "uppercase",
};

/* ───────── Placement Table + Region/Cohort grid ───────── */
export function SegmentGrid() {
  return (
    <div className="grid-2-table">
      <RegionCohort />
    </div>
  );
}

export function PlacementTable() {
  const [sortKey, setSortKey] = useS("impressions");
  const [sortDir, setSortDir] = useS("desc");
  const rows = useM(() => {
    const s = [...PLACEMENT_ROWS].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const cmp = typeof av === "string" ? av.localeCompare(bv) : av - bv;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return s;
  }, [sortKey, sortDir]);

  function header(key, label, align = "left") {
    const isActive = sortKey === key;
    return (
      <th onClick={() => { isActive ? setSortDir(sortDir === "asc" ? "desc" : "asc") : (setSortKey(key), setSortDir("desc")); }}
        style={{ textAlign: align, fontSize: 11, color: "var(--ink-3)", fontWeight: 500, padding: "10px 12px", letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer", userSelect: "none" }} className="mono">
        {label} {isActive && (sortDir === "asc" ? "↑" : "↓")}
      </th>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid var(--line)" }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Placement performance</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>By placement type and game · 30d</div>
        </div>
        <div style={{ flex: 1 }} />
        <button style={iconBtn}>Group by ⌄</button>
        <button style={iconBtn}>↓ Export</button>
      </div>
      <div className="table-scroll">
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead style={{ background: "var(--surface-2)" }}>
          <tr>
            {header("placement", "Placement")}
            {header("game", "Map")}
            {header("platform", "Platform")}
            {header("impressions", "Impressions", "right")}
            {header("ctr", "Eng. rate", "right")}
            {header("recall", "Recall", "right")}
            {header("cpe", "CPE", "right")}
            {header("lift", "Lift", "right")}
            <th style={{ width: 48 }}></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderTop: "1px solid var(--line-2)" }}>
              <td style={{ padding: "12px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <PlacementBadge type={r.placement} />
                  <span>
                    <div style={{ fontWeight: 500 }}>{r.placement}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{r.detail}</div>
                  </span>
                </span>
              </td>
              <td style={{ padding: "12px", color: "var(--ink-2)" }}>{r.game}</td>
              <td style={{ padding: "12px" }}>
                <span style={{ fontSize: 10.5, color: "var(--ink-2)", padding: "2px 7px", borderRadius: 999, border: "1px solid var(--line-2)", background: "var(--surface-2)" }} className="mono">{r.platform}</span>
              </td>
              <td style={{ padding: "12px", textAlign: "right" }} className="mono tnum">{fmtNum(r.impressions)}</td>
              <td style={{ padding: "12px", textAlign: "right" }} className="mono tnum">{r.ctr.toFixed(1)}%</td>
              <td style={{ padding: "12px", textAlign: "right" }} className="mono tnum">{r.recall}%</td>
              <td style={{ padding: "12px", textAlign: "right" }} className="mono tnum">{fmtMoney(r.cpe)}</td>
              <td style={{ padding: "12px", textAlign: "right" }}>
                <LiftCell value={r.lift} status={r.status} />
              </td>
              <td style={{ padding: "12px", textAlign: "right", color: "var(--ink-3)" }}>⋯</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export function PlacementBadge({ type }) {
  const map = {
    "In-game Billboard": { bg: "oklch(0.95 0.04 220)", fg: "oklch(0.4 0.12 220)",  initial: "B" },
    "Cutscene":          { bg: "oklch(0.95 0.04 325)", fg: "oklch(0.45 0.14 325)", initial: "C" },
    "Cosmetic":          { bg: "oklch(0.95 0.04 35)",  fg: "oklch(0.5 0.14 35)",   initial: "C" },
    "Environmental":     { bg: "oklch(0.95 0.04 155)", fg: "oklch(0.4 0.12 155)",  initial: "E" },
  };
  const c = map[type] || map["In-game Billboard"];
  return <span style={{ width: 22, height: 22, borderRadius: 6, background: c.bg, color: c.fg, display: "grid", placeItems: "center", fontSize: 11, fontWeight: 600 }}>{c.initial}</span>;
}

export function LiftCell({ value, status }) {
  const color = status === "up" ? "var(--good)" : status === "down" ? "var(--bad)" : "var(--ink-2)";
  const arrow = status === "up" ? "↑" : status === "down" ? "↓" : "→";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <span style={{
        width: 36, height: 6, borderRadius: 3, background: "var(--line-2)", position: "relative", overflow: "hidden",
      }}>
        <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.min(100, value * 2.5)}%`, background: color, borderRadius: 3 }} />
      </span>
      <span style={{ color, fontWeight: 600, minWidth: 38, textAlign: "right" }} className="mono tnum">{arrow} {value}%</span>
    </span>
  );
}

export function RegionCohort() {
  const [tab, setTab] = useS("region");
  return (
    <div className="card" style={{ padding: 18, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>Segment breakdown</div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", background: "var(--surface-2)", borderRadius: 8, padding: 3 }}>
          {[["region", "Region"], ["cohort", "Cohort"]].map(([id, lab]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              border: "none", background: tab === id ? "var(--surface)" : "transparent",
              boxShadow: tab === id ? "var(--shadow-sm)" : "none",
              padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500,
              color: tab === id ? "var(--ink)" : "var(--ink-3)",
            }}>{lab}</button>
          ))}
        </div>
      </div>
      {tab === "region" ? <RegionView /> : <CohortView />}
    </div>
  );
}

export function RegionView() {
  const segments = REGION_DATA.map((r, i) => ({
    value: r.share,
    color: ["var(--primary)", "oklch(0.58 0.16 35)", "oklch(0.55 0.13 175)", "oklch(0.7 0.12 60)"][i],
  }));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 18 }}>
        <div style={{ position: "relative" }}>
          <Donut segments={segments} size={130} thickness={16} />
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }} className="tnum">14.1M</div>
              <div style={{ fontSize: 10.5, color: "var(--ink-3)" }} className="mono">IMPRESSIONS</div>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {REGION_DATA.map((r, i) => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
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

export function CohortView() {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 16 }}>
        {COHORT_DATA.map(c => (
          <div key={c.id} style={{ padding: "10px 12px", background: "var(--surface-2)", borderRadius: 10, border: "1px solid var(--line-2)" }}>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{c.label}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 500 }} className="tnum">{c.reach}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>% reach</span>
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

/* ───────── Bottom: Reports + Activity ───────── */
export function ActivityPage() {
  return (
    <div style={{ padding: "20px 28px 28px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Live activity</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Real-time event stream for {CAMPAIGN.brand} × {CAMPAIGN.game}</div>
      </div>
      <ActivityStream />
    </div>
  );
}

export function ReportsPage({ onOpenReport }) {
  return (
    <div style={{ padding: "20px 28px 28px" }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em" }}>Reports</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 2 }}>Automated weekly intelligence for {CAMPAIGN.brand} × {CAMPAIGN.game}</div>
      </div>
      <ReportsList onOpen={onOpenReport} />
    </div>
  );
}

export function ReportsList({ onOpen }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 600 }}>Automated weekly reports</div>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Generated every Monday 06:00 UTC · with trend analysis & placement recommendations</div>
        </div>
        <div style={{ flex: 1 }} />
        <button style={{ ...iconBtn, background: "var(--surface-2)" }}>⚙ Configure</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {REPORTS.map(r => (
          <button key={r.id} onClick={() => onOpen(r)} style={{
            display: "flex", alignItems: "center", gap: 14, padding: "14px 14px",
            background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 12,
            textAlign: "left", cursor: "pointer",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, background: "var(--surface-2)",
              border: "1px solid var(--line)", display: "grid", placeItems: "center",
              color: "var(--ink-2)", fontSize: 16,
            }}>▦</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{r.week}</span>
                <span style={{
                  fontSize: 10.5, color: r.delta >= 0 ? "var(--good)" : "var(--bad)",
                  background: r.delta >= 0 ? "var(--good-soft)" : "oklch(0.95 0.04 25)",
                  padding: "1px 6px", borderRadius: 999, fontWeight: 600,
                }} className="mono tnum">{fmtDelta(r.delta)}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>{r.title}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{r.lead}</div>
            </div>
            <span style={{ color: "var(--ink-3)" }}>→</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ActivityStream() {
  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <span className="live-dot" />
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>Live activity</div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11.5, color: "var(--ink-3)" }} className="mono">5/5 feeds</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {ACTIVITY.map((a, i) => (
          <div key={i} style={{
            display: "flex", gap: 12, padding: "10px 0",
            borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--line-2)" : "none",
          }}>
            <div style={{ minWidth: 56 }}>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{a.t}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, lineHeight: 1.4 }}>{a.txt}</div>
            </div>
            <ActivityDot tag={a.tag} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ActivityDot({ tag }) {
  const map = {
    milestone: "var(--primary)", up: "var(--good)", warn: "var(--warn)",
    info: "var(--ink-3)", down: "var(--bad)",
  };
  return <span style={{ width: 6, height: 6, borderRadius: 3, background: map[tag] || "var(--ink-3)", marginTop: 7, flexShrink: 0 }} />;
}

export function Footer() {
  return (
    <footer className="app-footer" style={{ padding: "20px 28px 28px", display: "flex", gap: 16, alignItems: "center", color: "var(--ink-3)", fontSize: 12, borderTop: "1px solid var(--line)" }}>
      <span>Mela Scale · Traction OS · v2.4</span>
      <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--ink-3)" }} />
      <span>Data SLA: 99.94%</span>
      <span style={{ width: 4, height: 4, borderRadius: 2, background: "var(--ink-3)" }} />
      <span>IAB MRC viewability accredited</span>
      <span style={{ flex: 1 }} />
      <span className="mono">⌘ + / · keyboard shortcuts</span>
    </footer>
  );
}

/* ───────── Settings Modal ───────── */
export function SettingsModal({ onClose, darkMode, setDarkMode }) {
  const [tab, setTab] = useS("general");
  const tabs = [
    { id: "general", label: "General", icon: "⚙" },
    { id: "notifications", label: "Notifications", icon: "◻" },
    { id: "integrations", label: "Integrations", icon: "↯" },
    { id: "export", label: "Export data", icon: "↓" },
    { id: "billing", label: "Billing & plan", icon: "▦" },
  ];
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "oklch(0.2 0.01 80 / 0.4)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: 20, width: 720, maxHeight: "86vh",
        display: "flex", overflow: "hidden", boxShadow: "0 24px 64px oklch(0.1 0.01 80 / 0.28)",
        border: "1px solid var(--line)", animation: "fadeUp .18s ease",
      }}>
        <style>{`@keyframes fadeUp { from { transform: translateY(12px); opacity:0; } to { transform:none; opacity:1; } }`}</style>
        {/* Left nav */}
        <div style={{ width: 200, background: "var(--surface)", borderRight: "1px solid var(--line)", padding: 16, display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", padding: "4px 8px 12px", letterSpacing: "-0.01em" }}>Settings</div>
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
              background: tab === tb.id ? "var(--surface-2)" : "transparent",
              border: "none", borderRadius: 8, fontSize: 13.5, textAlign: "left",
              color: tab === tb.id ? "var(--ink)" : "var(--ink-2)", fontWeight: tab === tb.id ? 600 : 400, cursor: "pointer",
            }}>
              <span style={{ color: "var(--ink-3)" }}>{tb.icon}</span>{tb.label}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: 8, padding: "8px 10px",
            background: "transparent", border: "none", borderRadius: 8,
            fontSize: 13, color: "var(--ink-3)", cursor: "pointer", textAlign: "left",
          }}>✕ Close</button>
        </div>
        {/* Right content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px 28px" }}>
          {tab === "general" && <SettingsGeneral darkMode={darkMode} setDarkMode={setDarkMode} />}
          {tab === "notifications" && <SettingsNotifications />}
          {tab === "integrations" && <SettingsIntegrations />}
          {tab === "export" && <SettingsExport />}
          {tab === "billing" && <SettingsBilling />}
        </div>
      </div>
    </div>
  );
}

export function SettingsRow({ label, sub, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid var(--line-2)" }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{sub}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export function ToggleSwitch({ value, onChange }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 40, height: 22, borderRadius: 999, background: value ? "var(--primary)" : "var(--line)",
      border: "none", position: "relative", cursor: "pointer", transition: "background .2s",
    }}>
      <span style={{
        position: "absolute", top: 3, left: value ? 19 : 3,
        width: 16, height: 16, borderRadius: 999, background: "white",
        transition: "left .2s", boxShadow: "0 1px 3px oklch(0 0 0/0.2)",
      }} />
    </button>
  );
}

export function SettingsGeneral({ darkMode, setDarkMode }) {
  const [timezone, setTimezone] = useS("UTC+0");
  const [dateFormat, setDateFormat] = useS("MMM D, YYYY");
  const [refreshRate, setRefreshRate] = useS("30s");
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>General</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20 }}>Workspace, display, and data preferences</div>
      <SettingsRow label="Dark mode" sub="Switch between light and dark interface">
        <ToggleSwitch value={darkMode} onChange={setDarkMode} />
      </SettingsRow>
      <SettingsRow label="Timezone" sub="Used for all date/time displays">
        <select value={timezone} onChange={e => setTimezone(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }}>
          {["UTC-8 (PST)", "UTC-5 (EST)", "UTC+0 (GMT)", "UTC+1 (CET)", "UTC+8 (SGT)"].map(tz => <option key={tz}>{tz}</option>)}
        </select>
      </SettingsRow>
      <SettingsRow label="Date format" sub="How dates appear in the dashboard">
        <select value={dateFormat} onChange={e => setDateFormat(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }}>
          {["MMM D, YYYY", "DD/MM/YYYY", "YYYY-MM-DD"].map(f => <option key={f}>{f}</option>)}
        </select>
      </SettingsRow>
      <SettingsRow label="Data refresh rate" sub="How often live metrics update">
        <select value={refreshRate} onChange={e => setRefreshRate(e.target.value)} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }}>
          {["10s", "30s", "1m", "5m", "Manual"].map(r => <option key={r}>{r}</option>)}
        </select>
      </SettingsRow>
      <SettingsRow label="Export format" sub="Default format for chart and data exports">
        <select style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }}>
          {["CSV", "XLSX", "JSON", "PNG"].map(f => <option key={f}>{f}</option>)}
        </select>
      </SettingsRow>
      <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
        <button style={{ padding: "8px 16px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface)", color: "var(--ink-2)", fontSize: 13 }}>Discard</button>
        <button style={{ padding: "8px 16px", border: "none", borderRadius: 10, background: "var(--ink)", color: "var(--surface)", fontSize: 13, fontWeight: 500 }}>Save changes</button>
      </div>
    </div>
  );
}

export function SettingsNotifications() {
  const [state, setState] = useS({ weekly: true, alerts: true, digest: false, slack: true });
  const rows = [
    { id: "weekly", label: "Weekly report email", sub: "Delivered every Monday at 06:00 UTC" },
    { id: "alerts", label: "Performance alerts", sub: "When a KPI drops below your set threshold" },
    { id: "digest", label: "Daily digest", sub: "Summary of key metrics each morning" },
    { id: "slack", label: "Slack notifications", sub: "Post alerts to your connected Slack workspace" },
  ];
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Notifications</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20 }}>Control how and when Mela Scale contacts you</div>
      {rows.map(r => (
        <SettingsRow key={r.id} label={r.label} sub={r.sub}>
          <ToggleSwitch value={state[r.id]} onChange={v => setState({ ...state, [r.id]: v })} />
        </SettingsRow>
      ))}
      <SettingsRow label="Alert threshold" sub="Trigger alert when engagement drops below">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input type="number" defaultValue={70} style={{ width: 64, padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 13 }} />
          <span style={{ color: "var(--ink-3)", fontSize: 13 }}>%</span>
        </div>
      </SettingsRow>
    </div>
  );
}

export function SettingsIntegrations() {
  const integrations = [
    { name: "Lima Farming Game API", status: "connected", icon: "↯", detail: "5 data feeds · last sync 12s ago" },
    { name: "Slack", status: "connected", icon: "◆", detail: "#mela-alerts · kwame@northwindgoods.com" },
    { name: "Google Analytics", status: "disconnected", icon: "△", detail: "Attribution enrichment" },
    { name: "Salesforce CRM", status: "disconnected", icon: "◇", detail: "Conversion attribution sync" },
  ];
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Integrations</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20 }}>Connect data sources and third-party tools</div>
      {integrations.map(it => (
        <div key={it.name} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 0", borderBottom: "1px solid var(--line-2)" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--line)", display: "grid", placeItems: "center", color: "var(--ink-2)", fontSize: 14 }}>{it.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.name}</div>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{it.detail}</div>
          </div>
          <button style={{
            padding: "6px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
            border: `1px solid ${it.status === "connected" ? "var(--good)" : "var(--line)"}`,
            background: it.status === "connected" ? "var(--good-soft)" : "var(--surface)",
            color: it.status === "connected" ? "var(--good)" : "var(--ink-2)",
          }}>{it.status === "connected" ? "● Connected" : "Connect"}</button>
        </div>
      ))}
    </div>
  );
}

export function SettingsExport() {
  const [format, setFormat] = useS("csv");
  const [scope, setScope] = useS({ kpis: true, placements: true, engagement: true, funnel: true, segments: true, social: false });
  const [dateRange, setDateRange] = useS("current");
  const [exporting, setExporting] = useS(false);
  const [exported, setExported] = useS(null);

  const scopeRows = [
    { id: "kpis", label: "Campaign overview & KPIs", sub: "Reach, session length, engagement depth, deltas" },
    { id: "placements", label: "Placement performance", sub: "All placement rows with impressions, CTR, recall, CPE, lift" },
    { id: "engagement", label: "Engagement time series", sub: "Daily engagement data, mobile & WebGL split" },
    { id: "funnel", label: "Funnel & business impact", sub: "Impression → conversion funnel, monetization, retention, LTV" },
    { id: "segments", label: "Audience segments", sub: "Region & cohort breakdowns with reach, recall, lift" },
    { id: "social", label: "Amplification & social", sub: "Social mentions, sentiment, influencer exposure, UGC" },
  ];

  const formats = [
    { id: "csv", label: "CSV", sub: "Comma-separated values" },
    { id: "xlsx", label: "XLSX", sub: "Excel workbook" },
    { id: "json", label: "JSON", sub: "Structured data" },
    { id: "pdf", label: "PDF", sub: "Formatted report" },
  ];

  const dateRanges = [
    { id: "current", label: "Current period (30d)" },
    { id: "campaign", label: "Full campaign" },
    { id: "ytd", label: "Year to date" },
  ];

  const selectedCount = Object.values(scope).filter(Boolean).length;

  function handleExport() {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported({ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), format: format.toUpperCase(), count: selectedCount });
    }, 1600);
  }

  const EXPORT_HISTORY = [
    { id: 1, date: "Jun 19, 2026", time: "14:32", format: "CSV", size: "2.4 MB", scope: "Full campaign", status: "done" },
    { id: 2, date: "Jun 12, 2026", time: "09:15", format: "XLSX", size: "3.1 MB", scope: "Placements + KPIs", status: "done" },
    { id: 3, date: "Jun 5, 2026", time: "11:47", format: "PDF", size: "1.8 MB", scope: "Weekly report Wk 19", status: "done" },
  ];

  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Export data</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20 }}>Download campaign data in your preferred format</div>

      {/* Format selector */}
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Format</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 24 }}>
        {formats.map(f => (
          <button key={f.id} onClick={() => setFormat(f.id)} style={{
            padding: "12px 10px", borderRadius: 10, textAlign: "center", cursor: "pointer",
            background: format === f.id ? "var(--primary-soft)" : "var(--surface)",
            border: `1.5px solid ${format === f.id ? "var(--primary)" : "var(--line)"}`,
            transition: "all .15s ease",
          }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: format === f.id ? "var(--primary)" : "var(--ink)", letterSpacing: "-0.01em" }} className="mono">{f.label}</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>{f.sub}</div>
          </button>
        ))}
      </div>

      {/* Data scope */}
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Include</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 24 }}>
        {scopeRows.map((r, i) => {
          const checked = scope[r.id];
          return (
            <button key={r.id} onClick={() => setScope({ ...scope, [r.id]: !checked })} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
              borderBottom: i < scopeRows.length - 1 ? "1px solid var(--line-2)" : "none",
              background: "transparent", border: "none", borderBottomStyle: i < scopeRows.length - 1 ? "solid" : "none",
              borderBottomWidth: 1, borderBottomColor: "var(--line-2)",
              textAlign: "left", cursor: "pointer", width: "100%",
            }}>
              <span style={{
                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                border: `1.5px solid ${checked ? "var(--primary)" : "var(--line)"}`,
                background: checked ? "var(--primary)" : "transparent",
                display: "grid", placeItems: "center",
                color: "white", fontSize: 10, fontWeight: 700,
                transition: "all .15s ease",
              }}>{checked ? "✓" : ""}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--ink)" }}>{r.label}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 1 }}>{r.sub}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Date range */}
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }} className="mono">Date range</div>
      <div style={{ display: "flex", alignItems: "center", background: "var(--surface-2)", borderRadius: 10, padding: 3, marginBottom: 24, alignSelf: "flex-start" }}>
        {dateRanges.map(dr => (
          <button key={dr.id} onClick={() => setDateRange(dr.id)} style={{
            border: "none",
            background: dateRange === dr.id ? "var(--surface)" : "transparent",
            boxShadow: dateRange === dr.id ? "var(--shadow-sm)" : "none",
            padding: "6px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 500,
            color: dateRange === dr.id ? "var(--ink)" : "var(--ink-3)",
            cursor: "pointer",
          }}>{dr.label}</button>
        ))}
      </div>

      {/* Export action */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <button onClick={handleExport} disabled={selectedCount === 0 || exporting} style={{
          padding: "10px 22px", border: "none", borderRadius: 10,
          background: selectedCount === 0 ? "var(--line)" : "var(--ink)",
          color: selectedCount === 0 ? "var(--ink-3)" : "var(--surface)",
          fontSize: 13.5, fontWeight: 500, cursor: selectedCount === 0 ? "default" : "pointer",
          display: "inline-flex", alignItems: "center", gap: 8,
          opacity: exporting ? 0.7 : 1, transition: "opacity .2s",
        }}>
          {exporting ? (
            <><span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid var(--surface)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin .6s linear infinite" }} /><span>Exporting…</span></>
          ) : (
            <><span>↓</span><span>Export {format.toUpperCase()}</span></>
          )}
        </button>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>
          {selectedCount} {selectedCount === 1 ? "dataset" : "datasets"} selected
        </span>
        {exported && !exporting && (
          <span style={{ fontSize: 12.5, color: "var(--good)", display: "inline-flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
            <span style={{ width: 6, height: 6, borderRadius: 3, background: "var(--good)" }} />
            Exported at {exported.time}
          </span>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Export history */}
      <div style={{ borderTop: "1px solid var(--line)", paddingTop: 20 }}>
        <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }} className="mono">Recent exports</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {EXPORT_HISTORY.map((ex, i) => (
            <div key={ex.id} style={{
              display: "flex", alignItems: "center", gap: 12, padding: "11px 0",
              borderBottom: i < EXPORT_HISTORY.length - 1 ? "1px solid var(--line-2)" : "none",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)",
                border: "1px solid var(--line)", display: "grid", placeItems: "center",
                fontSize: 10, fontWeight: 600, color: "var(--ink-2)",
              }} className="mono">{ex.format}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{ex.scope}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{ex.date} · {ex.time} · {ex.size}</div>
              </div>
              <button style={{
                padding: "5px 10px", borderRadius: 8, fontSize: 11.5,
                border: "1px solid var(--line)", background: "var(--surface)",
                color: "var(--ink-2)", cursor: "pointer",
              }}>↓ Re-download</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SettingsBilling() {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Billing & plan</div>
      <div style={{ fontSize: 13, color: "var(--ink-3)", marginBottom: 20 }}>Manage your subscription and usage</div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 14, padding: 18, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em" }} className="mono">Current plan</div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>Business</div>
            <div style={{ fontSize: 13, color: "var(--ink-3)", marginTop: 4 }}>Up to 50M impressions/mo · 3 campaigns · 10 seats</div>
          </div>
          <span style={{ fontSize: 11, color: "var(--good)", background: "var(--good-soft)", padding: "3px 9px", borderRadius: 999, fontWeight: 600 }}>Active</span>
        </div>
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button style={{ padding: "8px 16px", border: "1px solid var(--line)", borderRadius: 10, background: "var(--surface-2)", color: "var(--ink-2)", fontSize: 13 }}>Manage plan</button>
          <button style={{ padding: "8px 16px", border: "none", borderRadius: 10, background: "var(--ink)", color: "var(--surface)", fontSize: 13, fontWeight: 500 }}>Upgrade to Enterprise</button>
        </div>
      </div>
      {[
        { label: "Impressions", value: "18.2M", limit: "50M", pct: 36 },
        { label: "Campaigns", value: "1", limit: "3", pct: 33 },
        { label: "Team seats", value: "6", limit: "10", pct: 60 },
      ].map(u => (
        <SettingsRow key={u.label} label={u.label} sub={`${u.value} of ${u.limit} used`}>
          <div style={{ width: 140 }}>
            <div style={{ background: "var(--line-2)", height: 6, borderRadius: 999 }}>
              <div style={{ width: `${u.pct}%`, height: "100%", background: u.pct > 80 ? "var(--accent)" : "var(--primary)", borderRadius: 999 }} />
            </div>
          </div>
        </SettingsRow>
      ))}
    </div>
  );
}
export function ReportDrawer({ report, onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "oklch(0.2 0.01 80 / 0.32)",
      zIndex: 100, display: "flex", justifyContent: "flex-end",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 560, background: "var(--bg)", height: "100vh", overflow: "auto",
        boxShadow: "-10px 0 40px oklch(0.2 0.01 80 / 0.12)", animation: "slideIn .2s ease",
      }}>
        <style>{`@keyframes slideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">{report.week}</div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{report.title}</div>
          </div>
          <div style={{ flex: 1 }} />
          <button style={iconBtn}>↓ PDF</button>
          <button style={iconBtn}>Share</button>
          <button onClick={onClose} style={{ ...iconBtn, padding: "6px 9px" }}>✕</button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <Section title="TL;DR">
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
              <b>Northwind Goods × Lima Farming Game</b> delivered <b className="mono tnum">{fmtDelta(report.delta)}</b> WoW with a campaign ROAS of <b className="mono tnum">3.42×</b>. WebGL continues to outperform Mobile on per-user value (4.2× vs 3.1× ROAS, +31% session length). Mobile billboards in Coastal Acres remain a watch item — viewability slipped below the IAB floor after the May 9 weather event.
            </p>
          </Section>
          <Section title="Headline metrics">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10 }}>
              {KPIS.map(k => (
                <div key={k.id} style={{ padding: 12, background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 10 }}>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{k.label}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
                    <span style={{ fontSize: 22, fontWeight: 500 }} className="tnum">{k.value}</span>
                    <span style={{ color: "var(--ink-3)", fontSize: 11 }}>{k.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Trend">
            <div style={{ background: "var(--surface)", border: "1px solid var(--line-2)", borderRadius: 12, padding: 12 }}>
              <EngagementChart data={ENGAGEMENT_DAYS} height={200} showPrevious />
            </div>
          </Section>
          <Section title="Recommendations">
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 1.6, color: "var(--ink-2)" }}>
              <li>Shift 18% of In-game Billboard budget in <b>Coastal Acres</b> to Cosmetic in <b>Sunfield Valley</b>.</li>
              <li>Schedule a sequenced cosmetic drop for <b>APAC lapsed farmers</b> in weeks 22–24.</li>
              <li>Audit the harbor-fog weather event from May 9 — likely cause of billboard viewability dip.</li>
              <li>A/B test cutscene length (8s vs 12s) for season-change shorts in <b>Cedar Heights</b>.</li>
            </ol>
          </Section>
        </div>
      </div>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }} className="mono">{title}</div>
      {children}
    </div>
  );
}

/* ───────── Tweaks ───────── */
export function TweaksUI({ t, setTweak }) {
  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme">
        <TweakRadio label="Density" value={t.density} options={[{value: "compact", label: "Compact"}, {value: "comfortable", label: "Cozy"}]} onChange={v => setTweak("density", v)} />
        <TweakColor label="Accent" value={t.accent} options={["#5B4BCC", "#D85A1F", "#3A6FB8", "#3A8758"]} onChange={v => setTweak("accent", v)} />
      </TweakSection>
      <TweakSection label="Panels">
        <TweakToggle label="AI insights panel" value={t.showAI} onChange={v => setTweak("showAI", v)} />
        <TweakToggle label="Live activity stream" value={t.showActivity} onChange={v => setTweak("showActivity", v)} />
      </TweakSection>
    </TweaksPanel>
  );
}
