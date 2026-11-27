# Mela Scale

Campaign-intelligence dashboard for in-game brand placements. This app is built from the
Claude Design project **"Main Mela Scale Game Tracking tools (Template)"**, page
**"Mela Scale - Main Platform copy"** (the *Hello Tractor × Lima Farming Game* view).

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

To build a static site into `dist/` (works from any path, e.g. GitHub Pages):

```bash
npm run build
```

## Pages

All pages are in the sidebar:

| Sidebar item | Component | File |
|---|---|---|
| Campaign overview | KPI strip, engagement trend, funnel, social, influencers, segments | `src/app.jsx` |
| Analytics | `AnalyticsPage` | `src/analytics-page.jsx` |
| Placements | `PlacementsPage` (inventory, filters, add placement) | `src/placements-page.jsx` |
| Business impact | `BusinessImpactPage` | `src/impact-page.jsx` |
| Audience | `AudiencePage` | `src/audience-page.jsx` |
| Amplification | `AmplificationPage` | `src/amplification-page.jsx` |
| Reports | `ReportsPage` + report drawer | `src/app.jsx` |
| AI Chat Insights | `AIInsightsPage` | `src/insights-page.jsx` |
| Live activity | `ActivityPage` | `src/app.jsx` |
| Game telemetry | `TelemetryPage` | `src/telemetry-page.jsx` |
| Settings | `SettingsModal` (general, notifications, integrations, export, billing) | `src/app.jsx` |

Shared pieces: `src/panels.jsx` (sidebar, header, filter bar, KPI cards), `src/charts.jsx`
(sparkline, engagement chart, bar list, donut), `src/data.jsx` (all sample data and number
formatters), `src/tweaks-panel.jsx` (density / accent / panel toggles, saved in the browser).

All data is sample data in `src/data.jsx` and the page files; there is no backend yet.

## Design system

`docs/design/DESIGN_SYSTEM.md` has the brand rules (oklch colors, Instrument Sans / Instrument
Serif / JetBrains Mono, Unicode-glyph icons, voice). `src/colors_and_type.css` holds the tokens.
