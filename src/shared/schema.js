/* Shared vocabulary for games, placements and analytics events.
   The ingest API, the SDKs and both portals all use these ids. */

export const EVENT_TYPES = [
  { id: "session_start", label: "Session start", needsPlacement: false, help: "A player opened the game." },
  { id: "session_end", label: "Session end", needsPlacement: false, help: "Session closed. props.duration_sec = seconds played." },
  { id: "impression", label: "Impression", needsPlacement: true, help: "A placement was rendered on screen." },
  { id: "viewable", label: "Viewable impression", needsPlacement: true, help: "Placement stayed ≥50% on screen for ≥1s. props.dwell_ms optional." },
  { id: "interaction", label: "Interaction", needsPlacement: true, help: "Player touched, equipped, used or walked into the placement." },
  { id: "click", label: "Brand click", needsPlacement: true, help: "Player opened a brand link or offer." },
  { id: "conversion", label: "Conversion", needsPlacement: false, help: "Attributed purchase or sign-up. props.value optional." },
];
export const EVENT_TYPE_IDS = EVENT_TYPES.map(e => e.id);

export const PLATFORMS = [
  { id: "mobile", label: "Mobile" },
  { id: "webgl", label: "WebGL" },
  { id: "pc", label: "PC" },
  { id: "console", label: "Console" },
];

export const REGIONS = [
  { id: "na", label: "North America" },
  { id: "emea", label: "EMEA" },
  { id: "apac", label: "APAC" },
  { id: "latam", label: "LATAM" },
];

export const GAME_STATUSES = [
  { id: "live", label: "Live", tone: "good" },
  { id: "beta", label: "Beta", tone: "primary" },
  { id: "development", label: "In development", tone: "warn" },
  { id: "paused", label: "Paused", tone: "muted" },
];

export const PLACEMENT_KINDS = [
  { id: "billboard", label: "In-game Billboard", icon: "▭" },
  { id: "cosmetic", label: "Cosmetic", icon: "◆" },
  { id: "environmental", label: "Environmental", icon: "▣" },
  { id: "cutscene", label: "Cutscene", icon: "▶" },
  { id: "branded_item", label: "Branded Item", icon: "✚" },
  { id: "tutorial", label: "Tutorial Segment", icon: "✎" },
  { id: "event", label: "Co-branded Event", icon: "★" },
];

export const CAMPAIGN_STATUSES = [
  { id: "draft", label: "Draft", tone: "muted" },
  { id: "scheduled", label: "Scheduled", tone: "primary" },
  { id: "live", label: "Live", tone: "good" },
  { id: "completed", label: "Completed", tone: "muted" },
];

export function labelOf(list, id) {
  return (list.find(x => x.id === id) || { label: id }).label;
}

/* Campaign status derived from its dates (draft stays draft). */
export function campaignStatus(c, today) {
  if (c.status === "draft") return "draft";
  if (today < c.start_date) return "scheduled";
  if (today > c.end_date) return "completed";
  return "live";
}
