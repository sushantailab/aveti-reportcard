-- Canonical Hindi chapter catalogues for Classes 5–9.
-- The chapter number is the stable ordering key for each centre/class/subject.
create temporary table hindi_catalog (
  class_level integer not null,
  subject text not null,
  chapter_no integer not null,
  title text not null,
  primary key (class_level, subject, chapter_no)
) on commit drop;

insert into hindi_catalog (class_level, subject, chapter_no, title) values
  (5, 'Hindi', 1, 'किरन'),
  (5, 'Hindi', 2, 'न्याय की कुर्सी'),
  (5, 'Hindi', 3, 'चाँद का कुरता'),
  (5, 'Hindi', 4, 'साङकेन'),
  (5, 'Hindi', 5, 'सुंदरिया'),
  (5, 'Hindi', 6, 'चतुर चित्रकार'),
  (5, 'Hindi', 7, 'मेरा बचपन'),
  (5, 'Hindi', 8, 'काजीरंगा राष्ट्रीय उद्यान की यात्रा'),
  (5, 'Hindi', 9, 'न्याय'),
  (5, 'Hindi', 10, 'तीन मछलियाँ'),
  (5, 'Hindi', 11, 'हमारे ये कलामंदिर'),
  (5, 'Hindi', 12, 'गंगा की कहानी'),
  (6, 'Hindi', 1, 'मातृभूमि'),
  (6, 'Hindi', 2, 'गोल'),
  (6, 'Hindi', 3, 'पहली बूँद'),
  (6, 'Hindi', 4, 'हार की जीत'),
  (6, 'Hindi', 5, 'रहीम के दोहे'),
  (6, 'Hindi', 6, 'मेरी माँ'),
  (6, 'Hindi', 7, 'जलाते चलो'),
  (6, 'Hindi', 8, 'सत्रिया और बिहू नृत्य'),
  (6, 'Hindi', 9, 'मैया मैं नहिं माखन खायो'),
  (6, 'Hindi', 10, 'परीक्षा'),
  (6, 'Hindi', 11, 'चेतक की वीरता'),
  (6, 'Hindi', 12, 'हिंद महासागर में छोटा-सा हिंदुस्तान'),
  (6, 'Hindi', 13, 'पेड़ की बात'),
  (7, 'Hindi', 1, 'माँ, कह एक कहानी'),
  (7, 'Hindi', 2, 'तीन बुद्धिमान'),
  (7, 'Hindi', 3, 'फूल और काँटा'),
  (7, 'Hindi', 4, 'पानी रे पानी'),
  (7, 'Hindi', 5, 'नहीं होना बीमार'),
  (7, 'Hindi', 6, 'गिरिधर कविराय की कुंडलिया'),
  (7, 'Hindi', 7, 'वर्षा-बहार'),
  (7, 'Hindi', 8, 'बिरजू महाराज से साक्षात्कार'),
  (7, 'Hindi', 9, 'चिड़िया'),
  (7, 'Hindi', 10, 'मीरा के पद'),
  (8, 'Hindi', 1, 'स्वदेश'),
  (8, 'Hindi', 2, 'दो गौरैया'),
  (8, 'Hindi', 3, 'एक आशीर्वाद'),
  (8, 'Hindi', 4, 'हरिद्वार'),
  (8, 'Hindi', 5, 'कबीर के दोहे'),
  (8, 'Hindi', 6, 'एक टोकरी भर मिट्टी'),
  (8, 'Hindi', 7, 'मत बाँधो'),
  (8, 'Hindi', 8, 'नए मेहमान'),
  (8, 'Hindi', 9, 'आदमी का अनुपात'),
  (8, 'Hindi', 10, 'तरुण के स्वप्न'),
  (9, 'Hindi', 1, 'दो बैलों की कथा'),
  (9, 'Hindi', 2, 'क्या लिखूँ?'),
  (9, 'Hindi', 3, 'संवादहीन'),
  (9, 'Hindi', 4, 'ऐसी भी बातें होती हैं (लता मंगेशकर से साक्षात्कार)'),
  (9, 'Hindi', 5, 'आखिरी चट्टान तक'),
  (9, 'Hindi', 6, 'रीढ़ की हड्डी'),
  (9, 'Hindi', 7, 'मैं और मेरा देश'),
  (9, 'Hindi', 8, 'पद'),
  (9, 'Hindi', 9, 'राम-लक्ष्मण-परशुराम संवाद'),
  (9, 'Hindi', 10, 'भारति, जय, विजय करे!'),
  (9, 'Hindi', 11, 'झाँसी की रानी'),
  (9, 'Hindi', 12, 'घर की याद');

update public.chapters as existing
set title = catalog.title,
    archived_at = null
from hindi_catalog as catalog
where existing.class_level = catalog.class_level
  and lower(trim(existing.subject)) = lower(catalog.subject)
  and existing.chapter_no = catalog.chapter_no;

insert into public.chapters (centre_id, class_level, subject, chapter_no, title)
select centre.id, catalog.class_level, catalog.subject, catalog.chapter_no, catalog.title
from public.centres as centre
cross join hindi_catalog as catalog
where not exists (
  select 1 from public.chapters existing
  where existing.centre_id = centre.id
    and existing.class_level = catalog.class_level
    and lower(trim(existing.subject)) = lower(catalog.subject)
    and existing.chapter_no = catalog.chapter_no
);

-- Keep saved tests aligned when they point to corrected Hindi chapter records.
update public.tests as test
set chapter_no = chapter.chapter_no,
    chapter_name = chapter.title
from public.chapters as chapter
join hindi_catalog as catalog
  on catalog.class_level = chapter.class_level
 and lower(catalog.subject) = lower(chapter.subject)
 and catalog.chapter_no = chapter.chapter_no
where test.chapter_id = chapter.id;
