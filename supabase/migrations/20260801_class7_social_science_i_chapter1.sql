-- Correct the canonical Chapter 1 title for Class 7 Social Science I.
-- The app displays `Social Science` as `Social Science I` for Class 7.
update public.chapters
set title = 'Geographical Diversity of India',
    archived_at = null
where class_level = 7
  and lower(trim(subject)) = 'social science'
  and chapter_no = 1;

-- Ensure the chapter exists for every centre, including centres created after
-- the rest of the Class 7 Social Science catalogue was seeded.
insert into public.chapters (centre_id, class_level, subject, chapter_no, title)
select centre.id, 7, 'Social Science', 1, 'Geographical Diversity of India'
from public.centres as centre
where not exists (
  select 1
  from public.chapters as existing
  where existing.centre_id = centre.id
    and existing.class_level = 7
    and lower(trim(existing.subject)) = 'social science'
    and existing.chapter_no = 1
);

-- Keep any previously submitted test linked to Chapter 1 in sync.
update public.tests as test
set chapter_no = chapter.chapter_no,
    chapter_name = chapter.title
from public.chapters as chapter
where test.chapter_id = chapter.id
  and chapter.class_level = 7
  and lower(trim(chapter.subject)) = 'social science'
  and chapter.chapter_no = 1;
