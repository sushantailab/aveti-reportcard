/* Monthly Student Progress Report.  The visual report remains the approved
 * prototype, while the student selector is populated from the live Student
 * Master so every enrolled student can be selected. */
const MONTHLY_SAMPLE = {
  student: 'Rahul Kumar', parent_phone:'919876543210', grade: 'Grade 7', section: 'B', school: 'St. Joseph School', month: 'July 2026',
  summary: 'Rahul has shown steady improvement this month. Science is his strongest subject, while English needs additional practice.',
  kpis: [['Overall Average','82%',''],['Tests Conducted','18',''],['Improvement','+7%',''],['Exam Attendance','100%',''],['Focus Subject','English',''],['Discipline','★★★★☆','']],
  subjects: [['Science','4','84%','72%','95%','Above class'],['Math','3','78%','74%','93%','Good'],['English','4','68%','71%','91%','Needs practice'],['SST','3','88%','75%','97%','Excellent'],['Hindi','2','82%','77%','94%','Good']],
  trend: {labels:['Science','Math','English','SST','Hindi'], student:[84,78,68,88,82], klass:[72,74,71,75,77], topper:[95,93,91,97,94]},
  highlights:[['Best performance','Science','Chapter 3','96%','best'],['Needs revision','English','Chapter 2','61%','needs'],['Most improved','Math','Chapter 4','+18%','improved']],
  insight:['Science performance has improved consistently.','English grammar needs more practice.','Homework submission is regular.','Continue attempting more chapter tests.'],
  plan:['Practice English reading','Revise Chapter 2','Solve weekly worksheets','Attempt more practice tests']
};
const MONTHLY_STUDENTS=[
  {name:'Rahul Kumar',className:'Grade 7',section:'B',school:'St. Joseph School',phone:'919876543210'},
  {name:'Ananya Das',className:'Grade 7',section:'A',school:'DAV Public School',phone:'919876543211'},
  {name:'Arjun Singh',className:'Grade 7',section:'B',school:'Kendriya Vidyalaya',phone:'919876543212'}
];
let MONTHLY_LIVE_STUDENTS=null;
const MONTHLY_FILTER={session:'',className:'',studentId:'',section:''};
const escMonthly=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const monthlyIcon=(name)=>({
  chart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9m5 10V5m5 14v-7m5 7H3"/></svg>',
  check:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
  trend:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16 5-5 4 3 7-8M15 6h5v5"/></svg>',
  attendance:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M16 14l2 2 3-4"/></svg>',
  focus:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.3 5.2 5.7.6-4.2 3.8 1.2 5.6-5-2.9-5 2.9 1.2-5.6L4 8.8l5.7-.6z"/></svg>',
  star:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2-5.5-2.9-5.5 2.9 1-6.2L3 9.6l6.2-.9z"/></svg>',
  badge:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2 2 3-.2.8 2.8 2.5 1.6-1.4 2.7.8 2.9-2.8.8-1.8 2.4-2.6-1.5-2.6 1.5-1.8-2.4-2.8-.8.8-2.9-1.4-2.7 2.5-1.6.8-2.8L10 5z"/><path d="m9 12 2 2 4-4"/></svg>'
}[name]||'');
function monthlyTrendSvg(){
  const t=MONTHLY_SAMPLE.trend, w=760,h=230,p={l:42,r:18,t:18,b:34}, max=100,min=0;
  const x=i=>p.l+i*(w-p.l-p.r)/(t.labels.length-1), y=v=>p.t+(max-v)*(h-p.t-p.b)/(max-min);
  const line=(arr,color,dash='')=>`<polyline points="${arr.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const dots=(arr,color)=>arr.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${color}"/>`).join('');
  return `<svg class="monthly-trend-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Student, class and topper growth trend"><g class="grid">${[0,25,50,75,100].map(v=>`<line x1="${p.l}" x2="${w-p.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${p.l-9}" y="${y(v)+4}" text-anchor="end">${v}%</text>`).join('')}</g>${line(t.topper,'#ed9a28','5 5')}${line(t.klass,'#347fd1','5 5')}${line(t.student,'#087454')}${dots(t.topper,'#ed9a28')}${dots(t.klass,'#347fd1')}${dots(t.student,'#087454')}${t.labels.map((l,i)=>`<text x="${x(i)}" y="${h-8}" text-anchor="middle">${l}</text>`).join('')}</svg>`;
}
async function monthlyLoadStudents(){
  if(MONTHLY_LIVE_STUDENTS) return MONTHLY_LIVE_STUDENTS;
  try {
    const rows=await DB.listStudents();
    MONTHLY_LIVE_STUDENTS=(rows||[]).filter(s=>!s.archived_at).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||'')));
  } catch(e) {
    console.warn('Monthly report could not load students',e);
    MONTHLY_LIVE_STUDENTS=[];
  }
  return MONTHLY_LIVE_STUDENTS;
}
function monthlyStudentClass(s){return s?.class_level==null?'':`Class ${s.class_level}`;}
function monthlyStudentSection(s){return s?.section||'All sections';}
function monthlyStudentSession(s){return s?.academic_session||currentSession();}
function monthlyFilteredStudents(students){
  return students.filter(s=>
    (!MONTHLY_FILTER.session||monthlyStudentSession(s)===MONTHLY_FILTER.session) &&
    (!MONTHLY_FILTER.className||monthlyStudentClass(s)===MONTHLY_FILTER.className) &&
    (!MONTHLY_FILTER.section||monthlyStudentSection(s)===MONTHLY_FILTER.section)
  );
}
function monthlyOption(value,label,selected){return `<option value="${escMonthly(value)}" ${selected?'selected':''}>${escMonthly(label)}</option>`;}
function monthlySelectorMarkup(students,current){
  const sessions=[...new Set(students.map(monthlyStudentSession))].sort((a,b)=>b.localeCompare(a));
  const session=MONTHLY_FILTER.session || (sessions.includes(currentSession())?currentSession():(sessions[0]||''));
  if(!MONTHLY_FILTER.session) MONTHLY_FILTER.session=session;
  const sessionRows=students.filter(s=>monthlyStudentSession(s)===session);
  const classes=[...new Set(sessionRows.map(monthlyStudentClass).filter(Boolean))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
  const cls=MONTHLY_FILTER.className&&classes.includes(MONTHLY_FILTER.className)?MONTHLY_FILTER.className:(classes[0]||'');
  if(!MONTHLY_FILTER.className) MONTHLY_FILTER.className=cls;
  const classRows=sessionRows.filter(s=>!cls||monthlyStudentClass(s)===cls);
  const sections=[...new Set(classRows.map(monthlyStudentSection))].sort();
  const sec=MONTHLY_FILTER.section&&sections.includes(MONTHLY_FILTER.section)?MONTHLY_FILTER.section:(sections[0]||'');
  if(!MONTHLY_FILTER.section) MONTHLY_FILTER.section=sec;
  const filtered=classRows.filter(s=>!sec||monthlyStudentSection(s)===sec);
  const selected=filtered.find(s=>String(s.id)===String(MONTHLY_FILTER.studentId))||filtered[0]||students[0];
  if(selected) MONTHLY_FILTER.studentId=selected.id;
  return {selected,html:`<div class="monthly-report-selectors">
    <label>Session <select onchange="monthlySetFilter('session',this.value)">${sessions.map(v=>monthlyOption(v,v,v===session)).join('')}</select></label>
    <label>Class <select onchange="monthlySetFilter('className',this.value)">${classes.map(v=>monthlyOption(v,v,v===cls)).join('')}</select></label>
    <label>Student <select onchange="monthlySetFilter('studentId',this.value)">${filtered.map(s=>monthlyOption(s.id,`${s.name||'Unnamed student'} · ${monthlyStudentSection(s)}`,String(s.id)===String(MONTHLY_FILTER.studentId))).join('')}</select></label>
    <label>Section <select onchange="monthlySetFilter('section',this.value)">${sections.map(v=>monthlyOption(v,v,v===sec)).join('')}</select></label>
  </div>`};
}
async function monthlyReport(){
  setCrumb('Monthly progress');
  const live=await monthlyLoadStudents();
  const selector=monthlySelectorMarkup(live,MONTHLY_SAMPLE.student);
  const selected=selector.selected;
  if(selected){
    MONTHLY_SAMPLE.student=selected.name||'Unnamed student';
    MONTHLY_SAMPLE.grade=monthlyStudentClass(selected)||MONTHLY_SAMPLE.grade;
    MONTHLY_SAMPLE.section=selected.section||MONTHLY_SAMPLE.section;
    MONTHLY_SAMPLE.school=selected.school||selected.school_name||MONTHLY_SAMPLE.school;
    MONTHLY_SAMPLE.parent_phone=selected.parent_phone||MONTHLY_SAMPLE.parent_phone;
  }
  const d=MONTHLY_SAMPLE;
  document.getElementById('app').innerHTML=`<main class="monthly-report" id="monthlyReport">
    <div class="monthly-actions">${selector.html}<div class="monthly-report-actions"><button class="monthly-whatsapp-button" onclick="monthlyShareWhatsApp()">💬 Share WhatsApp</button><button class="primary" onclick="printMonthlyReport()">🖨 Print / Save as PDF</button></div></div>
    <header class="monthly-cover"><div class="monthly-brand"><img src="assets/images/aveti-logo.png" alt="Aveti Learning Tuition Center"><div><div class="monthly-eyebrow">AVETI LEARNING TUITION CENTER</div><h1>MONTHLY PROGRESS REPORT</h1></div></div><span class="monthly-month-badge">${d.month}</span><div class="monthly-watermark">A</div></header>
    <section class="monthly-student-meta"><div><span>Student name</span><b>${d.student}</b></div><div><span>Learning at</span><b>Aveti Learning Tuition Center</b></div><div><span>Class</span><b>${d.grade}</b></div><div><span>Section</span><b>${d.section}</b></div><div><span>School</span><b>${d.school}</b></div><div><span>Report month</span><b>${d.month}</b></div></section>
    <section class="monthly-kpis">${d.kpis.map((k,i)=>`<article class="monthly-kpi kpi-${i}"><span class="monthly-kpi-icon">${monthlyIcon(['chart','check','trend','attendance','focus','star'][i])}</span><div><small>${k[0]}</small><strong>${k[1]}</strong></div></article>`).join('')}</section>
    <section class="monthly-panel"><div class="monthly-section-title"><h2>Subject performance summary</h2><span>July 2026</span></div><div class="monthly-table-wrap"><table class="monthly-subject-table"><thead><tr><th>Subject</th><th>Tests</th><th>Student average</th><th>Class average</th><th>Topper average</th><th>Status</th></tr></thead><tbody>${d.subjects.map(s=>`<tr><td><b>${s[0]}</b></td><td>${s[1]}</td><td>${s[2]}</td><td>${s[3]}</td><td>${s[4]}</td><td><span class="status-${s[5].replace(' ','-')}">${s[5]}</span></td></tr>`).join('')}</tbody></table></div></section>
    <section class="monthly-panel monthly-chart-panel"><div class="monthly-section-title"><h2>Student vs Class vs Topper</h2><div class="monthly-legend"><span class="student-key">Student</span><span class="class-key">Class average</span><span class="topper-key">Topper</span></div></div>${monthlyTrendSvg()}</section>
    <section class="monthly-highlights">${d.highlights.map(h=>`<article class="highlight-${h[4]}"><small>${h[0]}</small><b>${h[1]}</b><span>${h[2]}</span><strong>${h[3]}</strong></article>`).join('')}</section>
    <section class="monthly-panel monthly-insight-plan"><div><h2>Teacher insight</h2><ul>${d.insight.map(x=>`<li>${x}</li>`).join('')}</ul></div><div><h2>Next month plan</h2><div class="monthly-plan-grid">${d.plan.map((x,i)=>`<div><span>${i+1}</span><b>${x}</b></div>`).join('')}</div></div></section>
    <div class="monthly-page-break"></div>
    <section class="monthly-page-two"><h2>Overall summary</h2><div class="monthly-overall">${[['Overall progress','Excellent','good'],['Improvement','Good','good'],['Consistency','Very good','best'],['Discipline','Good','good']].map(x=>`<article class="${x[2]}"><small>${x[0]}</small><strong>${x[1]}</strong></article>`).join('')}</div><h2>Achievement badges</h2><div class="monthly-badges">${['Science star','Most improved student','Perfect exam attendance','Homework champion','Excellent discipline'].map((x,i)=>`<div><span>${monthlyIcon('badge')}</span><b>${x}</b></div>`).join('')}</div><section class="monthly-parent-guide"><h2>Parent action guide</h2><ul><li>Encourage daily reading.</li><li>Ask one question after every class.</li><li>Help your child attempt more practice tests.</li></ul></section><div class="monthly-signatures"><div><b>Academic head</b><strong>AVETI Learning Tuition Center</strong><hr><span>Generated: ${new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date())}</span></div></div></section>
  </main>`;
}
window.monthlySetFilter=(key,value)=>{MONTHLY_FILTER[key]=value; if(key==='session'){MONTHLY_FILTER.className='';MONTHLY_FILTER.section='';MONTHLY_FILTER.studentId='';} if(key==='className'){MONTHLY_FILTER.section='';MONTHLY_FILTER.studentId='';} if(key==='section') MONTHLY_FILTER.studentId=''; monthlyReport();};
window.monthlySelectStudent=name=>{const s=(MONTHLY_LIVE_STUDENTS||[]).find(x=>String(x.id)===String(name))||MONTHLY_STUDENTS.find(x=>x.name===name);if(!s)return;MONTHLY_FILTER.studentId=s.id||s.name;MONTHLY_SAMPLE.student=s.name;MONTHLY_SAMPLE.grade=s.className||monthlyStudentClass(s);MONTHLY_SAMPLE.section=s.section;MONTHLY_SAMPLE.school=s.school||s.school_name||MONTHLY_SAMPLE.school;MONTHLY_SAMPLE.parent_phone=s.phone||s.parent_phone||MONTHLY_SAMPLE.parent_phone;monthlyReport();};
window.monthlyShareWhatsApp=()=>{const d=MONTHLY_SAMPLE;const message=`Hello, here is ${d.student}'s Monthly Progress Report for ${d.month}. Overall average: ${d.kpis[0][1]}. Please find the attached PDF and encourage continued practice. 🌟`;window.open(`https://wa.me/${d.parent_phone}?text=${encodeURIComponent(message)}`,'_blank','noopener');};
function printMonthlyReport(){printReportWithFilename(`${String(MONTHLY_SAMPLE.grade||'Class').replace(/\s+/g,'-')}-${String(MONTHLY_SAMPLE.student||'Student').replace(/\s+/g,'-')}-Monthly-Progress-Report.pdf`)}
window.monthlyReport=monthlyReport; window.printMonthlyReport=printMonthlyReport;
