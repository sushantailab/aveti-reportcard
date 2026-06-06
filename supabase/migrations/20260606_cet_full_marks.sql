alter table public.tests
  drop constraint if exists tests_full_marks_check;

alter table public.tests
  add constraint tests_full_marks_check
  check (full_marks = any (array[20, 25, 30, 35]));
