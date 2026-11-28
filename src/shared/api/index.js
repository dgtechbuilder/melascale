/* Picks the backend: Supabase when VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
   are set at build time, otherwise the in-browser demo workspace. */
import { demoApi } from "./demo.js";
import { createSupabaseApi } from "./supabase.js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const api = url && anon ? createSupabaseApi(url, anon) : demoApi;
export const isDemo = api.mode === "demo";
