/* ---------- shared options + avatar ---------- */
const SUBJECTS = ['Mathematics','Science','Hindi','English','English Grammar','SST','Geography','History'];
const CLASSES = Array.from({length:12},(_,i)=>i+1);
const SESSIONS = ['2026-27','2027-28','2025-26'];
const FULL_MARK_OPTIONS = [20,25,30,35];
const cap = s => s ? s.charAt(0).toUpperCase()+s.slice(1) : '';
const currentSession = () => SESSIONS[0];
const sessionOptions = sel => SESSIONS.map(s=>`<option value="${s}" ${s===(sel||currentSession())?'selected':''}>${s}</option>`).join('');
const classOptions   = sel => CLASSES.map(c=>`<option value="${c}" ${c==sel?'selected':''}>Class ${c}</option>`).join('');
const classFilterOptions = sel => '<option value="All">All classes</option>' + CLASSES.map(c=>`<option value="${c}" ${String(c)===String(sel)?'selected':''}>Class ${c}</option>`).join('');
const sectionOptions = (sel,withAll) => (withAll?['All','A','B']:['A','B']).map(s=>`<option value="${s}" ${s==sel?'selected':''}>${s==='All'?'All sections':'Section '+s}</option>`).join('');
const subjectOptions = sel => SUBJECTS.map(s=>`<option ${s==sel?'selected':''}>${s}</option>`).join('');
const fullMarkButtons = sel => FULL_MARK_OPTIONS.map(f=>`<button id="f${f}" class="${Number(sel)===f?'on':''}" onclick="setFull(${f})">${f}</button>`).join('');
const genderOptions  = sel => '<option value="">Gender</option>' + ['male','female'].map(g=>`<option value="${g}" ${g===(sel||'').toLowerCase()?'selected':''}>${cap(g)}</option>`).join('');
const OPTIONAL = ['N.A.','Hindi','English','Sanskrit','None'];
function normalizeOptional(v){
  const text = normalizeText(v);
  if(!text || ['na','n/a','n.a','n.a.','none','-'].includes(text.toLowerCase())) return 'N.A.';
  return OPTIONAL.find(o=>o.toLowerCase()===text.toLowerCase()) || text;
}
const optionalOptions = sel => OPTIONAL.map(o=>`<option value="${o}" ${o===normalizeOptional(sel)?'selected':''}>${o==='N.A.'?'Optional: N.A.':o==='None'?'Optional: —':'Opt: '+o}</option>`).join('');
function avatar(gender,name){
  const f = (gender||'').toLowerCase().startsWith('f');
  const c = f ? '#d96aa0' : '#4a90d9';
  const bg = f ? '#fbeef4' : '#eaf2fb';
  return `<span title="${cap(gender)}" style="width:34px;height:34px;border-radius:50%;background:${bg};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="${c}"><circle cx="12" cy="8" r="4.2"/><path d="M4.5 21c0-4.2 3.4-7.2 7.5-7.2s7.5 3 7.5 7.2z"/></svg></span>`;
}
const val = id => document.getElementById(id).value;
const cleanPhone = p => (p||'').replace(/[^\d]/g,'');
function normalizeIndianPhone(phone){
  let d = cleanPhone(phone);
  if(d.length===12 && d.startsWith('91')) d = d.slice(2);
  return d.length===10 && /^[6-9]\d{9}$/.test(d) ? d : null;
}
const sectionKey = s => s || 'All';
const selectedSectionMatches = (itemSection, selectedSection) =>
  selectedSection === 'All' || sectionKey(itemSection) === sectionKey(selectedSection);
const selectedTestSectionMatches = (testSection, selectedSection) =>
  selectedSection === 'All' || sectionKey(testSection) === 'All' || sectionKey(testSection) === sectionKey(selectedSection);
function sameClassSectionName(a,b){
  return normalizeText(a.name).toLowerCase()===normalizeText(b.name).toLowerCase() &&
    (a.academic_session||currentSession())===(b.academic_session||currentSession()) &&
    String(a.class_level)===String(b.class_level) &&
    sectionKey(a.section)===sectionKey(b.section);
}
async function warnStudentDuplicates(student, ignoreId){
  const students = await DB.listStudents();
  const duplicateName = students.find(s=>s.id!==ignoreId && sameClassSectionName(s,student));
  if(duplicateName && !confirm(`${student.name} already exists in Session ${student.academic_session}, Class ${student.class_level}, Section ${sectionKey(student.section)}. Save anyway?`)) return false;
  const phone = normalizeIndianPhone(student.parent_phone);
  if(phone){
    const duplicatePhone = students.find(s=>s.id!==ignoreId && normalizeIndianPhone(s.parent_phone)===phone);
    if(duplicatePhone && !confirm(`This parent phone is already used for ${duplicatePhone.name}. Save anyway?`)) return false;
  }
  return true;
}
const chapterLabel = t => (t.chapter_name && t.chapter_name.trim()) ? t.chapter_name : ('Chapter '+(t.chapter_no||''));
function chapterDetail(t){
  const name = (t.chapter_name||'').trim();
  const no = String(t.chapter_no||'').trim();
  if(!name) return 'Chapter '+no;
  const compact = name.toLowerCase().replace(/[\s-]/g,'');
  if(no && (compact===('ch'+no) || compact===('chapter'+no))) return 'Chapter '+no;
  return `Chapter ${no} — ${name}`;
}
const chapterOptionLabel = c => chapterDetail({chapter_no:c.chapter_no, chapter_name:c.title});
const testOptionLabel = t => `Class ${t.class_level} · Section ${t.section||'All'} · ${t.subject} · ${chapterDetail(t)} · ${fmtDate(testDate(t))}`;
const bandConfig = () => (CONFIG.BANDS||[]).slice().sort((a,b)=>b.min-a.min);
const band = p => {
  const bands = bandConfig();
  return (bands.find(b=>p>=b.min && p<=b.max) || bands[bands.length-1] || {grade:'D'}).grade;
};
const bandMeta = p => bandConfig().find(b=>b.grade===band(p)) || {grade:'D',min:0,max:39,label:'Needs Support'};
const supportBand = () => bandConfig().slice().sort((a,b)=>a.min-b.min)[0] || {grade:'D',min:0,max:39,label:'Needs Support'};
const needsSupport = p => band(p)===supportBand().grade;
const bandRangeLabel = b => b.max>=100 ? `${b.min}–100` : b.min<=0 ? `<${b.max+1}` : `${b.min}–${b.max}`;
function parentMessageName(name){
  const parts = normalizeText(name).split(/\s+/).filter(Boolean);
  if(!parts.length) return 'Student';
  const first = parts[0];
  const initials = first.replace(/\./g,'');
  const isInitials = /^[A-Za-z]{1,4}$/.test(initials) && (first.includes('.') || /^[A-Za-z]\.[A-Za-z]/.test(first));
  return isInitials && parts[1] ? `${first} ${parts[1]}` : first;
}
function perfBand(p){
  const meta = bandMeta(p);
  if(meta.grade==='A') return {label:meta.label, emoji:'🌟', line:n=>`Great effort by ${n}. Keep it up!`};
  if(meta.grade==='B') return {label:meta.label, emoji:'👏', line:n=>`Well done, ${n}. Strong work!`};
  if(meta.grade==='C') return {label:meta.label, emoji:'👍', line:n=>`Good going, ${n}. A little more will go far.`};
  return {label:meta.label, emoji:'🤝', line:n=>`Let's work together to help ${n} improve.`};
}

/* ---------- helpers ---------- */
const pct = (marks, full) => (marks==null||full==0) ? null : Math.round((marks/full)*1000)/10;
const bandColor = b => ({A:'var(--teal)',B:'#639922',C:'var(--amber)',D:'var(--red)'})[b] || 'var(--muted)';
function fmtDate(d){
  if(!d) return 'No date';
  const date = new Date(d);
  if(Number.isNaN(date.getTime())) return String(d);
  return date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
}
const testDate = t => t?.test_date || t?.date || t?.created_at || '';
function isNewTest(t){
  const raw = testDate(t);
  if(!raw) return false;
  const date = new Date(String(raw).slice(0,10)+'T00:00:00');
  const today = new Date();
  today.setHours(0,0,0,0);
  const days = Math.floor((today-date)/(24*60*60*1000));
  return days>=0 && days<=5;
}

async function classAverage(test){
  const rs = (await cachedResults(test.id)).filter(r=>!r.na && r.present && r.marks!=null);
  if(!rs.length) return null;
  return Math.round(rs.reduce((a,r)=>a+pct(r.marks,test.full_marks),0)/rs.length*10)/10;
}
