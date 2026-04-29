-- User-controlled profile card gradient (team colors unchanged; only distribution / style).

alter table public.profiles
  add column if not exists gradient_angle smallint not null default 135
    check (gradient_angle >= 0 and gradient_angle <= 360),
  add column if not exists gradient_primary_stop smallint not null default 0
    check (gradient_primary_stop >= 0 and gradient_primary_stop <= 100),
  add column if not exists gradient_secondary_stop smallint not null default 55
    check (gradient_secondary_stop >= 0 and gradient_secondary_stop <= 100),
  add column if not exists gradient_accent_stop smallint not null default 100
    check (gradient_accent_stop >= 0 and gradient_accent_stop <= 100),
  add column if not exists gradient_style text not null default 'wave'
    check (gradient_style in ('smooth', 'wave', 'radial', 'spotlight'));

comment on column public.profiles.gradient_angle is 'Degrees for linear-gradient base (0–360).';
comment on column public.profiles.gradient_primary_stop is 'Color stop % for team primary along base gradient.';
comment on column public.profiles.gradient_secondary_stop is 'Color stop % for team secondary.';
comment on column public.profiles.gradient_accent_stop is 'Color stop % for team accent.';
comment on column public.profiles.gradient_style is 'smooth | wave | radial | spotlight';
