/* Admin overview: the whole portfolio at a glance. */
import React from "react";
import { api } from "../shared/api/index.js";
import { addDays, fmtMoney, fmtNum, isoDay, fmtDate, daysBetween } from "../shared/format.js";
import { campaignStatus, labelOf, PLATFORMS } from "../shared/schema.js";
import { buildGameSummary } from "../shared/metrics.js";
import { EngagementChart } from "../shared/charts.jsx";
import { Card, Page, Stat, Table, GameChip, useLoad } from "./ui.jsx";
import { GameStatus, CampaignStatus, Connection, SimulatorToggle, EventLine } from "./common.jsx";
import { go } from "./app.jsx";

const DAYS = 30;

export function OverviewPage() {
  const today = isoDay();
  const from = addDays(today, -(DAYS - 1));
  const base = useLoad(async () => {
    const [games, campaigns, clients, placements] = await Promise.all([api.listGames(), api.listCampaigns(), api.listClients(), api.listPlacements()]);
    const sums = {};
    await Promise.all(games.map(async g => {
      const [rows, prev] = await Promise.all([
        api.getRollups({ gameId: g.id, from, to: today }),
        api.getRollups({ gameId: g.id, from: addDays(from, -DAYS), to: addDays(from, -1) }),
      ]);
      sums[g.id] = buildGameSummary(rows, prev, from, DAYS);
    }));
    return { games, campaigns, clients, placements, sums };
  }, [], { subscribe: api.subscribe, interval: 15000 });
  const live = useLoad(async () => {
    const [health, events] = await Promise.all([api.ingestHealth(), api.listEvents({ limit: 14 })]);
    return { health, events };
  }, [], { interval: 3000 });

  const d = base.data;
  if (!d) return <Page title="Overview" sub={base.error || "Loading…"} />;
  const health = live.data ? live.data.health : [];
  const events = live.data ? live.data.events : [];
  const all = Object.values(d.sums);
  const total = (k) => all.reduce((a, s) => a + s[k], 0);
  const weighted = (k) => { const ss = all.filter(s => s.impressions); return ss.length ? ss.reduce((a, s) => a + s[k] * s.impressions, 0) / ss.reduce((a, s) => a + s.impressions, 0) : 0; };
  const series = Array.from({ length: DAYS }, (_, i) => {
    const cur = all.reduce((a, s) => a + (s.series[i] ? s.series[i].sessions : 0), 0);
    return { i, label: d.sums[d.games[0].id].series[i].label, dateLabel: fmtDate(addDays(from, i)), current: cur, previous: 0 };
  });
  const activeCampaigns = d.campaigns.filter(c => campaignStatus(c, today) === "live");
  const connectedGames = health.filter(h => h.connected).length;
  const eventsToday = health.reduce((a, h) => a + (h.events_today || 0), 0);
  const clientName = id => (d.clients.find(c => c.id === id) || {}).name || "—";
  const gameOf = id => d.games.find(g => g.id === id);

  return (
    <Page title="Portfolio overview" sub={`All Kunta Content games · last ${DAYS} days`} actions={<SimulatorToggle />}>
      <div className="adm-grid adm-grid-4">
        <Stat label="Games connected" value={`${connectedGames}/${d.games.length}`} sub={`${d.games.filter(g => g.status === "live").length} live · ${d.games.filter(g => g.status === "development").length} in development`} />
        <Stat label="Players (daily avg)" value={fmtNum(total("players") / DAYS)} delta={pctAvg(all, "playersDelta")} sub={`${fmtNum(total("sessions"))} sessions in ${DAYS} days`} />
        <Stat label="Placement impressions" value={fmtNum(total("impressions"))} delta={pctAvg(all, "impressionsDelta")} sub={`${weighted("ctr").toFixed(2)}% interaction rate`} />
        <Stat label="Events today" value={fmtNum(eventsToday)} sub={`${activeCampaigns.length} live campaigns · ${d.clients.length} clients`} />
      </div>

      <div className="adm-grid adm-grid-main">
        <Card title="Sessions across all games" sub={`Daily sessions · ${fmtDate(from)} – ${fmtDate(today)}`}>
          <EngagementChart data={series} height={240} showPrevious={false} unit="sessions" currentLabel="Sessions" />
        </Card>
        <Card title="Live event stream" sub="Latest events from game clients" pad={false}
          actions={<a className="adm-link adm-small" href="#/events">Open stream →</a>}>
          <div className="adm-feed">
            {events.length ? events.map(e => <EventLine key={e.id} e={e} games={d.games} placements={d.placements} />)
              : <div className="adm-empty">No events yet. Connect a game or start the traffic simulator.</div>}
          </div>
        </Card>
      </div>

      <Card title="Games" sub="Status, analytics connection and 30-day delivery" pad={false}
        actions={<a className="adm-link adm-small" href="#/games">Manage games →</a>}>
        <Table onRow={g => go(`games/${g.id}`)} rows={d.games} columns={[
          { key: "name", label: "Game", render: g => <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><GameChip game={g} /><span><b style={{ fontWeight: 600 }}>{g.name}</b><div className="adm-muted adm-small">{g.genre} · {g.platforms.map(p => labelOf(PLATFORMS, p)).join(", ")}</div></span></span> },
          { key: "status", label: "Status", render: g => <GameStatus status={g.status} /> },
          { key: "conn", label: "Analytics", render: g => <Connection health={health.find(h => h.game_id === g.id)} /> },
          { key: "players", label: "Daily players", align: "right", render: g => <span className="mono tnum">{fmtNum(d.sums[g.id].players / DAYS)}</span> },
          { key: "imp", label: "Impressions", align: "right", render: g => <span className="mono tnum">{fmtNum(d.sums[g.id].impressions)}</span> },
          { key: "cmp", label: "Campaigns", align: "right", render: g => <span className="mono tnum">{d.campaigns.filter(c => c.game_id === g.id && campaignStatus(c, today) === "live").length}</span> },
        ]} />
      </Card>

      <Card title="Campaigns" sub="Live and upcoming brand campaigns" pad={false}
        actions={<a className="adm-link adm-small" href="#/campaigns">All campaigns →</a>}>
        <Table onRow={c => go(`campaigns/${c.id}`)} rows={d.campaigns.filter(c => campaignStatus(c, today) !== "completed")} empty="No live or upcoming campaigns." columns={[
          { key: "name", label: "Campaign", render: c => <span><b style={{ fontWeight: 600 }}>{c.name}</b><div className="adm-muted adm-small">{clientName(c.client_id)}</div></span> },
          { key: "game", label: "Game", render: c => gameOf(c.game_id)?.name || "—" },
          { key: "status", label: "Status", render: c => <CampaignStatus campaign={c} today={today} /> },
          { key: "dates", label: "Ends", render: c => <span className="adm-small">{fmtDate(c.end_date)} <span className="adm-muted">({daysBetween(today, c.end_date)}d)</span></span> },
          { key: "budget", label: "Budget", align: "right", render: c => <span className="mono tnum">{fmtMoney(c.budget)}</span> },
        ]} />
      </Card>
    </Page>
  );
}

function pctAvg(all, k) {
  const v = all.filter(s => Number.isFinite(s[k]) && (s.sessions || s.impressions));
  return v.length ? v.reduce((a, s) => a + s[k], 0) / v.length : null;
}
