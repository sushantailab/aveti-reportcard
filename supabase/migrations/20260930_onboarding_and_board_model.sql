-- MarksKhata productisation, step 1: onboarding fields + board model foundation.
-- All changes are additive with safe defaults, so existing centres keep working
-- unchanged. See docs/ARCHITECTURE.md §11 for the full design.
--
-- This migration does NOT touch existing data. It only adds columns and one new
-- table. Run it in the Supabase SQL editor.

-- 1) Onboarding fields on the centre. -----------------------------------------
alter table public.centres
  add column if not exists board        text   not null default 'CBSE-NCERT',
  add column if not exists centre_type  text   not null default 'coaching',
  add column if not exists class_levels int[]  not null default '{}',
  add column if not exists language     text   not null default 'en';

-- Keep the values sane without blocking future boards/types.
alter table public.centres drop constraint if exists centres_board_check;
alter table public.centres add constraint centres_board_check
  check (board in ('CBSE-NCERT','Odisha-Board','CBSE-Other'));

alter table public.centres drop constraint if exists centres_type_check;
alter table public.centres add constraint centres_type_check
  check (centre_type in ('school','coaching'));

alter table public.centres drop constraint if exists centres_language_check;
alter table public.centres add constraint centres_language_check
  check (language in ('en','or'));

-- 2) Bilingual chapter title. Existing English titles stay in `title`; the Odia
--    title goes in `title_or` (nullable — only filled where a translation exists).
alter table public.chapters
  add column if not exists title_or text;

-- 3) Per-centre custom subjects (the "Add your own subject" feature). Mirrors the
--    per-centre custom chapters that already live in public.chapters.
create table if not exists public.centre_subjects (
  id          uuid primary key default gen_random_uuid(),
  centre_id   uuid not null references public.centres(id) on delete cascade,
  class_level int  not null,
  subject     text not null,          -- English / canonical name, e.g. 'English Grammar'
  name_or     text,                   -- optional Odia display name
  created_at  timestamptz not null default now(),
  unique (centre_id, class_level, subject)
);

create index if not exists centre_subjects_lookup_idx
  on public.centre_subjects(centre_id, class_level);

alter table public.centre_subjects enable row level security;

drop policy if exists centre_subjects_access_select on public.centre_subjects;
drop policy if exists centre_subjects_access_insert on public.centre_subjects;
drop policy if exists centre_subjects_access_update on public.centre_subjects;
drop policy if exists centre_subjects_access_delete on public.centre_subjects;

create policy centre_subjects_access_select on public.centre_subjects
  for select to authenticated using (app_private.can_access_centre(centre_id));
create policy centre_subjects_access_insert on public.centre_subjects
  for insert to authenticated with check (app_private.can_write_centre(centre_id));
create policy centre_subjects_access_update on public.centre_subjects
  for update to authenticated using (app_private.can_write_centre(centre_id))
                              with check (app_private.can_write_centre(centre_id));
create policy centre_subjects_access_delete on public.centre_subjects
  for delete to authenticated using (app_private.can_delete());
