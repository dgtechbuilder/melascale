// Mela Scale ingest: games POST analytics events here with their API key.
//
//   POST /functions/v1/ingest
//   x-api-key: msk_...            (or ?key=msk_... for navigator.sendBeacon, which can't set headers)
//   { "events": [ { "event": "impression", "placement": "coastal-market-billboard",
//                   "session_id": "...", "player_id": "...", "platform": "mobile", "region": "emea",
//                   "ts": "2026-11-28T10:00:00Z", "props": {} } ] }
//
// Deploy with `supabase functions deploy ingest --no-verify-jwt` (games have no Supabase login;
// the API key is the credential). Validation mirrors src/shared/ingest.js.
import { createClient } from "jsr:@supabase/supabase-js@2";

const EVENT_TYPES: Record<string, { needsPlacement: boolean }> = {
  session_start: { needsPlacement: false },
  session_end: { needsPlacement: false },
  impression: { needsPlacement: true },
  viewable: { needsPlacement: true },
  interaction: { needsPlacement: true },
  click: { needsPlacement: true },
  conversion: { needsPlacement: false },
};
const PLATFORMS = ["mobile", "webgl", "pc", "console", "unknown"];
const REGIONS = ["na", "emea", "apac", "latam", "unknown"];
const MAX_BATCH = 500;
const MAX_BODY_BYTES = 1_000_000;

const cors = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-api-key",
  "access-control-max-age": "86400",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

async function sha256hex(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (req.method !== "POST") return json(405, { error: "Use POST" });

  const url = new URL(req.url);
  const apiKey = req.headers.get("x-api-key") || url.searchParams.get("key") || "";
  if (!apiKey.startsWith("msk_")) return json(401, { error: "Missing or malformed API key" });

  const { data: key, error: keyErr } = await supabase
    .from("api_keys").select("id, game_id")
    .eq("key_hash", await sha256hex(apiKey)).is("revoked_at", null).maybeSingle();
  if (keyErr) return json(500, { error: "Key lookup failed" });
  if (!key) return json(401, { error: "Invalid or revoked API key" });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: "Body too large (max 1 MB)" });
  let body: { events?: unknown };
  try { body = JSON.parse(raw); } catch { return json(400, { error: "Body must be JSON: { events: [...] }" }); }
  const events = body.events;
  if (!Array.isArray(events)) return json(400, { error: "Body must be { events: [...] }" });
  if (events.length > MAX_BATCH) return json(413, { error: `At most ${MAX_BATCH} events per request` });

  const { data: placements } = await supabase.from("placements").select("id, key").eq("game_id", key.game_id);
  const byKey = new Map((placements || []).map((p) => [p.key, p.id]));

  const rows: Record<string, unknown>[] = [];
  const rejected: { index: number; reason: string }[] = [];
  const now = Date.now();
  events.forEach((e: any, index: number) => {
    const fail = (reason: string) => rejected.push({ index, reason });
    if (!e || typeof e !== "object") return fail("Event must be an object");
    const def = EVENT_TYPES[e.event];
    if (!def) return fail(`Unknown event "${e.event}"`);
    let placementId: string | null = null;
    if (e.placement != null && e.placement !== "") {
      placementId = byKey.get(String(e.placement)) ?? null;
      if (!placementId) return fail(`Unknown placement "${e.placement}"`);
    } else if (def.needsPlacement) {
      return fail(`"${e.event}" needs a placement key`);
    }
    if (!e.session_id || typeof e.session_id !== "string") return fail("session_id is required");
    const platform = e.platform || "unknown";
    if (!PLATFORMS.includes(platform)) return fail(`Unknown platform "${platform}"`);
    const region = e.region || "unknown";
    if (!REGIONS.includes(region)) return fail(`Unknown region "${region}"`);
    let ts = e.ts ? new Date(e.ts) : new Date(now);
    if (Number.isNaN(ts.getTime())) return fail("ts must be an ISO timestamp");
    if (ts.getTime() > now + 5 * 60_000) ts = new Date(now); // clock skew: don't accept the future
    const props = e.props && typeof e.props === "object" && !Array.isArray(e.props) ? e.props : {};
    rows.push({
      game_id: key.game_id,
      placement_id: placementId,
      type: e.event,
      session_id: e.session_id.slice(0, 128),
      player_id: e.player_id ? String(e.player_id).slice(0, 128) : null,
      platform,
      region,
      ts: ts.toISOString(),
      props,
      source: "sdk",
    });
  });

  if (rows.length) {
    const { error } = await supabase.from("events").insert(rows);
    if (error) return json(500, { error: "Could not store events" });
  }
  await supabase.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", key.id);
  return json(200, { accepted: rows.length, rejected });
});
