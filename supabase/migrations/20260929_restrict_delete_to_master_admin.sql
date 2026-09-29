-- Phase 0 fix (docs/ARCHITECTURE.md §7, item 2): two same-day migrations
-- (20260724_centre_admin_delete_students_and_marks.sql, then
-- 20260724_centre_admin_student_delete.sql) let Centre Admins permanently delete
-- students and marks. That contradicts the intended model set out in
-- 20260724_multi_centre_access.sql: Centre Admins archive (soft-delete) only;
-- permanent delete is reserved for the Master Admin (app_private.can_delete()).
--
-- This does not edit either shipped migration above -- migrations are a permanent,
-- ordered history and editing one after it has run can break any database that
-- already applied it (see docs/ARCHITECTURE.md §8). It only restores the original
-- policies on top of them.

drop policy if exists students_access_delete on public.students;
drop policy if exists students_centre_delete on public.students;
drop policy if exists students_master_delete on public.students;
create policy students_master_delete on public.students
  for delete to authenticated
  using (app_private.can_delete());

drop policy if exists results_access_delete on public.results;
drop policy if exists results_master_delete on public.results;
create policy results_master_delete on public.results
  for delete to authenticated
  using (app_private.can_delete());
