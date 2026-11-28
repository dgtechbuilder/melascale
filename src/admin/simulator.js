/* Demo-only traffic simulator: plays a game session through the real ingest path
   every second so the dashboards move. Does nothing against Supabase. */
import { api } from "../shared/api/index.js";

let timer = null;
const subs = new Set();

export const simulator = {
  get running() { return !!timer; },
  available: !!(api.capabilities && api.capabilities.simulate),
  start() {
    if (timer || !this.available) return;
    timer = setInterval(() => api.simulateTick(), 1000);
    subs.forEach(f => f());
  },
  stop() {
    clearInterval(timer);
    timer = null;
    subs.forEach(f => f());
  },
  subscribe(f) { subs.add(f); return () => subs.delete(f); },
};
