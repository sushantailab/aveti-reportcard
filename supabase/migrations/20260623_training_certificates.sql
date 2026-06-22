-- Aveti Certificates: professional development events and participants.
-- Run in Supabase SQL editor before using the live Certificates module.

create table if not exists public.training_events (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres(id) on delete cascade,
  title text not null,
  subtitle text not null default 'One-Hour Professional Development Webinar',
  event_date date not null,
  duration_hours numeric not null default 1,
  organizer_name text not null default 'AVETI LEARNING',
  focus_points text not null default '',
  certificate_prefix text not null,
  signatory_1_name text not null default '',
  signatory_1_title text not null default '',
  signatory_2_name text not null default '',
  signatory_2_title text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.training_participants (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid not null references public.centres(id) on delete cascade,
  event_id uuid not null references public.training_events(id) on delete cascade,
  sequence_no int not null,
  certificate_id text not null,
  name text not null,
  phone text,
  whatsapp text,
  email text,
  school text,
  certificate_url text,
  whatsapp_sent_at timestamptz,
  email_sent_at timestamptz,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists training_participants_certificate_id_unique
  on public.training_participants(certificate_id);

create index if not exists training_events_centre_id_idx
  on public.training_events(centre_id);

create index if not exists training_participants_event_id_idx
  on public.training_participants(event_id);

alter table public.training_events enable row level security;
alter table public.training_participants enable row level security;

drop policy if exists "training_events_centre_select" on public.training_events;
drop policy if exists "training_events_centre_insert" on public.training_events;
drop policy if exists "training_events_centre_update" on public.training_events;
drop policy if exists "training_events_centre_delete" on public.training_events;

create policy "training_events_centre_select"
  on public.training_events for select
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = training_events.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "training_events_centre_insert"
  on public.training_events for insert
  to authenticated
  with check (
    exists (
      select 1 from public.centres c
      where c.id = training_events.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "training_events_centre_update"
  on public.training_events for update
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = training_events.centre_id
        and c.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.centres c
      where c.id = training_events.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "training_events_centre_delete"
  on public.training_events for delete
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = training_events.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

drop policy if exists "training_participants_centre_select" on public.training_participants;
drop policy if exists "training_participants_centre_insert" on public.training_participants;
drop policy if exists "training_participants_centre_update" on public.training_participants;
drop policy if exists "training_participants_centre_delete" on public.training_participants;

create policy "training_participants_centre_select"
  on public.training_participants for select
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = training_participants.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "training_participants_centre_insert"
  on public.training_participants for insert
  to authenticated
  with check (
    exists (
      select 1 from public.centres c
      where c.id = training_participants.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "training_participants_centre_update"
  on public.training_participants for update
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = training_participants.centre_id
        and c.owner_user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.centres c
      where c.id = training_participants.centre_id
        and c.owner_user_id = auth.uid()
    )
  );

create policy "training_participants_centre_delete"
  on public.training_participants for delete
  to authenticated
  using (
    exists (
      select 1 from public.centres c
      where c.id = training_participants.centre_id
        and c.owner_user_id = auth.uid()
    )
  );
