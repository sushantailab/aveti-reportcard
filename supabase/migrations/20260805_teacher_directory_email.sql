-- Teachers are managed from the Reportcard Teachers directory.
-- Contact details stay centre-scoped under the existing RLS policies.
alter table public.tah_teachers
  add column if not exists email text;
