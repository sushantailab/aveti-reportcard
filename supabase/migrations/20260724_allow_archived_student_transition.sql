-- Allow authorised users to read their centre's archived students during an archive update.
-- The app filters archived_at IS NULL for the active Students list.
drop policy if exists students_access_select on public.students;
create policy students_access_select
  on public.students for select to authenticated
  using (app_private.can_access_centre(centre_id));
