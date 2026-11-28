/* Small admin pieces shared across pages. */
import React, { useEffect, useState } from "react";
import { Badge, Button } from "./ui.jsx";
import { simulator } from "./simulator.js";
import { GAME_STATUSES, CAMPAIGN_STATUSES, campaignStatus, labelOf, PLATFORMS, REGIONS } from "../shared/schema.js";
import { timeAgo } from "../shared/format.js";

export function GameStatus({ status }) {
  const s = GAME_STATUSES.find(x => x.id === status) || { label: status, tone: "muted" };
  return <Badge tone={s.tone} dot>{s.label}</Badge>;
}

export function CampaignStatus({ campaign, today }) {
  const id = campaignStatus(campaign, today);
  const s = CAMPAIGN_STATUSES.find(x => x.id === id);
  return <Badge tone={s.tone} dot={id === "live"}>{s.label}</Badge>;
}

export function Connection({ health }) {
  if (!health) return <span className="adm-muted">—</span>;
  if (!health.connected) return <Badge tone="warn">Not connected</Badge>;
  const fresh = health.last_event_at && Date.now() - new Date(health.last_event_at).getTime() < 15 * 60 * 1000;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      {fresh ? <span className="live-dot" aria-hidden="true" /> : <span style={{ width: 7, height: 7, borderRadius: 4, background: "var(--warn)" }} aria-hidden="true" />}
      <span className="adm-small">{fresh ? "Receiving" : "Quiet"} · {timeAgo(health.last_event_at)}</span>
    </span>
  );
}

export function SimulatorToggle() {
  const [running, setRunning] = useState(simulator.running);
  useEffect(() => simulator.subscribe(() => setRunning(simulator.running)), []);
  if (!simulator.available) return null;
  return (
    <Button kind={running ? "primary" : "ghost"} onClick={() => (running ? simulator.stop() : simulator.start())} aria-pressed={running}>
      {running ? <><span className="live-dot" aria-hidden="true" /> Simulating game traffic</> : "▶ Simulate game traffic"}
    </Button>
  );
}

export function EventLine({ e, games, placements }) {
  const g = games && games.find(x => x.id === e.game_id);
  const p = placements && placements.find(x => x.id === e.placement_id);
  return (
    <div className="adm-feed-row">
      <span className="mono adm-muted adm-small">{timeAgo(e.ts)}</span>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        <span className="adm-type">{e.type}</span>{" "}
        {g && <b style={{ fontWeight: 600 }}>{g.name}</b>}
        {p && <span className="adm-muted"> · {p.name}</span>}
        <span className="adm-muted"> · {labelOf(PLATFORMS, e.platform)} · {labelOf(REGIONS, e.region)}</span>
      </span>
      <span className="mono adm-muted adm-small">{e.source === "simulator" ? "sim" : e.props && e.props.test ? "test" : "sdk"}</span>
    </div>
  );
}
