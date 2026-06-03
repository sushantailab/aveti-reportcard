-- Per-centre configurable performance bands.

alter table public.centres
  add column if not exists band_config jsonb not null default
  '[
    {"grade":"A","min":80,"max":100,"label":"Excellent"},
    {"grade":"B","min":60,"max":79,"label":"Very Good"},
    {"grade":"C","min":40,"max":59,"label":"Good"},
    {"grade":"D","min":0,"max":39,"label":"Needs Support"}
  ]'::jsonb;

update public.centres
set band_config =
  '[
    {"grade":"A","min":80,"max":100,"label":"Excellent"},
    {"grade":"B","min":60,"max":79,"label":"Very Good"},
    {"grade":"C","min":40,"max":59,"label":"Good"},
    {"grade":"D","min":0,"max":39,"label":"Needs Support"}
  ]'::jsonb
where band_config is null;
