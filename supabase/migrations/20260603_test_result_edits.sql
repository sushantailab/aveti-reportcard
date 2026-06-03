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
