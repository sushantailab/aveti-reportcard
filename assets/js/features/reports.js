/* ---------- TEACHER REPORT ---------- */
let TEACHER_FILTER = { cls:'', section:'', subject:'', testId:'' };

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

function teacherFilterBar(tests){
  const recentOpts = '<option value="">Recent exam</option>' + tests.slice(0,12).map(t=>`<option value="${t.id}" ${t.id===TEACHER_FILTER.testId?'selected':''}>${testOptionLabel(t)}</option>`).join('');
  const clsOpts = '<option value="">Class</option>' + CLASSES.map(c=>`<option value="${c}" ${String(c)===String(TEACHER_FILTER.cls)?'selected':''}>Class ${c}</option>`).join('');
  const secOpts = '<option value="">Section</option>' + ['All','A','B'].map(s=>`<option value="${s}" ${s===TEACHER_FILTER.section?'selected':''}>${s==='All'?'All':'Section '+s}</option>`).join('');
  const subOpts = '<option value="">Subject</option>' + SUBJECTS.map(s=>`<option value="${s}" ${s===TEACHER_FILTER.subject?'selected':''}>${s}</option>`).join('');
  const matching = (TEACHER_FILTER.cls && TEACHER_FILTER.section && TEACHER_FILTER.subject)
    ? tests.filter(t=>String(t.class_level)===String(TEACHER_FILTER.cls) && (t.section||'All')===TEACHER_FILTER.section && t.subject===TEACHER_FILTER.subject)
    : [];
  if(TEACHER_FILTER.testId && !matching.some(t=>t.id===TEACHER_FILTER.testId)) TEACHER_FILTER.testId = '';
  const chapOpts = '<option value="">Chapter</option>' + matching.map(t=>`<option value="${t.id}" ${t.id===TEACHER_FILTER.testId?'selected':''}>${chapterDetail(t)}</option>`).join('');
  return `
    <div class="card pad teacher-filter" style="margin-bottom:14px">
      <div class="wrap-fields">
        <div class="field"><label>Recent</label><select onchange="setTeacherFilter('recent',this.value)">${recentOpts}</select></div>
        <div class="field"><label>Class</label><select onchange="setTeacherFilter('cls',this.value)">${clsOpts}</select></div>
        <div class="field"><label>Section</label><select onchange="setTeacherFilter('section',this.value)">${secOpts}</select></div>
        <div class="field"><label>Subject</label><select onchange="setTeacherFilter('subject',this.value)">${subOpts}</select></div>
        <div class="field"><label>Chapter</label><select onchange="setTeacherFilter('testId',this.value)" ${matching.length?'':'disabled'}>${chapOpts}</select></div>
      </div>
    </div>`;
}

async function renderTeacher(tests){
  const test = tests.find(t=>t.id===TEACHER_FILTER.testId);
  if(!test){
    CURRENT_TEST = null;
    show(`
      ${teacherFilterBar(tests)}
      <div class="card pad"><div class="muted">No test found for this selection.</div></div>
    `);
    return;
  }
  CURRENT_TEST = test.id;
  const rs = await cachedResults(test.id);
  const students = await DB.listStudents();
  const nameOf = id => (students.find(s=>s.id===id)||{}).name||'Unknown student';
  let rows = rs.map(r=>({name:nameOf(r.student_id),marks:r.marks,present:r.present,na:!!r.na,p:(!r.na&&r.present)?pct(r.marks,test.full_marks):null}));
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
  const bandCards = bandConfig().map((b,i)=>`
    <div class="band" style="background:${i===0?'var(--bandA)':i===1?'var(--bandB)':i===2?'var(--bandC)':'#f0f3ef'};${i===0?'flex:2':''}">
      <div class="tiny" style="color:${i===0?'#04342c':i===1?'#173404':i===2?'#412402':'var(--faint)'}">${b.grade} · ${bandRangeLabel(b)}</div>
      <div class="num" style="color:${i===0?'#04342c':i===1?'#173404':i===2?'#412402':'var(--faint)'}">${counts[b.grade]||0}</div>
    </div>`).join('');
  const list = present.map((r,i)=>`
    <div class="listrow">
      <div style="width:20px" class="tiny faint">${i+1}</div>
      <div style="flex:1">${r.name}${needsSupport(r.p)?' <span class="pill warn">needs support</span>':''}${band(r.p)==='A'?' <span class="pill ok">top performer</span>':''}</div>
      <div class="bar"><span style="width:${r.p}%;background:${bandColor(band(r.p))}"></span></div>
      <div class="num" style="width:54px;text-align:right">${r.marks}/${test.full_marks}</div>
      <div class="muted small" style="width:42px;text-align:right">${r.p}%</div>
    </div>`).join('');
  show(`
    ${teacherFilterBar(tests)}
    <div class="card pad teacher-report">
      <div class="row between report-head" style="border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div class="brandbar"><img class="brandlogo" style="height:24px" alt="Aveti Learning" src="assets/images/aveti-logo.png"><div><div style="font-weight:700">${CONFIG.CENTRE.name} · Teacher / Class Report</div><div class="tiny faint">${CONFIG.CENTRE.address} · Ph ${CONFIG.CENTRE.phone}</div><div class="small muted">Class ${test.class_level} · Section ${test.section||'All'} · <span class="report-highlight">${test.subject} · ${chapterDetail(test)}</span> · ${appearedCount} of ${enrolled} appeared</div></div></div>
        <div class="small muted" style="text-align:right">${test.test_type} · ${test.full_marks} marks · ${fmtDate(testDate(test))}</div>
      </div>
      <div class="row" style="gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <div class="metric"><div class="tiny muted">Class average</div><div class="n">${avg??'—'}%</div></div>
        <div class="metric"><div class="tiny muted">Highest</div><div class="n">${hi?hi.p+'%':'—'}</div><div class="tiny faint">${hi?hi.name:''}</div></div>
        <div class="metric"><div class="tiny muted">Lowest</div><div class="n">${lo?lo.p+'%':'—'}</div><div class="tiny faint">${lo?lo.name:''}</div></div>
        <div class="metric"><div class="tiny muted">Appeared</div><div class="n">${appearedCount} of ${enrolled}</div><div class="tiny faint">${naCount} N.A.</div></div>
        <div class="metric"><div class="tiny muted">Absent</div><div class="n">${absentCount}</div><div class="tiny faint">${absentCount?absentRows.map(r=>r.name).slice(0,2).join(', '):'None'}${absentCount>2?' +' + (absentCount-2):''}</div></div>
      </div>
      <div class="small muted">Score bands</div>
      <div class="bands">
        ${bandCards}
      </div>
      <div class="small muted report-section-label" style="margin:14px 0 4px">Ranked results</div>
      ${list}
      ${absentList}
      ${naList}
      <div class="row report-actions" style="margin-top:16px;gap:8px">
        <button onclick="enterMarks('${test.id}')">Edit marks</button>
        <button onclick="exportTeacherCSV('${test.id}')">Download CSV</button>
        <button onclick="exportTeacherPDF('${test.id}')">Download PDF</button>
        <button onclick="printTeacherReport()">🖨 Print / PDF</button>
        <button class="primary" onclick="openParents('${test.id}')">Share parent cards</button>
      </div>
    </div>
  `);
}

window.setTeacherFilter = async (key,value)=>{
  const tests = await DB.listTests();
  if(key==='recent'){
    const selected = tests.find(t=>t.id===value);
    if(selected){
      TEACHER_FILTER = {
        cls:String(selected.class_level||''),
        section:selected.section||'All',
        subject:selected.subject||'',
        testId:selected.id
      };
    } else {
      TEACHER_FILTER.testId = '';
    }
  } else {
    TEACHER_FILTER[key] = value;
    if(key==='cls' || key==='section' || key==='subject') TEACHER_FILTER.testId = '';
  }
  renderTeacher(tests);
};

window.printTeacherReport = ()=>{
  alert('For a clean one-page report: choose A4, open More settings, and turn off Headers and footers. This removes the date, website URL, report title, and page numbers added by the browser.');
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
    {text:`${test.test_type} | ${test.full_marks} marks | ${fmtDate(testDate(test))}`,x:40,y:726,size:11},
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
  const rs = await cachedResults(test.id);
  const avg = await classAverage(test);
  const enrolled = rs.length;
  const appearedCount = rs.filter(r=>!r.na && r.present).length;
  PARENT_BULK_ITEMS = [];
  let rows='';
  rs.filter(r=>(r.na || !r.present || r.marks!=null) && (PARENT_FILTER.student==='All' || r.student_id===PARENT_FILTER.student)).forEach(r=>{
    const s = students.find(x=>x.id===r.student_id)||{};
    const shortName = parentMessageName(s.name);
    const isNA = !!r.na;
    const isAbsent = !isNA && !r.present;
    const p = !isNA && !isAbsent ? pct(r.marks,test.full_marks) : null;
    const pb = p==null ? null : perfBand(p);
    const attendanceLine = isNA
      ? 'Did not appear.'
      : 'Absent from exam.';
    const message = p==null
      ? `Dear Parents,

Aveti's Chapter End Test (CET) Report for ${shortName}:

• Subject: ${test.subject} (${chapterLabel(test)})
• Attendance: ${attendanceLine}
• Class Average: ${avg}%

Please contact the centre if you need any clarification.

Thanks,
${CONFIG.CENTRE.name}`
      :
`Dear Parents,

Aveti's Chapter End Test (CET) Report for ${shortName}:

• Subject: ${test.subject} (${chapterLabel(test)})
• Student Score: ${r.marks} / ${test.full_marks} (${p}%)
• Class Average: ${avg}%
• Performance: ${pb.label}

${pb.line(shortName)}

Thanks,
${CONFIG.CENTRE.name}`;
    const msg = encodeURIComponent(message);
    const phone = normalizeIndianPhone(s.parent_phone);
    const sent = parentCardWasSent(test.id,r.student_id);
    if(phone && !sent) PARENT_BULK_ITEMS.push({phone,message:msg,studentId:r.student_id});
    rows += `<div class="listrow">
      ${avatar(s.gender,s.name)}
      <div style="flex:1;min-width:0"><div>${s.name}</div><div class="tiny faint">${p==null?(isNA?'N.A. · Did not appear':'Absent · Did not appear'):`${r.marks}/${test.full_marks} · ${p}% · Grade ${band(p)}`}</div></div>
      ${phone
        ? `<a class="link small" style="margin-right:6px">${phone}</a><button class="primary" style="padding:7px 12px" data-phone="${phone}" data-message="${msg}" onclick="openParentWhatsApp(this.dataset.phone,this.dataset.message)">Send</button>
           <label class="small muted" style="display:flex;align-items:center;gap:5px;white-space:nowrap;cursor:pointer"><input type="checkbox" style="width:auto" ${sent?'checked':''} onchange="setParentCardSent('${test.id}','${r.student_id}',this.checked)"> Sent</label>`
        : `<span class="pill warn" style="margin-right:6px">invalid/missing phone</span><button onclick="alert('Add a valid Indian 10-digit parent phone number in Students before sending this parent card.')">Send</button>`}
    </div>`;
  });
  show(`
    ${parentFilterBar(tests, students)}
    <div class="card pad">
      <div class="row between" style="border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:14px;flex-wrap:wrap;gap:8px">
        <div class="brandbar"><img class="brandlogo" style="height:24px" alt="Aveti Learning" src="assets/images/aveti-logo.png"><div><div style="font-weight:600">Share parent cards</div><div class="tiny faint">${testOptionLabel(test)} · ${test.test_type} · ${test.full_marks} marks · ${appearedCount} of ${enrolled} appeared</div></div></div>
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
      <div class="banner" style="margin-bottom:14px">🔒 Each parent receives only their own child's result — never the class list or rank.</div>
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
