/* Campaigns: a client's placements in one game over a date range. This is what
   decides which analytics a client sees in the client portal. */
import React, { useState } from "react";
import { api, isDemo } from "../shared/api/index.js";
import { addDays, fmtDate, fmtMoney, fmtNum, isoDay } from "../shared/format.js";
import { campaignStatus } from "../shared/schema.js";
import { buildCampaignView, campaignWindow } from "../shared/metrics.js";
import { EngagementChart } from "../shared/charts.jsx";
import { Button, Card, ErrorText, Field, Input, Modal, Page, Select, Stat, Table, Tabs, Notice, useLoad } from "./ui.jsx";
import { CampaignStatus } from "./common.jsx";
import { go } from "./app.jsx";

export function CampaignsPage({ newFor }) {
  const today = isoDay();
  const [filter, setFilter] = useState("active");
  const { data, error } = useLoad(async () => {
    const [campaigns, games, clients] = await Promise.all([api.listCampaigns(), api.listGames(), api.listClients()]);
    return { campaigns, games, clients };
  }, [], { subscribe: api.subscribe });
  const creating = newFor != null;

  if (!data) return <Page title="Campaigns" sub={error || "Loading…"} />;
  const st = c => campaignStatus(c, today);
  const rows = data.campaigns.filter(c => filter === "all" ? true : filter === "active" ? ["live", "scheduled"].includes(st(c)) : st(c) === filter);
  const name = (list, id) => (list.find(x => x.id === id) || {}).name || "—";
  return (
    <Page title="Campaigns" sub="Which placements a client is buying in which game, and when. Clients see analytics only for their own campaigns."
      actions={<Button onClick={() => go("campaigns/new")}>+ New campaign</Button>}>
      <Tabs value={filter} onChange={setFilter} tabs={[
        { id: "active", label: "Live & scheduled", count: data.campaigns.filter(c => ["live", "scheduled"].includes(st(c))).length },
        { id: "completed", label: "Completed", count: data.campaigns.filter(c => st(c) === "completed").length },
        { id: "draft", label: "Drafts", count: data.campaigns.filter(c => st(c) === "draft").length },
        { id: "all", label: "All", count: data.campaigns.length },
      ]} />
      <Card pad={false}>
        <Table onRow={c => go(`campaigns/${c.id}`)} rows={rows} empty="No campaigns here." columns={[
          { key: "name", label: "Campaign", render: c => <span><b style={{ fontWeight: 600 }}>{c.name}</b><div className="adm-muted adm-small">{name(data.clients, c.client_id)}</div></span> },
          { key: "game", label: "Game", render: c => name(data.games, c.game_id) },
          { key: "status", label: "Status", render: c => <CampaignStatus campaign={c} today={today} /> },
          { key: "dates", label: "Dates", render: c => <span className="adm-small">{fmtDate(c.start_date)} – {fmtDate(c.end_date)}</span> },
          { key: "pl", label: "Placements", align: "right", render: c => <span className="mono">{c.placement_ids.length}</span> },
          { key: "budget", label: "Budget", align: "right", render: c => <span className="mono tnum">{fmtMoney(c.budget)}</span> },
        ]} />
      </Card>
      {creating && <CampaignModal games={data.games} clients={data.clients} presetGame={newFor || null}
        onClose={() => go("campaigns")} onSaved={c => go(`campaigns/${c.id}`)} />}
    </Page>
  );
}

export function CampaignModal({ campaign, games, clients, presetGame, presetClient, onClose, onSaved }) {
  const today = isoDay();
  const [f, setF] = useState(() => campaign ? { ...campaign, draft: campaign.status === "draft" } : {
    name: "", client_id: presetClient || (clients[0] || {}).id || "", game_id: presetGame || (games.find(g => g.status === "live") || games[0] || {}).id || "",
    start_date: today, end_date: addDays(today, 41), budget: 50000, conversion_value: 24, placement_ids: [], draft: false,
  });
  const [err, setErr] = useState(null);
  const placements = useLoad(() => f.game_id ? api.listPlacements(f.game_id) : Promise.resolve([]), [f.game_id]);
  const set = (k, v) => setF(x => ({ ...x, [k]: v }));
  const toggle = id => set("placement_ids", f.placement_ids.includes(id) ? f.placement_ids.filter(x => x !== id) : [...f.placement_ids, id]);
  const save = async () => {
    setErr(null);
    if (!f.name.trim()) return setErr("Name the campaign.");
    if (!f.client_id) return setErr("Pick a client. Add one under Clients first.");
    if (!f.game_id) return setErr("Pick a game.");
    if (f.end_date < f.start_date) return setErr("The end date is before the start date.");
    if (!f.placement_ids.length) return setErr("Pick at least one placement.");
    const { draft, ...rest } = f;
    try {
      const saved = await api.saveCampaign({ ...rest, name: f.name.trim(), budget: Number(f.budget) || 0, conversion_value: Number(f.conversion_value) || 0, status: draft ? "draft" : "active" });
      onSaved(saved);
    } catch (e) { setErr(e.message); }
  };
  return (
    <Modal wide title={campaign ? `Edit ${campaign.name}` : "New campaign"} onClose={onClose}
      footer={<><Button kind="ghost" onClick={onClose}>Cancel</Button><Button onClick={save}>{campaign ? "Save changes" : "Create campaign"}</Button></>}>
      <Field label="Campaign name" id="c-name"><Input id="c-name" value={f.name} onChange={e => set("name", e.target.value)} placeholder="Smart tractor season" /></Field>
      <div className="adm-row">
        <Field label="Client" id="c-client"><Select id="c-client" value={f.client_id} onChange={e => set("client_id", e.target.value)} options={clients.map(c => ({ value: c.id, label: c.name }))} /></Field>
        <Field label="Game" id="c-game"><Select id="c-game" value={f.game_id} disabled={!!campaign} onChange={e => setF(x => ({ ...x, game_id: e.target.value, placement_ids: [] }))} options={games.map(g => ({ value: g.id, label: g.name }))} /></Field>
      </div>
      <div className="adm-row">
        <Field label="Start" id="c-start"><Input id="c-start" type="date" value={f.start_date} onChange={e => set("start_date", e.target.value)} /></Field>
        <Field label="End" id="c-end"><Input id="c-end" type="date" value={f.end_date} onChange={e => set("end_date", e.target.value)} /></Field>
      </div>
      <div className="adm-row">
        <Field label="Budget (USD)" id="c-budget"><Input id="c-budget" type="number" min="0" value={f.budget} onChange={e => set("budget", e.target.value)} /></Field>
        <Field label="Value per conversion (USD)" id="c-cv" hint="Used to report ROAS to the client."><Input id="c-cv" type="number" min="0" step="0.01" value={f.conversion_value} onChange={e => set("conversion_value", e.target.value)} /></Field>
      </div>
      <Field label="Placements" id="c-pl" hint="The client sees analytics for these placements only.">
        <div className="adm-checks" id="c-pl">
          {(placements.data || []).map(p => (
            <label key={p.id} className="adm-check"><input type="checkbox" checked={f.placement_ids.includes(p.id)} onChange={() => toggle(p.id)} />{p.name}<span className="adm-muted adm-small">· {p.location}</span></label>
          ))}
          {placements.data && !placements.data.length && <span className="adm-muted adm-small">This game has no placements yet. Add them on the game's Placements tab.</span>}
        </div>
      </Field>
      <label className="adm-check" style={{ alignSelf: "flex-start" }}><input type="checkbox" checked={f.draft} onChange={e => set("draft", e.target.checked)} />Save as draft (hidden from the client)</label>
      <ErrorText error={err} />
    </Modal>
  );
}

export function CampaignDetail({ id }) {
  const today = isoDay();
  const [editing, setEditing] = useState(false);
  const { data, error } = useLoad(async () => {
    const [campaigns, games, clients] = await Promise.all([api.listCampaigns(), api.listGames(), api.listClients()]);
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return { missing: true };
    const game = games.find(g => g.id === campaign.game_id);
    const client = clients.find(c => c.id === campaign.client_id);
    const win = campaignWindow(campaign, today);
    const [placements, rows, prevRows, reach, prevReach, events] = await Promise.all([
      api.listPlacements(game.id),
      api.getRollups({ gameId: game.id, from: win.from, to: win.to }),
      api.getRollups({ gameId: game.id, from: win.prevFrom, to: win.prevTo }),
      api.getReach({ gameId: game.id, placementIds: campaign.placement_ids, from: win.curFrom, to: win.to }),
      win.hasPrev ? api.getReach({ gameId: game.id, placementIds: campaign.placement_ids, from: win.prevClipFrom, to: win.prevTo }) : Promise.resolve(null),
      api.listEvents({ gameId: game.id, limit: 40 }),
    ]);
    const view = buildCampaignView({ campaign, client, game, placements: placements.filter(p => campaign.placement_ids.includes(p.id)), rows, prevRows, reach, prevReach, events, today });
    return { campaign, game, client, games, clients, view };
  }, [id], { subscribe: api.subscribe, interval: 10000 });

  if (error) return <Page title="Campaign" sub={error} />;
  if (!data) return <Page title="Campaign" sub="Loading…" />;
  if (data.missing) return <Page title="Campaign not found" sub={<a className="adm-link" href="#/campaigns">Back to campaigns</a>} />;
  const { campaign, game, client, view } = data;
  const viewAsClient = async () => {
    if (isDemo) {
      await api.signInAsClient(client.id);
      try { localStorage.setItem("mela-scale.client.campaign", campaign.id); } catch (e) {}
    }
    window.open("../client/", "_blank", "noopener");
  };
  const k = Object.fromEntries(view.KPIS.map(x => [x.id, x]));
  return (
    <Page
      title={campaign.name}
      sub={<span style={{ display: "inline-flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}><a className="adm-back" href="#/campaigns">← Campaigns</a><CampaignStatus campaign={campaign} today={today} /><a className="adm-link" href={`#/clients/${client.id}`}>{client.name}</a><span>×</span><a className="adm-link" href={`#/games/${game.id}`}>{game.name}</a><span>{fmtDate(campaign.start_date)} – {fmtDate(campaign.end_date)}</span></span>}
      actions={<><Button kind="ghost" onClick={() => setEditing(true)}>Edit campaign</Button><Button onClick={viewAsClient}>{isDemo ? "View as client ↗" : "Open client portal ↗"}</Button></>}>
      {campaign.status === "draft" && <Notice tone="warn">Draft: {client.name} can't see this campaign yet.</Notice>}
      <div className="adm-grid adm-grid-4">
        <Stat label="Unique reach" value={k.reach.value} unit={k.reach.unit} delta={k.reach.delta} sub={k.reach.sub} />
        <Stat label="Impressions" value={fmtNum(view.totals.impressions)} sub={`${view.FUNNEL[1].pct.toFixed(1)}% viewable`} />
        <Stat label="Interactions" value={fmtNum(view.totals.interactions)} delta={view.TREND.delta} sub={`${(view.totals.interactions / (view.totals.viewable || 1) * 100).toFixed(2)}% of viewable`} />
        <Stat label="Delivered spend" value={fmtMoney(view.CAMPAIGN.spent)} sub={`of ${fmtMoney(campaign.budget)} · week ${view.CAMPAIGN.weekOf} of ${view.CAMPAIGN.weeksTotal}`} />
      </div>
      <Card title="Interactions per day" sub={`Reporting window ${fmtDate(view.CAMPAIGN.windowFrom)} – ${fmtDate(view.CAMPAIGN.windowTo)}, vs the 30 days before`}>
        <EngagementChart data={view.ENGAGEMENT_DAYS} height={240} unit="interactions" />
      </Card>
      <Card title="Placements" sub="What the client sees in their placement table" pad={false}>
        <Table rows={view.PLACEMENT_ROWS} empty="No placements in this campaign." columns={[
          { key: "detail", label: "Placement", render: r => <span><b style={{ fontWeight: 600 }}>{r.detail}</b><div className="adm-muted adm-small">{r.placement} · {r.game}</div></span> },
          { key: "imp", label: "Impressions", align: "right", render: r => <span className="mono tnum">{fmtNum(r.impressions)}</span> },
          { key: "rec", label: "Viewable", align: "right", render: r => <span className="mono tnum">{r.recall}%</span> },
          { key: "ctr", label: "Eng. rate", align: "right", render: r => <span className="mono tnum">{r.ctr.toFixed(1)}%</span> },
          { key: "cpe", label: "CPE", align: "right", render: r => <span className="mono tnum">{fmtMoney(r.cpe)}</span> },
          { key: "lift", label: "vs prev", align: "right", render: r => <span className="mono tnum" style={{ color: r.lift > 0 ? "var(--good)" : r.lift < 0 ? "var(--bad)" : "var(--ink-3)" }}>{r.lift > 0 ? "+" : ""}{r.lift}%</span> },
        ]} />
      </Card>
      {editing && <CampaignModal campaign={campaign} games={data.games} clients={data.clients} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />}
    </Page>
  );
}

