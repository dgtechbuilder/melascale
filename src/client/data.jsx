import React from "react";
/* Client dashboard data. The `let` exports start as the design's sample values and are
   replaced with the signed-in client's campaign figures by applyCampaignView(). Sections
   without a live source yet (social, holdout lift, cohorts, AI insights) keep sample data
   and are labelled "Sample data" in the UI. */

export let CAMPAIGN = {
  brand: "Northwind Goods",
  studio: "Kunta Content",
  game: "Lima Farming Game",
  campaign: "Northwind Goods · Spring Planting takeover",
  startedAt: "Apr 21, 2026",
  endsAt: "Jun 1, 2026",
  budget: 480000,
  spent: 312800,
  weekOf: 4,
  weeksTotal: 6,
};

export const PLATFORMS = [
  { id: "mobile", label: "Mobile", short: "MOB", color: "oklch(0.45 0.16 285)" },
  { id: "webgl", label: "WebGL", short: "WEB", color: "oklch(0.62 0.15 50)" },
];

/* In-game placement locations — sub-areas of Lima Farming */
export let GAMES = [
  { id: "all", label: "All maps", short: "ALL" },
  { id: "sunfield", label: "Sunfield Valley", short: "SUN", color: "oklch(0.7 0.14 80)" },
  { id: "harvest", label: "Harvest Hollow", short: "HRV", color: "oklch(0.58 0.13 35)" },
  { id: "coastal", label: "Coastal Acres", short: "CST", color: "oklch(0.58 0.13 200)" },
  { id: "cedar", label: "Cedar Heights", short: "CDR", color: "oklch(0.5 0.13 155)" },
  { id: "highland", label: "Highland Pastures", short: "HLD", color: "oklch(0.62 0.1 290)" },
];

export const PLACEMENTS = [
  { id: "billboard", label: "In-game Billboard", icon: "▭" },
  { id: "cutscene", label: "Cutscene", icon: "▶" },
  { id: "cosmetic", label: "Cosmetic", icon: "◆" },
  { id: "environmental", label: "Environmental", icon: "▣" },
];

export const REGIONS = [
  { id: "na", label: "North America", code: "NA" },
  { id: "emea", label: "EMEA", code: "EU" },
  { id: "latam", label: "LATAM", code: "LA" },
  { id: "apac", label: "APAC", code: "AP" },
];

export const COHORTS = [
  { id: "core", label: "Daily farmers" },
  { id: "lapsed", label: "Lapsed" },
  { id: "new", label: "New (≤7d)" },
  { id: "whales", label: "Season-pass" },
];

export const DATE_RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "qtd", label: "Quarter to date" },
  { id: "ytd", label: "Year to date" },
  { id: "all", label: "All time" },
];

/* deterministic pseudo-random */
export function rnd(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
export function buildSeries(seed, len, base, vol) {
  const r = rnd(seed);
  const out = [];
  let v = base;
  for (let i = 0; i < len; i++) {
    v += (r() - 0.5) * vol;
    v = Math.max(base * 0.6, Math.min(base * 1.45, v));
    out.push(v);
  }
  return out;
}

/* ─── Top-of-dashboard KPIs ─── */
export let KPIS = [
  {
    id: "reach",
    label: "Unique reach",
    value: 4.82,
    unit: "M",
    delta: +14.6,
    spark: buildSeries(11, 24, 4.4, 0.4),
    sub: "of 12.4M MAU · 38.9%",
  },
  {
    id: "session",
    label: "Avg session length",
    value: 24.4,
    unit: "min",
    delta: +2.8,
    spark: buildSeries(22, 24, 22, 2),
    sub: "+3.6m vs non-exposed",
  },
  {
    id: "depth",
    label: "Engagement depth",
    value: 6.1,
    unit: "events / session",
    delta: +18.3,
    spark: buildSeries(33, 24, 5.5, 1.2),
    sub: "interactions per exposed session",
  },
];

/* ─── Business impact panel ─── */
export let FUNNEL = [
  { stage: "Impressions", value: 18_240_000, pct: 100 },
  { stage: "Viewable impressions", value: 15_960_000, pct: 87.5 },
  { stage: "Engaged sessions", value: 4_820_000, pct: 26.4 },
  { stage: "Brand site visits", value: 612_000, pct: 3.36 },
  { stage: "Attributed conversions", value: 88_400, pct: 0.48 },
];

export const BUSINESS_TILES = [
  {
    id: "uplift",
    label: "Monetization uplift",
    value: "+11.2%",
    sub: "in-game IAP per exposed user",
    delta: +2.4,
    detail: "Branded crop seeds correlate with a 0.32 ARPDAU lift on exposed users vs holdout.",
  },
  {
    id: "retention",
    label: "D7 retention lift",
    value: "+6.8pp",
    sub: "exposed vs holdout cohort",
    delta: +1.1,
    detail: "Exposed players return at 41.2% on day 7 vs 34.4% holdout.",
  },
  {
    id: "ltv",
    label: "Attributed LTV",
    value: "$2.14",
    sub: "incremental, per exposed user",
    delta: +0.42,
    detail: "Lifts strongest in APAC mobile cohort and NA WebGL season-pass.",
  },
];

/* ─── Amplification ─── */
export const AMPLIFICATION = {
  socialMentions: 14820,
  socialDelta: +28.4,
  sentiment: { positive: 71, neutral: 22, negative: 7 },
  ugc: 3214,
  topInfluencers: [
    { name: "FarmGrl_Mia",     reach: 1240000, platform: "TikTok",  tag: "official" },
    { name: "GreenAcres_Jake", reach:  860000, platform: "YouTube", tag: "official" },
    { name: "Plowscape",       reach:  410000, platform: "Twitch",  tag: "organic" },
    { name: "harvest.daily",   reach:  282000, platform: "TikTok",  tag: "organic" },
    { name: "SunfieldSam",     reach:  198000, platform: "YouTube", tag: "organic" },
  ],
};

/* ─── Platform performance ─── */
export let PLATFORM_PERF = [
  { id: "mobile", label: "Mobile", reach: 3.21, sessionLen: 22.1, ctr: 4.4, roas: 3.1, share: 67 },
  { id: "webgl",  label: "WebGL",  reach: 1.61, sessionLen: 28.9, ctr: 5.8, roas: 4.2, share: 33 },
];

/* ─── Placement rows ─── */
export let PLACEMENT_ROWS = [
  { placement: "Cosmetic",      game: "Sunfield Valley",   impressions: 2_410_000, ctr: 4.8, recall: 52, cpe: 0.14, lift: 31, status: "up",   detail: "Northwind branded crop seeds", platform: "Mobile" },
  { placement: "Environmental", game: "Harvest Hollow",    impressions: 1_870_000, ctr: 3.2, recall: 44, cpe: 0.17, lift: 24, status: "up",   detail: "Northwind grain silo signage", platform: "WebGL"  },
  { placement: "Cutscene",      game: "Cedar Heights",     impressions:   980_000, ctr: 6.1, recall: 49, cpe: 0.21, lift: 22, status: "flat", detail: "Spring planting short",   platform: "Mobile" },
  { placement: "In-game Billboard",     game: "Coastal Acres",     impressions: 3_120_000, ctr: 1.4, recall: 28, cpe: 0.09, lift:  8, status: "down", detail: "Market road hoarding",    platform: "Mobile" },
  { placement: "Cosmetic",      game: "Highland Pastures", impressions:   612_000, ctr: 5.3, recall: 47, cpe: 0.19, lift: 28, status: "up",   detail: "Northwind branded tractor wrap", platform: "WebGL" },
  { placement: "Environmental", game: "Cedar Heights",     impressions: 1_240_000, ctr: 2.7, recall: 35, cpe: 0.16, lift: 14, status: "flat", detail: "Branded feed bags",       platform: "Mobile" },
  { placement: "In-game Billboard",     game: "Sunfield Valley",   impressions: 2_800_000, ctr: 1.8, recall: 30, cpe: 0.10, lift: 11, status: "down", detail: "Town square hoarding",    platform: "WebGL" },
];

export let REGION_DATA = [
  { id: "na",    label: "North America", impressions: 5.4, lift: 27, share: 38, roas: 3.8 },
  { id: "emea",  label: "EMEA",          impressions: 4.1, lift: 22, share: 29, roas: 3.1 },
  { id: "apac",  label: "APAC",          impressions: 3.6, lift: 31, share: 26, roas: 4.1 },
  { id: "latam", label: "LATAM",         impressions: 1.0, lift: 16, share:  7, roas: 2.4 },
];

export const COHORT_DATA = [
  { id: "core",   label: "Daily farmers", reach: 62, recall: 48, lift: 28 },
  { id: "lapsed", label: "Lapsed",        reach: 14, recall: 31, lift: 12 },
  { id: "new",    label: "New (≤7d)",     reach: 18, recall: 39, lift: 22 },
  { id: "whales", label: "Season-pass",   reach:  6, recall: 57, lift: 34 },
];

/* Daily series — now with both platforms */
export let ENGAGEMENT_DAYS = (() => {
  const days = 30;
  const m = buildSeries(101, days, 78, 14).map(v => Math.round(v * 10) / 10);
  const w = buildSeries(202, days, 42, 8).map(v => Math.round(v * 10) / 10);
  return Array.from({ length: days }, (_, i) => ({
    i,
    label: `D${i + 1}`,
    current: m[i] + w[i],          // total
    previous: (m[i] + w[i]) * 0.86, // prior-week baseline
    mobile: m[i],
    webgl: w[i],
  }));
})();

export let ACTIVITY = [
  { t: "12s ago", txt: "Northwind branded seeds in Sunfield Valley — 2.4M unique impressions", tag: "milestone" },
  { t: "44s ago", txt: "Cedar Heights season-change cutscene · CTR up to 6.3% (Mobile)",  tag: "up" },
  { t: "1m ago",  txt: "Coastal Acres billboard viewability dropped to 61% on Mobile",   tag: "warn" },
  { t: "3m ago",  txt: "FarmGrl_Mia · TikTok mention · 1.24M reach (organic)",           tag: "info" },
  { t: "6m ago",  txt: "APAC lapsed cohort returning — 8.4K incremental sessions",      tag: "info" },
  { t: "9m ago",  txt: "Weekly report Wk 20 generated — awaiting review",                tag: "info" },
];

export const INSIGHTS = [
  {
    title: "WebGL is driving 1.4× the ROAS of Mobile — funnel quality, not reach",
    body: "Mobile contributes 67% of impressions but WebGL outperforms on ROAS (4.2× vs 3.1×). The lift is concentrated in cosmetic placements where WebGL session length is 31% longer. Suggest shifting 15% of media weight from low-attention Mobile billboards to WebGL cosmetic surfaces.",
    impact: "high",
    tags: ["webgl", "roas"],
  },
  {
    title: "Coastal Acres billboards are underperforming viewability floor",
    body: "Billboard impressions in Coastal Acres on Mobile dropped to 61% viewability this week — below the 70% IAB threshold. The harbor-fog weather event added on May 9 reduced billboard dwell time by ~38%. Estimated waste: $14.2K in week 4.",
    impact: "high",
    tags: ["billboard", "coastal", "mobile"],
  },
  {
    title: "APAC lapsed farmers convert 2.1× the baseline after exposure",
    body: "APAC's lapsed cohort returns at 47% after exposure to the spring planting cutscene (+9pp WoW). Influencer co-promo with FarmGrl_Mia drove 38% of this lift organically.",
    impact: "medium",
    tags: ["apac", "lapsed", "influencer"],
  },
];

export const REPORTS = [
  { id: "wk20", week: "Wk 20 · May 11–17",   title: "Northwind × Lima Farming — weekly intelligence", status: "ready",   delta: +6.2, lead: "ROAS 3.42× · +21% WoW" },
  { id: "wk19", week: "Wk 19 · May 4–10",    title: "Northwind × Lima Farming — weekly intelligence", status: "ready",   delta: +2.1, lead: "Mobile reach plateaued, WebGL grew 18%" },
  { id: "wk18", week: "Wk 18 · Apr 27–May 3", title: "Northwind × Lima Farming — weekly intelligence", status: "ready",   delta: -1.4, lead: "In-game Billboard viewability soft on Mobile" },
  { id: "wk17", week: "Wk 17 · Apr 20–26",   title: "Northwind × Lima Farming — campaign kickoff",    status: "ready",   delta: +4.0, lead: "Launch wave — 1.2M unique reach in 7d" },
];

export const NAV = [
  { id: "overview",   label: "Campaign overview", icon: "◐" },
  { id: "analytics",  label: "Analytics",         icon: "◉" },
  { id: "placements", label: "Placements",        icon: "▣" },
  { id: "impact",     label: "Business impact",   icon: "△" },
  { id: "audience",   label: "Audience",          icon: "◇" },
  { id: "amp",        label: "Amplification",     icon: "↗", count: 14 },
  { id: "reports",    label: "Reports",           icon: "▦", count: 4 },
  { id: "insights",   label: "AI Chat Insights",          icon: "✦" },
  { id: "activity",   label: "Live activity",     icon: "●" },
];

export const NAV_FOOTER = [
  { id: "settings",     label: "Settings",       icon: "⚙" },
];

export { fmtNum, fmtMoney, fmtDelta } from "../shared/format.js";

export let TREND = { total: 487210, delta: 12.4 };

/* Swap in a campaign's computed view (see shared/metrics.js buildCampaignView). */
export function applyCampaignView(v) {
  CAMPAIGN = v.CAMPAIGN;
  KPIS = v.KPIS;
  ENGAGEMENT_DAYS = v.ENGAGEMENT_DAYS;
  TREND = v.TREND;
  PLACEMENT_ROWS = v.PLACEMENT_ROWS;
  FUNNEL = v.FUNNEL;
  PLATFORM_PERF = v.PLATFORM_PERF;
  REGION_DATA = v.REGION_DATA;
  ACTIVITY = v.ACTIVITY;
  GAMES = v.MAPS;
}
