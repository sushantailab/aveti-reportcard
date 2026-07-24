-- Use the full subject name everywhere while preserving existing chapters, tests, and marks.
update public.chapters
set subject = 'Social Science'
where lower(trim(subject)) = 'sst';

update public.tests
set subject = 'Social Science'
where lower(trim(subject)) = 'sst';
