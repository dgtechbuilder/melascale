/* Games: the portfolio list, each game's analytics, placements and SDK connection. */
import React, { useMemo, useState } from "react";
import { api } from "../shared/api/index.js";
import { addDays, fmtDate, fmtMoney, fmtNum, isoDay, slugify, timeAgo } from "../shared/format.js";
import { EVENT_TYPES, GAME_STATUSES, PLACEMENT_KINDS, PLATFORMS, REGIONS, labelOf, campaignStatus } from "../shared/schema.js";
import { buildGameSummary, placementTotals } from "../shared/metrics.js";
import { EngagementChart } from "../shared/charts.jsx";
import { Badge, Button, Card, Code, Empty, ErrorText, Field, GameChip, Input, Modal, Notice, Page, Select, Stat, Table, Tabs, useLoad } from "./ui.jsx";
import { CampaignStatus, Connection, EventLine, GameStatus, SimulatorToggle } from "./common.jsx";
import { go } from "./app.jsx";
import { snippets } from "./snippets.js";

const DAYS = 30;
const HUES = [145, 210, 270, 30, 350, 55, 190, 320];

/* ── list ── */
export function GamesPage() {
  const [adding, setAdding] = useState(false);
  const { data, error } = useLoad(async () => {
    const [games, health, placements, campaigns] = await Promise.all([api.listGames(), api.ingestHealth(), api.listPlacements(), api.listCampaigns()]);
    return { games, health, placements, campaigns };
  }, [], { subscribe: api.subscribe, interval: 10000 });
  const today = isoDay();

  return (
    <Page title="Games" sub="Kunta Content's portfolio. Each game sends its analytics to Mela Scale with its own API key."
      actions={<Button onClick={() => setAdding(true)}>+ Add game</Button>}>
      {error && <ErrorText error={error} />}
      {data && (
        <div className="adm-grid adm-grid-3">
          {data.games.map(g => {
            const h = data.health.find(x => x.game_id === g.id);
            return (
              <button key={g.id} type="button" className="card adm-game-card" onClick={() => go(`games/${g.id}`)}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <GameChip game={g} size={34} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5 }}>{g.name}</div>
                    <div className="adm-muted adm-small">{g.genre} · {g.platforms.map(p => labelOf(PLATFORMS, p)).join(", ")}</div>
                  </div>
                  <GameStatus status={g.status} />
                </div>
                <Connection health={h} />
                <div className="adm-kv">
                  <div><span>Placements</span><span>{data.placements.filter(p => p.game_id === g.id).length}</span></div>
                  <div><span>Live campaigns</span><span>{data.campaigns.filter(c => c.game_id === g.id && campaignStatus(c, today) === "live").length}</span></div>
                  <div><span>Events today</span><span>{fmtNum(h ? h.events_today : 0)}</span></div>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {adding && <GameModal onClose={() => setAdding(false)} onSaved={g => { setAdding(false); go(`games/${g.id}/connect`); }} />}
    </Page>
  );
}

/* ── add / edit ── */
export function GameModal({ game, onClose, onSaved }) {
  const [f, setF] = useState(() => game ? { ...game } : { name: "", slug: "", studio: "Kunta Content", genre: "", platforms: ["mobile"], status: "development", mau: 0, description: "" });
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const togglePlat = p => set("platforms", f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p]);
  const save = async () => {
    setErr(null);
    if (!f.name.trim()) return setErr("Give the game a name.");
    if (!f.platforms.length) return setErr("Pick at least one platform.");
    setBusy(true);
    try {
      const words = f.name.replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
      const row = { ...f, name: f.name.trim(), slug: f.slug || slugify(f.name), mau: Number(f.mau) || 0,
        abbr: f.abbr || ((words[0] || "")[0] + ((words[1] || words[0] || "")[words[1] ? 0 : 1] || "")).toUpperCase(),
        hue: f.hue ?? HUES[Math.floor(Math.random() * HUES.length)] };
      const saved = await api.saveGame(row);
      onSaved(saved);
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  return (
    <Modal title={game ? `Edit ${game.name}` : "Add a game"} onClose={onClose}
      footer={<><Button kind="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>{game ? "Save changes" : "Add game"}</Button></>}>
      <Field label="Game name" id="g-name"><Input id="g-name" value={f.name} onChange={e => set("name", e.target.value)} placeholder="e.g. MAZU Runner" /></Field>
      <div className="adm-row">
        <Field label="Genre" id="g-genre"><Input id="g-genre" value={f.genre} onChange={e => set("genre", e.target.value)} placeholder="Farming sim" /></Field>
        <Field label="Studio" id="g-studio"><Input id="g-studio" value={f.studio} onChange={e => set("studio", e.target.value)} /></Field>
      </div>
      <div className="adm-row">
        <Field label="Status" id="g-status"><Select id="g-status" value={f.status} onChange={e => set("status", e.target.value)} options={GAME_STATUSES.map(s => ({ value: s.id, label: s.label }))} /></Field>
        <Field label="Monthly active players" id="g-mau" hint="Used to show reach as a share of the player base."><Input id="g-mau" type="number" min="0" value={f.mau} onChange={e => set("mau", e.target.value)} /></Field>
      </div>
      <Field label="Platforms" id="g-plat">
        <div className="adm-checks" id="g-plat">
          {PLATFORMS.map(p => (
            <label key={p.id} className="adm-check"><input type="checkbox" checked={f.platforms.includes(p.id)} onChange={() => togglePlat(p.id)} />{p.label}</label>
          ))}
        </div>
      </Field>
      <Field label="Description" id="g-desc"><Input id="g-desc" value={f.description || ""} onChange={e => set("description", e.target.value)} placeholder="One line about the game" /></Field>
      <ErrorText error={err} />
    </Modal>
  );
}

/* ── detail ── */
export function GameDetail({ id, tab = "analytics" }) {
  const [editing, setEditing] = useState(false);
  const { data, error } = useLoad(async () => {
    const [games, placements, campaigns, clients, health] = await Promise.all([api.listGames(), api.listPlacements(id), api.listCampaigns({ gameId: id }), api.listClients(), api.ingestHealth()]);
    return { game: games.find(g => g.id === id), placements, campaigns, clients, health: health.find(h => h.game_id === id) };
  }, [id], { subscribe: api.subscribe, interval: 8000 });

  if (error) return <Page title="Game" sub={error} />;
  if (!data) return <Page title="Game" sub="Loading…" />;
  if (!data.game) return <Page title="Game not found" sub={<a className="adm-link" href="#/games">Back to games</a>} />;
  const { game } = data;
  const tabs = [
    { id: "analytics", label: "Analytics" },
    { id: "placements", label: "Placements", count: data.placements.length },
    { id: "connect", label: "Connect analytics" },
    { id: "campaigns", label: "Campaigns", count: data.campaigns.length },
  ];
  return (
    <Page
      title={<span style={{ display: "inline-flex", alignItems: "center", gap: 12 }}><GameChip game={game} size={32} />{game.name}</span>}
      sub={<span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><a className="adm-back" href="#/games">← Games</a><GameStatus status={game.status} /><span>{game.genre} · {game.platforms.map(p => labelOf(PLATFORMS, p)).join(", ")}</span><Connection health={data.health} /></span>}
      actions={<Button kind="ghost" onClick={() => setEditing(true)}>Edit game</Button>}>
      <Tabs tabs={tabs} value={tab} onChange={t => go(`games/${id}/${t}`)} />
      {tab === "analytics" && <GameAnalytics game={game} placements={data.placements} />}
      {tab === "placements" && <PlacementsTab game={game} placements={data.placements} campaigns={data.campaigns} />}
      {tab === "connect" && <ConnectTab game={game} placements={data.placements} />}
      {tab === "campaigns" && <GameCampaigns game={game} campaigns={data.campaigns} clients={data.clients} />}
      {editing && <GameModal game={game} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />}
    </Page>
  );
}

function GameAnalytics({ game, placements }) {
  const today = isoDay();
  const from = addDays(today, -(DAYS - 1));
  const [metric, setMetric] = useState("sessions");
  const { data } = useLoad(async () => {
    const [rows, prev] = await Promise.all([
      api.getRollups({ gameId: game.id, from, to: today }),
      api.getRollups({ gameId: game.id, from: addDays(from, -DAYS), to: addDays(from, -1) }),
    ]);
    const prevSum = buildGameSummary(prev, [], addDays(from, -DAYS), DAYS);
    return { sum: buildGameSummary(rows, prev, from, DAYS), prevSeries: prevSum.series, byPl: placementTotals(rows) };
  }, [game.id], { subscribe: api.subscribe, interval: 10000 });

  if (!data) return <div className="adm-muted">Loading analytics…</div>;
  const { sum, byPl } = data;
  if (!sum.sessions && !sum.impressions) {
    return <Empty action={<a className="adm-btn adm-btn-primary" style={{ textDecoration: "none" }} href={`#/games/${game.id}/connect`}>Connect analytics</a>}>
      {game.name} hasn't sent any analytics yet. Create an API key and add the SDK to the game build.
    </Empty>;
  }
  const series = sum.series.map((s, i) => ({ i, label: s.label, dateLabel: fmtDate(s.day), current: s[metric], previous: data.prevSeries[i] ? data.prevSeries[i][metric] : 0 }));
  return (
    <>
      <div className="adm-grid adm-grid-4">
        <Stat label="Daily players" value={fmtNum(sum.players / DAYS)} delta={sum.playersDelta} sub={game.mau ? `${fmtNum(game.mau)} MAU` : "avg over 30 days"} />
        <Stat label="Sessions" value={fmtNum(sum.sessions)} delta={sum.sessionsDelta} sub={`${sum.avgSession.toFixed(1)} min average`} />
        <Stat label="Placement impressions" value={fmtNum(sum.impressions)} delta={sum.impressionsDelta} sub={`${placements.length} placements`} />
        <Stat label="Interactions" value={fmtNum(sum.interactions)} delta={sum.interactionsDelta} sub={`${sum.ctr.toFixed(2)}% of viewable impressions`} />
      </div>
      <Card title="Daily trend" sub="Last 30 days vs the 30 days before"
        actions={<Tabs value={metric} onChange={setMetric} tabs={[{ id: "sessions", label: "Sessions" }, { id: "players", label: "Players" }, { id: "impressions", label: "Impressions" }, { id: "interactions", label: "Interactions" }]} />}>
        <EngagementChart data={series} height={240} unit={metric} />
      </Card>
      <Card title="Placements" sub="30-day delivery by placement" pad={false}>
        <Table rows={placements} columns={[
          { key: "name", label: "Placement", render: p => <span><b style={{ fontWeight: 600 }}>{p.name}</b><div className="adm-muted adm-small mono">{p.key}</div></span> },
          { key: "kind", label: "Type", render: p => labelOf(PLACEMENT_KINDS, p.kind) },
          { key: "loc", label: "Location", render: p => p.location },
          { key: "imp", label: "Impressions", align: "right", render: p => <span className="mono tnum">{fmtNum(byPl[p.id]?.impressions || 0)}</span> },
          { key: "view", label: "Viewable", align: "right", render: p => <span className="mono tnum">{byPl[p.id]?.impressions ? Math.round(byPl[p.id].viewable / byPl[p.id].impressions * 100) + "%" : "—"}</span> },
          { key: "int", label: "Interactions", align: "right", render: p => <span className="mono tnum">{fmtNum(byPl[p.id]?.interactions || 0)}</span> },
        ]} />
      </Card>
    </>
  );
}

/* ── placements ── */
function PlacementsTab({ game, placements, campaigns }) {
  const [editing, setEditing] = useState(null);
  const [err, setErr] = useState(null);
  const usedBy = (id) => campaigns.filter(c => c.placement_ids.includes(id)).length;
  return (
    <Card title="Placements" sub="Every branded surface in the game. The key is what the game sends with each event." pad={false}
      actions={<Button onClick={() => setEditing({})}>+ Add placement</Button>}>
      <ErrorText error={err} />
      <Table rows={placements} empty="No placements yet. Add the branded surfaces in this game." columns={[
        { key: "name", label: "Placement", render: p => <b style={{ fontWeight: 600 }}>{p.name}</b> },
        { key: "key", label: "Key", render: p => <code className="mono adm-small">{p.key}</code> },
        { key: "kind", label: "Type", render: p => labelOf(PLACEMENT_KINDS, p.kind) },
        { key: "loc", label: "Location", render: p => p.location },
        { key: "plat", label: "Platform", render: p => p.platform === "all" ? "All" : labelOf(PLATFORMS, p.platform) },
        { key: "used", label: "Campaigns", align: "right", render: p => <span className="mono">{usedBy(p.id)}</span> },
        { key: "act", label: "", align: "right", render: p => (
          <span style={{ display: "inline-flex", gap: 6 }}>
            <Button kind="ghost" onClick={() => setEditing(p)}>Edit</Button>
            <Button kind="danger" aria-label={`Delete ${p.name}`} onClick={async () => { setErr(null); try { await api.deletePlacement(p.id); } catch (e) { setErr(e.message); } }}>Delete</Button>
          </span>) },
      ]} />
      {editing && <PlacementModal game={game} placement={editing.id ? editing : null} onClose={() => setEditing(null)} />}
    </Card>
  );
}

function PlacementModal({ game, placement, onClose }) {
  const [f, setF] = useState(() => placement ? { ...placement } : { name: "", key: "", kind: "billboard", location: "", platform: "all" });
  const [keyTouched, setKeyTouched] = useState(!!placement);
  const [err, setErr] = useState(null);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const save = async () => {
    setErr(null);
    if (!f.name.trim()) return setErr("Name the placement.");
    const key = slugify(f.key || f.name);
    if (!key) return setErr("The key needs letters or numbers.");
    try { await api.savePlacement({ ...f, key, name: f.name.trim(), game_id: game.id }); onClose(); }
    catch (e) { setErr(e.message); }
  };
  return (
    <Modal title={placement ? "Edit placement" : `Add a placement to ${game.name}`} onClose={onClose}
      footer={<><Button kind="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>{placement ? "Save" : "Add placement"}</Button></>}>
      <Field label="Name" id="p-name"><Input id="p-name" value={f.name} onChange={e => { set("name", e.target.value); if (!keyTouched) set("key", slugify(e.target.value)); }} placeholder="Market road billboard" /></Field>
      <Field label="Key" id="p-key" hint="Lowercase id the game sends with events. Changing it breaks builds that already use the old key.">
        <Input id="p-key" className="adm-input mono" value={f.key} onChange={e => { setKeyTouched(true); set("key", e.target.value); }} placeholder="coastal-market-billboard" />
      </Field>
      <div className="adm-row">
        <Field label="Type" id="p-kind"><Select id="p-kind" value={f.kind} onChange={e => set("kind", e.target.value)} options={PLACEMENT_KINDS.map(k => ({ value: k.id, label: k.label }))} /></Field>
        <Field label="Platform" id="p-plat"><Select id="p-plat" value={f.platform} onChange={e => set("platform", e.target.value)} options={[{ value: "all", label: "All platforms" }, ...game.platforms.map(p => ({ value: p, label: labelOf(PLATFORMS, p) }))]} /></Field>
      </div>
      <Field label="Location in game" id="p-loc"><Input id="p-loc" value={f.location} onChange={e => set("location", e.target.value)} placeholder="Map, level or screen" /></Field>
      <ErrorText error={err} />
    </Modal>
  );
}

/* ── connect: keys, snippets, test events ── */
function ConnectTab({ game, placements }) {
  const keys = useLoad(() => api.listApiKeys(game.id), [game.id], { subscribe: api.subscribe });
  const events = useLoad(() => api.listEvents({ gameId: game.id, limit: 20 }), [game.id], { interval: 2500 });
  const [newKey, setNewKey] = useState(null);
  const [label, setLabel] = useState("");
  const [lang, setLang] = useState("js");
  const [err, setErr] = useState(null);
  const endpoint = api.ingestUrl || "https://<project>.supabase.co/functions/v1/ingest";
  const sn = useMemo(() => snippets({ endpoint, key: newKey, placements, game }), [endpoint, newKey, placements, game]);
  const active = (keys.data || []).filter(k => !k.revoked_at);

  const create = async () => {
    setErr(null);
    try { const r = await api.createApiKey(game.id, label.trim() || `${game.name} build`); setNewKey(r.key); setLabel(""); }
    catch (e) { setErr(e.message); }
  };

  return (
    <>
      <div className="adm-grid adm-grid-2">
        <Card title="1 · API keys" sub="A game build sends events with one of these keys. Keys are stored hashed; you see each one once.">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {newKey && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Notice tone="warn">Copy this key now. It won't be shown again.</Notice>
                <div className="adm-key">{newKey}</div>
                <div><Button kind="ghost" onClick={() => navigator.clipboard && navigator.clipboard.writeText(newKey).catch(() => {})}>Copy key</Button></div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 180 }}><Field label="Key label" id="k-label"><Input id="k-label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Android release 3.4" /></Field></div>
              <Button onClick={create}>Create API key</Button>
            </div>
            <ErrorText error={err} />
            {(keys.data || []).length > 0 && (
              <Table rows={keys.data} columns={[
                { key: "label", label: "Label", render: k => <span><b style={{ fontWeight: 600 }}>{k.label}</b><div className="mono adm-small adm-muted">{k.prefix}…</div></span> },
                { key: "used", label: "Last used", render: k => <span className="adm-small">{k.revoked_at ? <Badge tone="bad">Revoked</Badge> : timeAgo(k.last_used_at)}</span> },
                { key: "act", label: "", align: "right", render: k => !k.revoked_at && <Button kind="danger" onClick={() => api.revokeApiKey(k.id)}>Revoke</Button> },
              ]} />
            )}
          </div>
        </Card>
        <Card title="2 · Send a test event" sub="Checks the key and placement keys end to end, through the same ingest path the game uses.">
          <TestEvent game={game} placements={placements} apiKey={newKey} hasKeys={active.length > 0} />
        </Card>
      </div>
      <Card title="3 · Add the SDK to the game" sub={`Events go to ${endpoint}`}
        actions={<Tabs value={lang} onChange={setLang} tabs={[{ id: "js", label: "WebGL / JS" }, { id: "unity", label: "Unity C#" }, { id: "curl", label: "HTTP" }]} />}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Code label={lang === "js" ? "JavaScript" : lang === "unity" ? "C#" : "curl"}>{sn[lang]}</Code>
          <EventReference placements={placements} />
        </div>
      </Card>
      <Card title="4 · Watch events arrive" sub={`Latest events from ${game.name}`} pad={false} actions={<SimulatorToggle />}>
        <div className="adm-feed">
          {(events.data || []).length ? events.data.map(e => <EventLine key={e.id} e={e} placements={placements} />)
            : <div className="adm-empty">Nothing received yet. Send a test event or ship a build with the SDK.</div>}
        </div>
      </Card>
    </>
  );
}

function TestEvent({ game, placements, apiKey, hasKeys }) {
  const [key, setKey] = useState(apiKey || "");
  const [type, setType] = useState("impression");
  const [placement, setPlacement] = useState(placements[0] ? placements[0].key : "");
  const [platform, setPlatform] = useState(game.platforms[0]);
  const [region, setRegion] = useState("emea");
  const [result, setResult] = useState(null);
  React.useEffect(() => { if (apiKey) setKey(apiKey); }, [apiKey]);
  const def = EVENT_TYPES.find(t => t.id === type);
  const send = async () => {
    setResult(null);
    const ev = { event: type, session_id: "test-" + Date.now().toString(36), player_id: "tester", platform, region, props: { test: true } };
    if (def.needsPlacement || placement) ev.placement = def.needsPlacement ? placement : undefined;
    try {
      const r = await api.ingest(key.trim(), [ev]);
      setResult(r.rejected && r.rejected.length ? { tone: "bad", text: `Rejected: ${r.rejected[0].reason}` } : { tone: "good", text: `Accepted ${r.accepted} event. It shows in the feed below.` });
    } catch (e) {
      setResult({ tone: "bad", text: e.status === 401 ? "That API key isn't valid for any game, or it was revoked." : e.message });
    }
  };
  if (!hasKeys && !apiKey) return <Empty>Create an API key first.</Empty>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Field label="API key" id="t-key" hint={apiKey ? "Filled with the key you just created." : "Paste a key for this game."}><Input id="t-key" className="adm-input mono" value={key} onChange={e => setKey(e.target.value)} placeholder="msk_…" /></Field>
      <div className="adm-row">
        <Field label="Event" id="t-type"><Select id="t-type" value={type} onChange={e => setType(e.target.value)} options={EVENT_TYPES.map(t => ({ value: t.id, label: t.label }))} /></Field>
        <Field label="Placement" id="t-pl"><Select id="t-pl" value={placement} disabled={!def.needsPlacement} onChange={e => setPlacement(e.target.value)} options={placements.length ? placements.map(p => ({ value: p.key, label: p.name })) : [{ value: "", label: "No placements" }]} /></Field>
      </div>
      <div className="adm-row">
        <Field label="Platform" id="t-plat"><Select id="t-plat" value={platform} onChange={e => setPlatform(e.target.value)} options={game.platforms.map(p => ({ value: p, label: labelOf(PLATFORMS, p) }))} /></Field>
        <Field label="Region" id="t-reg"><Select id="t-reg" value={region} onChange={e => setRegion(e.target.value)} options={REGIONS.map(r => ({ value: r.id, label: r.label }))} /></Field>
      </div>
      <div><Button onClick={send} disabled={!key.trim()}>Send test event</Button></div>
      {result && <Notice tone={result.tone}>{result.text}</Notice>}
    </div>
  );
}

function EventReference({ placements }) {
  return (
    <details>
      <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Event reference and this game's placement keys</summary>
      <div className="adm-grid adm-grid-2" style={{ marginTop: 10 }}>
        <Table rows={EVENT_TYPES} columns={[
          { key: "id", label: "event", render: t => <code className="mono adm-small">{t.id}</code> },
          { key: "help", label: "When to send", render: t => <span className="adm-small">{t.help}{t.needsPlacement ? " Needs placement." : ""}</span> },
        ]} />
        <Table rows={placements} empty="No placements yet." columns={[
          { key: "key", label: "placement", render: p => <code className="mono adm-small">{p.key}</code> },
          { key: "name", label: "Name", render: p => <span className="adm-small">{p.name} · {p.location}</span> },
        ]} />
      </div>
    </details>
  );
}

function GameCampaigns({ game, campaigns, clients }) {
  const today = isoDay();
  return (
    <Card title="Campaigns in this game" pad={false} actions={<a className="adm-btn adm-btn-primary" style={{ textDecoration: "none" }} href={`#/campaigns/new/${game.id}`}>+ New campaign</a>}>
      <Table onRow={c => go(`campaigns/${c.id}`)} rows={campaigns} empty="No campaigns use this game yet." columns={[
        { key: "name", label: "Campaign", render: c => <b style={{ fontWeight: 600 }}>{c.name}</b> },
        { key: "client", label: "Client", render: c => (clients.find(x => x.id === c.client_id) || {}).name },
        { key: "status", label: "Status", render: c => <CampaignStatus campaign={c} today={today} /> },
        { key: "dates", label: "Dates", render: c => <span className="adm-small">{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</span> },
        { key: "pl", label: "Placements", align: "right", render: c => <span className="mono">{c.placement_ids.length}</span> },
        { key: "budget", label: "Budget", align: "right", render: c => <span className="mono tnum">{fmtMoney(c.budget)}</span> },
      ]} />
    </Card>
  );
}

