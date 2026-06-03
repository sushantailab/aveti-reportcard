-- Combined Aveti Supabase migration. Paste this full file into Supabase SQL Editor.
-- Run once. If any error appears, stop and send the error to Codex.


-- ============================================================
-- 20260603_chapters_backfill.sql
-- ============================================================

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




-- ============================================================
-- 20260603_results_attendance_flags.sql
-- ============================================================

-- Distinguish enrolled / appeared / absent / N.A. in saved test results.

alter table public.results
  add column if not exists na boolean not null default false;

update public.results
set na = false
where na is null;




-- ============================================================
-- 20260603_centre_band_config.sql
-- ============================================================

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




-- ============================================================
-- 20260603_rls_centre_isolation.sql
-- ============================================================

-- RLS hardening: isolate all data by authenticated centre owner.
--
-- IMPORTANT for existing data:
-- 1) Run the diagnostic query below to find centre IDs.
-- 2) Set each existing centre's owner_user_id to the correct Supabase auth.users.id.
--    Example:
--      update public.centres
--      set owner_user_id = '00000000-0000-0000-0000-000000000000'
--      where id = '11111111-1111-1111-1111-111111111111';
-- 3) Then run/keep the policy section below.
--
-- Diagnostic:
--   select id, name, owner_user_id from public.centres order by created_at nulls last;

alter table public.centres
  add column if not exists owner_user_id uuid references auth.users(id) on delete cascade;

alter table public.centres
  alter column owner_user_id set default auth.uid();

create index if not exists centres_owner_user_id_idx
  on public.centres(owner_user_id);

create index if not exists students_centre_id_idx
  on public.students(centre_id);

create index if not exists tests_centre_id_idx
  on public.tests(centre_id);

create index if not exists results_test_id_idx
  on public.results(test_id);

create index if not exists results_student_id_idx
  on public.results(student_id);

create index if not exists chapters_centre_id_idx
  on public.chapters(centre_id);

alter table public.centres enable row level security;
alter table public.students enable row level security;
alter table public.tests enable row level security;
alter table public.results enable row level security;
alter table public.chapters enable row level security;

-- Remove all older policies on these tables first. RLS policies are permissive
-- by default, so a leftover broad policy would still leak data.
do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('centres','students','tests','results','chapters')
  loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- Remove older broad policies if they exist.
drop policy if exists "Chapters are readable by authenticated users" on public.chapters;
drop policy if exists "Chapters are writable by authenticated users" on public.chapters;

drop policy if exists "centres_owner_select" on public.centres;
drop policy if exists "centres_owner_insert" on public.centres;
drop policy if exists "centres_owner_update" on public.centres;
drop policy if exists "centres_owner_delete" on public.centres;

create policy "centres_owner_select"
  on public.centres for select
  to authenticated
  using (owner_user_id = auth.uid());

create policy "centres_owner_insert"
  on public.centres for insert
  to authenticated
  with check (owner_user_id = auth.uid());

create policy "centres_owner_update"
  on public.centres for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "centres_owner_delete"
  on public.centres for delete
  to authenticated
  using (owner_user_id = auth.uid());

drop policy if exists "students_centre_select" on public.students;
drop policy if exists "students_centre_insert" on public.students;
drop policy if exists "students_centre_update" on public.students;
drop policy if exists "students_centre_delete" on public.students;

create policy "students_centre_select"
  on public.students for select
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = students.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "students_centre_insert"
  on public.students for insert
  to authenticated
  with check (
    exists (
      select 1 from public.centres c
      where c.id = students.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "students_centre_update"
  on public.students for update
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = students.centre_id
        and c.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.centres c
      where c.id = students.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "students_centre_delete"
  on public.students for delete
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = students.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

drop policy if exists "tests_centre_select" on public.tests;
drop policy if exists "tests_centre_insert" on public.tests;
drop policy if exists "tests_centre_update" on public.tests;
drop policy if exists "tests_centre_delete" on public.tests;

create policy "tests_centre_select"
  on public.tests for select
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = tests.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "tests_centre_insert"
  on public.tests for insert
  to authenticated
  with check (
    exists (
      select 1 from public.centres c
      where c.id = tests.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "tests_centre_update"
  on public.tests for update
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = tests.centre_id
        and c.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.centres c
      where c.id = tests.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "tests_centre_delete"
  on public.tests for delete
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = tests.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

drop policy if exists "chapters_centre_select" on public.chapters;
drop policy if exists "chapters_centre_insert" on public.chapters;
drop policy if exists "chapters_centre_update" on public.chapters;
drop policy if exists "chapters_centre_delete" on public.chapters;

create policy "chapters_centre_select"
  on public.chapters for select
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = chapters.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "chapters_centre_insert"
  on public.chapters for insert
  to authenticated
  with check (
    exists (
      select 1 from public.centres c
      where c.id = chapters.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "chapters_centre_update"
  on public.chapters for update
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = chapters.centre_id
        and c.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.centres c
      where c.id = chapters.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "chapters_centre_delete"
  on public.chapters for delete
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = chapters.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

drop policy if exists "results_centre_select" on public.results;
drop policy if exists "results_centre_insert" on public.results;
drop policy if exists "results_centre_update" on public.results;
drop policy if exists "results_centre_delete" on public.results;

create policy "results_centre_select"
  on public.results for select
  to authenticated
  using (
    exists (
      select 1
      from public.tests t
      join public.centres c on c.id = t.centre_id
      where t.id = results.test_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "results_centre_insert"
  on public.results for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tests t
      join public.centres c on c.id = t.centre_id
      join public.students s on s.id = results.student_id and s.centre_id = t.centre_id
      where t.id = results.test_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "results_centre_update"
  on public.results for update
  to authenticated
  using (
    exists (
      select 1
      from public.tests t
      join public.centres c on c.id = t.centre_id
      where t.id = results.test_id
        and c.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.tests t
      join public.centres c on c.id = t.centre_id
      join public.students s on s.id = results.student_id and s.centre_id = t.centre_id
      where t.id = results.test_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "results_centre_delete"
  on public.results for delete
  to authenticated
  using (
    exists (
      select 1
      from public.tests t
      join public.centres c on c.id = t.centre_id
      where t.id = results.test_id
        and c.owner_user_id = auth.uid()
    )
  );




-- ============================================================
-- 20260603_test_result_edits.sql
-- ============================================================

-- Audit mark edits without storing parent contact data.

create table if not exists public.test_result_edits (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid references public.centres(id) on delete cascade,
  test_id uuid references public.tests(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  edited_by uuid references auth.users(id),
  edited_at timestamptz not null default now(),
  old_marks numeric,
  new_marks numeric,
  old_present boolean not null default false,
  new_present boolean not null default false,
  old_na boolean not null default false,
  new_na boolean not null default false
);

create index if not exists test_result_edits_centre_id_idx
  on public.test_result_edits(centre_id);

create index if not exists test_result_edits_test_id_idx
  on public.test_result_edits(test_id);

alter table public.test_result_edits enable row level security;

drop policy if exists "test_result_edits_centre_select" on public.test_result_edits;
drop policy if exists "test_result_edits_centre_insert" on public.test_result_edits;

create policy "test_result_edits_centre_select"
  on public.test_result_edits for select
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = test_result_edits.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "test_result_edits_centre_insert"
  on public.test_result_edits for insert
  to authenticated
  with check (
    edited_by = auth.uid()
    and exists (
      select 1
      from public.tests t
      join public.students s on s.id = test_result_edits.student_id and s.centre_id = t.centre_id
      join public.centres c on c.id = t.centre_id
      where t.id = test_result_edits.test_id
        and c.id = test_result_edits.centre_id
        and c.owner_user_id = auth.uid()
    )
  );


