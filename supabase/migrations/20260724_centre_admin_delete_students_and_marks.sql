-- Centre Admins may permanently delete their own centre's students and result rows.
-- Results cascade when a student is deleted; direct result deletion supports mark removal.
drop policy if exists students_master_delete on public.students;
drop policy if exists students_access_delete on public.students;
create policy students_access_delete on public.students for delete to authenticated
using (app_private.can_write_centre(centre_id));

drop policy if exists results_master_delete on public.results;
drop policy if exists results_access_delete on public.results;
create policy results_access_delete on public.results for delete to authenticated
using (exists (
  select 1 from public.tests t
  where t.id = results.test_id
    and app_private.can_write_centre(t.centre_id)
));
