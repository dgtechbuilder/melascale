/* Portal chooser: lists Kunta Content's games live from the MelaPress catalogue. */
import { CATALOG_SOURCE, fetchCatalogGames } from "./shared/catalog.js";

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
