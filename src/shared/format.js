/* Formatting + date helpers shared by both portals */

export function fmtNum(n) {
  if (n == null || Number.isNaN(n)) return "—";
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (a >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(Math.round(n));
}

export function fmtInt(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return Math.round(n).toLocaleString("en-US");
}

export function fmtMoney(n) {
  if (n == null || Number.isNaN(n)) return "—";
  if (n >= 1e6) return "$" + (n / 1e6).toFixed(2) + "M";
  if (n >= 1e3) return "$" + (n / 1e3).toFixed(1) + "K";
  return "$" + n.toFixed(n < 1 ? 3 : 2);
}

export function fmtDelta(d) {
  if (d == null || !Number.isFinite(d)) return "—";
  const s = d > 0 ? "+" : "";
  return s + d.toFixed(1) + "%";
}

export function pctChange(cur, prev) {
  if (!prev) return cur ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

/* Dates are handled as UTC calendar days, "YYYY-MM-DD". */
export function isoDay(d = new Date()) {
  return new Date(d).toISOString().slice(0, 10);
}
export function addDays(day, n) {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}
export function daysBetween(a, b) {
  return Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);
}
export function fmtDate(day) {
  if (!day) return "—";
  return new Date(day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
export function fmtShortDate(day) {
  return new Date(day + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function timeAgo(ts) {
  if (!ts) return "never";
  const s = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 1000));
  if (s < 60) return s + "s ago";
  const m = Math.round(s / 60);
  if (m < 60) return m + "m ago";
  const h = Math.round(m / 60);
  if (h < 48) return h + "h ago";
  return Math.round(h / 24) + "d ago";
}

export function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function initials(name) {
  const parts = String(name || "").replace(/[^A-Za-z0-9 ]/g, " ").trim().split(/\s+/);
  return ((parts[0] || "")[0] || "?").toUpperCase() + ((parts[1] || "")[0] || "").toUpperCase();
}

/* deterministic pseudo-random (same generator the design used) */
export function rnd(seed) {
  let s = Math.abs(Math.floor(seed)) % 233280 || 1;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
