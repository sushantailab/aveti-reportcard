-- Add the Class 9 Science chapter catalogue once per centre.
-- Chapter number is the de-duplication key for a centre/class/subject.
update public.chapters as existing
set title = chapter_data.title
from (values
  (1, 'Exploration: World of Secondary Science'),
  (2, 'Cell: Building Block of Life'),
  (3, 'Tissues in Action'),
  (4, 'Describing Motion Around Us'),
  (5, 'Exploring Mixtures and Separation'),
  (6, 'How Forces Affect Motion'),
  (7, 'Work, Energy, and Simple Machines'),
  (8, 'Journey Inside the Atom'),
  (9, 'Atomic Foundations of Matter'),
  (10, 'Sound Waves: Characteristics and Applications'),
  (11, 'Reproduction: How Life Continues'),
  (12, 'Patterns in Life: Diversity and Classification'),
  (13, 'Earth as a System: Energy, Matter, and Life')
) as chapter_data(chapter_no, title)
where existing.class_level = 9
  and lower(trim(existing.subject)) = 'science'
  and existing.chapter_no = chapter_data.chapter_no;

insert into public.chapters (centre_id, class_level, subject, chapter_no, title)
select centres.id, 9, 'Science', chapters.chapter_no, chapters.title
from public.centres as centres
cross join (values
  (1, 'Exploration: World of Secondary Science'),
  (2, 'Cell: Building Block of Life'),
  (3, 'Tissues in Action'),
  (4, 'Describing Motion Around Us'),
  (5, 'Exploring Mixtures and Separation'),
  (6, 'How Forces Affect Motion'),
  (7, 'Work, Energy, and Simple Machines'),
  (8, 'Journey Inside the Atom'),
  (9, 'Atomic Foundations of Matter'),
  (10, 'Sound Waves: Characteristics and Applications'),
  (11, 'Reproduction: How Life Continues'),
  (12, 'Patterns in Life: Diversity and Classification'),
  (13, 'Earth as a System: Energy, Matter, and Life')
) as chapters(chapter_no, title)
where not exists (
  select 1 from public.chapters existing
  where existing.centre_id = centres.id
    and existing.class_level = 9
    and lower(trim(existing.subject)) = 'science'
    and existing.chapter_no = chapters.chapter_no
);

-- Keep saved tests aligned with the corrected Class 9 Science titles.
update public.tests as test
set chapter_no = chapter.chapter_no,
    chapter_name = chapter.title
from public.chapters as chapter
where test.chapter_id = chapter.id
  and chapter.class_level = 9
  and lower(trim(chapter.subject)) = 'science';
