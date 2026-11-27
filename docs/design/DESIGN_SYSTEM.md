# Mela Scale — Design System

**Mela Scale** is a campaign-intelligence dashboard for measuring how brands perform inside games. It tracks in-game brand placements (billboards, branded items, cosmetic surfaces, tractor wraps, etc.) across Mobile and WebGL builds, reporting reach, engagement, funnel conversion, business impact and AI-synthesized insights. The reference product is the *"Northwind Goods × Lima Farming Game"* campaign view.

This repository is a **design system**: it captures the visual foundations, tokens, iconography, content voice, and a high-fidelity UI kit so that new Mela Scale screens, decks and prototypes can be built on-brand.

> **Source of truth:** the live product file `Mela Scale.html` (a React + Babel single-page app) plus its component modules `data.jsx`, `charts.jsx`, `panels.jsx`, `app.jsx`. All tokens below were extracted directly from that source. There is no external Figma or repo — this product is self-contained in the project.

---

## Index — what's in this folder

| File / folder | Purpose |
|---|---|
| `README.md` | This file — context, content & visual foundations, iconography |
| `colors_and_type.css` | Color + type tokens as CSS custom properties (light + dark) |
| `SKILL.md` | Agent-Skill manifest for downloading into Claude Code |
| `preview/` | Small HTML cards that populate the Design System tab |
| `ui_kits/dashboard/` | High-fidelity UI kit: README, `index.html`, JSX components |
| `Mela Scale.html` | The reference product (full working dashboard) |
| `data.jsx` `charts.jsx` `panels.jsx` `app.jsx` | The product's source modules |

---

## CONTENT FUNDAMENTALS

**Vibe.** Analytical, confident, quietly premium. It reads like a sharp analyst briefing a brand team — never breathless, never salesy. Numbers carry the message; prose stays out of the way.

**Voice & person.** Third-person and object-led. The product talks *about the data*, not *to the user* — "WebGL is driving 1.4× the ROAS of Mobile", not "You're seeing great results!". No first person. Direct address ("you") is rare and only appears in interactive affordances ("+ Ask a question about this data").

**Insight titles are declarative findings.** The AI insight cards state a conclusion with a quantified claim, then a clause of nuance:
- *"WebGL is driving 1.4× the ROAS of Mobile — funnel quality, not reach"*
- *"Coastal Acres billboards are underperforming viewability floor"*
- *"APAC lapsed farmers convert 2.1× the baseline after exposure"*

The em-dash qualifier is a recurring device. Lead with the number and the surprise.

**Casing.** Sentence case everywhere — titles, buttons, labels ("Campaign overview", "Save view", "Compare prev"). The only UPPERCASE is the mono **eyebrow / section label** style ("ANALYZE", "CONNECT", "TREND · DAILY"), set in JetBrains Mono with wide tracking.

**Numbers are first-class.** Always tabular-mono, always with explicit units and deltas: `4.82M`, `24.4 min`, `+11.2%`, `↑ 14.6%`. Deltas are color-coded (green up / red down) and prefixed with an arrow glyph. Abbreviate large numbers (M/K). Comparisons are framed against a baseline or holdout ("+3.6m vs non-exposed", "vs holdout").

**Brevity.** Labels are 1–3 words. Sub-labels add one quiet clarifying phrase under a metric ("of 12.4M MAU · 38.9%"). Tags are lowercase mono hashes (`#webgl`, `#roas`).

**Emoji.** None. Not part of the brand. "Icons" are Unicode glyphs (see Iconography).

---

## VISUAL FOUNDATIONS

**Overall feel.** A calm, warm-grey analytics canvas with one decisive indigo and a warm-orange counterpart. High information density handled with generous internal padding, hairline borders and very soft shadows rather than heavy chrome. Editorial touch: a single serif-italic accent against an otherwise sans + mono system.

**Color.**
- Everything is authored in **oklch** for even lightness control.
- Neutrals are **warm grey (hue ~80)** — never pure white or pure black. Background `oklch(0.975 0.006 80)`, cards slightly lighter `0.995`, insets slightly darker `0.965`.
- **Primary = indigo** `oklch(0.42 0.16 285)` — buttons-as-data, the first data series, selected pills, links. Paired with a very light tint `--primary-soft` for selections and soft chips.
- **Accent = warm orange** `oklch(0.68 0.16 45)` — the second data series (e.g. WebGL vs Mobile), highlight markers.
- **Semantic:** green `--good` (positive deltas, the live pulse dot), red `--bad` (negative deltas), amber `--warn`. Each strong color has a `-soft` tint companion used as a pill background.
- Solid primary action buttons actually use **`--ink`** (near-black warm grey) on `--surface`, not indigo — indigo is reserved for data and accents. This keeps the UI calm.

**Type.** Three families, each with a job:
- **Instrument Sans** — all UI text and body. Base 14px / line-height 1.45 / letter-spacing −0.005em.
- **Instrument Serif (italic)** — display accent only, e.g. the brand name in the page title, metric eyebrows. Always italic, weight 400, often colored `--primary`. Used sparingly for editorial contrast.
- **JetBrains Mono** — all numbers, deltas, codes, keyboard hints (⌘K), and uppercase eyebrow/section labels. Tabular figures on.
- Scale: metric numbers 36px/500/−0.03em; h1 24px/600/−0.02em; body 14px; labels 11–12.5px; mono eyebrows 11px with 0.06–0.1em tracking, uppercased.

**Spacing & layout.** 4px-based rhythm. Card internal padding 16px; section gutters 28px (tightening to 20→14px at breakpoints); grid gap 14px. App is a fixed sidebar (232px) + fluid main; content organized as 2-column "feature + side" grids (1.6fr/1fr family) that collapse to single column under 1100px. Header is sticky with a backdrop blur.

**Corner radii.** Cards 14px (`--radius`); buttons & inputs 10px; pills/toggles/chips fully round (999px); small inner chips 5–8px.

**Borders.** Hairline `1px solid var(--line)` is the primary separator — borders do more work than shadows. A lighter `--line-2` for inner/nested borders. Dashed borders signal optional/additive affordances ("+ Save view", "+ Ask a question").

**Shadows / elevation.** Extremely restrained. `--shadow-sm` is essentially a 1px ring + 1px drop; `--shadow-md` adds a soft 14px ambient for raised cards (AI panel, dropdowns, modals). No glow, no colored shadows. Elevation is communicated mostly by surface lightness + border.

**Backgrounds.** Flat warm-grey fills. The only gradient is the AI insight card's subtle top-down wash (`--ai-grad-top` → `--surface`) and the avatar/icon chips (135° two-stop warm gradients). No photography, no textures, no full-bleed imagery in the core product.

**Charts & data viz.** Smooth (curved) sparklines and area fills; primary indigo for series 1, warm orange for series 2; soft area fill under lines at low opacity. Funnel bars use the primary/accent split. Sentiment bars use good/neutral/bad. Numbers sit beside every visual.

**Motion.** Subtle and functional. The live status dot pulses (1.6s ease-in-out scale+opacity). Toggles slide (0.2s), dropdown chevrons rotate (0.2s), insight cards fade opacity while "thinking" (0.3s), sidebar drawer slides in (0.22s). No bounces, no decorative animation.

**Interaction states.**
- *Hover:* fill shifts to `--surface-2`; dashed/ghost buttons gain a subtle background.
- *Selected/active:* segmented controls invert to `--ink` background with `--surface` text; nav items get a `--surface-2` fill plus a 3px primary left-marker bar.
- *Focus:* `2px solid var(--primary)` outline, 2px offset, 6px radius — visible and on-brand.
- *Checkboxes:* primary-filled square with a white ✓ when checked.

**Selection.** `::selection` uses `--primary-soft` background with `--ink` text.

**Dark mode.** Toggled via `[data-theme="dark"]` on `<html>`. Neutrals shift to cool-dark (hue 280) surfaces with warm-light ink; shadows deepen; the AI gradient top flips dark. **Lesson learned:** never hardcode a light fill on text containers — always drive backgrounds through the theme variables (the AI card gradient was the one bug, now `--ai-grad-top`).

---

## ICONOGRAPHY

Mela Scale's most distinctive choice: **icons are Unicode glyph characters, not an icon font or SVG set.** They are rendered as plain text in the brand's `--ink-3`/`--primary` colors, often inside a small rounded chip. This keeps the bundle dependency-free and gives the UI a subtle, typographic, "terminal-meets-editorial" character.

Glyphs in use (copy these rather than inventing icons):

| Glyph | Meaning / usage |
|---|---|
| `◐` | Campaign overview (nav) |
| `▣` | Placements (nav) |
| `↯` | Game telemetry / data feed |
| `⚙` | Settings |
| `✦` | AI / synthesized insight (in gradient chip) |
| `↻` | Regenerate / refresh |
| `⌄` | Disclosure chevron (rotates when open) |
| `⌕` | Search |
| `⌘K` | Keyboard hint (mono, in a bordered chip) |
| `↑` `↓` | Delta direction (with green/red) |
| `✓` | Checkbox checked |
| `◆` `★` `●` | Status / list markers |

**Rules.**
- Prefer the existing glyph vocabulary above. If a new concept needs an icon, choose a Unicode glyph with a similar monoline / geometric weight before reaching for an SVG library.
- Glyphs that act as a "logo mark" or status indicator sit inside a rounded chip (6–8px radius) with a warm gradient or soft tint fill.
- The pulsing **`live-dot`** (a green circle with a soft ring + pulse animation) is the one purpose-built indicator, not a glyph.
- **No emoji.** **No raster icons.** **No third-party icon font.**

> If a future surface genuinely needs a richer icon set, flag it — the closest CDN match by weight would be a thin monoline set (e.g. Lucide at ~1.5px stroke), but this would be a *substitution* away from the native glyph approach and should be a deliberate decision.

---

## Logo / brand mark

The brand mark is a minimal **rounded-square chip** containing the company glyph (e.g. "N" for Northwind, or a horizontal bar mark), with the wordmark **"Mela Scale"** set in Instrument Sans 600 and the mono eyebrow "CAMPAIGN INTELLIGENCE" beneath. There is no standalone logotype asset file — the mark is composed in markup. See `ui_kits/dashboard/Sidebar.jsx`.
