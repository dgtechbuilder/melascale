/* Demo backend: the whole platform in the browser (localStorage).
   Used when no Supabase project is configured, e.g. on GitHub Pages. */
import { buildSeed } from "../seed.js";
import { addDays, isoDay, hashString } from "../format.js";
import { validateBatch } from "../ingest.js";
import { applyEventToRollups, rollupMapToRows, syntheticRows } from "../rollups.js";
import { gameKey } from "../catalog.js";

const STORAGE_KEY = "mela-scale.demo.v1";
const SESSION_KEY = "mela-scale.demo.session"; // + ".staff" / ".client": each portal keeps its own demo login
const MAX_EVENTS = 400;

let state = null;
const listeners = new Set();
const synthCache = new Map();

function load() {
  if (state) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch (e) { state = null; }
  if (!state || !state.games) state = buildSeed(isoDay());
  return state;
}
function emit() { listeners.forEach(fn => { try { fn(); } catch (e) {} }); }
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage full or blocked: keep in memory */ }
  listeners.forEach(fn => { try { fn(); } catch (e) {} });
}
const uid = (p) => p + "_" + Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const clone = (x) => JSON.parse(JSON.stringify(x));

async function sha256(text) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return "fnv" + hashString(text).toString(16);
  }
}
function randomKey() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return "msk_" + Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Cross-tab sync: the admin portal and client portal see each other's writes.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) { state = null; synthCache.clear(); emit(); }
    if (e.key && e.key.startsWith(SESSION_KEY)) emit();
  });
}

export const demoApi = {
  mode: "demo",
  capabilities: { simulate: true, reset: true },

  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

  /* ── auth (demo: pick who you are) ── */
  async getSession(portal = "client") {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY + "." + portal) || "null"); } catch (e) { return null; }
  },
  async signInAsStaff() {
    const s = load().staff[0];
    const session = { kind: "staff", email: s.email, name: s.name };
    try { localStorage.setItem(SESSION_KEY + ".staff", JSON.stringify(session)); } catch (e) {}
    emit();
    return session;
  },
  async signInAsClient(clientId) {
    const c = load().clients.find(x => x.id === clientId);
    if (!c) throw new Error("Unknown client account");
    const u = load().client_users.find(x => x.client_id === clientId);
    const session = { kind: "client", client_id: clientId, email: u ? u.email : c.contact_email, name: c.name };
    try { localStorage.setItem(SESSION_KEY + ".client", JSON.stringify(session)); } catch (e) {}
    emit();
    return session;
  },
  async signInWithEmail() { throw new Error("Email sign-in needs a Supabase project. In demo mode, pick an account."); },
  async signOut(portal = "client") { try { localStorage.removeItem(SESSION_KEY + "." + portal); } catch (e) {} emit(); },

  /* ── games ── */
  async listGames() { return clone(load().games); },
  async saveGame(g) {
    const s = load();
    if (g.id) {
      const i = s.games.findIndex(x => x.id === g.id);
      s.games[i] = { ...s.games[i], ...g };
    } else {
      if (s.games.some(x => x.slug === g.slug)) throw new Error(`A game with the id "${g.slug}" already exists`);
      g = { ...g, id: uid("g"), created_at: now(), seeded: false, mau: g.mau || 0, dau: 0 };
      s.games.push(g);
    }
    synthCache.clear();
    save();
    return clone(s.games.find(x => x.id === g.id));
  },

  /* ── placements ── */
  async listPlacements(gameId) {
    const all = load().placements;
    return clone(gameId ? all.filter(p => p.game_id === gameId) : all);
  },
  async savePlacement(p) {
    const s = load();
    if (p.id) {
      const i = s.placements.findIndex(x => x.id === p.id);
      s.placements[i] = { ...s.placements[i], ...p };
    } else {
      if (s.placements.some(x => x.game_id === p.game_id && x.key === p.key)) throw new Error(`Placement key "${p.key}" is already used in this game`);
      p = { ...p, id: uid("p") };
      s.placements.push(p);
    }
    synthCache.clear();
    save();
    return clone(p);
  },
  async deletePlacement(id) {
    const s = load();
    if (s.campaigns.some(c => c.placement_ids.includes(id))) throw new Error("This placement is part of a campaign. Remove it from the campaign first.");
    s.placements = s.placements.filter(p => p.id !== id);
    save();
  },

  /* ── clients & their users ── */
  async listClients() { return clone(load().clients); },
  async saveClient(c) {
    const s = load();
    if (c.id) {
      const i = s.clients.findIndex(x => x.id === c.id);
      s.clients[i] = { ...s.clients[i], ...c };
    } else {
      c = { ...c, id: uid("c"), created_at: now(), hue: hashString(c.name) % 360 };
      s.clients.push(c);
    }
    save();
    return clone(c);
  },
  async listClientUsers(clientId) {
    const all = load().client_users;
    return clone(clientId ? all.filter(u => u.client_id === clientId) : all);
  },
  async addClientUser(clientId, email) {
    const s = load();
    if (s.client_users.some(u => u.client_id === clientId && u.email.toLowerCase() === email.toLowerCase())) throw new Error("That person already has access");
    const u = { id: uid("cu"), client_id: clientId, email, role: "viewer", created_at: now() };
    s.client_users.push(u);
    save();
    return clone(u);
  },
  async removeClientUser(id) {
    const s = load();
    s.client_users = s.client_users.filter(u => u.id !== id);
    save();
  },

  /* ── campaigns ── */
  async listCampaigns(filter = {}) {
    let all = load().campaigns;
    if (filter.clientId) all = all.filter(c => c.client_id === filter.clientId);
    if (filter.gameId) all = all.filter(c => c.game_id === filter.gameId);
    return clone(all);
  },
  async saveCampaign(c) {
    const s = load();
    if (c.id) {
      const i = s.campaigns.findIndex(x => x.id === c.id);
      s.campaigns[i] = { ...s.campaigns[i], ...c };
    } else {
      c = { ...c, id: uid("cmp") };
      s.campaigns.push(c);
    }
    save();
    return clone(c);
  },
  async deleteCampaign(id) {
    const s = load();
    s.campaigns = s.campaigns.filter(c => c.id !== id);
    save();
  },

  /* ── API keys ── */
  async listApiKeys(gameId) {
    return clone(load().api_keys.filter(k => k.game_id === gameId)).map(({ hash, ...k }) => k);
  },
  async createApiKey(gameId, label) {
    const key = randomKey();
    const rec = { id: uid("k"), game_id: gameId, label: label || "Game client", prefix: key.slice(0, 12), hash: await sha256(key), created_at: now(), last_used_at: null, revoked_at: null };
    const s = load();
    s.api_keys.push(rec);
    save();
    const { hash, ...pub } = rec;
    return { key, record: pub };
  },
  async revokeApiKey(id) {
    const s = load();
    const k = s.api_keys.find(x => x.id === id);
    if (k) k.revoked_at = now();
    save();
  },

  /* ── ingest: what a game calls ── */
  async ingest(apiKey, events) {
    const s = load();
    const hash = await sha256(String(apiKey || ""));
    const key = s.api_keys.find(k => k.hash === hash && !k.revoked_at);
    if (!key) {
      const err = new Error("Invalid or revoked API key");
      err.status = 401;
      throw err;
    }
    return ingestForGame(key.game_id, events, key);
  },

  async listEvents({ gameId, limit = 50 } = {}) {
    let ev = load().events;
    if (gameId) ev = ev.filter(e => e.game_id === gameId);
    return clone(ev.slice(-limit).reverse());
  },

  /* ── analytics ── */
  async getRollups({ gameId, from, to }) {
    const s = load();
    const game = s.games.find(g => g.id === gameId);
    if (!game) return [];
    const placements = s.placements.filter(p => p.game_id === gameId);
    const ck = [gameId, from, to, placements.length].join("|");
    if (!synthCache.has(ck)) synthCache.set(ck, syntheticRows(game, placements, from, to));
    const byId = Object.fromEntries(s.placements.map(p => [p.id, p]));
    const live = rollupMapToRows(s.live_rollups[gameId] || {}, gameId, byId).filter(r => r.day >= from && r.day <= to);
    return synthCache.get(ck).concat(live);
  },

  /* Unique players exposed to these placements. Synthetic history has no player ids,
     so the demo estimates reach from daily exposure with a repeat-visit factor. */
  async getReach({ gameId, placementIds, from, to }) {
    const rows = await demoApi.getRollups({ gameId, from, to });
    const set = new Set(placementIds);
    let exposures = 0;
    for (const r of rows) if (r.placement_id && set.has(r.placement_id)) exposures += r.viewable;
    const s = load();
    const ids = new Set(s.events.filter(e => e.game_id === gameId && set.has(e.placement_id) && e.ts.slice(0, 10) >= from && e.ts.slice(0, 10) <= to).map(e => e.player_id || e.session_id));
    return Math.round(exposures * 0.38) + ids.size;
  },

  async ingestHealth() {
    const s = load();
    const today = isoDay();
    return s.games.map(g => {
      const ev = s.events.filter(e => e.game_id === g.id);
      const last = ev.length ? ev[ev.length - 1].ts : null;
      const keys = s.api_keys.filter(k => k.game_id === g.id && !k.revoked_at);
      const synthetic = g.seeded && g.dau ? Math.round(g.dau * 9.5) : 0;
      const liveToday = Object.entries(s.live_rollups[g.id] || {}).filter(([k]) => k.startsWith(today))
        .reduce((a, [, m]) => a + m.sessions + m.impressions + m.viewable + m.interactions + m.clicks + m.conversions, 0);
      return {
        game_id: g.id,
        keys: keys.length,
        last_event_at: last || (g.seeded ? new Date(Date.now() - 60_000 * (1 + (hashString(g.id) % 9))).toISOString() : null),
        events_today: synthetic + liveToday,
        connected: g.seeded || ev.length > 0,
      };
    });
  },

  /* ── live catalogue ──
     Games from the MelaPress catalogue join the demo workspace. A demo game with the
     same first word (HIRU, IMAGINARIUM) takes the catalogue's name and description and
     keeps its placements and traffic; the rest are added with no traffic yet. */
  syncCatalog(catalog) {
    const s = load();
    let changed = false;
    for (const c of catalog) {
      const match = s.games.find(g => g.catalog_id === c.catalog_id)
        || s.games.find(g => !g.catalog_id && (g.slug === c.slug || gameKey(g.name) === gameKey(c.name)));
      if (match) {
        const next = { ...match, catalog_id: c.catalog_id, catalog_source: c.catalog_source, name: c.name, subtitle: c.subtitle,
          description: c.description || match.description, release_status: c.release_status };
        if (JSON.stringify(next) !== JSON.stringify(match)) { Object.assign(match, next); changed = true; }
      } else {
        s.games.push({ ...c, seeded: false });
        changed = true;
      }
    }
    if (changed) { synthCache.clear(); save(); }
    return changed;
  },

  /* ── demo-only helpers ── */
  async reset() {
    state = buildSeed(isoDay());
    synthCache.clear();
    save();
  },
  simulateTick() {
    const s = load();
    const live = s.games.filter(g => g.status === "live" || g.status === "beta");
    if (!live.length) return;
    const game = live[Math.floor(Math.random() * live.length)];
    const pls = s.placements.filter(p => p.game_id === game.id);
    const plats = game.platforms && game.platforms.length ? game.platforms : ["webgl"];
    const platform = plats[Math.floor(Math.random() * plats.length)];
    const region = ["na", "emea", "apac", "latam"][Math.floor(Math.random() * 4)];
    const sid = "sim-" + Math.random().toString(36).slice(2, 8);
    const pid = "player-" + Math.floor(Math.random() * 5000);
    const batch = [{ event: "session_start", session_id: sid, player_id: pid, platform, region }];
    for (const p of pls) {
      if (Math.random() < 0.55) {
        batch.push({ event: "impression", placement: p.key, session_id: sid, player_id: pid, platform, region });
        if (Math.random() < 0.8) batch.push({ event: "viewable", placement: p.key, session_id: sid, player_id: pid, platform, region });
        if (Math.random() < 0.12) batch.push({ event: "interaction", placement: p.key, session_id: sid, player_id: pid, platform, region });
      }
    }
    batch.push({ event: "session_end", session_id: sid, player_id: pid, platform, region, props: { duration_sec: 600 + Math.round(Math.random() * 1500) } });
    ingestForGame(game.id, batch, null, "simulator");
  },
};

function ingestForGame(gameId, events, key, source = "sdk") {
  const s = load();
  const placements = s.placements.filter(p => p.game_id === gameId);
  const { accepted, rejected } = validateBatch(events, placements);
  const map = s.live_rollups[gameId] || (s.live_rollups[gameId] = {});
  for (const ev of accepted) {
    applyEventToRollups(map, ev);
    s.events.push({ id: uid("e"), game_id: gameId, source, ...ev });
  }
  if (s.events.length > MAX_EVENTS) s.events = s.events.slice(-MAX_EVENTS);
  if (key) {
    const k = s.api_keys.find(x => x.id === key.id);
    if (k) k.last_used_at = now();
  }
  save();
  return { accepted: accepted.length, rejected };
}
