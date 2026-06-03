-- Track each student's academic session, e.g. 2026-27.

alter table public.students
  add column if not exists academic_session text not null default '2026-27';

update public.students
set academic_session = '2026-27'
where academic_session is null
   or trim(academic_session) = '';

create index if not exists students_session_centre_class_section_idx
  on public.students(centre_id, academic_session, class_level, section);
