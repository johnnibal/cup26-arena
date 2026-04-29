-- Cup26 Arena - seed teams
-- 48 qualified nations, exactly the teams that appear in the group-stage fixtures.
-- Codes follow FIFA 3-letter conventions.
-- primary_color / accent_color are left null for now; populated in Step 5 (flag theming).

insert into public.teams (code, name, group_letter) values
  -- Group A
  ('MEX', 'Mexico',                 'A'),
  ('RSA', 'South Africa',           'A'),
  ('KOR', 'Korea Republic',         'A'),
  ('CZE', 'Czechia',                'A'),

  -- Group B
  ('CAN', 'Canada',                 'B'),
  ('BIH', 'Bosnia and Herzegovina', 'B'),
  ('QAT', 'Qatar',                  'B'),
  ('SUI', 'Switzerland',            'B'),

  -- Group C
  ('HAI', 'Haiti',                  'C'),
  ('SCO', 'Scotland',               'C'),
  ('BRA', 'Brazil',                 'C'),
  ('MAR', 'Morocco',                'C'),

  -- Group D
  ('USA', 'USA',                    'D'),
  ('PAR', 'Paraguay',               'D'),
  ('AUS', 'Australia',              'D'),
  ('TUR', 'Türkiye',                'D'),

  -- Group E
  ('CIV', 'Côte d''Ivoire',         'E'),
  ('ECU', 'Ecuador',                'E'),
  ('GER', 'Germany',                'E'),
  ('CUW', 'Curaçao',                'E'),

  -- Group F
  ('NED', 'Netherlands',            'F'),
  ('JPN', 'Japan',                  'F'),
  ('SWE', 'Sweden',                 'F'),
  ('TUN', 'Tunisia',                'F'),

  -- Group G
  ('IRN', 'IR Iran',                'G'),
  ('NZL', 'New Zealand',            'G'),
  ('BEL', 'Belgium',                'G'),
  ('EGY', 'Egypt',                  'G'),

  -- Group H
  ('KSA', 'Saudi Arabia',           'H'),
  ('URU', 'Uruguay',                'H'),
  ('ESP', 'Spain',                  'H'),
  ('CPV', 'Cabo Verde',             'H'),

  -- Group I
  ('FRA', 'France',                 'I'),
  ('SEN', 'Senegal',                'I'),
  ('IRQ', 'Iraq',                   'I'),
  ('NOR', 'Norway',                 'I'),

  -- Group J
  ('ARG', 'Argentina',              'J'),
  ('ALG', 'Algeria',                'J'),
  ('AUT', 'Austria',                'J'),
  ('JOR', 'Jordan',                 'J'),

  -- Group K
  ('POR', 'Portugal',               'K'),
  ('COD', 'Congo DR',               'K'),
  ('UZB', 'Uzbekistan',             'K'),
  ('COL', 'Colombia',               'K'),

  -- Group L
  ('GHA', 'Ghana',                  'L'),
  ('PAN', 'Panama',                 'L'),
  ('ENG', 'England',                'L'),
  ('CRO', 'Croatia',                'L')
on conflict (code) do nothing;
