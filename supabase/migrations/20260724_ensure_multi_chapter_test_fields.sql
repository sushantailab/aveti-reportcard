-- Safety migration for installations that missed the original periodic-tests migration.
alter table public.tests
  add column if not exists chapter_ids text[],
  add column if not exists chapter_names text[];
