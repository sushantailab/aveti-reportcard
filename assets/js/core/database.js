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
    { id:'c7', class_level:9, subject:'Science', chapter_no:1, title:'Demo Matter' },
    { id:'c8', class_level:9, subject:'Science', chapter_no:2, title:'Demo Tissues' },
    { id:'c9', class_level:9, subject:'Science', chapter_no:3, title:'Demo Motion' },
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
};

/* Supabase-backed DB (active when USE_SUPABASE = true). Same method names. */
let CENTRE_ID = null;   // set after login by ensureCentre()
let CURRENT_USER_ID = 'demo-user';
const STUDENT_COLS = 'id,name,academic_session,class_level,section,gender,optional_subject,parent_name,parent_phone,centre_id';
const STUDENT_COLS_LEGACY = 'id,name,class_level,section,gender,optional_subject,parent_name,parent_phone,centre_id';
const CHAPTER_COLS = 'id,centre_id,class_level,subject,chapter_no,title,created_at';
const TEST_COLS = 'id,centre_id,class_level,section,subject,chapter_id,chapter_no,chapter_name,test_type,full_marks,test_date,chapter:chapter_id(id,centre_id,class_level,subject,chapter_no,title)';
const RESULT_COLS = 'id,test_id,student_id,marks,present,na';
const EDIT_LOG_COLS = 'id,centre_id,test_id,student_id,edited_by,edited_at,old_marks,new_marks,old_present,new_present,old_na,new_na';
const missingAcademicSession = error => String(error?.message||'').toLowerCase().includes('academic_session');
const withDefaultSession = rows => (rows||[]).map(s=>({...s,academic_session:s.academic_session||currentSession()}));
const stripSession = obj => {
  const copy = {...obj};
  delete copy.academic_session;
  return copy;
};
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
  async listTests(){ const {data}=await supa.from('tests').select(TEST_COLS).order('test_date',{ascending:false}); return (data||[]).map(t=>t.chapter?{...t,chapter_no:t.chapter.chapter_no,chapter_name:t.chapter.title}:t); },
  async addTest(t){
    const {data,error}=await supa.from('tests').insert({...t, centre_id:CENTRE_ID}).select(TEST_COLS).single();
    if(error) throw error;
    return data?.chapter?{...data,chapter_no:data.chapter.chapter_no,chapter_name:data.chapter.title}:data;
  },
  async updateTest(id,patch){
    const {data,error}=await supa.from('tests').update(patch).eq('id',id).select(TEST_COLS).single();
    if(error) throw error;
    return data?.chapter?{...data,chapter_no:data.chapter.chapter_no,chapter_name:data.chapter.title}:data;
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
function parseCSV(text){
  const rows=[]; let row=[], cell='', q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i], next=text[i+1];
    if(q){
      if(ch==='"' && next==='"'){ cell+='"'; i++; }
      else if(ch==='"') q=false;
      else cell+=ch;
    }else if(ch==='"') q=true;
    else if(ch===','){ row.push(cell); cell=''; }
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
