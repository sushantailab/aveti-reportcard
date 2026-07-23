/* =============================================================
   DATA LAYER  — same interface for demo (in-memory) and Supabase.
   ============================================================= */
let supa = null;
if (CONFIG.USE_SUPABASE) {
  supa = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

const uid = () => Math.random().toString(36).slice(2,10);

/* ---- Demo seed (used when USE_SUPABASE = false) ---- */
const demo = {
  students: [
    { id:'s1', name:'Saswat',     academic_session:'2026-27', class_level:9, section:'A', gender:'male',   parent_name:'', parent_phone:'+919800000021' },
    { id:'s2', name:'Anshuman',   academic_session:'2026-27', class_level:9, section:'A', gender:'male',   parent_name:'', parent_phone:'+919900000007' },
    { id:'s3', name:'Guruprasad', academic_session:'2026-27', class_level:9, section:'A', gender:'male',   parent_name:'', parent_phone:'+919000000044' },
    { id:'s4', name:'Asman',      academic_session:'2026-27', class_level:9, section:'A', gender:'female', parent_name:'', parent_phone:'' },
  ],
  chapters: [
    { id:'c1', class_level:9, subject:'Hindi', chapter_no:1, title:'दो बैलों की कथा' },
    { id:'c2', class_level:9, subject:'Hindi', chapter_no:2, title:'ल्हासा की ओर' },
    { id:'c3', class_level:9, subject:'Hindi', chapter_no:3, title:'उपभोक्तावाद' },
    { id:'c4', class_level:9, subject:'SST', chapter_no:1, title:'Demo Civics 1' },
    { id:'c5', class_level:9, subject:'SST', chapter_no:2, title:'Demo Geography 2' },
    { id:'c6', class_level:9, subject:'SST', chapter_no:3, title:'Demo History 3' },
    { id:'c7', class_level:9, subject:'Science', chapter_no:1, title:'Exploration: World of Secondary Science' },
    { id:'c8', class_level:9, subject:'Science', chapter_no:2, title:'Cell: Building Block of Life' },
    { id:'c9', class_level:9, subject:'Science', chapter_no:3, title:'Tissues in Action' },
    { id:'c10', class_level:9, subject:'Science', chapter_no:4, title:'Describing Motion Around Us' },
    { id:'c11', class_level:9, subject:'Science', chapter_no:5, title:'Exploring Mixtures and Separation' },
    { id:'c12', class_level:9, subject:'Science', chapter_no:6, title:'How Forces Affect Motion' },
    { id:'c13', class_level:9, subject:'Science', chapter_no:7, title:'Work, Energy, and Simple Machines' },
    { id:'c14', class_level:9, subject:'Science', chapter_no:8, title:'Journey Inside the Atom' },
    { id:'c15', class_level:9, subject:'Science', chapter_no:9, title:'Atomic Foundations of Matter' },
    { id:'c16', class_level:9, subject:'Science', chapter_no:10, title:'Sound Waves: Characteristics and Applications' },
    { id:'c17', class_level:9, subject:'Science', chapter_no:11, title:'Reproduction: How Life Continues' },
    { id:'c18', class_level:9, subject:'Science', chapter_no:12, title:'Patterns in Life: Diversity and Classification' },
    { id:'c19', class_level:9, subject:'Science', chapter_no:13, title:'Earth as a System: Energy, Matter, and Life' },
    { id:'c20', class_level:8, subject:'Science', chapter_no:1, title:'Exploring the Investigative World of Science' },
    { id:'c21', class_level:8, subject:'Science', chapter_no:2, title:'The Invisible Living World: Beyond Our Naked Eye' },
    { id:'c22', class_level:8, subject:'Science', chapter_no:3, title:'Health: The Ultimate Treasure' },
    { id:'c23', class_level:8, subject:'Science', chapter_no:4, title:'Electricity: Magnetic and Heating Effects' },
    { id:'c24', class_level:8, subject:'Science', chapter_no:5, title:'Exploring Forces' },
    { id:'c25', class_level:8, subject:'Science', chapter_no:6, title:'Pressure, Winds, Storms, and Cyclones' },
    { id:'c26', class_level:8, subject:'Science', chapter_no:7, title:'Particulate Nature of Matter' },
    { id:'c27', class_level:8, subject:'Science', chapter_no:8, title:'Nature of Matter: Elements, Compounds, and Mixtures' },
    { id:'c28', class_level:8, subject:'Science', chapter_no:9, title:'The Amazing World of Solutes, Solvents, and Solutions' },
    { id:'c29', class_level:8, subject:'Science', chapter_no:10, title:'Light: Mirrors and Lenses' },
    { id:'c30', class_level:8, subject:'Science', chapter_no:11, title:'Keeping Time with the Skies' },
    { id:'c31', class_level:8, subject:'Science', chapter_no:12, title:'How Nature Works in Harmony' },
    { id:'c32', class_level:8, subject:'Science', chapter_no:13, title:'Our Home: Earth, a Unique Life Sustaining Planet' },
  ],
  tests: [
    { id:'t1', class_level:9, section:'A', subject:'Hindi', chapter_id:'c1', chapter_no:1, chapter_name:'दो बैलों की कथा', test_type:'CET', full_marks:25, test_date:'2026-04-08' },
    { id:'t2', class_level:9, section:'A', subject:'Hindi', chapter_id:'c2', chapter_no:2, chapter_name:'ल्हासा की ओर',   test_type:'CET', full_marks:20, test_date:'2026-04-24' },
    { id:'t3', class_level:9, section:'A', subject:'Hindi', chapter_id:'c3', chapter_no:3, chapter_name:'उपभोक्तावाद',     test_type:'CET', full_marks:25, test_date:'2026-05-12' },
    { id:'t4', class_level:9, section:'A', subject:'SST', chapter_id:'c4', chapter_no:1, chapter_name:'Demo Civics 1', test_type:'CET', full_marks:25, test_date:'2026-05-20' },
    { id:'t5', class_level:9, section:'A', subject:'SST', chapter_id:'c5', chapter_no:2, chapter_name:'Demo Geography 2', test_type:'CET', full_marks:25, test_date:'2026-05-28' },
    { id:'t6', class_level:9, section:'A', subject:'SST', chapter_id:'c6', chapter_no:3, chapter_name:'Demo History 3', test_type:'CET', full_marks:25, test_date:'2026-06-04' },
    { id:'t7', class_level:9, section:'A', subject:'Science', chapter_id:'c7', chapter_no:1, chapter_name:'Demo Matter', test_type:'CET', full_marks:20, test_date:'2026-05-18' },
    { id:'t8', class_level:9, section:'A', subject:'Science', chapter_id:'c8', chapter_no:2, chapter_name:'Demo Tissues', test_type:'CET', full_marks:20, test_date:'2026-05-27' },
    { id:'t9', class_level:9, section:'A', subject:'Science', chapter_id:'c9', chapter_no:3, chapter_name:'Demo Motion', test_type:'CET', full_marks:20, test_date:'2026-06-03' },
  ],
  results: [
    {id:'r1',test_id:'t1',student_id:'s1',marks:22,present:true},{id:'r2',test_id:'t1',student_id:'s2',marks:21.5,present:true},{id:'r3',test_id:'t1',student_id:'s3',marks:19.5,present:true},{id:'r4',test_id:'t1',student_id:'s4',marks:13,present:true},
    {id:'r5',test_id:'t2',student_id:'s1',marks:16.8,present:true},{id:'r6',test_id:'t2',student_id:'s2',marks:16.4,present:true},{id:'r7',test_id:'t2',student_id:'s3',marks:14.8,present:true},{id:'r8',test_id:'t2',student_id:'s4',marks:9.6,present:true},
    {id:'r9',test_id:'t3',student_id:'s1',marks:22.5,present:true},{id:'r10',test_id:'t3',student_id:'s2',marks:21.3,present:true},{id:'r11',test_id:'t3',student_id:'s3',marks:20,present:true},{id:'r12',test_id:'t3',student_id:'s4',marks:15,present:true},
    {id:'r13',test_id:'t4',student_id:'s1',marks:18,present:true},{id:'r14',test_id:'t4',student_id:'s2',marks:16,present:true},{id:'r15',test_id:'t4',student_id:'s3',marks:20,present:true},{id:'r16',test_id:'t4',student_id:'s4',marks:12,present:true},
    {id:'r17',test_id:'t5',student_id:'s1',marks:21,present:true},{id:'r18',test_id:'t5',student_id:'s2',marks:17.5,present:true},{id:'r19',test_id:'t5',student_id:'s3',marks:null,present:false},{id:'r20',test_id:'t5',student_id:'s4',marks:14,present:true},
    {id:'r21',test_id:'t6',student_id:'s1',marks:23,present:true},{id:'r22',test_id:'t6',student_id:'s2',marks:19,present:true},{id:'r23',test_id:'t6',student_id:'s3',marks:22,present:true},{id:'r24',test_id:'t6',student_id:'s4',marks:16,present:true},
    {id:'r25',test_id:'t7',student_id:'s1',marks:15,present:true},{id:'r26',test_id:'t7',student_id:'s2',marks:14,present:true},{id:'r27',test_id:'t7',student_id:'s3',marks:16,present:true},{id:'r28',test_id:'t7',student_id:'s4',marks:10,present:true},
    {id:'r29',test_id:'t8',student_id:'s1',marks:16.5,present:true},{id:'r30',test_id:'t8',student_id:'s2',marks:null,present:false},{id:'r31',test_id:'t8',student_id:'s3',marks:17,present:true},{id:'r32',test_id:'t8',student_id:'s4',marks:12,present:true},
    {id:'r33',test_id:'t9',student_id:'s1',marks:18,present:true},{id:'r34',test_id:'t9',student_id:'s2',marks:15,present:true},{id:'r35',test_id:'t9',student_id:'s3',marks:18.5,present:true},{id:'r36',test_id:'t9',student_id:'s4',marks:13,present:true},
  ],
  training_events: [
    {
      id:'ev1',
      title:'NEP 2020 and Competency-Based Teaching Practices',
      subtitle:'One-Hour Professional Development Webinar',
      event_date:'2026-06-22',
      duration_hours:1,
      organizer_name:'AVETI LEARNING',
      focus_points:'Understanding the vision of NEP 2020\nIntroduction to Competency-Based Education\nClassroom implementation strategies\nEffective lesson planning and assessment practices\nDigital tools and teaching resources for improved learning outcomes',
      certificate_prefix:'AVT-PD-2026',
      signatory_1_name:'Sushant Kumar Mahapatra',
      signatory_1_title:'Co-Founder & Chief Academic Officer',
      signatory_2_name:'',
      signatory_2_title:''
    }
  ],
  training_participants: [
    {id:'tp1',event_id:'ev1',sequence_no:1,certificate_id:'AVT-PD-2026-000001',name:'Priya Sharma',phone:'9876543210',whatsapp:'9876543210',email:'priya@gmail.com',school:'DAV Public School',whatsapp_sent_at:null,verified_at:null},
    {id:'tp2',event_id:'ev1',sequence_no:2,certificate_id:'AVT-PD-2026-000002',name:'Rakesh Kumar',phone:'9123456789',whatsapp:'9123456789',email:'rakesh@gmail.com',school:'OAV Bhubaneswar',whatsapp_sent_at:null,verified_at:null}
  ],
  tah_teachers: [
    {id:'tah1',name:'Priya Sharma',mobile:'9876543210',school_name:'DAV Public School',class_level:'8',subject:'Science',board:'CBSE',language:'en',enrollment_date:'2026-06-23',journey_day:2,prepared:true,taught:false,loop_completed:false,nps_score:null,feedback_sentiment:null,status:'preparing',rated:false,referrals_sent:0,referral_conversions:0,referral_code:'priya01',testimonial_consent:false,testimonial_sent:false,opted_out:false},
    {id:'tah2',name:'Rakesh Kumar',mobile:'9123456789',school_name:'OAV Bhubaneswar',class_level:'7',subject:'Mathematics',board:'Odisha Board',language:'od',enrollment_date:'2026-06-23',journey_day:8,prepared:true,taught:true,loop_completed:true,nps_score:9,feedback_sentiment:'promoter',status:'activated',rated:false,referrals_sent:0,referral_conversions:0,referral_code:'rakesh01',testimonial_consent:true,testimonial_sent:false,opted_out:false}
  ],
  tah_message_templates: [
    {id:'tmpl1',day_key:'D1',language:'en',category:'activation',app_target:'both',title:'Welcome + loop',body:'Dear {name}, welcome to Aveti! 🎉 Here’s how teachers get the best results: 1) Prepare your Class {class} {subject} lesson in the Teachers App, 2) Teach it live in the Smart Class App. ▶️ 30-sec overview: {video_link}  Start here: {app_link}',video_url:'',active:true},
    {id:'tmpl2',day_key:'D1',language:'od',category:'activation',app_target:'both',title:'Welcome + loop',body:'ପ୍ରିୟ {name}, Aveti କୁ ସ୍ୱାଗତ! 🎉 ଶିକ୍ଷକମାନେ ସବୁଠୁ ଭଲ ଫଳ ଏମିତି ପାଆନ୍ତି: ୧) Teachers App ରେ ଆପଣଙ୍କ ଶ୍ରେଣୀ {class} {subject} ପାଠ ପ୍ରସ୍ତୁତ କରନ୍ତୁ, ୨) Smart Class App ରେ ତାହା ଶ୍ରେଣୀରେ ପଢ଼ାନ୍ତୁ। ▶️ ୩୦ ସେକେଣ୍ଡର ଝଲକ: {video_link}  ଆରମ୍ଭ କରନ୍ତୁ: {app_link}',video_url:'',active:true},
    {id:'tmpl3',day_key:'D2',language:'en',category:'activation',app_target:'both',title:'Lesson plan',body:'Dear {name}, today start with one ready lesson plan. Open the Teachers App and prepare your Class {class} {subject} lesson plan. It will help you teach with better flow and less preparation time. ▶️ Guide: {video_link}  Open Teachers App: {app_link} …Prepared it? Now teach it live in the Smart Class App ▶️ {sc_video}',video_url:'',active:true},
    {id:'tmpl4',day_key:'D2',language:'od',category:'activation',app_target:'both',title:'Lesson plan',body:'ପ୍ରିୟ {name}, ଆଜି ଗୋଟିଏ ready lesson plan ରୁ ଆରମ୍ଭ କରନ୍ତୁ। Teachers App ଖୋଲି ଆପଣଙ୍କ ଶ୍ରେଣୀ {class} {subject} ପାଠର lesson plan ପ୍ରସ୍ତୁତ କରନ୍ତୁ। ଏହା କମ୍ ସମୟରେ ଭଲ ଭାବେ ପଢ଼ାଇବାରେ ସାହାଯ୍ୟ କରିବ। ▶️ Guide: {video_link}  Teachers App: {app_link} …ପ୍ରସ୍ତୁତ କଲେ? ବର୍ତ୍ତମାନ Smart Class App ରେ ଶ୍ରେଣୀରେ ପଢ଼ାନ୍ତୁ ▶️ {sc_video}',video_url:'',active:true},
    {id:'tmpl5',day_key:'D5',language:'en',category:'teach',app_target:'smartclass',title:'Smart Class nudge',body:'Dear {name}, you’ve prepared your resources — now bring them alive in class! Open the Smart Class App and teach your Class {class} {subject} lesson. ▶️ How (30s): {sc_video}  Open Smart Class: {smartclass_link}',video_url:'',active:true},
    {id:'tmpl6',day_key:'D5',language:'od',category:'teach',app_target:'smartclass',title:'Smart Class nudge',body:'ପ୍ରିୟ {name}, ଆପଣ ସମ୍ବଳ ପ୍ରସ୍ତୁତ କରିସାରିଛନ୍ତି — ବର୍ତ୍ତମାନ ସେଗୁଡ଼ିକୁ ଶ୍ରେଣୀରେ ଜୀବନ୍ତ କରନ୍ତୁ! Smart Class App ଖୋଲି ଆପଣଙ୍କ ଶ୍ରେଣୀ {class} {subject} ପାଠ ପଢ଼ାନ୍ତୁ। ▶️ କିପରି (୩୦ ସେକେଣ୍ଡ): {sc_video}  Smart Class ଖୋଲନ୍ତୁ: {smartclass_link}',video_url:'',active:true},
    {id:'tmpl7',day_key:'D8',language:'en',category:'confirm',app_target:'smartclass',title:'Smart Class confirmation',body:'Dear {name}, quick check 👇 Have you taught a class using the Smart Class App this week? Reply *YES* or *NOT YET*. (Teachers who prepare in the Teachers App AND teach in Smart Class see the best results for their students!)',video_url:'',active:true},
    {id:'tmpl8',day_key:'D8',language:'od',category:'confirm',app_target:'smartclass',title:'Smart Class confirmation',body:'ପ୍ରିୟ {name}, ଗୋଟିଏ ଛୋଟ ପ୍ରଶ୍ନ 👇 ଏ ସପ୍ତାହ ଆପଣ Smart Class App ବ୍ୟବହାର କରି କୌଣସି ଶ୍ରେଣୀ ପଢ଼ାଇଛନ୍ତି କି? *YES* କିମ୍ବା *NOT YET* reply କରନ୍ତୁ। (ଯେଉଁ ଶିକ୍ଷକ Teachers App ରେ ପ୍ରସ୍ତୁତ କରି Smart Class ରେ ପଢ଼ାନ୍ତି, ସେମାନଙ୍କ ଛାତ୍ରମାନେ ସବୁଠୁ ଭଲ ଫଳ ପାଆନ୍ତି!)',video_url:'',active:true}
  ],
  tah_message_logs: [],
};

const normalizeText = s => (s||'').trim().replace(/\s+/g,' ');
const chapterKey = (cls,subject,title) => [cls, subject, normalizeText(title).toLowerCase()].join('|');
function attachChapter(t){
  const ch = t.chapter || demo.chapters?.find(c=>c.id===t.chapter_id);
  return ch ? {...t, chapter:ch, chapter_no:ch.chapter_no, chapter_name:ch.title} : t;
}

const memoryDB = {
  async listStudents(){ return [...demo.students].sort((a,b)=>a.name.localeCompare(b.name)); },
  async addStudent(s){ const r={id:uid(),...s}; demo.students.push(r); return r; },
  async updateStudent(id,patch){ Object.assign(demo.students.find(x=>x.id===id),patch); },
  async deleteStudent(id){ demo.students = demo.students.filter(x=>x.id!==id); demo.results = demo.results.filter(r=>r.student_id!==id); },
  async listChapters(cls,subject){ return demo.chapters.filter(c=>String(c.class_level)===String(cls) && c.subject===subject).sort((a,b)=>a.chapter_no-b.chapter_no); },
  async addChapter(ch){
    const title = normalizeText(ch.title);
    const existing = demo.chapters.find(c=>
      String(c.class_level)===String(ch.class_level) &&
      c.subject===ch.subject &&
      (Number(c.chapter_no)===Number(ch.chapter_no) || chapterKey(c.class_level,c.subject,c.title)===chapterKey(ch.class_level,ch.subject,title))
    );
    if(existing) return existing;
    const r={id:uid(),...ch,title}; demo.chapters.push(r); return r;
  },
  async listTests(){ return [...demo.tests].map(attachChapter).sort((a,b)=>new Date(b.test_date)-new Date(a.test_date)); },
  async addTest(t){ const r=attachChapter({id:uid(),...t}); demo.tests.push(r); return r; },
  async updateTest(id,patch){ const t=demo.tests.find(x=>x.id===id); Object.assign(t,patch); return attachChapter(t); },
  async listResults(testId){ return demo.results.filter(r=>r.test_id===testId); },
  async allResults(){ return demo.results; },
  async saveResults(testId,rows){ demo.results=demo.results.filter(r=>r.test_id!==testId); rows.forEach(r=>demo.results.push({id:uid(),test_id:testId,...r})); },
  async addEditLogs(rows){ demo.edit_logs = demo.edit_logs || []; rows.forEach(r=>demo.edit_logs.push({id:uid(),...r})); },
  async listTrainingEvents(){ return [...demo.training_events].sort((a,b)=>new Date(b.event_date)-new Date(a.event_date)); },
  async addTrainingEvent(event){ const r={id:uid(),...event}; demo.training_events.push(r); return r; },
  async updateTrainingEvent(id,patch){ const event=demo.training_events.find(x=>x.id===id); Object.assign(event,patch); return event; },
  async listTrainingParticipants(eventId){ return demo.training_participants.filter(p=>p.event_id===eventId).sort((a,b)=>a.sequence_no-b.sequence_no); },
  async verifyTrainingCertificate(certificateId){
    const participant = demo.training_participants.find(p=>p.certificate_id===certificateId);
    if(!participant) return null;
    const event = demo.training_events.find(e=>e.id===participant.event_id);
    return event ? {...participant,event} : null;
  },
  async saveTrainingParticipants(eventId,rows){
    demo.training_participants = demo.training_participants.filter(p=>p.event_id!==eventId);
    rows.forEach((r,i)=>demo.training_participants.push({id:uid(),event_id:eventId,sequence_no:i+1,...r}));
    return this.listTrainingParticipants(eventId);
  },
  async updateTrainingParticipant(id,patch){ const p=demo.training_participants.find(x=>x.id===id); Object.assign(p,patch); return p; },
  async listTahTeachers(){ return [...demo.tah_teachers].sort((a,b)=>a.name.localeCompare(b.name)); },
  async saveTahTeachers(rows){
    rows.forEach(r=>{
      const existing = demo.tah_teachers.find(t=>cleanPhone(t.mobile)===cleanPhone(r.mobile));
      if(existing) Object.assign(existing,r);
      else demo.tah_teachers.push({id:uid(),journey_day:0,prepared:false,taught:false,loop_completed:false,rated:false,referrals_sent:0,referral_conversions:0,referral_code:uid(),testimonial_consent:false,testimonial_sent:false,opted_out:false,...r});
    });
    return this.listTahTeachers();
  },
  async updateTahTeacher(id,patch){
    const t=demo.tah_teachers.find(x=>x.id===id);
    Object.assign(t,patch);
    if(patch.prepared && !t.prepared_at) t.prepared_at = new Date().toISOString();
    if(patch.taught && !t.taught_at) t.taught_at = new Date().toISOString();
    if(patch.loop_completed && !t.loop_completed_at) t.loop_completed_at = new Date().toISOString();
    t.status = t.loop_completed ? 'activated' : t.taught ? 'teaching' : t.prepared ? 'preparing' : 'not_started';
    return t;
  },
  async deleteTahTeacher(id){
    demo.tah_teachers = demo.tah_teachers.filter(t=>t.id!==id);
    demo.tah_message_logs = demo.tah_message_logs.filter(l=>l.teacher_id!==id);
  },
  async listTahTemplates(){ return [...demo.tah_message_templates]; },
  async updateTahTemplate(id,patch){
    const t=demo.tah_message_templates.find(x=>x.id===id);
    Object.assign(t,patch,{updated_at:new Date().toISOString()});
    return t;
  },
  async addTahMessageLog(log){ const r={id:uid(),created_at:new Date().toISOString(),sent_at:new Date().toISOString(),...log}; demo.tah_message_logs.push(r); return r; },
};

/* Supabase-backed DB (active when USE_SUPABASE = true). Same method names. */
let CENTRE_ID = null;   // set after login by ensureCentre()
let CURRENT_USER_ID = 'demo-user';
const STUDENT_COLS = 'id,name,academic_session,class_level,section,gender,optional_subject,parent_name,parent_phone,centre_id';
const STUDENT_COLS_LEGACY = 'id,name,class_level,section,gender,optional_subject,parent_name,parent_phone,centre_id';
const CHAPTER_COLS = 'id,centre_id,class_level,subject,chapter_no,title,created_at';
const TEST_COLS = 'id,centre_id,class_level,section,subject,chapter_id,chapter_ids,chapter_no,chapter_name,chapter_names,test_type,full_marks,duration_minutes,test_date,chapter:chapter_id(id,centre_id,class_level,subject,chapter_no,title)';
const TEST_COLS_LEGACY = 'id,centre_id,class_level,section,subject,chapter_id,chapter_no,chapter_name,test_type,full_marks,test_date,chapter:chapter_id(id,centre_id,class_level,subject,chapter_no,title)';
const RESULT_COLS = 'id,test_id,student_id,marks,present,na';
const EDIT_LOG_COLS = 'id,centre_id,test_id,student_id,edited_by,edited_at,old_marks,new_marks,old_present,new_present,old_na,new_na';
const TRAINING_EVENT_COLS = 'id,centre_id,title,subtitle,event_date,duration_hours,organizer_name,focus_points,certificate_prefix,signatory_1_name,signatory_1_title,signatory_2_name,signatory_2_title,created_at';
const TRAINING_PARTICIPANT_COLS = 'id,centre_id,event_id,sequence_no,certificate_id,name,phone,whatsapp,email,school,certificate_url,whatsapp_sent_at,email_sent_at,verified_at,created_at';
const TAH_TEACHER_COLS = 'id,centre_id,name,mobile,school_name,class_level,subject,board,language,enrollment_date,journey_day,prepared,prepared_at,taught,taught_at,loop_completed,loop_completed_at,nps_score,feedback_sentiment,status,rated,rated_at,referrals_sent,referral_conversions,referred_by,referral_code,testimonial_consent,testimonial_sent,opted_out,created_at,updated_at';
const TAH_TEMPLATE_COLS = 'id,day_key,language,category,app_target,title,body,video_url,image_url,active,created_at,updated_at';
const TAH_TEMPLATE_COLS_LEGACY = 'id,day_key,language,category,app_target,title,body,video_url,active,created_at,updated_at';
const TAH_LOG_COLS = 'id,teacher_id,template_id,day_key,language,channel,status,rendered_body,reply_text,sent_at,delivered_at,replied_at,sent_by,created_at';
const missingAcademicSession = error => String(error?.message||'').toLowerCase().includes('academic_session');
const withDefaultSession = rows => (rows||[]).map(s=>({...s,academic_session:s.academic_session||currentSession()}));
const stripSession = obj => {
  const copy = {...obj};
  delete copy.academic_session;
  return copy;
};
const missingExtendedTestColumns = error => /chapter_ids|chapter_names|duration_minutes/i.test(String(error?.message||''));
const stripExtendedTestColumns = obj => { const copy={...obj}; delete copy.chapter_ids; delete copy.chapter_names; delete copy.duration_minutes; return copy; };
const normalizeTest = t => t?.chapter ? {...t,chapter_no:t.chapter.chapter_no,chapter_name:t.chapter.title} : t;
const supaDB = {
  async listStudents(){
    const res = await supa.from('students').select(STUDENT_COLS).order('name');
    if(res.error && missingAcademicSession(res.error)){
      const legacy = await supa.from('students').select(STUDENT_COLS_LEGACY).order('name');
      return withDefaultSession(legacy.data);
    }
    return withDefaultSession(res.data);
  },
  async addStudent(s){
    const payload = {...s, centre_id:CENTRE_ID};
    let res = await supa.from('students').insert(payload).select(STUDENT_COLS).single();
    if(res.error && missingAcademicSession(res.error)){
      res = await supa.from('students').insert(stripSession(payload)).select(STUDENT_COLS_LEGACY).single();
      return res.data ? {...res.data,academic_session:s.academic_session||currentSession()} : null;
    }
    return res.data;
  },
  async updateStudent(id,patch){
    let res = await supa.from('students').update(patch).eq('id',id);
    if(res.error && missingAcademicSession(res.error)){
      res = await supa.from('students').update(stripSession(patch)).eq('id',id);
    }
    if(res.error) throw res.error;
  },
  async deleteStudent(id){ await supa.from('students').delete().eq('id',id); },
  async listChapters(cls,subject){ const {data}=await supa.from('chapters').select(CHAPTER_COLS).eq('class_level',cls).eq('subject',subject).order('chapter_no'); return data||[]; },
  async addChapter(ch){
    const title = normalizeText(ch.title);
    const existing = (await this.listChapters(ch.class_level,ch.subject)).find(c=>Number(c.chapter_no)===Number(ch.chapter_no) || normalizeText(c.title).toLowerCase()===title.toLowerCase());
    if(existing) return existing;
    const {data,error}=await supa.from('chapters').insert({...ch,title,centre_id:CENTRE_ID}).select(CHAPTER_COLS).single();
    if(error && String(error.message||'').toLowerCase().includes('duplicate')){
      return (await this.listChapters(ch.class_level,ch.subject)).find(c=>Number(c.chapter_no)===Number(ch.chapter_no) || normalizeText(c.title).toLowerCase()===title.toLowerCase());
    }
    if(error) throw error;
    return data;
  },
  async listTests(){
    let res=await supa.from('tests').select(TEST_COLS).order('test_date',{ascending:false});
    if(res.error && missingExtendedTestColumns(res.error)) res=await supa.from('tests').select(TEST_COLS_LEGACY).order('test_date',{ascending:false});
    return (res.data||[]).map(normalizeTest);
  },
  async addTest(t){
    let res=await supa.from('tests').insert({...t, centre_id:CENTRE_ID}).select(TEST_COLS).single();
    if(res.error && missingExtendedTestColumns(res.error)) res=await supa.from('tests').insert({...stripExtendedTestColumns(t), centre_id:CENTRE_ID}).select(TEST_COLS_LEGACY).single();
    const {data,error}=res;
    if(error) throw error;
    return normalizeTest(data);
  },
  async updateTest(id,patch){
    let res=await supa.from('tests').update(patch).eq('id',id).select(TEST_COLS).single();
    if(res.error && missingExtendedTestColumns(res.error)) res=await supa.from('tests').update(stripExtendedTestColumns(patch)).eq('id',id).select(TEST_COLS_LEGACY).single();
    const {data,error}=res;
    if(error) throw error;
    return normalizeTest(data);
  },
  async listResults(testId){ const {data}=await supa.from('results').select(RESULT_COLS).eq('test_id',testId); return data||[]; },
  async allResults(){ const {data}=await supa.from('results').select(RESULT_COLS); return data||[]; },
  async saveResults(testId,rows){
    const deleted = await supa.from('results').delete().eq('test_id',testId);
    if(deleted.error) throw deleted.error;
    const inserted = await supa.from('results').insert(rows.map(r=>({test_id:testId,...r})));
    if(inserted.error) throw inserted.error;
  },
  async addEditLogs(rows){ if(rows.length) await supa.from('test_result_edits').insert(rows.map(r=>({...r,centre_id:CENTRE_ID}))).select(EDIT_LOG_COLS); },
  async listTrainingEvents(){ const {data}=await supa.from('training_events').select(TRAINING_EVENT_COLS).order('event_date',{ascending:false}); return data||[]; },
  async addTrainingEvent(event){
    const {data,error}=await supa.from('training_events').insert({...event,centre_id:CENTRE_ID}).select(TRAINING_EVENT_COLS).single();
    if(error) throw error;
    return data;
  },
  async updateTrainingEvent(id,patch){
    const {data,error}=await supa.from('training_events').update(patch).eq('id',id).select(TRAINING_EVENT_COLS).single();
    if(error) throw error;
    return data;
  },
  async listTrainingParticipants(eventId){ const {data}=await supa.from('training_participants').select(TRAINING_PARTICIPANT_COLS).eq('event_id',eventId).order('sequence_no'); return data||[]; },
  async verifyTrainingCertificate(certificateId){
    const {data,error}=await supa.from('public_certificate_verifications')
      .select('certificate_id,name,school,verified_at,title,subtitle,event_date,duration_hours,organizer_name,signatory_1_name,signatory_1_title,signatory_2_name,signatory_2_title')
      .eq('certificate_id',certificateId)
      .maybeSingle();
    if(error) throw error;
    return data ? {
      certificate_id:data.certificate_id,
      name:data.name,
      school:data.school,
      verified_at:data.verified_at,
      event:{
        title:data.title,
        subtitle:data.subtitle,
        event_date:data.event_date,
        duration_hours:data.duration_hours,
        organizer_name:data.organizer_name,
        signatory_1_name:data.signatory_1_name,
        signatory_1_title:data.signatory_1_title,
        signatory_2_name:data.signatory_2_name,
        signatory_2_title:data.signatory_2_title
      }
    } : null;
  },
  async saveTrainingParticipants(eventId,rows){
    const deleted = await supa.from('training_participants').delete().eq('event_id',eventId);
    if(deleted.error) throw deleted.error;
    if(rows.length){
      const inserted = await supa.from('training_participants').insert(rows.map((r,i)=>({...r,event_id:eventId,centre_id:CENTRE_ID,sequence_no:i+1})));
      if(inserted.error) throw inserted.error;
    }
    return this.listTrainingParticipants(eventId);
  },
  async updateTrainingParticipant(id,patch){
    const {data,error}=await supa.from('training_participants').update(patch).eq('id',id).select(TRAINING_PARTICIPANT_COLS).single();
    if(error) throw error;
    return data;
  },
  async listTahTeachers(){ const {data,error}=await supa.from('tah_teachers').select(TAH_TEACHER_COLS).order('created_at',{ascending:false}); if(error) throw error; return data||[]; },
  async saveTahTeachers(rows){
    if(!rows.length) return this.listTahTeachers();
    const {error}=await supa.from('tah_teachers').upsert(rows.map(r=>({...r,centre_id:CENTRE_ID})),{onConflict:'mobile'});
    if(error) throw error;
    return this.listTahTeachers();
  },
  async updateTahTeacher(id,patch){
    const payload = {...patch};
    if(patch.prepared) payload.prepared_at = new Date().toISOString();
    if(patch.taught) payload.taught_at = new Date().toISOString();
    if(patch.loop_completed) payload.loop_completed_at = new Date().toISOString();
    const {data,error}=await supa.from('tah_teachers').update(payload).eq('id',id).select(TAH_TEACHER_COLS).single();
    if(error) throw error;
    return data;
  },
  async deleteTahTeacher(id){
    const {error}=await supa.from('tah_teachers').delete().eq('id',id);
    if(error) throw error;
  },
  async listTahTemplates(){
    const res = await supa.from('tah_message_templates').select(TAH_TEMPLATE_COLS).eq('active',true).order('day_key');
    if(res.error && String(res.error.message||'').toLowerCase().includes('image_url')){
      const fallback = await supa.from('tah_message_templates').select(TAH_TEMPLATE_COLS_LEGACY).eq('active',true).order('day_key');
      if(fallback.error) throw fallback.error;
      return (fallback.data||[]).map(t=>({...t,image_url:''}));
    }
    if(res.error) throw res.error;
    return res.data||[];
  },
  async updateTahTemplate(id,patch){
    const payload = {...patch,updated_at:new Date().toISOString()};
    const {data,error}=await supa.from('tah_message_templates').update(payload).eq('id',id).select(TAH_TEMPLATE_COLS).single();
    if(error && String(error.message||'').toLowerCase().includes('image_url')){
      if(!patch.image_url){
        const legacyPayload = {...payload};
        delete legacyPayload.image_url;
        const legacy = await supa.from('tah_message_templates').update(legacyPayload).eq('id',id).select(TAH_TEMPLATE_COLS_LEGACY).single();
        if(legacy.error) throw legacy.error;
        return {...legacy.data,image_url:''};
      }
      throw new Error('Run supabase/migrations/20260624_tah_template_image_url.sql first, then save the template again.');
    }
    if(error) throw error;
    return data;
  },
  async addTahMessageLog(log){
    const {data,error}=await supa.from('tah_message_logs').insert(log).select(TAH_LOG_COLS).single();
    if(error) throw error;
    return data;
  },
};

const DB = CONFIG.USE_SUPABASE ? supaDB : memoryDB;
const resultsCache = new Map();
async function cachedResults(testId){
  if(!resultsCache.has(testId)) resultsCache.set(testId, DB.listResults(testId));
  return await resultsCache.get(testId);
}
function invalidateResults(testId){ resultsCache.delete(testId); }
const LS_LAST_ENTRY = 'aveti:last-entry';
const LS_MARK_DRAFT = 'aveti:mark-draft';
const LS_PARENT_SENT = 'aveti:parent-cards-sent';
const LS_WHATSAPP_APP = 'aveti:whatsapp-app';
const readJSON = (key,fallback=null) => { try { return JSON.parse(localStorage.getItem(key)||'null') ?? fallback; } catch(e){ return fallback; } };
const writeJSON = (key,value) => localStorage.setItem(key, JSON.stringify(value));
const clearJSON = key => localStorage.removeItem(key);
const parentSentKey = (testId,studentId) => `${testId}:${studentId}`;
const parentCardWasSent = (testId,studentId) => !!readJSON(LS_PARENT_SENT,{})[parentSentKey(testId,studentId)];
const preferredWhatsAppApp = () => localStorage.getItem(LS_WHATSAPP_APP) || 'personal';
function updateSaveState(state,msg){
  const el=document.getElementById('saveState');
  const btn=document.getElementById('saveBtn');
  if(el) el.textContent=msg||'';
  if(btn){
    btn.disabled = state==='saving';
    btn.textContent = state==='saving' ? 'Saving...' : state==='failed' ? 'Retry save' : (EM.saveLabel || '✓ Save & generate reports');
  }
}
const fileSafe = s => normalizeText(String(s||'')).replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase() || 'report';
const csvCell = v => `"${String(v??'').replace(/"/g,'""')}"`;
const csvLine = row => row.map(csvCell).join(',');
const csvKey = s => normalizeText(s).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'');
function downloadBlob(filename,type,content){
  const blob = new Blob([content],{type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function csvDelimiter(text){
  const firstLine = String(text||'').split(/\r?\n/).find(line=>normalizeText(line)) || '';
  const counts = [',','\t',';'].map(delimiter=>({delimiter,count:(firstLine.match(new RegExp(delimiter==='\t'?'\\t':delimiter,'g'))||[]).length}));
  return counts.sort((a,b)=>b.count-a.count)[0]?.delimiter || ',';
}
function parseCSV(text){
  const delimiter = csvDelimiter(text);
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1];
    if(q){
      if(ch==='"' && next==='"'){ cell+='"'; i++; }
      else if(ch==='"') q=false;
      else cell+=ch;
    }else if(ch==='"') q=true;
    else if(ch===delimiter){ row.push(cell); cell=''; }
    else if(ch==='\n'){ row.push(cell); rows.push(row); row=[]; cell=''; }
    else if(ch==='\r'){}
    else cell+=ch;
  }
  row.push(cell); rows.push(row);
  return rows.filter(r=>r.some(c=>normalizeText(c)));
}
async function readCSVFile(file){
  const text = await file.text();
  const rows = parseCSV(text);
  if(rows.length<2) throw new Error('CSV must include a header row and at least one data row.');
  const headers = rows[0].map(csvKey);
  return rows.slice(1).map(r=>Object.fromEntries(headers.map((h,i)=>[h,normalizeText(r[i])]))).filter(o=>Object.values(o).some(Boolean));
}
const resultValue = r => r?.na ? 'N.A.' : r?.present===false ? 'Absent' : r?.marks??'';
function changedResultLogs(test, oldRows, newRows){
  const oldByStudent = new Map(oldRows.map(r=>[r.student_id,r]));
  const editedAt = new Date().toISOString();
  return newRows.map(n=>{
    const o = oldByStudent.get(n.student_id) || {};
    const changed = (o.marks??null)!==(n.marks??null) || !!o.present!==!!n.present || !!o.na!==!!n.na;
    return changed ? {
      test_id:test.id,
      student_id:n.student_id,
      edited_by:CURRENT_USER_ID,
      edited_at:editedAt,
      old_marks:o.marks??null,
      new_marks:n.marks??null,
      old_present:!!o.present,
      new_present:!!n.present,
      old_na:!!o.na,
      new_na:!!n.na
    } : null;
  }).filter(Boolean);
}
async function teacherReportData(testId){
  const test = (await DB.listTests()).find(t=>t.id===testId);
  if(!test) return null;
  const rs = await cachedResults(test.id);
  const students = await DB.listStudents();
  const rows = rs.map(r=>{
    const s = students.find(x=>x.id===r.student_id)||{};
    const p = (!r.na&&r.present&&r.marks!=null) ? pct(r.marks,test.full_marks) : null;
    return {student_id:r.student_id,name:s.name||'Student',marks:r.marks,present:!!r.present,na:!!r.na,p,grade:p==null?'':band(p),support:p!=null&&needsSupport(p)};
  });
  const ranked = rows.filter(r=>!r.na&&r.present&&r.p!=null).sort((a,b)=>b.p-a.p);
  const avg = ranked.length?Math.round(ranked.reduce((a,r)=>a+r.p,0)/ranked.length*10)/10:null;
  return {test,rows,ranked,avg,enrolled:rows.length,appeared:rows.filter(r=>!r.na&&r.present).length,absent:rows.filter(r=>!r.na&&!r.present).length,na:rows.filter(r=>r.na).length};
}
function pdfEscape(s){ return String(s??'').replace(/[^\x20-\x7E]/g,'?').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
function simplePdf(lines){
  const objects = [];
  const add = s => { objects.push(s); return objects.length; };
  const content = lines.map(l=>`BT /F1 ${l.size||10} Tf ${l.x||40} ${l.y} Td (${pdfEscape(l.text)}) Tj ET`).join('\n');
  const contentId = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  const fontId = add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);
  const pageId = add(`<< /Type /Page /Parent 4 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
  const pagesId = add(`<< /Type /Pages /Kids [${pageId} 0 R] /Count 1 >>`);
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let pdf='%PDF-1.4\n', offsets=[0];
  objects.forEach((o,i)=>{ offsets[i+1]=pdf.length; pdf+=`${i+1} 0 obj\n${o}\nendobj\n`; });
  const xref=pdf.length;
  pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach(o=>{ pdf+=String(o).padStart(10,'0')+' 00000 n \n'; });
  pdf+=`trailer << /Size ${objects.length+1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return pdf;
}
