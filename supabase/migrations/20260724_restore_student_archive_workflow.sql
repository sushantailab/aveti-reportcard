-- Centre Admins archive student records instead of permanently deleting them.
-- Archived students remain in the database with archived_at set and are hidden from active lists.
drop policy if exists students_centre_delete on public.students;
create policy students_master_delete
  on public.students for delete to authenticated
  using (app_private.can_delete());

drop policy if exists students_access_update on public.students;
create policy students_access_update
  on public.students for update to authenticated
  using (app_private.can_write_centre(centre_id))
  with check (app_private.can_write_centre(centre_id));
