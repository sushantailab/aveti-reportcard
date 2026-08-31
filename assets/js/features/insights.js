/* ---------- CLASS INSIGHTS ---------- */
let INSIGHTS = { cls:'', section:'All', subject:'', showAll:false, showAllTrends:false };

const round1 = value => Math.round(value*10)/10;
const insightStatus = row => {
  if(row.attended<2) return {label:'Limited data',className:''};
  if(row.percent<25) return {label:'Critical',className:'danger'};
  if(row.percent<40) return {label:'Needs support',className:'warn'};
  if(row.percent<60) return {label:'Improving',className:''};
  return {label:'On track',className:'ok'};
};
const insightTrend = scores => {
  if(scores.length<2) return {label:'Not enough data',className:'',change:null};
  const latest = scores.at(-1);
  const previous = scores.at(-2);
  const change = round1(latest-previous);
  if(change>=5) return {label:`Improving +${change} pts`,className:'ok',change,latest,previous,detail:`Previous ${previous}% vs current ${latest}%`};
  if(change<=-5) return {label:`Declining ${change} pts`,className:'danger',change,latest,previous,detail:`Previous ${previous}% vs current ${latest}%`};
  return {label:'Stable',className:'stable',change,latest,previous,detail:`Previous ${previous}% vs current ${latest}%`};
};

function rankInsightRows(rows){
  let previousPercent = null;
  let previousRank = 0;
  return rows.map((row,index)=>{
    const rank = row.percent===previousPercent ? previousRank : index+1;
    previousPercent = row.percent;
    previousRank = rank;
    return {...row,rank};
  });
}

function chapterFocusForTests(tests, results, studentIds){
  const allowedStudents = new Set(studentIds);
  const grouped = new Map();
  tests.forEach(test=>{
    const chapterIds = [...new Set([...(test.chapter_ids||[]),test.chapter_id].filter(Boolean).map(String))];
    // A combined test has one overall score, so it cannot reliably diagnose an individual chapter.
    if(chapterIds.length>1 || (!chapterIds.length && !test.chapter_no)) return;
    const key = chapterIds[0] || `chapter-${test.chapter_no}`;
    const item = grouped.get(key) || {
      title:chapterDetail(test),
      chapterNo:Number(test.chapter_no)||0,
      appeared:0,
      applicable:0,
      marks:0,
      fullMarks:0
    };
    results.filter(result=>result.test_id===test.id && allowedStudents.has(result.student_id) && !result.na).forEach(result=>{
      item.applicable += 1;
      if(result.present && result.marks!=null){
        item.appeared += 1;
        item.marks += Number(result.marks||0);
        item.fullMarks += Number(test.full_marks||0);
      }
    });
    grouped.set(key,item);
  });
  return [...grouped.values()].map(item=>{
    const score = item.fullMarks ? round1(item.marks/item.fullMarks*100) : null;
    const attendance = item.applicable ? round1(item.appeared/item.applicable*100) : null;
    const lowAttendance = attendance!=null && attendance<75;
    const lowScore = score!=null && score<60;
    return {
      ...item, score, attendance, lowAttendance, lowScore,
      action:lowAttendance && lowScore ? 'Reteach + follow up' : lowAttendance ? 'Attendance follow-up' : 'Reteach',
      priority:(lowAttendance ? 200-attendance : 0) + (score==null ? 100 : 100-score)
    };
  }).filter(item=>item.lowAttendance || item.lowScore)
    .sort((a,b)=>b.priority-a.priority || a.chapterNo-b.chapterNo)
    .slice(0,5);
}

function buildSubjectInsights(tests, students, results, filters){
  const matchingTests = tests
    .filter(t=>
      String(t.class_level)===String(filters.cls) &&
      selectedTestSectionMatches(t.section,filters.section) &&
      t.subject===filters.subject
    )
    .sort((a,b)=>new Date(testDate(a))-new Date(testDate(b)));
  const testById = new Map(matchingTests.map(t=>[t.id,t]));
  const matchingStudents = students.filter(s=>
    String(s.class_level)===String(filters.cls) &&
    selectedSectionMatches(s.section,filters.section)
  );
  const rows = matchingStudents.map(student=>{
    const studentResults = results
      .filter(r=>r.student_id===student.id && testById.has(r.test_id))
      .map(r=>({...r,test:testById.get(r.test_id)}))
      .sort((a,b)=>new Date(testDate(a.test))-new Date(testDate(b.test)));
    const eligible = studentResults.filter(r=>!r.na);
    const appeared = eligible.filter(r=>r.present && r.marks!=null);
    const absent = eligible.filter(r=>!r.present);
    const marks = appeared.reduce((sum,r)=>sum+Number(r.marks||0),0);
    const fullMarks = appeared.reduce((sum,r)=>sum+Number(r.test.full_marks||0),0);
    const percent = fullMarks ? round1(marks/fullMarks*100) : null;
    const attendance = eligible.length ? round1(appeared.length/eligible.length*100) : null;
    const scores = appeared.map(r=>pct(r.marks,r.test.full_marks));
    return {
      studentId:student.id,
      name:student.name,
      section:student.section||'All',
      marks:round1(marks),
      fullMarks,
      percent,
      attended:appeared.length,
      absent:absent.length,
      eligible:eligible.length,
      attendance,
      trend:insightTrend(scores)
    };
  });
  const scored = rankInsightRows(rows
    .filter(r=>r.percent!=null)
    .sort((a,b)=>b.percent-a.percent || b.attended-a.attended || a.name.localeCompare(b.name)));
  const noScores = rows.filter(r=>r.percent==null).sort((a,b)=>a.name.localeCompare(b.name));
  const support = scored.filter(r=>r.attended>=2 && r.percent<40);
  const attendanceRisk = rows
    .filter(r=>r.eligible>=2 && (r.absent>=2 || r.attendance<75))
    .sort((a,b)=>a.attendance-b.attendance || b.absent-a.absent || a.name.localeCompare(b.name));
  const reliable = scored.filter(r=>r.attended>=2);
  const totalMarks = reliable.reduce((sum,r)=>sum+r.marks,0);
  const totalFullMarks = reliable.reduce((sum,r)=>sum+r.fullMarks,0);
  const applicableExams = rows.reduce((sum,row)=>sum+row.eligible,0);
  const attendedExams = rows.reduce((sum,row)=>sum+row.attended,0);
  const sectionLeaders = [...new Set(reliable.map(row=>row.section))].map(section=>
    reliable.filter(row=>row.section===section)[0]
  ).filter(Boolean);
  const chapterFocus = chapterFocusForTests(matchingTests,results,matchingStudents.map(student=>student.id));
  return {
    tests:matchingTests,
    rows:[...scored,...noScores],
    support,
    attendanceRisk,
    top:reliable[0]||null,
    classAverage:totalFullMarks ? round1(totalMarks/totalFullMarks*100) : null,
    examAttendance:applicableExams ? round1(attendedExams/applicableExams*100) : null,
    chapterFocus,
    sectionLeaders,
    topPerformers:scored.slice(0,10),
    // Keep the trend report in the same cumulative-score order as the leaderboard.
    trendRows:reliable,
    highestImprovement:reliable.filter(row=>row.trend.change!=null).sort((a,b)=>b.trend.change-a.trend.change)[0]||null,
    noAttempt:rows.filter(row=>row.eligible>0 && row.attended===0)
  };
}

async function classInsights(initial){
  setCrumb('Class insights');
  const tests = await DB.listTests();
  const students = await DB.listStudents();
  const results = await DB.allResults();
  const recent = tests[0];
  if(initial){
    INSIGHTS = {
      cls:String(initial.cls||INSIGHTS.cls||''),
      section:initial.section||'All',
      subject:initial.subject||INSIGHTS.subject||''
    };
  }
  if((!INSIGHTS.cls || !INSIGHTS.subject) && recent){
    INSIGHTS.cls = String(recent.class_level||'');
    INSIGHTS.section = recent.section||'All';
    INSIGHTS.subject = recent.subject||SUBJECTS[0];
  }
  if(!INSIGHTS.cls) INSIGHTS.cls = '1';
  if(!INSIGHTS.section) INSIGHTS.section = 'All';
  if(!INSIGHTS.subject) INSIGHTS.subject = SUBJECTS[0];
  // Keep the subject valid for the selected class (matches the Enter marks list).
  const allowedSubjects = subjectsForClass(INSIGHTS.cls);
  if(allowedSubjects.length && !allowedSubjects.includes(INSIGHTS.subject)) INSIGHTS.subject = allowedSubjects[0];
  renderClassInsights(buildSubjectInsights(tests,students,results,INSIGHTS));
}

function insightsFilterBar(){
  return `
    <div class="card pad insight-filter" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Class</label><select onchange="setInsightsFilter('cls',this.value)">${classOptions(INSIGHTS.cls)}</select></div>
        <div class="field"><label>Section</label><select onchange="setInsightsFilter('section',this.value)">${sectionOptions(INSIGHTS.section,true)}</select></div>
        <div class="field"><label>Subject</label><select onchange="setInsightsFilter('subject',this.value)">${subjectOptionsForClass(INSIGHTS.cls,INSIGHTS.subject)}</select></div>
      </div>
    </div>`;
}

function insightPill(meta){
  return `<span class="pill ${meta.className||''}" ${meta.detail?`title="${meta.detail}"`:''}>${meta.label}</span>`;
}

function insightIcon(kind){
  const paths={class:'<path d="M3 9l9-5 9 5-9 5-9-5zm4 3v4c3 2 6 2 10 0v-4"/>',subject:'<path d="M4 5.5C7 4 9.5 5 12 7c2.5-2 5-3 8-1.5v12c-3-1.5-5.5-.5-8 1-2.5-1.5-5-2.5-8-1v-12zM12 7v11"/>',session:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16m-11 4h.01m3 0h.01m3 0h.01"/>',exam:'<rect x="6" y="4" width="12" height="16" rx="2"/><path d="M9 4h6v3H9zm1 7h4m-4 4h4"/>',average:'<path d="M5 19V11m5 8V6m5 13V9m4 10H3"/>',leader:'<circle cx="12" cy="9" r="5"/><path d="M8 13l-2 8 6-3 6 3-2-8"/>',attendance:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M14.5 20c.2-2.7 1.4-4.3 3.7-4.8"/>',improve:'<path d="M4 17l6-6 4 4 6-8m-5 0h5v5"/>',flag:'<path d="M5 21V4m0 1h11l-1 5 1 5H5"/>'};
  return `<svg class="insight-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]||paths.exam}</svg>`;
}

function renderClassInsights(data){
  const included = [...new Set(data.tests.map(test=>testTypeLabel(test.test_type)))].join(' and ') || 'No exams yet';
  const visibleRows = INSIGHTS.showAll ? data.rows.filter(row=>row.percent!=null) : data.topPerformers;
  const leaderboard = visibleRows.length ? visibleRows.map((row,index)=>{
    const rankClass = row.rank===1?'gold':row.rank===2?'silver':row.rank===3?'bronze':'';
    return `<div class="insight-board-row ${index>=10?'insight-extra-row':''}"><div class="insight-rank ${rankClass}">${row.rank}</div><div class="insight-student"><b>${row.name}</b><div class="tiny faint">Section ${row.section}</div></div><div class="insight-score-bar"><span style="width:${row.percent}%"></span></div><div class="insight-score"><b>${row.percent}%</b></div></div>`;
  }).join('') : '<div class="empty-good">No scored exams yet.</div>';
  const sectionCards = data.sectionLeaders.map(row=>`<div class="insight-section-card"><div>${insightIcon('leader')}<span class="tiny">Section ${row.section} leader</span></div><b>${row.name}</b><div class="insight-section-score">${row.percent}%</div><div class="tiny faint">Average across all attended exams</div></div>`).join('') || '<div class="empty-good">Section leaders appear after two attended exams.</div>';
  const visibleTrendRows = INSIGHTS.showAllTrends ? data.trendRows : data.trendRows.slice(0,10);
  const trendRows = visibleTrendRows.map((row,index)=>`<div class="insight-trend-row ${index>=10?'insight-extra-row':''}"><div><b>${row.name}</b><div class="tiny faint">Section ${row.section}</div></div><div>${row.trend.previous}%</div><div>${row.trend.latest}%</div><div>${insightPill(row.trend)}</div></div>`).join('') || '<div class="empty-good">Trend appears after two attended exams.</div>';
  const list = (rows,render,empty) => rows.length ? `<ul class="insight-flag-list">${rows.map(render).join('')}</ul>` : `<div class="empty-good">${empty}</div>`;
  const support = list(data.support,row=>`<li>${row.name} (Section ${row.section}) · ${row.percent}%</li>`,'No students are below 40%.');
  const absent = list(data.attendanceRisk,row=>`<li>${row.name} (Section ${row.section}) · ${row.attended} / ${row.eligible}</li>`,'No regular exam absences.');
  const noAttempt = list(data.noAttempt,row=>`<li>${row.name} (Section ${row.section})</li>`,'Every student has attempted an exam.');
  const chapterFocus = data.chapterFocus.length ? data.chapterFocus.map(item=>`<div class="insight-chapter-row"><div><b>${item.title}</b><div class="tiny faint">Single-chapter exam</div></div><div><span class="tiny faint">Class score</span><b>${item.score==null?'—':item.score+'%'}</b></div><div><span class="tiny faint">Exam attendance</span><b>${item.attendance==null?'—':item.attendance+'%'}</b></div><div><span class="pill ${item.lowAttendance?'warn':'danger'}">${item.action}</span></div></div>`).join('') : '<div class="empty-good">No chapter currently needs attention.</div>';
  const improve = data.highestImprovement?.trend.change;
  show(`
    ${insightsFilterBar()}
    <div class="insight-report exact-insight-report">
      <div class="report-style-title">Class Insights — Student Performance Report</div>
      <div class="insight-print-head"><img class="insight-report-logo" alt="Aveti Learning Tuition Center logo" src="assets/images/aveti-logo.png"><div><div class="eyebrow">Aveti Learning Tuition Center</div><div class="insight-print-contact">${CONFIG.CENTRE.address}${CONFIG.CENTRE.phone?` · Ph ${CONFIG.CENTRE.phone}`:''}</div><h1>Class Insights —<br>Student Performance Report</h1></div><button class="insight-print-button" onclick="printInsightsReport()">🖨 Print / Save as PDF</button></div>
      <div class="insight-meta"><div>${insightIcon('class')}<span>Class<b>Class ${INSIGHTS.cls}</b></span></div><div>${insightIcon('subject')}<span>Subject<b>${subjectDisplayName(INSIGHTS.subject,INSIGHTS.cls)}</b></span></div><div>${insightIcon('exam')}<span>Exams included<b>${included}</b></span></div></div>
  <div class="insight-metrics exact-metrics"><div class="metric icon-metric">${insightIcon('average')}<span><div class="tiny">Class average</div><div class="n">${data.classAverage??'--'}${data.classAverage==null?'':'%'}</div><div class="tiny faint">All attended exams</div></span></div><div class="metric icon-metric">${insightIcon('improve')}<span><div class="tiny">Highest improvement</div><div class="n">${improve==null?'--':(improve>0?'+':'')+improve}</div><div class="tiny faint">percentage points</div></span></div><div class="metric icon-metric attendance-metric">${insightIcon('attendance')}<span><div class="tiny">Exam attendance</div><div class="n">${data.examAttendance??'--'}${data.examAttendance==null?'':'%'}</div><div class="tiny faint">of applicable exams attended</div></span></div></div>
      <div class="insight-main-grid"><div class="card pad insight-leaderboard"><div class="insight-heading"><div>${insightIcon('leader')}<h2>Top performers</h2></div><div class="muted small">Average percentage across all attended exams</div></div><div class="insight-axis"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>${leaderboard}${data.rows.filter(row=>row.percent!=null).length>10?`<button class="insight-show-all" onclick="setInsightsShowAll()">${INSIGHTS.showAll?'Show Top 10':'Show all students'}</button>`:''}</div><div class="card pad insight-sections"><div class="insight-heading"><div>${insightIcon('leader')}<h2>Section leaders</h2></div></div>${sectionCards}</div></div>
      <div class="card pad insight-trend-card"><div class="insight-heading"><div>${insightIcon('improve')}<h2>Performance trend</h2></div><div class="muted small">Top 10 by overall average · previous attended exam vs current attended exam</div></div><div class="insight-trend-head"><span>Student</span><span>Previous %</span><span>Current %</span><span>Change</span></div>${trendRows}${data.trendRows.length>10?`<button class="insight-show-all" onclick="setInsightsTrendShowAll()">${INSIGHTS.showAllTrends?'Show Top 10':'Show all students'}</button>`:''}</div>
      <div class="card pad insight-chapter-focus"><div class="insight-heading"><div>${insightIcon('flag')}<h2>Chapters needing attention</h2></div><div class="muted small">Lowest outcomes from single-chapter exams · scores exclude absences</div></div>${chapterFocus}</div>
      <div class="card pad insight-flags"><div class="insight-heading"><div>${insightIcon('flag')}<h2>Academic support flags</h2></div></div><div class="insight-flag-grid"><div class="insight-flag support"><h3>Below 40%</h3><div class="tiny">Students scoring below 40%</div>${support}</div><div class="insight-flag absent"><h3>Regularly absent</h3><div class="tiny">Attempted exams / applicable exams</div>${absent}</div><div class="insight-flag no-attempt"><h3>No exam attempt</h3><div class="tiny">No score in any applicable exam</div>${noAttempt}</div></div></div>
      <div class="tiny faint insight-note">Average percentage is calculated from scored marks across all attended exams. Trend changes are percentage points.</div>
    </div>`);
}

window.setInsightsFilter = (key,value)=>{
  INSIGHTS[key] = value;
  INSIGHTS.showAll = false;
  INSIGHTS.showAllTrends = false;
  classInsights();
};
window.setInsightsShowAll = ()=>{ INSIGHTS.showAll=!INSIGHTS.showAll; classInsights(); };
window.setInsightsTrendShowAll = ()=>{ INSIGHTS.showAllTrends=!INSIGHTS.showAllTrends; classInsights(); };
window.printInsightsReport = ()=>printReportWithFilename(reportPdfFilename(`Class-${INSIGHTS.cls}`,INSIGHTS.subject,'Class-Insights','Student-Performance-Report'));
window.classInsights = classInsights;
