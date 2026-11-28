# Mela Scale

In-game brand analytics by Kunta Content, as two platforms that share one data layer:

| | Who | URL path | What it does |
|---|---|---|---|
| **Admin portal** | Kunta Content team | `/admin/` | Manage games (LIMA, MAZU, SANGO, HIRU, KUSHABA, IMAGINARIUM and new ones), their placements and analytics connections (API keys, SDK snippets, test events, live event stream), clients and campaigns |
| **Client portal** | Brands | `/client/` | The original Claude Design dashboard, showing the signed-in brand's own campaigns: reach, session length, engagement, daily trend, funnel, placements, platforms, regions and live activity |

Live site: https://dgtechbuilder.github.io/melascale/ (deployed by `.github/workflows/deploy-pages.yml` on every push to `main`).

## How data flows

```
game build ──(SDK + API key)──▶ ingest function ──▶ events table
                                                        │
admin portal ◀── rollups for every game ────────────────┤
client portal ◀── rollups for the client's own placements only (row-level security)
```

A **campaign** ties a client to placements in one game for a date range; it decides what that client can see.

## Demo mode vs Supabase

With no backend configured, both portals run in **demo mode**: data is kept in the browser,
the 30-day history of live games is generated sample traffic, and the admin portal has a
**Simulate game traffic** button that plays game sessions through the real ingest path.
The GitHub Pages site runs this way. Changes made in the admin portal show up in the client
portal in the same browser.

To go live, connect Supabase: see [docs/BACKEND.md](docs/BACKEND.md). Game teams integrate with
[docs/INTEGRATION.md](docs/INTEGRATION.md).

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173/admin/ or http://localhost:5173/client/.

## Layout

| Path | Contents |
|---|---|
| `index.html` | Landing page linking the two portals |
| `src/shared/` | Design tokens and styles, charts, data layer (`api/demo.js`, `api/supabase.js`), event validation, rollups and campaign metrics |
| `src/admin/` | Admin portal: overview, games (analytics, placements, connect), campaigns, clients, event stream, settings |
| `src/client/` | Client portal: sign-in and campaign switcher (`session.jsx`) around the original dashboard |
| `supabase/` | Database migration with row-level security, seed data, `ingest` edge function |
| `sdk/` | `mela-sdk.js` for WebGL/HTML5 games, `unity/MelaScale.cs` for Unity |
| `docs/` | Backend setup, game integration guide, design system notes |

Sections of the client dashboard that have no live source yet (social listening, holdout lift,
player cohorts, AI insights, weekly reports) keep the design's sample figures and are labelled
**Sample data** on screen.
