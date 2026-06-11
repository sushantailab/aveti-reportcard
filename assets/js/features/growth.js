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
  if(!classStudents.some(s=>s.id===GR.student)) GR.student = classStudents[0] ? classStudents[0].id : null;
  const tests = allTests
    .filter(t=>
      String(t.class_level)===String(GR.cls) &&
      selectedTestSectionMatches(t.section, GR.section) &&
      t.subject===GR.subject
    )
    .sort((a,b)=>(Number(a.chapter_no)||0)-(Number(b.chapter_no)||0));
  const filterBar = growthFilterBar();
  const controls = `
    <div class="row between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
      <div><h2 style="font-size:18px">Marks journey</h2><div class="muted small">Percentage across chapters</div></div>
      <div class="row" style="gap:8px">
        <div class="seg"><button class="${GR.mode==='class'?'on':''}" onclick="setGrowthMode('class')">Class trend</button><button class="${GR.mode==='ind'?'on':''}" onclick="setGrowthMode('ind')">Individual</button></div>
        <select style="width:auto;${GR.mode==='ind'?'':'display:none'}" onchange="setGrowthStudent(this.value)">${growthStudentOptions(classStudents)}</select>
      </div>
    </div>`;
  if(tests.length<2){
    show(`
      ${filterBar}
      <div class="card pad">
        ${controls}
        <div class="muted" style="margin-top:8px">Add one more chapter test for ${GR.subject} to see the trend.</div>
        <div style="margin-top:12px"><button onclick="classInsights({cls:GR.cls,section:GR.section,subject:GR.subject})">View class insights</button></div>
      </div>
    `);
    return;
  }
  const allRes = await DB.allResults();
  const labels = tests.map(t=>chapterLabel(t));
  const classSeries = [];
  for(const t of tests){ classSeries.push(await classAverage(t)); }
  const studentSeries = tests.map(t=>{
    const r = allRes.find(x=>x.test_id===t.id && x.student_id===GR.student);
    return (r&&!r.na&&r.present&&r.marks!=null)?pct(r.marks,t.full_marks):null;
  });
  const sName = (students.find(s=>s.id===GR.student)||{}).name||'';
  const series = GR.mode==='class'
    ? [{name:'Class average',data:classSeries,color:'#378ADD',w:3}]
    : [{name:sName,data:studentSeries,color:'var(--teal)',w:3},{name:'Class average',data:classSeries,color:'#888780',w:1.5,dash:true}];
  show(`
    ${filterBar}
    <div class="card pad">
      ${controls}
      ${lineChartSVG(labels, series)}
      <div style="margin-top:12px"><button onclick="classInsights({cls:GR.cls,section:GR.section,subject:GR.subject})">View class insights</button></div>
    </div>
  `);
}

function growthFilterBar(){
  return `
    <div class="card pad" style="margin-bottom:14px">
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

window.setGrowthFilter = (key,value)=>{
  GR[key] = value;
  if(key==='cls') GR.student = null;
  growth();
};
window.setGrowthMode = m=>{ GR.mode=m; growth(); };
window.setGrowthStudent = id=>{ GR.student=id; growth(); };

function lineChartSVG(labels, series){
  const W=680,H=300,pad={l:38,r:14,t:16,b:34};
  const iw=W-pad.l-pad.r, ih=H-pad.t-pad.b;
  const x=i=>pad.l + (labels.length<=1?iw/2:(i*iw/(labels.length-1)));
  const y=v=>pad.t + ih - (v/100*ih);
  let grid='';
  [0,25,50,75,100].forEach(g=>{ grid+=`<line x1="${pad.l}" y1="${y(g)}" x2="${W-pad.r}" y2="${y(g)}" stroke="#eef1ee"/><text x="${pad.l-8}" y="${y(g)+4}" font-size="11" fill="#8a978d" text-anchor="end">${g}%</text>`; });
  let xl=labels.map((l,i)=>`<text x="${x(i)}" y="${H-12}" font-size="11" fill="#8a978d" text-anchor="middle">${l}</text>`).join('');
  let paths='',dots='',legend='';
  series.forEach((s,si)=>{
    let d='',open=false;
    s.data.forEach((v,i)=>{
      if(v==null){ open=false; return; }
      const p=[x(i),y(v)];
      d+=(open?'L':'M')+p[0]+' '+p[1]+' ';
      open=true;
      dots+=`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${s.color}"/>`;
    });
    if(d) paths+=`<path d="${d.trim()}" fill="none" stroke="${s.color}" stroke-width="${s.w}" ${s.dash?'stroke-dasharray="6 4"':''} stroke-linecap="round" stroke-linejoin="round"/>`;
    legend+=`<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--muted);margin-right:16px"><span style="width:${s.dash?'14px':'10px'};height:${s.dash?'0':'10px'};${s.dash?'border-bottom:2px dashed '+s.color:'background:'+s.color+';border-radius:2px'}"></span>${s.name}</span>`;
  });
  return `<div style="margin-bottom:6px">${legend}</div><svg viewBox="0 0 ${W} ${H}" width="100%">${grid}${paths}${dots}${xl}</svg>`;
}
