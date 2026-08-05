-- A single teacher can cover several classes and subjects.
-- These are optional so existing teacher records remain usable for any test.
alter table public.tah_teachers
  add column if not exists gender text check (gender in ('female','male','other')),
  add column if not exists class_levels integer[] not null default '{}',
  add column if not exists subjects text[] not null default '{}';
