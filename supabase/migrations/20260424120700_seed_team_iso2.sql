-- Cup26 Arena - seed ISO 3166-1 alpha-2 codes for every team.
-- Used to fetch circular flag SVGs from HatScripts/circle-flags via CDN.
-- Non-standard entries:
--   SCO -> gb-sct (Scotland)
--   ENG -> gb-eng (England)
-- All other codes are the canonical lowercase ISO alpha-2.

alter table public.teams
  add column if not exists iso2_code text;

-- Lightweight shape check: 2-letter ISO OR hyphenated GB subdivision.
alter table public.teams
  drop constraint if exists teams_iso2_code_format_chk;
alter table public.teams
  add constraint teams_iso2_code_format_chk
  check (
    iso2_code is null
    or iso2_code ~ '^[a-z]{2}$'
    or iso2_code ~ '^gb-[a-z]{3}$'
  );

update public.teams t
set iso2_code = v.iso2
from (values
  -- Group A
  ('MEX', 'mx'),
  ('RSA', 'za'),
  ('KOR', 'kr'),
  ('CZE', 'cz'),
  -- Group B
  ('CAN', 'ca'),
  ('BIH', 'ba'),
  ('QAT', 'qa'),
  ('SUI', 'ch'),
  -- Group C
  ('HAI', 'ht'),
  ('SCO', 'gb-sct'),
  ('BRA', 'br'),
  ('MAR', 'ma'),
  -- Group D
  ('USA', 'us'),
  ('PAR', 'py'),
  ('AUS', 'au'),
  ('TUR', 'tr'),
  -- Group E
  ('CIV', 'ci'),
  ('ECU', 'ec'),
  ('GER', 'de'),
  ('CUW', 'cw'),
  -- Group F
  ('NED', 'nl'),
  ('JPN', 'jp'),
  ('SWE', 'se'),
  ('TUN', 'tn'),
  -- Group G
  ('IRN', 'ir'),
  ('NZL', 'nz'),
  ('BEL', 'be'),
  ('EGY', 'eg'),
  -- Group H
  ('KSA', 'sa'),
  ('URU', 'uy'),
  ('ESP', 'es'),
  ('CPV', 'cv'),
  -- Group I
  ('FRA', 'fr'),
  ('SEN', 'sn'),
  ('IRQ', 'iq'),
  ('NOR', 'no'),
  -- Group J
  ('ARG', 'ar'),
  ('ALG', 'dz'),
  ('AUT', 'at'),
  ('JOR', 'jo'),
  -- Group K
  ('POR', 'pt'),
  ('COD', 'cd'),
  ('UZB', 'uz'),
  ('COL', 'co'),
  -- Group L
  ('GHA', 'gh'),
  ('PAN', 'pa'),
  ('ENG', 'gb-eng'),
  ('CRO', 'hr')
) as v(code, iso2)
where t.code = v.code;
