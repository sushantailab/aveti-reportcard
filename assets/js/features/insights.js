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
  if(scores.length<2) return {label:'Not enough data',className:''};
  const change = round1(scores[scores.length-1]-scores[scores.length-2]);
  if(change>=5) return {label:`Improving +${change}%`,className:'ok'};
  if(change<=-5) return {label:`Declining ${change}%`,className:'danger'};
  return {label:'Stable',className:''};
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
  return {
    tests:matchingTests,
    rows:[...scored,...noScores],
    support,
    attendanceRisk,
    top:reliable[0]||null,
    classAverage:totalFullMarks ? round1(totalMarks/totalFullMarks*100) : null
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
    <div class="card pad" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Class</label><select onchange="setInsightsFilter('cls',this.value)">${classOptions(INSIGHTS.cls)}</select></div>
        <div class="field"><label>Section</label><select onchange="setInsightsFilter('section',this.value)">${sectionOptions(INSIGHTS.section,true)}</select></div>
        <div class="field"><label>Subject</label><select onchange="setInsightsFilter('subject',this.value)">${subjectOptions(INSIGHTS.subject)}</select></div>
      </div>
    </div>`;
}

function insightPill(meta){
  return `<span class="pill ${meta.className||''}">${meta.label}</span>`;
}

function renderClassInsights(data){
  const testsLabel = `${data.tests.length} chapter test${data.tests.length===1?'':'s'} included`;
  const leaderboard = data.rows.length ? data.rows.map(row=>{
    const status = row.percent==null ? {label:'No marks',className:''} : insightStatus(row);
    return `
      <div class="insight-row">
        <div class="insight-rank">${row.rank||'--'}</div>
        <div><b>${row.name}</b><div class="tiny faint">Section ${row.section}</div></div>
        <div><div class="num">${row.percent==null?'--':row.marks+'/'+row.fullMarks}</div><div class="tiny faint">${row.percent==null?'No score':row.percent+'%'}</div></div>
        <div><div class="small">${row.attended}/${row.eligible} attended</div><div class="tiny faint">${row.absent} absent</div></div>
        <div>${insightPill(status)}</div>
        <div>${insightPill(row.trend)}</div>
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
      <div class="small">${row.absent} absent of ${row.eligible}</div>
      <div class="pill danger">${row.attendance}% attendance</div>
    </div>`).join('') : '<div class="empty-good">No frequent absence pattern found yet.</div>';
  show(`
    ${insightsFilterBar()}
    <div class="insight-metrics">
      <div class="metric"><div class="tiny muted">Class average</div><div class="n">${data.classAverage??'--'}${data.classAverage==null?'':'%'}</div><div class="tiny faint">Students with 2+ scores</div></div>
      <div class="metric"><div class="tiny muted">Top performer</div><div class="n">${data.top?data.top.percent+'%':'--'}</div><div class="tiny faint">${data.top?data.top.name:'Need 2 attended tests'}</div></div>
      <div class="metric alert"><div class="tiny muted">Below 40%</div><div class="n">${data.support.length}</div><div class="tiny faint">Need academic support</div></div>
      <div class="metric alert"><div class="tiny muted">Attendance risk</div><div class="n">${data.attendanceRisk.length}</div><div class="tiny faint">2+ absences or below 75%</div></div>
      <div class="metric"><div class="tiny muted">Coverage</div><div class="n">${data.tests.length}</div><div class="tiny faint">Chapter tests</div></div>
    </div>
    <div class="card pad" style="margin-bottom:14px">
      <div class="row between insight-heading">
        <div><h2 style="font-size:18px">${INSIGHTS.subject} leaderboard</h2><div class="muted small">Cumulative marks across ${testsLabel}; absence is not scored as zero.</div></div>
        <button onclick="growth()">View growth</button>
      </div>
      <div class="insight-row insight-head">
        <div>Rank</div><div>Student</div><div>Marks secured</div><div>Attendance</div><div>Status</div><div>Recent trend</div>
      </div>
      ${leaderboard}
      <div class="tiny faint insight-note">Ranking requires at least one score. Top-performer and class-average cards require at least two attended tests. Tied percentages share a rank.</div>
    </div>
    <div class="insight-risk-grid">
      <div class="card pad">
        <h2 style="font-size:18px">Needs academic support</h2>
        <div class="muted small" style="margin-bottom:10px">Subject average below 40%, based on at least two attended tests.</div>
        ${supportRows}
      </div>
      <div class="card pad">
        <h2 style="font-size:18px">Regularly absent</h2>
        <div class="muted small" style="margin-bottom:10px">Two or more absences, or attendance below 75%.</div>
        ${absentRows}
      </div>
    </div>
  `);
}

window.setInsightsFilter = (key,value)=>{
  INSIGHTS[key] = value;
  classInsights();
};
window.classInsights = classInsights;
