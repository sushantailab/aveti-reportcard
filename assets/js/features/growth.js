/* ---------- GROWTH ---------- */
let GR = { mode:'class', student:null, cls:'', section:'All', subject:'' };

async function growth(){
  setCrumb('Growth tracker');
  const allTests = await DB.listTests();
  const students = await DB.listStudents();
  if((!GR.cls || !GR.subject) && allTests[0]){
    GR.cls = String(allTests[0].class_level||'');
    GR.section = allTests[0].section || 'All';
    GR.subject = allTests[0].subject || SUBJECTS[0];
  }
  if(!GR.cls) GR.cls = '1';
  if(!GR.section) GR.section = 'All';
  if(!GR.subject) GR.subject = SUBJECTS[0];
  const classStudents = students.filter(s=>
    String(s.class_level)===String(GR.cls) &&
    selectedSectionMatches(s.section, GR.section)
  );
  const activeStudentIds = new Set(classStudents.map(student=>student.id));
  if(!classStudents.some(s=>s.id===GR.student)) GR.student = classStudents[0] ? classStudents[0].id : null;
  const tests = allTests
    .filter(t=>
      String(t.class_level)===String(GR.cls) &&
      selectedTestSectionMatches(t.section, GR.section) &&
      t.subject===GR.subject
    )
    .sort((a,b)=>(Number(a.chapter_no)||0)-(Number(b.chapter_no)||0));
  const filterBar = growthFilterBar();
  const allRes = await DB.allResults();
  const testStats = tests.map((test,index)=>{
    const applicable = allRes.filter(result=>result.test_id===test.id && activeStudentIds.has(result.student_id) && !result.na);
    const appeared = applicable.filter(result=>result.present && result.marks!=null);
    const average = appeared.length ? round1(appeared.reduce((sum,result)=>sum+pct(result.marks,test.full_marks),0)/appeared.length) : null;
    return {test,index,label:`Chapter ${Number(test.chapter_no)||index+1}`,title:chapterDetail(test),applicable:applicable.length,appeared:appeared.length,average,attendance:applicable.length?round1(appeared.length/applicable.length*100):null};
  });
  const attendedResults = tests.flatMap(test=>allRes.filter(result=>result.test_id===test.id && activeStudentIds.has(result.student_id) && !result.na && result.present && result.marks!=null).map(result=>({...result,test})));
  const applicableResults = tests.flatMap(test=>allRes
    .filter(result=>result.test_id===test.id && activeStudentIds.has(result.student_id) && !result.na)
    .map(result=>({...result,test})));
  const classAverage = attendedResults.length ? round1(attendedResults.reduce((sum,result)=>sum+Number(result.marks||0),0)/attendedResults.reduce((sum,result)=>sum+Number(result.test.full_marks||0),0)*100) : null;
  const lowest = testStats.filter(item=>item.average!=null).sort((a,b)=>a.average-b.average)[0]||null;
  const attendance = applicableResults.length ? round1(attendedResults.length/applicableResults.length*100) : null;
  const studentStats = classStudents.map(student=>{
    const applicable = applicableResults.filter(result=>result.student_id===student.id);
    const appeared = applicable.filter(result=>result.present && result.marks!=null);
    const totalMarks = appeared.reduce((sum,result)=>sum+Number(result.marks||0),0);
    const fullMarks = appeared.reduce((sum,result)=>sum+Number(result.test.full_marks||0),0);
    return {...student, applicable:applicable.length, appeared:appeared.length, percent:fullMarks?round1(totalMarks/fullMarks*100):null};
  });
  const belowForty = studentStats.filter(student=>student.percent!=null && student.percent<40);
  const missedOne = studentStats.filter(student=>student.applicable>0 && student.appeared<student.applicable);
  const noAttempt = studentStats.filter(student=>student.applicable>0 && student.appeared===0);
  const previous = testStats.at(-2);
  const latest = testStats.at(-1);
  const fall = latest?.average!=null && previous?.average!=null ? round1(latest.average-previous.average) : null;
  const labels = tests.map((t,i)=>({
    short:`Ch ${Number(t.chapter_no)||i+1}`,
    full:chapterDetail(t)
  }));
  const classSeries = testStats.map(item=>item.average);
  const studentSeries = tests.map(t=>{
    const r = allRes.find(x=>x.test_id===t.id && x.student_id===GR.student);
    return (r&&!r.na&&r.present&&r.marks!=null)?pct(r.marks,t.full_marks):null;
  });
  const sName = (students.find(s=>s.id===GR.student)||{}).name||'';
  const series = GR.mode==='class'
    ? [{name:'Class average',data:classSeries,color:'#378ADD',w:3}]
    : [{name:sName,data:studentSeries,color:'var(--teal)',w:3},{name:'Class average',data:classSeries,color:'#888780',w:1.5,dash:true}];
  const chapterTiles = testStats.length ? testStats.map(item=>{
    const lowScore = item.average!=null && item.average<60;
    const lowAttendance = item.attendance!=null && item.attendance<75;
    const note = lowAttendance ? 'Follow up attendance' : lowScore ? 'Priority support' : item.average>=70 ? 'Strong performance' : 'Reinforce concepts';
    const tileIcon = lowAttendance ? 'attendance' : lowScore ? 'low' : item.average>=70 ? 'strong' : 'focus';
    return `<div class="growth-chapter-tile ${lowScore||lowAttendance?'needs-attention':''}"><b>${item.label}</b><strong>${item.average==null?'—':item.average+'%'}</strong><span class="growth-tile-note">${note}</span><span class="growth-tile-meta">${growthIcon(tileIcon)}<span>${item.attendance==null?'No attendance data':item.attendance+'% attended'}</span></span></div>`;
  }).join('') : '<div class="empty-good">No completed chapter exams yet.</div>';
  const actionItems = [
    lowest && lowest.average<60 ? `Reteach ${lowest.title}` : null,
    belowForty.length ? `Identify ${belowForty.length} student${belowForty.length===1?'':'s'} below 40%` : null,
    missedOne.length ? `Follow up with ${missedOne.length} student${missedOne.length===1?'':'s'} who missed an exam` : null
  ].filter(Boolean);
  if(GR.mode==='ind'){
    const selectedStudent = studentStats.find(student=>student.id===GR.student) || classStudents[0];
    const scoredClass = studentStats.filter(student=>student.percent!=null).sort((a,b)=>b.percent-a.percent || a.name.localeCompare(b.name));
    const position = selectedStudent?.percent==null ? null : scoredClass.findIndex(student=>student.id===selectedStudent.id)+1;
    const latestStudentIndex = studentSeries.reduce((last,score,index)=>score==null ? last : index,-1);
    const latestStudentScore = latestStudentIndex>=0 ? studentSeries[latestStudentIndex] : null;
    const latestClassScore = latestStudentIndex>=0 ? classSeries[latestStudentIndex] : null;
    const studentAttendance = selectedStudent?.applicable ? round1(selectedStudent.appeared/selectedStudent.applicable*100) : null;
    const individualTiles = testStats.map((item,index)=>{
      const score = studentSeries[index];
      const difference = score==null || item.average==null ? null : round1(score-item.average);
      const absent = score==null;
      const status = absent ? 'Not attempted' : difference>=5 ? 'Strong' : difference<=-5 ? 'Needs revision' : 'On track';
      const tileIcon = absent ? 'attendance' : status==='Strong' ? 'strong' : status==='Needs revision' ? 'focus' : 'journey';
      const detail = absent ? 'Exam absence' : `${difference>=0?'+':''}${difference} pp vs class`;
      return `<div class="growth-chapter-tile individual ${absent||status==='Needs revision'?'needs-attention':''}"><b>${item.label}</b><strong>${absent?'—':score+'%'}</strong><span class="growth-tile-meta">${growthIcon(tileIcon)}<span>${detail}</span></span><span class="growth-tile-note">${status}</span></div>`;
    }).join('');
    const weakestIndex = studentSeries.reduce((weakest,score,index)=>score!=null && (weakest<0 || score<studentSeries[weakest]) ? index : weakest,-1);
    const nextSteps = [
      selectedStudent?.appeared<selectedStudent?.applicable ? `Discuss missed ${testStats.filter((_,index)=>studentSeries[index]==null).map(item=>item.label).join(', ')} test${selectedStudent.applicable-selectedStudent.appeared===1?'':'s'}.` : null,
      weakestIndex>=0 ? `Assign ${testStats[weakestIndex].label} revision worksheet.` : null,
      weakestIndex>=0 ? `Review weak concepts from ${testStats[weakestIndex].title}.` : null,
      'Track progress in the next assessment.'
    ].filter(Boolean);
    const latestDelta = latestStudentScore==null || latestClassScore==null ? null : round1(latestStudentScore-latestClassScore);
    show(`
      ${filterBar}
      <div class="growth-dashboard growth-individual-dashboard">
        <div class="growth-head"><div><div class="eyebrow">Aveti Learning</div><h1>Class ${GR.cls} — Individual student progress report</h1><div class="tiny muted">${GR.section==='All'?'All sections':`Section ${GR.section}`} · ${currentSession()}</div></div><div class="growth-controls"><button class="growth-print-button" onclick="window.print()">🖨 Print / Save as PDF</button><div class="seg"><button onclick="setGrowthMode('class')">Class trend</button><button class="on" onclick="setGrowthMode('ind')">Individual</button></div><select style="width:auto" onchange="setGrowthStudent(this.value)">${growthStudentOptions(classStudents)}</select></div></div>
        ${growthReportMeta()}
        <div class="growth-student-band"><span class="growth-student-avatar">${String(selectedStudent?.name||'?').split(/\s+/).map(word=>word[0]).slice(0,2).join('')}</span><div><span class="tiny muted">Student</span><b>${selectedStudent?.name||'No student selected'}</b></div></div>
        <div class="growth-summary-grid individual-summary">
          <div class="growth-summary-card"><span>${growthIcon('journey')}</span><div><small>Latest score</small><strong>${latestStudentScore==null?'—':latestStudentScore+'%'}</strong><em>${latestStudentIndex>=0?testStats[latestStudentIndex].label:'No score yet'}</em></div></div>
          <div class="growth-summary-card"><span>${growthIcon('average')}</span><div><small>Class average</small><strong>${latestClassScore==null?'—':latestClassScore+'%'}</strong><em>${latestStudentIndex>=0?testStats[latestStudentIndex].label:'No chapter data'}</em></div></div>
          <div class="growth-summary-card"><span>${growthIcon('strong')}</span><div><small>Current position</small><strong>${position==null?'—':position+' / '+scoredClass.length}</strong><em>Based on overall average</em></div></div>
          <div class="growth-summary-card attendance"><span>${growthIcon('attendance')}</span><div><small>Exam attendance</small><strong>${studentAttendance==null?'—':studentAttendance+'%'}</strong><em>${selectedStudent?`${selectedStudent.appeared} / ${selectedStudent.applicable} tests attended`:'No exam data'}</em></div></div>
        </div>
        <div class="growth-journey card"><div class="growth-journey-head"><div><h2>${growthIcon('journey')}${selectedStudent?.name||'Student'}’s performance journey</h2><p>Student score compared with class average in each chapter</p></div></div><div class="growth-chart">${tests.length?lineChartSVG(labels,series):'<div class="empty-good">Add a completed chapter exam to see the journey.</div>'}</div>${latestStudentIndex>=0?`<div class="growth-attention ${latestDelta!=null&&latestDelta<0?'show':''}"><b>${latestDelta!=null&&latestDelta<0?'Priority revision':'Latest result'}</b><span>${latestDelta==null?'Class comparison unavailable':latestDelta<0?`${testStats[latestStudentIndex].label} is ${Math.abs(latestDelta)} points below the class average.`:`${testStats[latestStudentIndex].label} is ${latestDelta} points above the class average.`}</span><strong>${latestStudentScore}%</strong></div>`:''}</div>
        <div class="growth-chapter-grid individual-chapter-grid">${individualTiles||'<div class="empty-good">No chapter results yet.</div>'}</div>
        <div class="growth-bottom-grid"><div class="card growth-action"><h2>${growthIcon('action')}Teacher next steps</h2><ol class="growth-next-steps">${nextSteps.map(step=>`<li>${step}</li>`).join('')}</ol></div></div>
        <div class="growth-footer"><button onclick="classInsights({cls:GR.cls,section:GR.section,subject:GR.subject})">View class insights</button></div>
      </div>
    `);
    return;
  }
  show(`
    ${filterBar}
    <div class="growth-dashboard">
      <div class="growth-head"><div><div class="eyebrow">Aveti Learning</div><h1>Class ${GR.cls} — ${GR.subject} chapterwise growth report</h1><div class="tiny muted">${GR.section==='All'?'All sections':`Section ${GR.section}`}</div></div><div class="growth-controls"><button class="growth-print-button" onclick="window.print()">🖨 Print / Save as PDF</button><div class="seg"><button class="${GR.mode==='class'?'on':''}" onclick="setGrowthMode('class')">Class trend</button><button class="${GR.mode==='ind'?'on':''}" onclick="setGrowthMode('ind')">Individual</button></div><select style="width:auto;${GR.mode==='ind'?'':'display:none'}" onchange="setGrowthStudent(this.value)">${growthStudentOptions(classStudents)}</select></div></div>
      ${growthReportMeta()}
      <div class="growth-summary-grid">
        <div class="growth-summary-card"><span>${growthIcon('average')}</span><div><small>Class average</small><strong>${classAverage==null?'—':classAverage+'%'}</strong><em>All attended exams</em></div></div>
        <div class="growth-summary-card ${lowest?.average<60?'alert':''}"><span>${growthIcon('low')}</span><div><small>Lowest average</small><strong>${lowest?lowest.average+'%':'—'}</strong><em>${lowest?.label||'No chapter data'}</em></div></div>
        <div class="growth-summary-card attendance"><span>${growthIcon('attendance')}</span><div><small>Exam attendance</small><strong>${attendance==null?'—':attendance+'%'}</strong><em>of applicable exams</em></div></div>
      </div>
      <div class="growth-journey card"><div class="growth-journey-head"><div><h2>${growthIcon('journey')}Class performance journey</h2><p>Class score percentage in each completed chapter</p></div></div><div class="growth-chart">${tests.length?lineChartSVG(labels,series):'<div class="empty-good">Add a completed chapter exam to see the journey.</div>'}</div>${latest&&lowest?`<div class="growth-attention ${latest===lowest?'show':''}"><b>${latest===lowest?'Attention needed':'Chapter focus'}</b><span>${latest===lowest && fall!=null && fall<0 ? `${latest.label} fell by ${Math.abs(fall)} points from ${previous.label}.` : `${lowest.label} has the lowest class average.`}</span><strong>${lowest.average}%</strong></div>`:''}</div>
      <div class="growth-chapter-grid">${chapterTiles}</div>
      <div class="growth-bottom-grid"><div class="card growth-action"><h2>${growthIcon('action')}Teacher action plan</h2>${actionItems.length?`<ul>${actionItems.map(item=>`<li>${item}</li>`).join('')}</ul>`:'<div class="empty-good">No urgent academic action identified.</div>'}</div></div>
      <div class="growth-footer"><button onclick="classInsights({cls:GR.cls,section:GR.section,subject:GR.subject})">View class insights</button></div>
    </div>
  `);
}

function growthIcon(kind){
  const paths={class:'<path d="M3 9l9-5 9 5-9 5-9-5zm4 3v4c3 2 6 2 10 0v-4"/>',subject:'<path d="M4 5.5C7 4 9.5 5 12 7c2.5-2 5-3 8-1.5v12c-3-1.5-5.5-.5-8 1-2.5-1.5-5-2.5-8-1v-12zM12 7v11"/>',average:'<path d="M5 19V11m5 8V6m5 13V9m4 10H3"/>',low:'<path d="M4 7l6 6 4-4 6 8m-5 0h5v-5"/>',attendance:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M14.5 20c.2-2.7 1.4-4.3 3.7-4.8"/>',journey:'<path d="M4 17l5-5 4 3 7-8m-5 0h5v5"/>',strong:'<path d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7z"/>',focus:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2"/>',action:'<path d="M5 4h14v16H5zM9 2v4m6-4v4M8 11h8m-8 4h5"/>'};
  return `<svg class="growth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[kind]||paths.average}</svg>`;
}

function growthFilterBar(){
  return `
    <div class="card pad growth-filter" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Class</label><select onchange="setGrowthFilter('cls',this.value)">${classOptions(GR.cls)}</select></div>
        <div class="field"><label>Section</label><select onchange="setGrowthFilter('section',this.value)">${sectionOptions(GR.section,true)}</select></div>
        <div class="field"><label>Subject</label><select onchange="setGrowthFilter('subject',this.value)">${subjectOptions(GR.subject)}</select></div>
      </div>
    </div>`;
}

function growthStudentOptions(students){
  return students.length
    ? students.map(s=>`<option value="${s.id}" ${s.id===GR.student?'selected':''}>${s.name}</option>`).join('')
    : '<option value="">No students</option>';
}

function growthReportMeta(){
  return `<div class="growth-report-meta"><div>${growthIcon('class')}<span>Class<b>Class ${GR.cls}</b></span></div><div>${growthIcon('subject')}<span>Subject<b>${GR.subject}</b></span></div></div>`;
}

window.setGrowthFilter = (key,value)=>{
  GR[key] = value;
  if(key==='cls') GR.student = null;
  growth();
};
window.setGrowthMode = m=>{ GR.mode=m; growth(); };
window.setGrowthStudent = id=>{ GR.student=id; growth(); };

function lineChartSVG(labels, series){
  const W=680,H=220,pad={l:38,r:14,t:16,b:34};
  const iw=W-pad.l-pad.r, ih=H-pad.t-pad.b;
  const x=i=>pad.l + (labels.length<=1?iw/2:(i*iw/(labels.length-1)));
  const y=v=>pad.t + ih - (v/100*ih);
  let grid='';
  [0,25,50,75,100].forEach(g=>{ grid+=`<line x1="${pad.l}" y1="${y(g)}" x2="${W-pad.r}" y2="${y(g)}" stroke="#eef1ee"/><text x="${pad.l-8}" y="${y(g)+4}" font-size="11" fill="#8a978d" text-anchor="end">${g}%</text>`; });
  let xl=labels.map((l,i)=>`<text x="${x(i)}" y="${H-12}" font-size="11" fill="#8a978d" text-anchor="middle">${l.short}</text>`).join('');
  let paths='',dots='',legend='';
  series.forEach((s,si)=>{
    let d='',open=false;
    s.data.forEach((v,i)=>{
      if(v==null){ open=false; return; }
      const p=[x(i),y(v)];
      d+=(open?'L':'M')+p[0]+' '+p[1]+' ';
      open=true;
      dots+=`<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="${s.color}"><title>${chartText(labels[i].full)} — ${chartText(s.name)}: ${v}%</title></circle>${si===0?`<text x="${p[0]}" y="${p[1]-9}" font-size="11" font-weight="700" fill="${s.color}" text-anchor="middle">${v}%</text>`:''}`;
    });
    if(d) paths+=`<path d="${d.trim()}" fill="none" stroke="${s.color}" stroke-width="${s.w}" ${s.dash?'stroke-dasharray="6 4"':''} stroke-linecap="round" stroke-linejoin="round"/>`;
    legend+=`<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-right:16px"><span style="width:${s.dash?'14px':'10px'};height:${s.dash?'0':'10px'};${s.dash?'border-bottom:2px dashed '+s.color:'background:'+s.color+';border-radius:2px'}"></span>${s.name}</span>`;
  });
  return `<div style="margin-bottom:6px">${legend}</div><svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${paths}${dots}${xl}</svg>`;
}

function chartText(value){
  return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
