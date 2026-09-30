-- Performance hardening: wrap auth.uid() so Postgres evaluates it once per
-- query (an "initplan") instead of once per row scanned. Flagged by
-- Supabase's own automated performance advisor (auth_rls_initplan).
--
-- This changes ONLY how these checks are evaluated, not what they allow —
-- every boolean outcome is identical to before. Two layers are fixed:
--
-- 1) The three shared helper functions used by nearly every table's RLS
--    policy (is_platform_admin, can_access_centre, can_write_centre). This
--    is the highest-leverage fix: it's invisible at today's data size (88
--    students, 31 tests) but would start to cost real time as rows grow,
--    since it's re-run on every row of every centre-scoped table.
-- 2) The 4 policies the advisor flagged directly (platform_admins,
--    centre_memberships, audit_log, test_result_edits).
--
-- See docs/ARCHITECTURE.md and the "website is slow" investigation (Sep
-- 2026) for context: the actual cause of today's slowness is the Supabase
-- free-tier cold start, not this — this is a preventative fix for when the
-- app has real scale, done now because it's free and carries no risk.

create or replace function app_private.is_platform_admin()
returns boolean
language sql stable security definer set search_path = public, app_private
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = (select auth.uid()) and active
  );
$$;

create or replace function app_private.can_access_centre(target_centre uuid)
returns boolean
language sql stable security definer set search_path = public, app_private
as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.centre_memberships
    where centre_id = target_centre and user_id = (select auth.uid()) and active
  );
$$;

create or replace function app_private.can_write_centre(target_centre uuid)
returns boolean
language sql stable security definer set search_path = public, app_private
as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.centre_memberships
    where centre_id = target_centre and user_id = (select auth.uid())
      and active and role = 'centre_admin'
  );
$$;

-- can_delete() only calls is_platform_admin() and has no direct auth.uid()
-- call of its own, so it needs no change.

drop policy if exists platform_admins_self_select on public.platform_admins;
create policy platform_admins_self_select on public.platform_admins
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists memberships_self_or_master_select on public.centre_memberships;
create policy memberships_self_or_master_select on public.centre_memberships
  for select to authenticated
  using (user_id = (select auth.uid()) or app_private.is_platform_admin());

drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log
  for insert to authenticated
  with check (actor_user_id = (select auth.uid()) and (centre_id is null or app_private.can_access_centre(centre_id)));

drop policy if exists edits_access_insert on public.test_result_edits;
create policy edits_access_insert on public.test_result_edits
  for insert to authenticated
  with check (edited_by = (select auth.uid()) and app_private.can_write_centre(centre_id));
