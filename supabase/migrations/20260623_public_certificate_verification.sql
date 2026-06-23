-- Allow public certificate verification links to show limited certificate details.
-- Run in Supabase SQL editor after the training certificate tables exist.

drop policy if exists "training_events_public_verify_select" on public.training_events;
drop policy if exists "training_participants_public_verify_select" on public.training_participants;

drop view if exists public.public_certificate_verifications;

create view public.public_certificate_verifications as
select
  p.certificate_id,
  p.name,
  p.school,
  p.verified_at,
  e.title,
  e.subtitle,
  e.event_date,
  e.duration_hours,
  e.organizer_name,
  e.signatory_1_name,
  e.signatory_1_title,
  e.signatory_2_name,
  e.signatory_2_title
from public.training_participants p
join public.training_events e on e.id = p.event_id;

grant select on public.public_certificate_verifications to anon;
grant select on public.public_certificate_verifications to authenticated;
