/* =============================================================
   ROUTER + SCREENS
   ============================================================= */
const app = document.getElementById('app');
const crumb = document.getElementById('crumb');
let CURRENT_TEST = null;

function setCrumb(t){ crumb.textContent = t; }
function show(html){ app.innerHTML = '<div class="screen active">'+html+'</div>'; }

const demoNote = CONFIG.USE_SUPABASE ? '' :
  '<div class="demoflag">Demo mode — sample data, nothing is saved permanently. Set <b>USE_SUPABASE = true</b> in the file and add your keys to go live.</div>';

/* ---------- HOME ---------- */
let HOME_CLASS_FILTER = 'All', HOME_SUBJECT_FILTER = 'All', HOME_SHOW_ALL = false;
async function home(){
  setCrumb('Home');
  const tests = (await DB.listTests()).slice().sort((a,b)=>new Date(testDate(b))-new Date(testDate(a)));
  const filteredTests = tests.filter(t=>
    (HOME_CLASS_FILTER==='All' || String(t.class_level)===String(HOME_CLASS_FILTER)) &&
    (HOME_SUBJECT_FILTER==='All' || t.subject===HOME_SUBJECT_FILTER)
  );
  const visibleTests = HOME_SHOW_ALL ? filteredTests : filteredTests.slice(0,4);
  const testClasses = [...new Set(tests.map(t=>String(t.class_level)))].sort((a,b)=>Number(a)-Number(b));
  const testSubjects = [...new Set(tests.map(t=>t.subject).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const homeClassOptions = ['<option value="All">All classes</option>']
    .concat(testClasses.map(c=>`<option value="${c}" ${String(HOME_CLASS_FILTER)===c?'selected':''}>Class ${c}</option>`))
    .join('');
  const homeSubjectOptions = ['<option value="All">All subjects</option>']
    .concat(testSubjects.map(s=>`<option value="${s}" ${HOME_SUBJECT_FILTER===s?'selected':''}>${s}</option>`))
    .join('');
  let recent='';
  for(const t of visibleTests){
    const avg = await classAverage(t);
    const rs = await cachedResults(t.id);
    const appeared = rs.filter(r=>!r.na && r.present).length;
    const newTag = isNewTest(t) ? '<span class="new-tag">NEW</span>' : '';
    recent += `<div class="recent-test">
      <div class="recent-grid">
        <div class="recent-field"><div class="label">Date</div><div class="value">${fmtDate(testDate(t))}${newTag}</div></div>
        <div class="recent-field"><div class="label">Class</div><div class="value">Class ${t.class_level}${t.section?(' · Sec '+t.section):' · All'}</div></div>
        <div class="recent-field"><div class="label">Subject</div><div class="value">${t.subject}</div></div>
        <div class="recent-field"><div class="label">Chapter</div><div class="value">${chapterDetail(t)}</div></div>
        <div class="recent-field"><div class="label">Full marks</div><div class="value">${t.full_marks}</div></div>
        <div class="recent-field"><div class="label">Students</div><div class="value">${appeared}/${rs.length} appeared</div></div>
        <div class="recent-field"><div class="label">Average</div><div class="value strong">${avg!=null?avg+'%':'—'}</div></div>
        <div class="recent-actions">
          <button class="action teacher" onclick="openTeacher('${t.id}')">Teacher</button>
          <button class="action parent" onclick="openParents('${t.id}')">Parent</button>
        </div>
      </div>
    </div>`;
  }
  show(`
    ${demoNote}
    <div class="card pad" style="margin-bottom:16px">
      <div class="row between" style="flex-wrap:wrap;gap:10px">
        <div class="brandbar">
          <img class="brandlogo" style="height:24px" alt="Aveti Learning" src="assets/images/aveti-logo.png">
          <div><div style="font-weight:600">${CONFIG.CENTRE.name}</div><div class="tiny faint">${CONFIG.CENTRE.address} · Ph ${CONFIG.CENTRE.phone}</div></div>
        </div>
        <button class="primary" onclick="enterMarks()">+ Enter test marks</button>
      </div>
    </div>

    <div class="eyebrow" style="margin:4px 2px 8px">Open a report</div>
    <div class="tiles" style="margin-bottom:20px">
      <div class="tile teacher" onclick="openTeacher()">
        <h3>📋 Teacher report</h3>
        <div class="muted small">Class marks, ranking, bands and who needs support.</div>
      </div>
      <div class="tile parent" onclick="openParents()">
        <h3>👪 Parent report</h3>
        <div class="muted small">A card per student — send to parents on WhatsApp.</div>
      </div>
      <div class="tile growth" onclick="growth()">
        <h3>📈 Growth tracker</h3>
        <div class="muted small">Chapter-to-chapter trend, class vs individual.</div>
      </div>
      <div class="tile insights" onclick="classInsights()">
        <h3>Class insights</h3>
        <div class="muted small">Subject leaderboard, students below 40% and attendance risks.</div>
      </div>
    </div>

    <div class="card">
      <div class="pad row between" style="padding-bottom:6px;gap:12px;flex-wrap:wrap">
        <div>
          <span class="section-title">${HOME_SHOW_ALL?'All Tests':'Recent Tests'}</span>
          <div class="tiny faint">${filteredTests.length} test${filteredTests.length===1?'':'s'} · newest first</div>
        </div>
        <div class="test-list-tools">
          <select onchange="setHomeClassFilter(this.value)">${homeClassOptions}</select>
          <select onchange="setHomeSubjectFilter(this.value)">${homeSubjectOptions}</select>
          <button onclick="toggleHomeTests()">${HOME_SHOW_ALL?'Show recent':'Show all tests'}</button>
        </div>
      </div>
      <div class="pad" style="padding-top:0">${recent||'<div class="muted small">No tests found for this selection.</div>'}</div>
    </div>
  `);
}
window.setHomeClassFilter = value=>{ HOME_CLASS_FILTER=value; home(); };
window.setHomeSubjectFilter = value=>{ HOME_SUBJECT_FILTER=value; home(); };
window.toggleHomeTests = ()=>{ HOME_SHOW_ALL=!HOME_SHOW_ALL; home(); };

/* ---------- ROSTER ---------- */
let SHOW_ADD = false, EDIT_ID = null, SEC_FILTER = 'All', CLASS_FILTER = 'All', SESSION_FILTER = currentSession();
async function roster(){
  setCrumb('Students');
  const all = await DB.listStudents();
  const sessionStudents = all.filter(s=>(s.academic_session||currentSession())===SESSION_FILTER);
  const classStudents = CLASS_FILTER==='All' ? sessionStudents : sessionStudents.filter(s=>String(s.class_level)===String(CLASS_FILTER));
  const students = SEC_FILTER==='All' ? classStudents : classStudents.filter(s=>(s.section||'')===SEC_FILTER);
  const rows = students.length ? students.map(studentRow).join('')
    : '<div class="muted small" style="padding:8px 0">No students here yet.</div>';
  const fbtn = (v,label)=>`<button class="${SEC_FILTER===v?'on':''}" onclick="setSecFilter('${v}')">${label}</button>`;
  show(`
    ${demoNote}
    <div class="card">
      <div class="pad row between">
        <div><h2 style="font-size:18px">Students</h2><div class="muted small">Add once with class, section, gender and parent number. They appear automatically when you enter marks for that class &amp; section.</div></div>
        <button class="primary" onclick="toggleAdd()">+ Add student</button>
      </div>
      <div style="display:${SHOW_ADD?'block':'none'};padding:0 18px 4px">${addFormHTML()}</div>
      <div class="pad row" style="padding-top:6px;padding-bottom:2px;gap:8px;align-items:center">
        <span class="small muted">Session</span>
        <select style="width:auto" onchange="setSessionFilter(this.value)">${sessionOptions(SESSION_FILTER)}</select>
        <span class="small muted">Class</span>
        <select style="width:auto" onchange="setClassFilter(this.value)">${classFilterOptions(CLASS_FILTER)}</select>
        <span class="small muted">Show</span>
        <select style="width:auto" onchange="setSecFilter(this.value)">
          <option value="All" ${SEC_FILTER==='All'?'selected':''}>All sections</option>
          <option value="A" ${SEC_FILTER==='A'?'selected':''}>Section A</option>
          <option value="B" ${SEC_FILTER==='B'?'selected':''}>Section B</option>
        </select>
      </div>
      <div class="pad" style="padding-top:8px">${rows}</div>
    </div>
  `);
}
window.setSecFilter = v=>{ SEC_FILTER=v; roster(); };
window.setClassFilter = v=>{ CLASS_FILTER=v; roster(); };
window.setSessionFilter = v=>{ SESSION_FILTER=v; roster(); };
function studentRow(s){
  if(EDIT_ID===s.id) return editRow(s);
  return `<div class="listrow">
    ${avatar(s.gender,s.name)}
    <div style="flex:1"><div>${s.name}</div><div class="tiny faint">Session ${s.academic_session||currentSession()} · Class ${s.class_level}${s.section?(' · Sec '+s.section):' · All sec'}${s.gender?(' · '+cap(s.gender)):''}</div></div>
    <div class="small" style="margin-right:8px">${s.parent_phone?('<span class="muted">'+s.parent_phone+'</span>'):'<span class="pill warn">no number</span>'}</div>
    <button onclick="startEdit('${s.id}')">Edit</button>
    <button onclick="deleteStudent('${s.id}','${s.name.replace(/'/g,"")}')" style="color:var(--red)">Delete</button>
  </div>`;
}
function editRow(s){
  return `<div class="listrow" style="flex-wrap:wrap;gap:8px">
    <input id="ed_name" value="${s.name}" placeholder="Name" style="flex:1;min-width:120px">
    <select id="ed_session" style="width:auto">${sessionOptions(s.academic_session)}</select>
    <select id="ed_class" style="width:auto">${classOptions(s.class_level)}</select>
    <select id="ed_sec" style="width:auto">${sectionOptions(s.section||'All',true)}</select>
    <select id="ed_gender" style="width:auto">${genderOptions(s.gender)}</select>
    <select id="ed_opt" style="width:auto">${optionalOptions(s.optional_subject)}</select>
    <input id="ed_phone" value="${s.parent_phone||''}" placeholder="+91 parent number" style="flex:1;min-width:150px">
    <button class="primary" onclick="saveEdit('${s.id}')">Save</button>
    <button onclick="cancelEdit()">Cancel</button>
  </div>`;
}
function addFormHTML(){
  return `<div style="background:#f8faf7;border-radius:11px;padding:12px">
    <div class="row" style="flex-wrap:wrap;gap:8px">
      <input id="ad_name" placeholder="Student name" style="flex:1;min-width:140px">
      <select id="ad_session" style="width:auto">${sessionOptions(SESSION_FILTER)}</select>
      <select id="ad_class" style="width:auto">${classOptions(9)}</select>
      <select id="ad_sec" style="width:auto">${sectionOptions('A',true)}</select>
      <select id="ad_gender" style="width:auto">${genderOptions('')}</select>
      <select id="ad_opt" style="width:auto">${optionalOptions('N.A.')}</select>
      <input id="ad_phone" placeholder="+91 parent number" style="flex:1;min-width:150px">
      <button class="primary" onclick="submitAdd()">Add</button>
    </div>
    <div class="csv-tools" style="margin-top:10px">
      <span class="small muted" style="flex:1">Bulk add students by CSV</span>
      <button onclick="downloadStudentCSVTemplate()">Download sample CSV</button>
      <button onclick="document.getElementById('studentCsvInput').click()">Upload filled CSV</button>
      <input id="studentCsvInput" type="file" accept=".csv,text/csv" style="display:none" onchange="importStudentsCSV(this.files[0]);this.value=''">
    </div>
  </div>`;
}
window.toggleAdd = ()=>{ SHOW_ADD=!SHOW_ADD; roster(); };
window.submitAdd = async ()=>{
  const name=val('ad_name').trim(); if(!name){ alert('Enter a student name'); return; }
  const sec = val('ad_sec');
  const gender = val('ad_gender'); if(!gender){ alert('Select gender.'); return; }
  const rawPhone = val('ad_phone').trim();
  const phone = rawPhone ? normalizeIndianPhone(rawPhone) : '';
  if(rawPhone && !phone){ alert('Enter a valid Indian 10-digit parent phone number. Parent cards cannot be sent without this.'); return; }
  const student = { name, academic_session:val('ad_session'), class_level:parseInt(val('ad_class')), section: sec==='All'?null:sec, gender, optional_subject:normalizeOptional(val('ad_opt')), parent_name:'', parent_phone:phone };
  if(!(await warnStudentDuplicates(student))) return;
  await DB.addStudent(student);
  SHOW_ADD=false; roster();
};
window.downloadStudentCSVTemplate = ()=>{
  const rows = [
    ['student_name','academic_session','class','section','gender','optional_subject','parent_phone'],
    ['Adidev','2026-27','7','A','male','N.A.','7894040614'],
    ['Devanshi','2026-27','7','B','female','Sanskrit','7894040615']
  ];
  downloadBlob('aveti-students-template.csv','text/csv;charset=utf-8',rows.map(csvLine).join('\n'));
};
window.importStudentsCSV = async file=>{
  if(!file) return;
  try{
    const rows = await readCSVFile(file);
    const existing = await DB.listStudents();
    const existingNameKeys = new Set(existing.map(s=>[
      (s.academic_session||currentSession()),
      s.class_level,
      sectionKey(s.section),
      normalizeText(s.name).toLowerCase()
    ].join('|')));
    const existingPhones = new Set(existing.map(s=>normalizeIndianPhone(s.parent_phone)).filter(Boolean));
    const students = [];
    const warnings = [];
    rows.forEach((r,i)=>{
      const rowNo = i+2;
      const name = r.student_name || r.name;
      const cls = parseInt(r.class || r.class_level || r.class_level_no);
      const sectionRaw = normalizeText(r.section || 'All');
      const section = ['A','B'].includes(sectionRaw.toUpperCase()) ? sectionRaw.toUpperCase() : null;
      const gender = normalizeText(r.gender).toLowerCase();
      const rawPhone = r.parent_phone || r.phone || r.mobile || '';
      const phone = rawPhone ? normalizeIndianPhone(rawPhone) : '';
      const academic_session = r.academic_session || r.session || currentSession();
      if(!name || !cls || !CLASSES.includes(cls) || !['male','female'].includes(gender)){
        warnings.push(`Row ${rowNo}: missing/invalid name, class, or gender.`);
        return;
      }
      if(rawPhone && !phone){
        warnings.push(`Row ${rowNo}: invalid parent phone for ${name}.`);
        return;
      }
      const key = [academic_session,cls,sectionKey(section),normalizeText(name).toLowerCase()].join('|');
      if(existingNameKeys.has(key)) warnings.push(`Row ${rowNo}: duplicate name in same session/class/section (${name}).`);
      if(phone && existingPhones.has(phone)) warnings.push(`Row ${rowNo}: parent phone already used (${name}).`);
      existingNameKeys.add(key);
      if(phone) existingPhones.add(phone);
      students.push({name:normalizeText(name),academic_session,class_level:cls,section,gender,optional_subject:normalizeOptional(r.optional_subject),parent_name:'',parent_phone:phone});
    });
    if(!students.length){ alert(`No students imported.\n${warnings.join('\n')}`); return; }
    const msg = [`Import ${students.length} student${students.length===1?'':'s'}?`].concat(warnings.slice(0,8));
    if(warnings.length>8) msg.push(`+ ${warnings.length-8} more warning(s).`);
    if(!confirm(msg.join('\n'))) return;
    for(const s of students) await DB.addStudent(s);
    alert(`Imported ${students.length} student${students.length===1?'':'s'}.`);
    SHOW_ADD=false; roster();
  }catch(e){
    alert(e.message || 'Could not read this CSV file.');
  }
};
window.startEdit = id=>{ EDIT_ID=id; roster(); };
window.cancelEdit = ()=>{ EDIT_ID=null; roster(); };
window.saveEdit = async id=>{
  const sec = val('ed_sec');
  const name = val('ed_name').trim(); if(!name){ alert('Enter a student name'); return; }
  const gender = val('ed_gender'); if(!gender){ alert('Select gender.'); return; }
  const rawPhone = val('ed_phone').trim();
  const phone = rawPhone ? normalizeIndianPhone(rawPhone) : '';
  if(rawPhone && !phone){ alert('Enter a valid Indian 10-digit parent phone number. Parent cards cannot be sent without this.'); return; }
  const student = { name, academic_session:val('ed_session'), class_level:parseInt(val('ed_class')), section: sec==='All'?null:sec, gender, optional_subject:normalizeOptional(val('ed_opt')), parent_phone:phone };
  if(!(await warnStudentDuplicates(student,id))) return;
  await DB.updateStudent(id,student);
  EDIT_ID=null; roster();
};
window.deleteStudent = async (id,name)=>{
  if(!confirm('Delete '+name+'? This also removes their past marks and cannot be undone.')) return;
  await DB.deleteStudent(id); resultsCache.clear(); roster();
};
