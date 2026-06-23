-- Teacher Activation Hub schema.
-- Browser app v1 uses authenticated RLS and assisted-manual WhatsApp sending.

create extension if not exists pgcrypto;

create table if not exists public.tah_teachers (
  id uuid primary key default gen_random_uuid(),
  centre_id uuid references public.centres(id) on delete cascade,
  name text not null,
  mobile text not null,
  school_name text,
  class_level text,
  subject text,
  board text check (board in ('Odisha Board','CBSE')),
  language text,
  enrollment_date date,
  journey_day int not null default 0,
  prepared boolean not null default false,
  prepared_at timestamptz,
  taught boolean not null default false,
  taught_at timestamptz,
  loop_completed boolean not null default false,
  loop_completed_at timestamptz,
  nps_score int check (nps_score between 0 and 10),
  feedback_sentiment text generated always as (
    case when nps_score is null then null
         when nps_score >= 9 then 'promoter'
         when nps_score >= 7 then 'passive'
         else 'detractor' end
  ) stored,
  status text generated always as (
    case when loop_completed then 'activated'
         when taught then 'teaching'
         when prepared then 'preparing'
         else 'not_started' end
  ) stored,
  rated boolean not null default false,
  rated_at timestamptz,
  referrals_sent int not null default 0,
  referral_conversions int not null default 0,
  referred_by uuid references public.tah_teachers(id),
  referral_code text unique default encode(gen_random_bytes(6),'hex'),
  testimonial_consent boolean not null default false,
  testimonial_sent boolean not null default false,
  opted_out boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mobile)
);

create table if not exists public.tah_message_templates (
  id uuid primary key default gen_random_uuid(),
  day_key text not null,
  language text not null check (language in ('en','od')),
  category text not null check (category in ('activation','teach','feedback','confirm','growth','recover')),
  app_target text not null check (app_target in ('teachers','smartclass','both','none')),
  title text,
  body text not null,
  video_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (day_key, language)
);

create table if not exists public.tah_message_logs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.tah_teachers(id) on delete cascade,
  template_id uuid references public.tah_message_templates(id),
  day_key text not null,
  language text,
  channel text not null default 'whatsapp',
  status text not null default 'sent' check (status in ('queued','sent','delivered','replied','failed')),
  rendered_body text,
  reply_text text,
  sent_at timestamptz default now(),
  delivered_at timestamptz,
  replied_at timestamptz,
  sent_by uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.tah_feedback (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.tah_teachers(id) on delete cascade,
  nps_score int check (nps_score between 0 and 10),
  used_resources jsonb,
  taught_with_smartclass boolean,
  smartclass_resources jsonb,
  usefulness int check (usefulness between 1 and 5),
  ease int check (ease between 1 and 5),
  most_useful text,
  missing text,
  smartclass_blocker text,
  testimonial_consent boolean default false,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.tah_referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_teacher_id uuid not null references public.tah_teachers(id) on delete cascade,
  referred_mobile text,
  referred_name text,
  referred_teacher_id uuid references public.tah_teachers(id),
  status text not null default 'invited' check (status in ('invited','enrolled','activated')),
  created_at timestamptz not null default now(),
  converted_at timestamptz
);

create table if not exists public.tah_testimonials (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid references public.tah_teachers(id),
  quote text not null,
  display_name text,
  school text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.tah_set_language() returns trigger as $$
begin
  new.language := case
    when new.board = 'Odisha Board' then 'od'
    when new.board = 'CBSE' then 'en'
    else 'en' end;
  new.updated_at := now();
  return new;
end; $$ language plpgsql;

drop trigger if exists tah_teachers_lang on public.tah_teachers;
create trigger tah_teachers_lang before insert or update on public.tah_teachers
for each row execute function public.tah_set_language();

alter table public.tah_teachers enable row level security;
alter table public.tah_message_templates enable row level security;
alter table public.tah_message_logs enable row level security;
alter table public.tah_feedback enable row level security;
alter table public.tah_referrals enable row level security;
alter table public.tah_testimonials enable row level security;

revoke all on public.tah_teachers from anon;
revoke all on public.tah_message_templates from anon;
revoke all on public.tah_message_logs from anon;
revoke all on public.tah_feedback from anon;
revoke all on public.tah_referrals from anon;
revoke all on public.tah_testimonials from anon;

do $$
declare t text;
begin
  foreach t in array array['tah_teachers','tah_message_templates','tah_message_logs','tah_feedback','tah_referrals','tah_testimonials']
  loop
    execute format('drop policy if exists "admin_all_%1$s" on public.%1$s;', t);
    execute format('create policy "admin_all_%1$s" on public.%1$s for all to authenticated using (auth.role() = ''authenticated'') with check (auth.role() = ''authenticated'');', t);
  end loop;
end $$;

insert into public.tah_message_templates (day_key,language,category,app_target,title,body,video_url) values
('D1','en','activation','both','Welcome + loop','Dear {name}, welcome to Aveti! 🎉 Here''s how teachers get the best results: 1) Prepare your Class {class} {subject} lesson in the Teachers App, 2) Teach it live in the Smart Class App. ▶️ 30-sec overview: {video_link}  Start here: {app_link}',null),
('D1','od','activation','both','Welcome + loop','ପ୍ରିୟ {name}, Aveti କୁ ସ୍ୱାଗତ! 🎉 ଶିକ୍ଷକମାନେ ସବୁଠୁ ଭଲ ଫଳ ଏମିତି ପାଆନ୍ତି: ୧) Teachers App ରେ ଆପଣଙ୍କ ଶ୍ରେଣୀ {class} {subject} ପାଠ ପ୍ରସ୍ତୁତ କରନ୍ତୁ, ୨) Smart Class App ରେ ତାହା ଶ୍ରେଣୀରେ ପଢ଼ାନ୍ତୁ। ▶️ ୩୦ ସେକେଣ୍ଡର ଝଲକ: {video_link}  ଆରମ୍ଭ କରନ୍ତୁ: {app_link}',null),
('D2','en','activation','both','Lesson plan','Dear {name}, today start with one ready lesson plan. Open the Teachers App and prepare your Class {class} {subject} lesson plan. It will help you teach with better flow and less preparation time. ▶️ Guide: {video_link}  Open Teachers App: {app_link} …Prepared it? Now teach it live in the Smart Class App ▶️ {sc_video}',null),
('D2','od','activation','both','Lesson plan','ପ୍ରିୟ {name}, ଆଜି ଗୋଟିଏ ready lesson plan ରୁ ଆରମ୍ଭ କରନ୍ତୁ। Teachers App ଖୋଲି ଆପଣଙ୍କ ଶ୍ରେଣୀ {class} {subject} ପାଠର lesson plan ପ୍ରସ୍ତୁତ କରନ୍ତୁ। ଏହା କମ୍ ସମୟରେ ଭଲ ଭାବେ ପଢ଼ାଇବାରେ ସାହାଯ୍ୟ କରିବ। ▶️ Guide: {video_link}  Teachers App: {app_link} …ପ୍ରସ୍ତୁତ କଲେ? ବର୍ତ୍ତମାନ Smart Class App ରେ ଶ୍ରେଣୀରେ ପଢ଼ାନ୍ତୁ ▶️ {sc_video}',null),
('D3','en','activation','both','Worksheet','Dear {name}, make practice easier today. Open the Teachers App and prepare a worksheet for Class {class} {subject}. Use it for class practice or homework. ▶️ Quick guide: {video_link}  Open Teachers App: {app_link} …Prepared it? Now teach it live in the Smart Class App ▶️ {sc_video}',null),
('D3','od','activation','both','Worksheet','ପ୍ରିୟ {name}, ଆଜି practice କୁ ସହଜ କରନ୍ତୁ। Teachers App ଖୋଲି ଶ୍ରେଣୀ {class} {subject} ପାଇଁ worksheet ପ୍ରସ୍ତୁତ କରନ୍ତୁ। ଏହାକୁ class practice କିମ୍ବା homework ପାଇଁ ବ୍ୟବହାର କରନ୍ତୁ। ▶️ Quick guide: {video_link}  Teachers App: {app_link} …ପ୍ରସ୍ତୁତ କଲେ? ବର୍ତ୍ତମାନ Smart Class App ରେ ଶ୍ରେଣୀରେ ପଢ଼ାନ୍ତୁ ▶️ {sc_video}',null),
('D4','en','activation','both','Chapter-end test','Dear {name}, check student understanding with a quick chapter-end test. Open the Teachers App and prepare a test with answer key for Class {class} {subject}. ▶️ How to create: {video_link}  Open Teachers App: {app_link} …Prepared it? Now teach it live in the Smart Class App ▶️ {sc_video}',null),
('D4','od','activation','both','Chapter-end test','ପ୍ରିୟ {name}, ଛାତ୍ରମାନେ କେତେ ବୁଝିଛନ୍ତି ଜାଣିବା ପାଇଁ ଏକ quick chapter-end test ବ୍ୟବହାର କରନ୍ତୁ। Teachers App ଖୋଲି ଶ୍ରେଣୀ {class} {subject} ପାଇଁ answer key ସହ test ପ୍ରସ୍ତୁତ କରନ୍ତୁ। ▶️ କିପରି କରିବେ: {video_link}  Teachers App: {app_link} …ପ୍ରସ୍ତୁତ କଲେ? ବର୍ତ୍ତମାନ Smart Class App ରେ ଶ୍ରେଣୀରେ ପଢ଼ାନ୍ତୁ ▶️ {sc_video}',null),
('D5','en','teach','smartclass','Smart Class nudge','Dear {name}, you''ve prepared your resources — now bring them alive in class! Open the Smart Class App and teach your Class {class} {subject} lesson. ▶️ How (30s): {sc_video}  Open Smart Class: {smartclass_link}',null),
('D5','od','teach','smartclass','Smart Class nudge','ପ୍ରିୟ {name}, ଆପଣ ସମ୍ବଳ ପ୍ରସ୍ତୁତ କରିସାରିଛନ୍ତି — ବର୍ତ୍ତମାନ ସେଗୁଡ଼ିକୁ ଶ୍ରେଣୀରେ ଜୀବନ୍ତ କରନ୍ତୁ! Smart Class App ଖୋଲି ଆପଣଙ୍କ ଶ୍ରେଣୀ {class} {subject} ପାଠ ପଢ଼ାନ୍ତୁ। ▶️ କିପରି (୩୦ ସେକେଣ୍ଡ): {sc_video}  Smart Class ଖୋଲନ୍ତୁ: {smartclass_link}',null),
('D6','en','teach','both','Complete the loop','Dear {name}, you now have the full Aveti loop: prepare (plans, worksheets, tests, mind maps) in the Teachers App, then teach live in Smart Class. ▶️ Putting it together (30s): {video_link}  Teachers App: {app_link} · Smart Class: {smartclass_link}',null),
('D6','od','teach','both','Complete the loop','ପ୍ରିୟ {name}, ବର୍ତ୍ତମାନ ଆପଣଙ୍କ ପାଖରେ ସମ୍ପୂର୍ଣ୍ଣ Aveti loop: Teachers App ରେ ପ୍ରସ୍ତୁତି (plan, worksheet, test, mind map), ତାପରେ Smart Class ରେ ଶ୍ରେଣୀରେ ପଢ଼ାନ୍ତୁ। ▶️ (୩୦ ସେକେଣ୍ଡ): {video_link}  Teachers App: {app_link} · Smart Class: {smartclass_link}',null),
('D7','en','feedback','none','Feedback','Dear {name}, your feedback will help us improve Aveti for teachers. Please share what you prepared and whether you used Smart Class to teach. It takes 1 minute: {feedback_form_link}',null),
('D7','od','feedback','none','Feedback','ପ୍ରିୟ {name}, ଆପଣଙ୍କ feedback ଆମକୁ Aveti କୁ ଶିକ୍ଷକମାନଙ୍କ ପାଇଁ ଆହୁରି ଭଲ କରିବାରେ ସାହାଯ୍ୟ କରିବ। ଆପଣ କଣ ପ୍ରସ୍ତୁତ କଲେ ଏବଂ Smart Class ବ୍ୟବହାର କରି ପଢ଼ାଇଲେ କି ନାହିଁ ଦୟାକରି କହନ୍ତୁ। ୧ ମିନିଟ୍ ଲାଗିବ: {feedback_form_link}',null),
('D8','en','confirm','smartclass','Smart Class confirmation','Dear {name}, quick check 👇 Have you taught a class using the Smart Class App this week? Reply *YES* or *NOT YET*. (Teachers who prepare in the Teachers App AND teach in Smart Class see the best results for their students!)',null),
('D8','od','confirm','smartclass','Smart Class confirmation','ପ୍ରିୟ {name}, ଗୋଟିଏ ଛୋଟ ପ୍ରଶ୍ନ 👇 ଏ ସପ୍ତାହ ଆପଣ Smart Class App ବ୍ୟବହାର କରି କୌଣସି ଶ୍ରେଣୀ ପଢ଼ାଇଛନ୍ତି କି? *YES* କିମ୍ବା *NOT YET* reply କରନ୍ତୁ। (ଯେଉଁ ଶିକ୍ଷକ Teachers App ରେ ପ୍ରସ୍ତୁତ କରି Smart Class ରେ ପଢ଼ାନ୍ତି, ସେମାନଙ୍କ ଛାତ୍ରମାନେ ସବୁଠୁ ଭଲ ଫଳ ପାଆନ୍ତି!)',null),
('rating','en','growth','none','Rating','Dear {name}, thank you for completing the Aveti prepare + teach loop. If Aveti helped your class, please rate your experience here: {rating_link}',null),
('rating','od','growth','none','Rating','ପ୍ରିୟ {name}, Aveti ର prepare + teach loop ସମ୍ପୂର୍ଣ୍ଣ କରିଥିବାରୁ ଧନ୍ୟବାଦ। Aveti ଆପଣଙ୍କ class କୁ ସାହାଯ୍ୟ କରିଥିଲେ, ଦୟାକରି ଏଠାରେ rating ଦିଅନ୍ତୁ: {rating_link}',null),
('referral','en','growth','none','Referral','Dear {name}, if Aveti is useful for your teaching, please invite another teacher to try it. Your referral link: {referral_link}',null),
('referral','od','growth','none','Referral','ପ୍ରିୟ {name}, Aveti ଆପଣଙ୍କ ପଢ଼ାଇରେ ଉପଯୋଗୀ ହେଉଥିଲେ, ଆଉ ଜଣେ ଶିକ୍ଷକଙ୍କୁ try କରିବାକୁ invite କରନ୍ତୁ। ଆପଣଙ୍କ referral link: {referral_link}',null),
('testimonial','en','growth','none','Testimonial','Dear {name}, your Aveti experience can inspire other teachers. Can we share your feedback as a short testimonial? Reply YES if you agree.',null),
('testimonial','od','growth','none','Testimonial','ପ୍ରିୟ {name}, ଆପଣଙ୍କ Aveti experience ଅନ୍ୟ ଶିକ୍ଷକମାନଙ୍କୁ ପ୍ରେରଣା ଦେଇପାରେ। ଆମେ ଆପଣଙ୍କ feedback କୁ ଏକ ଛୋଟ testimonial ଭାବେ share କରିପାରିବୁ କି? ସମ୍ମତ ହେଲେ YES reply କରନ୍ତୁ।',null),
('detractor','en','recover','none','Recovery','Dear {name}, thank you for your honest feedback. We are sorry Aveti did not fully meet your expectation. Please tell us what blocked you, and our team will help: {feedback_form_link}',null),
('detractor','od','recover','none','Recovery','ପ୍ରିୟ {name}, ଆପଣଙ୍କ ସତ୍ୟ feedback ପାଇଁ ଧନ୍ୟବାଦ। Aveti ଆପଣଙ୍କ ଆଶା ପୂରଣ କରିପାରିନଥିଲେ ଆମେ ଦୁଃଖିତ। କେଉଁଠି ସମସ୍ୟା ହେଲା ଦୟାକରି କହନ୍ତୁ, ଆମ team ସାହାଯ୍ୟ କରିବ: {feedback_form_link}',null),
('reactivation','en','recover','both','Reactivation','Dear {name}, many teachers start with just one lesson. Open the Teachers App, prepare one Class {class} {subject} resource, and use it in Smart Class. Small start, strong impact. Teachers App: {app_link}  Smart Class: {smartclass_link}',null),
('reactivation','od','recover','both','Reactivation','ପ୍ରିୟ {name}, ଅନେକ ଶିକ୍ଷକ କେବଳ ଗୋଟିଏ lesson ରୁ ଆରମ୍ଭ କରନ୍ତି। Teachers App ଖୋଲି ଶ୍ରେଣୀ {class} {subject} ପାଇଁ ଗୋଟିଏ resource ପ୍ରସ୍ତୁତ କରନ୍ତୁ ଏବଂ Smart Class ରେ ବ୍ୟବହାର କରନ୍ତୁ। ଛୋଟ ଆରମ୍ଭ, ଭଲ ପ୍ରଭାବ। Teachers App: {app_link}  Smart Class: {smartclass_link}',null)
on conflict (day_key, language) do update set
  category = excluded.category,
  app_target = excluded.app_target,
  title = excluded.title,
  body = excluded.body,
  video_url = excluded.video_url,
  active = true,
  updated_at = now();
