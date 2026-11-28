/* Live game catalogue from the MelaPress Supabase project (public.games).
   The table is publicly readable (RLS: "Game catalog is publicly readable"), so the
   publishable key below is all it takes. Override with VITE_CATALOG_SUPABASE_URL and
   VITE_CATALOG_SUPABASE_KEY to point at another project. Nothing here writes. */
import { hashString } from "./format.js";

export const CATALOG_URL = (import.meta.env.VITE_CATALOG_SUPABASE_URL || "https://nxjwjklugmwnrlngzrub.supabase.co").replace(/\/$/, "");
export const CATALOG_KEY = import.meta.env.VITE_CATALOG_SUPABASE_KEY || "sb_publishable_zV6LWeLUBEDvxO9V_ifnOQ_jvbnx6bi";
export const CATALOG_SOURCE = "MelaPress";

const COLUMNS = "id,slug,title,subtitle,category,platforms,release_status,status,description,tags,created_at";
const HUES = [145, 210, 270, 30, 350, 55, 190, 320];

/* Raw rows from public.games, ordered by title. */
export async function fetchCatalogRows({ signal } = {}) {
  const res = await fetch(`${CATALOG_URL}/rest/v1/games?select=${COLUMNS}&order=title`, {
    headers: { apikey: CATALOG_KEY, Authorization: `Bearer ${CATALOG_KEY}` },
    signal,
  });
  if (!res.ok) throw new Error(`Game catalogue unavailable (${res.status})`);
  return res.json();
}

/* "PC, Console (Steam, Xbox)" → ["pc", "console"]. Unknown platforms are dropped. */
export function parsePlatforms(text) {
  const t = String(text || "").toLowerCase();
  const out = [];
  if (/mobile|android|ios|phone/.test(t)) out.push("mobile");
  if (/web|browser|digital/.test(t)) out.push("webgl");
  if (/\bpc\b|steam|windows|mac/.test(t)) out.push("pc");
  if (/console|xbox|playstation|switch|minecraft/.test(t)) out.push("console");
  return out;
}

/* Catalogue release wording → Mela Scale game status. */
export function statusFromRelease(release, status) {
  const r = String(release || "").toLowerCase();
  if (/beta/.test(r)) return "beta";
  if (/available|launched|released|shipped|out now/.test(r) || status === "released") return "live";
  if (/pause|hold/.test(r)) return "paused";
  return "development";
}

function abbrOf(name) {
  const words = String(name || "").replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* Key used to recognise the same game across sources: first word of its name. */
export function gameKey(name) {
  return String(name || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim().split(/\s+/)[0] || "";
}

/* A catalogue row in the shape the portals use. `extra` holds Mela Scale's own
   per-game settings (public.mela_games) when the backend has them. */
export function toMelaGame(row, extra = null) {
  const x = extra || {};
  return {
    id: row.id,
    slug: row.slug,
    name: row.title,
    subtitle: row.subtitle || null,
    abbr: x.abbr || abbrOf(row.title),
    hue: x.hue ?? HUES[hashString(row.slug || row.id) % HUES.length],
    studio: x.studio || "Kunta Content",
    genre: x.genre || row.category || "",
    platforms: x.platforms && x.platforms.length ? x.platforms : parsePlatforms(row.platforms),
    status: x.status || statusFromRelease(row.release_status, row.status),
    mau: Number(x.mau) || 0,
    dau: 0,
    description: row.description || "",
    release_status: row.release_status || null,
    catalog_id: row.id,
    catalog_source: CATALOG_SOURCE,
    created_at: row.created_at,
  };
}

export async function fetchCatalogGames(opts) {
  return (await fetchCatalogRows(opts)).map(r => toMelaGame(r));
}
