/* ---------- TEACHER ACTIVATION HUB ---------- */
let TAH = { teachers:[], templates:[], selectedDay:'D1', filter:'All' };

const TAH_DAYS = ['D1','D2','D3','D4','D5','D6','D7','D8'];
const TAH_GROWTH = ['rating','referral','testimonial','detractor','reactivation'];
const TAH_LINKS = {
  app_link:'Teachers App link',
  smartclass_link:'Smart Class App link',
  video_link:'Overview video',
  sc_video:'Smart Class guide',
  feedback_form_link:'Feedback form',
  rating_link:'Rating link',
  referral_base:'Referral link'
};

const tahLanguageForBoard = board => normalizeText(board).toLowerCase().includes('odisha') ? 'od' : 'en';
const tahStatusLabel = t => t.loop_completed ? 'Activated' : t.taught ? 'Teaching' : t.prepared ? 'Preparing' : 'Not started';
const tahStatusClass = t => t.loop_completed ? 'ok' : t.taught ? 'ok' : t.prepared ? 'warn' : '';
const tahNextDay = t => `D${Math.min((Number(t.journey_day)||0)+1,8)}`;
const tahTeacherMatches = t => TAH.filter==='All' || tahStatusLabel(t)===TAH.filter || t.board===TAH.filter;

async function teacherActivation(){
  setCrumb('Teacher Activation');
  try{
    TAH.teachers = await DB.listTahTeachers();
    TAH.templates = await DB.listTahTemplates();
    renderTeacherActivation();
  }catch(e){
    show(`<div class="card pad"><h2 style="font-size:18px">Teacher Activation setup needed</h2><div class="muted" style="margin-top:8px">Run <b>supabase/migrations/20260623_teacher_activation_hub.sql</b> in Supabase, then refresh.</div><div class="tiny faint" style="margin-top:8px">${escapeHTML(e.message||e)}</div></div>`);
  }
}

function tahMetric(label,value){
  return `<div class="metric"><div class="n">${value}</div><div class="small muted">${label}</div></div>`;
}

function tahDashboard(){
  const total = TAH.teachers.length;
  const prepared = TAH.teachers.filter(t=>t.prepared).length;
  const taught = TAH.teachers.filter(t=>t.taught).length;
  const completed = TAH.teachers.filter(t=>t.loop_completed).length;
  const promoters = TAH.teachers.filter(t=>t.feedback_sentiment==='promoter').length;
  return `
    <div class="tah-hero">
      <div>
        <div class="eyebrow">Teacher Activation Hub</div>
        <h1>Prepare → Teach loop</h1>
        <p>Move enrolled teachers from Teachers App preparation to Smart Class teaching, then track the full loop.</p>
      </div>
      <div class="tah-loop">
        <span>Enrolled</span><b>→</b><span>Prepared</span><b>→</b><span>Taught</span><b>→</b><span>Activated</span>
      </div>
    </div>
    <div class="insight-metrics">
      ${tahMetric('Total',total)}
      ${tahMetric('Prepared',prepared)}
      ${tahMetric('Taught',taught)}
      ${tahMetric('Loop complete',completed)}
      ${tahMetric('Promoters',promoters)}
    </div>`;
}

function tahCSVPanel(){
  return `
    <div class="card pad" style="margin-bottom:14px">
      <div class="row between" style="gap:10px;flex-wrap:wrap">
        <div><h2 style="font-size:18px">Upload teachers</h2><div class="muted small">Required columns: Teacher Name, Mobile Number, School Name, Class, Subject, Board, Enrollment Date.</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button onclick="downloadTahCSVTemplate()">Download sample CSV</button>
          <button class="primary" onclick="document.getElementById('tahCsvInput').click()">Upload CSV</button>
          <input id="tahCsvInput" type="file" accept=".csv,text/csv" style="display:none" onchange="importTahCSV(this.files[0]);this.value=''">
        </div>
      </div>
    </div>`;
}

function tahSendPanel(){
  const options = TAH_DAYS.concat(TAH_GROWTH).map(d=>`<option value="${d}" ${TAH.selectedDay===d?'selected':''}>${d}</option>`).join('');
  const eligible = TAH.teachers.filter(t=>tahEligible(t,TAH.selectedDay) && !t.opted_out);
  const sample = eligible[0] || TAH.teachers[0];
  return `
    <div class="card pad" style="margin-bottom:14px">
      <div class="row between" style="gap:10px;flex-wrap:wrap">
        <div><h2 style="font-size:18px">Send workflow</h2><div class="muted small">Select a day, preview the merged message, then open WhatsApp for eligible teachers.</div></div>
        <div class="row" style="gap:8px">
          <select style="width:auto" onchange="setTahDay(this.value)">${options}</select>
          <button class="primary" ${eligible.length?'':'disabled'} onclick="sendTahEligible()">Open WhatsApp for ${eligible.length}</button>
        </div>
      </div>
      <div class="tah-preview">${sample ? `<b>Preview for ${escapeHTML(sample.name)}</b><pre>${escapeHTML(tahRenderMessage(sample,TAH.selectedDay))}</pre>` : '<div class="muted small">Upload teachers to preview messages.</div>'}</div>
    </div>`;
}

function tahTeachersTable(){
  const filtered = TAH.teachers.filter(tahTeacherMatches);
  const filters = ['All','Not started','Preparing','Teaching','Activated','Odisha Board','CBSE'].map(f=>`<button class="${TAH.filter===f?'primary':''}" onclick="setTahFilter('${f}')">${f}</button>`).join('');
  const rows = filtered.length ? filtered.map(t=>`
    <div class="tah-row">
      <div><b>${escapeHTML(t.name)}</b><div class="tiny faint">${escapeHTML(t.school_name||'School not set')} · ${escapeHTML(t.mobile)}</div></div>
      <div>${escapeHTML(t.class_level||'—')} · ${escapeHTML(t.subject||'—')}</div>
      <div><span class="pill">${escapeHTML(t.board||'CBSE')}</span></div>
      <div><span class="pill ${tahStatusClass(t)}">${tahStatusLabel(t)}</span><div class="tiny faint">Next: ${tahNextDay(t)}</div></div>
      <div class="tah-actions">
        <button onclick="sendTahTeacher('${t.id}','${tahNextDay(t)}')">Send next</button>
        <button onclick="markTahPrepared('${t.id}')">Prepared</button>
        <button onclick="markTahReply('${t.id}','YES')">YES</button>
        <button onclick="markTahReply('${t.id}','NOT YET')">NOT YET</button>
      </div>
    </div>`).join('') : '<div class="muted small">No teachers found for this filter.</div>';
  return `
    <div class="card pad">
      <div class="row between" style="gap:10px;flex-wrap:wrap;margin-bottom:12px">
        <div><h2 style="font-size:18px">Teachers</h2><div class="muted small">${filtered.length}/${TAH.teachers.length} shown</div></div>
        <div class="row tah-filter">${filters}</div>
      </div>
      <div class="tah-table-head"><div>Teacher</div><div>Class / Subject</div><div>Board</div><div>Status</div><div>Actions</div></div>
      ${rows}
    </div>`;
}

function renderTeacherActivation(){
  show(`
    ${demoNote}
    ${tahDashboard()}
    ${tahCSVPanel()}
    ${tahSendPanel()}
    ${tahTeachersTable()}
  `);
}

function tahTemplate(day, language){
  return TAH.templates.find(t=>t.day_key===day && t.language===language && t.active) ||
    TAH.templates.find(t=>t.day_key===day && t.language==='en' && t.active) ||
    null;
}

function tahRenderMessage(teacher, day){
  const language = teacher.language || tahLanguageForBoard(teacher.board);
  const template = tahTemplate(day, language);
  if(!template) return `No active ${day} template found for ${language}.`;
  const referral = `${TAH_LINKS.referral_base}/${teacher.referral_code||teacher.id||''}`;
  const tokens = {
    name:teacher.name,
    class:teacher.class_level || '',
    subject:teacher.subject || '',
    teacher_name:teacher.name,
    school:teacher.school_name || '',
    referral_link:referral,
    app_link:TAH_LINKS.app_link,
    smartclass_link:TAH_LINKS.smartclass_link,
    video_link:template.video_url || TAH_LINKS.video_link,
    sc_video:template.video_url || TAH_LINKS.sc_video,
    feedback_form_link:TAH_LINKS.feedback_form_link,
    rating_link:TAH_LINKS.rating_link,
    quote:''
  };
  return Object.entries(tokens).reduce((body,[key,value])=>body.replaceAll(`{${key}}`,value), template.body) + '\n\nReply STOP to pause messages.';
}

function tahEligible(t, day){
  if(t.opted_out) return false;
  if(TAH_DAYS.includes(day)) return day===tahNextDay(t);
  if(day==='rating') return t.loop_completed && t.feedback_sentiment==='promoter' && !t.rated;
  if(day==='referral') return t.loop_completed && ['promoter','passive'].includes(t.feedback_sentiment);
  if(day==='testimonial') return t.feedback_sentiment==='promoter' && !t.testimonial_sent;
  if(day==='detractor') return t.feedback_sentiment==='detractor';
  if(day==='reactivation') return !t.prepared && Number(t.journey_day)>=6;
  return false;
}

async function tahRefresh(){
  TAH.teachers = await DB.listTahTeachers();
  TAH.templates = await DB.listTahTemplates();
  renderTeacherActivation();
}

window.setTahDay = day=>{ TAH.selectedDay=day; renderTeacherActivation(); };
window.setTahFilter = filter=>{ TAH.filter=filter; renderTeacherActivation(); };

window.downloadTahCSVTemplate = ()=>{
  const rows = [
    ['Teacher Name','Mobile Number','School Name','Class','Subject','Board','Enrollment Date'],
    ['Priya Sharma','9876543210','DAV Public School','8','Science','CBSE','2026-06-23'],
    ['Rakesh Kumar','9123456789','OAV Bhubaneswar','7','Mathematics','Odisha Board','2026-06-23']
  ];
  downloadBlob('aveti-teacher-activation-template.csv','text/csv;charset=utf-8',rows.map(csvLine).join('\n'));
};

window.importTahCSV = async file=>{
  if(!file) return;
  try{
    const rows = await readCSVFile(file);
    const warnings = [];
    const seen = new Set(TAH.teachers.map(t=>cleanPhone(t.mobile)));
    const teachers = rows.map((r,i)=>{
      const rowNo = i+2;
      const name = normalizeText(r['Teacher Name'] || r.teacher_name || r.name);
      const mobile = cleanPhone(r['Mobile Number'] || r.mobile || r.phone);
      const board = normalizeText(r.Board || r.board || 'CBSE');
      if(!name || !mobile){ warnings.push(`Row ${rowNo}: missing teacher name or mobile.`); return null; }
      if(seen.has(mobile)){ warnings.push(`Row ${rowNo}: duplicate mobile (${mobile}).`); return null; }
      if(!['Odisha Board','CBSE'].includes(board)) warnings.push(`Row ${rowNo}: unknown board, using CBSE/English.`);
      seen.add(mobile);
      return {
        name,
        mobile,
        school_name:normalizeText(r['School Name'] || r.school_name || r.school),
        class_level:normalizeText(r.Class || r.class || r.class_level),
        subject:normalizeText(r.Subject || r.subject),
        board:['Odisha Board','CBSE'].includes(board) ? board : 'CBSE',
        language:tahLanguageForBoard(board),
        enrollment_date:r['Enrollment Date'] || r.enrollment_date || new Date().toISOString().slice(0,10)
      };
    }).filter(Boolean);
    if(!teachers.length){ alert(`No teachers imported.\n${warnings.join('\n')}`); return; }
    if(!confirm(`Import ${teachers.length} teacher${teachers.length===1?'':'s'}?${warnings.length?'\n\n'+warnings.slice(0,8).join('\n'):''}`)) return;
    await DB.saveTahTeachers(teachers);
    await tahRefresh();
  }catch(e){ alert(e.message || 'Could not read teacher CSV.'); }
};

window.sendTahTeacher = async (id, day)=>{
  const teacher = TAH.teachers.find(t=>t.id===id);
  if(!teacher) return;
  if(!tahEligible(teacher,day) && TAH_DAYS.includes(day) && !confirm(`${teacher.name} is not eligible for ${day}. Send anyway?`)) return;
  const phone = normalizeIndianPhone(teacher.mobile);
  if(!phone){ alert('Teacher mobile is not a valid Indian WhatsApp number.'); return; }
  const body = tahRenderMessage(teacher,day);
  const template = tahTemplate(day, teacher.language || tahLanguageForBoard(teacher.board));
  await DB.addTahMessageLog({teacher_id:id,template_id:template?.id||null,day_key:day,language:teacher.language,rendered_body:body,status:'sent',sent_by:CURRENT_USER_ID});
  const patch = {};
  if(TAH_DAYS.includes(day)) patch.journey_day = Math.max(Number(teacher.journey_day)||0, Number(day.slice(1)));
  if(['D2','D3','D4','D6'].includes(day)) patch.prepared = true;
  await DB.updateTahTeacher(id,patch);
  window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(body)}`,'_blank','noopener');
  await tahRefresh();
};

window.sendTahEligible = async ()=>{
  const teachers = TAH.teachers.filter(t=>tahEligible(t,TAH.selectedDay) && !t.opted_out);
  for(const t of teachers) await sendTahTeacher(t.id,TAH.selectedDay);
};

window.markTahPrepared = async id=>{
  await DB.updateTahTeacher(id,{prepared:true});
  await tahRefresh();
};

window.markTahReply = async (id, reply)=>{
  const teacher = TAH.teachers.find(t=>t.id===id);
  if(!teacher) return;
  const patch = {};
  if(reply==='YES'){
    patch.taught = true;
    if(teacher.prepared) patch.loop_completed = true;
  }
  await DB.addTahMessageLog({teacher_id:id,day_key:'D8',language:teacher.language,reply_text:reply,status:'replied',rendered_body:`Manual reply: ${reply}`,sent_by:CURRENT_USER_ID});
  await DB.updateTahTeacher(id,patch);
  await tahRefresh();
};

window.teacherActivation = teacherActivation;
