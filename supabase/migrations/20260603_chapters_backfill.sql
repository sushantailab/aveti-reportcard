-- Canonical chapters per centre/class/subject.
-- Run this in Supabase SQL editor before deploying the app change.

create extension if not exists pgcrypto;

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid references public.centres(id) on delete cascade,
  class_level int not null,
  subject text not null,
  chapter_no int not null,
  title text not null,
  created_at timestamptz not null default now()
);

alter table public.tests
  add column if not exists chapter_id uuid references public.chapters(id);

create unique index if not exists chapters_canonical_unique
  on public.chapters (
    centre_id,
    class_level,
    lower(trim(subject)),
    lower(regexp_replace(trim(title), '\s+', ' ', 'g'))
  );

create unique index if not exists chapters_number_unique
  on public.chapters (
    centre_id,
    class_level,
    lower(trim(subject)),
    chapter_no
  );

create or replace function public.normalized_chapter_title(chapter_no int, raw_title text)
returns text
language sql
immutable
as $$
  select case
    when nullif(trim(coalesce(raw_title,'')), '') is null then 'Chapter ' || chapter_no::text
    when lower(regexp_replace(trim(raw_title), '[\s-]+', '', 'g')) in ('ch' || chapter_no::text, 'chapter' || chapter_no::text)
      then 'Chapter ' || chapter_no::text
    else regexp_replace(trim(raw_title), '\s+', ' ', 'g')
  end
$$;

with normalized_tests as (
  select
    id,
    centre_id,
    class_level,
    subject,
    coalesce(chapter_no, 1) as chapter_no,
    public.normalized_chapter_title(coalesce(chapter_no, 1), chapter_name) as title
  from public.tests
),
inserted as (
  insert into public.chapters (centre_id, class_level, subject, chapter_no, title)
  select distinct on (
    centre_id,
    class_level,
    lower(trim(subject)),
    lower(regexp_replace(trim(title), '\s+', ' ', 'g'))
  )
    centre_id,
    class_level,
    subject,
    chapter_no,
    title
  from normalized_tests
  order by
    centre_id,
    class_level,
    lower(trim(subject)),
    lower(regexp_replace(trim(title), '\s+', ' ', 'g')),
    chapter_no
  on conflict do nothing
  returning id
)
update public.tests t
set chapter_id = c.id,
    chapter_no = c.chapter_no,
    chapter_name = c.title
from public.chapters c
where t.centre_id = c.centre_id
  and t.class_level = c.class_level
  and lower(trim(t.subject)) = lower(trim(c.subject))
  and (
    coalesce(t.chapter_no, 1) = c.chapter_no
    or lower(regexp_replace(public.normalized_chapter_title(coalesce(t.chapter_no, 1), t.chapter_name), '\s+', ' ', 'g'))
      = lower(regexp_replace(trim(c.title), '\s+', ' ', 'g'))
  );

alter table public.chapters enable row level security;

drop policy if exists "Chapters are readable by authenticated users" on public.chapters;
create policy "Chapters are readable by authenticated users"
  on public.chapters for select
  to authenticated
  using (true);

drop policy if exists "Chapters are writable by authenticated users" on public.chapters;
create policy "Chapters are writable by authenticated users"
  on public.chapters for all
  to authenticated
  using (true)
  with check (true);
