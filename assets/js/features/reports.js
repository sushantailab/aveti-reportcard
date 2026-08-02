/* ---------- TEACHER REPORT ---------- */
let TEACHER_FILTER = { cls:'', section:'', subject:'', testId:'' };
let TEACHER_SHOW_ALL = false;

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
      testId:recent.id
    };
  }
  renderTeacher(tests);
}

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
  const matching = (TEACHER_FILTER.cls && TEACHER_FILTER.section && TEACHER_FILTER.subject)
    ? tests.filter(t=>String(t.class_level)===String(TEACHER_FILTER.cls) && (t.section||'All')===TEACHER_FILTER.section && t.subject===TEACHER_FILTER.subject)
    : [];
  const chapters = (TEACHER_FILTER.cls && TEACHER_FILTER.subject)
    ? await DB.listChapters(Number(TEACHER_FILTER.cls),TEACHER_FILTER.subject)
    : [];
  const chapterEntries = chapters.map(chapter=>({chapter,test:teacherChapterTest(chapter,matching)}));
  const selectedEntry = chapterEntries.find(entry=>entry.test?.id===TEACHER_FILTER.testId);
  if(TEACHER_FILTER.testId && !selectedEntry) TEACHER_FILTER.testId = '';
  const chapterOptions = [
    `<option value="" ${TEACHER_FILTER.testId?'':'selected'} disabled>${chapters.length?'Choose a completed chapter':'Choose class and subject first'}</option>`,
    ...chapterEntries.map(({chapter,test})=>test
      ? `<option value="${test.id}" ${test.id===TEACHER_FILTER.testId?'selected':''} style="color:#28613b">✓ ${chapterOptionLabel(chapter)} · Done</option>`
      : `<option value="" disabled style="color:#77837c">${chapterOptionLabel(chapter)} · Pending</option>`
    )
  ].join('');
  return `
    <div class="card pad teacher-filter" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Class</label><select onchange="setTeacherFilter('cls',this.value)">${clsOpts}</select></div>
        <div class="field"><label>Section</label><select onchange="setTeacherFilter('section',this.value)">${secOpts}</select></div>
        <div class="field"><label>Subject</label><select onchange="setTeacherFilter('subject',this.value)">${subOpts}</select></div>
        <div class="field"><label>Chapter</label><select class="teacher-chapter-select" onchange="setTeacherFilter('testId',this.value)" ${chapters.length?'':'disabled'}>${chapterOptions}</select></div>
      </div>
    </div>`;
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
  const students = await DB.listStudents();
  const studentById = new Map(students.map(s=>[s.id,s]));
  const rs = (await cachedResults(test.id)).filter(result=>studentById.has(result.student_id));
  // Archived/deleted students remain recoverable in the database, but must not appear in active reports.
  let rows = rs.filter(r=>studentById.has(r.student_id)).map(r=>({name:studentById.get(r.student_id).name,marks:r.marks,present:r.present,na:!!r.na,p:(!r.na&&r.present)?pct(r.marks,test.full_marks):null}));
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
  const leaderboardRows = (TEACHER_SHOW_ALL ? present : present.slice(0,10)).map((r,i)=>`
    <div class="teacher-leader-row">
      <div class="teacher-leader-rank ${i<3?'medal-'+(i+1):''}">${i+1}</div>
      <div class="teacher-leader-name"><b>${r.name}</b><span>Section ${test.section||'All'}</span></div>
      <div class="teacher-leader-bar"><span style="width:${r.p}%"></span></div>
      <strong>${r.p}%</strong>
    </div>`).join('');
  const supportCount = present.filter(row=>row.p<60).length;
  const attendance = enrolled-naCount ? Math.round(appearedCount/(enrolled-naCount)*1000)/10 : null;
  show(`
    ${await teacherFilterBar(tests)}
    <div class="card pad teacher-report teacher-insight-report">
      <div class="teacher-insight-title">Teacher assessment insight report</div>
      <div class="teacher-insight-head">
        <div class="brandbar"><img class="brandlogo centre-output-logo" alt="${CONFIG.CENTRE.name} logo" src="${CONFIG.CENTRE.logo_url||'assets/images/aveti-logo.png'}"><div><div class="teacher-centre-name">${CONFIG.CENTRE.name}</div><div class="teacher-report-name">Teacher report</div><h1>Class ${test.class_level} · Section ${test.section||'All'} · ${test.subject}</h1><div class="teacher-print-contact">${CONFIG.CENTRE.address}${CONFIG.CENTRE.phone?' · Ph '+CONFIG.CENTRE.phone:''}</div></div></div>
        <div class="teacher-test-meta"><b>▣ ${testTypeLabel(test.test_type)} · ${test.full_marks} marks · ${fmtDate(testDate(test))}</b><span>▤ Assessment scope: ${chapterDetail(test)}</span></div>
      </div>
      <div class="teacher-summary-grid">
        <div class="teacher-summary-card average"><i>▥</i><span>Class average<b>${avg??'—'}%</b></span></div>
        <div class="teacher-summary-card highest"><i>♛</i><span>Highest<b>${hi?hi.p+'%':'—'}</b><small>${hi?hi.name:''}</small></span></div>
        <div class="teacher-summary-card attendance"><i>♚</i><span>Exam attendance<b>${attendance??'—'}${attendance==null?'':'%'}</b><small>${appearedCount} of ${enrolled-naCount||0} applicable students</small></span></div>
        <div class="teacher-summary-card support"><i>⊕</i><span>Students need support<b>${supportCount}</b><small>Below 60%</small></span></div>
      </div>
      <div class="teacher-group-heading">Student groups <span>(by score range)</span></div>
      <div class="teacher-score-groups">${groupCards}</div>
      <div class="teacher-bottom-grid">
        <section class="teacher-leaderboard"><div class="teacher-board-heading"><div><h2>♛ Top performers</h2><span>Students who appeared, ranked by this assessment</span></div><span class="teacher-axis">0%　25%　50%　75%　100%</span></div>${leaderboardRows||'<div class="muted">No submitted marks yet.</div>'}${present.length>10?`<button class="teacher-show-all" onclick="setTeacherShowAll()">${TEACHER_SHOW_ALL?'Show Top 10':`View full ranking (${present.length})`}</button>`:''}</section>
        <section class="teacher-absentees"><h2>⚠ Exam absentees</h2><b>${absentCount} student${absentCount===1?'':'s'} absent</b><span>Not included in score groups</span>${absentRows.length?`<div>${absentRows.map(row=>`<p>● ${row.name}</p>`).join('')}</div>`:'<p class="muted">All applicable students appeared.</p>'}</section>
      </div>
      ${naList}
      <div class="teacher-next-actions"><div><i>♟</i><span><b>1. Create support groups</b>Form small groups for peer learning.</span></div><div><i>▣</i><span><b>2. Assign revision worksheet</b>Give targeted practice to developing students.</span></div><div><i>☏</i><span><b>3. Share parent cards</b>Communicate performance and next steps.</span></div></div>
      <div class="row report-actions" style="margin-top:16px;gap:8px">
        <button onclick="enterMarks('${test.id}')">Edit marks</button>
        <button onclick="exportTeacherCSV('${test.id}')">Download CSV</button>
        <button onclick="printTeacherReport()">🖨 Print / Save as PDF</button>
        <button class="primary" onclick="openParents('${test.id}')">Share parent cards</button>
      </div>
    </div>
  `);
}

window.setTeacherFilter = async (key,value)=>{
  const tests = await DB.listTests();
  TEACHER_FILTER[key] = value;
  TEACHER_SHOW_ALL = false;
  if(key==='cls' || key==='section' || key==='subject') TEACHER_FILTER.testId = '';
  await renderTeacher(tests);
};

window.setTeacherShowAll = async ()=>{
  TEACHER_SHOW_ALL = !TEACHER_SHOW_ALL;
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
let PARENT_FILTER = { cls:'', section:'', subject:'', testId:'', student:'All' };
let PARENT_BULK_ITEMS = [];

async function openParents(testId){
  const tests = await DB.listTests();
  setCrumb('Parent report');
  if(testId){
    const selected = tests.find(t=>t.id===testId);
    if(selected){
      PARENT_FILTER = {
        cls:String(selected.class_level||''),
        section:selected.section||'All',
        subject:selected.subject||'',
        testId:selected.id,
        student:'All'
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
      student:'All'
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
  const studentOpts = '<option value="All">All students</option>' + classStudents.map(s=>`<option value="${s.id}" ${s.id===PARENT_FILTER.student?'selected':''}>${s.name}</option>`).join('');
  if(PARENT_FILTER.student!=='All' && !classStudents.some(s=>s.id===PARENT_FILTER.student)) PARENT_FILTER.student = 'All';
  return `
    <div class="card pad" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Recent</label><select onchange="setParentFilter('recent',this.value)">${recentOpts}</select></div>
        <div class="field"><label>Class</label><select onchange="setParentFilter('cls',this.value)">${clsOpts}</select></div>
        <div class="field"><label>Section</label><select onchange="setParentFilter('section',this.value)">${secOpts}</select></div>
        <div class="field"><label>Subject</label><select onchange="setParentFilter('subject',this.value)">${subOpts}</select></div>
        <div class="field"><label>Chapter</label><select onchange="setParentFilter('testId',this.value)" ${matching.length?'':'disabled'}>${chapOpts}</select></div>
        <div class="field"><label>Student</label><select onchange="setParentFilter('student',this.value)">${studentOpts}</select></div>
      </div>
    </div>`;
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
  const activeStudentIds = new Set(students.map(student=>student.id));
  const rs = await activeResultsForTest(test,activeStudentIds);
  const allResults = await DB.allResults();
  const availableChapters = await DB.listChapters(test.class_level,test.subject);
  const chapterNumberById = new Map(availableChapters.map(chapter=>[String(chapter.id),Number(chapter.chapter_no)]));
  const selectedChapterIds = test.chapter_ids?.length ? test.chapter_ids : [test.chapter_id].filter(Boolean);
  const chapterNumbers = selectedChapterIds.map(id=>chapterNumberById.get(String(id))).filter(Number.isFinite);
  const avg = await classAverage(test,activeStudentIds);
  const enrolled = rs.length;
  const appearedCount = rs.filter(r=>!r.na && r.present).length;
  PARENT_BULK_ITEMS = [];
  let rows='';
  rs.filter(r=>(r.na || !r.present || r.marks!=null) && (PARENT_FILTER.student==='All' || r.student_id===PARENT_FILTER.student)).forEach(r=>{
    const s = students.find(x=>x.id===r.student_id);
    if(!s) return;
    const isNA = !!r.na;
    const isAbsent = !isNA && !r.present;
    const p = !isNA && !isAbsent ? pct(r.marks,test.full_marks) : null;
    const context = {...parentNotificationContext(test,r.student_id,tests,allResults),chapterNumbers};
    const message = parentWhatsAppMessage(test,s.name,r,avg,context);
    const msg = encodeURIComponent(message);
    const phone = normalizeIndianPhone(s.parent_phone);
    const sent = parentCardWasSent(test.id,r.student_id);
    if(phone && !sent && !isNA) PARENT_BULK_ITEMS.push({phone,message:msg,studentId:r.student_id});
    rows += `<div class="listrow">
      ${avatar(s.gender,s.name)}
      <div style="flex:1;min-width:0"><div>${s.name}</div><div class="tiny faint">${p==null?(isNA?'N.A. · Did not appear':'Absent · Did not appear'):`${r.marks}/${test.full_marks} · ${p}% · Grade ${band(p)}`}</div></div>
      ${isNA
        ? '<span class="pill">No notification needed</span>'
        : phone
        ? `<a class="link small" style="margin-right:6px">${phone}</a><button style="padding:7px 12px" data-message="${msg}" onclick="previewParentMessage(this.dataset.message)">Preview</button><button class="primary" style="padding:7px 12px" data-phone="${phone}" data-message="${msg}" onclick="openParentWhatsApp(this.dataset.phone,this.dataset.message)">Send</button>
           <label class="small muted" style="display:flex;align-items:center;gap:5px;white-space:nowrap;cursor:pointer"><input type="checkbox" style="width:auto" ${sent?'checked':''} onchange="setParentCardSent('${test.id}','${r.student_id}',this.checked)"> Sent</label>`
        : `<span class="pill warn" style="margin-right:6px">invalid/missing phone</span><button onclick="alert('Add a valid Indian 10-digit parent phone number in Students before sending this parent card.')">Send</button>`}
    </div>`;
  });
  show(`
    ${parentFilterBar(tests, students)}
    <div class="card pad">
      <div class="row between" style="border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div class="brandbar"><img class="brandlogo centre-output-logo" style="height:24px" alt="${CONFIG.CENTRE.name} logo" src="${CONFIG.CENTRE.logo_url||'assets/images/aveti-logo.png'}"><div><div style="font-weight:600">Share parent cards · ${CONFIG.CENTRE.name}</div><div class="tiny faint">${testOptionLabel(test)} · ${testTypeLabel(test.test_type)} · ${test.full_marks} marks · ${appearedCount} of ${enrolled} appeared</div></div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <label class="small muted" style="display:flex;align-items:center;gap:8px">Send with
            <select style="width:auto;min-width:170px" onchange="setWhatsAppApp(this.value)">
              <option value="personal" ${preferredWhatsAppApp()==='personal'?'selected':''}>WhatsApp</option>
              <option value="business" ${preferredWhatsAppApp()==='business'?'selected':''}>WhatsApp Business</option>
            </select>
          </label>
          <button class="primary" onclick="sendAllParentCards()" ${PARENT_BULK_ITEMS.length?'':'disabled'}>Send all unsent (${PARENT_BULK_ITEMS.length})</button>
        </div>
      </div>
      <div class="banner" style="margin-bottom:14px">Each message highlights progress and one practical next step. N.A. results are not sent.</div>
      <div class="small muted" style="margin-bottom:4px">Recipients</div>
      ${rows||'<div class="muted small" style="padding:8px 0">No student result found for this selection.</div>'}
      <div class="tiny faint" style="margin-top:12px">Tap <b>Send</b> to open that parent's WhatsApp with the message ready. (In demo, links open real WhatsApp web — they won't send by themselves.)</div>
    </div>
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

window.previewParentMessage = message=>{
  alert(decodeURIComponent(message));
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
  if(key==='recent'){
    const selected = tests.find(t=>t.id===value);
    if(selected){
      PARENT_FILTER = {
        cls:String(selected.class_level||''),
        section:selected.section||'All',
        subject:selected.subject||'',
        testId:selected.id,
        student:'All'
      };
    } else {
      PARENT_FILTER.testId = '';
    }
  } else {
    PARENT_FILTER[key] = value;
    if(key==='cls' || key==='section' || key==='subject'){
      PARENT_FILTER.testId = '';
      PARENT_FILTER.student = 'All';
    }
  }
  renderParents(tests);
};
window.navHavRoster = ()=>roster();
