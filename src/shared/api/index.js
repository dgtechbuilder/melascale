/* Picks the backend: Supabase when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
   are set at build time, otherwise the in-browser demo workspace.
   Either way the game list comes from the live MelaPress catalogue (see ../catalog.js):
   in Supabase mode it is the same public.games table; in demo mode the catalogue is
   merged into the browser workspace on load. */
import { demoApi } from "./demo.js";
import { createSupabaseApi } from "./supabase.js";
import { fetchCatalogGames } from "../catalog.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = url && anon ? createSupabaseApi(url, anon) : demoApi;
export const isDemo = api.mode === "demo";

/* Live catalogue status, for the "live from MelaPress" notes in the UI. */
export const catalog = { state: "loading", count: 0, error: null };

let pending = null;
function syncCatalog() {
  if (!pending) {
    pending = fetchCatalogGames()
      .then(games => { Object.assign(catalog, { state: "live", count: games.length, error: null }); return games; })
      .catch(e => { Object.assign(catalog, { state: "error", error: e.message }); pending = null; return null; });
  }
  return pending.then(games => {
    if (games && isDemo) demoApi.syncCatalog(games);
    else if (games) api.notify?.();
    return games;
  });
}

if (typeof window !== "undefined") {
  syncCatalog();
  if (isDemo) {
    const reset = demoApi.reset.bind(demoApi);
    demoApi.reset = async () => { await reset(); await syncCatalog(); };
  }
}
