-- Cup26 Arena - seed primary_color / accent_color for all 48 teams.
--
-- Single UPDATE using a VALUES table - idempotent; safe to re-run.
-- Colors are approximations of the dominant + secondary flag colors,
-- chosen to give reasonable contrast when used as CSS variables in UI.
-- primary_color is used for backgrounds / accents, accent_color for
-- borders / highlights. The theming layer computes ink contrast.

update public.teams as t
set
  primary_color = c.primary_color,
  accent_color  = c.accent_color
from (values
  -- Group A
  ('MEX', '#006847', '#CE1126'),
  ('RSA', '#007A4D', '#FCB514'),
  ('KOR', '#003478', '#C8102E'),
  ('CZE', '#11457E', '#D7141A'),

  -- Group B
  ('CAN', '#D52B1E', '#0B0B0B'),
  ('BIH', '#002395', '#FECB00'),
  ('QAT', '#8A1538', '#1F1F1F'),
  ('SUI', '#DA291C', '#0B0B0B'),

  -- Group C
  ('HAI', '#00209F', '#D21034'),
  ('SCO', '#0065BD', '#000066'),
  ('BRA', '#009C3B', '#FFDF00'),
  ('MAR', '#C1272D', '#006233'),

  -- Group D
  ('USA', '#3C3B6E', '#B22234'),
  ('PAR', '#D52B1C', '#0038A8'),
  ('AUS', '#012169', '#E4002B'),
  ('TUR', '#E30A17', '#0B0B0B'),

  -- Group E
  ('CIV', '#FF9A1F', '#00923F'),
  ('ECU', '#FFDD00', '#034EA2'),
  ('GER', '#0B0B0B', '#DD0000'),
  ('CUW', '#002868', '#F9E814'),

  -- Group F
  ('NED', '#AE1C28', '#21468B'),
  ('JPN', '#BC002D', '#0B0B0B'),
  ('SWE', '#006AA7', '#FECC00'),
  ('TUN', '#E70013', '#0B0B0B'),

  -- Group G
  ('IRN', '#239F40', '#DA0000'),
  ('NZL', '#00247D', '#CC142B'),
  ('BEL', '#0B0B0B', '#FAE042'),
  ('EGY', '#CE1126', '#0B0B0B'),

  -- Group H
  ('KSA', '#006C35', '#FFC72C'),
  ('URU', '#0038A8', '#FCD116'),
  ('ESP', '#AA151B', '#F1BF00'),
  ('CPV', '#003893', '#CF2027'),

  -- Group I
  ('FRA', '#002395', '#ED2939'),
  ('SEN', '#00853F', '#FDEF42'),
  ('IRQ', '#CE1126', '#0B0B0B'),
  ('NOR', '#BA0C2F', '#00205B'),

  -- Group J
  ('ARG', '#75AADB', '#F4B641'),
  ('ALG', '#006633', '#D21034'),
  ('AUT', '#ED2939', '#0B0B0B'),
  ('JOR', '#0B0B0B', '#CE1126'),

  -- Group K
  ('POR', '#046A38', '#DA291C'),
  ('COD', '#007FFF', '#F7D618'),
  ('UZB', '#1EB53A', '#0099B5'),
  ('COL', '#FCD116', '#003893'),

  -- Group L
  ('GHA', '#006B3F', '#FCD116'),
  ('PAN', '#005293', '#D21034'),
  ('ENG', '#0B1B3A', '#CE1124'),
  ('CRO', '#002D72', '#C8102E')
) as c(code, primary_color, accent_color)
where t.code = c.code;
