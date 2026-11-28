/* Mela Scale admin portal (Kunta Content team): shell, routing and sign-in. */
import React, { useEffect, useState } from "react";
import { api, isDemo } from "../shared/api/index.js";
import { OverviewPage } from "./overview.jsx";
import { GamesPage, GameDetail } from "./games.jsx";
import { CampaignsPage, CampaignDetail } from "./campaigns.jsx";
import { ClientsPage, ClientDetail } from "./clients.jsx";
import { EventsPage } from "./events.jsx";
import { SettingsPage } from "./settings.jsx";
import { Button } from "./ui.jsx";

/* ── hash routing: #/games/g_lima/connect ── */
export function useRoute() {
  const parse = () => (window.location.hash.replace(/^#\/?/, "") || "overview").split("/").filter(Boolean);
  const [parts, setParts] = useState(parse);
  useEffect(() => {
    const on = () => { setParts(parse()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parts;
}
export const go = (path) => { window.location.hash = "#/" + path; };

const NAV = [
  { id: "overview", label: "Overview", icon: "◐" },
  { id: "games", label: "Games", icon: "▣" },
  { id: "campaigns", label: "Campaigns", icon: "◆" },
  { id: "clients", label: "Clients", icon: "◇" },
  { id: "events", label: "Event stream", icon: "↯" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export function AdminRoot() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => api.getSession("staff").then(s => alive && setSession(s)).catch(() => alive && setSession(null));
    load();
    const off = api.subscribe(load);
    return () => { alive = false; off(); };
  }, []);
  useEffect(() => {
    // Demo mode: the admin portal opens straight in as the Kunta Content team.
    if (isDemo && session !== undefined && (!session || session.kind !== "staff")) api.signInAsStaff();
  }, [session]);

  if (session === undefined || (isDemo && (!session || session.kind !== "staff"))) return <div className="adm-empty" style={{ minHeight: "100vh" }}>Loading…</div>;
  if (!session || session.kind !== "staff") return <StaffSignIn session={session} />;
  return <Shell session={session} />;
}

function Shell({ session }) {
  const parts = useRoute();
  const [navOpen, setNavOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    try { return window.matchMedia("(prefers-color-scheme: dark)").matches; } catch (e) { return false; }
  });
  useEffect(() => { document.documentElement.setAttribute("data-theme", darkMode ? "dark" : "light"); }, [darkMode]);
  const [section, id, sub] = parts;

  let page;
  switch (section) {
    case "games": page = id ? <GameDetail id={id} tab={sub} /> : <GamesPage />; break;
    case "campaigns": page = id && id !== "new" ? <CampaignDetail id={id} /> : <CampaignsPage newFor={id === "new" ? (sub || "") : null} />; break;
    case "clients": page = id ? <ClientDetail id={id} /> : <ClientsPage />; break;
    case "events": page = <EventsPage />; break;
    case "settings": page = <SettingsPage session={session} />; break;
    default: page = <OverviewPage />;
  }

  return (
    <div className="app">
      <aside className={`app-sidebar${navOpen ? " is-open" : ""}`} style={{ background: "var(--surface)", borderRight: "1px solid var(--line)", padding: "20px 14px", position: "sticky", top: 0, height: "100vh", overflow: "auto", display: "flex", flexDirection: "column" }}>
        <Brand />
        <nav aria-label="Admin" style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 1 }}>
          <div className="sidebar-section-label mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "0 10px 6px" }}>Manage</div>
          {NAV.map(n => {
            const on = (section || "overview") === n.id;
            return (
              <a key={n.id} href={`#/${n.id}`} onClick={() => setNavOpen(false)} className="sidebar-nav-item" aria-current={on ? "page" : undefined} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, position: "relative",
                textDecoration: "none", color: on ? "var(--ink)" : "var(--ink-2)", fontWeight: on ? 600 : 500, fontSize: 13.5,
                background: on ? "var(--surface-2)" : "transparent",
              }}>
                {on && <span style={{ position: "absolute", left: -14, top: 8, bottom: 8, width: 3, borderRadius: 2, background: "var(--primary)" }} />}
                <span style={{ width: 16, textAlign: "center", color: on ? "var(--primary)" : "var(--ink-3)" }} aria-hidden="true">{n.icon}</span>
                <span className="item-label">{n.label}</span>
              </a>
            );
          })}
        </nav>
        <div style={{ flex: 1 }} />
        <button type="button" className="sidebar-darkmode" onClick={() => setDarkMode(v => !v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 12.5, marginTop: 14 }}>
          <span aria-hidden="true">{darkMode ? "☀" : "◑"}</span>
          <span className="sidebar-darkmode-text">{darkMode ? "Light mode" : "Dark mode"}</span>
        </button>
        <div className="sidebar-feedstatus" style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface-2)", fontSize: 11.5, color: "var(--ink-3)" }}>
          <div style={{ fontWeight: 600, color: "var(--ink)", fontSize: 12 }}>{session.name}</div>
          <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{session.email}</div>
          <div style={{ marginTop: 6 }}>{isDemo ? "Demo workspace · data stays in this browser" : "Connected to Supabase"}</div>
          {!isDemo && <button type="button" onClick={() => api.signOut("staff")} style={{ marginTop: 8, border: "none", background: "none", padding: 0, color: "var(--bad)", fontSize: 12 }}>Sign out</button>}
        </div>
      </aside>
      {navOpen && <div className="sidebar-scrim" onClick={() => setNavOpen(false)} />}
      <main>
        <header className="app-header" style={{ paddingTop: 14, paddingBottom: 14 }}>
          <button className="menu-toggle" onClick={() => setNavOpen(v => !v)} aria-label="Open menu">☰</button>
          <div className="title-block" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "Lato, var(--font-sans)", fontStyle: "italic", fontWeight: 600, fontSize: 18 }}>Kunta Content</span>
            <span style={{ color: "var(--ink-3)" }}>·</span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>Admin</span>
          </div>
          <div className="header-spacer" />
          {isDemo && <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", border: "1px dashed var(--line)", padding: "4px 8px", borderRadius: 999 }}>DEMO MODE</span>}
          <a className="adm-btn adm-btn-ghost" href="../client/" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>Client portal ↗</a>
        </header>
        {page}
      </main>
    </div>
  );
}

function Brand() {
  return (
    <a href="#/overview" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px 4px", textDecoration: "none", color: "inherit" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, var(--primary), oklch(0.58 0.18 320))", position: "relative", flexShrink: 0 }}>
        <div style={{ position: "absolute", left: 9, top: 13, right: 9, height: 2, background: "white", borderRadius: 2 }} />
      </div>
      <div className="sidebar-brand-text">
        <div style={{ fontWeight: 600, letterSpacing: "-0.02em", fontSize: 15 }}>Mela Scale</div>
        <div style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase" }} className="mono">Admin · Kunta Content</div>
      </div>
    </a>
  );
}

function StaffSignIn({ session }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 16px" }}>
      <form onSubmit={async e => { e.preventDefault(); setErr(null); try { await api.signInWithEmail(email); setSent(true); } catch (x) { setErr(x.message); } }}
        className="card" style={{ width: "100%", maxWidth: 420, padding: 28, display: "flex", flexDirection: "column", gap: 14 }}>
        <Brand />
        <h1 className="adm-h1" style={{ fontSize: 20 }}>Kunta Content team sign-in</h1>
        {session && session.kind !== "staff" && <div className="adm-notice adm-tone-warn">{session.email} isn't on the Kunta Content team list. Ask an admin to add you in Settings.</div>}
        {sent ? <div>Check <b>{email}</b> for a sign-in link.</div> : (
          <>
            <label htmlFor="staff-email" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Work email</label>
            <input id="staff-email" className="adm-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@kuntacontent.com" />
            {err && <div className="adm-error">{err}</div>}
            <Button type="submit">Email me a sign-in link</Button>
          </>
        )}
      </form>
    </div>
  );
}
