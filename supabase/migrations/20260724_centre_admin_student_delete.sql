-- Centre Admins may permanently delete students only from their assigned centre.
-- Dependent results and edit logs are removed by their existing ON DELETE CASCADE rules.
drop policy if exists students_master_delete on public.students;
create policy students_centre_delete
  on public.students for delete to authenticated
  using (app_private.can_write_centre(centre_id));
