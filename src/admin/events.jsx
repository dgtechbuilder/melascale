/* Event stream: the raw events arriving from game clients, for debugging integrations. */
import React, { useState } from "react";
import { api } from "../shared/api/index.js";
import { EVENT_TYPES, PLATFORMS, REGIONS, labelOf } from "../shared/schema.js";
import { timeAgo } from "../shared/format.js";
import { Card, Page, Select, Table, useLoad } from "./ui.jsx";
import { SimulatorToggle } from "./common.jsx";

export function EventsPage() {
  const [gameId, setGameId] = useState("");
  const [type, setType] = useState("");
  const meta = useLoad(async () => {
    const [games, placements] = await Promise.all([api.listGames(), api.listPlacements()]);
    return { games, placements };
  }, [], { subscribe: api.subscribe });
  const events = useLoad(() => api.listEvents({ gameId: gameId || undefined, limit: 200 }), [gameId], { interval: 2000 });

  const games = meta.data ? meta.data.games : [];
  const placements = meta.data ? meta.data.placements : [];
  const rows = (events.data || []).filter(e => !type || e.type === type).slice(0, 100);
  return (
    <Page title="Event stream" sub="Raw events as games send them. Refreshes every 2 seconds." actions={<SimulatorToggle />}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <div style={{ width: 240, maxWidth: "100%" }}>
          <label htmlFor="ev-game" className="vis-hidden">Game</label>
          <Select id="ev-game" value={gameId} onChange={e => setGameId(e.target.value)} options={[{ value: "", label: "All games" }, ...games.map(g => ({ value: g.id, label: g.name }))]} />
        </div>
        <div style={{ width: 220, maxWidth: "100%" }}>
          <label htmlFor="ev-type" className="vis-hidden">Event type</label>
          <Select id="ev-type" value={type} onChange={e => setType(e.target.value)} options={[{ value: "", label: "All event types" }, ...EVENT_TYPES.map(t => ({ value: t.id, label: t.label }))]} />
        </div>
      </div>
      <Card pad={false}>
        <Table rows={rows} empty="No events yet. Send a test event from a game's Connect tab, or start the traffic simulator." columns={[
          { key: "ts", label: "When", render: e => <span className="mono adm-small" title={e.ts}>{timeAgo(e.ts)}</span> },
          { key: "type", label: "Event", render: e => <span className="adm-type">{e.type}</span> },
          { key: "game", label: "Game", render: e => (games.find(g => g.id === e.game_id) || {}).name || "—" },
          { key: "pl", label: "Placement", render: e => { const p = placements.find(x => x.id === e.placement_id); return p ? <span>{p.name}<div className="mono adm-small adm-muted">{p.key}</div></span> : <span className="adm-muted">—</span>; } },
          { key: "where", label: "Platform · region", render: e => <span className="adm-small">{labelOf(PLATFORMS, e.platform)} · {labelOf(REGIONS, e.region)}</span> },
          { key: "session", label: "Session", render: e => <span className="mono adm-small adm-muted">{e.session_id}</span> },
          { key: "src", label: "Source", render: e => <span className="adm-small">{e.source === "simulator" ? "Simulator" : e.props && e.props.test ? "Test event" : "Game SDK"}</span> },
        ]} />
      </Card>
    </Page>
  );
}
