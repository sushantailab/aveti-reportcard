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
  ,decline:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 7 6 6 4-4 6 6M15 15h5v-5"/></svg>'
  ,trophy:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v5M8 21h8M9 18h6"/></svg>'
  ,target:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/></svg>'
  ,book:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21zM4 5.5V21M8 7h8M8 11h8"/></svg>'
}[name]||'');
function monthlyTrendSvg(trend=MONTHLY_SAMPLE.trend){
  const t=trend||{labels:[],student:[],klass:[],topper:[]}, w=760,h=230,p={l:42,r:18,t:18,b:34}, max=100,min=0;
  const x=i=>p.l+i*(w-p.l-p.r)/Math.max(1,t.labels.length-1), y=v=>p.t+(max-v)*(h-p.t-p.b)/(max-min);
  const line=(arr,color,dash='')=>`<polyline points="${arr.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${color}" stroke-width="3" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
  const dots=(arr,color)=>arr.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="4" fill="${color}"/>`).join('');
  return `<svg class="monthly-trend-svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="Student, class and topper growth trend"><g class="grid">${[0,25,50,75,100].map(v=>`<line x1="${p.l}" x2="${w-p.r}" y1="${y(v)}" y2="${y(v)}"/><text x="${p.l-9}" y="${y(v)+4}" text-anchor="end">${v}%</text>`).join('')}</g>${line(t.topper,'#ed9a28','5 5')}${line(t.klass,'#347fd1','5 5')}${line(t.student,'#087454')}${dots(t.topper,'#ed9a28')}${dots(t.klass,'#347fd1')}${dots(t.student,'#087454')}${t.labels.map((l,i)=>`<text x="${x(i)}" y="${h-8}" text-anchor="middle">${l}</text>`).join('')}</svg>`;
}
const monthlyPercent=(marks,full)=>Number.isFinite(Number(marks))&&Number(full)>0?Math.round(Number(marks)/Number(full)*1000)/10:null;
const monthlyMonthKey=date=>{const d=new Date(date);return Number.isNaN(d.getTime())?'':`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;};
const monthlyMonthLabel=key=>{if(!key)return 'No test data';const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('en-IN',{month:'long',year:'numeric'}).format(new Date(y,m-1,1));};
const monthlyShortSubject=subject=>({Mathematics:'Math','Social Science':'SST','Social Science I':'SST I','Social Science II':'SST II'}[subject]||subject);
async function monthlyBuildData(selected,students){
  const base=MONTHLY_SAMPLE;
  if(!selected) return {...base,subjects:[],trend:{labels:[],student:[],klass:[],topper:[]},month:'No test data',kpis:[['Overall Average','—',''],['Tests Conducted','0',''],['Improvement','—',''],['Exam Attendance','—',''],['Focus Subject','—',''],['Discipline','Good','']],highlights:[],insight:['No tests are available for this student yet.','Add an Aveti test to begin monthly tracking.','Monthly insights will appear after marks are entered.','Continue attempting chapter tests.'],plan:['Enter the next assessment marks','Review the first available report','Schedule targeted revision','Attempt more practice tests']};
  const session=monthlyStudentSession(selected), cls=String(selected.class_level);
  const allTests=(await DB.listTests()).filter(t=>String(t.class_level)===cls&&(t.academic_session||session)===session&&(!t.section||t.section==='All'||t.section===selected.section));
  const results=await DB.allResults();
  const latestKey=allTests.map(t=>monthlyMonthKey(t.test_date)).filter(Boolean).sort().pop()||'';
  const periodTests=allTests.filter(t=>monthlyMonthKey(t.test_date)===latestKey);
  const classStudents=students.filter(s=>monthlyStudentSession(s)===session&&String(s.class_level)===cls&&(!selected.section||monthlyStudentSection(s)===monthlyStudentSection(selected)));
  const resultFor=(test,student)=>results.find(r=>r.test_id===test.id&&r.student_id===student.id);
  const scored=(r,t)=>r&&!r.na&&r.present!==false&&r.marks!=null&&monthlyPercent(r.marks,t.full_marks)!=null;
  const subjectNames=[...new Set(periodTests.map(t=>t.subject).filter(Boolean))].filter(subject=>periodTests.some(t=>t.subject===subject&&classStudents.some(s=>scored(resultFor(t,s),t))));
  const subjectRows=subjectNames.map(subject=>{
    const subjectTests=periodTests.filter(t=>t.subject===subject);
    const studentScores=subjectTests.map(t=>{const r=resultFor(t,selected);return scored(r,t)?monthlyPercent(r.marks,t.full_marks):null}).filter(v=>v!=null);
    const classScores=subjectTests.flatMap(t=>classStudents.map(s=>{const r=resultFor(t,s);return scored(r,t)?monthlyPercent(r.marks,t.full_marks):null})).filter(v=>v!=null);
    const perStudent=classStudents.map(s=>subjectTests.map(t=>{const r=resultFor(t,s);return scored(r,t)?monthlyPercent(r.marks,t.full_marks):null}).filter(v=>v!=null)).filter(a=>a.length).map(a=>a.reduce((x,y)=>x+y,0)/a.length);
    const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:null;
    const studentAvg=avg(studentScores), classAvg=avg(classScores), topper=perStudent.length?Math.round(Math.max(...perStudent)*10)/10:null;
    const status=studentAvg==null?'Awaiting marks':studentAvg>=80?'Above class':studentAvg>=60?'Good':'Needs practice';
    return [subject,subjectTests.length,studentAvg==null?'—':`${studentAvg}%`,classAvg==null?'—':`${classAvg}%`,topper==null?'—':`${topper}%`,status];
  });
  const currentScores=periodTests.map(t=>{const r=resultFor(t,selected);return scored(r,t)?monthlyPercent(r.marks,t.full_marks):null}).filter(v=>v!=null);
  const attempted=periodTests.flatMap(t=>classStudents.map(s=>resultFor(t,s))).filter(Boolean), attended=attempted.filter(r=>r.present!==false&&!r.na&&r.marks!=null).length;
  const avg=a=>a.length?Math.round(a.reduce((x,y)=>x+y,0)/a.length*10)/10:null;
  const overall=avg(currentScores), attendance=attempted.length?Math.round(attended/attempted.length*1000)/10:null;
  const previousKey=allTests.map(t=>monthlyMonthKey(t.test_date)).filter(k=>k&&k<latestKey).sort().pop();
  const previousTests=allTests.filter(t=>monthlyMonthKey(t.test_date)===previousKey);
  const previousScores=previousTests.map(t=>{const r=resultFor(t,selected);return scored(r,t)?monthlyPercent(r.marks,t.full_marks):null}).filter(v=>v!=null);
  const improvement=overall!=null&&previousScores.length?Math.round((overall-avg(previousScores))*10)/10:null;
  const sorted=subjectRows.filter(s=>s[2]!=='—').sort((a,b)=>parseFloat(a[2])-parseFloat(b[2]));
  const best=sorted[sorted.length-1], lowest=sorted[0];
  const needs=lowest&&best&&lowest[0]!==best[0]&&parseFloat(lowest[2])<60?lowest:null;
  const discipline='Good';
  const attendedLabel=`${currentScores.length} of ${periodTests.length} assessment${periodTests.length===1?'':'s'} attended`;
  return {...base,month:monthlyMonthLabel(latestKey),summary:overall==null?'No scored assessments are available for this student in the selected period.':`${selected.name} has an overall average of ${overall}% (${attendedLabel}). ${best?`${best[0]} is the strongest subject.`:''} ${needs?`${needs[0]} needs additional practice.`:'No separate subject needs revision yet.'}`,kpis:[['Overall Average',overall==null?'—':`${overall}%`,''],['Tests Conducted',String(periodTests.length),''],['Improvement',improvement==null?'—':`${improvement>=0?'+':''}${improvement}%`,''],['Exam Attendance',attendance==null?'—':`${attendance}%`,''],['Focus Subject',needs?needs[0]:'No single focus',''],['Discipline',discipline,'']],subjects:subjectRows,trend:{labels:subjectRows.map(s=>monthlyShortSubject(s[0])),student:subjectRows.map(s=>parseFloat(s[2])||0),klass:subjectRows.map(s=>parseFloat(s[3])||0),topper:subjectRows.map(s=>parseFloat(s[4])||0)},highlights:[],insight:[best?`${best[0]} is the strongest subject this month.`:'No strength identified yet.',needs?`${needs[0]} needs more practice.`:'No subject is currently below the revision threshold.',improvement!=null?`Performance changed ${improvement>=0?'up':'down'} ${Math.abs(improvement)} points from the previous month.`:'Keep attempting regular chapter tests.'],plan:[needs?`Revise ${needs[0]} concepts`:'Review the next available chapter','Practise weekly worksheets','Discuss progress with the teacher','Attempt more practice tests']};
}
function monthlyProgressBar(value,color='#0f6b4b'){
  const numeric=Math.max(0,Math.min(100,parseFloat(String(value).replace('%',''))||0));
  return `<span class="monthly-progress"><i style="width:${numeric}%;background:${color}"></i><b>${escMonthly(value)}</b></span>`;
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
    <label>Student <select onchange="monthlySetFilter('studentId',this.value)">${filtered.map(s=>monthlyOption(s.id,s.name||'Unnamed student',String(s.id)===String(MONTHLY_FILTER.studentId))).join('')}</select></label>
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
    MONTHLY_SAMPLE.school=selected.school||selected.school_name||'';
    MONTHLY_SAMPLE.parent_phone=selected.parent_phone||MONTHLY_SAMPLE.parent_phone;
  }
  Object.assign(MONTHLY_SAMPLE,await monthlyBuildData(selected,live));
  const d=MONTHLY_SAMPLE;
  document.getElementById('app').innerHTML=`<main class="monthly-report" id="monthlyReport">
    <div class="monthly-actions">${selector.html}<div class="monthly-report-actions"><button class="monthly-whatsapp-button" onclick="monthlyShareWhatsApp()">💬 Share WhatsApp</button><button class="primary" onclick="printMonthlyReport()">🖨 Print / Save as PDF</button></div></div>
    <header class="monthly-cover"><div class="monthly-brand"><img src="assets/images/aveti-logo.png" alt="Aveti Learning Tuition Center"><div><div class="monthly-eyebrow">AVETI LEARNING TUITION CENTER</div><div class="monthly-brand-contact">${escMonthly(CONFIG.CENTRE?.address||'M74, Baramunda Housing Board Colony')} · Ph ${escMonthly(CONFIG.CENTRE?.phone||'98619 27954')}</div><h1>MONTHLY PROGRESS REPORT</h1></div></div><span class="monthly-month-badge">${d.month}</span><div class="monthly-watermark">A</div></header>
    <section class="monthly-student-meta"><div><span>Student name</span><b>${escMonthly(d.student||'Not available')}</b></div><div><span>Learning at</span><b>Aveti Learning Tuition Center</b></div><div><span>Class</span><b>${escMonthly(d.grade||'Not available')}</b></div><div><span>Section</span><b>${escMonthly(d.section||'Not available')}</b></div><div><span>School</span><b>${escMonthly(d.school||'Not available')}</b></div><div><span>Report month</span><b>${escMonthly(d.month||'Not available')}</b></div></section>
    <section class="monthly-summary"><h2>Parent summary</h2><p>${escMonthly(d.summary)}</p></section>
    <section class="monthly-kpis">${d.kpis.map((k,i)=>{const negative=i===2&&String(k[1]).trim().startsWith('-');return `<article class="monthly-kpi kpi-${i} ${negative?'kpi-negative':i===2?'kpi-positive':''}"><span class="monthly-kpi-icon">${monthlyIcon(i===2&&negative?'decline':['chart','check','trend','attendance','focus','star'][i])}</span><div><small>${k[0]}</small><strong>${escMonthly(k[1])}</strong></div></article>`;}).join('')}</section>
    <section class="monthly-panel"><div class="monthly-section-title"><h2>Subject performance summary</h2><span>July 2026</span></div><div class="monthly-table-wrap"><table class="monthly-subject-table"><thead><tr><th>Subject</th><th>Tests</th><th>Student average</th><th>Class average</th><th>Topper average</th><th>Status</th></tr></thead><tbody>${d.subjects.map(s=>`<tr><td><b>${s[0]}</b></td><td>${s[1]}</td><td>${monthlyProgressBar(s[2],'#0f6b4b')}</td><td>${monthlyProgressBar(s[3],'#1e5eff')}</td><td>${monthlyProgressBar(s[4],'#f59e0b')}</td><td><span class="status-${s[5].replace(' ','-')}">${s[5]}</span></td></tr>`).join('')}</tbody></table></div></section>
    <section class="monthly-panel monthly-chart-panel"><div class="monthly-section-title"><h2>Student vs Class vs Topper</h2><div class="monthly-legend"><span class="student-key">Student</span><span class="class-key">Class average</span><span class="topper-key">Topper</span></div></div>${monthlyTrendSvg(d.trend)}</section>
    <div class="monthly-page-break"></div>
    <section class="monthly-page-two"><section class="monthly-panel monthly-insight-plan"><div><h2>Teacher insight</h2><div class="monthly-insight-cards"><article class="insight-strength"><b>Strength</b><span>${escMonthly(d.insight[0]||'Not available')}</span></article><article class="insight-focus"><b>Focus</b><span>${escMonthly(d.insight[1]||'Not available')}</span></article><article class="insight-recommendation"><b>Recommendation</b><span>${escMonthly(d.insight[2]||'Not available')}</span></article></div></div><div><h2>Next month plan</h2><div class="monthly-plan-grid">${d.plan.map((x,i)=>`<div><span>${i+1}</span><b>${x}</b></div>`).join('')}</div></div></section><section class="monthly-parent-guide"><h2>Parent action guide</h2><ul><li>Encourage daily reading.</li><li>Ask one question after every class.</li><li>Help your child attempt more practice tests.</li></ul></section><div class="monthly-signatures"><div><b>Academic head</b><strong>AVETI Learning Tuition Center</strong><hr><span>Generated: ${new Intl.DateTimeFormat('en-IN',{day:'2-digit',month:'short',year:'numeric'}).format(new Date())}</span></div></div></section>
  </main>`;
}
window.monthlySetFilter=(key,value)=>{MONTHLY_FILTER[key]=value; if(key==='session'){MONTHLY_FILTER.className='';MONTHLY_FILTER.section='';MONTHLY_FILTER.studentId='';} if(key==='className'){MONTHLY_FILTER.section='';MONTHLY_FILTER.studentId='';} if(key==='section') MONTHLY_FILTER.studentId=''; monthlyReport();};
window.monthlySelectStudent=name=>{const s=(MONTHLY_LIVE_STUDENTS||[]).find(x=>String(x.id)===String(name))||MONTHLY_STUDENTS.find(x=>x.name===name);if(!s)return;MONTHLY_FILTER.studentId=s.id||s.name;MONTHLY_SAMPLE.student=s.name;MONTHLY_SAMPLE.grade=s.className||monthlyStudentClass(s);MONTHLY_SAMPLE.section=s.section;MONTHLY_SAMPLE.school=s.school||s.school_name||MONTHLY_SAMPLE.school;MONTHLY_SAMPLE.parent_phone=s.phone||s.parent_phone||MONTHLY_SAMPLE.parent_phone;monthlyReport();};
window.monthlyShareWhatsApp=()=>{const d=MONTHLY_SAMPLE;const message=`Hello, here is ${d.student}'s Monthly Progress Report for ${d.month}. Overall average: ${d.kpis[0][1]}. Please find the attached PDF and encourage continued practice. 🌟`;window.open(`https://wa.me/${d.parent_phone}?text=${encodeURIComponent(message)}`,'_blank','noopener');};
function printMonthlyReport(){printReportWithFilename(`${String(MONTHLY_SAMPLE.grade||'Class').replace(/\s+/g,'-')}-${String(MONTHLY_SAMPLE.student||'Student').replace(/\s+/g,'-')}-Monthly-Progress-Report.pdf`)}
window.monthlyReport=monthlyReport; window.printMonthlyReport=printMonthlyReport;
