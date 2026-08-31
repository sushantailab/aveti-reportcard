-- English chapter catalogue, classes 3-9. Seeded per centre, same as the other
-- subject catalogues. Idempotent: syncs titles by (class, chapter_no) and inserts
-- only the rows that are missing, so it is safe to re-run.

with english_catalogue(class_level, chapter_no, title) as (
  values
    -- Class 3
    (3, 1,  'Colours'),
    (3, 2,  'Badal and Moti'),
    (3, 3,  'Best Friends'),
    (3, 4,  'Out in the Garden'),
    (3, 5,  'Talking Toys'),
    (3, 6,  'Paper Boats'),
    (3, 7,  'The Big Laddoo'),
    (3, 8,  'Thank God'),
    (3, 9,  'Madhu’s Wish'),
    (3, 10, 'Night'),
    (3, 11, 'Chanda Mama Counts the Stars'),
    (3, 12, 'Chandrayaan'),
    -- Class 4
    (4, 1,  'Together We Can'),
    (4, 2,  'The Tinkling Bells'),
    (4, 3,  'Be Smart, Be Safe'),
    (4, 4,  'One Thing at a Time'),
    (4, 5,  'The Old Stag'),
    (4, 6,  'Braille'),
    (4, 7,  'Fit Body, Fit Mind, Fit Nation'),
    (4, 8,  'The Lagori Champions'),
    (4, 9,  'Hekko'),
    (4, 10, 'The Swing'),
    (4, 11, 'A Journey to the Magical Mountains'),
    (4, 12, 'Maheshwar'),
    -- Class 5
    (5, 1,  'Papa’s Spectacles'),
    (5, 2,  'Gone with the Scooter'),
    (5, 3,  'The Rainbow'),
    (5, 4,  'The Wise Parrot'),
    (5, 5,  'The Frog'),
    (5, 6,  'What a Tank!'),
    (5, 7,  'Gilli Danda'),
    (5, 8,  'The Decision of the Panchayat'),
    (5, 9,  'Vocation'),
    (5, 10, 'Glass Bangles'),
    -- Class 6
    (6, 1,  'A Bottle of Dew'),
    (6, 2,  'The Raven and the Fox'),
    (6, 3,  'Rama to the Rescue'),
    (6, 4,  'The Unlikely Best Friends'),
    (6, 5,  'A Friend’s Prayer'),
    (6, 6,  'The Chair'),
    (6, 7,  'Neem Baba'),
    (6, 8,  'What a Bird Thought'),
    (6, 9,  'Spices that Heal Us'),
    (6, 10, 'Change of Heart'),
    (6, 11, 'The Winner'),
    (6, 12, 'Yoga—A Way of Life'),
    (6, 13, 'Hamara Bharat—Incredible India!'),
    (6, 14, 'The Kites'),
    (6, 15, 'Ila Sachani: Embroidering Dreams with Her Feet'),
    (6, 16, 'National War Memorial'),
    -- Class 7
    (7, 1,  'The Day the River Spoke'),
    (7, 2,  'Try Again'),
    (7, 3,  'Three Days to See'),
    (7, 4,  'Animals, Birds, and Dr. Dolittle'),
    (7, 5,  'A Funny Man'),
    (7, 6,  'Say the Right Thing'),
    (7, 7,  'My Brother’s Great Invention'),
    (7, 8,  'Paper Boats'),
    (7, 9,  'North, South, East, West'),
    (7, 10, 'The Tunnel'),
    (7, 11, 'Travel'),
    (7, 12, 'Conquering the Summit'),
    (7, 13, 'A Homage to Our Brave Soldiers'),
    (7, 14, 'My Dear Soldiers'),
    (7, 15, 'Rani Abbakka'),
    -- Class 8
    (8, 1,  'The Wit that Won Hearts'),
    (8, 2,  'A Concrete Example'),
    (8, 3,  'Wisdom Paves the Way'),
    (8, 4,  'A Tale of Valour: Major Somnath Sharma and the Battle of Badgam'),
    (8, 5,  'Somebody’s Mother'),
    (8, 6,  'Verghese Kurien – I Too Had a Dream'),
    (8, 7,  'The Case of the Fifth Word'),
    (8, 8,  'The Magic Brush of Dreams'),
    (8, 9,  'Spectacular Wonders'),
    (8, 10, 'The Cherry Tree'),
    (8, 11, 'Harvest Hymn'),
    (8, 12, 'Waiting for the Rain'),
    (8, 13, 'Feathered Friend'),
    (8, 14, 'Magnifying Glass'),
    (8, 15, 'Bibha Chowdhuri: The Beam of Light that Lit the Path for Women in Indian Science'),
    -- Class 9
    (9, 1,  'How I Taught My Grandmother to Read'),
    (9, 2,  'Bharat Our Land'),
    (9, 3,  'The Pot Maker'),
    (9, 4,  'Gifts of Grace: Honouring Our Vocations'),
    (9, 5,  'Winds of Change'),
    (9, 6,  'Canvas of Soil'),
    (9, 7,  'Vitamin-M'),
    (9, 8,  'I Cannot Remember My Mother'),
    (9, 9,  'The World of Limitless Possibilities'),
    (9, 10, 'Nine Gold Medals'),
    (9, 11, 'Twin Melodies'),
    (9, 12, 'A Friend Found in Music'),
    (9, 13, 'Carrier of Words'),
    (9, 14, 'Words'),
    (9, 15, 'Follow That Dream'),
    (9, 16, 'Believe in Yourself')
)
-- Keep any existing English row's title aligned to the catalogue.
, synced as (
  update public.chapters ch
  set title = e.title, archived_at = null
  from english_catalogue e
  where ch.class_level = e.class_level
    and lower(trim(ch.subject)) = 'english'
    and ch.chapter_no = e.chapter_no
    and ch.title is distinct from e.title
  returning ch.id
)
-- Add the rows that do not exist yet, for every centre.
insert into public.chapters (centre_id, class_level, subject, chapter_no, title)
select c.id, e.class_level, 'English', e.chapter_no, e.title
from public.centres c
cross join english_catalogue e
where not exists (
  select 1 from public.chapters ch
  where ch.centre_id = c.id
    and ch.class_level = e.class_level
    and lower(trim(ch.subject)) = 'english'
    and ch.chapter_no = e.chapter_no
);
