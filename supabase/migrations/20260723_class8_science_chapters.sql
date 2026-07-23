-- Add the Class 8 Science (NCERT Curiosity) catalogue once per centre.
update public.chapters as existing
set title = chapter_data.title
from (values
  (1, 'Exploring the Investigative World of Science'),
  (2, 'The Invisible Living World: Beyond Our Naked Eye'),
  (3, 'Health: The Ultimate Treasure'),
  (4, 'Electricity: Magnetic and Heating Effects'),
  (5, 'Exploring Forces'),
  (6, 'Pressure, Winds, Storms, and Cyclones'),
  (7, 'Particulate Nature of Matter'),
  (8, 'Nature of Matter: Elements, Compounds, and Mixtures'),
  (9, 'The Amazing World of Solutes, Solvents, and Solutions'),
  (10, 'Light: Mirrors and Lenses'),
  (11, 'Keeping Time with the Skies'),
  (12, 'How Nature Works in Harmony'),
  (13, 'Our Home: Earth, a Unique Life Sustaining Planet')
) as chapter_data(chapter_no, title)
where existing.class_level = 8
  and lower(trim(existing.subject)) = 'science'
  and existing.chapter_no = chapter_data.chapter_no;

insert into public.chapters (centre_id, class_level, subject, chapter_no, title)
select centres.id, 8, 'Science', chapters.chapter_no, chapters.title
from public.centres as centres
cross join (values
  (1, 'Exploring the Investigative World of Science'),
  (2, 'The Invisible Living World: Beyond Our Naked Eye'),
  (3, 'Health: The Ultimate Treasure'),
  (4, 'Electricity: Magnetic and Heating Effects'),
  (5, 'Exploring Forces'),
  (6, 'Pressure, Winds, Storms, and Cyclones'),
  (7, 'Particulate Nature of Matter'),
  (8, 'Nature of Matter: Elements, Compounds, and Mixtures'),
  (9, 'The Amazing World of Solutes, Solvents, and Solutions'),
  (10, 'Light: Mirrors and Lenses'),
  (11, 'Keeping Time with the Skies'),
  (12, 'How Nature Works in Harmony'),
  (13, 'Our Home: Earth, a Unique Life Sustaining Planet')
) as chapters(chapter_no, title)
where not exists (
  select 1 from public.chapters existing
  where existing.centre_id = centres.id
    and existing.class_level = 8
    and lower(trim(existing.subject)) = 'science'
    and existing.chapter_no = chapters.chapter_no
);
