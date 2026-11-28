/* Supabase backend. Same interface as demo.js; row-level security in
   supabase/migrations decides what staff and client users can see. */
import { createClient } from "@supabase/supabase-js";
import { toMelaGame } from "../catalog.js";
import { PLATFORMS, labelOf } from "../schema.js";

export function createSupabaseApi(url, anonKey) {
  const sb = createClient(url, anonKey, { auth: { persistSession: true, detectSessionInUrl: true } });
  const listeners = new Set();
  const ok = ({ data, error }) => { if (error) throw new Error(error.message); return data; };
  const notify = () => listeners.forEach(fn => { try { fn(); } catch (e) {} });

  async function sessionInfo() {
    const { data } = await sb.auth.getSession();
    const user = data.session?.user;
    if (!user) return null;
    const email = user.email;
    const { data: staff } = await sb.from("staff").select("email,name,role").ilike("email", email).maybeSingle();
    if (staff) return { kind: "staff", email, name: staff.name || email };
    const { data: cu } = await sb.from("client_users").select("client_id, clients(name)").ilike("email", email).limit(1).maybeSingle();
    if (cu) return { kind: "client", client_id: cu.client_id, email, name: cu.clients?.name || email };
    return { kind: "none", email, name: email };
  }

  sb.auth.onAuthStateChange(() => notify());

  const api = {
    mode: "supabase",
    capabilities: { simulate: false, reset: false },
    ingestUrl: url.replace(/\/$/, "") + "/functions/v1/ingest",
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    async getSession() { return sessionInfo(); },
    async signInWithEmail(email, redirectTo) {
      ok(await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo || window.location.href } }));
      return { sent: true };
    },
    async signInAsStaff() { throw new Error("Use email sign-in"); },
    async signInAsClient() { throw new Error("Use email sign-in"); },
    async signOut() { await sb.auth.signOut(); notify(); },

    /* Games are the MelaPress catalogue (public.games) plus Mela Scale's settings (public.mela_games). */
    async listGames() {
      const rows = ok(await sb.from("games").select("*, mela_games(*)").order("created_at"));
      return rows.map(r => toMelaGame(r, Array.isArray(r.mela_games) ? r.mela_games[0] : r.mela_games));
    },
    async saveGame(g) {
      // Existing catalogue games: only the title and description are written back to MelaPress.
      // Genre, platforms and status live in mela_games, so the catalogue's own wording is kept.
      const game = g.id
        ? ok(await sb.from("games").update({ title: g.name, description: g.description || null }).eq("id", g.id).select().single())
        : ok(await sb.from("games").insert({
            slug: g.slug, title: g.name, description: g.description || null, category: g.genre || null,
            platforms: (g.platforms || []).map(p => labelOf(PLATFORMS, p)).join(", ") || null, release_status: "In development",
          }).select().single());
      const extra = ok(await sb.from("mela_games").upsert({
        game_id: game.id, abbr: g.abbr || null, hue: g.hue ?? null, studio: g.studio || "Kunta Content", genre: g.genre || null,
        platforms: g.platforms || [], status: g.status || "development", mau: Number(g.mau) || 0, updated_at: new Date().toISOString(),
      }).select().single());
      notify();
      return toMelaGame(game, extra);
    },

    async listPlacements(gameId) {
      let q = sb.from("placements").select("*").order("name");
      if (gameId) q = q.eq("game_id", gameId);
      return ok(await q);
    },
    async savePlacement(p) {
      const { id, ...rest } = p;
      const row = id ? ok(await sb.from("placements").update(rest).eq("id", id).select().single())
                     : ok(await sb.from("placements").insert(rest).select().single());
      notify(); return row;
    },
    async deletePlacement(id) { ok(await sb.from("placements").delete().eq("id", id)); notify(); },

    async listClients() { return ok(await sb.from("clients").select("*").order("name")); },
    async saveClient(c) {
      const { id, ...rest } = c;
      const row = id ? ok(await sb.from("clients").update(rest).eq("id", id).select().single())
                     : ok(await sb.from("clients").insert(rest).select().single());
      notify(); return row;
    },
    async listClientUsers(clientId) {
      let q = sb.from("client_users").select("*").order("created_at");
      if (clientId) q = q.eq("client_id", clientId);
      return ok(await q);
    },
    async addClientUser(clientId, email) {
      const row = ok(await sb.from("client_users").insert({ client_id: clientId, email: email.toLowerCase(), role: "viewer" }).select().single());
      notify(); return row;
    },
    async removeClientUser(id) { ok(await sb.from("client_users").delete().eq("id", id)); notify(); },

    async listCampaigns(filter = {}) {
      let q = sb.from("campaigns").select("*").order("start_date", { ascending: false });
      if (filter.clientId) q = q.eq("client_id", filter.clientId);
      if (filter.gameId) q = q.eq("game_id", filter.gameId);
      return ok(await q);
    },
    async saveCampaign(c) {
      const { id, ...rest } = c;
      const row = id ? ok(await sb.from("campaigns").update(rest).eq("id", id).select().single())
                     : ok(await sb.from("campaigns").insert(rest).select().single());
      notify(); return row;
    },
    async deleteCampaign(id) { ok(await sb.from("campaigns").delete().eq("id", id)); notify(); },

    async listApiKeys(gameId) {
      return ok(await sb.from("api_keys").select("id,game_id,label,prefix,created_at,last_used_at,revoked_at").eq("game_id", gameId).order("created_at"));
    },
    async createApiKey(gameId, label) {
      const data = ok(await sb.rpc("create_api_key", { p_game: gameId, p_label: label || "Game client" }));
      const rec = Array.isArray(data) ? data[0] : data;
      notify();
      return { key: rec.api_key, record: { id: rec.id, game_id: gameId, label, prefix: rec.api_key.slice(0, 12), created_at: new Date().toISOString(), last_used_at: null, revoked_at: null } };
    },
    async revokeApiKey(id) { ok(await sb.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", id)); notify(); },

    async ingest(apiKey, events) {
      const res = await fetch(api.ingestUrl, {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": apiKey },
        body: JSON.stringify({ events }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { const e = new Error(body.error || `Ingest failed (${res.status})`); e.status = res.status; throw e; }
      notify();
      return body;
    },

    async listEvents({ gameId, limit = 50 } = {}) {
      let q = sb.from("events").select("id,game_id,placement_id,type,session_id,player_id,platform,region,ts,props,source").order("ts", { ascending: false }).limit(limit);
      if (gameId) q = q.eq("game_id", gameId);
      return ok(await q);
    },

    async getRollups({ gameId, from, to }) {
      return ok(await sb.rpc("rollup_daily", { p_game: gameId, p_from: from, p_to: to })) || [];
    },
    async getReach({ gameId, placementIds, from, to }) {
      const n = ok(await sb.rpc("unique_reach", { p_game: gameId, p_placements: placementIds, p_from: from, p_to: to }));
      return Number(n) || 0;
    },
    async ingestHealth() {
      return ok(await sb.rpc("ingest_health")) || [];
    },
  };
  return api;
}
