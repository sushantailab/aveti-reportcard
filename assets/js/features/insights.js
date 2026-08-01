/* ---------- CLASS INSIGHTS ---------- */
let INSIGHTS = { cls:'', section:'All', subject:'' };

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
  const earlierAverage = round1(scores.slice(0,-1).reduce((sum,score)=>sum+score,0)/(scores.length-1));
  const change = round1(latest-earlierAverage);
  if(change>=5) return {label:`Improving +${change} pts`,className:'ok',change,latest,earlierAverage,detail:`Latest ${latest}% vs earlier average ${earlierAverage}%`};
  if(change<=-5) return {label:`Declining ${change} pts`,className:'danger',change,latest,earlierAverage,detail:`Latest ${latest}% vs earlier average ${earlierAverage}%`};
  return {label:'Stable',className:'stable',change,latest,earlierAverage,detail:`Latest ${latest}% vs earlier average ${earlierAverage}%`};
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
  const sectionLeaders = [...new Set(reliable.map(row=>row.section))].map(section=>
    reliable.filter(row=>row.section===section)[0]
  ).filter(Boolean);
  const studentIds = new Set(matchingStudents.map(student=>student.id));
  const latestChapterTests = new Map();
  matchingTests
    .filter(test=>testTypeLabel(test.test_type)==='Chapter End Test')
    .forEach(test=>{
      const key = String(test.chapter_id || test.chapter_no || test.id);
      const saved = latestChapterTests.get(key);
      if(!saved || new Date(testDate(test))>new Date(testDate(saved))) latestChapterTests.set(key,test);
    });
  const chapterPerformance = [...latestChapterTests.values()].map(test=>{
    const chapterResults = results.filter(result=>result.test_id===test.id && studentIds.has(result.student_id) && !result.na);
    const appearedResults = chapterResults.filter(result=>result.present && result.marks!=null);
    const scoreAverage = appearedResults.length
      ? round1(appearedResults.reduce((sum,result)=>sum+pct(result.marks,test.full_marks),0)/appearedResults.length)
      : null;
    const examAttendance = chapterResults.length ? round1(appearedResults.length/chapterResults.length*100) : null;
    return {test,chapter:chapterDetail(test),scoreAverage,examAttendance,appeared:appearedResults.length,eligible:chapterResults.length};
  });
  const totalEligible = rows.reduce((sum,row)=>sum+row.eligible,0);
  const totalAppeared = rows.reduce((sum,row)=>sum+row.attended,0);
  return {
    tests:matchingTests,
    rows:[...scored,...noScores],
    support,
    attendanceRisk,
    top:reliable[0]||null,
    classAverage:totalFullMarks ? round1(totalMarks/totalFullMarks*100) : null,
    sectionLeaders,
    topPerformers:scored.slice(0,6),
    trendRows:reliable.slice(0,5),
    highestImprovement:reliable.filter(row=>row.trend.change!=null).sort((a,b)=>b.trend.change-a.trend.change)[0]||null,
    noAttempt:rows.filter(row=>row.eligible>0 && row.attended===0),
    overallAttendance:totalEligible ? round1(totalAppeared/totalEligible*100) : null,
    totalAppeared,
    totalEligible,
    lowScoreChapters:chapterPerformance.filter(chapter=>chapter.scoreAverage!=null).sort((a,b)=>a.scoreAverage-b.scoreAverage).slice(0,3),
    lowAttendanceChapters:chapterPerformance.filter(chapter=>chapter.examAttendance!=null).sort((a,b)=>a.examAttendance-b.examAttendance).slice(0,3)
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
  renderClassInsights(buildSubjectInsights(tests,students,results,INSIGHTS));
}

function insightsFilterBar(){
  return `
    <div class="card pad insight-filter" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Class</label><select onchange="setInsightsFilter('cls',this.value)">${classOptions(INSIGHTS.cls)}</select></div>
        <div class="field"><label>Section</label><select onchange="setInsightsFilter('section',this.value)">${sectionOptions(INSIGHTS.section,true)}</select></div>
        <div class="field"><label>Subject</label><select onchange="setInsightsFilter('subject',this.value)">${subjectOptions(INSIGHTS.subject)}</select></div>
      </div>
    </div>`;
}

function insightPill(meta){
  return `<span class="pill ${meta.className||''}" ${meta.detail?`title="${meta.detail}"`:''}>${meta.label}</span>`;
}

function renderClassInsights(data){
  const testsLabel = `${data.tests.length} chapter test${data.tests.length===1?'':'s'} included`;
  const leaderboard = data.topPerformers.length ? data.topPerformers.map(row=>{
    const status = row.percent==null ? {label:'No exam score',className:''} : insightStatus(row);
    const rankClass = row.rank===1?'gold':row.rank===2?'silver':row.rank===3?'bronze':'';
    const scoreText = row.percent==null ? 'No score yet' : row.percent+'%';
    const attendanceText = row.eligible ? `${row.attended}/${row.eligible} exams · ${row.attendance}%` : 'No applicable exams';
    return `
      <div class="insight-board-row ${row.percent==null?'no-score':''}">
        <div class="insight-rank ${rankClass}">${row.rank||'—'}</div>
        <div class="insight-student"><b>${row.name}</b><div class="tiny faint">Section ${row.section} · Exam attendance: ${attendanceText}</div></div>
        <div class="insight-score-bar" aria-label="${row.name}: ${scoreText}"><span style="width:${row.percent??0}%"></span></div>
        <div class="insight-score"><b>${scoreText}</b><div class="tiny faint">${row.percent==null?'Not ranked':row.marks+'/'+row.fullMarks+' marks'}</div></div>
        <div class="insight-chips">${insightPill(status)}${insightPill(row.trend)}</div>
      </div>`;
  }).join('') : '<div class="muted small">No students found for this class and section.</div>';
  const supportRows = data.support.length ? data.support.map(row=>`
    <div class="risk-row">
      <div><b>${row.name}</b><div class="tiny faint">Section ${row.section} · ${row.attended} tests attended</div></div>
      <div class="num">${row.marks}/${row.fullMarks}</div>
      <div class="pill ${row.percent<25?'danger':'warn'}">${row.percent}%</div>
    </div>`).join('') : '<div class="empty-good">No student with at least two attended tests is below 40%.</div>';
  const absentRows = data.attendanceRisk.length ? data.attendanceRisk.map(row=>`
    <div class="risk-row">
      <div><b>${row.name}</b><div class="tiny faint">Section ${row.section}</div></div>
      <div class="small">${row.absent} missed of ${row.eligible} exams</div>
      <div class="pill danger">${row.attendance}% exam attendance</div>
    </div>`).join('') : '<div class="empty-good">No frequent absence pattern found yet.</div>';
  const leader = data.top ? `
    <div class="insight-leader-card">
      <div class="insight-trophy" aria-hidden="true">★</div>
      <div><div class="tiny">Overall leader</div><h2>${data.top.name}</h2><div class="small">Section ${data.top.section} · ${data.top.attended}/${data.top.eligible} exams attended</div></div>
      <div class="insight-leader-score"><b>${data.top.percent}%</b><span>${data.top.marks}/${data.top.fullMarks} marks</span></div>
    </div>` : '<div class="insight-leader-card empty"><div class="insight-trophy" aria-hidden="true">★</div><div><div class="tiny">Overall leader</div><h2>Not available yet</h2><div class="small">A leader appears after a student attends at least two exams.</div></div></div>';
  const sectionLeaders = INSIGHTS.section==='All' && data.sectionLeaders.length>1 ? `
    <div class="insight-section-leaders">${data.sectionLeaders.map(row=>`
      <div class="insight-section-card"><div class="tiny">Section ${row.section} leader</div><b>${row.name}</b><div class="insight-section-score">${row.percent}%</div><div class="tiny faint">Average across ${row.attended} exams</div></div>`).join('')}
    </div>` : '';
  const trendRows = data.trendRows.length ? data.trendRows.map(row=>`
    <div class="insight-trend-row"><div><b>${row.name}</b><div class="tiny faint">Section ${row.section}</div></div><div>${row.trend.earlierAverage}%<div class="tiny faint">Earlier average</div></div><div>${row.trend.latest}%<div class="tiny faint">Latest exam</div></div><div>${insightPill(row.trend)}</div></div>`).join('') : '<div class="empty-good">Trend appears after a student attends two exams.</div>';
  const attendanceRows = data.rows.filter(row=>row.eligible>0).slice().sort((a,b)=>(a.attendance??101)-(b.attendance??101)).slice(0,6).map(row=>`
    <div class="insight-attendance-row"><div><b>${row.name}</b><div class="tiny faint">Section ${row.section}</div></div><div class="pill ${row.attendance<75?'danger':'ok'}">${row.attended}/${row.eligible}</div><div class="small">${row.attendance}%</div></div>`).join('') || '<div class="empty-good">No exam attendance records yet.</div>';
  const chapterFocusRows = (chapters,mode) => chapters.length ? chapters.map(chapter=>`
    <div class="chapter-focus-row"><div><b>${chapter.chapter}</b><div class="tiny faint">${chapter.appeared}/${chapter.eligible} students appeared</div></div><div class="chapter-focus-score ${mode==='score' && chapter.scoreAverage<40?'danger':''}">${mode==='score' ? chapter.scoreAverage+'% average score' : chapter.examAttendance+'% exam attendance'}</div></div>`).join('') : '<div class="empty-good">No chapter-end test data is available yet.</div>';
  show(`
    ${insightsFilterBar()}
    <div class="insight-report">
      <div class="insight-print-head"><div><div class="eyebrow">Aveti Learning · Class Insights</div><h1>Subject performance report</h1><div class="muted small">Class ${INSIGHTS.cls} · ${INSIGHTS.section==='All'?'All sections':'Section '+INSIGHTS.section} · ${INSIGHTS.subject}</div></div><button class="insight-print-button" onclick="window.print()">🖨 Print / Save as PDF</button></div>
      <div class="insight-metrics">
        <div class="metric"><div class="tiny muted">Class average</div><div class="n">${data.classAverage??'--'}${data.classAverage==null?'':'%'}</div><div class="tiny faint">Students with 2+ scores</div></div>
        <div class="metric"><div class="tiny muted">Highest improvement</div><div class="n">${data.highestImprovement?.trend.change!=null?(data.highestImprovement.trend.change>0?'+':'')+data.highestImprovement.trend.change+' pts':'--'}</div><div class="tiny faint">${data.highestImprovement?.name||'Need two exams'}</div></div>
        <div class="metric"><div class="tiny muted">Exam attendance</div><div class="n">${data.overallAttendance??'--'}${data.overallAttendance==null?'':'%'}</div><div class="tiny faint">${data.totalAppeared}/${data.totalEligible} exams attended</div></div>
        <div class="metric alert"><div class="tiny muted">Needs support</div><div class="n">${data.support.length}</div><div class="tiny faint">Below 40% after 2+ exams</div></div>
        <div class="metric"><div class="tiny muted">Exam coverage</div><div class="n">${data.tests.length}</div><div class="tiny faint">Chapter tests included</div></div>
      </div>
      ${leader}
      ${sectionLeaders}
      <div class="card pad insight-chapter-focus">
        <div class="insight-heading"><h2 style="font-size:18px">Chapter focus for reteaching</h2><div class="muted small">Score and exam attendance are shown separately, so a high average is never mistaken for broad understanding.</div></div>
        <div class="insight-detail-grid">
          <div><h3>Lowest average scores</h3><div class="tiny muted" style="margin-bottom:7px">Students who appeared in the chapter-end test</div>${chapterFocusRows(data.lowScoreChapters,'score')}</div>
          <div><h3>Lowest exam attendance</h3><div class="tiny muted" style="margin-bottom:7px">Chapters where fewer students appeared</div>${chapterFocusRows(data.lowAttendanceChapters,'attendance')}</div>
        </div>
      </div>
      <div class="card pad insight-leaderboard" style="margin-bottom:14px">
      <div class="row between insight-heading">
        <div><h2 style="font-size:18px">Top performers</h2><div class="muted small">Top 6 cumulative scores across ${testsLabel}. Missed exams are excluded from marks.</div></div>
        <button class="insight-growth-button" onclick="growth()">View growth</button>
      </div>
      ${leaderboard}
        <div class="tiny faint insight-note">Trend compares the latest attended exam with the average of all earlier attended exams. Improving: +5 points or more; stable: within 5 points; declining: -5 points or more. Tied percentages share a rank.</div>
      </div>
      <div class="insight-detail-grid">
        <div class="card pad"><h2 style="font-size:18px">Performance trend</h2><div class="muted small" style="margin-bottom:8px">Earlier average vs latest attended exam</div>${trendRows}</div>
        <div class="card pad"><h2 style="font-size:18px">Exam attendance</h2><div class="muted small" style="margin-bottom:8px">Attended / applicable exams</div>${attendanceRows}</div>
      </div>
      <div class="insight-risk-grid">
        <div class="card pad">
          <h2 style="font-size:18px">Needs academic support</h2>
          <div class="muted small" style="margin-bottom:10px">Subject average below 40%, based on at least two attended exams.</div>
          ${supportRows}
        </div>
        <div class="card pad">
          <h2 style="font-size:18px">Exam attendance watch</h2>
          <div class="muted small" style="margin-bottom:10px">Two or more missed exams, or exam attendance below 75%.</div>
          ${absentRows}
        </div>
      </div>
    </div>
  `);
}

window.setInsightsFilter = (key,value)=>{
  INSIGHTS[key] = value;
  classInsights();
};
window.classInsights = classInsights;
