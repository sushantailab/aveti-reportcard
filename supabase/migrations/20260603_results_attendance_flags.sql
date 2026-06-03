-- Distinguish enrolled / appeared / absent / N.A. in saved test results.

alter table public.results
  add column if not exists na boolean not null default false;

update public.results
set na = false
where na is null;
