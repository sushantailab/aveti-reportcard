-- English Grammar is no longer a separate subject. No existing rows currently use it,
-- but consolidate any future/legacy records into English before removing the option.
update public.chapters
set subject = 'English'
where lower(trim(subject)) = 'english grammar';

update public.tests
set subject = 'English'
where lower(trim(subject)) = 'english grammar';

update public.tah_teachers
set subject = 'English'
where lower(trim(subject)) = 'english grammar';
