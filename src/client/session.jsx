/* Client portal shell: who is signed in, which campaign they're viewing,
   and loading that campaign's analytics into the dashboard. */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, isDemo } from "../shared/api/index.js";
import { buildCampaignView, campaignWindow } from "../shared/metrics.js";
import { isoDay, fmtDate, initials } from "../shared/format.js";
import { campaignStatus, labelOf, CAMPAIGN_STATUSES } from "../shared/schema.js";
import { applyCampaignView } from "./data.jsx";
import { App } from "./app.jsx";
import { ClientCtx } from "./context.js";


const LAST_CAMPAIGN_KEY = "mela-scale.client.campaign";
const REFRESH_MS = 10_000;

export function ClientRoot() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    let alive = true;
    const load = () => api.getSession("client").then(s => { if (alive) setSession(s); }).catch(() => alive && setSession(null));
    load();
    const off = api.subscribe(load);
    return () => { alive = false; off(); };
  }, []);

  if (session === undefined) return <Splash text="Loading…" />;
  if (!session || session.kind !== "client") return <SignIn session={session} />;
  return <ClientWorkspace session={session} />;
}

function ClientWorkspace({ session }) {
  const [campaigns, setCampaigns] = useState(null);
  const [games, setGames] = useState([]);
  const [client, setClient] = useState(null);
  const [currentId, setCurrentId] = useState(() => { try { return localStorage.getItem(LAST_CAMPAIGN_KEY); } catch (e) { return null; } });
  const [version, setVersion] = useState(0);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);
  const today = isoDay();

  useEffect(() => {
    let alive = true;
    Promise.all([api.listCampaigns({ clientId: session.client_id }), api.listGames(), api.listClients()])
      .then(([cs, gs, cl]) => {
        if (!alive) return;
        const visible = cs.filter(c => c.status !== "draft");
        setCampaigns(visible);
        setGames(gs);
        setClient(cl.find(c => c.id === session.client_id) || { id: session.client_id, name: session.name });
      })
      .catch(e => alive && setError(e.message));
    return () => { alive = false; };
  }, [session.client_id]);

  const current = useMemo(() => {
    if (!campaigns || !campaigns.length) return null;
    return campaigns.find(c => c.id === currentId) ||
      campaigns.find(c => campaignStatus(c, today) === "live") || campaigns[0];
  }, [campaigns, currentId, today]);

  const loadView = useCallback(async () => {
    if (!current || !client) return;
    const game = games.find(g => g.id === current.game_id);
    if (!game) return;
    const win = campaignWindow(current, today);
    const [placements, rows, prevRows, reach, prevReach, events, hl] = await Promise.all([
      api.listPlacements(game.id),
      api.getRollups({ gameId: game.id, from: win.from, to: win.to }),
      api.getRollups({ gameId: game.id, from: win.prevFrom, to: win.prevTo }),
      api.getReach({ gameId: game.id, placementIds: current.placement_ids, from: win.curFrom, to: win.to }),
      win.hasPrev ? api.getReach({ gameId: game.id, placementIds: current.placement_ids, from: win.prevClipFrom, to: win.prevTo }) : Promise.resolve(null),
      api.listEvents({ gameId: game.id, limit: 60 }),
      api.ingestHealth().catch(() => []),
    ]);
    const view = buildCampaignView({ campaign: current, client, game, placements: placements.filter(p => current.placement_ids.includes(p.id)), rows, prevRows, reach, prevReach, events, today });
    applyCampaignView(view);
    setHealth(hl.find(h => h.game_id === game.id) || null);
    setVersion(v => v + 1);
  }, [current, client, games, today]);

  useEffect(() => {
    if (!current) return;
    let alive = true;
    const run = () => loadView().catch(e => alive && setError(e.message));
    run();
    const t = setInterval(run, REFRESH_MS);
    const off = api.subscribe(run);
    return () => { alive = false; clearInterval(t); off(); };
  }, [loadView, current]);

  const select = (id) => {
    setCurrentId(id);
    try { localStorage.setItem(LAST_CAMPAIGN_KEY, id); } catch (e) {}
  };

  if (error) return <Splash text={`Couldn't load your campaigns: ${error}`} />;
  if (!campaigns) return <Splash text="Loading your campaigns…" />;
  if (!current) return <NoCampaigns session={session} />;
  if (version === 0) return <Splash text="Loading campaign analytics…" />;

  const ctx = {
    session, client, campaigns, games, current, select, health, today,
    signOut: () => api.signOut("client"),
    userInitials: initials(session.name),
  };
  return (
    <ClientCtx.Provider value={ctx}>
      <App dataVersion={version} key={current.id} />
    </ClientCtx.Provider>
  );
}

/* ── screens ── */
function Splash({ text }) {
  return <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", color: "var(--ink-3)", padding: 24, textAlign: "center" }}>{text}</div>;
}

function BrandMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, var(--primary), oklch(0.58 0.18 320))", position: "relative" }}>
        <div style={{ position: "absolute", left: 10, top: 15, right: 10, height: 2, background: "white", borderRadius: 2 }} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: "-0.02em" }}>Mela Scale</div>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Campaign Intelligence</div>
      </div>
    </div>
  );
}

const cardWrap = { minHeight: "100vh", display: "grid", placeItems: "center", padding: "32px 16px" };
const panel = { width: "100%", maxWidth: 440, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-md)", padding: 28, display: "flex", flexDirection: "column", gap: 18 };
const btn = { padding: "10px 14px", borderRadius: 10, border: "1px solid var(--ink)", background: "var(--ink)", color: "var(--surface)", fontWeight: 600, fontSize: 13.5 };
const ghostBtn = { padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 13.5, textAlign: "left", display: "flex", alignItems: "center", gap: 10, width: "100%" };

function SignIn({ session }) {
  const [clients, setClients] = useState([]);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState(null);
  useEffect(() => { if (isDemo) api.listClients().then(setClients); }, []);

  return (
    <div style={cardWrap}>
      <div style={panel}>
        <BrandMark />
        <div>
          <h1 style={{ fontSize: 22, margin: "4px 0 4px", letterSpacing: "-0.02em" }}>Sign in to your campaign analytics</h1>
          <div style={{ color: "var(--ink-3)", fontSize: 13 }}>In-game brand performance from Kunta Content's games.</div>
        </div>
        {session && session.kind !== "client" && (
          <div style={{ fontSize: 12.5, background: "var(--accent-soft)", padding: "8px 10px", borderRadius: 8 }}>
            {session.email} doesn't have client access. Ask your Kunta Content contact to add you.
          </div>
        )}
        {isDemo ? (
          <>
            <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Demo · choose a client account</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {clients.map(c => (
                <button key={c.id} type="button" style={ghostBtn} onClick={() => api.signInAsClient(c.id)}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: `oklch(0.55 0.13 ${c.hue})`, color: "white", display: "grid", placeItems: "center", fontSize: 10, fontWeight: 700 }}>{initials(c.name)}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontWeight: 600 }}>{c.name}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)" }}>{c.industry}</span>
                  </span>
                  <span style={{ color: "var(--ink-3)" }}>→</span>
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Demo mode stores data in this browser only. Connect Supabase for real client logins.</div>
          </>
        ) : sent ? (
          <div style={{ fontSize: 13.5 }}>Check <b>{email}</b> for a sign-in link.</div>
        ) : (
          <form onSubmit={async e => { e.preventDefault(); setErr(null); try { await api.signInWithEmail(email); setSent(true); } catch (x) { setErr(x.message); } }} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label htmlFor="client-email" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>Work email</label>
            <input id="client-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@brand.com"
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 14 }} />
            {err && <div style={{ color: "var(--bad)", fontSize: 12.5 }}>{err}</div>}
            <button type="submit" style={btn}>Email me a sign-in link</button>
          </form>
        )}
      </div>
    </div>
  );
}

function NoCampaigns({ session }) {
  return (
    <div style={cardWrap}>
      <div style={panel}>
        <BrandMark />
        <h1 style={{ fontSize: 20, margin: 0 }}>No campaigns yet</h1>
        <div style={{ color: "var(--ink-2)", fontSize: 13.5 }}>
          {session.name} doesn't have a campaign running in a Kunta Content game yet. Your analytics appear here as soon as one is set up.
        </div>
        <button type="button" style={{ ...ghostBtn, justifyContent: "center" }} onClick={() => api.signOut("client")}>Sign out</button>
      </div>
    </div>
  );
}

export function campaignLabel(c, games) {
  const g = games.find(x => x.id === c.game_id);
  return { title: c.name, sub: `${g ? g.name : "Game"} · ${fmtDate(c.start_date)} – ${fmtDate(c.end_date)}` };
}
export function statusLabel(c, today) {
  return labelOf(CAMPAIGN_STATUSES, campaignStatus(c, today));
}
