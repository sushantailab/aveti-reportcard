-- Store recurring birthdays for students and teachers.
alter table public.students
  add column if not exists date_of_birth date;

alter table public.tah_teachers
  add column if not exists date_of_birth date;
