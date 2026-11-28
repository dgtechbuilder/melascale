/* Demo workspace: Kunta Content's game portfolio, brand clients and campaigns.
   Dates are relative to "today" so the demo always looks current. */
import { addDays } from "./format.js";

export function buildSeed(today) {
  const games = [
    { id: "g_lima", slug: "lima-farming", name: "LIMA Farming Game", abbr: "LF", hue: 145, studio: "Kunta Content", genre: "Farming sim", platforms: ["mobile", "webgl"], status: "live", mau: 12_400_000, dau: 168_000, seeded: true, created_at: addDays(today, -400) + "T09:00:00Z",
      description: "Cosy farming sim set across five maps of the Lima valley." },
    { id: "g_mazu", slug: "mazu-runner", name: "MAZU Runner", abbr: "MR", hue: 210, studio: "Kunta Content", genre: "Endless runner", platforms: ["mobile"], status: "live", mau: 6_800_000, dau: 112_000, seeded: true, created_at: addDays(today, -300) + "T09:00:00Z",
      description: "Endless runner through coastal city streets." },
    { id: "g_sango", slug: "sango-platformer", name: "SANGO Platformer Game", abbr: "SP", hue: 270, studio: "Kunta Content", genre: "Platformer", platforms: ["webgl", "mobile"], status: "live", mau: 2_900_000, dau: 46_000, seeded: true, created_at: addDays(today, -220) + "T09:00:00Z",
      description: "Side-scrolling platformer with seasonal worlds." },
    { id: "g_hiru", slug: "hiru", name: "HIRU Game", abbr: "HG", hue: 30, studio: "Kunta Content", genre: "Action adventure", platforms: ["webgl"], status: "beta", mau: 640_000, dau: 14_000, seeded: true, created_at: addDays(today, -120) + "T09:00:00Z",
      description: "Mansa Assegai's action adventure, in open beta on WebGL." },
    { id: "g_kushaba", slug: "kushaba-fighting", name: "KUSHABA Fighting Game", abbr: "KF", hue: 350, studio: "Kunta Content", genre: "Fighting", platforms: ["pc", "console"], status: "development", mau: 0, dau: 0, seeded: false, created_at: addDays(today, -60) + "T09:00:00Z",
      description: "1v1 fighter. SDK integration in progress." },
    { id: "g_imaginarium", slug: "imaginarium-map", name: "IMAGINARIUM Map Game", abbr: "IM", hue: 55, studio: "Kunta Content", genre: "Exploration", platforms: ["webgl"], status: "development", mau: 0, dau: 0, seeded: false, created_at: addDays(today, -30) + "T09:00:00Z",
      description: "Map-building exploration game. Not yet sending analytics." },
  ];

  const P = (id, game_id, key, name, kind, location, platform = "all") => ({ id, game_id, key, name, kind, location, platform });
  const placements = [
    P("p_lima_seeds", "g_lima", "sunfield-seed-pack", "Branded crop seeds", "cosmetic", "Sunfield Valley"),
    P("p_lima_silo", "g_lima", "harvest-silo-sign", "Grain silo signage", "environmental", "Harvest Hollow"),
    P("p_lima_cutscene", "g_lima", "cedar-season-cutscene", "Season-change cutscene", "cutscene", "Cedar Heights"),
    P("p_lima_billboard", "g_lima", "coastal-market-billboard", "Market road billboard", "billboard", "Coastal Acres"),
    P("p_lima_tractor", "g_lima", "highland-tractor-wrap", "Tractor wrap", "cosmetic", "Highland Pastures"),
    P("p_lima_tutorial", "g_lima", "harvest-tutorial", "Smart tractor tutorial", "tutorial", "Harvest Hollow"),
    P("p_lima_square", "g_lima", "sunfield-square-billboard", "Town square billboard", "billboard", "Sunfield Valley"),
    P("p_mazu_billboard", "g_mazu", "harbor-billboard", "Harbor district billboard", "billboard", "Harbor"),
    P("p_mazu_shoes", "g_mazu", "runner-shoes", "Branded runner shoes", "cosmetic", "Character"),
    P("p_mazu_powerup", "g_mazu", "energy-powerup", "Energy drink power-up", "branded_item", "Gameplay"),
    P("p_sango_banner", "g_sango", "world2-banner", "World 2 banner", "billboard", "Spring World"),
    P("p_sango_event", "g_sango", "harvest-festival", "Harvest festival event", "event", "Autumn World"),
    P("p_hiru_relic", "g_hiru", "assegai-relic", "Sponsored relic item", "branded_item", "Act I"),
    P("p_hiru_intro", "g_hiru", "intro-cutscene", "Intro cutscene", "cutscene", "Prologue"),
    P("p_kushaba_arena", "g_kushaba", "arena-hoarding", "Arena hoarding", "billboard", "Main arena"),
  ];

  const clients = [
    { id: "c_hellotractor", name: "Hello Tractor", industry: "Agritech", contact_email: "partnerships@hellotractor.example", hue: 145, created_at: addDays(today, -90) + "T09:00:00Z" },
    { id: "c_northwind", name: "Northwind Goods", industry: "Agri supplies", contact_email: "brand@northwind.example", hue: 285, created_at: addDays(today, -200) + "T09:00:00Z" },
    { id: "c_coastal", name: "Coastal Brewing Co.", industry: "Beverages", contact_email: "marketing@coastalbrewing.example", hue: 200, created_at: addDays(today, -70) + "T09:00:00Z" },
    { id: "c_apex", name: "Apex Sportswear", industry: "Apparel", contact_email: "growth@apex.example", hue: 30, created_at: addDays(today, -45) + "T09:00:00Z" },
  ];

  const client_users = [
    { id: "cu_1", client_id: "c_hellotractor", email: "marketing@hellotractor.example", role: "viewer", created_at: addDays(today, -88) + "T09:00:00Z" },
    { id: "cu_2", client_id: "c_northwind", email: "brand@northwind.example", role: "viewer", created_at: addDays(today, -190) + "T09:00:00Z" },
    { id: "cu_3", client_id: "c_coastal", email: "marketing@coastalbrewing.example", role: "viewer", created_at: addDays(today, -60) + "T09:00:00Z" },
    { id: "cu_4", client_id: "c_apex", email: "growth@apex.example", role: "viewer", created_at: addDays(today, -40) + "T09:00:00Z" },
  ];

  const campaigns = [
    { id: "cmp_ht_lima", client_id: "c_hellotractor", game_id: "g_lima", name: "Smart tractor season", start_date: addDays(today, -42), end_date: addDays(today, 18), budget: 180_000, status: "active",
      placement_ids: ["p_lima_tractor", "p_lima_tutorial", "p_lima_square", "p_lima_silo"] },
    { id: "cmp_nw_lima", client_id: "c_northwind", game_id: "g_lima", name: "Spring planting takeover", start_date: addDays(today, -80), end_date: addDays(today, -5), budget: 480_000, status: "active",
      placement_ids: ["p_lima_seeds", "p_lima_cutscene", "p_lima_billboard"] },
    { id: "cmp_coastal_mazu", client_id: "c_coastal", game_id: "g_mazu", name: "Summer splash", start_date: addDays(today, -21), end_date: addDays(today, 40), budget: 95_000, status: "active",
      placement_ids: ["p_mazu_billboard", "p_mazu_powerup"] },
    { id: "cmp_apex_mazu", client_id: "c_apex", game_id: "g_mazu", name: "Runner kit launch", start_date: addDays(today, -14), end_date: addDays(today, 30), budget: 38_000, status: "active",
      placement_ids: ["p_mazu_shoes"] },
    { id: "cmp_apex_sango", client_id: "c_apex", game_id: "g_sango", name: "Harvest festival sponsor", start_date: addDays(today, 10), end_date: addDays(today, 50), budget: 41_000, status: "active",
      placement_ids: ["p_sango_event"] },
  ];

  return { games, placements, clients, client_users, campaigns, api_keys: [], events: [], live_rollups: {}, staff: [
    { id: "s_1", email: "admin@kuntacontent.example", name: "Kunta admin", role: "admin" },
  ] };
}
