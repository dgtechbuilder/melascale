/* Event validation used by the demo backend. supabase/functions/ingest/index.ts
   applies the same rules server-side; keep the two in step. */
import { EVENT_TYPE_IDS, EVENT_TYPES, PLATFORMS, REGIONS } from "./schema.js";

export const MAX_BATCH = 500;
const PLATFORM_IDS = PLATFORMS.map(p => p.id);
const REGION_IDS = REGIONS.map(r => r.id);

/**
 * Validate a batch for one game.
 * @param {object[]} events  raw events from a game client
 * @param {object[]} placements  the game's placements (matched by `key`)
 * @returns {{ accepted: object[], rejected: {index:number, reason:string}[] }}
 */
export function validateBatch(events, placements) {
  const accepted = [];
  const rejected = [];
  if (!Array.isArray(events)) return { accepted, rejected: [{ index: -1, reason: "Body must be { events: [...] }" }] };
  if (events.length > MAX_BATCH) return { accepted, rejected: [{ index: -1, reason: `At most ${MAX_BATCH} events per request` }] };
  const byKey = Object.fromEntries(placements.map(p => [p.key, p]));
  events.forEach((e, index) => {
    const fail = reason => rejected.push({ index, reason });
    if (!e || typeof e !== "object") return fail("Event must be an object");
    if (!EVENT_TYPE_IDS.includes(e.event)) return fail(`Unknown event "${e.event}"`);
    const def = EVENT_TYPES.find(t => t.id === e.event);
    let placement = null;
    if (e.placement != null && e.placement !== "") {
      placement = byKey[e.placement];
      if (!placement) return fail(`Unknown placement "${e.placement}"`);
    } else if (def.needsPlacement) {
      return fail(`"${e.event}" needs a placement key`);
    }
    if (!e.session_id || typeof e.session_id !== "string") return fail("session_id is required");
    const platform = e.platform || "unknown";
    if (platform !== "unknown" && !PLATFORM_IDS.includes(platform)) return fail(`Unknown platform "${platform}"`);
    const region = e.region || "unknown";
    if (region !== "unknown" && !REGION_IDS.includes(region)) return fail(`Unknown region "${region}"`);
    let ts = e.ts ? new Date(e.ts) : new Date();
    if (Number.isNaN(ts.getTime())) return fail("ts must be an ISO timestamp");
    if (ts.getTime() > Date.now() + 5 * 60 * 1000) ts = new Date();
    accepted.push({
      type: e.event,
      placement_id: placement ? placement.id : null,
      session_id: String(e.session_id).slice(0, 128),
      player_id: e.player_id ? String(e.player_id).slice(0, 128) : null,
      platform,
      region,
      ts: ts.toISOString(),
      props: e.props && typeof e.props === "object" ? e.props : {},
    });
  });
  return { accepted, rejected };
}
