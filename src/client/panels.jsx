import React, { useState, useState as useS, useEffect as useE, useRef as useR } from "react";
import { CAMPAIGN, COHORTS, DATE_RANGES, KPIS, NAV, NAV_FOOTER, PLACEMENTS, REGIONS } from "./data.jsx";
import { useClient } from "./context.js";
import { campaignStatus, labelOf, CAMPAIGN_STATUSES } from "../shared/schema.js";
import { fmtDate, fmtNum, timeAgo, initials } from "../shared/format.js";
import { Sparkline } from "../shared/charts.jsx";
/* Panels — sidebar, header, KPI, AI insights, placement table, etc. */

export function Sidebar({ active, setActive, darkMode, setDarkMode, navOpen }) {
  const [analyzeOpen, setAnalyzeOpen] = useS(true);
  const [connectOpen, setConnectOpen] = useS(true);
  return (
    <aside className={`app-sidebar${navOpen ? " is-open" : ""}`} style={{
      background: "var(--surface)",
      borderRight: "1px solid var(--line)",
      padding: "20px 14px",
      position: "sticky", top: 0, height: "100vh", overflow: "auto",
      display: "flex", flexDirection: "column",
    }}>
      <Brand />
      <Workspace />
      <nav style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 1 }}>
        <SectionLabel collapsible collapsed={!analyzeOpen} onToggle={() => setAnalyzeOpen(v => !v)}>Analyze</SectionLabel>
        {analyzeOpen && NAV.map(n => <NavItem key={n.id} item={n} active={active === n.id} onClick={() => setActive(n.id)} />)}
      </nav>
      <nav style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 1 }}>
        <SectionLabel collapsible collapsed={!connectOpen} onToggle={() => setConnectOpen(v => !v)}>Connect</SectionLabel>
        {connectOpen && NAV_FOOTER.map(n => <NavItem key={n.id} item={n} active={active === n.id} onClick={() => setActive(n.id)} />)}
      </nav>
      <div style={{ marginTop: 14 }}>
        <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
      </div>
      <div className="sidebar-feedstatus" style={{ marginTop: 12 }}>
        <FeedStatus />
      </div>
    </aside>
  );
}

export function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 4px" }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8,
        background: "linear-gradient(135deg, var(--primary), oklch(0.58 0.18 320))",
        position: "relative", overflow: "hidden", boxShadow: "inset 0 0 0 1px oklch(1 0 0 / 0.15)",
      }}>
        <div style={{ position: "absolute", inset: 6, borderRadius: 4, background: "oklch(1 0 0 / 0.18)" }} />
        <div style={{ position: "absolute", left: 9, top: 13, right: 9, height: 2, background: "white", borderRadius: 2 }} />
      </div>
      <div className="sidebar-brand-text">
        <div style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 15 }}>Mela Scale</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase" }} className="mono">Campaign Intelligence</div>
      </div>
    </div>
  );
}

/* Campaign switcher: the signed-in client's campaigns across Kunta Content games. */
export function Workspace() {
  const ctx = useClient();
  const [open, setOpen] = useS(false);
  const ref = useR(null);
  useE(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);
  if (!ctx) return null;
  const { campaigns, games, current, select, today } = ctx;
  const gameOf = (c) => games.find(g => g.id === c.game_id) || { abbr: "?", hue: 80, name: "Game" };
  const sel = gameOf(current);
  return (
    <div ref={ref} style={{ position: "relative", marginTop: 16 }}>
      <button className="sidebar-workspace" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Switch campaign" style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "8px 10px", background: "var(--surface-2)", border: "1px solid var(--line)",
        borderRadius: 10, cursor: "pointer", textAlign: "left",
      }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: `oklch(0.55 0.14 ${sel.hue})`, display: "grid", placeItems: "center", fontSize: 9, fontWeight: 700, color: "white", flexShrink: 0, letterSpacing: "-0.02em" }}>{sel.abbr}</div>
        <div className="sidebar-workspace-text" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{sel.name}</div>
          <div style={{ fontSize: 10.5, color: "var(--ink-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{current.name} · {labelOf(CAMPAIGN_STATUSES, campaignStatus(current, today))}</div>
        </div>
        <span className="sidebar-workspace-text" style={{ color: "var(--ink-3)", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}>⌄</span>
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, minWidth: 220, zIndex: 50,
          background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 10,
          boxShadow: "var(--shadow-md)", padding: 4, display: "flex", flexDirection: "column", gap: 1,
        }}>
          <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "6px 10px 4px" }}>Your campaigns</div>
          {campaigns.map(c => {
            const g = gameOf(c);
            const on = c.id === current.id;
            return (
              <button key={c.id} onClick={() => { select(c.id); setOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                border: "none", background: on ? "var(--surface-2)" : "transparent",
                borderRadius: 8, cursor: "pointer", textAlign: "left", width: "100%",
              }}>
                <div style={{ width: 20, height: 20, borderRadius: 5, background: `oklch(0.55 0.14 ${g.hue})`, display: "grid", placeItems: "center", fontSize: 8.5, fontWeight: 700, color: "white", flexShrink: 0, letterSpacing: "-0.02em" }}>{g.abbr}</div>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 12.5, fontWeight: on ? 600 : 500, color: "var(--ink)" }}>{c.name}</span>
                  <span style={{ display: "block", fontSize: 10.5, color: "var(--ink-3)" }}>{g.name} · {labelOf(CAMPAIGN_STATUSES, campaignStatus(c, today))}</span>
                </span>
                {on && <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--primary)" }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function DarkModeToggle({ darkMode, setDarkMode }) {
  return (
    <button onClick={() => setDarkMode(!darkMode)} className="sidebar-darkmode" style={{
      display: "flex", alignItems: "center", gap: 10, width: "100%",
      padding: "9px 10px", background: "var(--surface-2)",
      border: "1px solid var(--line)", borderRadius: 10, cursor: "pointer",
    }}>
      <span style={{ fontSize: 14 }}>{darkMode ? "☀" : "◑"}</span>
      <span className="sidebar-darkmode-text" style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--ink-2)", textAlign: "left" }}>
        {darkMode ? "Light mode" : "Dark mode"}
      </span>
      <span className="sidebar-darkmode-text" style={{
        width: 34, height: 18, borderRadius: 999, background: darkMode ? "var(--primary)" : "var(--line)",
        position: "relative", display: "inline-block", transition: "background .2s",
      }}>
        <span style={{
          position: "absolute", top: 2, left: darkMode ? 16 : 2, width: 14, height: 14,
          borderRadius: 999, background: "white", transition: "left .2s",
          boxShadow: "0 1px 3px oklch(0 0 0 / 0.2)",
        }} />
      </span>
    </button>
  );
}

export function SectionLabel({ children, collapsible, collapsed, onToggle }) {
  return (
    <div className="sidebar-section-label" onClick={collapsible ? onToggle : undefined} style={{
      fontSize: 10.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.1em",
      padding: "8px 10px 4px", display: "flex", alignItems: "center", justifyContent: "space-between",
      cursor: collapsible ? "pointer" : "default", userSelect: "none",
    }}>
      <span>{children}</span>
      {collapsible && (
        <span style={{
          fontSize: 10, transition: "transform .2s ease",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)",
          display: "inline-block", lineHeight: 1,
        }}>⌄</span>
      )}
    </div>
  );
}

export function NavItem({ item, active, onClick }) {
  return (
    <button onClick={onClick} className="sidebar-nav-item" style={{
      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
      background: active ? "var(--surface-2)" : "transparent",
      border: "none", borderRadius: 9, textAlign: "left",
      color: active ? "var(--ink)" : "var(--ink-2)",
      fontWeight: active ? 600 : 500, fontSize: 13.5,
      position: "relative",
    }}>
      <span style={{ width: 16, textAlign: "center", color: active ? "var(--primary)" : "var(--ink-3)", fontSize: 13, flexShrink: 0 }}>{item.icon}</span>
      <span className="item-label" style={{ flex: 1 }}>{item.label}</span>
      {item.count != null && (
        <span className="item-count" style={{ fontSize: 10.5, color: "var(--ink-3)", background: "var(--surface)", border: "1px solid var(--line)", padding: "1px 6px", borderRadius: 999 }}>{item.count}</span>
      )}
      {active && <span style={{ position: "absolute", left: -14, top: 8, bottom: 8, width: 3, background: "var(--primary)", borderRadius: 999 }} />}
    </button>
  );
}

export function FeedStatus() {
  const ctx = useClient();
  const h = ctx && ctx.health;
  const live = h && h.connected;
  return (
    <div style={{ background: "var(--surface-2)", border: "1px solid var(--line)", borderRadius: 12, padding: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
        {live ? <span className="live-dot" /> : <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--ink-3)" }} />}
        <span style={{ fontWeight: 600 }}>{live ? "Game feed live" : "Waiting for game data"}</span>
      </div>
      <div style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, lineHeight: 1.4 }}>
        {h ? <>Last event {timeAgo(h.last_event_at)} · {fmtNum(h.events_today)} events today</> : "Connecting…"}
      </div>
      <div style={{ display: "flex", gap: 4, marginTop: 8 }} aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 18 - (i % 5) * 2 - 4, background: live ? (i > 19 ? "var(--good)" : "oklch(0.85 0.06 155)") : "var(--line)",
            borderRadius: 2,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ───────── Header ───────── */
export function Header({ rangeIdx, setRangeIdx, compare, setCompare, onMenu }) {
  const ranges = ["24h", "7d", "30d", "90d", "QTD", "YTD"];
  return (
    <header className="app-header">
      <button className="menu-toggle" onClick={onMenu} aria-label="Open menu">☰</button>
      <div className="title-block">

        <h1 style={{ margin: "2px 0 0", fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em" }}>
          <span className="serif" style={{ fontStyle: "italic", fontWeight: 600, color: "var(--ink)", fontFamily: "Lato", textAlign: "center", letterSpacing: "0px" }}>{CAMPAIGN.brand}</span>
          <span style={{ color: "var(--ink-3)", margin: "0 8px", fontWeight: 400 }}>×</span>
          {CAMPAIGN.game}
        </h1>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>{CAMPAIGN.name} · {fmtDate(CAMPAIGN.startedAt)} – {fmtDate(CAMPAIGN.endsAt)} · reporting {fmtDate(CAMPAIGN.windowFrom)} – {fmtDate(CAMPAIGN.windowTo)}</div>
      </div>
      <div className="header-spacer" />
      <SearchInput />

    </header>
  );
}

export function ProfileDropdown({ onClose }) {
  const ctx = useClient();
  const name = ctx ? ctx.session.name : "";
  const email = ctx ? ctx.session.email : "";
  return (
    <div onClick={e => e.stopPropagation()} style={{
      position: "absolute", top: "calc(100% + 10px)", right: 0,
      background: "var(--surface)", border: "1px solid var(--line)",
      borderRadius: 16, boxShadow: "var(--shadow-md)", width: 260, zIndex: 20,
      overflow: "hidden",
    }}>
      {/* Profile header */}
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ ...avatarStyle, width: 40, height: 40, fontSize: 15, flexShrink: 0 }}>{initials(name)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", overflow: "hidden", textOverflow: "ellipsis" }}>{email}</div>
        </div>
      </div>
      {/* Menu items */}
      <div style={{ padding: 6 }}>
        {[
          { icon: "◇", label: `${ctx ? ctx.campaigns.length : 0} campaign${ctx && ctx.campaigns.length === 1 ? "" : "s"} with Kunta Content` },
        ].map(item => (
          <button key={item.label} onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            padding: "8px 10px", background: "transparent", border: "none",
            borderRadius: 8, fontSize: 13.5, color: "var(--ink)", textAlign: "left", cursor: "pointer",
          }}>
            <span style={{ color: "var(--ink-3)", width: 16, textAlign: "center" }}>{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.count && <span style={{ fontSize: 11, color: "var(--ink-3)", background: "var(--surface-2)", border: "1px solid var(--line)", padding: "1px 6px", borderRadius: 999 }} className="mono">{item.count}</span>}
          </button>
        ))}
      </div>
      <div style={{ borderTop: "1px solid var(--line-2)", padding: 6 }}>
        <button onClick={() => { onClose(); ctx && ctx.signOut(); }} style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "8px 10px", background: "transparent", border: "none",
          borderRadius: 8, fontSize: 13.5, color: "var(--bad)", textAlign: "left", cursor: "pointer",
        }}>
          <span style={{ width: 16, textAlign: "center" }}>↪</span>
          Log out
        </button>
      </div>
    </div>
  );
}

export const primaryBtn = {
  background: "var(--ink)", color: "var(--surface)", border: "none",
  padding: "8px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500,
};
export const avatarStyle = {
  width: 34, height: 34, borderRadius: "50%",
  background: "linear-gradient(135deg, oklch(0.7 0.12 45), oklch(0.55 0.16 25))",
  display: "grid", placeItems: "center", color: "white", fontSize: 12, fontWeight: 600,
  boxShadow: "inset 0 0 0 2px var(--surface), 0 0 0 1px var(--line)",
};

export function SearchInput() {
  return (
    <div className="search-input" style={{
      display: "flex", alignItems: "center", gap: 8, background: "var(--surface)",
      border: "1px solid var(--line)", borderRadius: 10, padding: "6px 10px",
    }}>
      <span style={{ color: "var(--ink-3)" }}>⌕</span>
      <input placeholder="Search campaigns, placements…" style={{
        flex: 1, border: "none", outline: "none", background: "transparent",
        fontSize: 13, fontFamily: "inherit", color: "var(--ink)", minWidth: 0,
      }} />
      <span style={{ fontSize: 10.5, color: "var(--ink-3)", border: "1px solid var(--line)", borderRadius: 5, padding: "1px 5px" }} className="mono">⌘K</span>
    </div>
  );
}

/* ───────── Filter Bar ───────── */
export function FilterBar({ filters, setFilters }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, padding: "16px 28px 4px", alignItems: "center" }}>
      <PlatformToggle value={filters.platform} onChange={(v) => setFilters({ ...filters, platform: v })} />
      <span style={{ width: 1, height: 18, background: "var(--line)", margin: "0 4px" }} />
      <PillMulti label="Date" options={DATE_RANGES} value={filters.dateRange || []} onChange={(v) => setFilters({ ...filters, dateRange: v })} />
      <PillMulti label="Placement" options={PLACEMENTS} value={filters.placements} onChange={(v) => setFilters({ ...filters, placements: v })} />
      <PillMulti label="Region" options={REGIONS} value={filters.regions} onChange={(v) => setFilters({ ...filters, regions: v })} />
      <PillMulti label="Cohort" options={COHORTS} value={filters.cohorts} onChange={(v) => setFilters({ ...filters, cohorts: v })} />

    </div>
  );
}

export function PlatformToggle({ value, onChange }) {
  const opts = [
    { id: "all",    label: "All platforms" },
    { id: "mobile", label: "Mobile" },
    { id: "webgl",  label: "WebGL" },
  ];
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", background: "var(--surface)",
      border: "1px solid var(--line)", borderRadius: 999, padding: 3,
    }}>
      {opts.map(o => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          border: "none",
          background: value === o.id ? "var(--ink)" : "transparent",
          color: value === o.id ? "var(--surface)" : "var(--ink-2)",
          padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: 500,
        }}>{o.label}</button>
      ))}
    </div>
  );
}

export function PillSelect({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const sel = options.find(o => o.id === value) || options[0];
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={pillStyle(open)}>
        <span style={{ color: "var(--ink-3)", fontSize: 11.5, fontWeight: 500 }} className="mono">{label}</span>
        <span style={{ color: "var(--line)" }}>·</span>
        <span style={{ fontWeight: 600 }}>{sel.label}</span>
        <span style={{ color: "var(--ink-3)", marginLeft: 2 }}>⌄</span>
      </button>
      {open && (
        <div style={dropdownStyle} onMouseLeave={() => setOpen(false)}>
          {options.map(o => (
            <button key={o.id} onClick={() => { onChange(o.id); setOpen(false); }} style={dropdownItem(o.id === value)}>
              {o.color && <span style={{ width: 10, height: 10, borderRadius: 3, background: o.color }} />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function PillMulti({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const all = value.length === 0 || value.length === options.length;
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(!open)} style={pillStyle(open)}>
        <span style={{ color: "var(--ink-3)", fontSize: 11.5, fontWeight: 500 }} className="mono">{label}</span>
        <span style={{ color: "var(--line)" }}>·</span>
        <span style={{ fontWeight: 600 }}>{all ? "All" : `${value.length} selected`}</span>
        <span style={{ color: "var(--ink-3)", marginLeft: 2 }}>⌄</span>
      </button>
      {open && (
        <div style={dropdownStyle} onMouseLeave={() => setOpen(false)}>
          {options.map(o => {
            const checked = all || value.includes(o.id);
            return (
              <button key={o.id} onClick={() => {
                const next = all ? [o.id] : (checked ? value.filter(v => v !== o.id) : [...value, o.id]);
                onChange(next.length === options.length ? [] : next);
              }} style={dropdownItem(false)}>
                <span style={{
                  width: 14, height: 14, borderRadius: 4,
                  border: `1.5px solid ${checked ? "var(--primary)" : "var(--line)"}`,
                  background: checked ? "var(--primary)" : "transparent",
                  display: "grid", placeItems: "center",
                  color: "white", fontSize: 9, fontWeight: 700,
                }}>{checked ? "✓" : ""}</span>
                {o.icon && <span style={{ color: "var(--ink-3)" }}>{o.icon}</span>}
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function pillStyle(open) {
  return {
    display: "inline-flex", alignItems: "center", gap: 6,
    background: open ? "var(--surface-2)" : "var(--surface)",
    border: "1px solid var(--line)",
    padding: "6px 12px", borderRadius: 999, fontSize: 12.5,
    color: "var(--ink)",
  };
}
export const dropdownStyle = {
  position: "absolute", top: "calc(100% + 6px)", left: 0,
  background: "var(--surface)", border: "1px solid var(--line)",
  borderRadius: 12, boxShadow: "var(--shadow-md)", padding: 4,
  minWidth: 200, zIndex: 10,
};
export function dropdownItem(active) {
  return {
    display: "flex", alignItems: "center", gap: 8, width: "100%",
    background: active ? "var(--surface-2)" : "transparent", border: "none",
    padding: "7px 10px", borderRadius: 8, fontSize: 13, textAlign: "left",
    color: "var(--ink)",
  };
}

/* ───────── KPI Strip ───────── */
export function KpiStrip({ compare }) {
  return (
    <div className="kpi-strip">
      {KPIS.map(k => <KpiCard key={k.id} k={k} compare={compare} />)}
    </div>
  );
}

export function KpiCard({ k, compare }) {
  const hasDelta = k.delta != null && Number.isFinite(k.delta);
  const positive = !hasDelta || (k.deltaInverted ? k.delta < 0 : k.delta >= 0);
  const deltaColor = positive ? "var(--good)" : "var(--bad)";
  const deltaBg = positive ? "var(--good-soft)" : "oklch(0.95 0.04 25)";
  return (
    <div className="card" style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500 }}>{k.label}</div>
        {hasDelta ? (
        <span style={{
          fontSize: 11, color: deltaColor, background: deltaBg, padding: "2px 7px",
          borderRadius: 999, fontWeight: 600,
        }} className="mono tnum">
          {positive ? "↑" : "↓"} {Math.abs(k.delta).toFixed(1)}%
        </span>
        ) : <span style={{ fontSize: 11, color: "var(--ink-3)" }} className="mono">new</span>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <div style={{ fontSize: 36, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1 }} className="tnum">
          {k.value}
        </div>
        <div style={{ fontSize: 14, color: "var(--ink-3)" }}>{k.unit}</div>
      </div>
      <div style={{ marginTop: -4 }}>
        <div style={{ width: "100%" }}>
          <Sparkline values={k.spark} color={positive ? "var(--primary)" : "var(--bad)"} height={32} width={240} stretch />
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)", display: "flex", justifyContent: "space-between" }}>
        <span>{k.sub}</span>
        {compare && hasDelta && <span className="mono tnum">vs prev</span>}
      </div>
    </div>
  );
}
