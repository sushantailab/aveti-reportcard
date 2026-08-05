-- Link each saved test to the responsible teacher for report sharing.
-- Existing tests remain valid with a NULL teacher_id.

alter table public.tests
  add column if not exists teacher_id uuid references public.tah_teachers(id) on delete set null;

create index if not exists tests_teacher_id_idx on public.tests(teacher_id);

create or replace function public.validate_test_teacher_centre()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.teacher_id is not null and not exists (
    select 1 from public.tah_teachers t
    where t.id = new.teacher_id
      and t.centre_id = new.centre_id
      and coalesce(t.opted_out,false) = false
  ) then
    raise exception 'Selected teacher does not belong to this centre or is inactive';
  end if;
  return new;
end;
$$;

drop trigger if exists tests_validate_teacher_centre on public.tests;
create trigger tests_validate_teacher_centre
before insert or update of teacher_id, centre_id on public.tests
for each row execute function public.validate_test_teacher_centre();
