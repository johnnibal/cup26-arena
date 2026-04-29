-- Optional public text on the profile card (chant, motto, short bio).

alter table public.profiles
  add column if not exists supporter_note text;

comment on column public.profiles.supporter_note is
  'Optional supporter message shown on profile card; max length enforced in app.';
