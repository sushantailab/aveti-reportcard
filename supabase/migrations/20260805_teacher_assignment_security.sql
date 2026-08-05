-- Keep the teacher-centre validation trigger on a fixed search path.
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
