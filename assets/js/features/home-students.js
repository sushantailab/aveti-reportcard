/* =============================================================
   ROUTER + SCREENS
   ============================================================= */
const app = document.getElementById('app');
const crumb = document.getElementById('crumb');
let CURRENT_TEST = null;
const LS_LAST_ROUTE = 'aveti:last-route';

function setCrumb(t){
  crumb.textContent = t;
  const route = ({
    'Home':'home','Students':'students','Enter test marks':'marks','Teacher report':'teacher',
    'Parent report':'parent','Growth tracker':'growth','Class insights':'insights',
    'Certificates':'certificates','Teacher Activation':'activation','Centre admin':'centre-admin'
  })[t];
  if(route) localStorage.setItem(LS_LAST_ROUTE,route);
  if(route) document.querySelectorAll('[data-route]').forEach(el=>el.classList.toggle('active',el.dataset.route===route));
}
function show(html){ app.innerHTML = '<div class="screen active">'+html+'</div>'; }

const demoNote = CONFIG.USE_SUPABASE ? '' :
  '<div class="demoflag">Demo mode — sample data, nothing is saved permanently. Set <b>USE_SUPABASE = true</b> in the file and add your keys to go live.</div>';
const toolGlyph = symbol => `<span class="tool-glyph" aria-hidden="true">${symbol}</span>`;
const homeIcon = type => ({
  tests:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3v3m6-3v3M8.5 11l2 2 4-4m-6 7h7"/></svg>',
  classes:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6m.4-5c2.7.2 4.4 1.8 4.8 4.6"/></svg>',
  subject:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5c3.2-.9 5.6-.4 8 1.4v12c-2.4-1.8-4.8-2.3-8-1.4zM20 5.5c-3.2-.9-5.6-.4-8 1.4v12c2.4-1.8 4.8-2.3 8-1.4z"/></svg>',
  attendance:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M2.5 20c.5-4 2.6-6 5.5-6s5 2 5.5 6m1-4.7 2 2 4-4"/></svg>',
  chart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10m6 10V4m6 16v-7"/><path d="M2 20h20"/></svg>',
  report:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
  parent:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3.5 20c.4-4 2.5-6 5.5-6s5.1 2 5.5 6m.4-5c2.7.2 4.4 1.8 4.8 4.6"/></svg>',
  certificate:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="9" r="5"/><path d="m8.5 13-1 7 4.5-2 4.5 2-1-7M12 6.5v5m-2.5-2.5h5"/></svg>',
  activation:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 19 14-14M9 5h10v10"/></svg>'
}[type] || '');
const homeBars = (count,color='green') => `<span class="snapshot-bars ${color}">${[38,62,26,72,43,87,36,57,29,49,68,31].map(height=>`<i style="height:${height}%"></i>`).join('')}</span>`;
const homeSparkline = () => '<svg class="snapshot-sparkline" viewBox="0 0 180 46" aria-hidden="true"><path d="M2 30 15 20 28 28 42 13 56 33 70 25 84 38 99 22 113 29 128 10 142 23 156 15 178 22" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M2 30 15 20 28 28 42 13 56 33 70 25 84 38 99 22 113 29 128 10 142 23 156 15 178 22" fill="none" stroke="currentColor" stroke-width="7" opacity=".08"/></svg>';
const homeMiniCalendar = (month,year,tests) => {
  const counts=new Map();
  tests.forEach(test=>{const date=new Date(testDate(test));const day=date.getDate();counts.set(day,(counts.get(day)||0)+1);});
  const firstDay=new Date(year,month,1).getDay();
  const lastDay=new Date(year,month+1,0).getDate();
  const blank=Array.from({length:firstDay},()=>'<i class="home-calendar-empty"></i>').join('');
  const days=Array.from({length:lastDay},(_,index)=>{const day=index+1,count=counts.get(day)||0;return `<i class="home-calendar-day${count?' has-test':''}${count>1?' multiple-tests':''}">${day}${count?'<b aria-label="Test day"></b>':''}</i>`;}).join('');
  return `<aside class="home-mini-calendar" aria-label="${new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(new Date(year,month,1))} test calendar"><div><b>${new Intl.DateTimeFormat('en-IN',{month:'short'}).format(new Date(year,month,1))} ${year}</b><span><i class="single"></i>Test <i class="multiple"></i>2+</span></div><section><em>Su</em><em>Mo</em><em>Tu</em><em>We</em><em>Th</em><em>Fr</em><em>Sa</em>${blank}${days}</section></aside>`;
};

/* ---------- HOME ---------- */
let HOME_CLASS_FILTER = 'All', HOME_SUBJECT_FILTER = 'All', HOME_SHOW_ALL = false;
let HOME_PERIOD_MONTH = '', HOME_PERIOD_YEAR = '';
async function homeChapterScope(test){
  const selectedIds = Array.isArray(test.chapter_ids) ? test.chapter_ids.map(String) : [];
  let chapterNumbers = [];
  if(selectedIds.length){
    const chapters = await DB.listChapters(test.class_level,test.subject);
    const numberById = new Map(chapters.map(chapter=>[String(chapter.id),Number(chapter.chapter_no)]));
    chapterNumbers = selectedIds.map(id=>numberById.get(id)).filter(Number.isFinite);
  }
  if(!chapterNumbers.length && Number.isFinite(Number(test.chapter_no))) chapterNumbers=[Number(test.chapter_no)];
  chapterNumbers=[...new Set(chapterNumbers)].sort((a,b)=>a-b);
  return chapterNumbers.length ? chapterNumbers.map(number=>`Ch ${number}`).join(', ') : 'Ch —';
}
async function home(){
  setCrumb('Home');
  const tests = (await DB.listTests()).slice().sort((a,b)=>new Date(testDate(b))-new Date(testDate(a)));
  const activeStudentIds = new Set((await DB.listStudents()).map(student=>student.id));
  const datedTests = tests.filter(test=>!Number.isNaN(new Date(testDate(test)).getTime()));
  if((!HOME_PERIOD_MONTH || !HOME_PERIOD_YEAR) && datedTests.length){
    const latest = new Date(testDate(datedTests[0]));
    HOME_PERIOD_MONTH = String(latest.getMonth());
    HOME_PERIOD_YEAR = String(latest.getFullYear());
  }
  const selectedMonth = Number(HOME_PERIOD_MONTH || new Date().getMonth());
  const selectedYear = Number(HOME_PERIOD_YEAR || new Date().getFullYear());
  const monthName = new Intl.DateTimeFormat('en-IN',{month:'long'}).format(new Date(selectedYear,selectedMonth,1));
  const periodTests = datedTests.filter(test=>{ const date=new Date(testDate(test)); return date.getMonth()===selectedMonth && date.getFullYear()===selectedYear; });
  const calendar = homeMiniCalendar(selectedMonth,selectedYear,periodTests);
  const periodData = await Promise.all(periodTests.map(async test=>({test,results:await activeResultsForTest(test,activeStudentIds)})));
  const applicable = periodData.reduce((total,item)=>total+item.results.filter(result=>!result.na).length,0);
  const attended = periodData.reduce((total,item)=>total+item.results.filter(result=>!result.na&&result.present).length,0);
  const attendance = applicable ? Math.round(attended/applicable*1000)/10 : null;
  const periodClasses = new Map(), periodSubjects = new Map();
  periodTests.forEach(test=>{ periodClasses.set(String(test.class_level),(periodClasses.get(String(test.class_level))||0)+1); periodSubjects.set(test.subject,(periodSubjects.get(test.subject)||0)+1); });
  const years = [...new Set(datedTests.map(test=>new Date(testDate(test)).getFullYear()))].sort((a,b)=>b-a);
  if(!years.includes(selectedYear)) years.push(selectedYear);
  const monthOptions = Array.from({length:12},(_,month)=>`<option value="${month}" ${month===selectedMonth?'selected':''}>${new Intl.DateTimeFormat('en-IN',{month:'long'}).format(new Date(2026,month,1))}</option>`).join('');
  const yearOptions = years.sort((a,b)=>b-a).map(year=>`<option value="${year}" ${year===selectedYear?'selected':''}>${year}</option>`).join('');
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
    const avg = await classAverage(t,activeStudentIds);
    const rs = await activeResultsForTest(t,activeStudentIds);
    const chapterScope = await homeChapterScope(t);
    const appeared = rs.filter(r=>!r.na && r.present).length;
    const applicableStudents = rs.filter(r=>!r.na).length;
    const testAttendance = applicableStudents ? Math.round(appeared/applicableStudents*100) : null;
    const newTag = isNewTest(t) ? '<span class="new-tag">NEW</span>' : '';
    const chapterCount = chapterScope==='Ch —' ? 0 : chapterScope.split(',').length;
    recent += `<article class="home-timeline-row">
      <span class="home-timeline-dot ${isNewTest(t)?'new':''}"></span>
      <div class="home-test-date" data-label="Date"><b>${fmtDate(testDate(t))}</b>${newTag}</div>
      <div class="home-test-class" data-label="Class & section"><b>Class ${t.class_level}${t.section?(' · Sec '+t.section):' · All'}</b></div>
      <div class="home-test-subject" data-label="Subject"><b>${t.subject}</b></div>
      <div class="home-test-scope" data-label="Test & chapters"><b>${testTypeLabel(t.test_type)}</b><span>${chapterScope}</span><em>${chapterCount} chapter${chapterCount===1?'':'s'}</em></div>
      <div class="home-test-attendance" data-label="Attendance"><b class="home-attendance-value">${testAttendance==null?'—':testAttendance+'%'}</b><span>Attendance</span></div>
      <div class="home-test-value" data-label="Full marks"><b>${t.full_marks}</b><span>Full marks</span></div>
      <div class="home-test-value" data-label="Average score"><b>${avg!=null?avg+'%':'—'}</b><span>Average score</span></div>
      <span class="home-status" data-label="Status">Report<br>ready</span>
      <div class="recent-actions" data-label="Reports"><button class="action teacher" onclick="openTeacher('${t.id}')">Teacher</button><button class="action parent" onclick="openParents('${t.id}')">Parent</button><button class="home-row-more" onclick="openTeacher('${t.id}')" aria-label="Open test report">›</button></div>
    </article>`;
  }
  show(`
    ${demoNote}
    <div class="home-dashboard">
      <header class="home-dashboard-title"><span>Aveti Learning Tuition Center</span><h1>Monthly Assessment &amp; Progress</h1></header>
      <section class="home-overview card">
        <div class="home-snapshot-head"><div><h1>${monthName} ${selectedYear} activity overview</h1><p>A quick view of assessment activity <span>✦</span></p></div><div class="home-period-controls"><label>Reporting period <select onchange="setHomeMonth(this.value)">${monthOptions}</select></label><select aria-label="Reporting year" onchange="setHomeYear(this.value)">${yearOptions}</select></div>${calendar}</div>
        <div class="home-stat-grid">
          <article class="home-stat-card"><div><i class="home-icon tests">${homeIcon('tests')}</i><b>${periodTests.length}</b><span>Tests conducted</span></div>${homeBars(periodTests.length)}</article>
          <article class="home-stat-card"><div><i class="home-icon classes">${homeIcon('classes')}</i><b>${periodClasses.size}</b><span>Classes covered</span></div>${homeSparkline()}</article>
          <article class="home-stat-card"><div><i class="home-icon subject">${homeIcon('subject')}</i><b>${periodSubjects.size}</b><span>Subjects assessed</span></div>${homeBars(periodSubjects.size,'orange')}</article>
          <article class="home-stat-card attendance-card"><div class="attendance-ring" style="--attendance:${attendance||0}"><b>${attendance==null?'—':attendance+'%'}</b><span>Exam attendance</span></div></article>
        </div>
        <div class="home-summary-grid"><div class="home-summary"><b>Tests by class</b><div>${periodClasses.size?[...periodClasses.entries()].sort((a,b)=>Number(a[0])-Number(b[0])).map(([key,count])=>`<span><label>Class ${key}</label><i><em style="width:${Math.max(20,count/Math.max(...periodClasses.values())*100)}%"></em></i><strong>${count}</strong></span>`).join(''):'<em>No tests in '+monthName+' '+selectedYear+'</em>'}</div></div><div class="home-summary"><b>Tests by subject</b><div>${periodSubjects.size?[...periodSubjects.entries()].sort((a,b)=>a[0].localeCompare(b[0])).map(([key,count])=>`<span><label>${key}</label><i><em style="width:${Math.max(20,count/Math.max(...periodSubjects.values())*100)}%"></em></i><strong>${count}</strong></span>`).join(''):'<em>No tests in '+monthName+' '+selectedYear+'</em>'}</div></div></div>
      </section>

      <section class="home-workflow card"><div class="workflow-heading"><h2>Assessment Workflow</h2><p>Your assessment cycle, simplified</p></div><div class="workflow-grid">
        <button class="workflow-step workflow-enter" onclick="enterMarks()"><span class="workflow-top"><i>1</i><b>Enter marks</b></span><span class="workflow-icon">${homeIcon('tests')}</span><small>Record a test and scores</small><strong>Enter marks <b>→</b></strong></button>
        <div class="workflow-step workflow-analyse"><span class="workflow-top"><i>2</i><b>Analyse &amp; remedial</b><em>Core step</em></span><span class="workflow-icon">${homeIcon('chart')}</span><div class="workflow-analysis-tools"><button onclick="openTeacher()">${homeIcon('report')} <span><b>Teacher report</b><small>Report &amp; remedial plan</small></span><em>›</em></button><button onclick="growth()">${homeIcon('chart')} <span><b>Growth tracker</b><small>Chapter-by-chapter progress</small></span><em>›</em></button><button onclick="classInsights()">${homeIcon('classes')} <span><b>Class insights</b><small>Leaderboard and support risks</small></span><em>›</em></button></div></div>
        <button class="workflow-step workflow-parent" onclick="openParents()"><span class="workflow-top"><i>3</i><b>Parent communication</b></span><span class="workflow-icon">${homeIcon('parent')}</span><small>Share reports and support<br>student progress</small><strong>Open parent reports <b>→</b></strong></button>
        <div class="workflow-tools"><b>Other tools</b><button onclick="certificates()">${homeIcon('certificate')} <span>Certificates</span><em>›</em></button><button onclick="teacherActivation()">${homeIcon('activation')} <span>Teacher activation</span><em>›</em></button></div>
      </div></section>

      <section class="card home-recent-card">
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
      <div class="pad home-recent-table" style="padding-top:0"><div class="home-tests-table-head" aria-hidden="true"><span>Date</span><span>Class &amp; section</span><span>Subject</span><span>Test &amp; chapters</span><span>Attendance</span><span>Full marks</span><span>Average score</span><span>Status</span><span>Reports</span></div><div class="home-test-timeline">${recent||'<div class="home-empty">No tests found for this selection.</div>'}</div>${filteredTests.length>4?`<button class="home-view-all" onclick="toggleHomeTests()">${HOME_SHOW_ALL?'Show recent tests':'View all tests'} <b>→</b></button>`:''}</div>
      </section>
    </div>
  `);
}
window.setHomeClassFilter = value=>{ HOME_CLASS_FILTER=value; home(); };
window.setHomeSubjectFilter = value=>{ HOME_SUBJECT_FILTER=value; home(); };
window.toggleHomeTests = ()=>{ HOME_SHOW_ALL=!HOME_SHOW_ALL; home(); };
window.setHomeMonth = value=>{ HOME_PERIOD_MONTH=value; home(); };
window.setHomeYear = value=>{ HOME_PERIOD_YEAR=value; home(); };

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
    <button onclick="archiveStudent('${s.id}','${s.name.replace(/'/g,"")}')" style="color:var(--red)">Archive</button>
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
window.archiveStudent = async (id,name)=>{
  if(!confirm(`Archive ${name}? The student will be removed from the active Students list. Their marks and reports will be kept safely for recovery.`)) return;
  try{
    await DB.archiveStudent(id);
    resultsCache.clear();
    roster();
  }catch(e){alert(e.message||'Student could not be archived.');}
};
window.deleteStudent = async (id,name)=>{
  if(!confirm(`Permanently delete ${name}? Their marks and report entries will also be removed.`)) return;
  if(!confirm('Final confirmation: this cannot be undone.')) return;
  try{
    await DB.deleteStudent(id);
    resultsCache.clear();
    roster();
  }catch(e){alert(e.message||'Student could not be deleted.');}
};
