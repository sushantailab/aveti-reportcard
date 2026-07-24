-- Canonical Mathematics chapter catalogues for Classes 6–9.
-- The app stores Mathematics I as `Mathematics` and Mathematics II as `Mathematics II`.
create temporary table math_catalog (
  class_level integer not null,
  subject text not null,
  chapter_no integer not null,
  title text not null,
  primary key (class_level, subject, chapter_no)
) on commit drop;

insert into math_catalog (class_level, subject, chapter_no, title) values
  (6, 'Mathematics', 1, 'Patterns in Mathematics'),
  (6, 'Mathematics', 2, 'Lines and Angles'),
  (6, 'Mathematics', 3, 'Number Play'),
  (6, 'Mathematics', 4, 'Data Handling and Presentation'),
  (6, 'Mathematics', 5, 'Prime Time'),
  (6, 'Mathematics', 6, 'Perimeter and Area'),
  (6, 'Mathematics', 7, 'Fractions'),
  (6, 'Mathematics', 8, 'Playing with Constructions'),
  (6, 'Mathematics', 9, 'Symmetry'),
  (6, 'Mathematics', 10, 'The Other Side of Zero'),
  (7, 'Mathematics', 1, 'Large Numbers Around Us'),
  (7, 'Mathematics', 2, 'Arithmetic Expressions'),
  (7, 'Mathematics', 3, 'A Peek Beyond the Point'),
  (7, 'Mathematics', 4, 'Expressions Using Letter-Numbers'),
  (7, 'Mathematics', 5, 'Parallel and Intersecting Lines'),
  (7, 'Mathematics', 6, 'Number Play'),
  (7, 'Mathematics', 7, 'A Tale of Three Intersecting Lines'),
  (7, 'Mathematics', 8, 'Working with Fractions'),
  (7, 'Mathematics II', 1, 'Geometric Twins'),
  (7, 'Mathematics II', 2, 'Operations with Integers'),
  (7, 'Mathematics II', 3, 'Finding Common Ground'),
  (7, 'Mathematics II', 4, 'Another Peek Beyond the Point'),
  (7, 'Mathematics II', 5, 'Connecting the Dots...'),
  (7, 'Mathematics II', 6, 'Constructions and Tilings'),
  (7, 'Mathematics II', 7, 'Finding the Unknown'),
  (8, 'Mathematics', 1, 'A Square and A Cube'),
  (8, 'Mathematics', 2, 'Power Play'),
  (8, 'Mathematics', 3, 'A Story of Numbers'),
  (8, 'Mathematics', 4, 'Quadrilaterals'),
  (8, 'Mathematics', 5, 'Number Play'),
  (8, 'Mathematics', 6, 'We Distribute, Yet Things Multiply'),
  (8, 'Mathematics', 7, 'Proportional Reasoning–1'),
  (8, 'Mathematics II', 1, 'Fractions in Disguise'),
  (8, 'Mathematics II', 2, 'The Baudhayana–Pythagoras Theorem'),
  (8, 'Mathematics II', 3, 'Proportional Reasoning–2'),
  (8, 'Mathematics II', 4, 'Exploring Some Geometric Themes'),
  (8, 'Mathematics II', 5, 'Tales by Dots and Lines'),
  (8, 'Mathematics II', 6, 'Algebra Play'),
  (8, 'Mathematics II', 7, 'Area'),
  (9, 'Mathematics', 1, 'Orienting Yourself: The Use of Coordinates'),
  (9, 'Mathematics', 2, 'Introduction to Linear Polynomials'),
  (9, 'Mathematics', 3, 'The World of Numbers'),
  (9, 'Mathematics', 4, 'Exploring Algebraic Identities'),
  (9, 'Mathematics', 5, 'I’m Up and Down, and Round and Round'),
  (9, 'Mathematics', 6, 'Measuring Space: Perimeter and Area'),
  (9, 'Mathematics', 7, 'The Mathematics of Maybe: Introduction to Probability'),
  (9, 'Mathematics', 8, 'Predicting What Comes Next: Exploring Sequences and Progressions');

update public.chapters as existing
set title = catalog.title,
    archived_at = null
from math_catalog as catalog
where existing.class_level = catalog.class_level
  and lower(trim(existing.subject)) = lower(catalog.subject)
  and existing.chapter_no = catalog.chapter_no;

insert into public.chapters (centre_id, class_level, subject, chapter_no, title)
select centre.id, catalog.class_level, catalog.subject, catalog.chapter_no, catalog.title
from public.centres as centre
cross join math_catalog as catalog
where not exists (
  select 1 from public.chapters existing
  where existing.centre_id = centre.id
    and existing.class_level = catalog.class_level
    and lower(trim(existing.subject)) = lower(catalog.subject)
    and existing.chapter_no = catalog.chapter_no
);

update public.tests as test
set chapter_no = chapter.chapter_no,
    chapter_name = chapter.title
from public.chapters as chapter
join math_catalog as catalog
  on catalog.class_level = chapter.class_level
 and lower(catalog.subject) = lower(chapter.subject)
 and catalog.chapter_no = chapter.chapter_no
where test.chapter_id = chapter.id;
