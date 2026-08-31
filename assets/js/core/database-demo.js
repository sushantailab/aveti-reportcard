/* =============================================================
   DEMO DATA LAYER — in-memory store. Only used when USE_SUPABASE = false.

   Split out of database.js so it is never downloaded or parsed in the
   live (Supabase) deployment.

   To run in demo mode:
     1. set USE_SUPABASE = false in assets/js/config.js
     2. add this line to index.html, immediately AFTER the database.js <script>:
        <script defer src="assets/js/core/database-demo.js"></script>

   Depends on normalizeText() from database.js, so it must load after it.
   ============================================================= */
const uid = () => Math.random().toString(36).slice(2,10);

/* ---- Demo seed (used when USE_SUPABASE = false) ---- */
const demo = {
  students: [
    { id:'s1', name:'Saswat',     academic_session:'2026-27', class_level:9, section:'A', gender:'male',   date_of_birth:'2012-08-12', parent_name:'', parent_phone:'+919800000021' },
    { id:'s2', name:'Anshuman',   academic_session:'2026-27', class_level:9, section:'A', gender:'male',   date_of_birth:'2012-08-21', parent_name:'', parent_phone:'+919900000007' },
    { id:'s3', name:'Guruprasad', academic_session:'2026-27', class_level:9, section:'A', gender:'male',   date_of_birth:'2012-09-03', parent_name:'', parent_phone:'+919000000044' },
    { id:'s4', name:'Asman',      academic_session:'2026-27', class_level:9, section:'A', gender:'female', date_of_birth:'2012-09-18', parent_name:'', parent_phone:'' },
  ],
  schools: [
    {id:'school1',name:'DAV Public School',board:'CBSE'},
    {id:'school2',name:'OAV Bhubaneswar',board:'State Board'}
  ],
  student_school_enrolments: [
    {id:'en1',student_id:'s1',school_id:'school1',academic_session:'2026-27',class_level:9,section:'A'},
    {id:'en2',student_id:'s2',school_id:'school1',academic_session:'2026-27',class_level:9,section:'A'},
    {id:'en3',student_id:'s3',school_id:'school2',academic_session:'2026-27',class_level:9,section:'A'},
    {id:'en4',student_id:'s4',school_id:'school2',academic_session:'2026-27',class_level:9,section:'A'}
  ],
  school_exam_results: [],
  chapters: [
    { id:'c1', class_level:9, subject:'Hindi', chapter_no:1, title:'दो बैलों की कथा' },
    { id:'c2', class_level:9, subject:'Hindi', chapter_no:2, title:'क्या लिखूँ?' },
    { id:'c3', class_level:9, subject:'Hindi', chapter_no:3, title:'संवादहीन' },
    { id:'h5-1', class_level:5, subject:'Hindi', chapter_no:1, title:'किरन' },
    { id:'h5-2', class_level:5, subject:'Hindi', chapter_no:2, title:'न्याय की कुर्सी' },
    { id:'h5-3', class_level:5, subject:'Hindi', chapter_no:3, title:'चाँद का कुरता' },
    { id:'h5-4', class_level:5, subject:'Hindi', chapter_no:4, title:'साङकेन' },
    { id:'h5-5', class_level:5, subject:'Hindi', chapter_no:5, title:'सुंदरिया' },
    { id:'h5-6', class_level:5, subject:'Hindi', chapter_no:6, title:'चतुर चित्रकार' },
    { id:'h5-7', class_level:5, subject:'Hindi', chapter_no:7, title:'मेरा बचपन' },
    { id:'h5-8', class_level:5, subject:'Hindi', chapter_no:8, title:'काजीरंगा राष्ट्रीय उद्यान की यात्रा' },
    { id:'h5-9', class_level:5, subject:'Hindi', chapter_no:9, title:'न्याय' },
    { id:'h5-10', class_level:5, subject:'Hindi', chapter_no:10, title:'तीन मछलियाँ' },
    { id:'h5-11', class_level:5, subject:'Hindi', chapter_no:11, title:'हमारे ये कलामंदिर' },
    { id:'h5-12', class_level:5, subject:'Hindi', chapter_no:12, title:'गंगा की कहानी' },
    { id:'h6-1', class_level:6, subject:'Hindi', chapter_no:1, title:'मातृभूमि' },
    { id:'h6-2', class_level:6, subject:'Hindi', chapter_no:2, title:'गोल' },
    { id:'h6-3', class_level:6, subject:'Hindi', chapter_no:3, title:'पहली बूँद' },
    { id:'h6-4', class_level:6, subject:'Hindi', chapter_no:4, title:'हार की जीत' },
    { id:'h6-5', class_level:6, subject:'Hindi', chapter_no:5, title:'रहीम के दोहे' },
    { id:'h6-6', class_level:6, subject:'Hindi', chapter_no:6, title:'मेरी माँ' },
    { id:'h6-7', class_level:6, subject:'Hindi', chapter_no:7, title:'जलाते चलो' },
    { id:'h6-8', class_level:6, subject:'Hindi', chapter_no:8, title:'सत्रिया और बिहू नृत्य' },
    { id:'h6-9', class_level:6, subject:'Hindi', chapter_no:9, title:'मैया मैं नहिं माखन खायो' },
    { id:'h6-10', class_level:6, subject:'Hindi', chapter_no:10, title:'परीक्षा' },
    { id:'h6-11', class_level:6, subject:'Hindi', chapter_no:11, title:'चेतक की वीरता' },
    { id:'h6-12', class_level:6, subject:'Hindi', chapter_no:12, title:'हिंद महासागर में छोटा-सा हिंदुस्तान' },
    { id:'h6-13', class_level:6, subject:'Hindi', chapter_no:13, title:'पेड़ की बात' },
    { id:'h7-1', class_level:7, subject:'Hindi', chapter_no:1, title:'माँ, कह एक कहानी' },
    { id:'h7-2', class_level:7, subject:'Hindi', chapter_no:2, title:'तीन बुद्धिमान' },
    { id:'h7-3', class_level:7, subject:'Hindi', chapter_no:3, title:'फूल और काँटा' },
    { id:'h7-4', class_level:7, subject:'Hindi', chapter_no:4, title:'पानी रे पानी' },
    { id:'h7-5', class_level:7, subject:'Hindi', chapter_no:5, title:'नहीं होना बीमार' },
    { id:'h7-6', class_level:7, subject:'Hindi', chapter_no:6, title:'गिरिधर कविराय की कुंडलिया' },
    { id:'h7-7', class_level:7, subject:'Hindi', chapter_no:7, title:'वर्षा-बहार' },
    { id:'h7-8', class_level:7, subject:'Hindi', chapter_no:8, title:'बिरजू महाराज से साक्षात्कार' },
    { id:'h7-9', class_level:7, subject:'Hindi', chapter_no:9, title:'चिड़िया' },
    { id:'h7-10', class_level:7, subject:'Hindi', chapter_no:10, title:'मीरा के पद' },
    { id:'h8-1', class_level:8, subject:'Hindi', chapter_no:1, title:'स्वदेश' },
    { id:'h8-2', class_level:8, subject:'Hindi', chapter_no:2, title:'दो गौरैया' },
    { id:'h8-3', class_level:8, subject:'Hindi', chapter_no:3, title:'एक आशीर्वाद' },
    { id:'h8-4', class_level:8, subject:'Hindi', chapter_no:4, title:'हरिद्वार' },
    { id:'h8-5', class_level:8, subject:'Hindi', chapter_no:5, title:'कबीर के दोहे' },
    { id:'h8-6', class_level:8, subject:'Hindi', chapter_no:6, title:'एक टोकरी भर मिट्टी' },
    { id:'h8-7', class_level:8, subject:'Hindi', chapter_no:7, title:'मत बाँधो' },
    { id:'h8-8', class_level:8, subject:'Hindi', chapter_no:8, title:'नए मेहमान' },
    { id:'h8-9', class_level:8, subject:'Hindi', chapter_no:9, title:'आदमी का अनुपात' },
    { id:'h8-10', class_level:8, subject:'Hindi', chapter_no:10, title:'तरुण के स्वप्न' },
    { id:'h9-4', class_level:9, subject:'Hindi', chapter_no:4, title:'ऐसी भी बातें होती हैं (लता मंगेशकर से साक्षात्कार)' },
    { id:'h9-5', class_level:9, subject:'Hindi', chapter_no:5, title:'आखिरी चट्टान तक' },
    { id:'h9-6', class_level:9, subject:'Hindi', chapter_no:6, title:'रीढ़ की हड्डी' },
    { id:'h9-7', class_level:9, subject:'Hindi', chapter_no:7, title:'मैं और मेरा देश' },
    { id:'h9-8', class_level:9, subject:'Hindi', chapter_no:8, title:'पद' },
    { id:'h9-9', class_level:9, subject:'Hindi', chapter_no:9, title:'राम-लक्ष्मण-परशुराम संवाद' },
    { id:'h9-10', class_level:9, subject:'Hindi', chapter_no:10, title:'भारति, जय, विजय करे!' },
    { id:'h9-11', class_level:9, subject:'Hindi', chapter_no:11, title:'झाँसी की रानी' },
    { id:'h9-12', class_level:9, subject:'Hindi', chapter_no:12, title:'घर की याद' },
    { id:'c4', class_level:9, subject:'Social Science', chapter_no:1, title:'Demo Civics 1' },
    { id:'c5', class_level:9, subject:'Social Science', chapter_no:2, title:'Demo Geography 2' },
    { id:'c6', class_level:9, subject:'Social Science', chapter_no:3, title:'Demo History 3' },
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
    { id:'t2', class_level:9, section:'A', subject:'Hindi', chapter_id:'c2', chapter_no:2, chapter_name:'क्या लिखूँ?',   test_type:'CET', full_marks:20, test_date:'2026-04-24' },
    { id:'t3', class_level:9, section:'A', subject:'Hindi', chapter_id:'c3', chapter_no:3, chapter_name:'संवादहीन',     test_type:'CET', full_marks:25, test_date:'2026-05-12' },
    { id:'t4', class_level:9, section:'A', subject:'Social Science', chapter_id:'c4', chapter_no:1, chapter_name:'Demo Civics 1', test_type:'CET', full_marks:25, test_date:'2026-05-20' },
    { id:'t5', class_level:9, section:'A', subject:'Social Science', chapter_id:'c5', chapter_no:2, chapter_name:'Demo Geography 2', test_type:'CET', full_marks:25, test_date:'2026-05-28' },
    { id:'t6', class_level:9, section:'A', subject:'Social Science', chapter_id:'c6', chapter_no:3, chapter_name:'Demo History 3', test_type:'CET', full_marks:25, test_date:'2026-06-04' },
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
      organizer_name:'AVETI LEARNING TUITION CENTER',
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
    {id:'tah1',name:'Priya Sharma',mobile:'9876543210',email:'priya@example.com',gender:'female',date_of_birth:'1990-08-15',class_levels:[7,8],subjects:['Science','Social Science','Social Science II'],school_name:'DAV Public School',class_level:'7, 8',subject:'Science, Social Science, Social Science II',board:'CBSE',language:'en',enrollment_date:'2026-06-23',journey_day:2,prepared:true,taught:false,loop_completed:false,nps_score:null,feedback_sentiment:null,status:'preparing',rated:false,referrals_sent:0,referral_conversions:0,referral_code:'priya01',testimonial_consent:false,testimonial_sent:false,opted_out:false},
    {id:'tah2',name:'Rakesh Kumar',mobile:'9123456789',email:'rakesh@example.com',gender:'male',date_of_birth:'1988-09-02',class_levels:[6,7,8],subjects:['Mathematics','Mathematics II'],school_name:'OAV Bhubaneswar',class_level:'6, 7, 8',subject:'Mathematics, Mathematics II',board:'Odisha Board',language:'od',enrollment_date:'2026-06-23',journey_day:8,prepared:true,taught:true,loop_completed:true,nps_score:9,feedback_sentiment:'promoter',status:'activated',rated:false,referrals_sent:0,referral_conversions:0,referral_code:'rakesh01',testimonial_consent:true,testimonial_sent:false,opted_out:false}
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

const chapterKey = (cls,subject,title) => [cls, subject, normalizeText(title).toLowerCase()].join('|');
function attachChapter(t){
  const ch = t.chapter || demo.chapters?.find(c=>c.id===t.chapter_id);
  return ch ? {...t, chapter:ch, chapter_no:ch.chapter_no, chapter_name:ch.title} : t;
}

const memoryDB = {
  async listStudents(){ return demo.students.filter(s=>!s.archived_at).sort((a,b)=>a.name.localeCompare(b.name)); },
  async addStudent(s){ const r={id:uid(),...s}; demo.students.push(r); return r; },
  async updateStudent(id,patch){ Object.assign(demo.students.find(x=>x.id===id),patch); },
  async archiveStudent(id){ const s=demo.students.find(x=>x.id===id); if(s) s.archived_at=new Date().toISOString(); },
  async deleteStudent(id){ demo.students = demo.students.filter(x=>x.id!==id); demo.results = demo.results.filter(r=>r.student_id!==id); },
  async listSchools(){ return demo.schools.filter(s=>!s.archived_at).sort((a,b)=>(a.name||'').localeCompare(b.name||'')); },
  async createSchool(payload){ const name=String(payload.school_name||payload.name||'').trim(); const existing=demo.schools.find(s=>(s.name||'').toLowerCase()===name.toLowerCase()); if(existing) return existing; const r={id:uid(),name,school_name:name,city:payload.city||'',is_active:true,...payload}; demo.schools.push(r); return r; },
  async updateSchool(id,patch){ const s=demo.schools.find(x=>x.id===id); if(s) Object.assign(s,patch,{updated_at:new Date().toISOString()}); return s; },
  async archiveSchool(id){ const s=demo.schools.find(x=>x.id===id); if(s) s.archived_at=new Date().toISOString(); },
  async listStudentSchoolEnrolments(session){ return demo.student_school_enrolments.filter(e=>!session||e.academic_session===session).map(e=>({...e,school:demo.schools.find(s=>s.id===e.school_id)||null})); },
  async saveStudentSchoolEnrolment(row){ const old=demo.student_school_enrolments.find(e=>e.student_id===row.student_id&&e.academic_session===row.academic_session); if(old) Object.assign(old,row); else demo.student_school_enrolments.push({id:uid(),...row}); return row; },
  async removeStudentSchoolEnrolment(studentId,session){ demo.student_school_enrolments=demo.student_school_enrolments.filter(e=>!(e.student_id===studentId&&e.academic_session===session)); },
  async listSchoolResults(filters={}){ return demo.school_exam_results.filter(r=>(!filters.student_id||r.student_id===filters.student_id)&&(!filters.academic_session||r.academic_session===filters.academic_session)&&(!filters.subject||r.subject===filters.subject)&&(!filters.exam_type||r.exam_type===filters.exam_type)&&(!filters.school_exam_date||r.school_exam_date===filters.school_exam_date)); },
  async loadSchoolResults(filters={}){ return this.listSchoolResults(filters); },
  async saveSchoolExamResults(rows){ rows.forEach(row=>{ const full=Number(row.full_marks), marks=row.marks_obtained===''||row.marks_obtained==null?null:Number(row.marks_obtained); if(!Number.isFinite(full)||full<=0) throw new Error('Full marks must be greater than zero.'); if(row.result_status==='scored'&&(!Number.isFinite(marks)||marks<0||marks>full)) throw new Error('Marks must be between zero and full marks.'); const clean={...row,marks_obtained:row.result_status==='scored'?marks:null,full_marks:full,percentage:row.result_status==='scored'?Math.round(marks/full*1000)/10:null}; const old=demo.school_exam_results.find(r=>r.student_id===row.student_id&&r.academic_session===row.academic_session&&r.subject===row.subject&&r.exam_type===row.exam_type&&r.school_exam_date===row.school_exam_date); if(old) Object.assign(old,clean,{updated_at:new Date().toISOString()}); else demo.school_exam_results.push({id:uid(),...clean,created_at:new Date().toISOString()}); }); return rows; },
  async updateSchoolResult(id,patch){ const r=demo.school_exam_results.find(x=>x.id===id); if(r) Object.assign(r,patch); return r; },
  async deleteSchoolResult(id){ demo.school_exam_results=demo.school_exam_results.filter(r=>r.id!==id); },
  async getStudentSchoolComparison(studentId,filters={}){ const schoolRows=await this.listSchoolResults({student_id:studentId,academic_session:filters.academic_session||currentSession(),subject:filters.subject}); const enrolment=(await this.listStudentSchoolEnrolments(filters.academic_session||currentSession())).find(e=>e.student_id===studentId); const tests=await this.listTests(); const results=await this.allResults(); const out=[]; for(const row of schoolRows){ const candidates=tests.filter(t=>t.subject===row.subject&&new Date(t.test_date)<=new Date(row.school_exam_date)).map(t=>{const r=results.find(x=>x.test_id===t.id&&x.student_id===studentId&&x.present&&!x.na&&x.marks!=null); return r?{t,r}:null}).filter(Boolean).sort((a,b)=>new Date(b.t.test_date)-new Date(a.t.test_date)); const aveti=candidates[0]?Math.round(candidates[0].r.marks/candidates[0].t.full_marks*1000)/10:null; out.push({...row,school:enrolment?.school||null,school_percentage:row.percentage,aveti_percentage:aveti,difference:aveti==null||row.percentage==null?null:Math.round((aveti-row.percentage)*10)/10,exam:row.exam_type}); } return out.sort((a,b)=>new Date(a.school_exam_date)-new Date(b.school_exam_date)); },
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
  async saveResults(testId,rows){
    rows.forEach(row=>{
      const existing=demo.results.find(r=>r.test_id===testId&&r.student_id===row.student_id);
      if(existing) Object.assign(existing,row);
      else demo.results.push({id:uid(),test_id:testId,...row});
    });
  },
  async deleteResults(testId,studentIds){ demo.results=demo.results.filter(r=>r.test_id!==testId||!studentIds.includes(r.student_id)); },
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
  async listTahTeachers(){ return demo.tah_teachers.filter(t=>!t.archived_at).sort((a,b)=>a.name.localeCompare(b.name)); },
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
  async archiveTahTeacher(id){
    const teacher=demo.tah_teachers.find(t=>t.id===id);
    if(teacher) teacher.archived_at=new Date().toISOString();
  },
  async listTahTemplates(){ return [...demo.tah_message_templates]; },
  async updateTahTemplate(id,patch){
    const t=demo.tah_message_templates.find(x=>x.id===id);
    Object.assign(t,patch,{updated_at:new Date().toISOString()});
    return t;
  },
  async addTahMessageLog(log){ const r={id:uid(),created_at:new Date().toISOString(),sent_at:new Date().toISOString(),...log}; demo.tah_message_logs.push(r); return r; },
  async listAccessibleCentres(){ return [{id:'demo-centre',name:'Aveti Learning Tuition Center',address:'',phone:'',email:'',centre_head_name:'',logo_url:'',status:'active',archived_at:null,role:'master_admin'}]; },
  async createCentre(payload){ return {id:uid(),...payload,status:'active',archived_at:null}; },
  async updateCentre(id,patch){ return {id,...patch}; },
  async deleteCentre(id){ return {id}; },
  async createCentreAdminLogin(){ return {success:true}; },
  async listCentreLogins(){ return []; },
  async listAllCentreLogins(){ return {}; },
  async setCentreLoginStatus(){ return {success:true}; },
};

window.memoryDB = memoryDB;
