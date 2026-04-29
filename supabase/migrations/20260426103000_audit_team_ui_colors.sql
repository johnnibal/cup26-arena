-- Audit team colors: align DB primary_color / accent_color with app TEAM_UI_PALETTE.
-- Full trio (primary / secondary / accent) is defined in src/lib/team-ui-palette.ts;
-- DB stores primary + accent for reporting and fallback when palette is extended.

update public.teams as t
set
  primary_color = c.primary_color,
  accent_color = c.accent_color
from (values
  ('MEX', '#0B6E4F', '#E8EAEF'),
  ('RSA', '#007749', '#1A1A1A'),
  ('KOR', '#ECEFF4', '#003478'),
  ('CZE', '#11457E', '#E8EAEF'),

  ('CAN', '#D52B1E', '#0B0B0B'),
  ('BIH', '#002395', '#E8EAEF'),
  ('QAT', '#8A1538', '#1A0F14'),
  ('SUI', '#DA291C', '#0B0B0B'),

  ('HAI', '#00209F', '#E8EAEF'),
  ('SCO', '#005EB8', '#001F5C'),
  ('BRA', '#009C3B', '#002776'),
  ('MAR', '#C1272D', '#FCD116'),

  ('USA', '#3C3B6E', '#F0F0F5'),
  ('PAR', '#D52B1C', '#F5F5F5'),
  ('AUS', '#012169', '#E8EAEF'),
  ('TUR', '#E30A17', '#F4F4F4'),

  ('CIV', '#009E60', '#00923F'),
  ('ECU', '#034EA2', '#ED1C24'),
  ('GER', '#0A0A0A', '#E8C400'),
  ('CUW', '#002868', '#E8EAEF'),

  ('NED', '#F36C21', '#EEF1F6'),
  ('JPN', '#ECEFF4', '#141C2E'),
  ('SWE', '#006AA7', '#E8F0F7'),
  ('TUN', '#E70013', '#111111'),

  ('IRN', '#239F40', '#E8EAEF'),
  ('NZL', '#00247D', '#E8EAEF'),
  ('BEL', '#0B0B0B', '#C8102E'),
  ('EGY', '#CE1126', '#C6A000'),

  ('KSA', '#006C35', '#F4F4F4'),
  ('URU', '#0038A8', '#E8F0FF'),
  ('ESP', '#AA151B', '#5C0A0D'),
  ('CPV', '#003893', '#E8EAEF'),

  ('FRA', '#002654', '#ED2939'),
  ('SEN', '#00853F', '#E31B23'),
  ('IRQ', '#CE1126', '#121212'),
  ('NOR', '#BA0C2F', '#EEF2F6'),

  ('ARG', '#6CACE4', '#C9A227'),
  ('ALG', '#006633', '#F4F4F4'),
  ('AUT', '#ED2939', '#0B0B0B'),
  ('JOR', '#0B0B0B', '#E8EAEF'),

  ('POR', '#046A38', '#E8C400'),
  ('COD', '#007FFF', '#CE1126'),
  ('UZB', '#1EB53A', '#E8EAEF'),
  ('COL', '#003893', '#CE1126'),

  ('GHA', '#006B3F', '#CE1126'),
  ('PAN', '#005293', '#E8EAEF'),
  ('ENG', '#E8EAED', '#0B1B3A'),
  ('CRO', '#002D72', '#F4F4F8')
) as c(code, primary_color, accent_color)
where t.code = c.code;
