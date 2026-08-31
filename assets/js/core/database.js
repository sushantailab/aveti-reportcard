/* =============================================================
   DATA LAYER — Supabase-backed store.

   The in-memory demo store (USE_SUPABASE = false) lives in the separate
   database-demo.js, which is only loaded in demo mode. See that file's
   header for how to enable it.
   ============================================================= */
let supa = null;
if (CONFIG.USE_SUPABASE) {
  supa = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
}

/* Shared text helper — used across the app and by both data layers. */
const normalizeText = s => (s||'').trim().replace(/\s+/g,' ');

/* Supabase-backed DB (active when USE_SUPABASE = true). Same method names. */
let CENTRE_ID = null;   // set after login by ensureCentre()
let CURRENT_USER_ID = 'demo-user';
let ACCESS_ROLE = 'centre_admin';
let ACCESS_CENTRES = [];
const STUDENT_COLS = 'id,name,academic_session,class_level,section,gender,date_of_birth,optional_subject,parent_name,parent_phone,centre_id';
const STUDENT_COLS_LEGACY = 'id,name,class_level,section,gender,date_of_birth,optional_subject,parent_name,parent_phone,centre_id';
const CHAPTER_COLS = 'id,centre_id,class_level,subject,chapter_no,title,created_at';
const TEST_COLS = 'id,centre_id,class_level,section,subject,teacher_id,teacher:teacher_id(id,centre_id,name,mobile,gender,opted_out),chapter_id,chapter_ids,chapter_no,chapter_name,chapter_names,test_type,full_marks,duration_minutes,test_date,chapter:chapter_id(id,centre_id,class_level,subject,chapter_no,title)';
const TEST_COLS_LEGACY = 'id,centre_id,class_level,section,subject,chapter_id,chapter_no,chapter_name,test_type,full_marks,test_date,chapter:chapter_id(id,centre_id,class_level,subject,chapter_no,title)';
const RESULT_COLS = 'id,test_id,student_id,marks,present,na';
const EDIT_LOG_COLS = 'id,centre_id,test_id,student_id,edited_by,edited_at,old_marks,new_marks,old_present,new_present,old_na,new_na';
const TRAINING_EVENT_COLS = 'id,centre_id,title,subtitle,event_date,duration_hours,organizer_name,focus_points,certificate_prefix,signatory_1_name,signatory_1_title,signatory_2_name,signatory_2_title,created_at';
const TRAINING_PARTICIPANT_COLS = 'id,centre_id,event_id,sequence_no,certificate_id,name,phone,whatsapp,email,school,certificate_url,whatsapp_sent_at,email_sent_at,verified_at,created_at';
const TAH_TEACHER_COLS = 'id,centre_id,name,mobile,email,gender,date_of_birth,class_levels,subjects,school_name,class_level,subject,board,language,enrollment_date,journey_day,prepared,prepared_at,taught,taught_at,loop_completed,loop_completed_at,nps_score,feedback_sentiment,status,rated,rated_at,referrals_sent,referral_conversions,referred_by,referral_code,testimonial_consent,testimonial_sent,opted_out,archived_at,created_at,updated_at';
const TAH_TEACHER_MIN_COLS = 'id,centre_id,name,mobile,opted_out,archived_at,created_at,updated_at';
const TAH_TEMPLATE_COLS = 'id,day_key,language,category,app_target,title,body,video_url,image_url,active,created_at,updated_at';
const TAH_TEMPLATE_COLS_LEGACY = 'id,day_key,language,category,app_target,title,body,video_url,active,created_at,updated_at';
const TAH_LOG_COLS = 'id,teacher_id,template_id,day_key,language,channel,status,rendered_body,reply_text,sent_at,delivered_at,replied_at,sent_by,created_at';
const SCHOOL_COLS = 'id,centre_id,school_name,city,is_active,archived_at,created_at,updated_at';
const SCHOOL_COLS_LEGACY = 'id,centre_id,name,board,archived_at,created_at,updated_at';
const SCHOOL_ENROLMENT_COLS = 'id,centre_id,student_id,school_id,academic_session,class_level,section,created_at,updated_at,school:school_id(id,centre_id,name,board)';
const SCHOOL_RESULT_COLS = 'id,centre_id,student_id,academic_session,subject,exam_type,school_exam_date,marks_obtained,full_marks,percentage,result_status,entered_by,created_at,updated_at';
const CENTRE_COLS = 'id,name,address,phone,email,centre_head_name,logo_url,band_config,status,archived_at,owner_user_id';
const missingAcademicSession = error => String(error?.message||'').toLowerCase().includes('academic_session');
const missingBirthdayColumn = error => /date_of_birth|column .* does not exist/i.test(String(error?.message||''));
const missingTahTeacherProfileColumn = error => /date_of_birth|email|gender|class_levels|subjects|column .* does not exist/i.test(String(error?.message||''));
const missingSchoolColumn = error => /school_id|school_name|city|is_active/i.test(String(error?.message||''));
const missingSchoolMasterColumns = error => /school_name|city|is_active/i.test(String(error?.message||''));
const withDefaultSession = rows => (rows||[]).map(s=>({...s,academic_session:s.academic_session||currentSession()}));
const stripSession = obj => {
  const copy = {...obj};
  delete copy.academic_session;
  return copy;
};
const stripBirthday = obj => { const copy={...obj}; delete copy.date_of_birth; return copy; };
const stripTahTeacherProfile = obj => {
  const copy = {...obj};
  delete copy.email;
  delete copy.gender;
  delete copy.date_of_birth;
  delete copy.class_levels;
  delete copy.subjects;
  return copy;
};
const stripSchoolId = obj => { const copy={...obj}; delete copy.school_id; return copy; };
const stripUnsupportedStudentColumns = (error,obj) => {
  let copy = {...obj};
  if(missingSchoolColumn(error)) copy = stripSchoolId(copy);
  if(missingBirthdayColumn(error)) copy = stripBirthday(copy);
  if(missingAcademicSession(error)) copy = stripSession(copy);
  return copy;
};
const normalizeSchool = s => s ? {...s,name:s.name||s.school_name} : s;
const missingExtendedTestColumns = error => /chapter_ids|chapter_names|duration_minutes/i.test(String(error?.message||''));
const missingMultiChapterColumns = error => /chapter_ids|chapter_names/i.test(String(error?.message||''));
const missingTeacherColumn = error => /teacher_id|relationship.*teacher|tah_teachers/i.test(String(error?.message||''));
const stripExtendedTestColumns = obj => { const copy={...obj}; delete copy.chapter_ids; delete copy.chapter_names; delete copy.duration_minutes; return copy; };
const stripTeacherColumn = obj => { const copy={...obj}; delete copy.teacher_id; return copy; };
const normalizeTest = t => t?.chapter ? {...t,chapter_no:t.chapter.chapter_no,chapter_name:t.chapter.title} : t;
const supaDB = {
  async listStudents(){
    const res = await supa.from('students').select(STUDENT_COLS).eq('centre_id',CENTRE_ID).is('archived_at',null).order('name');
    if(res.error && (missingAcademicSession(res.error) || missingBirthdayColumn(res.error) || missingSchoolColumn(res.error))){
      const cols = missingBirthdayColumn(res.error) ? STUDENT_COLS_LEGACY.replace(',date_of_birth','') : STUDENT_COLS_LEGACY;
      const legacy = await supa.from('students').select(cols).eq('centre_id',CENTRE_ID).is('archived_at',null).order('name');
      return withDefaultSession(legacy.data);
    }
    return withDefaultSession(res.data);
  },
  async addStudent(s){
    const payload = stripSchoolId({...s, centre_id:CENTRE_ID});
    let res = await supa.from('students').insert(payload).select(STUDENT_COLS).single();
    if(res.error && (missingAcademicSession(res.error) || missingBirthdayColumn(res.error) || missingSchoolColumn(res.error))){
      const legacyPayload = stripUnsupportedStudentColumns(res.error,payload);
      const cols = missingBirthdayColumn(res.error) ? STUDENT_COLS_LEGACY.replace(',date_of_birth','') : STUDENT_COLS_LEGACY;
      res = await supa.from('students').insert(legacyPayload).select(cols).single();
      if(res.error) throw res.error;
      return res.data ? {...res.data,academic_session:s.academic_session||currentSession()} : null;
    }
    if(res.error) throw res.error;
    return res.data;
  },
  async updateStudent(id,patch){
    let res = await supa.from('students').update(stripSchoolId(patch)).eq('id',id);
    if(res.error && (missingAcademicSession(res.error) || missingBirthdayColumn(res.error) || missingSchoolColumn(res.error))){
      res = await supa.from('students').update(stripUnsupportedStudentColumns(res.error,patch)).eq('id',id);
    }
    if(res.error) throw res.error;
  },
  async archiveStudent(id){
    const {error}=await supa.from('students').update({archived_at:new Date().toISOString()}).eq('id',id);
    if(error) throw error;
  },
  async deleteStudent(id){ const {error}=await supa.from('students').delete().eq('id',id); if(error) throw error; },
  async listSchools(){
    let res=await supa.from('schools').select(SCHOOL_COLS).eq('centre_id',CENTRE_ID).is('archived_at',null).eq('is_active',true).order('school_name');
    if(res.error&&missingSchoolMasterColumns(res.error)) res=await supa.from('schools').select(SCHOOL_COLS_LEGACY).eq('centre_id',CENTRE_ID).is('archived_at',null).order('name');
    if(res.error) throw res.error;
    return (res.data||[]).map(normalizeSchool);
  },
  async createSchool(payload){
    const name=String(payload.school_name||payload.name||'').trim();
    let res=await supa.from('schools').insert({name,school_name:name,board:payload.board||null,city:payload.city||null,is_active:true,centre_id:CENTRE_ID}).select(SCHOOL_COLS).single();
    if(res.error&&missingSchoolMasterColumns(res.error)) res=await supa.from('schools').insert({name,board:payload.board||null,centre_id:CENTRE_ID}).select(SCHOOL_COLS_LEGACY).single();
    if(res.error) throw res.error;
    return normalizeSchool(res.data);
  },
  async updateSchool(id,patch){ const clean={...patch}; if(clean.name&&!clean.school_name){clean.school_name=clean.name;delete clean.name;} const {data,error}=await supa.from('schools').update(clean).eq('id',id).eq('centre_id',CENTRE_ID).select(SCHOOL_COLS).single(); if(error) throw error; return normalizeSchool(data); },
  async archiveSchool(id){ const {error}=await supa.from('schools').update({archived_at:new Date().toISOString()}).eq('id',id).eq('centre_id',CENTRE_ID); if(error) throw error; },
  async listStudentSchoolEnrolments(session){ let q=supa.from('student_school_enrolments').select(SCHOOL_ENROLMENT_COLS).eq('centre_id',CENTRE_ID); if(session) q=q.eq('academic_session',session); const {data,error}=await q; if(error) throw error; return data||[]; },
  async saveStudentSchoolEnrolment(row){ const {data,error}=await supa.from('student_school_enrolments').upsert({...row,centre_id:CENTRE_ID},{onConflict:'student_id,academic_session'}).select(SCHOOL_ENROLMENT_COLS).single(); if(error) throw error; return data; },
  async removeStudentSchoolEnrolment(studentId,session){ const {error}=await supa.from('student_school_enrolments').delete().eq('centre_id',CENTRE_ID).eq('student_id',studentId).eq('academic_session',session); if(error) throw error; },
  async listSchoolResults(filters={}){ let q=supa.from('school_exam_results').select(SCHOOL_RESULT_COLS).eq('centre_id',CENTRE_ID); ['student_id','academic_session','subject','exam_type','school_exam_date'].forEach(k=>{if(filters[k]) q=q.eq(k,filters[k]);}); const {data,error}=await q.order('school_exam_date'); if(error) throw error; return data||[]; },
  async loadSchoolResults(filters={}){ return this.listSchoolResults(filters); },
  async saveSchoolExamResults(rows){ const payload=rows.map(row=>{const full=Number(row.full_marks), marks=row.marks_obtained===''||row.marks_obtained==null?null:Number(row.marks_obtained); if(!Number.isFinite(full)||full<=0) throw new Error('Full marks must be greater than zero.'); if(row.result_status==='scored'&&(!Number.isFinite(marks)||marks<0||marks>full)) throw new Error('Marks must be between zero and full marks.'); const clean={...row,centre_id:CENTRE_ID,entered_by:CURRENT_USER_ID,marks_obtained:row.result_status==='scored'?marks:null,full_marks:full}; delete clean.percentage; if(!clean.id) delete clean.id; return clean;}); const {data,error}=await supa.from('school_exam_results').upsert(payload,{onConflict:'student_id,academic_session,subject,exam_type,school_exam_date'}).select(SCHOOL_RESULT_COLS); if(error) throw error; return data||[]; },
  async updateSchoolResult(id,patch){ const clean={...patch}; delete clean.percentage; const {data,error}=await supa.from('school_exam_results').update(clean).eq('id',id).eq('centre_id',CENTRE_ID).select(SCHOOL_RESULT_COLS).single(); if(error) throw error; return data; },
  async deleteSchoolResult(id){ const {error}=await supa.from('school_exam_results').delete().eq('id',id).eq('centre_id',CENTRE_ID); if(error) throw error; },
  async getStudentSchoolComparison(studentId,filters={}){ const rows=await this.listSchoolResults({student_id:studentId,academic_session:filters.academic_session||currentSession(),subject:filters.subject}); const enrolment=(await this.listStudentSchoolEnrolments(filters.academic_session||currentSession())).find(e=>e.student_id===studentId); const tests=await this.listTests(); const results=await this.allResults(); return rows.map(row=>{const candidates=tests.filter(t=>t.subject===row.subject&&new Date(t.test_date)<=new Date(row.school_exam_date)).map(t=>{const r=results.find(x=>x.test_id===t.id&&x.student_id===studentId&&x.present&&!x.na&&x.marks!=null); return r?{t,r}:null}).filter(Boolean).sort((a,b)=>new Date(b.t.test_date)-new Date(a.t.test_date)); const aveti=candidates[0]?Math.round(candidates[0].r.marks/candidates[0].t.full_marks*1000)/10:null; return {...row,school:enrolment?.school||null,school_percentage:row.percentage,aveti_percentage:aveti,difference:aveti==null||row.percentage==null?null:Math.round((aveti-row.percentage)*10)/10,exam:row.exam_type};}).sort((a,b)=>new Date(a.school_exam_date)-new Date(b.school_exam_date)); },
  async listChapters(cls,subject){ const {data}=await supa.from('chapters').select(CHAPTER_COLS).eq('centre_id',CENTRE_ID).eq('class_level',cls).eq('subject',subject).order('chapter_no'); return data||[]; },
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
    let res=await supa.from('tests').select(TEST_COLS).eq('centre_id',CENTRE_ID).order('test_date',{ascending:false});
    if(res.error && missingTeacherColumn(res.error)) res=await supa.from('tests').select(TEST_COLS_LEGACY).eq('centre_id',CENTRE_ID).order('test_date',{ascending:false});
    if(res.error && missingExtendedTestColumns(res.error)) res=await supa.from('tests').select(TEST_COLS_LEGACY).eq('centre_id',CENTRE_ID).order('test_date',{ascending:false});
    return (res.data||[]).map(normalizeTest);
  },
  async addTest(t){
    let res=await supa.from('tests').insert({...t, centre_id:CENTRE_ID}).select(TEST_COLS).single();
    if(res.error && missingTeacherColumn(res.error)) res=await supa.from('tests').insert({...stripTeacherColumn(t), centre_id:CENTRE_ID}).select(TEST_COLS_LEGACY).single();
    if(res.error && missingMultiChapterColumns(res.error)) throw new Error('Multi-chapter saving is not available in this database yet. Refresh and try again after the update finishes.');
    if(res.error && missingExtendedTestColumns(res.error)) res=await supa.from('tests').insert({...stripExtendedTestColumns(t), centre_id:CENTRE_ID}).select(TEST_COLS_LEGACY).single();
    const {data,error}=res;
    if(error) throw error;
    return normalizeTest(data);
  },
  async updateTest(id,patch){
    let res=await supa.from('tests').update(patch).eq('id',id).select(TEST_COLS).single();
    if(res.error && missingTeacherColumn(res.error)) res=await supa.from('tests').update(stripTeacherColumn(patch)).eq('id',id).select(TEST_COLS_LEGACY).single();
    if(res.error && missingMultiChapterColumns(res.error)) throw new Error('Multi-chapter saving is not available in this database yet. Refresh and try again after the update finishes.');
    if(res.error && missingExtendedTestColumns(res.error)) res=await supa.from('tests').update(stripExtendedTestColumns(patch)).eq('id',id).select(TEST_COLS_LEGACY).single();
    const {data,error}=res;
    if(error) throw error;
    return normalizeTest(data);
  },
  async listResults(testId){ const {data}=await supa.from('results').select(RESULT_COLS).eq('test_id',testId); return data||[]; },
  async allResults(){ const testIds=(await this.listTests()).map(t=>t.id); if(!testIds.length) return []; const {data}=await supa.from('results').select(RESULT_COLS).in('test_id',testIds); return data||[]; },
  async saveResults(testId,rows){
    // Centre Admins are archive-only, so they cannot delete existing result rows.
    // Upsert safely creates a first mark entry or updates the same student's saved mark.
    const saved = await supa.from('results').upsert(rows.map(r=>({test_id:testId,...r})),{onConflict:'test_id,student_id'});
    if(saved.error) throw saved.error;
  },
  async deleteResults(testId,studentIds){
    if(!studentIds?.length) return;
    const {error}=await supa.from('results').delete().eq('test_id',testId).in('student_id',studentIds);
    if(error) throw error;
  },
  async addEditLogs(rows){ if(rows.length) await supa.from('test_result_edits').insert(rows.map(r=>({...r,centre_id:CENTRE_ID}))).select(EDIT_LOG_COLS); },
  async listTrainingEvents(){ const {data}=await supa.from('training_events').select(TRAINING_EVENT_COLS).eq('centre_id',CENTRE_ID).order('event_date',{ascending:false}); return data||[]; },
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
  async listTrainingParticipants(eventId){ const {data}=await supa.from('training_participants').select(TRAINING_PARTICIPANT_COLS).eq('centre_id',CENTRE_ID).eq('event_id',eventId).order('sequence_no'); return data||[]; },
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
  async listTahTeachers(){
    let res=await supa.from('tah_teachers').select(TAH_TEACHER_COLS).eq('centre_id',CENTRE_ID).is('archived_at',null).order('name');
    if(res.error && missingTahTeacherProfileColumn(res.error)) res=await supa.from('tah_teachers').select(TAH_TEACHER_MIN_COLS).eq('centre_id',CENTRE_ID).is('archived_at',null).order('name');
    if(res.error) throw res.error;
    return res.data||[];
  },
  async saveTahTeachers(rows){
    if(!rows.length) return this.listTahTeachers();
    const payload=rows.map(r=>({...r,centre_id:CENTRE_ID}));
    let {error}=await supa.from('tah_teachers').upsert(payload,{onConflict:'mobile'});
    if(error && missingTahTeacherProfileColumn(error)){ ({error}=await supa.from('tah_teachers').upsert(payload.map(stripTahTeacherProfile),{onConflict:'mobile'})); }
    if(error) throw error;
    return this.listTahTeachers();
  },
  async updateTahTeacher(id,patch){
    const payload = {...patch};
    if(patch.prepared) payload.prepared_at = new Date().toISOString();
    if(patch.taught) payload.taught_at = new Date().toISOString();
    if(patch.loop_completed) payload.loop_completed_at = new Date().toISOString();
    let {data,error}=await supa.from('tah_teachers').update(payload).eq('id',id).select(TAH_TEACHER_COLS).single();
    if(error && missingTahTeacherProfileColumn(error)){ ({data,error}=await supa.from('tah_teachers').update(stripTahTeacherProfile(payload)).eq('id',id).select(TAH_TEACHER_MIN_COLS).single()); }
    if(error) throw error;
    return data;
  },
  async deleteTahTeacher(id){
    const {error}=await supa.from('tah_teachers').delete().eq('id',id);
    if(error) throw error;
  },
  async archiveTahTeacher(id){
    const {error}=await supa.from('tah_teachers').update({archived_at:new Date().toISOString()}).eq('id',id);
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
  async listAccessibleCentres(){
    const {data:master}=await supa.from('platform_admins').select('user_id').eq('user_id',CURRENT_USER_ID).maybeSingle();
    if(master){
      const {data,error}=await supa.from('centres').select(CENTRE_COLS).order('created_at');
      if(error) throw error;
      ACCESS_ROLE='master_admin';
      return data||[];
    }
    const {data,error}=await supa.from('centre_memberships').select(`centre_id,role,active,centres(${CENTRE_COLS})`).eq('user_id',CURRENT_USER_ID).eq('active',true);
    if(error) throw error;
    ACCESS_ROLE=data?.[0]?.role||'viewer';
    return (data||[]).map(row=>({...row.centres,role:row.role})).filter(Boolean);
  },
  async createCentre(payload){
    const {data,error}=await supa.from('centres').insert({...payload,owner_user_id:CURRENT_USER_ID,status:'active'}).select(CENTRE_COLS).single();
    if(error) throw error;
    return data;
  },
  async updateCentre(id,patch){
    const {data,error}=await supa.from('centres').update(patch).eq('id',id).select(CENTRE_COLS).single();
    if(error) throw error;
    return data;
  },
  async deleteCentre(id){
    const {error}=await supa.from('centres').delete().eq('id',id);
    if(error) throw error;
  },
  async uploadCentreLogo(centreId,file){
    if(!file) return '';
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)) throw new Error('Use a PNG, JPG, or WebP logo.');
    if(file.size>2*1024*1024) throw new Error('Logo must be 2 MB or smaller.');
    const extension=file.type==='image/png'?'png':file.type==='image/webp'?'webp':'jpg';
    const path=`${centreId}/logo.${extension}`;
    const {error}=await supa.storage.from('centre-branding').upload(path,file,{upsert:true,cacheControl:'3600',contentType:file.type});
    if(error) throw error;
    const {data}=supa.storage.from('centre-branding').getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  },
  async setCentreMembership(centreId,userId,role='centre_admin',active=true){
    const {data,error}=await supa.from('centre_memberships').upsert({centre_id:centreId,user_id:userId,role,active}).select().single();
    if(error) throw error;
    return data;
  },
  async createCentreAdminLogin(centreId,email,password){
    const {data,error}=await supa.functions.invoke('admin-centre',{body:{action:'create_centre_login',centre_id:centreId,email,password}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  },
  async listCentreLogins(centreId){
    const {data,error}=await supa.functions.invoke('admin-centre',{body:{action:'list_centre_logins',centre_id:centreId}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data?.logins||[];
  },
  async listAllCentreLogins(){
    const {data,error}=await supa.functions.invoke('admin-centre',{body:{action:'list_all_centre_logins'}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data?.logins||{};
  },
  async setCentreLoginStatus(centreId,userId,active){
    const {data,error}=await supa.functions.invoke('admin-centre',{body:{action:'set_centre_login_status',centre_id:centreId,user_id:userId,active}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  },
  async resetCentreLoginPassword(centreId,userId,password){
    const {data,error}=await supa.functions.invoke('admin-centre',{body:{action:'reset_centre_login_password',centre_id:centreId,user_id:userId,password}});
    if(error) throw error;
    if(data?.error) throw new Error(data.error);
    return data;
  },
};

const DB = CONFIG.USE_SUPABASE ? supaDB : window.memoryDB;
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
