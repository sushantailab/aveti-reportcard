/* ---------- TEACHER REPORT ---------- */
let TEACHER_FILTER = { cls:'', section:'', subject:'', testType:'', testId:'' };
let TEACHER_SHOW_ALL = false;
let TEACHER_TREND_SHOW_ALL = false;

function parentMessageChapter(test){
  const no = String(test.chapter_no||'').trim();
  const name = normalizeText(test.chapter_name);
  if(!name) return `Chapter ${no}`;
  const compact = name.toLowerCase().replace(/[\s-]/g,'');
  if(compact===`ch${no}` || compact===`chapter${no}`) return `Chapter ${no}`;
  return `Chapter ${no}: ${name}`;
}

function parentMessageChapters(test, chapterNumbers=[]){
  const numbers=[...new Set((chapterNumbers.length?chapterNumbers:[test.chapter_no]).map(Number).filter(Number.isFinite))];
  if(numbers.length<2) return parentMessageChapter(test);
  const joined=numbers.length===2 ? numbers.join(' and ') : `${numbers.slice(0,-1).join(', ')} and ${numbers.at(-1)}`;
  return `Chapters: ${joined}`;
}

const isCET = test => testTypeLabel(test.test_type)==='Chapter End Test';
const periodicNextStep = 'Revisit the lesson notes and practise case-based and AR questions. Contact the centre if support is needed.';

function parentNotificationContext(test, studentId, tests, results){
  const currentDate = new Date(testDate(test)).getTime();
  const earlierTests = tests
    .filter(t=>
      t.id!==test.id &&
      String(t.class_level)===String(test.class_level) &&
      t.subject===test.subject &&
      new Date(testDate(t)).getTime()<currentDate
    )
    .sort((a,b)=>new Date(testDate(b))-new Date(testDate(a)));
  for(const earlier of earlierTests){
    const result = results.find(r=>
      r.test_id===earlier.id &&
      r.student_id===studentId &&
      !r.na &&
      r.present &&
      r.marks!=null
    );
    if(result) return {previousPercent:pct(result.marks,earlier.full_marks)};
  }
  return {previousPercent:null};
}

function parentInsightCopy(studentName, percent, classAvg, previousPercent){
  const name = parentMessageName(studentName);
  if(previousPercent!=null){
    const change = Math.round((percent-previousPercent)*10)/10;
    if(change>=5){
      if(percent<40){
        return {
          insight:`${name} improved by ${change} percentage points and is moving in the right direction.`,
          action:'Revisit the lesson notes and practise 5 basic questions. Contact the centre if support is needed.'
        };
      }
      if(percent<60){
        return {
          insight:`${name} improved by ${change} percentage points from the previous test.`,
          action:'Build on this progress by revising the key concepts and completing 5 practice questions.'
        };
      }
      return {
        insight:`${name} improved by ${change} percentage points from the previous test.`,
        action:'Keep the momentum: review missed questions and practise 5 similar ones.'
      };
    }
  }
  const classGap = classAvg==null ? null : Math.round((percent-classAvg)*10)/10;
  if(percent>=80){
    return {
      insight:`Strong understanding${classGap>0?`; ${classGap} points above the class average`:''}.`,
      action:'Review any missed question and explain one key idea at home.'
    };
  }
  if(percent>=60){
    return {
      insight:'A solid result with a good grasp of the chapter.',
      action:'Review missed questions once and practise 3 similar questions.'
    };
  }
  if(percent>=40){
    return {
      insight:'The basics are developing, with clear room to improve.',
      action:'Revise the key concepts and complete 5 practice questions this week.'
    };
  }
  return {
    insight:'This chapter needs more practice. Focused revision can build confidence.',
    action:'Revisit the lesson notes and practise 5 basic questions. Contact the centre if support is needed.'
  };
}

function parentWhatsAppMessage(test, studentName, result, classAvg, context={}){
  const isNA = !!result.na;
  const isAbsent = !isNA && !result.present;
  const name = studentName||'Student';
  const score = isAbsent
    ? 'Absent 🔴'
    : isNA
      ? 'N.A.'
      : `${result.marks}/${test.full_marks} (${pct(result.marks,test.full_marks)}%)`;
  const periodic = !isCET(test);
  const lines = [
    periodic ? `*Aveti ${testTypeLabel(test.test_type)} Results*` : '*Aveti CET Learning Update*',
    '',
    `Student: ${name}`,
    `• Subject: ${test.subject}`,
    `• ${periodic?parentMessageChapters(test,context.chapterNumbers):parentMessageChapter(test)}`,
    `• Score: ${score}`
  ];
  if(isAbsent){
    lines.push(`• Insight: No score was recorded because ${parentMessageName(name)} was absent.`);
    lines.push('• Next step: Complete the chapter catch-up and contact the centre to arrange the next assessment.');
  }else if(isNA){
    lines.push('• Insight: This test was marked not applicable.');
    lines.push('• Next step: No action is needed unless this seems incorrect.');
  }else{
    const p = pct(result.marks,test.full_marks);
    const copy = parentInsightCopy(name,p,classAvg,context.previousPercent);
    if(periodic){
      copy.insight=copy.insight.replace(/^This chapter\b/i,'These chapters');
      copy.action=periodicNextStep;
    }
    if(classAvg!=null) lines.push(`• Class Average: ${classAvg}%`);
    lines.push(`• Insight: ${copy.insight}`);
    lines.push(`• Next step: ${copy.action}`);
  }
  lines.push('',CONFIG.CENTRE.name);
  return lines.join('\n');
}

async function openTeacher(testId){
  const tests = await DB.listTests();
  setCrumb('Teacher report');
  if(testId){
    const selected = tests.find(t=>t.id===testId);
    if(selected){
      TEACHER_FILTER = {
        cls:String(selected.class_level||''),
        section:selected.section||'All',
        subject:selected.subject||'',
        testType:testTypeLabel(selected.test_type),
        testId:selected.id
      };
      CURRENT_TEST = selected.id;
    }
  } else if(!TEACHER_FILTER.testId && tests[0]){
    const recent = tests[0];
    TEACHER_FILTER = {
        cls:String(recent.class_level||''),
        section:recent.section||'All',
        subject:recent.subject||'',
        testType:testTypeLabel(recent.test_type),
        testId:recent.id
    };
  }
  renderTeacher(tests);
}

window.shareTeacherReport = async testId => {
  const data = await teacherReportData(testId);
  if(!data) return alert('Test report not found.');
  let teacher = data.test.teacher;
  if(!teacher && data.test.teacher_id){
    teacher = (await DB.listTahTeachers()).find(t=>String(t.id)===String(data.test.teacher_id));
  }
  if(!teacher){
    if(confirm('No teacher is assigned to this test. Open Mark Entry to assign one now?')) enterMarks(testId);
    return;
  }
  const phone = normalizeIndianPhone(teacher.mobile);
  if(!phone){
    if(confirm(`${teacher.name} does not have a valid WhatsApp number. Open Teachers to add it now?`)) teachers();
    return;
  }
  const applicable = Math.max(0, data.enrolled - data.na);
  const attendance = applicable ? Math.round(data.appeared / applicable * 1000) / 10 : null;
  const test = data.test;
  const body = `Hello ${teacher.name},\n\nClass ${test.class_level} · Section ${test.section||'All'} · ${test.subject} ${testTypeLabel(test.test_type)} report is ready.\nClass average: ${data.avg==null?'—':data.avg+'%'} · Exam attendance: ${attendance==null?'—':attendance+'%'} (${data.appeared}/${applicable}).\n\nPlease find the detailed report PDF attached.`;
  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(body)}`,'_blank','noopener');
};

function teacherChapterTest(chapter, tests){
  const chapterId = String(chapter.id);
  return tests
    .filter(test=>{
      const testChapterIds = [test.chapter_id,...(test.chapter_ids||[])].filter(Boolean).map(String);
      return testChapterIds.includes(chapterId) || Number(test.chapter_no)===Number(chapter.chapter_no);
    })
    .sort((a,b)=>new Date(testDate(b))-new Date(testDate(a)))[0];
}

async function teacherFilterBar(tests){
  const clsOpts = '<option value="">Class</option>' + CLASSES.map(c=>`<option value="${c}" ${String(c)===String(TEACHER_FILTER.cls)?'selected':''}>Class ${c}</option>`).join('');
  const secOpts = '<option value="">Section</option>' + ['All','A','B'].map(s=>`<option value="${s}" ${s===TEACHER_FILTER.section?'selected':''}>${s==='All'?'All':'Section '+s}</option>`).join('');
  const subOpts = '<option value="">Subject</option>' + SUBJECTS.map(s=>`<option value="${s}" ${s===TEACHER_FILTER.subject?'selected':''}>${s}</option>`).join('');
  const baseMatching = (TEACHER_FILTER.cls && TEACHER_FILTER.section && TEACHER_FILTER.subject)
    ? tests.filter(t=>String(t.class_level)===String(TEACHER_FILTER.cls) && (t.section||'All')===TEACHER_FILTER.section && t.subject===TEACHER_FILTER.subject)
    : [];
  const testTypeOpts = ['Chapter End Test','Periodic Test-1'].map(type=>`<option value="${type}" ${type===TEACHER_FILTER.testType?'selected':''}>${type}</option>`).join('');
  const matching = TEACHER_FILTER.testType ? baseMatching.filter(test=>testTypeLabel(test.test_type)===TEACHER_FILTER.testType) : [];
  const chapters = (TEACHER_FILTER.cls && TEACHER_FILTER.subject)
    ? await DB.listChapters(Number(TEACHER_FILTER.cls),TEACHER_FILTER.subject)
    : [];
  const periodicTests = matching.slice().sort((a,b)=>new Date(testDate(b))-new Date(testDate(a)));
  if(TEACHER_FILTER.testType==='Periodic Test-1' && periodicTests.length && !periodicTests.some(test=>test.id===TEACHER_FILTER.testId)) TEACHER_FILTER.testId=periodicTests[0].id;
  const chapterEntries = chapters.map(chapter=>({chapter,test:teacherChapterTest(chapter,matching)}));
  const selectedEntry = chapterEntries.find(entry=>entry.test?.id===TEACHER_FILTER.testId);
  if(TEACHER_FILTER.testType==='Chapter End Test' && TEACHER_FILTER.testId && !selectedEntry) TEACHER_FILTER.testId = '';
  const periodicTest = periodicTests.find(test=>test.id===TEACHER_FILTER.testId);
  const periodicScope = periodicTest ? await teacherScopeLabel(periodicTest) : 'No tested chapters available';
  const testedChapterIds = new Set([periodicTest?.chapter_id,...(periodicTest?.chapter_ids||[])].filter(Boolean).map(String));
  const testedChapterNumbers = new Set((String(periodicScope).match(/\d+/g)||[]).map(Number));
  const periodicChapterMenu = chapters.map(chapter=>{
    const included = testedChapterIds.has(String(chapter.id)) || testedChapterNumbers.has(Number(chapter.chapter_no));
    return `<div class="teacher-tested-chapter ${included?'included':''}"><b>${included?'✓':'○'}</b><span>${chapterOptionLabel(chapter)}</span><em>${included?'Included in this test':'Not included'}</em></div>`;
  }).join('') || '<div class="teacher-tested-chapter"><span>No chapters found</span></div>';
  const chapterControl = TEACHER_FILTER.testType==='Periodic Test-1'
    ? `<details class="teacher-tested-chapters"><summary>✓ ${periodicScope}</summary><div class="teacher-tested-chapter-menu">${periodicChapterMenu}</div></details>`
    : `<select class="teacher-chapter-select" onchange="setTeacherFilter('testId',this.value)" ${TEACHER_FILTER.testType==='Chapter End Test'&&chapters.length?'':'disabled'}>${[
        `<option value="" ${TEACHER_FILTER.testId?'':'selected'} disabled>${TEACHER_FILTER.testType==='Chapter End Test'?'Choose a completed chapter':'Choose test type first'}</option>`,
        ...chapterEntries.map(({chapter,test})=>test
          ? `<option value="${test.id}" ${test.id===TEACHER_FILTER.testId?'selected':''} style="color:#28613b">✓ ${chapterOptionLabel(chapter)} · Done</option>`
          : `<option value="" disabled style="color:#77837c">${chapterOptionLabel(chapter)} · Pending</option>`
        )
      ].join('')}</select>`;
  return `
    <div class="card pad teacher-filter" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Class</label><select onchange="setTeacherFilter('cls',this.value)">${clsOpts}</select></div>
        <div class="field"><label>Section</label><select onchange="setTeacherFilter('section',this.value)">${secOpts}</select></div>
        <div class="field"><label>Subject</label><select onchange="setTeacherFilter('subject',this.value)">${subOpts}</select></div>
        <div class="field"><label>Type of test</label><select onchange="setTeacherFilter('testType',this.value)"><option value="" ${TEACHER_FILTER.testType?'':'selected'} disabled>Select test type</option>${testTypeOpts}</select></div>
        <div class="field"><label>${TEACHER_FILTER.testType==='Periodic Test-1'?'Tested chapters':'Chapter'}</label>${chapterControl}</div>
      </div>
    </div>`;
}

async function teacherScopeLabel(test){
  const chapterIds = [test.chapter_id,...(test.chapter_ids||[])].filter(Boolean).map(String);
  if(chapterIds.length){
    const chapters = await DB.listChapters(Number(test.class_level),test.subject);
    const numbers = [...new Set(chapters
      .filter(chapter=>chapterIds.includes(String(chapter.id)))
      .map(chapter=>Number(chapter.chapter_no))
      .filter(Number.isFinite)
    )].sort((a,b)=>a-b);
    if(numbers.length) return numbers.map(number=>`Ch ${number}`).join(', ');
  }
  const number = Number(test.chapter_no);
  return Number.isFinite(number) && number>0 ? `Ch ${number}` : 'Selected chapters';
}

function teacherShortTestLabel(test, scope){
  const prefix = testTypeLabel(test.test_type)==='Chapter End Test' ? 'CET' : testTypeLabel(test.test_type)==='Periodic Test-1' ? 'PT1' : testTypeLabel(test.test_type);
  const chapters = (String(scope||'').match(/\d+/g)||[]).join(',');
  return chapters ? `${prefix}-Ch${chapters}` : prefix;
}

function teacherHeaderIcon(type){
  if(type==='test') return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"></rect><path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2"></path></svg>';
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H6.5A2.5 2.5 0 0 0 4 19.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H15a3 3 0 0 0-1 2.2V20a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5z"></path></svg>';
}

async function renderTeacher(tests){
  const test = tests.find(t=>t.id===TEACHER_FILTER.testId);
  if(!test){
    CURRENT_TEST = null;
    show(`
      ${await teacherFilterBar(tests)}
      <div class="card pad"><div class="muted">No test found for this selection.</div></div>
    `);
    return;
  }
  CURRENT_TEST = test.id;
  const scopeLabel = await teacherScopeLabel(test);
  const students = await DB.listStudents();
  const studentById = new Map(students.map(s=>[s.id,s]));
  const rs = (await cachedResults(test.id)).filter(result=>studentById.has(result.student_id));
  // Archived/deleted students remain recoverable in the database, but must not appear in active reports.
  let rows = rs.filter(r=>studentById.has(r.student_id)).map(r=>({studentId:r.student_id,name:studentById.get(r.student_id).name,marks:r.marks,present:r.present,na:!!r.na,p:(!r.na&&r.present)?pct(r.marks,test.full_marks):null}));
  const enrolled = rows.length;
  const appearedCount = rows.filter(r=>!r.na && r.present).length;
  const absentCount = rows.filter(r=>!r.na && !r.present).length;
  const naCount = rows.filter(r=>r.na).length;
  const absentRows = rows.filter(r=>!r.na && !r.present).sort((a,b)=>a.name.localeCompare(b.name));
  const absentList = absentRows.length ? `
    <div class="small muted report-section-label" style="margin:16px 0 4px">Absent students</div>
    <div class="listrow" style="align-items:flex-start">
      <div class="pill warn">${absentRows.length} absent</div>
      <div style="flex:1">${absentRows.map(r=>r.name).join(', ')}</div>
    </div>` : '';
  const naRows = rows.filter(r=>r.na).sort((a,b)=>a.name.localeCompare(b.name));
  const naList = naRows.length ? `
    <div class="small muted report-section-label" style="margin:16px 0 4px">N.A. students</div>
    <div class="listrow" style="align-items:flex-start">
      <div class="pill">${naRows.length} N.A.</div>
      <div style="flex:1">${naRows.map(r=>r.name).join(', ')}</div>
    </div>` : '';
  const present = rows.filter(r=>!r.na && r.present && r.p!=null).sort((a,b)=>b.p-a.p);
  const avg = present.length?Math.round(present.reduce((a,r)=>a+r.p,0)/present.length*10)/10:null;
  const counts={}; bandConfig().forEach(b=>counts[b.grade]=0); present.forEach(r=>counts[band(r.p)]++);
  const hi=present[0], lo=present[present.length-1];
  const groupInfo = [
    {grade:'A',title:'High achievers',range:'80–100',tone:'high',action:'Enrichment questions',icon:'📖'},
    {grade:'B',title:'On track',range:'60–79',tone:'track',action:'Continue regular practice',icon:'✓'},
    {grade:'C',title:'Developing',range:'40–59',tone:'developing',action:'Guided revision',icon:'▣'},
    {grade:'D',title:'Urgent support',range:'Below 40',tone:'urgent',action:'Assign remedial worksheet',icon:'⊕'}
  ];
  const groupCards = groupInfo.map(group=>{
    const groupRows = present.filter(row=>band(row.p)===group.grade);
    return `<section class="teacher-score-group ${group.tone}">
      <div class="teacher-group-title">${group.title}</div>
      <div class="teacher-group-range">${group.range}</div>
      <div class="teacher-group-count"><b>${groupRows.length}</b><span>${groupRows.length===1?'student':'students'}</span></div>
      <div class="teacher-group-students">${groupRows.length ? groupRows.map((row,index)=>`<div><b>${index+1}</b><span>${row.name}${group.grade==='D'?` · ${row.p}%`:''}</span></div>`).join('') : '<span class="tiny muted">No students</span>'}</div>
      <div class="teacher-group-action"><i>${group.icon}</i><span><b>Action</b>${group.action}</span><em>›</em></div>
    </section>`;
  }).join('');
  let distributionCursor = 0;
  const distribution = groupInfo.map(group=>{
    const count = present.filter(row=>band(row.p)===group.grade).length;
    const share = present.length ? Math.round(count/present.length*100) : 0;
    const start = distributionCursor;
    distributionCursor += share;
    return {...group,count,share,start,end:distributionCursor};
  });
  const distributionColors = {A:'#08704e',B:'#82b94d',C:'#f2a52a',D:'#ef5046'};
  const distributionGradient = present.length ? `conic-gradient(${distribution.map(item=>`${distributionColors[item.grade]} ${item.start}% ${item.end}%`).join(',')})` : '#e7eeea';
  const distributionLabels = distribution.filter(item=>item.share>0).map(item=>{
    const angle = ((item.start+item.end)/200)*Math.PI*2-Math.PI/2;
    const left = (50+Math.cos(angle)*35).toFixed(2);
    const top = (50+Math.sin(angle)*35).toFixed(2);
    return `<b class="teacher-donut-label" style="left:${left}%;top:${top}%">${item.share}%</b>`;
  }).join('');
  const distributionCard = `<section class="teacher-distribution"><h2>Score distribution <span>(by percentage range)</span></h2><div class="teacher-distribution-body"><div class="teacher-donut" style="background:${distributionGradient}">${distributionLabels}<div>▥</div></div><div class="teacher-distribution-legend">${distribution.map(item=>`<div><i style="background:${distributionColors[item.grade]}"></i><span>${item.range}</span></div>`).join('')}</div></div></section>`;
  const leaderboardRows = (TEACHER_SHOW_ALL ? present : present.slice(0,10)).map((r,i)=>`
    <div class="teacher-leader-row">
      <div class="teacher-leader-rank ${i<3?'medal-'+(i+1):''}">${i+1}</div>
      <div class="teacher-leader-name"><b>${r.name}</b><span>Section ${test.section||'All'}</span></div>
      <div class="teacher-leader-bar"><span style="width:${r.p}%"></span></div>
      <strong>${r.p}%</strong>
    </div>`).join('');
  const supportCount = present.filter(row=>row.p<60).length;
  const attendance = enrolled-naCount ? Math.round(appearedCount/(enrolled-naCount)*1000)/10 : null;
  const currentTime = new Date(testDate(test)).getTime();
  const comparisonTests = tests.filter(candidate=>
    String(candidate.class_level)===String(test.class_level) &&
    (candidate.section||'All')===(test.section||'All') &&
    candidate.subject===test.subject &&
    new Date(testDate(candidate)).getTime()<=currentTime
  ).sort((a,b)=>new Date(testDate(a))-new Date(testDate(b)));
  const comparisonScopes = new Map(await Promise.all(comparisonTests.map(async candidate=>[candidate.id,await teacherScopeLabel(candidate)])));
  const currentComparisonLabel = teacherShortTestLabel(test,scopeLabel);
  const comparisonResults = new Map(await Promise.all(comparisonTests.map(async candidate=>[
    candidate.id,
    (await cachedResults(candidate.id)).filter(result=>studentById.has(result.student_id))
  ])));
  const earlierTests = comparisonTests.filter(candidate=>new Date(testDate(candidate)).getTime()<currentTime).sort((a,b)=>new Date(testDate(b))-new Date(testDate(a)));
  const comparisonRows = present.map(row=>{
    const attended = comparisonTests.map(candidate=>{
      const result = comparisonResults.get(candidate.id)?.find(item=>item.student_id===row.studentId);
      return result && !result.na && result.present && result.marks!=null ? pct(result.marks,candidate.full_marks) : null;
    }).filter(value=>value!=null);
    const previousTest = earlierTests.find(candidate=>{
      const result = comparisonResults.get(candidate.id)?.find(item=>item.student_id===row.studentId);
      return result && !result.na && result.present && result.marks!=null;
    });
    const previousResult = previousTest ? comparisonResults.get(previousTest.id).find(item=>item.student_id===row.studentId) : null;
    const previous = previousResult ? pct(previousResult.marks,previousTest.full_marks) : null;
    const change = previous==null ? null : Math.round((row.p-previous)*10)/10;
    return {...row,previous,change,previousLabel:previousTest?teacherShortTestLabel(previousTest,comparisonScopes.get(previousTest.id)):'No earlier test',currentLabel:currentComparisonLabel,overall:Math.round(attended.reduce((sum,value)=>sum+value,0)/attended.length*10)/10};
  }).sort((a,b)=>{
    if(a.change==null && b.change!=null) return 1;
    if(b.change==null && a.change!=null) return -1;
    if(a.change==null && b.change==null) return b.p-a.p;
    return b.change-a.change || b.p-a.p;
  });
  const comparisonDisplay = (TEACHER_TREND_SHOW_ALL ? comparisonRows : comparisonRows.slice(0,10));
  const comparisonList = comparisonDisplay.map((row,index)=>{
    const tone = row.change==null ? 'first-test' : row.change>=5 ? 'improving' : row.change<=-5 ? 'declining' : 'stable';
    const label = row.change==null ? 'First scored test' : tone==='improving' ? `Improving +${row.change} pts` : tone==='declining' ? `Declining ${row.change} pts` : 'Stable';
    return `<div class="teacher-trend-row"><em>${index+1}</em><div><b>${row.name}</b><span>Section ${test.section||'All'} · Overall average ${row.overall}%</span></div><strong class="teacher-trend-score">${row.previous==null?'—':row.previous+'%'}<small>${row.previousLabel}</small></strong><strong class="teacher-trend-score">${row.p}%<small>${row.currentLabel}</small></strong><span class="teacher-trend-pill ${tone}">${label}</span></div>`;
  }).join('');
  show(`
    ${await teacherFilterBar(tests)}
    <div class="card pad teacher-report teacher-insight-report">
      <div class="teacher-insight-title">Test result &amp; remedial planning report</div>
      <div class="teacher-insight-head">
        <div class="brandbar"><img class="brandlogo centre-output-logo" alt="${CONFIG.CENTRE.name} logo" src="${CONFIG.CENTRE.logo_url||'assets/images/aveti-logo.png'}"><div><div class="teacher-centre-name">${CONFIG.CENTRE.name}</div><h1>Class ${test.class_level} · Section ${test.section||'All'} · ${test.subject}</h1><div class="teacher-print-contact">${CONFIG.CENTRE.address}${CONFIG.CENTRE.phone?' · Ph '+CONFIG.CENTRE.phone:''}</div>${test.teacher?.name?`<div class="tiny muted">Assigned teacher: ${escapeHTML(test.teacher.name)}</div>`:''}</div></div>
        <div class="teacher-test-meta"><div class="teacher-test-line">${teacherHeaderIcon('test')}<b>${testTypeLabel(test.test_type)} · ${test.full_marks} marks · ${fmtDate(testDate(test))}</b></div><div class="teacher-scope-line">${teacherHeaderIcon('scope')}<span>Assessment scope: <strong>${scopeLabel}</strong></span></div></div>
      </div>
      <div class="teacher-summary-grid">
        <div class="teacher-summary-card average"><i>▥</i><span>Class average<b>${avg??'—'}%</b></span></div>
        <div class="teacher-summary-card highest"><i>♛</i><span>Highest<b>${hi?hi.p+'%':'—'}</b><small>${hi?hi.name:''}</small></span></div>
        <div class="teacher-summary-card attendance"><i>♚</i><span>Exam attendance<b>${attendance??'—'}${attendance==null?'':'%'}</b><small>${appearedCount} of ${enrolled-naCount||0} applicable students</small></span></div>
        <div class="teacher-summary-card support"><i>⊕</i><span>Students need support<b>${supportCount}</b><small>Below 60%</small></span></div>
      </div>
      <div class="teacher-group-heading">Student groups &amp; next action</div>
      <div class="teacher-score-groups">${groupCards}</div>
      <div class="teacher-bottom-grid">
        <section class="teacher-leaderboard"><div class="teacher-board-heading"><div><h2>♛ Top performers</h2><span>Students who appeared, ranked by this assessment</span></div><span class="teacher-axis">0%　25%　50%　75%　100%</span></div>${leaderboardRows||'<div class="muted">No submitted marks yet.</div>'}${present.length>10?`<button class="teacher-show-all" onclick="setTeacherShowAll()">${TEACHER_SHOW_ALL?'Show Top 10':`View full ranking (${present.length})`}</button>`:''}</section>
        <div class="teacher-side-insights">${distributionCard}<section class="teacher-absentees"><div class="teacher-absent-head"><h2>⚠ Exam absentees</h2>${absentCount?'<span class="teacher-retest-tag">▣ Re-test needed</span>':''}</div><b>${absentCount} student${absentCount===1?'':'s'} absent</b><span>Not included in score groups</span>${absentRows.length?`<div>${absentRows.map(row=>`<p>● ${row.name}</p>`).join('')}</div>`:'<p class="muted">All applicable students appeared.</p>'}</section></div>
      </div>
      <section class="teacher-performance-trend"><div class="teacher-trend-heading"><div><h2>↗ Performance comparison</h2><span>Top 10 by change · highest improvement to lowest change</span></div></div><div class="teacher-trend-labels"><span>Rank</span><span>Student</span><span>Previous %</span><span>Current %</span><span>Change ↓</span></div>${comparisonList||'<div class="teacher-trend-empty">No scored students in this assessment yet.</div>'}${comparisonRows.length>10?`<button class="teacher-show-all" onclick="setTeacherTrendShowAll()">${TEACHER_TREND_SHOW_ALL?'Show Top 10':'Show all students'}</button>`:''}</section>
      ${naList}
      <div class="row report-actions" style="margin-top:16px;gap:8px">
        <button onclick="enterMarks('${test.id}')">Edit marks</button>
        <button onclick="exportTeacherCSV('${test.id}')">Download CSV</button>
        <button onclick="printTeacherReport()">🖨 Print / Save as PDF</button>
        <button onclick="shareTeacherReport('${test.id}')">💬 Share report with teacher</button>
        <button class="primary" onclick="openParents('${test.id}')">Share parent cards</button>
      </div>
    </div>
  `);
}

window.setTeacherFilter = async (key,value)=>{
  const tests = await DB.listTests();
  TEACHER_FILTER[key] = value;
  TEACHER_SHOW_ALL = false;
  TEACHER_TREND_SHOW_ALL = false;
  if(key==='cls' || key==='section' || key==='subject' || key==='testType') TEACHER_FILTER.testId = '';
  if(key==='testType' && value==='Periodic Test-1'){
    const latestPeriodic = tests
      .filter(test=>String(test.class_level)===String(TEACHER_FILTER.cls) && (test.section||'All')===TEACHER_FILTER.section && test.subject===TEACHER_FILTER.subject && testTypeLabel(test.test_type)==='Periodic Test-1')
      .sort((a,b)=>new Date(testDate(b))-new Date(testDate(a)))[0];
    if(latestPeriodic) TEACHER_FILTER.testId = latestPeriodic.id;
  }
  await renderTeacher(tests);
};

window.setTeacherShowAll = async ()=>{
  TEACHER_SHOW_ALL = !TEACHER_SHOW_ALL;
  await renderTeacher(await DB.listTests());
};

window.setTeacherTrendShowAll = async ()=>{
  TEACHER_TREND_SHOW_ALL = !TEACHER_TREND_SHOW_ALL;
  await renderTeacher(await DB.listTests());
};

window.printTeacherReport = ()=>{
  window.print();
};

window.exportTeacherCSV = async testId=>{
  const data = await teacherReportData(testId);
  if(!data){ alert('No report data found.'); return; }
  const {test,rows,avg,enrolled,appeared,absent,na} = data;
  const header = ['Rank','Student','Status','Marks','Full marks','Percent','Band','Needs support'];
  const rankedIds = new Map(data.ranked.map((r,i)=>[r.student_id,i+1]));
  const absentNames = rows.filter(r=>!r.na&&!r.present).map(r=>r.name).join(', ');
  const naNames = rows.filter(r=>r.na).map(r=>r.name).join(', ');
  const lines = [
    ['Teacher / Class Report'],
    [CONFIG.CENTRE.name, CONFIG.CENTRE.address, `Ph ${CONFIG.CENTRE.phone}`],
    [`Class ${test.class_level}`,`Section ${test.section||'All'}`,test.subject,chapterDetail(test),fmtDate(testDate(test))],
    [`Appeared ${appeared} of ${enrolled}`,`Absent ${absent}`,`N.A. ${na}`,`Class average ${avg??'—'}%`],
    [`Absent students`, absentNames || 'None'],
    [`N.A. students`, naNames || 'None'],
    [],
    header
  ];
  rows.forEach(r=>{
    const status = r.na ? 'N.A.' : r.present ? 'Appeared' : 'Absent';
    lines.push([rankedIds.get(r.student_id)||'',r.name,status,resultValue(r),test.full_marks,r.p==null?'':r.p+'%',r.grade,r.support?'Yes':'No']);
  });
  const csv = lines.map(row=>row.map(csvCell).join(',')).join('\n');
  downloadBlob(`${fileSafe(test.subject+'-'+chapterDetail(test))}-teacher-report.csv`,'text/csv;charset=utf-8',csv);
};

window.exportTeacherPDF = async testId=>{
  const data = await teacherReportData(testId);
  if(!data){ alert('No report data found.'); return; }
  const {test,ranked,avg,enrolled,appeared,absent,na} = data;
  const lines = [
    {text:'Teacher / Class Report',x:40,y:800,size:18},
    {text:`${CONFIG.CENTRE.name}`,x:40,y:778,size:11},
    {text:`${CONFIG.CENTRE.address} | Ph ${CONFIG.CENTRE.phone}`,x:40,y:762,size:9},
    {text:`Class ${test.class_level} | Section ${test.section||'All'} | ${test.subject} | ${chapterDetail(test)}`,x:40,y:742,size:11},
    {text:`${testTypeLabel(test.test_type)} | ${test.full_marks} marks | ${fmtDate(testDate(test))}`,x:40,y:726,size:11},
    {text:`Appeared ${appeared} of ${enrolled} | Absent ${absent} | N.A. ${na} | Class average ${avg??'—'}%`,x:40,y:704,size:12},
    {text:'Ranked results',x:40,y:674,size:13},
    {text:'Rank  Student                    Marks      Percent   Band   Note',x:40,y:656,size:10}
  ];
  let y=638;
  ranked.slice(0,28).forEach((r,i)=>{
    const note = r.support ? 'Needs support' : band(r.p)==='A' ? 'Top performer' : '';
    lines.push({text:`${String(i+1).padEnd(5)} ${r.name.slice(0,24).padEnd(26)} ${String(r.marks+'/'+test.full_marks).padEnd(10)} ${String(r.p+'%').padEnd(9)} ${String(r.grade).padEnd(5)} ${note}`,x:40,y,size:10});
    y-=16;
  });
  if(ranked.length>28) lines.push({text:`+ ${ranked.length-28} more rows in CSV export`,x:40,y:y-8,size:9});
  lines.push({text:'Privacy note: parent phone numbers are not included in this teacher PDF.',x:40,y:38,size:8});
  downloadBlob(`${fileSafe(test.subject+'-'+chapterDetail(test))}-teacher-report.pdf`,'application/pdf',simplePdf(lines));
};

/* ---------- PARENT SHARE ---------- */
let PARENT_FILTER = { cls:'', section:'', subject:'', testId:'', student:'All', search:'', status:'all' };
let PARENT_BULK_ITEMS = [];
let PARENT_MESSAGE_OVERRIDES = {};
let PARENT_PHONE_LOOKUP = {};
let PARENT_PREVIEW = {testId:'',studentId:'',message:''};
const parentMessageKey = (testId,studentId) => `${testId}:${studentId}`;
const maskedParentPhone = phone => {
  const digits=String(phone||'').replace(/\D/g,'');
  return digits.length>4 ? `••••••${digits.slice(-4)}` : '••••••';
};

async function openParents(testId){
  const tests = await DB.listTests();
  setCrumb('Parent report');
  if(testId){
    const selected = tests.find(t=>t.id===testId);
    if(selected){
      if(PARENT_FILTER.testId && PARENT_FILTER.testId!==selected.id) PARENT_MESSAGE_OVERRIDES={};
      PARENT_FILTER = {
        cls:String(selected.class_level||''),
        section:selected.section||'All',
        subject:selected.subject||'',
        testId:selected.id,
        student:'All', search:'', status:'all'
      };
      CURRENT_TEST = selected.id;
    }
  } else if(!PARENT_FILTER.testId && tests[0]){
    const recent = tests[0];
    PARENT_FILTER = {
      cls:String(recent.class_level||''),
      section:recent.section||'All',
      subject:recent.subject||'',
      testId:recent.id,
      student:'All', search:'', status:'all'
    };
  }
  renderParents(tests);
}

function parentFilterBar(tests, students){
  const recentOpts = '<option value="">Recent exam</option>' + tests.slice(0,12).map(t=>`<option value="${t.id}" ${t.id===PARENT_FILTER.testId?'selected':''}>${testOptionLabel(t)}</option>`).join('');
  const clsOpts = '<option value="">Class</option>' + CLASSES.map(c=>`<option value="${c}" ${String(c)===String(PARENT_FILTER.cls)?'selected':''}>Class ${c}</option>`).join('');
  const secOpts = '<option value="">Section</option>' + ['All','A','B'].map(s=>`<option value="${s}" ${s===PARENT_FILTER.section?'selected':''}>${s==='All'?'All':'Section '+s}</option>`).join('');
  const subOpts = '<option value="">Subject</option>' + SUBJECTS.map(s=>`<option value="${s}" ${s===PARENT_FILTER.subject?'selected':''}>${s}</option>`).join('');
  const matching = (PARENT_FILTER.cls && PARENT_FILTER.section && PARENT_FILTER.subject)
    ? tests.filter(t=>String(t.class_level)===String(PARENT_FILTER.cls) && (t.section||'All')===PARENT_FILTER.section && t.subject===PARENT_FILTER.subject)
    : [];
  if(PARENT_FILTER.testId && !matching.some(t=>t.id===PARENT_FILTER.testId)) PARENT_FILTER.testId = '';
  const chapOpts = '<option value="">Chapter</option>' + matching.map(t=>`<option value="${t.id}" ${t.id===PARENT_FILTER.testId?'selected':''}>${chapterDetail(t)}</option>`).join('');
  const classStudents = students.filter(s=>
    String(s.class_level)===String(PARENT_FILTER.cls) &&
    (PARENT_FILTER.section==='All' || (s.section||'')===PARENT_FILTER.section)
  );
  return `
    <section class="card parent-filter-panel">
      <div class="parent-filter-grid">
        <div class="field"><label>Recent</label><select onchange="setParentFilter('recent',this.value)">${recentOpts}</select></div>
        <div class="field"><label>Class</label><select onchange="setParentFilter('cls',this.value)">${clsOpts}</select></div>
        <div class="field"><label>Section</label><select onchange="setParentFilter('section',this.value)">${secOpts}</select></div>
        <div class="field"><label>Subject</label><select onchange="setParentFilter('subject',this.value)">${subOpts}</select></div>
        <div class="field"><label>Chapter</label><select onchange="setParentFilter('testId',this.value)" ${matching.length?'':'disabled'}>${chapOpts}</select></div>
      </div>
    </section>`;
}

async function renderParents(tests){
  const students = await DB.listStudents();
  const test = tests.find(t=>t.id===PARENT_FILTER.testId);
  if(!test){
    CURRENT_TEST = null;
    show(`
      ${parentFilterBar(tests, students)}
      <div class="card pad"><div class="muted">No test found for this selection.</div></div>
    `);
    return;
  }
  CURRENT_TEST = test.id;
  PARENT_PHONE_LOOKUP = {};
  const activeStudentIds = new Set(students.map(student=>student.id));
  const rs = await activeResultsForTest(test,activeStudentIds);
  const allResults = await DB.allResults();
  const availableChapters = await DB.listChapters(test.class_level,test.subject);
  const chapterNumberById = new Map(availableChapters.map(chapter=>[String(chapter.id),Number(chapter.chapter_no)]));
  const selectedChapterIds = test.chapter_ids?.length ? test.chapter_ids : [test.chapter_id].filter(Boolean);
  const chapterNumbers = selectedChapterIds.map(id=>chapterNumberById.get(String(id))).filter(Number.isFinite);
  const scopeLabel = chapterNumbers.length ? chapterNumbers.map(number=>`Ch ${number}`).join(', ') : chapterDetail(test);
  const avg = await classAverage(test,activeStudentIds);
  const enrolled = rs.length;
  const appearedCount = rs.filter(r=>!r.na && r.present).length;
  const rowsData = [];
  PARENT_BULK_ITEMS = [];
  rs.filter(r=>(r.na || !r.present || r.marks!=null) && (PARENT_FILTER.student==='All' || r.student_id===PARENT_FILTER.student)).forEach(r=>{
    const s = students.find(x=>x.id===r.student_id);
    if(!s) return;
    const isNA = !!r.na;
    const isAbsent = !isNA && !r.present;
    const p = !isNA && !isAbsent ? pct(r.marks,test.full_marks) : null;
    const context = {...parentNotificationContext(test,r.student_id,tests,allResults),chapterNumbers};
    const generatedMessage = parentWhatsAppMessage(test,s.name,r,avg,context);
    const override = PARENT_MESSAGE_OVERRIDES[parentMessageKey(test.id,r.student_id)];
    const message = override==null ? generatedMessage : override;
    const msg = encodeURIComponent(message);
    const generatedMsg = encodeURIComponent(generatedMessage);
    const phone = normalizeIndianPhone(s.parent_phone);
    if(phone) PARENT_PHONE_LOOKUP[parentMessageKey(test.id,r.student_id)] = phone;
    const sent = parentCardWasSent(test.id,r.student_id);
    const kind = isNA ? 'na' : isAbsent ? 'absent' : !phone ? 'missing' : sent ? 'sent' : 'ready';
    if(phone && !sent && !isNA) PARENT_BULK_ITEMS.push({phone,message:msg,studentId:r.student_id});
    rowsData.push({s,r,p,isNA,isAbsent,phone,sent,msg,generatedMsg,kind});
  });
  const search = String(PARENT_FILTER.search||'').trim().toLowerCase();
  const filtered = rowsData.filter(item=>!search || item.s.name.toLowerCase().includes(search));
  const counts = {ready:rowsData.filter(x=>x.kind==='ready').length,sent:rowsData.filter(x=>x.kind==='sent').length,missing:rowsData.filter(x=>x.kind==='missing').length,absent:rowsData.filter(x=>x.kind==='absent').length};
  const visible = PARENT_FILTER.status==='all' ? filtered : filtered.filter(x=>x.kind===PARENT_FILTER.status);
  const parentRow = item=>{
    const {s,r,p,isNA,isAbsent,phone,sent,msg,generatedMsg}=item;
    const details = p==null ? (isNA?'N.A. · No notification needed':'Absent · Did not appear') : `${r.marks}/${test.full_marks} · ${p}% · Grade ${band(p)}`;
    const actions = isNA
      ? '<span class="parent-pill neutral">No notification needed</span>'
      : phone
        ? `<a class="parent-phone">${maskedParentPhone(phone)}</a><button class="parent-action preview" data-message="${msg}" onclick="previewParentMessage(this.dataset.message,'${test.id}','${s.id}')">Preview</button><button class="parent-action edit" data-message="${msg}" onclick="editParentMessage('${test.id}','${s.id}',this.dataset.message,this.dataset.generated)">Edit message</button><button class="parent-action send" data-message="${msg}" onclick="sendParentRecipient('${test.id}','${s.id}',this.dataset.message)">Send</button><label class="parent-sent"><input type="checkbox" ${sent?'checked':''} onchange="setParentCardSent('${test.id}','${s.id}',this.checked)"> Sent</label>`
        : `<span class="parent-pill warn">Missing phone</span><button class="parent-action add-phone" onclick="appNavigate('students')">Add phone number</button>`;
    return `<div class="parent-recipient-row ${isAbsent?'is-absent':''}">${avatar(s.gender,s.name)}<div class="parent-recipient-main"><b>${s.name}</b><span>${details}</span></div><div class="parent-recipient-actions">${actions}</div></div>`;
  };
  const group = (title,kind,items,extra='')=>items.length?`<section class="parent-recipient-group ${kind}"><div class="parent-group-title"><b>${title}</b><span>${items.length}</span></div>${items.map(parentRow).join('')}</section>`:'';
  const ready = visible.filter(x=>x.kind==='ready'), missing = visible.filter(x=>x.kind==='missing'), absent = visible.filter(x=>x.kind==='absent'), sent = visible.filter(x=>x.kind==='sent');
  const grouped = PARENT_FILTER.status==='all' ? group('Ready to send','ready',ready)+group('Sent','sent',sent)+group('Action needed — missing phone','missing',missing)+group('Absent students','absent',absent) : group(PARENT_FILTER.status==='ready'?'Ready to send':PARENT_FILTER.status==='sent'?'Sent':PARENT_FILTER.status==='missing'?'Action needed — missing phone':'Absent students',PARENT_FILTER.status,visible);
  show(`
    ${parentFilterBar(tests, students)}
    <section class="card parent-report-card"><header class="parent-report-head"><div class="parent-brand"><img class="centre-output-logo" alt="${CONFIG.CENTRE.name} logo" src="${CONFIG.CENTRE.logo_url||'assets/images/aveti-logo.png'}"><div><h1>Share parent cards</h1><p>${CONFIG.CENTRE.name}</p><span>Class ${test.class_level} · Section ${test.section||'All'} · ${test.subject} · ${testTypeLabel(test.test_type)} · ${scopeLabel} · ${fmtDate(testDate(test))} · ${test.full_marks} marks · ${appearedCount} of ${enrolled} appeared</span></div></div><div class="parent-summary-grid"><div class="parent-summary ready"><b>${counts.ready}</b><span>Ready to send</span><small>parents</small></div><div class="parent-summary sent"><b>${counts.sent}</b><span>Sent</span><small>parents</small></div><div class="parent-summary missing"><b>${counts.missing}</b><span>Missing phone</span><small>parents</small></div><div class="parent-summary absent"><b>${counts.absent}</b><span>Absent</span><small>students</small></div></div></header><div class="parent-sendbar"><label>Send with <select onchange="setWhatsAppApp(this.value)"><option value="personal" ${preferredWhatsAppApp()==='personal'?'selected':''}>WhatsApp</option><option value="business" ${preferredWhatsAppApp()==='business'?'selected':''}>WhatsApp Business</option></select></label><button class="primary" onclick="sendAllParentCards()" ${PARENT_BULK_ITEMS.length?'':'disabled'}>Send all ready (${PARENT_BULK_ITEMS.length})</button><button class="parent-preview-trigger" onclick="previewParentMessage('')">Preview message</button><span>Mark sent manually after WhatsApp opens.</span></div><div class="parent-report-body"><div class="parent-recipient-pane"><div class="parent-list-tools"><input type="search" value="${PARENT_FILTER.search||''}" placeholder="Search recipients" oninput="setParentSearch(this.value)"><div class="parent-status-tabs"><button class="${PARENT_FILTER.status==='all'?'active':''}" onclick="setParentStatus('all')">All <b>${rowsData.length}</b></button><button class="${PARENT_FILTER.status==='ready'?'active':''}" onclick="setParentStatus('ready')">Ready <b>${counts.ready}</b></button><button class="${PARENT_FILTER.status==='missing'?'active':''}" onclick="setParentStatus('missing')">Missing <b>${counts.missing}</b></button><button class="${PARENT_FILTER.status==='absent'?'active':''}" onclick="setParentStatus('absent')">Absent <b>${counts.absent}</b></button></div></div><div class="parent-note">Each message highlights progress and one practical next step. N.A. results are not sent.</div>${grouped||'<div class="parent-empty">No recipients match this filter.</div>'}</div><aside class="parent-preview-panel" id="parentPreviewPanel"><div class="parent-preview-placeholder"><b>Message preview</b><span>Select Preview on a recipient to review the WhatsApp message here.</span></div></aside></div></section>
  `);
}

window.setParentCardSent = async (testId,studentId,checked)=>{
  const sent = readJSON(LS_PARENT_SENT,{});
  const key = parentSentKey(testId,studentId);
  if(checked) sent[key] = new Date().toISOString();
  else delete sent[key];
  writeJSON(LS_PARENT_SENT,sent);
  renderParents(await DB.listTests());
};

window.setWhatsAppApp = value=>{
  localStorage.setItem(LS_WHATSAPP_APP,value==='business'?'business':'personal');
};

const parentEsc = text=>String(text||'').replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]));

window.previewParentMessage = (message,testId,studentId)=>{
  const panel=document.getElementById('parentPreviewPanel');
  if(!panel) return alert(message ? decodeURIComponent(message) : 'Select Preview on a recipient to review the WhatsApp message here.');
  if(!message){
    panel.innerHTML='<div class="parent-preview-placeholder"><b>Message preview</b><span>Select Preview on a recipient to review the WhatsApp message here.</span></div>';
    return;
  }
  const text=decodeURIComponent(message);
  PARENT_PREVIEW={testId:testId||'',studentId:studentId||'',message};
  const editButton=testId&&studentId ? '<button class="parent-action edit" onclick="editParentMessageFromPreview()">Edit message</button>' : '';
  panel.innerHTML=`<div class="parent-preview-content"><b>Message preview</b><pre>${parentEsc(text)}</pre><div class="parent-preview-actions">${editButton}</div></div>`;
};

window.editParentMessage = (testId,studentId,message)=>{
  const panel=document.getElementById('parentPreviewPanel');
  if(!panel) return;
  const text=decodeURIComponent(message||'');
  PARENT_PREVIEW={testId,studentId,message};
  panel.innerHTML=`<div class="parent-preview-content"><b>Edit message</b><textarea id="parentMessageEditor" class="parent-message-editor">${parentEsc(text)}</textarea><div class="parent-preview-actions"><button class="primary" onclick="saveParentMessage('${testId}','${studentId}')">Save message</button><button class="parent-action" onclick="cancelParentMessageEdit()">Cancel</button><button class="parent-action" onclick="resetParentMessage('${testId}','${studentId}')">Reset generated</button></div></div>`;
  document.getElementById('parentMessageEditor')?.focus();
};

window.editParentMessageFromPreview = ()=>editParentMessage(PARENT_PREVIEW.testId,PARENT_PREVIEW.studentId,PARENT_PREVIEW.message);
window.cancelParentMessageEdit = ()=>previewParentMessage(PARENT_PREVIEW.message,PARENT_PREVIEW.testId,PARENT_PREVIEW.studentId);

window.saveParentMessage = async (testId,studentId)=>{
  const editor=document.getElementById('parentMessageEditor');
  if(!editor) return;
  const value=editor.value.trim();
  if(!value){ alert('Message cannot be empty.'); return; }
  PARENT_MESSAGE_OVERRIDES[parentMessageKey(testId,studentId)] = value;
  await renderParents(await DB.listTests());
};

window.resetParentMessage = async (testId,studentId)=>{
  delete PARENT_MESSAGE_OVERRIDES[parentMessageKey(testId,studentId)];
  await renderParents(await DB.listTests());
};

window.sendParentRecipient = (testId,studentId,message)=>{
  const phone=PARENT_PHONE_LOOKUP[parentMessageKey(testId,studentId)];
  if(!phone) return alert('This student does not have a valid phone number.');
  openParentWhatsApp(phone,message);
};

window.setParentSearch = async value=>{
  PARENT_FILTER.search=value;
  await renderParents(await DB.listTests());
  const input=document.querySelector('.parent-list-tools input');
  if(input){input.focus();input.setSelectionRange(value.length,value.length);}
};

window.setParentStatus = async value=>{
  PARENT_FILTER.status=value;
  renderParents(await DB.listTests());
};

window.openParentWhatsApp = (phone,message)=>{
  const fallback = `https://wa.me/91${phone}?text=${message}`;
  if(!/Android/i.test(navigator.userAgent)){
    window.open(fallback,'_blank','noopener');
    return;
  }
  const packageName = preferredWhatsAppApp()==='business' ? 'com.whatsapp.w4b' : 'com.whatsapp';
  window.location.href = `intent://send?phone=91${phone}&text=${message}#Intent;scheme=whatsapp;package=${packageName};S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
};

window.sendAllParentCards = ()=>{
  const items = PARENT_BULK_ITEMS.slice();
  if(!items.length){
    alert('No unsent parent cards with valid phone numbers.');
    return;
  }
  if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
    alert('WhatsApp mobile can open only one private chat at a time. Please use each Send button so every parent receives the correct private message.');
    return;
  }
  if(!confirm(`Open ${items.length} separate private WhatsApp chats? Your browser may ask you to allow pop-ups.`)) return;
  let openedCount = 0;
  items.forEach(item=>{
    const popup = window.open('about:blank','_blank');
    if(!popup) return;
    popup.opener = null;
    popup.location.href = `https://wa.me/91${item.phone}?text=${item.message}`;
    openedCount++;
  });
  if(openedCount<items.length){
    alert(`Opened ${openedCount} of ${items.length} chats. Allow pop-ups for this website, then try Send all unsent again.`);
  }
};

window.setParentFilter = async (key,value)=>{
  const tests = await DB.listTests();
  const previousTestId=PARENT_FILTER.testId;
  if(key==='recent'){
    const selected = tests.find(t=>t.id===value);
    if(selected){
      if(previousTestId && previousTestId!==selected.id) PARENT_MESSAGE_OVERRIDES={};
      PARENT_FILTER = {
        cls:String(selected.class_level||''),
        section:selected.section||'All',
        subject:selected.subject||'',
        testId:selected.id,
        student:'All', search:PARENT_FILTER.search||'', status:PARENT_FILTER.status||'all'
      };
    } else {
      PARENT_FILTER.testId = '';
    }
  } else {
    PARENT_FILTER[key] = value;
    if(key==='testId' && previousTestId!==value) PARENT_MESSAGE_OVERRIDES={};
    if(key==='cls' || key==='section' || key==='subject'){
      PARENT_FILTER.testId = '';
      PARENT_FILTER.student = 'All';
    }
  }
  renderParents(tests);
};
window.navHavRoster = ()=>roster();
