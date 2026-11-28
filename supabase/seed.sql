-- Starting data for a fresh Mela Scale project: Kunta Content's game portfolio and
-- the placements already designed into LIMA Farming. No events: those come from the games.
-- Replace the staff email with your own before running.

insert into public.staff (email, name, role) values
  ('admin@kuntacontent.example', 'Kunta admin', 'admin')
on conflict (email) do nothing;

insert into public.games (slug, name, abbr, hue, genre, platforms, status, mau, description) values
  ('lima-farming',     'LIMA Farming Game',     'LF', 145, 'Farming sim',      '{mobile,webgl}', 'live',        12400000, 'Cosy farming sim set across five maps of the Lima valley.'),
  ('mazu-runner',      'MAZU Runner',           'MR', 210, 'Endless runner',   '{mobile}',       'live',         6800000, 'Endless runner through coastal city streets.'),
  ('sango-platformer', 'SANGO Platformer Game', 'SP', 270, 'Platformer',       '{webgl,mobile}', 'live',         2900000, 'Side-scrolling platformer with seasonal worlds.'),
  ('hiru',             'HIRU Game',             'HG',  30, 'Action adventure', '{webgl}',        'beta',          640000, 'Action adventure, in open beta on WebGL.'),
  ('kushaba-fighting', 'KUSHABA Fighting Game', 'KF', 350, 'Fighting',         '{pc,console}',   'development',        0, '1v1 fighter.'),
  ('imaginarium-map',  'IMAGINARIUM Map Game',  'IM',  55, 'Exploration',      '{webgl}',        'development',        0, 'Map-building exploration game.')
on conflict (slug) do nothing;

insert into public.placements (game_id, key, name, kind, location)
select g.id, p.key, p.name, p.kind, p.location
from public.games g
join (values
  ('lima-farming', 'sunfield-seed-pack',        'Branded crop seeds',        'cosmetic',      'Sunfield Valley'),
  ('lima-farming', 'harvest-silo-sign',         'Grain silo signage',        'environmental', 'Harvest Hollow'),
  ('lima-farming', 'cedar-season-cutscene',     'Season-change cutscene',    'cutscene',      'Cedar Heights'),
  ('lima-farming', 'coastal-market-billboard',  'Market road billboard',     'billboard',     'Coastal Acres'),
  ('lima-farming', 'highland-tractor-wrap',     'Tractor wrap',              'cosmetic',      'Highland Pastures'),
  ('lima-farming', 'harvest-tutorial',          'Smart tractor tutorial',    'tutorial',      'Harvest Hollow'),
  ('lima-farming', 'sunfield-square-billboard', 'Town square billboard',     'billboard',     'Sunfield Valley'),
  ('mazu-runner',  'harbor-billboard',          'Harbor district billboard', 'billboard',     'Harbor'),
  ('mazu-runner',  'runner-shoes',              'Branded runner shoes',      'cosmetic',      'Character'),
  ('mazu-runner',  'energy-powerup',            'Energy drink power-up',     'branded_item',  'Gameplay'),
  ('sango-platformer', 'world2-banner',         'World 2 banner',            'billboard',     'Spring World'),
  ('sango-platformer', 'harvest-festival',      'Harvest festival event',    'event',         'Autumn World'),
  ('hiru', 'assegai-relic',                     'Sponsored relic item',      'branded_item',  'Act I'),
  ('hiru', 'intro-cutscene',                    'Intro cutscene',            'cutscene',      'Prologue')
) as p (slug, key, name, kind, location) on p.slug = g.slug
on conflict (game_id, key) do nothing;
