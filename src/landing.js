/* Portal chooser: lists Kunta Content's games live from the MelaPress catalogue, and shows a
   TemoLima player's progress once they sign in with their player code (read-only). */
import { CATALOG_SOURCE, CATALOG_URL, CATALOG_KEY, fetchCatalogGames } from "./shared/catalog.js";
import { fetchPlayerProgress, isPlayerCode, normaliseCode, fmtPlayTime, TIER_LABEL, GAME_LABEL } from "./shared/progress.js";
import { fmtInt, fmtDate, timeAgo } from "./shared/format.js";

const list = document.getElementById("catalog-list");
const status = document.getElementById("catalog-status");

function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of kids) if (k != null) n.append(k);
  return n;
}

function setStatus(text, live) {
  status.classList.toggle("off", !live);
  status.querySelector("span").textContent = text;
}

fetchCatalogGames()
  .then(games => {
    list.replaceChildren(...games.map(g => {
      const chip = el("span", { className: "chip", textContent: g.abbr });
      chip.style.background = `oklch(0.55 0.14 ${g.hue})`;
      chip.setAttribute("aria-hidden", "true");
      const meta = [g.genre, g.release_status].filter(Boolean).join(" · ");
      return el("li", {}, chip, el("div", { style: "min-width:0" },
        el("b", { textContent: g.name }),
        g.subtitle ? el("small", { textContent: g.subtitle }) : null,
        meta ? el("small", { textContent: meta }) : null));
    }));
    if (!games.length) list.replaceChildren(el("li", {}, el("small", { textContent: "No games in the catalogue yet." })));
    setStatus(`Live from ${CATALOG_SOURCE} · ${games.length} ${games.length === 1 ? "game" : "games"}`, true);
  })
  .catch(err => {
    list.replaceChildren(el("li", {}, el("small", { textContent: `Couldn't load the game catalogue (${err.message}).` })));
    setStatus("Catalogue offline", false);
  });

/* TemoLima player progress */

const CODE_KEY = "mela.temolima.player";
const panel = document.getElementById("player-panel");
const signin = document.getElementById("player-signin");
const pStatus = document.getElementById("player-status");
const hint = document.getElementById("player-hint");
const codeInput = document.getElementById("player-code");
const MEDAL = { day1: "oklch(0.6 0.13 145)", bronze: "oklch(0.6 0.11 55)", silver: "oklch(0.62 0.02 260)", gold: "oklch(0.72 0.14 85)", platinum: "oklch(0.6 0.08 220)" };

function storedCode() {
  try { return localStorage.getItem(CODE_KEY); } catch { return null; }
}
function storeCode(code) {
  try { code ? localStorage.setItem(CODE_KEY, code) : localStorage.removeItem(CODE_KEY); } catch { /* private mode: sign-in lasts this visit */ }
}

function setPlayerStatus(text, live) {
  pStatus.classList.toggle("off", !live);
  pStatus.querySelector("span").textContent = text;
}

function showSignin(message) {
  hint.textContent = message || "Find it in TemoLima under Settings. It stays on this device, and this page only reads your farm.";
  hint.classList.toggle("error", !!message);
  signin.querySelector("button").disabled = false;
  panel.replaceChildren(signin);
  setPlayerStatus("Not signed in", false);
}

function stat(label, value, note) {
  return el("div", {}, el("dt", { textContent: label }), el("dd", { textContent: value }, note ? el("small", { textContent: note }) : null));
}

function signOut() {
  storeCode(null);
  signin.reset();
  showSignin();
  codeInput.focus();
}

function render(p) {
  const out = el("button", { className: "btn ghost", type: "button", textContent: "Sign out" });
  out.addEventListener("click", signOut);
  const chip = el("span", { className: "chip", textContent: p.initials });
  chip.setAttribute("aria-hidden", "true");
  const who = el("div", { className: "who" }, chip,
    el("div", { style: "min-width:0" }, el("b", { textContent: p.name }),
      el("small", { textContent: p.savedAt ? `Farm saved ${timeAgo(p.savedAt)}` : "No save time yet" })),
    out);

  const stats = el("dl", { className: "stats" },
    stat("Level", fmtInt(p.level)),
    stat("Season", fmtInt(p.season)),
    stat("Points", fmtInt(p.points)),
    stat("Coins", fmtInt(p.coins)),
    stat("Streak", fmtInt(p.streak), p.bestStreak > p.streak ? `days · best ${fmtInt(p.bestStreak)}` : "days in a row"),
    stat("Played", fmtPlayTime(p.playSeconds), p.daysPlayed ? `over ${fmtInt(p.daysPlayed)} ${p.daysPlayed === 1 ? "day" : "days"}` : null));

  const head = el("h3", { textContent: "Achievements" }, el("span", { textContent: `${p.achievements.length} won` }));
  const badges = p.achievements.length
    ? el("ul", { className: "badges" }, ...p.achievements.map(a => {
        const medal = el("span", { className: "medal", textContent: "★" });
        medal.style.setProperty("--medal", MEDAL[a.tier] || MEDAL.day1);
        medal.setAttribute("aria-hidden", "true");
        const meta = [TIER_LABEL[a.tier] || a.tier, GAME_LABEL[a.game], a.wonOn ? fmtDate(a.wonOn) : null].filter(Boolean).join(" · ");
        return el("li", {}, medal, el("div", { style: "min-width:0" }, el("b", { textContent: a.title }), el("small", { textContent: meta })));
      }))
    : el("p", { className: "hint", textContent: "No achievements yet. Keep farming!" });

  const card = el("div", { className: "card" }, who, stats, head, badges);
  if (p.certificates.length) {
    card.append(el("h3", { textContent: "Certificates" }, el("span", { textContent: `${p.certificates.length} earned` })),
      el("ul", { className: "badges" }, ...p.certificates.map(c =>
        el("li", {}, el("div", { style: "min-width:0" }, el("b", { textContent: c.title }), el("small", { textContent: c.issuedOn ? fmtDate(c.issuedOn) : "" }))))));
  }
  panel.replaceChildren(card);
  setPlayerStatus(`Live from ${CATALOG_SOURCE} · read-only`, true);
}

async function load(code) {
  setPlayerStatus("Loading progress…", false);
  signin.querySelector("button").disabled = true;
  try {
    const p = await fetchPlayerProgress(code, { url: CATALOG_URL, key: CATALOG_KEY });
    if (!p) { storeCode(null); showSignin("No TemoLima save found for that code. Check it in TemoLima under Settings."); return; }
    storeCode(code);
    render(p);
  } catch (err) {
    showSignin(`Couldn't load your progress (${err.message}).`);
  }
}

signin.addEventListener("submit", e => {
  e.preventDefault();
  const code = normaliseCode(signin.elements.code.value);
  if (!isPlayerCode(code)) { showSignin("That doesn't look like a player code. It has 36 letters, numbers and dashes."); return; }
  load(code);
});

const saved = storedCode();
if (saved && isPlayerCode(saved)) load(saved);
