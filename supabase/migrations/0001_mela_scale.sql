-- Mela Scale: games, placements, clients, campaigns, API keys and analytics events.
--
-- Who sees what (row-level security):
--   * Kunta Content staff (rows in public.staff, matched on the signed-in email) see and manage everything.
--   * Client users (rows in public.client_users) see their own client, its active campaigns,
--     the games and placements in those campaigns, and events/rollups for those placements only.
--   * Games never sign in. They post events to the `ingest` edge function with an API key;
--     that function writes with the service role.

create extension if not exists pgcrypto with schema extensions;

-- ── tables ────────────────────────────────────────────────────────────────

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  role text not null default 'admin' check (role in ('admin', 'analyst')),
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  abbr text,
  hue int not null default 145,
  studio text not null default 'Kunta Content',
  genre text,
  platforms text[] not null default '{}',
  status text not null default 'development' check (status in ('live', 'beta', 'development', 'paused')),
  mau bigint not null default 0,
  description text,
  created_at timestamptz not null default now()
);

create table public.placements (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9][a-z0-9-]{0,47}$'),
  name text not null,
  kind text not null default 'billboard',
  location text,
  platform text not null default 'all',
  created_at timestamptz not null default now(),
  unique (game_id, key)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  contact_email text,
  hue int not null default 80,
  created_at timestamptz not null default now()
);

create table public.client_users (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  email text not null,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  unique (client_id, email)
);
create index client_users_email_idx on public.client_users (lower(email));

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  game_id uuid not null references public.games (id) on delete restrict,
  name text not null,
  start_date date not null,
  end_date date not null,
  budget numeric not null default 0,
  conversion_value numeric not null default 24,
  status text not null default 'active' check (status in ('active', 'draft')),
  placement_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
create index campaigns_client_idx on public.campaigns (client_id);
create index campaigns_game_idx on public.campaigns (game_id);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  label text not null default 'Game client',
  prefix text not null,
  key_hash text not null unique,          -- sha256 hex of the key; the key itself is never stored
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz
);

create table public.events (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.games (id) on delete cascade,
  placement_id uuid references public.placements (id) on delete set null,
  type text not null check (type in ('session_start', 'session_end', 'impression', 'viewable', 'interaction', 'click', 'conversion')),
  session_id text not null,
  player_id text,
  platform text not null default 'unknown',
  region text not null default 'unknown',
  ts timestamptz not null default now(),
  props jsonb not null default '{}',
  source text not null default 'sdk',
  received_at timestamptz not null default now()
);
create index events_game_ts_idx on public.events (game_id, ts desc);
create index events_placement_ts_idx on public.events (placement_id, ts) where placement_id is not null;

-- ── access helpers (security definer so policies don't recurse) ──────────

create or replace function public.current_email() returns text
language sql stable set search_path = '' as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''))
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff s where lower(s.email) = public.current_email())
$$;

create or replace function public.my_client_ids() returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(cu.client_id), '{}') from public.client_users cu where lower(cu.email) = public.current_email()
$$;

-- Placements in the signed-in client's active campaigns.
create or replace function public.my_placement_ids() returns uuid[]
language sql stable security definer set search_path = '' as $$
  select coalesce(array_agg(distinct p), '{}')
  from public.campaigns c, unnest(c.placement_ids) p
  where c.status = 'active' and c.client_id = any (public.my_client_ids())
$$;

create or replace function public.client_can_see_game(p_game uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.campaigns c
    where c.game_id = p_game and c.status = 'active' and c.client_id = any (public.my_client_ids())
  )
$$;

-- ── row-level security ───────────────────────────────────────────────────

alter table public.staff enable row level security;
alter table public.games enable row level security;
alter table public.placements enable row level security;
alter table public.clients enable row level security;
alter table public.client_users enable row level security;
alter table public.campaigns enable row level security;
alter table public.api_keys enable row level security;
alter table public.events enable row level security;

create policy staff_read on public.staff for select to authenticated
  using (public.is_staff() or lower(email) = public.current_email());
create policy staff_write on public.staff for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy games_read on public.games for select to authenticated
  using (public.is_staff() or public.client_can_see_game(id));
create policy games_write on public.games for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy placements_read on public.placements for select to authenticated
  using (public.is_staff() or id = any (public.my_placement_ids()));
create policy placements_write on public.placements for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy clients_read on public.clients for select to authenticated
  using (public.is_staff() or id = any (public.my_client_ids()));
create policy clients_write on public.clients for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy client_users_read on public.client_users for select to authenticated
  using (public.is_staff() or lower(email) = public.current_email());
create policy client_users_write on public.client_users for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

create policy campaigns_read on public.campaigns for select to authenticated
  using (public.is_staff() or (status = 'active' and client_id = any (public.my_client_ids())));
create policy campaigns_write on public.campaigns for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Keys are created only through create_api_key(); staff can list and revoke them.
create policy api_keys_read on public.api_keys for select to authenticated using (public.is_staff());
create policy api_keys_revoke on public.api_keys for update to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- Events are written only by the ingest function (service role). Clients read their placements' events.
create policy events_read on public.events for select to authenticated
  using (public.is_staff() or placement_id = any (public.my_placement_ids()));

-- ── functions the portals call ───────────────────────────────────────────

create or replace function public.create_api_key(p_game uuid, p_label text default 'Game client')
returns table (id uuid, api_key text)
language plpgsql volatile security definer set search_path = '' as $$
declare
  v_key text;
  v_id uuid;
begin
  if not public.is_staff() then
    raise exception 'Only Kunta Content staff can create API keys' using errcode = '42501';
  end if;
  v_key := 'msk_' || encode(extensions.gen_random_bytes(20), 'hex');
  insert into public.api_keys (game_id, label, prefix, key_hash)
  values (p_game, coalesce(nullif(trim(p_label), ''), 'Game client'), left(v_key, 12),
          encode(extensions.digest(v_key, 'sha256'), 'hex'))
  returning api_keys.id into v_id;
  return query select v_id, v_key;
end
$$;

-- Daily rollups for one game. Clients get session-level rows (no placement) plus
-- rows for their own placements; staff get everything.
create or replace function public.rollup_daily(p_game uuid, p_from date, p_to date)
returns table (
  day date, game_id uuid, placement_id uuid, platform text, region text,
  impressions bigint, viewable bigint, interactions bigint, clicks bigint, conversions bigint,
  sessions bigint, players bigint, playtime_sec bigint
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_staff boolean := public.is_staff();
  v_mine uuid[] := public.my_placement_ids();
begin
  if not (v_staff or public.client_can_see_game(p_game)) then
    raise exception 'Not allowed to read this game' using errcode = '42501';
  end if;
  return query
  select (e.ts at time zone 'utc')::date, p_game, e.placement_id, e.platform, e.region,
         count(*) filter (where e.type = 'impression'),
         count(*) filter (where e.type = 'viewable'),
         count(*) filter (where e.type = 'interaction'),
         count(*) filter (where e.type = 'click'),
         count(*) filter (where e.type = 'conversion'),
         count(*) filter (where e.type = 'session_start'),
         count(distinct coalesce(e.player_id, e.session_id)) filter (where e.type = 'session_start'),
         coalesce(sum(case when e.type = 'session_end' and jsonb_typeof(e.props -> 'duration_sec') = 'number'
                           then least((e.props ->> 'duration_sec')::numeric, 86400) else 0 end), 0)::bigint
  from public.events e
  where e.game_id = p_game
    and e.ts >= p_from::timestamptz and e.ts < (p_to + 1)::timestamptz
    and (v_staff or e.placement_id is null or e.placement_id = any (v_mine))
  group by 1, 3, 4, 5;
end
$$;

-- Unique players exposed to a set of placements.
create or replace function public.unique_reach(p_game uuid, p_placements uuid[], p_from date, p_to date)
returns bigint
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (public.is_staff() or p_placements <@ public.my_placement_ids()) then
    raise exception 'Not allowed to read these placements' using errcode = '42501';
  end if;
  return (
    select count(distinct coalesce(e.player_id, e.session_id))
    from public.events e
    where e.game_id = p_game and e.placement_id = any (p_placements)
      and e.type in ('impression', 'viewable')
      and e.ts >= p_from::timestamptz and e.ts < (p_to + 1)::timestamptz
  );
end
$$;

-- Connection status per visible game.
create or replace function public.ingest_health()
returns table (game_id uuid, keys int, last_event_at timestamptz, events_today bigint, connected boolean)
language sql stable security definer set search_path = '' as $$
  select g.id,
         (select count(*)::int from public.api_keys k where k.game_id = g.id and k.revoked_at is null),
         (select max(e.ts) from public.events e where e.game_id = g.id),
         (select count(*) from public.events e where e.game_id = g.id and e.ts >= date_trunc('day', now() at time zone 'utc') at time zone 'utc'),
         exists (select 1 from public.events e where e.game_id = g.id)
  from public.games g
  where public.is_staff() or public.client_can_see_game(g.id)
$$;

revoke all on function public.create_api_key(uuid, text) from public, anon;
revoke all on function public.rollup_daily(uuid, date, date) from public, anon;
revoke all on function public.unique_reach(uuid, uuid[], date, date) from public, anon;
revoke all on function public.ingest_health() from public, anon;
grant execute on function public.create_api_key(uuid, text) to authenticated;
grant execute on function public.rollup_daily(uuid, date, date) to authenticated;
grant execute on function public.unique_reach(uuid, uuid[], date, date) to authenticated;
grant execute on function public.ingest_health() to authenticated;
