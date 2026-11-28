/* TemoLima player progress, read from the MelaPress Supabase project. Read-only.

   TemoLima has no accounts: a player is "signed in" by their player code (the uuid shown
   in TemoLima → Settings), which is also the key of temolima_players, temolima_saves and
   temolima_achievements. Those tables have RLS on with no policies, so a browser can't
   select from them. The page reads through security-definer functions keyed by the code:

   - temolima_progress(p_player)  player row + save time + achievements, straight from the
                                  tables (used when the function exists in the project)
   - temolima_restore(p_player)   the game's own save lookup; progress and badges are read
                                  from the save state

   Nothing here writes. Keep this file free of import.meta so `npm test` can load it in Node. */
import { initials } from "./format.js";

export const PLAYER_CODE_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Badge names for the save-only path, which stores badge ids but not their titles.
   Kept in step with TemoLima's badge list; unknown ids fall back to a readable name. */
export const BADGES = {
  "welcome":        { title: "Welcome to your farm",  game: "daily",   tier: "day1" },
  "first-plant":    { title: "Seeds in the ground",   game: "six",     tier: "day1" },
  "first-check":    { title: "Crop doctor",           game: "six",     tier: "day1" },
  "first-credit":   { title: "Climate starter",       game: "climate", tier: "day1" },
  "first-csa":      { title: "Climate-smart starter", game: "climate", tier: "day1" },
  "credits-bronze": { title: "Climate friend",        game: "climate", tier: "bronze" },
  "credits-silver": { title: "Climate steward",       game: "climate", tier: "silver" },
  "streak-bronze":  { title: "On a roll",             game: "daily",   tier: "bronze" },
};

const TIERS = ["day1", "bronze", "silver", "gold", "platinum"];
export const TIER_LABEL = { day1: "First steps", bronze: "Bronze", silver: "Silver", gold: "Gold", platinum: "Platinum" };
export const GAME_LABEL = { daily: "Daily play", six: "Farm skills", climate: "Climate action" };

export function normaliseCode(text) {
  return String(text || "").trim().toLowerCase();
}

export function isPlayerCode(text) {
  return PLAYER_CODE_RE.test(normaliseCode(text));
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function tierFromId(id) {
  const t = String(id).split("-").pop();
  return TIERS.includes(t) ? t : "day1";
}

/* "credits-silver" → "Credits silver" */
function titleFromId(id) {
  const s = String(id).replace(/[-_]+/g, " ").trim();
  return s ? s[0].toUpperCase() + s.slice(1) : "Badge";
}

function badge(row) {
  const known = BADGES[row.badge_id] || {};
  return {
    id: row.badge_id,
    title: row.title || known.title || titleFromId(row.badge_id),
    game: row.game || known.game || null,
    tier: row.tier || known.tier || tierFromId(row.badge_id),
    wonOn: row.won_on || null,
    claimed: !!row.claimed,
  };
}

function byNewest(a, b) {
  return String(b.wonOn || "").localeCompare(String(a.wonOn || "")) || a.title.localeCompare(b.title);
}

/* temolima_restore payload → progress. Returns null when the code has no save. */
export function progressFromRestore(payload) {
  if (!payload || typeof payload !== "object" || !payload.state) return null;
  const s = payload.state || {};
  const ach = s.ach || {};
  const streak = ach.streak || {};
  const name = payload.farmer_name || (s.farmer && s.farmer.name) || "Farmer";
  const achievements = Object.entries(ach.won || {})
    .map(([id, w]) => badge({ badge_id: id, won_on: w && w.date, claimed: w && w.claimed }))
    .sort(byNewest);
  return {
    source: "save",
    name,
    initials: initials(name),
    savedAt: payload.saved_at || null,
    level: num(s.level),
    season: num(s.season),
    points: num(s.points),
    coins: num(s.coins),
    daysPlayed: num(ach.days),
    streak: num(streak.count),
    bestStreak: num(streak.best),
    playSeconds: num(s.playSeconds),
    achievements,
    certificates: (Array.isArray(ach.certs) ? ach.certs : []).map(c => ({ id: c.id, title: c.title || titleFromId(c.id), issuedOn: c.date || null })),
  };
}

/* temolima_progress payload ({ player, saved_at, achievements }) → progress. */
export function progressFromTables(payload) {
  if (!payload || typeof payload !== "object" || !payload.player) return null;
  const p = payload.player;
  const name = p.farmer_name || "Farmer";
  return {
    source: "tables",
    name,
    initials: initials(name),
    savedAt: payload.saved_at || null,
    level: num(p.level),
    season: num(p.season),
    points: num(p.points),
    coins: num(p.coins),
    daysPlayed: num(p.days_played),
    streak: num(p.streak),
    bestStreak: num(p.best_streak),
    playSeconds: num(p.play_seconds),
    achievements: (payload.achievements || []).filter(r => r && r.badge_id).map(badge).sort(byNewest),
    certificates: [],
  };
}

async function rpc(url, key, fn, body, { fetch: f = fetch, signal } = {}) {
  const res = await f(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  return res;
}

/* Reads a player's progress. Resolves to null when the code has no TemoLima save. */
export async function fetchPlayerProgress(code, { url, key, fetch: f, signal } = {}) {
  const player = normaliseCode(code);
  if (!PLAYER_CODE_RE.test(player)) throw new Error("That isn't a TemoLima player code");
  const opts = { fetch: f || fetch, signal };

  const viaTables = await rpc(url, key, "temolima_progress", { p_player: player }, opts);
  if (viaTables.ok) return progressFromTables(await viaTables.json());
  if (viaTables.status !== 404) throw new Error(`TemoLima progress unavailable (${viaTables.status})`);

  const viaSave = await rpc(url, key, "temolima_restore", { p_player: player }, opts);
  if (!viaSave.ok) throw new Error(`TemoLima saves unavailable (${viaSave.status})`);
  return progressFromRestore(await viaSave.json());
}

/* 8460 → "2h 21m" */
export function fmtPlayTime(seconds) {
  const m = Math.floor(num(seconds) / 60);
  if (m < 1) return "under a minute";
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}
