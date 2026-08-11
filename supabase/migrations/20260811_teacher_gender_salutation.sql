-- Keep teacher gender clean because WhatsApp report greetings use it:
-- female -> madam, male -> sir, unknown -> no honorific.
alter table if exists public.tah_teachers
  add column if not exists gender text;

update public.tah_teachers
set gender = lower(trim(gender))
where gender is not null;

update public.tah_teachers
set gender = null
where gender is not null
  and gender not in ('female','male','other');

alter table if exists public.tah_teachers
  drop constraint if exists tah_teachers_gender_check;

alter table if exists public.tah_teachers
  add constraint tah_teachers_gender_check
  check (gender is null or gender in ('female','male','other'));

comment on column public.tah_teachers.gender is
  'Teacher salutation source for WhatsApp messages: female=madam, male=sir, null=no honorific.';
