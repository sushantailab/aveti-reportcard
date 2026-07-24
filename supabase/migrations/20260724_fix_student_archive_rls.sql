-- Use an explicit membership check for student updates so Centre Admin archives pass RLS.
drop policy if exists students_access_update on public.students;
create policy students_access_update
  on public.students for update to authenticated
  using (
    (select app_private.is_platform_admin())
    or exists (
      select 1 from public.centre_memberships cm
      where cm.centre_id = students.centre_id
        and cm.user_id = (select auth.uid())
        and cm.active
        and cm.role = 'centre_admin'
    )
  )
  with check (
    (select app_private.is_platform_admin())
    or exists (
      select 1 from public.centre_memberships cm
      where cm.centre_id = students.centre_id
        and cm.user_id = (select auth.uid())
        and cm.active
        and cm.role = 'centre_admin'
    )
  );
