-- Applied to the MelaPress Supabase project (TemoLima lives there, not in Mela Scale's own
-- backend), so this file is a record and is not part of supabase/migrations.
--
-- Read-only progress lookup for the Mela Scale platform page. temolima_players,
-- temolima_saves and temolima_achievements keep RLS on with no policies; this function
-- returns one player's row, save time and achievements when given that player's code,
-- the same secret the game itself uses with temolima_restore. No table, column or policy
-- changes. Returns null for an unknown code.
create or replace function public.temolima_progress(p_player uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'player', jsonb_build_object(
      'farmer_name', p.farmer_name,
      'level', p.level,
      'xp', p.xp,
      'season', p.season,
      'stage', p.stage,
      'points', p.points,
      'coins', p.coins,
      'days_played', p.days_played,
      'streak', p.streak,
      'best_streak', p.best_streak,
      'badges_won', p.badges_won,
      'play_seconds', p.play_seconds,
      'last_seen_at', p.last_seen_at
    ),
    'saved_at', (select s.client_saved_at from public.temolima_saves s where s.player_id = p.id),
    'achievements', coalesce((
      select jsonb_agg(jsonb_build_object(
               'badge_id', a.badge_id, 'game', a.game, 'tier', a.tier,
               'title', a.title, 'won_on', a.won_on, 'claimed', a.claimed)
             order by a.won_on desc nulls last, a.badge_id)
      from public.temolima_achievements a
      where a.player_id = p.id
    ), '[]'::jsonb)
  )
  from public.temolima_players p
  where p.id = p_player;
$$;

comment on function public.temolima_progress(uuid) is
  'Read-only TemoLima progress (player row, save time, achievements) for one player code. Used by the Mela Scale platform page.';

revoke all on function public.temolima_progress(uuid) from public;
grant execute on function public.temolima_progress(uuid) to anon, authenticated;
