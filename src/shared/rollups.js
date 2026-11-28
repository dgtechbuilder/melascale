/* Daily rollups: the one shape both backends hand to the portals.
   A row = one day × placement (or null for session-level rows) × platform × region. */
import { addDays, daysBetween, hashString, rnd } from "./format.js";

export const METRIC_FIELDS = ["impressions", "viewable", "interactions", "clicks", "conversions", "sessions", "players", "playtime_sec"];

export function emptyMetrics() {
  return { impressions: 0, viewable: 0, interactions: 0, clicks: 0, conversions: 0, sessions: 0, players: 0, playtime_sec: 0 };
}

export function addInto(target, row) {
  for (const f of METRIC_FIELDS) target[f] += row[f] || 0;
  return target;
}

export function sumRows(rows) {
  return rows.reduce((acc, r) => addInto(acc, r), emptyMetrics());
}

export function groupBy(rows, keyFn) {
  const out = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!out.has(k)) out.set(k, emptyMetrics());
    addInto(out.get(k), r);
  }
  return out;
}

/* Fold one ingested event into a rollup map keyed "day|placement|platform|region". */
export function applyEventToRollups(map, ev) {
  const day = ev.ts.slice(0, 10);
  const key = [day, ev.placement_id || "", ev.platform || "unknown", ev.region || "unknown"].join("|");
  const row = map[key] || (map[key] = { ...emptyMetrics() });
  switch (ev.type) {
    case "session_start": row.sessions += 1; row.players += 1; break;
    case "session_end": row.playtime_sec += Number(ev.props?.duration_sec) || 0; break;
    case "impression": row.impressions += 1; break;
    case "viewable": row.viewable += 1; break;
    case "interaction": row.interactions += 1; break;
    case "click": row.clicks += 1; break;
    case "conversion": row.conversions += 1; break;
    default: break;
  }
  return map;
}

export function rollupMapToRows(map, gameId, placementsById) {
  const rows = [];
  for (const [key, m] of Object.entries(map)) {
    const [day, placement_id, platform, region] = key.split("|");
    if (placement_id && placementsById && !placementsById[placement_id]) continue;
    if (placementsById && placement_id && placementsById[placement_id].game_id !== gameId) continue;
    rows.push({ day, game_id: gameId, placement_id: placement_id || null, platform, region, ...m });
  }
  return rows;
}

/* ── Synthetic history for the demo workspace ─────────────────────────── */
const REGION_SHARE = { na: 0.36, emea: 0.29, apac: 0.26, latam: 0.09 };
const KIND_PROFILE = {
  billboard:     { reach: 0.95, view: 0.66, ctr: 0.016 },
  cosmetic:      { reach: 0.42, view: 0.9,  ctr: 0.052 },
  environmental: { reach: 0.7,  view: 0.8,  ctr: 0.031 },
  cutscene:      { reach: 0.22, view: 0.96, ctr: 0.064 },
  branded_item:  { reach: 0.35, view: 0.88, ctr: 0.071 },
  tutorial:      { reach: 0.18, view: 0.94, ctr: 0.088 },
  event:         { reach: 0.3,  view: 0.85, ctr: 0.058 },
};

export function syntheticRows(game, placements, from, to) {
  if (!game.seeded || !game.dau) return [];
  const rows = [];
  const startDay = addDays(game.created_at.slice(0, 10), 7);
  const n = daysBetween(from, to);
  const platShare = game.platforms.length === 1 ? { [game.platforms[0]]: 1 } :
    Object.fromEntries(game.platforms.map((p, i) => [p, i === 0 ? 0.64 : 0.36 / (game.platforms.length - 1)]));
  for (let i = 0; i <= n; i++) {
    const day = addDays(from, i);
    if (day < startDay) continue;
    const dayIdx = daysBetween("2026-01-01", day);
    const r = rnd(hashString(game.id + day));
    const weekly = 1 + 0.12 * Math.sin((dayIdx / 7) * Math.PI * 2);
    const trend = 1 + 0.004 * daysBetween(startDay, day) / 10;
    const wave = 0.85 + 0.3 * Math.sin(dayIdx / 9) * Math.cos(dayIdx / 23);
    for (const platform of game.platforms) {
      for (const [region, share] of Object.entries(REGION_SHARE)) {
        const noise = 0.88 + r() * 0.24;
        const players = Math.round(game.dau * share * platShare[platform] * weekly * trend * wave * noise);
        const sessions = Math.round(players * (1.45 + r() * 0.3));
        const avgLen = (platform === "webgl" ? 27 : 21) + r() * 4;
        rows.push({ day, game_id: game.id, placement_id: null, platform, region, ...emptyMetrics(),
          sessions, players, playtime_sec: Math.round(sessions * avgLen * 60) });
        for (const p of placements) {
          if (p.platform !== "all" && p.platform !== platform) continue;
          const prof = KIND_PROFILE[p.kind] || KIND_PROFILE.billboard;
          const pr = rnd(hashString(p.id + day + platform + region));
          const impressions = Math.round(sessions * prof.reach * (0.85 + pr() * 0.3));
          const viewable = Math.round(impressions * prof.view * (0.93 + pr() * 0.1));
          const interactions = Math.round(viewable * prof.ctr * (platform === "webgl" ? 1.2 : 1) * (0.85 + pr() * 0.3));
          const clicks = Math.round(interactions * (0.1 + pr() * 0.05));
          const conversions = Math.round(clicks * (0.12 + pr() * 0.06));
          rows.push({ day, game_id: game.id, placement_id: p.id, platform, region, ...emptyMetrics(),
            impressions, viewable, interactions, clicks, conversions });
        }
      }
    }
  }
  return rows;
}
