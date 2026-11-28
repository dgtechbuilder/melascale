# Backend setup (Supabase)

Mela Scale runs on the **MelaPress** Supabase project (`nxjwjklugmwnrlngzrub`), next to its game
catalogue. The catalogue table `public.games` is shared: MelaPress's website and Mela Scale both read it.

## Live game catalogue (works today, no setup)

The portal chooser and the admin portal's game list read `public.games` live with MelaPress's
publishable key (`src/shared/catalog.js`). The table's "Game catalog is publicly readable" policy is
what allows it; nothing is written. In demo mode the catalogue is merged into the browser workspace:
HIRU and Imaginarium keep their demo placements and traffic, and the other catalogue games appear with
no traffic until they send events. To point at another project, set `VITE_CATALOG_SUPABASE_URL` and
`VITE_CATALOG_SUPABASE_KEY`.

## Full backend (placements, campaigns, events, client sign-in)

Without these settings both portals run in **demo mode**: everything lives in the browser's
local storage, and the 30-day history for live games is generated sample traffic. That is what the
GitHub Pages site shows. To collect real analytics from game builds and give clients their own
sign-in, connect a Supabase project.

## What runs where

| Piece | Where | What it does |
|---|---|---|
| `supabase/migrations/0001_mela_scale.sql` | Postgres | New tables (`mela_games`, `staff`, `placements`, `clients`, `client_users`, `campaigns`, `api_keys`, `events`), row-level security, and the functions the portals call. It reuses MelaPress's `public.games` and never creates, alters or drops it; it only adds two policies so Mela Scale staff can add and edit catalogue games |
| `supabase/functions/ingest` | Edge function | Games POST events here with an API key. Validates, then writes to `events` with the service role |
| `supabase/seed.sql` | Postgres | Mela Scale settings for every catalogue game and the HIRU placements. Never inserts into the catalogue. Optional |
| `admin/`, `client/` | Static site | The two portals. They read through Supabase with the signed-in user's session |

## Who can see what

- **Kunta Content staff**: anyone whose sign-in email is in `public.staff`. They see and manage everything.
- **Client users**: emails in `public.client_users`. They see their own client, its active (non-draft)
  campaigns, the games and placements in those campaigns, and analytics for those placements.
  They never see other brands' placements, API keys or raw events outside their placements.
- **Games** don't sign in. Each build sends events with an API key created in the admin portal.
  Keys are stored as SHA-256 hashes and shown once.

These rules were checked against Postgres 16: a client user gets only their own rows, gets an error
when asking for a rival's placement reach, and can't create keys or campaigns; anonymous requests see nothing.

## Setup

**Status (2026-11-28): the migration and seed are applied to MelaPress.** Steps 1–2 are done;
start at step 3.

1. Use the MelaPress project (ref `nxjwjklugmwnrlngzrub`).
2. Run the migration, then (optionally) the seed:
   ```bash
   supabase link --project-ref <ref>
   ```
   ```bash
   supabase db push
   ```
   or paste `supabase/migrations/0001_mela_scale.sql` and `supabase/seed.sql` into the SQL editor.
3. Add your team: `insert into public.staff (email, name) values ('you@kuntacontent.com', 'You');`
4. Deploy the ingest function. Games have no Supabase login, so JWT checks are off; the API key is the credential:
   ```bash
   supabase functions deploy ingest --no-verify-jwt
   ```
5. In Supabase **Authentication → URL configuration**, add the portal URLs as redirect URLs
   (e.g. `https://dgtechbuilder.github.io/melascale/admin/` and `.../client/`), so email sign-in links come back to the right portal.
6. Build the site with the project's URL and anon key:
   - Locally: create `.env.local` with
     ```
     VITE_SUPABASE_URL=https://<ref>.supabase.co
     VITE_SUPABASE_ANON_KEY=<anon key>
     ```
   - GitHub Pages: add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as repository **variables**
     (Settings → Secrets and variables → Actions → Variables). The deploy workflow passes them to the build.
     The anon key is public by design; row-level security is what protects the data.

Note on shared data: adding a game in the admin portal inserts it into `public.games`, so it also
appears in the MelaPress catalogue. Editing a game writes its title and description back to the
catalogue; genre, platforms and status stay in `mela_games`. A catalogue game with campaigns can't be
deleted until its campaigns are (`on delete restrict`).

## Day-to-day flow

1. **Admin → Games → Add game.** Add its placements (each gets a key like `coastal-market-billboard`).
2. **Connect analytics tab → Create API key.** Give the key and the SDK snippet to the game team.
   Use **Send test event** to check the key and placement keys end to end.
3. **Admin → Clients → Add client** with the brand contact's email. That email can sign in to the client portal.
4. **New campaign**: pick the client, game, dates, budget and placements. Drafts stay hidden from the client.
5. The client signs in at `/client/` with an email link and sees only that campaign's analytics.

## Scaling notes

`rollup_daily` aggregates raw events on each request, which is fine into the tens of millions of events
per game thanks to the `(game_id, ts)` index. Beyond that, add a nightly materialised rollup table and point
`rollup_daily` at it for days before today.
