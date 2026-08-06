/* ---------- ENTER MARKS ---------- */
let EM = { full:25, rows:[], editId:null, draftDirty:false, teachers:[] };
let RESTORE_MARK_DRAFT = false;
function teacherMatchesMarkEntry(teacher, cls, subject){
  const classes=(teacher.class_levels||[]).map(Number).filter(Number.isInteger);
  const subjects=(teacher.subjects||[]).filter(Boolean);
  const legacyClasses=classes.length ? classes : String(teacher.class_level||'').split(/[,\s]+/).map(Number).filter(Number.isInteger);
  const legacySubjects=subjects.length ? subjects : String(teacher.subject||'').split(',').map(s=>s.trim()).filter(Boolean);
  return (!legacyClasses.length || legacyClasses.includes(Number(cls))) && (!legacySubjects.length || legacySubjects.includes(subject));
}
function markTeacherOptions(teachers, selected='', cls, subject){
  const matching=(teachers||[]).filter(t=>!t.opted_out && (String(t.id)===String(selected) || teacherMatchesMarkEntry(t,cls,subject)));
  return ['<option value="">No teacher assigned</option>'].concat(matching.map(t=>`<option value="${escapeHTML(t.id)}" ${String(t.id)===String(selected)?'selected':''}>${escapeHTML(t.name)}</option>`)).join('');
}
async function enterMarks(testId){
  setCrumb('Enter test marks');
  const editTest = testId ? (await DB.listTests()).find(t=>t.id===testId) : null;
  const draft = !editTest ? readJSON(LS_MARK_DRAFT,null) : null;
  const useDraft = !!draft && RESTORE_MARK_DRAFT;
  RESTORE_MARK_DRAFT = false;
  const lastEntry = readJSON(LS_LAST_ENTRY,null);
  const recentTest = !editTest && !lastEntry && !useDraft ? (await DB.listTests())[0] : null;
  const defaultEntry = lastEntry || (recentTest ? {academic_session:currentSession(),class_level:recentTest.class_level,section:recentTest.section||'All',subject:recentTest.subject} : {academic_session:currentSession(),class_level:9,section:'All',subject:'Mathematics'});
  let markTeachers=[];
  try { markTeachers = await DB.listTahTeachers(); } catch(e) { markTeachers=[]; }
  EM = { full:editTest?Number(editTest.full_marks):25, rows:[], editId:editTest?editTest.id:null, editTest, removedResultStudentIds:[], draftDirty:!!useDraft, teachers:markTeachers };
  if(useDraft) EM = {...EM, full:Number(draft.full)||25, rows:draft.rows||[], editId:draft.editId||null, removedResultStudentIds:draft.removed_result_student_ids||[], draftDirty:true};
  EM.saveLabel = `✓ ${editTest||EM.editId?'Save changes':'Save & generate reports'}`;
  const selectedSession = useDraft ? (draft.academic_session||currentSession()) : (defaultEntry.academic_session||currentSession());
  const selectedClass = editTest ? editTest.class_level : (useDraft ? draft.class_level : defaultEntry.class_level);
  const selectedSection = editTest ? (editTest.section||'All') : (useDraft ? draft.section : (defaultEntry.section||'All'));
  const rawSelectedSubject = editTest ? editTest.subject : (useDraft ? draft.subject : (defaultEntry.subject||'Hindi'));
  const selectedSubject = subjectsForClass(selectedClass).includes(rawSelectedSubject) ? rawSelectedSubject : subjectsForClass(selectedClass)[0];
  const selectedChapterIds = editTest ? (editTest.chapter_ids||[editTest.chapter_id].filter(Boolean)) : (useDraft ? (draft.chapter_ids||[draft.chapter_id].filter(Boolean)) : []);
  const selectedTestType = testTypeLabel(editTest ? editTest.test_type : (useDraft ? draft.test_type : 'Chapter End Test'));
  const selectedDate = editTest ? String(editTest.test_date).slice(0,10) : (useDraft ? draft.test_date : new Date().toISOString().slice(0,10));
  const selectedTime = editTest?.duration_minutes || (useDraft ? draft.duration_minutes : 60) || 60;
  const selectedTeacher = editTest?.teacher_id || (useDraft ? draft.teacher_id : '') || '';
  const draftNotice = draft && !useDraft ? `
    <div class="banner row between" style="margin-bottom:12px;padding:10px 12px;gap:10px;flex-wrap:wrap">
      <span class="small">An unsaved marks draft is available.</span>
      <span class="row" style="gap:7px"><button type="button" class="ghost" onclick="discardMarksDraft()">Discard</button><button type="button" onclick="restoreMarksDraft()">Restore draft</button></span>
    </div>` : '';
  show(`
    ${schoolResultTabs('aveti')}
    ${demoNote}
    ${draftNotice}
    <div class="card pad">
      <h2 style="font-size:18px;margin-bottom:14px">${editTest?'Edit test marks':'Enter test marks'}</h2>
      <div class="wrap-fields" style="margin-bottom:10px">
        <div class="field"><label>Session</label><select id="emSession" onchange="loadEMRoster()">${sessionOptions(selectedSession)}</select></div>
        <div class="field"><label>Class</label><select id="emClass" onchange="onEMClassChange()">${classOptions(selectedClass)}</select></div>
        <div class="field"><label>Section</label><select id="emSec" onchange="loadEMRoster()">${sectionOptions(selectedSection,true)}</select></div>
        <div class="field"><label>Subject</label><select id="emSub" onchange="onEMSubjectChange()">${subjectOptionsForClass(selectedClass,selectedSubject)}</select></div>
        <div class="field"><label>Teacher <span class="muted">(optional)</span></label><select id="emTeacher">${markTeacherOptions(markTeachers,selectedTeacher,selectedClass,selectedSubject)}</select></div>
        <div class="field" style="flex:2"><label>Chapter(s)</label><div id="emChapterPicker" class="chapter-picker"><button type="button" class="chapter-picker-button" onclick="toggleChapterPicker()"><span id="emChapterSummary">Select chapter</span><span>⌄</span></button><div id="emChapterMenu" class="chapter-picker-menu"></div><select id="emChap" multiple style="display:none"></select></div></div>
      </div>
      <div id="newChapterBox" class="wrap-fields" style="display:none;margin:-2px 0 12px;background:#f8faf7;border-radius:11px;padding:12px">
        <div class="field"><label>Chapter no.</label><input id="newChapNo" type="number" min="1" step="1" placeholder="1"></div>
        <div class="field" style="flex:2"><label>Chapter title</label><input id="newChapTitle" placeholder="e.g. मनुष्यता"></div>
        <button onclick="addEMChapter()">Add chapter</button>
      </div>
      <div class="wrap-fields" style="align-items:flex-end;margin-bottom:18px">
        <div class="field"><label>Test type</label><select id="emType"><option value="Chapter End Test" ${selectedTestType==='Chapter End Test'?'selected':''}>Chapter End Test</option><option value="Periodic Test-1" ${selectedTestType==='Periodic Test-1'?'selected':''}>Periodic Test-1</option></select></div>
        <div class="field"><label>Full marks</label><select id="emFull" onchange="setFull(Number(this.value))">${FULL_MARK_OPTIONS.map(mark=>`<option value="${mark}" ${Number(EM.full)===mark?'selected':''}>${mark}</option>`).join('')}</select></div>
        <div class="field"><label>Time</label><select id="emTime" onchange="saveDraft()">${[30,40,60,90,120].map(minutes=>`<option value="${minutes}" ${Number(selectedTime)===minutes?'selected':''}>${minutes} min</option>`).join('')}</select></div>
        <div class="field"><label>Date</label><input type="date" id="emDate" value="${selectedDate}" onchange="saveDraft()"></div>
      </div>
      <div class="csv-tools" style="margin-bottom:12px">
        <span class="small muted" style="flex:1">Fill marks by CSV after selecting class, section and subject</span>
        <button onclick="downloadMarksCSVTemplate()">Download sample CSV</button>
        <button onclick="document.getElementById('marksCsvInput').click()">Upload filled CSV</button>
        <input id="marksCsvInput" type="file" accept=".csv,text/csv" style="display:none" onchange="importMarksCSV(this.files[0]);this.value=''">
      </div>
      <div id="geminiMarkBox" class="csv-tools voice-tools" style="margin-bottom:12px">
        <span class="small muted" style="flex:1"><b>Gemini voice mark</b> · Record one phrase: “Aditya 20”, “Devanshi absent”, or “Rudra N.A.”</span>
        <button onclick="setGeminiKey()">API key</button>
        <button onclick="window.open('https://aistudio.google.com/app/apikey','_blank')">Get free key</button>
        <button id="geminiRecordBtn" onclick="toggleGeminiRecording()">Record</button>
        <span id="geminiState" class="small muted"></span>
      </div>
      <div class="row between" style="margin-bottom:8px;justify-content:flex-end"><span class="small muted">Marks out of <b id="fmLabel">${EM.full}</b></span></div>
      <div id="emRoster"></div>
      <div class="row between" style="background:#f8faf7;border-radius:11px;padding:12px 14px;margin-top:14px;flex-wrap:wrap;gap:12px">
        <div class="row" style="gap:22px">
          <div><div class="tiny muted">Entered</div><div class="num" style="font-size:18px"><span id="cEntered">0</span> / <span id="cTotal">0</span></div></div>
          <div><div class="tiny muted">Class avg</div><div class="num" style="font-size:18px" id="cAvg">—</div></div>
          <div><div class="tiny muted">Absent</div><div class="num" style="font-size:18px" id="cAbs">0</div></div>
          <div><div class="tiny muted">N.A.</div><div class="num" style="font-size:18px" id="cNA">0</div></div>
        </div>
        <div style="margin-left:auto;text-align:right">
          ${editTest?'':'<button class="ghost" type="button" onclick="discardMarksDraft()">Discard draft</button>'}
          <button id="saveBtn" class="primary" onclick="saveTest()">${EM.saveLabel}</button>
          <div id="saveState" class="tiny faint" style="margin-top:4px"></div>
        </div>
      </div>
    </div>
  `);
  EM.selectedChapterIds = selectedChapterIds;
  if(editTest) await loadEMExisting(editTest);
  else if(useDraft) await loadEMDraft(draft);
  else await loadEMRoster(false);
  loadEMChapters(false);
}
window.refreshEMTeachers = ()=>{
  const select=document.getElementById('emTeacher');
  if(!select) return;
  const selected=select.value;
  select.innerHTML=markTeacherOptions(EM.teachers||[],selected,Number(val('emClass')),val('emSub'));
};
window.onEMSubjectChange = ()=>{ loadEMChapters(); refreshEMTeachers(); };
window.onEMClassChange = ()=>{
  const cls=Number(val('emClass')), sub=document.getElementById('emSub');
  const allowed=subjectsForClass(cls);
  if(sub && !allowed.includes(sub.value)) sub.value=allowed.includes('EVS')?'EVS':allowed.includes('Mathematics')?'Mathematics':allowed[0];
  if(sub && cls>=1 && cls<=12) sub.innerHTML=subjectOptionsForClass(cls,sub.value);
  loadEMRoster(); loadEMChapters(); refreshEMTeachers();
};
function snapshotDraft(){
  const clsEl=document.getElementById('emClass');
  if(!clsEl) return null;
  return {
    editId:EM.editId,
    full:EM.full,
    class_level:parseInt(val('emClass')),
    academic_session:val('emSession'),
    section:val('emSec'),
    subject:val('emSub'),
    teacher_id:val('emTeacher')||null,
    chapter_ids:Array.from(document.getElementById('emChap')?.selectedOptions||[]).map(o=>o.value).filter(Boolean),
    test_type:val('emType')||'Chapter End Test',
    duration_minutes:Number(val('emTime'))||60,
    test_date:document.getElementById('emDate')?.value,
    rows:EM.rows,
    removed_result_student_ids:EM.removedResultStudentIds||[]
  };
}
function saveDraft(changed=true){
  if(changed) EM.draftDirty = true;
  // Saved tests are already protected by the database; only keep unsaved new
  // entries in browser storage, and never create one merely by opening the page.
  if(EM.editId || !EM.draftDirty) return;
  const draft=snapshotDraft();
  if(draft) writeJSON(LS_MARK_DRAFT,draft);
}
window.loadEMRoster = async (changed=true)=>{
  const cls = parseInt(val('emClass')), sec = val('emSec'), session = val('emSession');
  const all = await DB.listStudents();
  EM.classStudents = all.filter(s=> String(s.class_level)===String(cls) && (s.academic_session||currentSession())===session);
  if(!EM.classStudents.length) EM.classStudents = all.filter(s=>String(s.class_level)===String(cls));
  const match = EM.classStudents.filter(s=> sec==='All' || (s.section||'')===sec);
  EM.rows = match.map(s=>({student_id:s.id,name:s.name,section:s.section||'',gender:s.gender,marks:null,present:true,na:false}));
  recountEM(); renderEMRoster(); saveDraft(changed);
};
window.loadEMChapters = async (changed=true)=>{
  const sel = document.getElementById('emChap');
  if(!sel) return;
  const cls = parseInt(val('emClass'));
  const subject = val('emSub');
  EM.chapters = await DB.listChapters(cls,subject);
  const previous = EM.pendingChapterId ? [EM.pendingChapterId] : (EM.selectedChapterIds || (EM.editTest && String(EM.editTest.class_level)===String(cls) && EM.editTest.subject===subject ? (EM.editTest.chapter_ids||[EM.editTest.chapter_id].filter(Boolean)) : []));
  const options = ['<option value="">Select chapter</option>']
    .concat(EM.chapters.map(c=>`<option value="${c.id}" ${previous.map(String).includes(String(c.id))?'selected':''}>${chapterOptionLabel(c)}</option>`))
    .concat('<option value="__new__">+ Add new chapter</option>');
  sel.innerHTML = options.join('');
  EM.selectedChapterIds = Array.from(sel.selectedOptions).map(o=>o.value);
  renderChapterPicker();
  EM.pendingChapterId = '';
  toggleNewChapter();
  saveDraft(changed);
};
window.toggleChapterPicker = ()=>document.getElementById('emChapterPicker')?.classList.toggle('open');
document.addEventListener('click',event=>{
  const picker=document.getElementById('emChapterPicker');
  if(picker?.classList.contains('open') && !picker.contains(event.target)) picker.classList.remove('open');
});
window.updateChapterPicker = (id,checked)=>{
  const sel=document.getElementById('emChap');
  const option=Array.from(sel?.options||[]).find(o=>o.value===id);
  if(!option) return;
  option.selected=checked;
  EM.selectedChapterIds=Array.from(sel.selectedOptions).filter(o=>o.value).map(o=>o.value);
  renderChapterPicker(); saveDraft();
};
function renderChapterPicker(){
  const sel=document.getElementById('emChap'), menu=document.getElementById('emChapterMenu'), summary=document.getElementById('emChapterSummary');
  if(!sel||!menu) return;
  const selected=Array.from(sel.selectedOptions).filter(o=>o.value);
  summary.textContent=selected.length ? selected.map(o=>o.textContent).join(', ') : 'Select chapter';
  const chapters=Array.from(sel.options).filter(o=>o.value && o.value!=='__new__');
  menu.innerHTML=chapters.map(o=>`<label class="chapter-check"><input type="checkbox" ${o.selected?'checked':''} onchange="updateChapterPicker('${o.value}',this.checked)"><span>${o.textContent}</span></label>`).join('') + '<button type="button" class="chapter-add" onclick="selectNewChapter()">+ Add new chapter</button>';
}
window.selectNewChapter = ()=>{
  const sel=document.getElementById('emChap');
  if(!sel) return;
  Array.from(sel.options).forEach(o=>o.selected=o.value==='__new__');
  EM.selectedChapterIds=[];
  document.getElementById('emChapterPicker')?.classList.remove('open');
  toggleNewChapter();
};
window.restoreMarksDraft = async ()=>{
  if(!readJSON(LS_MARK_DRAFT,null)) return;
  RESTORE_MARK_DRAFT = true;
  await enterMarks();
};
window.discardMarksDraft = async ()=>{
  clearJSON(LS_MARK_DRAFT);
  await enterMarks();
};
window.toggleNewChapter = ()=>{
  const selected = val('emChap');
  EM.selectedChapterIds = Array.from(document.getElementById('emChap')?.selectedOptions||[]).map(o=>o.value);
  const box = document.getElementById('newChapterBox');
  if(box) box.style.display = selected==='__new__' ? 'flex' : 'none';
  renderChapterPicker();
};
window.addEMChapter = async ()=>{
  const cls = parseInt(val('emClass'));
  const subject = val('emSub');
  const title = normalizeText(val('newChapTitle'));
  const no = parseInt(val('newChapNo'));
  if(!no || no<1){ alert('Enter a valid chapter number.'); return; }
  if(!title){ alert('Enter a chapter title.'); return; }
  const existing = (EM.chapters||[]).find(c=>Number(c.chapter_no)===Number(no) || normalizeText(c.title).toLowerCase()===title.toLowerCase());
  const chapter = existing || await DB.addChapter({class_level:cls,subject,chapter_no:no,title});
  if(!chapter?.id){ alert('Chapter was not saved. Please try again.'); return; }
  EM.pendingChapterId = chapter.id;
  EM.selectedChapterId = chapter.id;
  await loadEMChapters();
  const noEl = document.getElementById('newChapNo');
  const titleEl = document.getElementById('newChapTitle');
  if(noEl) noEl.value = '';
  if(titleEl) titleEl.value = '';
};
async function loadEMExisting(test){
  const cls = parseInt(val('emClass')), sec = val('emSec'), session = val('emSession');
  const all = await DB.listStudents();
  const rs = await cachedResults(test.id);
  const byStudent = new Map(rs.map(r=>[r.student_id,r]));
  EM.classStudents = all.filter(s=> String(s.class_level)===String(cls) && (s.academic_session||currentSession())===session);
  if(!EM.classStudents.length) EM.classStudents = all.filter(s=>String(s.class_level)===String(cls));
  const match = EM.classStudents.filter(s=> sec==='All' || (s.section||'')===sec);
  const extra = rs
    .map(r=>all.find(s=>s.id===r.student_id))
    .filter(s=>s && !match.some(m=>m.id===s.id));
  EM.rows = [...match, ...extra].map(s=>{
    const r = byStudent.get(s.id);
    return {student_id:s.id,name:s.name,section:s.section||'',gender:s.gender,marks:r?(r.marks??null):null,present:r?(!!r.present):true,na:r?(!!r.na):false};
  });
  recountEM(); renderEMRoster(); saveDraft();
}
async function loadEMDraft(draft){
  const all = await DB.listStudents();
  EM.classStudents = all.filter(s=> String(s.class_level)===String(parseInt(val('emClass'))) && (s.academic_session||currentSession())===val('emSession'));
  if(!EM.classStudents.length) EM.classStudents = all.filter(s=>String(s.class_level)===String(parseInt(val('emClass'))));
  EM.rows = (draft.rows||[]).map(r=>{
    const s = all.find(x=>x.id===r.student_id) || {};
    return {...r,name:r.name||s.name||'Student',section:r.section||s.section||'',gender:r.gender||s.gender};
  });
  recountEM(); renderEMRoster();
}
window.downloadMarksCSVTemplate = ()=>{
  const sourceRows = EM.rows.length ? EM.rows : (EM.classStudents||[]).map(s=>({student_id:s.id,name:s.name,section:s.section||'',marks:null,present:true,na:false}));
  const selectedSection = val('emSec') || 'All';
  const selectedSubject = val('emSub') || '';
  const rows = [
    ['student_name','section','subject','marks','status'],
    ...(sourceRows.length ? sourceRows.map(r=>[r.name,r.section||selectedSection,selectedSubject,resultValue(r),r.na?'N.A.':r.present===false?'Absent':'Present']) : [
      ['Aditya',selectedSection,selectedSubject,'20','Present'],
      ['Devanshi',selectedSection,selectedSubject,'','Absent'],
      ['Rudra',selectedSection,selectedSubject,'N.A.','N.A.']
    ])
  ];
  const subject = val('emSub') || 'marks';
  const cls = val('emClass') || 'class';
  downloadBlob(`aveti-marks-class-${cls}-${fileSafe(subject)}.csv`,'text/csv;charset=utf-8',rows.map(csvLine).join('\n'));
};
window.importMarksCSV = async file=>{
  if(!file) return;
  try{
    const rows = await readCSVFile(file);
    const all = await DB.listStudents();
    const classStudents = EM.classStudents?.length ? EM.classStudents : all.filter(s=>String(s.class_level)===String(parseInt(val('emClass'))) && (s.academic_session||currentSession())===val('emSession'));
    let changed = 0;
    const warnings = [];
    rows.forEach((r,i)=>{
      const rowNo = i+2;
      const name = r.student_name || r.name;
      const rowSection = r.section ? normalizeText(r.section) : '';
      const rowSubject = r.subject ? normalizeText(r.subject) : '';
      if(rowSubject && rowSubject.toLowerCase() !== normalizeText(val('emSub')).toLowerCase()){
        warnings.push(`Row ${rowNo}: subject is ${rowSubject}, but selected subject is ${val('emSub')}.`);
        return;
      }
      if(rowSection && rowSection!=='All' && val('emSec')!=='All' && rowSection.toUpperCase()!==val('emSec')){
        warnings.push(`Row ${rowNo}: section is ${rowSection}, but selected section is ${val('emSec')}.`);
        return;
      }
      const matches = classStudents.filter(s=>normalizeText(s.name).toLowerCase()===normalizeText(name).toLowerCase());
      const student = rowSection && rowSection!=='All'
        ? matches.find(s=>(s.section||'').toUpperCase()===rowSection.toUpperCase())
        : matches[0];
      if(matches.length>1 && !rowSection){
        warnings.push(`Row ${rowNo}: multiple students named ${name}; add section in CSV.`);
        return;
      }
      if(!student){ warnings.push(`Row ${rowNo}: student not found (${name||'blank'}).`); return; }
      let row = EM.rows.find(x=>x.student_id===student.id);
      if(!row){
        row = {student_id:student.id,name:student.name,section:student.section||'',gender:student.gender,marks:null,present:true,na:false};
        EM.rows.push(row);
      }
      const status = normalizeText(r.status || r.attendance || '').toLowerCase();
      const markText = normalizeText(r.marks || r.mark || r.score);
      if(['na','n/a','n.a.','n.a'].includes(status) || ['na','n/a','n.a.','n.a'].includes(markText.toLowerCase())){
        row.na = true; row.present = true; row.marks = null; changed++; return;
      }
      if(['absent','abs','a'].includes(status) || ['absent','abs','a'].includes(markText.toLowerCase())){
        row.na = false; row.present = false; row.marks = null; changed++; return;
      }
      const marks = markText==='' ? null : parseFloat(markText);
      if(markText!=='' && (Number.isNaN(marks) || marks<0 || marks>EM.full)){
        warnings.push(`Row ${rowNo}: invalid marks for ${student.name}.`);
        return;
      }
      row.na = false;
      row.present = true;
      row.marks = marks;
      changed++;
    });
    renderEMRoster(); saveDraft();
    alert(`Updated ${changed} mark row${changed===1?'':'s'}.${warnings.length?'\n\n'+warnings.slice(0,8).join('\n'):''}${warnings.length>8?`\n+ ${warnings.length-8} more warning(s).`:''}`);
  }catch(e){
    alert(e.message || 'Could not read this CSV file.');
  }
};
let GEMINI_RECORDER = null, GEMINI_CHUNKS = [], GEMINI_TIMER = null;
const LS_GEMINI_KEY = 'aveti:gemini-api-key';
function setGeminiState(msg,listening=false){
  const state = document.getElementById('geminiState');
  const box = document.getElementById('geminiMarkBox');
  const btn = document.getElementById('geminiRecordBtn');
  if(state) state.textContent = msg || '';
  if(box) box.classList.toggle('listening',!!listening);
  if(btn) btn.textContent = listening ? 'Stop' : 'Record';
}
const voiceClean = s => normalizeText(String(s||'').toLowerCase().replace(/[^\p{L}\p{N}. ]/gu,' '));
const numberWords = {
  zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9,
  ten:10, eleven:11, twelve:12, thirteen:13, fourteen:14, fifteen:15, sixteen:16,
  seventeen:17, eighteen:18, nineteen:19, twenty:20, thirty:30, forty:40, fifty:50
};
function parseSpokenNumber(text){
  const nums = [...text.matchAll(/\d+(?:\.\d+)?/g)].map(m=>parseFloat(m[0])).filter(n=>!Number.isNaN(n));
  const valid = nums.find(n=>n>=0 && n<=EM.full);
  if(valid!=null) return valid;
  const tokens = voiceClean(text).split(' ');
  for(let i=0;i<tokens.length;i++){
    let total = null;
    if(numberWords[tokens[i]]!=null) total = numberWords[tokens[i]];
    if(total>=20 && numberWords[tokens[i+1]]>0 && numberWords[tokens[i+1]]<10) total += numberWords[tokens[i+1]];
    if(total!=null && tokens[i+1] === 'point' && numberWords[tokens[i+2]]!=null) total += numberWords[tokens[i+2]]/10;
    if(total!=null && total>=0 && total<=EM.full) return total;
  }
  return null;
}
function speechStatus(text){
  const t = voiceClean(text);
  if(/\b(absent|absence|abs|a)\b/.test(t)) return 'absent';
  if(/\b(n\s*a|na|n\.a|not applicable)\b/.test(t)) return 'na';
  return '';
}
function nameScore(candidate, spoken){
  const name = voiceClean(candidate);
  const text = voiceClean(spoken);
  if(!name || !text) return 0;
  if(text.includes(name)) return 100 + name.length;
  const parts = name.split(' ').filter(Boolean);
  let score = 0;
  parts.forEach(p=>{ if(text.includes(p)) score += 30 + p.length; });
  const first = parts[0] || name;
  if(first && text.startsWith(first.slice(0,Math.min(4,first.length)))) score += 12;
  return score;
}
function applyVoiceMark({student_name='',marks=null,status='',raw=''}) {
  const phrase = [student_name, status, marks].filter(v=>v!==null && v!=='').join(' ') || raw;
  if(!EM.rows.length){ setGeminiState('No roster loaded.'); return; }
  const normStatus = normalizeText(status).toLowerCase();
  const parsedStatus = ['absent','na','n/a','n.a.','not applicable'].includes(normStatus) ? normStatus : speechStatus(raw || phrase);
  const mark = parsedStatus ? null : (marks!=null ? Number(marks) : parseSpokenNumber(raw || phrase));
  if(!parsedStatus && (mark==null || Number.isNaN(mark))){ setGeminiState(`Heard: "${raw||phrase}" · No mark found.`); return; }
  const scored = EM.rows.map((r,i)=>({i,r,score:nameScore(r.name,student_name || raw || phrase)})).sort((a,b)=>b.score-a.score);
  const best = scored[0];
  if(!best || best.score<20){
    setGeminiState(`Heard: "${raw||phrase}" · Student not found.`);
    return;
  }
  const ties = scored.filter(x=>x.score===best.score);
  if(ties.length>1 && ties[1].r.name!==best.r.name){
    setGeminiState(`Heard: "${raw||phrase}" · Which ${ties.slice(0,3).map(x=>x.r.name).join(' / ')}?`);
    return;
  }
  const row = EM.rows[best.i];
  if(['na','n/a','n.a.','not applicable'].includes(parsedStatus)){
    row.na = true; row.present = true; row.marks = null;
  }else if(parsedStatus==='absent'){
    row.na = false; row.present = false; row.marks = null;
  }else{
    if(mark<0 || mark>EM.full){ setGeminiState(`${row.name}: mark ${mark} is outside ${EM.full}.`); return; }
    row.na = false; row.present = true; row.marks = mark;
  }
  renderEMRoster();
  saveDraft();
  setGeminiState(`${row.name}: ${parsedStatus && parsedStatus!=='absent'?'N.A.':parsedStatus==='absent'?'Absent':mark+'/'+EM.full}`);
}
function blobToBase64(blob){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
function geminiKey(){
  return localStorage.getItem(LS_GEMINI_KEY) || '';
}
window.setGeminiKey = ()=>{
  const current = geminiKey();
  const key = prompt('Paste your Gemini API key. It is saved only in this browser, not in GitHub or Supabase.', current);
  if(key===null) return;
  if(normalizeText(key)) localStorage.setItem(LS_GEMINI_KEY, normalizeText(key));
  else localStorage.removeItem(LS_GEMINI_KEY);
  setGeminiState(normalizeText(key) ? 'Gemini key saved on this browser.' : 'Gemini key removed.');
};
async function sendGeminiAudio(blob){
  const key = geminiKey();
  if(!key){ setGeminiKey(); if(!geminiKey()) return; }
  setGeminiState('Reading audio with Gemini...');
  const audio = await blobToBase64(blob);
  const roster = EM.rows.map(r=>r.name).join(', ');
  const promptText = `Extract one test mark from this teacher audio. Match the student to one of these roster names only: ${roster}. Full marks is ${EM.full}. Return JSON only with keys student_name, marks, status, raw. status must be present, absent, or na. marks is a number or null.`;
  const body = {
    contents:[{parts:[
      {text:promptText},
      {inline_data:{mime_type:blob.type || 'audio/webm', data:audio}}
    ]}]
  };
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${encodeURIComponent(geminiKey())}`,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(body)
  });
  const json = await res.json();
  if(!res.ok) throw new Error(json.error?.message || 'Gemini request failed.');
  const text = json.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('') || '';
  const clean = text.replace(/```json|```/g,'').trim();
  const jsonText = clean.match(/\{[\s\S]*\}/)?.[0] || clean;
  try{
    applyVoiceMark(JSON.parse(jsonText));
  }catch(e){
    applyVoiceMark({raw:clean});
  }
}
window.toggleGeminiRecording = async ()=>{
  if(GEMINI_RECORDER && GEMINI_RECORDER.state==='recording'){
    GEMINI_RECORDER.stop();
    return;
  }
  if(!EM.rows.length){ alert('Select a class/section with students first.'); return; }
  if(!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder){ alert('Audio recording is not supported in this browser.'); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    GEMINI_CHUNKS = [];
    const rec = new MediaRecorder(stream);
    GEMINI_RECORDER = rec;
    rec.ondataavailable = e=>{ if(e.data.size) GEMINI_CHUNKS.push(e.data); };
    rec.onstop = async ()=>{
      clearTimeout(GEMINI_TIMER);
      stream.getTracks().forEach(t=>t.stop());
      setGeminiState('Sending audio...');
      try{
        await sendGeminiAudio(new Blob(GEMINI_CHUNKS,{type:rec.mimeType || 'audio/webm'}));
      }catch(e){
        setGeminiState(e.message || 'Could not read the audio.');
      }finally{
        GEMINI_RECORDER = null;
      }
    };
    rec.start();
    setGeminiState('Recording... say one name and mark.',true);
    GEMINI_TIMER = setTimeout(()=>{ if(rec.state==='recording') rec.stop(); },7000);
  }catch(e){
    setGeminiState('Microphone permission blocked.');
  }
};
window.removeRow = i=>{
  const row=EM.rows[i];
  if(!row) return;
  if(EM.editId && row.student_id){
    if(!confirm(`Delete ${row.name}'s saved mark from this test? This cannot be undone.`)) return;
    EM.removedResultStudentIds=[...new Set([...(EM.removedResultStudentIds||[]),row.student_id])];
  }
  EM.rows.splice(i,1); renderEMRoster(); saveDraft();
};
function renderEMRoster(){
  const el = document.getElementById('emRoster');
  if(!EM.rows.length){
    el.innerHTML = `<div class="muted small" style="padding:14px 0">No students found for this class and section. Add students in the <a class="link" href="#" onclick="event.preventDefault();window.navHavRoster()">Students</a> tab.</div>`;
    recountEM(); return;
  }
  el.innerHTML = EM.rows.map((r,i)=>`
    <div class="listrow" style="${r.na?'opacity:.55':''}">
      <div style="width:20px" class="tiny faint">${i+1}</div>
      ${avatar(r.gender,r.name)}
      <div style="flex:1">${r.name}${r.na?' <span class="pill">N.A.</span>':''}</div>
      <input class="mkin" type="number" min="0" max="${EM.full}" step="0.5" placeholder="0" ${(r.present&&!r.na)?'':'disabled'} value="${r.marks??''}" oninput="setMark(${i},this.value)">
      <span class="tiny faint" style="width:28px">/${EM.full}</span>
      <button style="min-width:74px" ${r.na?'disabled':''} class="${r.present?'':'on'}" onclick="toggleAbsent(${i})">${r.present?'Absent':'Absent ✓'}</button>
      <button style="min-width:58px" class="${r.na?'on':''}" title="Did not take this subject (optional)" onclick="toggleNA(${i})">${r.na?'N.A. ✓':'N.A.'}</button>
      <button class="ghost" title="Remove from this test" onclick="removeRow(${i})">✕</button>
    </div>`).join('');
  recountEM();
}
window.setFull = f=>{
  EM.full=f;
  const fullSelect=document.getElementById('emFull');
  if(fullSelect) fullSelect.value=String(f);
  document.getElementById('fmLabel').textContent=f;
  EM.rows.forEach(r=>{if(r.marks!=null&&r.marks>f)r.marks=f;});
  renderEMRoster();
  saveDraft();
};
window.setMark = (i,v)=>{ let n=parseFloat(v); if(isNaN(n)){EM.rows[i].marks=null;} else {n=Math.max(0,Math.min(EM.full,n)); EM.rows[i].marks=n;} recountEM(); saveDraft(); };
window.toggleAbsent = i=>{ if(EM.rows[i].na) return; EM.rows[i].present=!EM.rows[i].present; if(!EM.rows[i].present)EM.rows[i].marks=null; renderEMRoster(); saveDraft(); };
window.toggleNA = i=>{ EM.rows[i].na=!EM.rows[i].na; if(EM.rows[i].na){ EM.rows[i].marks=null; EM.rows[i].present=true; } renderEMRoster(); saveDraft(); };
function recountEM(){
  const eligible = EM.rows.filter(r=>!r.na);
  let entered=0,abs=0,naC=EM.rows.length-eligible.length,sum=0,c=0;
  eligible.forEach(r=>{ if(!r.present){abs++;return;} if(r.marks!=null){entered++;sum+=pct(r.marks,EM.full);c++;} });
  const set=(id,v)=>{ const e=document.getElementById(id); if(e) e.textContent=v; };
  set('cEntered',entered); set('cTotal',eligible.length); set('cAbs',abs); set('cNA',naC);
  set('cAvg', c?(Math.round(sum/c*10)/10)+'%':'—');
}
window.saveTest = async ()=>{
  const eligible = EM.rows.filter(r=>!r.na);
  if(!eligible.length){ alert('No students to record (everyone is marked N.A.).'); return; }
  const blank = eligible.find(r=>r.present && r.marks==null);
  if(blank){ if(!confirm(blank.name+' has no marks. Save anyway? (Cancel to go back and mark absent or N.A.)')) return; }
  const clsNum = parseInt(val('emClass'));
  const chapterIds = Array.from(document.getElementById('emChap')?.selectedOptions||[]).map(o=>o.value).filter(id=>id!=='__new__');
  if(!chapterIds.length){ alert('Select at least one chapter.'); return; }
  const chapters = chapterIds.map(id=>(EM.chapters||[]).find(c=>c.id===id)).filter(Boolean);
  if(chapters.length!==chapterIds.length){ alert('Chapter not found. Please select the chapters again.'); return; }
  const chapter = chapters[0];
  const secVal = val('emSec');
  const testData = {
    class_level: clsNum, section: secVal==='All'?null:secVal,
    subject: val('emSub'),
    teacher_id: val('emTeacher')||null,
    chapter_id: chapter.id,
    chapter_ids: chapterIds,
    chapter_no: chapter.chapter_no,
    chapter_name: chapter.title,
    chapter_names: chapters.map(c=>c.title),
    test_type:val('emType')||'Chapter End Test', full_marks:EM.full,
    duration_minutes:Number(val('emTime'))||60,
    test_date:document.getElementById('emDate').value
  };
  const resultRows = EM.rows.map(r=>({student_id:r.student_id,marks:(r.present&&!r.na)?r.marks:null,present:r.na?false:r.present,na:!!r.na}));
  const oldRows = EM.editId ? await cachedResults(EM.editId) : [];
  const pendingLogs = EM.editId ? changedResultLogs({id:EM.editId}, oldRows, resultRows) : [];
  if(EM.editId){
    const msg = pendingLogs.length
      ? `Overwrite this saved test and record ${pendingLogs.length} mark/attendance change${pendingLogs.length===1?'':'s'}?`
      : 'Overwrite this saved test? No mark changes were detected, but test details may be updated.';
    if(!confirm(msg)) return;
  }
  saveDraft();
  updateSaveState('saving','Saving marks...');
  let test = null;
  try{
    test = EM.editId ? await DB.updateTest(EM.editId,testData) : await DB.addTest(testData);
    EM.editId = test.id;
    EM.editTest = test;
    EM.saveLabel = '✓ Save changes';
    saveDraft();
    await DB.deleteResults(test.id,EM.removedResultStudentIds||[]);
    await DB.saveResults(test.id, resultRows);
    EM.removedResultStudentIds=[];
    if(pendingLogs.length) await DB.addEditLogs(pendingLogs.map(l=>({...l,test_id:test.id})));
    invalidateResults(test.id);
    writeJSON(LS_LAST_ENTRY,{academic_session:val('emSession'),class_level:clsNum,section:secVal,subject:val('emSub')});
    clearJSON(LS_MARK_DRAFT);
    EM.draftDirty = false;
    CURRENT_TEST = test.id;
    const avg = await classAverage(test);
    const entered = EM.rows.filter(r=>!r.na&&r.present&&r.marks!=null).length;
    const abs = EM.rows.filter(r=>!r.na&&!r.present).length;
    const naC = EM.rows.filter(r=>r.na).length;
    updateSaveState('saved','Saved.');
    document.getElementById('saveSummary').innerHTML =
      `Class ${test.class_level}${test.section?(' '+test.section):' (all sections)'} · ${test.subject} · ${chapterLabel(test)}<br>${test.full_marks} marks · ${fmtDate(testDate(test))}<br><br><b>${entered}</b> appeared of <b>${EM.rows.length}</b> enrolled · <b>${abs}</b> absent · <b>${naC}</b> N.A. · class avg <b>${avg??'—'}%</b>`;
    document.getElementById('saveOverlay').classList.add('show');
  }catch(e){
    const reason = normalizeText(e?.message || e?.details || 'Please check the connection.');
    updateSaveState('failed',`Save failed: ${reason} Your marks are still here.`);
    alert(`Save failed: ${reason}\n\nYour entered marks were kept as a local draft. Please correct the issue and click Retry save.`);
  }
};
