/* ---------- TEACHER ACTIVATION HUB ---------- */
let TAH = { teachers:[], templates:[], selectedDay:'D1', filter:'All', showAdd:false, editId:null, editTemplate:false };

const TAH_DAYS = ['D1','D2','D3','D4','D5','D6','D7','D8'];
const TAH_GROWTH = ['rating','referral','testimonial','detractor','reactivation'];
const TAH_LINK_STORE = 'aveti_tah_links';
const savedTahLinks = (()=>{ try{ return JSON.parse(localStorage.getItem(TAH_LINK_STORE)||'{}'); }catch(e){ return {}; } })();
const TAH_LINKS = {
  app_link:'Teachers App link',
  smartclass_link:'Smart Class App link',
  video_link:'Overview video',
  sc_video:'Smart Class guide',
  feedback_form_link:'Feedback form',
  rating_link:'Rating link',
  referral_base:'Referral link',
  ...savedTahLinks
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
          <button onclick="toggleTahAddTeacher()">${TAH.showAdd?'Hide form':'+ Add teacher'}</button>
          <button onclick="downloadTahCSVTemplate()">Download sample CSV</button>
          <button class="primary" onclick="document.getElementById('tahCsvInput').click()">Upload CSV</button>
          <input id="tahCsvInput" type="file" accept=".csv,text/csv" style="display:none" onchange="importTahCSV(this.files[0]);this.value=''">
        </div>
      </div>
      <div class="tah-add-form" style="display:${TAH.showAdd?'block':'none'}">
        <div class="cert-form-grid">
          <div class="field"><label>Teacher name</label><input id="tahAddName" placeholder="Priya Sharma"></div>
          <div class="field"><label>Mobile number</label><input id="tahAddMobile" placeholder="9876543210"></div>
          <div class="field"><label>Board</label><select id="tahAddBoard"><option>CBSE</option><option>Odisha Board</option></select></div>
        </div>
        <div class="cert-form-grid cert-form-grid-3">
          <div class="field"><label>School name</label><input id="tahAddSchool" placeholder="DAV Public School"></div>
          <div class="field"><label>Class</label><input id="tahAddClass" placeholder="8"></div>
          <div class="field"><label>Subject</label><input id="tahAddSubject" placeholder="Science"></div>
        </div>
        <div class="row" style="justify-content:flex-end;margin-top:10px">
          <button onclick="toggleTahAddTeacher()">Cancel</button>
          <button class="primary" onclick="addTahTeacherManual()">Save teacher</button>
        </div>
      </div>
    </div>`;
}

function tahSendPanel(){
  const options = TAH_DAYS.concat(TAH_GROWTH).map(d=>`<option value="${d}" ${TAH.selectedDay===d?'selected':''}>${d}</option>`).join('');
  const eligible = TAH.teachers.filter(t=>tahEligible(t,TAH.selectedDay) && !t.opted_out);
  const sample = eligible[0] || TAH.teachers[0];
  const template = tahTemplate(TAH.selectedDay, sample ? (sample.language || tahLanguageForBoard(sample.board)) : 'en') ||
    TAH.templates.find(t=>t.day_key===TAH.selectedDay && t.active);
  return `
    <div class="card pad" style="margin-bottom:14px">
      <div class="row between" style="gap:10px;flex-wrap:wrap">
        <div><h2 style="font-size:18px">Send workflow</h2><div class="muted small">Select a day, preview the merged message, then open WhatsApp for eligible teachers.</div></div>
        <div class="row" style="gap:8px">
          <select style="width:auto" onchange="setTahDay(this.value)">${options}</select>
          <button onclick="toggleTahTemplateEdit()">${TAH.editTemplate?'Close edit':'Edit message'}</button>
          <button class="primary" ${eligible.length?'':'disabled'} onclick="sendTahEligible()">Open WhatsApp for ${eligible.length}</button>
        </div>
      </div>
      ${TAH.editTemplate ? tahTemplateEditor(template, sample) : ''}
      <div class="tah-preview">${sample ? `<b>Preview for ${escapeHTML(sample.name)}</b><pre>${escapeHTML(tahRenderMessage(sample,TAH.selectedDay))}</pre>` : '<div class="muted small">Upload teachers to preview messages.</div>'}</div>
    </div>`;
}

function tahTemplateEditor(template, sample){
  if(!template) return `<div class="tah-template-editor"><div class="muted small">No active template found for ${escapeHTML(TAH.selectedDay)}. Run the latest template migration or choose another day.</div></div>`;
  return `
    <div class="tah-template-editor">
      <div class="row between" style="gap:10px;flex-wrap:wrap">
        <div><b>Edit ${escapeHTML(template.day_key)} message</b><div class="tiny faint">${escapeHTML((template.language||'en').toUpperCase())} template${sample ? ` · previewing ${escapeHTML(sample.name)}` : ''}</div></div>
        <div class="tiny faint">Tokens: {name}, {class}, {subject}, {app_link}, {smartclass_link}, {video_link}, {image_link}</div>
      </div>
      <div class="cert-form-grid cert-form-grid-3">
        <div class="field"><label>Message title</label><input id="tahTemplateTitle" value="${escapeHTML(template.title||'')}"></div>
        <div class="field"><label>Teachers App link</label><input id="tahAppLink" placeholder="https://..." value="${escapeHTML(TAH_LINKS.app_link||'')}"></div>
        <div class="field"><label>Smart Class link</label><input id="tahSmartLink" placeholder="https://..." value="${escapeHTML(TAH_LINKS.smartclass_link||'')}"></div>
      </div>
      <div class="cert-form-grid cert-form-grid-3">
        <div class="field"><label>Guide / video link</label><input id="tahTemplateVideo" placeholder="https://..." value="${escapeHTML(template.video_url||'')}"></div>
        <div class="field"><label>Image link</label><input id="tahTemplateImage" placeholder="https://..." value="${escapeHTML(template.image_url||'')}"></div>
        <div class="field"><label>Feedback / rating link</label><input id="tahFeedbackLink" placeholder="https://..." value="${escapeHTML(TAH_LINKS.feedback_form_link||'')}"></div>
      </div>
      <div class="field" style="margin-top:10px">
        <label>WhatsApp message body</label>
        <textarea id="tahTemplateBody" style="min-height:150px">${escapeHTML(template.body||'')}</textarea>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:10px">
        <button onclick="toggleTahTemplateEdit()">Cancel</button>
        <button class="primary" onclick="saveTahTemplateEdit('${template.id}')">Save message</button>
      </div>
    </div>`;
}

function tahTeachersTable(){
  const filtered = TAH.teachers.filter(tahTeacherMatches);
  const filters = ['All','Not started','Preparing','Teaching','Activated','Odisha Board','CBSE'].map(f=>`<button class="${TAH.filter===f?'primary':''}" onclick="setTahFilter('${f}')">${f}</button>`).join('');
  const rows = filtered.length ? filtered.map(t=>TAH.editId===t.id ? tahEditRow(t) : `
    <div class="tah-row">
      <div><b>${escapeHTML(t.name)}</b><div class="tiny faint">${escapeHTML(t.school_name||'School not set')} · ${escapeHTML(t.mobile)}</div></div>
      <div>${escapeHTML(t.class_level||'—')} · ${escapeHTML(t.subject||'—')}</div>
      <div><span class="pill">${escapeHTML(t.board||'CBSE')}</span></div>
      <div><span class="pill ${tahStatusClass(t)}">${tahStatusLabel(t)}</span><div class="tiny faint">Next: ${tahNextDay(t)}</div></div>
      <div class="tah-actions">
        <button onclick="editTahTeacher('${t.id}')">Edit</button>
        <button onclick="sendTahTeacher('${t.id}','${tahNextDay(t)}')">Send next</button>
        <button onclick="markTahPrepared('${t.id}')">Prepared</button>
        <button onclick="markTahReply('${t.id}','YES')">YES</button>
        <button onclick="markTahReply('${t.id}','NOT YET')">NOT YET</button>
        <button style="color:var(--red)" onclick="deleteTahTeacher('${t.id}')">Delete</button>
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

function tahEditRow(t){
  const boardOptions = ['CBSE','Odisha Board'].map(b=>`<option ${t.board===b?'selected':''}>${b}</option>`).join('');
  return `
    <div class="tah-edit-row">
      <div class="cert-form-grid">
        <div class="field"><label>Teacher name</label><input id="tahEditName" value="${escapeHTML(t.name)}"></div>
        <div class="field"><label>Mobile number</label><input id="tahEditMobile" value="${escapeHTML(t.mobile)}"></div>
        <div class="field"><label>Board</label><select id="tahEditBoard">${boardOptions}</select></div>
      </div>
      <div class="cert-form-grid cert-form-grid-3">
        <div class="field"><label>School name</label><input id="tahEditSchool" value="${escapeHTML(t.school_name||'')}"></div>
        <div class="field"><label>Class</label><input id="tahEditClass" value="${escapeHTML(t.class_level||'')}"></div>
        <div class="field"><label>Subject</label><input id="tahEditSubject" value="${escapeHTML(t.subject||'')}"></div>
      </div>
      <div class="cert-form-grid cert-form-grid-4">
        <div class="field"><label>Enrollment date</label><input id="tahEditDate" type="date" value="${String(t.enrollment_date||'').slice(0,10)}"></div>
        <div class="field"><label>Journey day</label><input id="tahEditJourney" type="number" min="0" max="8" value="${escapeHTML(t.journey_day||0)}"></div>
        <label class="tah-check"><input id="tahEditPrepared" type="checkbox" ${t.prepared?'checked':''}> Prepared</label>
        <label class="tah-check"><input id="tahEditTaught" type="checkbox" ${t.taught?'checked':''}> Taught</label>
        <label class="tah-check"><input id="tahEditLoop" type="checkbox" ${t.loop_completed?'checked':''}> Loop complete</label>
        <label class="tah-check"><input id="tahEditOptOut" type="checkbox" ${t.opted_out?'checked':''}> Opted out</label>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:10px">
        <button onclick="cancelTahEdit()">Cancel</button>
        <button class="primary" onclick="saveTahTeacherEdit('${t.id}')">Save changes</button>
      </div>
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
    image_link:template.image_url || '',
    feedback_form_link:TAH_LINKS.feedback_form_link,
    rating_link:TAH_LINKS.rating_link,
    quote:''
  };
  const rendered = Object.entries(tokens).reduce((body,[key,value])=>body.replaceAll(`{${key}}`,value), template.body);
  const imageLine = template.image_url && !rendered.includes(template.image_url) ? `\nImage: ${template.image_url}` : '';
  return rendered + imageLine + '\n\nReply STOP to pause messages.';
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

window.setTahDay = day=>{ TAH.selectedDay=day; TAH.editTemplate=false; renderTeacherActivation(); };
window.setTahFilter = filter=>{ TAH.filter=filter; renderTeacherActivation(); };
window.toggleTahAddTeacher = ()=>{ TAH.showAdd = !TAH.showAdd; renderTeacherActivation(); };
window.editTahTeacher = id=>{ TAH.editId=id; TAH.showAdd=false; renderTeacherActivation(); };
window.cancelTahEdit = ()=>{ TAH.editId=null; renderTeacherActivation(); };
window.toggleTahTemplateEdit = ()=>{ TAH.editTemplate = !TAH.editTemplate; renderTeacherActivation(); };

window.saveTahTemplateEdit = async id=>{
  const template = TAH.templates.find(t=>t.id===id);
  if(!template) return;
  try{
    const body = document.getElementById('tahTemplateBody').value.trim();
    if(!body){ alert('Message body cannot be empty.'); return; }
    const appLink = normalizeText(val('tahAppLink'));
    const smartLink = normalizeText(val('tahSmartLink'));
    const feedbackLink = normalizeText(val('tahFeedbackLink'));
    Object.assign(TAH_LINKS,{
      app_link:appLink || 'Teachers App link',
      smartclass_link:smartLink || 'Smart Class App link',
      feedback_form_link:feedbackLink || 'Feedback form',
      rating_link:feedbackLink || 'Rating link'
    });
    localStorage.setItem(TAH_LINK_STORE, JSON.stringify({
      app_link:TAH_LINKS.app_link,
      smartclass_link:TAH_LINKS.smartclass_link,
      feedback_form_link:TAH_LINKS.feedback_form_link,
      rating_link:TAH_LINKS.rating_link
    }));
    await DB.updateTahTemplate(id,{
      title:normalizeText(val('tahTemplateTitle')),
      body,
      video_url:normalizeText(val('tahTemplateVideo')),
      image_url:normalizeText(val('tahTemplateImage'))
    });
    TAH.editTemplate = false;
    await tahRefresh();
  }catch(e){
    alert(e.message || 'Could not save this message template.');
  }
};

window.addTahTeacherManual = async ()=>{
  const name = normalizeText(val('tahAddName'));
  const mobile = cleanPhone(val('tahAddMobile'));
  const board = normalizeText(val('tahAddBoard')) || 'CBSE';
  if(!name){ alert('Enter teacher name.'); return; }
  if(!normalizeIndianPhone(mobile)){ alert('Enter a valid Indian 10-digit mobile number.'); return; }
  if(TAH.teachers.some(t=>cleanPhone(t.mobile)===mobile)){ alert('This mobile number already exists.'); return; }
  await DB.saveTahTeachers([{
    name,
    mobile,
    board:['Odisha Board','CBSE'].includes(board) ? board : 'CBSE',
    language:tahLanguageForBoard(board),
    school_name:normalizeText(val('tahAddSchool')),
    class_level:normalizeText(val('tahAddClass')),
    subject:normalizeText(val('tahAddSubject')),
    enrollment_date:new Date().toISOString().slice(0,10)
  }]);
  TAH.showAdd = false;
  await tahRefresh();
};

window.saveTahTeacherEdit = async id=>{
  const teacher = TAH.teachers.find(t=>t.id===id);
  if(!teacher) return;
  const name = normalizeText(val('tahEditName'));
  const mobile = cleanPhone(val('tahEditMobile'));
  const board = normalizeText(val('tahEditBoard')) || 'CBSE';
  if(!name){ alert('Enter teacher name.'); return; }
  if(!normalizeIndianPhone(mobile)){ alert('Enter a valid Indian 10-digit mobile number.'); return; }
  const duplicate = TAH.teachers.find(t=>t.id!==id && cleanPhone(t.mobile)===mobile);
  if(duplicate){ alert('This mobile number is already used by another teacher.'); return; }
  await DB.updateTahTeacher(id,{
    name,
    mobile,
    board:['Odisha Board','CBSE'].includes(board) ? board : 'CBSE',
    language:tahLanguageForBoard(board),
    school_name:normalizeText(val('tahEditSchool')),
    class_level:normalizeText(val('tahEditClass')),
    subject:normalizeText(val('tahEditSubject')),
    enrollment_date:val('tahEditDate') || null,
    journey_day:Math.max(0,Math.min(8,Number(val('tahEditJourney'))||0)),
    prepared:document.getElementById('tahEditPrepared').checked,
    taught:document.getElementById('tahEditTaught').checked,
    loop_completed:document.getElementById('tahEditLoop').checked,
    opted_out:document.getElementById('tahEditOptOut').checked
  });
  TAH.editId = null;
  await tahRefresh();
};

window.downloadTahCSVTemplate = ()=>{
  const rows = [
    ['Teacher Name','Mobile Number','School Name','Class','Subject','Board','Enrollment Date'],
    ['Priya Sharma','9876543210','DAV Public School','8','Science','CBSE','2026-06-23'],
    ['Rakesh Kumar','9123456789','OAV Bhubaneswar','7','Mathematics','Odisha Board','2026-06-23']
  ];
  downloadBlob('aveti-teacher-activation-template.csv','text/csv;charset=utf-8',rows.map(csvLine).join('\n'));
};

const tahCsvValue = (row, keys) => keys.map(k=>row[k]).find(v=>normalizeText(v));
function tahCsvDate(value){
  const text = normalizeText(value);
  if(!text) return new Date().toISOString().slice(0,10);
  const slash = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if(slash){
    const year = slash[3].length===2 ? `20${slash[3]}` : slash[3];
    return `${year}-${slash[2].padStart(2,'0')}-${slash[1].padStart(2,'0')}`;
  }
  return text;
}

window.importTahCSV = async file=>{
  if(!file) return;
  try{
    const rows = await readCSVFile(file);
    const warnings = [];
    const seen = new Set(TAH.teachers.map(t=>cleanPhone(t.mobile)));
    const teachers = rows.map((r,i)=>{
      const rowNo = i+2;
      const name = normalizeText(tahCsvValue(r,['teacher_name','teacher','name','eacher_name']));
      const mobile = cleanPhone(tahCsvValue(r,['mobile_number','mobile','phone','whatsapp','contact_number','contact']));
      const board = normalizeText(tahCsvValue(r,['board']) || 'CBSE');
      if(!name || !mobile){ warnings.push(`Row ${rowNo}: missing teacher name or mobile.`); return null; }
      if(seen.has(mobile)){ warnings.push(`Row ${rowNo}: duplicate mobile (${mobile}).`); return null; }
      if(!['Odisha Board','CBSE'].includes(board)) warnings.push(`Row ${rowNo}: unknown board, using CBSE/English.`);
      seen.add(mobile);
      return {
        name,
        mobile,
        school_name:normalizeText(tahCsvValue(r,['school_name','school'])),
        class_level:normalizeText(tahCsvValue(r,['class','class_level','grade'])),
        subject:normalizeText(tahCsvValue(r,['subject','subjects'])),
        board:['Odisha Board','CBSE'].includes(board) ? board : 'CBSE',
        language:tahLanguageForBoard(board),
        enrollment_date:tahCsvDate(tahCsvValue(r,['enrollment_date','enrolment_date','date']))
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

window.deleteTahTeacher = async id=>{
  const teacher = TAH.teachers.find(t=>t.id===id);
  if(!teacher) return;
  if(!confirm(`Delete ${teacher.name} from Teacher Activation Hub? Message logs for this teacher will also be removed.`)) return;
  await DB.deleteTahTeacher(id);
  await tahRefresh();
};

window.teacherActivation = teacherActivation;
