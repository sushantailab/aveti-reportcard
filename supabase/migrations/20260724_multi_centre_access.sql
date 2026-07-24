-- Multi-centre access, archive-first lifecycle, and audit trail.
create schema if not exists app_private;

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.centre_memberships (
  centre_id uuid not null references public.centres(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('centre_admin','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (centre_id,user_id)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid references public.centres(id) on delete set null,
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.centres add column if not exists status text not null default 'active';
alter table public.centres add column if not exists archived_at timestamptz;
alter table public.students add column if not exists archived_at timestamptz;
alter table public.tests add column if not exists archived_at timestamptz;
alter table public.chapters add column if not exists archived_at timestamptz;
alter table public.tah_teachers add column if not exists archived_at timestamptz;

create index if not exists centre_memberships_user_idx on public.centre_memberships(user_id,active);
create index if not exists audit_log_centre_created_idx on public.audit_log(centre_id,created_at desc);

-- Preserve the current centre and make its current owner the first Master Admin.
insert into public.platform_admins(user_id)
select c.owner_user_id
from public.centres c
where c.owner_user_id is not null
order by c.created_at nulls first
limit 1
on conflict (user_id) do nothing;

insert into public.centre_memberships(centre_id,user_id,role)
select c.id,c.owner_user_id,'centre_admin'
from public.centres c
where c.owner_user_id is not null
on conflict (centre_id,user_id) do update set active=true;

create or replace function app_private.is_platform_admin()
returns boolean
language sql stable security definer set search_path = public, app_private
as $$
  select exists (
    select 1 from public.platform_admins
    where user_id = auth.uid() and active
  );
$$;

create or replace function app_private.can_access_centre(target_centre uuid)
returns boolean
language sql stable security definer set search_path = public, app_private
as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.centre_memberships
    where centre_id = target_centre and user_id = auth.uid() and active
  );
$$;

create or replace function app_private.can_write_centre(target_centre uuid)
returns boolean
language sql stable security definer set search_path = public, app_private
as $$
  select app_private.is_platform_admin() or exists (
    select 1 from public.centre_memberships
    where centre_id = target_centre and user_id = auth.uid()
      and active and role = 'centre_admin'
  );
$$;

create or replace function app_private.can_delete()
returns boolean
language sql stable security definer set search_path = public, app_private
as $$ select app_private.is_platform_admin(); $$;

create or replace function app_private.audit_change()
returns trigger
language plpgsql security definer set search_path = public, app_private
as $$
begin
  if tg_op = 'DELETE' then
    insert into public.audit_log(centre_id,actor_user_id,action,table_name,record_id)
    values (case when tg_table_name='centres' then old.id else old.centre_id end,auth.uid(),lower(tg_op),tg_table_name,old.id);
    return old;
  end if;
  if tg_op = 'UPDATE' and old.archived_at is null and new.archived_at is not null then
    insert into public.audit_log(centre_id,actor_user_id,action,table_name,record_id)
    values (case when tg_table_name='centres' then new.id else new.centre_id end,auth.uid(),'archive',tg_table_name,new.id);
  elsif tg_op = 'UPDATE' and old.archived_at is not null and new.archived_at is null then
    insert into public.audit_log(centre_id,actor_user_id,action,table_name,record_id)
    values (case when tg_table_name='centres' then new.id else new.centre_id end,auth.uid(),'restore',tg_table_name,new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists centres_audit_change on public.centres;
drop trigger if exists students_audit_change on public.students;
drop trigger if exists tests_audit_change on public.tests;
drop trigger if exists chapters_audit_change on public.chapters;
create trigger centres_audit_change after update or delete on public.centres for each row execute function app_private.audit_change();
create trigger students_audit_change after update or delete on public.students for each row execute function app_private.audit_change();
create trigger tests_audit_change after update or delete on public.tests for each row execute function app_private.audit_change();
create trigger chapters_audit_change after update or delete on public.chapters for each row execute function app_private.audit_change();

alter table public.platform_admins enable row level security;
alter table public.centre_memberships enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists platform_admins_self_select on public.platform_admins;
create policy platform_admins_self_select on public.platform_admins for select to authenticated using (user_id=auth.uid());
drop policy if exists memberships_self_or_master_select on public.centre_memberships;
create policy memberships_self_or_master_select on public.centre_memberships for select to authenticated using (user_id=auth.uid() or app_private.is_platform_admin());
drop policy if exists memberships_master_manage on public.centre_memberships;
create policy memberships_master_manage on public.centre_memberships for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
drop policy if exists audit_master_select on public.audit_log;
create policy audit_master_select on public.audit_log for select to authenticated using (app_private.is_platform_admin());
drop policy if exists audit_insert on public.audit_log;
create policy audit_insert on public.audit_log for insert to authenticated with check (actor_user_id=auth.uid() and (centre_id is null or app_private.can_access_centre(centre_id)));

-- Replace owner-only policies on the core centre-scoped tables.
do $$
declare p record;
begin
  for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in ('centres','students','tests','chapters','results','test_result_edits','training_events','training_participants','tah_teachers') loop
    execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename);
  end loop;
end $$;

alter table public.centres enable row level security;
create policy centres_access_select on public.centres for select to authenticated using (app_private.can_access_centre(id));
create policy centres_master_insert on public.centres for insert to authenticated with check (app_private.is_platform_admin());
create policy centres_master_update on public.centres for update to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());
create policy centres_master_delete on public.centres for delete to authenticated using (app_private.can_delete());

alter table public.students enable row level security;
create policy students_access_select on public.students for select to authenticated using (app_private.can_access_centre(centre_id) and (archived_at is null or app_private.is_platform_admin()));
create policy students_access_insert on public.students for insert to authenticated with check (app_private.can_write_centre(centre_id) and archived_at is null);
create policy students_access_update on public.students for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(centre_id) and (archived_at is null or app_private.is_platform_admin()));
create policy students_master_delete on public.students for delete to authenticated using (app_private.can_delete());

alter table public.tests enable row level security;
create policy tests_access_select on public.tests for select to authenticated using (app_private.can_access_centre(centre_id) and (archived_at is null or app_private.is_platform_admin()));
create policy tests_access_insert on public.tests for insert to authenticated with check (app_private.can_write_centre(centre_id) and archived_at is null);
create policy tests_access_update on public.tests for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(centre_id) and (archived_at is null or app_private.is_platform_admin()));
create policy tests_master_delete on public.tests for delete to authenticated using (app_private.can_delete());

alter table public.chapters enable row level security;
create policy chapters_access_select on public.chapters for select to authenticated using (app_private.can_access_centre(centre_id) and (archived_at is null or app_private.is_platform_admin()));
create policy chapters_access_insert on public.chapters for insert to authenticated with check (app_private.can_write_centre(centre_id) and archived_at is null);
create policy chapters_access_update on public.chapters for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(centre_id) and (archived_at is null or app_private.is_platform_admin()));
create policy chapters_master_delete on public.chapters for delete to authenticated using (app_private.can_delete());

alter table public.results enable row level security;
create policy results_access_select on public.results for select to authenticated using (exists (select 1 from public.tests t where t.id=results.test_id and app_private.can_access_centre(t.centre_id) and (t.archived_at is null or app_private.is_platform_admin())));
create policy results_access_insert on public.results for insert to authenticated with check (exists (select 1 from public.tests t join public.students s on s.id=results.student_id and s.centre_id=t.centre_id where t.id=results.test_id and app_private.can_write_centre(t.centre_id) and t.archived_at is null and s.archived_at is null));
create policy results_access_update on public.results for update to authenticated using (exists (select 1 from public.tests t where t.id=results.test_id and app_private.can_write_centre(t.centre_id))) with check (exists (select 1 from public.tests t join public.students s on s.id=results.student_id and s.centre_id=t.centre_id where t.id=results.test_id and app_private.can_write_centre(t.centre_id)));
create policy results_master_delete on public.results for delete to authenticated using (app_private.can_delete());

alter table public.test_result_edits enable row level security;
create policy edits_access_select on public.test_result_edits for select to authenticated using (app_private.can_access_centre(centre_id));
create policy edits_access_insert on public.test_result_edits for insert to authenticated with check (edited_by=auth.uid() and app_private.can_write_centre(centre_id));

-- Centre-linked operational tools follow the same access model.
alter table public.training_events enable row level security;
create policy training_events_access_select on public.training_events for select to authenticated using (app_private.can_access_centre(centre_id));
create policy training_events_access_insert on public.training_events for insert to authenticated with check (app_private.can_write_centre(centre_id));
create policy training_events_access_update on public.training_events for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(centre_id));
create policy training_events_master_delete on public.training_events for delete to authenticated using (app_private.can_delete());

alter table public.training_participants enable row level security;
create policy training_participants_access_select on public.training_participants for select to authenticated using (app_private.can_access_centre(centre_id));
create policy training_participants_access_insert on public.training_participants for insert to authenticated with check (app_private.can_write_centre(centre_id));
create policy training_participants_access_update on public.training_participants for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(centre_id));
create policy training_participants_master_delete on public.training_participants for delete to authenticated using (app_private.can_delete());

alter table public.tah_teachers enable row level security;
create policy tah_teachers_access_select on public.tah_teachers for select to authenticated using (app_private.can_access_centre(centre_id) and (archived_at is null or app_private.is_platform_admin()));
create policy tah_teachers_access_insert on public.tah_teachers for insert to authenticated with check (app_private.can_write_centre(centre_id) and archived_at is null);
create policy tah_teachers_access_update on public.tah_teachers for update to authenticated using (app_private.can_write_centre(centre_id)) with check (app_private.can_write_centre(centre_id));
create policy tah_teachers_master_delete on public.tah_teachers for delete to authenticated using (app_private.can_delete());

-- Templates are global resources: everyone may read them, only the Master Admin may change them.
alter table public.tah_message_templates enable row level security;
drop policy if exists admin_all_tah_message_templates on public.tah_message_templates;
create policy tah_templates_authenticated_read on public.tah_message_templates for select to authenticated using (true);
create policy tah_templates_master_write on public.tah_message_templates for all to authenticated using (app_private.is_platform_admin()) with check (app_private.is_platform_admin());

-- Teacher-linked activation records inherit the teacher's centre boundary.
do $$
declare p record;
begin
  for p in select policyname,tablename from pg_policies where schemaname='public' and tablename in ('tah_feedback','tah_message_logs','tah_referrals','tah_testimonials') loop
    execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename);
  end loop;
end $$;
alter table public.tah_feedback enable row level security;
create policy tah_feedback_access on public.tah_feedback for all to authenticated using (exists (select 1 from public.tah_teachers t where t.id=teacher_id and app_private.can_access_centre(t.centre_id))) with check (exists (select 1 from public.tah_teachers t where t.id=teacher_id and app_private.can_write_centre(t.centre_id)));
alter table public.tah_message_logs enable row level security;
create policy tah_logs_access on public.tah_message_logs for all to authenticated using (exists (select 1 from public.tah_teachers t where t.id=teacher_id and app_private.can_access_centre(t.centre_id))) with check (exists (select 1 from public.tah_teachers t where t.id=teacher_id and app_private.can_write_centre(t.centre_id)));
alter table public.tah_referrals enable row level security;
create policy tah_referrals_access on public.tah_referrals for all to authenticated using (exists (select 1 from public.tah_teachers t where t.id=referrer_teacher_id and app_private.can_access_centre(t.centre_id))) with check (exists (select 1 from public.tah_teachers t where t.id=referrer_teacher_id and app_private.can_write_centre(t.centre_id)));
alter table public.tah_testimonials enable row level security;
create policy tah_testimonials_access on public.tah_testimonials for all to authenticated using (exists (select 1 from public.tah_teachers t where t.id=teacher_id and app_private.can_access_centre(t.centre_id))) with check (exists (select 1 from public.tah_teachers t where t.id=teacher_id and app_private.can_write_centre(t.centre_id)));
