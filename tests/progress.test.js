import { test } from "node:test";
import assert from "node:assert/strict";
import { progressFromRestore, progressFromTables, fetchPlayerProgress, isPlayerCode, fmtPlayTime } from "../src/shared/progress.js";

const CODE = "11111111-2222-4333-8444-555555555555";

const restorePayload = {
  farmer_name: "Test Farmer",
  saved_at: "2026-11-28T13:06:19.184Z",
  state: {
    level: 1, season: 1, points: 1129, coins: 255.717, playSeconds: 8460,
    farmer: { look: 1, name: "Test Farmer" },
    ach: {
      days: 6,
      streak: { best: 6, last: "2026-11-28", count: 6 },
      won: {
        "welcome": { date: "2026-11-23", claimed: false },
        "credits-silver": { date: "2026-11-25", claimed: true },
        "mystery-gold": { date: "2026-11-24", claimed: false },
      },
      certs: [{ id: "level-1", date: "2026-11-24", kind: "level", title: "Level 1: Farm Starter" }],
    },
  },
};

test("player codes are uuids", () => {
  assert.ok(isPlayerCode(` ${CODE.toUpperCase()} `));
  assert.ok(!isPlayerCode("not-a-code"));
  assert.ok(!isPlayerCode(""));
});

test("reads progress and badges from a TemoLima save", () => {
  const p = progressFromRestore(restorePayload);
  assert.equal(p.name, "Test Farmer");
  assert.equal(p.initials, "TF");
  assert.equal(p.points, 1129);
  assert.equal(p.streak, 6);
  assert.equal(p.daysPlayed, 6);
  assert.deepEqual(p.achievements.map(a => a.id), ["credits-silver", "mystery-gold", "welcome"]);
  assert.equal(p.achievements[0].title, "Climate steward");
  assert.equal(p.achievements[0].tier, "silver");
  assert.equal(p.achievements[0].claimed, true);
  assert.equal(p.achievements[1].title, "Mystery gold");
  assert.equal(p.achievements[1].tier, "gold");
  assert.equal(p.certificates[0].title, "Level 1: Farm Starter");
});

test("no save means no progress", () => {
  assert.equal(progressFromRestore(null), null);
  assert.equal(progressFromRestore({}), null);
});

test("reads progress from the player and achievement tables", () => {
  const p = progressFromTables({
    saved_at: "2026-11-28T13:06:19Z",
    player: { farmer_name: "Otieno", level: 2, season: 1, points: 50, coins: 10, days_played: 3, streak: 2, best_streak: 4, play_seconds: 59 },
    achievements: [{ badge_id: "first-plant", game: "six", tier: "day1", title: "Seeds in the ground", won_on: "2026-11-20", claimed: false }],
  });
  assert.equal(p.source, "tables");
  assert.equal(p.bestStreak, 4);
  assert.equal(p.achievements[0].title, "Seeds in the ground");
});

function fakeFetch(routes) {
  const calls = [];
  const f = async (url, init) => {
    const fn = url.split("/rpc/")[1];
    calls.push({ fn, init });
    const [status, body] = routes[fn] || [404, { code: "PGRST202" }];
    return { ok: status < 300, status, json: async () => body };
  };
  f.calls = calls;
  return f;
}

test("falls back to the save lookup when the table lookup isn't there, and only reads", async () => {
  const f = fakeFetch({ temolima_restore: [200, restorePayload] });
  const p = await fetchPlayerProgress(CODE, { url: "https://x.supabase.co", key: "k", fetch: f });
  assert.equal(p.source, "save");
  assert.deepEqual(f.calls.map(c => c.fn), ["temolima_progress", "temolima_restore"]);
  assert.ok(f.calls.every(c => JSON.parse(c.init.body).p_player === CODE));
  assert.ok(f.calls.every(c => !/save\b|insert|update|delete/i.test(c.fn)));
});

test("unknown code resolves to null; bad code never hits the network", async () => {
  const f = fakeFetch({ temolima_restore: [200, null] });
  assert.equal(await fetchPlayerProgress(CODE, { url: "u", key: "k", fetch: f }), null);
  await assert.rejects(fetchPlayerProgress("nope", { url: "u", key: "k", fetch: f }));
  assert.equal(f.calls.length, 2);
});

test("play time", () => {
  assert.equal(fmtPlayTime(8460), "2h 21m");
  assert.equal(fmtPlayTime(300), "5m");
  assert.equal(fmtPlayTime(10), "under a minute");
});
