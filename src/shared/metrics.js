/* Turns daily rollups into the numbers both portals show. */
import { addDays, daysBetween, fmtNum, fmtShortDate, pctChange, timeAgo } from "./format.js";
import { sumRows, groupBy, emptyMetrics, addInto } from "./rollups.js";
import { PLACEMENT_KINDS, PLATFORMS, REGIONS, labelOf } from "./schema.js";

export const WINDOW_DAYS = 30;

/* The 30-day window a campaign is reported on: ends today, or on the end date if it finished. */
export function campaignWindow(campaign, today) {
  const to = campaign.end_date < today ? campaign.end_date : today;
  const from = addDays(to, -(WINDOW_DAYS - 1));
  const prevFrom = addDays(from, -WINDOW_DAYS), prevTo = addDays(from, -1);
  const clip = d => (d < campaign.start_date ? campaign.start_date : d);
  // Only days inside the campaign count; the comparison period exists only if the campaign ran then.
  return { from, to, prevFrom, prevTo, curFrom: clip(from), prevClipFrom: clip(prevFrom), hasPrev: campaign.start_date <= prevTo };
}

const delta = (cur, prev, hasPrev) => (hasPrev && prev ? pctChange(cur, prev) : null);

/* Split a number into the design's "value + unit" pair (4.82 + "M"). */
export function valueUnit(n) {
  if (n >= 1e6) return { value: (n / 1e6).toFixed(2), unit: "M" };
  if (n >= 1e3) return { value: (n / 1e3).toFixed(1), unit: "K" };
  return { value: String(Math.round(n)), unit: "" };
}

function dailySeries(rows, from, days, pick) {
  const by = groupBy(rows, r => r.day);
  return Array.from({ length: days }, (_, i) => {
    const m = by.get(addDays(from, i)) || emptyMetrics();
    return pick(m);
  });
}

const ratio = (a, b) => (b ? a / b : 0);
const statusOf = d => (d > 3 ? "up" : d < -3 ? "down" : "flat");

/**
 * Everything the client dashboard needs for one campaign.
 * rows/prevRows: all of the game's rollups for the current / previous window.
 */
export function buildCampaignView({ campaign, client, game, placements, rows, prevRows, reach, prevReach, events, today }) {
  const win = campaignWindow(campaign, today);
  const ids = new Set(campaign.placement_ids);
  const inCampaign = r => r.placement_id && ids.has(r.placement_id) && r.day >= campaign.start_date && r.day <= campaign.end_date;
  const cur = rows.filter(inCampaign);
  const prv = prevRows.filter(r => r.placement_id && ids.has(r.placement_id) && r.day >= campaign.start_date);
  const hasPrev = win.hasPrev;
  const sessionsCur = rows.filter(r => !r.placement_id);
  const sessionsPrv = prevRows.filter(r => !r.placement_id);
  const tot = sumRows(cur), totPrev = sumRows(prv);
  const sCur = sumRows(sessionsCur), sPrev = sumRows(sessionsPrv);

  const totalDays = Math.max(1, daysBetween(campaign.start_date, campaign.end_date) + 1);
  const elapsed = Math.min(totalDays, Math.max(0, daysBetween(campaign.start_date, today) + 1));
  const spent = Math.round(campaign.budget * (elapsed / totalDays));
  const windowSpend = Math.round(campaign.budget * Math.min(1, ratio(Math.max(0, daysBetween(campaign.start_date > win.from ? campaign.start_date : win.from, win.to) + 1), totalDays)));
  const convValue = campaign.conversion_value || 24;

  const CAMPAIGN = {
    id: campaign.id,
    brand: client.name,
    studio: game.studio || "Kunta Content",
    game: game.name,
    campaign: `${client.name} · ${campaign.name}`,
    name: campaign.name,
    startedAt: campaign.start_date,
    endsAt: campaign.end_date,
    budget: campaign.budget,
    spent,
    weekOf: Math.max(1, Math.ceil(elapsed / 7)),
    weeksTotal: Math.ceil(totalDays / 7),
    windowFrom: win.from,
    windowTo: win.to,
    hasData: tot.impressions + tot.sessions > 0,
  };

  const reachVU = valueUnit(reach);
  const sessLen = ratio(sCur.playtime_sec, sCur.sessions) / 60;
  const sessLenPrev = ratio(sPrev.playtime_sec, sPrev.sessions) / 60;
  // Touchpoints per game session, counting only sessions on days the campaign ran.
  const inDates = r => r.day >= campaign.start_date && r.day <= campaign.end_date;
  const depth = ratio(tot.viewable + tot.interactions + tot.clicks, sumRows(sessionsCur.filter(inDates)).sessions);
  const depthPrev = ratio(totPrev.viewable + totPrev.interactions + totPrev.clicks, sumRows(sessionsPrv.filter(inDates)).sessions);
  const sparkDays = 24;
  const sparkFrom = addDays(win.to, -(sparkDays - 1));
  const KPIS = [
    { id: "reach", label: "Unique reach", value: reachVU.value, unit: reachVU.unit, delta: delta(reach, prevReach, hasPrev),
      spark: dailySeries(cur, sparkFrom, sparkDays, m => m.viewable),
      sub: game.mau ? `of ${fmtNum(game.mau)} MAU · ${(ratio(reach, game.mau) * 100).toFixed(1)}%` : "unique players exposed" },
    { id: "session", label: "Avg session length", value: sessLen.toFixed(1), unit: "min", delta: delta(sessLen, sessLenPrev, true),
      spark: dailySeries(sessionsCur, sparkFrom, sparkDays, m => ratio(m.playtime_sec, m.sessions)),
      sub: `${fmtNum(sCur.sessions)} sessions in ${game.name}` },
    { id: "depth", label: "Engagement depth", value: depth.toFixed(2), unit: "events / session", delta: delta(depth, depthPrev, hasPrev),
      spark: dailySeries(cur, sparkFrom, sparkDays, m => m.viewable + m.interactions + m.clicks),
      sub: "brand touchpoints per game session" },
  ];

  const byDayPlat = groupBy(cur, r => r.day + "|" + r.platform);
  const byDayPrev = groupBy(prv, r => r.day);
  const ENGAGEMENT_DAYS = Array.from({ length: WINDOW_DAYS }, (_, i) => {
    const day = addDays(win.from, i);
    const mob = (byDayPlat.get(day + "|mobile") || emptyMetrics()).interactions;
    const all = game.platforms.reduce((a, p) => a + (byDayPlat.get(day + "|" + p) || emptyMetrics()).interactions, 0);
    const prevDay = addDays(win.prevFrom, i);
    return { i, day, label: fmtShortDate(day), dateLabel: fmtShortDate(day), current: all, previous: (byDayPrev.get(prevDay) || emptyMetrics()).interactions, mobile: mob, webgl: all - mob };
  });
  const TREND = { total: tot.interactions, delta: delta(tot.interactions, totPrev.interactions, hasPrev) };

  const plById = Object.fromEntries(placements.map(p => [p.id, p]));
  const curByPl = groupBy(cur, r => r.placement_id);
  const prvByPl = groupBy(prv, r => r.placement_id);
  const platByPl = groupBy(cur, r => r.placement_id + "|" + r.platform);
  const PLACEMENT_ROWS = campaign.placement_ids.filter(id => plById[id]).map(id => {
    const p = plById[id];
    const m = curByPl.get(id) || emptyMetrics();
    const pm = prvByPl.get(id) || emptyMetrics();
    const ctr = ratio(m.interactions, m.viewable) * 100;
    const ctrPrev = ratio(pm.interactions, pm.viewable) * 100;
    const lift = pm.impressions ? pctChange(ctr, ctrPrev) : 0;
    const spendShare = windowSpend * ratio(m.impressions, tot.impressions);
    let best = null, bestImp = -1;
    for (const pl of game.platforms) { const v = (platByPl.get(id + "|" + pl) || emptyMetrics()).impressions; if (v > bestImp) { bestImp = v; best = pl; } }
    return {
      id, key: p.key, placement: labelOf(PLACEMENT_KINDS, p.kind), kind: p.kind, game: p.location, detail: p.name,
      impressions: m.impressions, viewable: m.viewable, interactions: m.interactions,
      ctr: +ctr.toFixed(1), recall: Math.round(ratio(m.viewable, m.impressions) * 100),
      cpe: +ratio(spendShare, m.interactions).toFixed(3), lift: Math.round(lift), status: statusOf(lift),
      platform: game.platforms.length > 1 ? labelOf(PLATFORMS, best) : labelOf(PLATFORMS, game.platforms[0]),
    };
  });

  const mobShare = (field) => {
    const mob = cur.filter(r => r.platform === "mobile").reduce((a, r) => a + r[field], 0);
    return Math.round(ratio(mob, tot[field]) * 100);
  };
  const FUNNEL = [
    { stage: "Impressions", field: "impressions" },
    { stage: "Viewable impressions", field: "viewable" },
    { stage: "Interactions", field: "interactions" },
    { stage: "Brand clicks", field: "clicks" },
    { stage: "Attributed conversions", field: "conversions" },
  ].map(s => ({ stage: s.stage, value: tot[s.field], pct: ratio(tot[s.field], tot.impressions) * 100, mobileShare: mobShare(s.field) }));

  const byPlat = groupBy(cur, r => r.platform);
  const sessByPlat = groupBy(sessionsCur, r => r.platform);
  const PLATFORM_PERF = game.platforms.map(pl => {
    const m = byPlat.get(pl) || emptyMetrics();
    const s = sessByPlat.get(pl) || emptyMetrics();
    const spend = windowSpend * ratio(m.impressions, tot.impressions);
    return { id: pl, label: labelOf(PLATFORMS, pl), reach: +(m.viewable * 0.38 / 1e6).toFixed(2),
      sessionLen: +(ratio(s.playtime_sec, s.sessions) / 60).toFixed(1), ctr: +(ratio(m.interactions, m.viewable) * 100).toFixed(1),
      roas: +ratio(m.conversions * convValue, spend).toFixed(1), share: Math.round(ratio(m.impressions, tot.impressions) * 100) };
  });

  const byReg = groupBy(cur, r => r.region);
  const prvByReg = groupBy(prv, r => r.region);
  const REGION_DATA = REGIONS.map(rg => {
    const m = byReg.get(rg.id) || emptyMetrics();
    const pm = prvByReg.get(rg.id) || emptyMetrics();
    const spend = windowSpend * ratio(m.impressions, tot.impressions);
    return { id: rg.id, label: rg.label, impressions: +(m.impressions / 1e6).toFixed(2), impressionsRaw: m.impressions,
      lift: Math.max(0, Math.round(ratio(m.interactions, m.viewable) * 1000) / 10), share: Math.round(ratio(m.impressions, tot.impressions) * 100),
      roas: +ratio(m.conversions * convValue, spend).toFixed(1), delta: pctChange(m.impressions, pm.impressions) };
  });

  const ACTIVITY = buildActivity({ events, plById, ids, game, PLACEMENT_ROWS });

  const locations = [...new Set(campaign.placement_ids.map(id => plById[id]?.location).filter(Boolean))];
  const hues = [80, 35, 200, 155, 290, 250];
  const MAPS = [{ id: "all", label: "All maps", short: "ALL" }].concat(locations.map((l, i) => ({ id: l, label: l, short: l.slice(0, 3).toUpperCase(), color: `oklch(0.6 0.13 ${hues[i % hues.length]})` })));

  return { CAMPAIGN, KPIS, ENGAGEMENT_DAYS, TREND, PLACEMENT_ROWS, FUNNEL, PLATFORM_PERF, REGION_DATA, ACTIVITY, MAPS, totals: tot, spend: windowSpend, convValue };
}

function buildActivity({ events, plById, ids, game, PLACEMENT_ROWS }) {
  const out = [];
  for (const e of events) {
    if (e.placement_id && !ids.has(e.placement_id)) continue;
    if (!e.placement_id && e.type !== "conversion") continue;
    const p = plById[e.placement_id];
    const what = { impression: "Impression", viewable: "Viewable impression", interaction: "Player interaction", click: "Brand click", conversion: "Conversion" }[e.type] || e.type;
    out.push({ t: timeAgo(e.ts), txt: `${what}${p ? ` · ${p.name} (${p.location})` : ""} · ${labelOf(PLATFORMS, e.platform)} · ${labelOf(REGIONS, e.region)}`, tag: e.type === "interaction" || e.type === "click" || e.type === "conversion" ? "up" : "info" });
    if (out.length >= 12) break;
  }
  const top = [...PLACEMENT_ROWS].sort((a, b) => b.impressions - a.impressions)[0];
  if (top && top.impressions) out.push({ t: "30d", txt: `${top.detail} leads delivery with ${fmtNum(top.impressions)} impressions in ${game.name}`, tag: "milestone" });
  const best = [...PLACEMENT_ROWS].sort((a, b) => b.ctr - a.ctr)[0];
  if (best && best.ctr) out.push({ t: "30d", txt: `${best.detail} has the highest interaction rate at ${best.ctr}%`, tag: "up" });
  const weak = PLACEMENT_ROWS.find(r => r.recall && r.recall < 70);
  if (weak) out.push({ t: "30d", txt: `${weak.detail} viewability is ${weak.recall}%, below the 70% floor`, tag: "warn" });
  return out;
}

/* Game-level summary for the admin portal. */
export function buildGameSummary(rows, prevRows, from, days) {
  const sess = rows.filter(r => !r.placement_id);
  const pl = rows.filter(r => r.placement_id);
  const s = sumRows(sess), p = sumRows(pl);
  const ps = sumRows(prevRows.filter(r => !r.placement_id)), pp = sumRows(prevRows.filter(r => r.placement_id));
  const byDay = groupBy(rows, r => r.day);
  const series = Array.from({ length: days }, (_, i) => {
    const day = addDays(from, i);
    const m = byDay.get(day) || emptyMetrics();
    return { day, label: fmtShortDate(day), sessions: m.sessions, impressions: m.impressions, interactions: m.interactions, players: m.players };
  });
  return {
    sessions: s.sessions, sessionsDelta: pctChange(s.sessions, ps.sessions),
    players: s.players, playersDelta: pctChange(s.players, ps.players),
    impressions: p.impressions, impressionsDelta: pctChange(p.impressions, pp.impressions),
    interactions: p.interactions, interactionsDelta: pctChange(p.interactions, pp.interactions),
    avgSession: ratio(s.playtime_sec, s.sessions) / 60,
    ctr: ratio(p.interactions, p.viewable) * 100,
    series,
  };
}

export function placementTotals(rows) {
  const by = groupBy(rows.filter(r => r.placement_id), r => r.placement_id);
  const out = {};
  for (const [id, m] of by) out[id] = m;
  return out;
}

export { addInto };
