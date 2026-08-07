-- Student Master school assignment. Historical enrolments remain available for school-result comparisons.
alter table public.schools add column if not exists school_name text;
alter table public.schools add column if not exists city text;
alter table public.schools add column if not exists is_active boolean not null default true;
update public.schools set school_name=name where school_name is null;
alter table public.schools alter column school_name set not null;
create unique index if not exists schools_centre_school_name_idx on public.schools(centre_id, lower(school_name)) where archived_at is null;

alter table public.students add column if not exists school_id uuid references public.schools(id) on delete set null;
create index if not exists students_school_idx on public.students(centre_id, school_id);

drop policy if exists students_school_assignment_insert on public.students;
drop policy if exists students_school_assignment_update on public.students;
create policy students_school_assignment_insert on public.students for insert to authenticated with check (
  app_private.can_write_centre(centre_id) and
  (school_id is null or exists (select 1 from public.schools x where x.id=students.school_id and x.centre_id=students.centre_id and x.archived_at is null))
);
create policy students_school_assignment_update on public.students for update to authenticated using (app_private.can_write_centre(centre_id)) with check (
  app_private.can_write_centre(centre_id) and
  (school_id is null or exists (select 1 from public.schools x where x.id=students.school_id and x.centre_id=students.centre_id and x.archived_at is null))
);
