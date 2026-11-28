-- Starting data for Mela Scale on the MelaPress project. Games come from the existing
-- MelaPress catalogue (public.games): this seed never inserts into it, so nothing new
-- appears on the public catalogue. It gives every catalogue game its Mela Scale settings
-- and adds the HIRU placements. Games that aren't in the catalogue yet (LIMA, MAZU, SANGO,
-- KUSHABA) can be added from the admin portal (Games → Add game), which does add them to it.
-- Replace the staff email with your own before running.

insert into public.staff (email, name, role) values
  ('admin@kuntacontent.example', 'Kunta admin', 'admin')
on conflict (email) do nothing;

insert into public.mela_games (game_id, genre, status)
select g.id, g.category,
       case when g.release_status ilike '%beta%' then 'beta'
            when g.release_status ~* '(available|launched|released)' or g.status = 'released' then 'live'
            else 'development' end
from public.games g
on conflict (game_id) do nothing;

insert into public.placements (game_id, key, name, kind, location)
select g.id, p.key, p.name, p.kind, p.location
from public.games g
join (values
  ('hiru-action-game', 'assegai-relic',  'Sponsored relic item', 'branded_item', 'Act I'),
  ('hiru-action-game', 'intro-cutscene', 'Intro cutscene',       'cutscene',     'Prologue')
) as p (slug, key, name, kind, location) on p.slug = g.slug
on conflict (game_id, key) do nothing;
