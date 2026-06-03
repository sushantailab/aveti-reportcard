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
