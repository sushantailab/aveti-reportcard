-- Independent school examination records. These never enter tests/results.
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres(id) on delete cascade,
  name text not null,
  board text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (centre_id, name)
);

create table if not exists public.student_school_enrolments (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete restrict,
  academic_session text not null,
  class_level int not null,
  section text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, academic_session)
);

create table if not exists public.school_exam_results (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  academic_session text not null,
  subject text not null,
  exam_type text not null,
  school_exam_date date not null,
  marks_obtained numeric,
  full_marks numeric not null,
  percentage numeric generated always as (
    case when marks_obtained is null then null else round((marks_obtained / full_marks) * 100, 1) end
  ) stored,
  result_status text not null default 'scored' check (result_status in ('scored','absent','not_attempted')),
  entered_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (full_marks > 0),
  check (marks_obtained is null or (marks_obtained >= 0 and marks_obtained <= full_marks)),
  check ((result_status = 'scored' and marks_obtained is not null) or (result_status <> 'scored' and marks_obtained is null)),
  unique (student_id, academic_session, subject, exam_type, school_exam_date)
);

create index if not exists schools_centre_idx on public.schools(centre_id);
create index if not exists student_school_enrolments_lookup_idx on public.student_school_enrolments(centre_id, academic_session, student_id);
create index if not exists school_exam_results_lookup_idx on public.school_exam_results(centre_id, academic_session, subject, exam_type, school_exam_date);

alter table public.schools enable row level security;
alter table public.student_school_enrolments enable row level security;
alter table public.school_exam_results enable row level security;

drop policy if exists schools_access_select on public.schools;
drop policy if exists schools_access_insert on public.schools;
drop policy if exists schools_access_update on public.schools;
drop policy if exists schools_access_delete on public.schools;
create policy schools_access_select on public.schools for select to authenticated using (app_private.can_access_centre(centre_id));
create policy schools_access_insert on public.schools for insert to authenticated with check (app_private.can_write_centre(centre_id));
create policy schools_access_update on public.schools for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(centre_id));
create policy schools_access_delete on public.schools for delete to authenticated using (app_private.can_delete());

drop policy if exists student_school_enrolments_access_select on public.student_school_enrolments;
drop policy if exists student_school_enrolments_access_insert on public.student_school_enrolments;
drop policy if exists student_school_enrolments_access_update on public.student_school_enrolments;
drop policy if exists student_school_enrolments_access_delete on public.student_school_enrolments;
create policy student_school_enrolments_access_select on public.student_school_enrolments for select to authenticated using (app_private.can_access_centre(centre_id));
create policy student_school_enrolments_access_insert on public.student_school_enrolments for insert to authenticated with check (app_private.can_write_centre(student_school_enrolments.centre_id) and exists (select 1 from public.students s where s.id=student_school_enrolments.student_id and s.centre_id=student_school_enrolments.centre_id) and exists (select 1 from public.schools x where x.id=student_school_enrolments.school_id and x.centre_id=student_school_enrolments.centre_id));
create policy student_school_enrolments_access_update on public.student_school_enrolments for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(student_school_enrolments.centre_id) and exists (select 1 from public.students s where s.id=student_school_enrolments.student_id and s.centre_id=student_school_enrolments.centre_id) and exists (select 1 from public.schools x where x.id=student_school_enrolments.school_id and x.centre_id=student_school_enrolments.centre_id));
create policy student_school_enrolments_access_delete on public.student_school_enrolments for delete to authenticated using (app_private.can_delete());

drop policy if exists school_exam_results_access_select on public.school_exam_results;
drop policy if exists school_exam_results_access_insert on public.school_exam_results;
drop policy if exists school_exam_results_access_update on public.school_exam_results;
drop policy if exists school_exam_results_access_delete on public.school_exam_results;
create policy school_exam_results_access_select on public.school_exam_results for select to authenticated using (app_private.can_access_centre(centre_id));
create policy school_exam_results_access_insert on public.school_exam_results for insert to authenticated with check (app_private.can_write_centre(school_exam_results.centre_id) and exists (select 1 from public.students s where s.id=school_exam_results.student_id and s.centre_id=school_exam_results.centre_id));
create policy school_exam_results_access_update on public.school_exam_results for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(school_exam_results.centre_id) and exists (select 1 from public.students s where s.id=school_exam_results.student_id and s.centre_id=school_exam_results.centre_id));
create policy school_exam_results_access_delete on public.school_exam_results for delete to authenticated using (app_private.can_delete());
