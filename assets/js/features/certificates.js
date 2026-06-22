/* ---------- AVETI CERTIFICATES ---------- */
let CERT = { event:null, events:[], participants:[], selectedId:null };

function defaultTrainingEvent(){
  const year = new Date().getFullYear();
  return {
    title:'NEP 2020 and Competency-Based Teaching Practices',
    subtitle:'One-Hour Professional Development Webinar',
    event_date:new Date().toISOString().slice(0,10),
    duration_hours:1,
    organizer_name:'AVETI LEARNING',
    focus_points:[
      'Understanding the vision of NEP 2020',
      'Introduction to Competency-Based Education',
      'Classroom implementation strategies',
      'Effective lesson planning and assessment practices',
      'Digital tools and teaching resources for improved learning outcomes'
    ].join('\n'),
    certificate_prefix:`AVT-PD-${year}`,
    signatory_1_name:'Sushant Kumar Mahapatra',
    signatory_1_title:'Co-Founder & Chief Academic Officer',
    signatory_2_name:'',
    signatory_2_title:''
  };
}

const escapeHTML = s => String(s??'').replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const eventFocusPoints = event => normalizeText(event?.focus_points).split(/\n|;/).map(normalizeText).filter(Boolean);
const certIdFor = (event,index) => `${event.certificate_prefix || 'AVT-PD'}-${String(index+1).padStart(6,'0')}`;
const certificateVerifyURL = participant => `${location.origin}${location.pathname}?verify=${encodeURIComponent(participant.certificate_id)}`;
const selectedCertParticipant = () => CERT.participants.find(p=>p.id===CERT.selectedId) || CERT.participants[0] || null;

async function certificates(){
  setCrumb('Certificates');
  try{
    CERT.events = await DB.listTrainingEvents();
    if(!CERT.event && CERT.events[0]) CERT.event = CERT.events[0];
    CERT.participants = CERT.event ? await DB.listTrainingParticipants(CERT.event.id) : [];
    if(!CERT.selectedId && CERT.participants[0]) CERT.selectedId = CERT.participants[0].id;
    renderCertificates();
  }catch(e){
    show(`<div class="card pad"><h2 style="font-size:18px">Certificates setup needed</h2><div class="muted" style="margin-top:8px">Could not load certificate tables. Run <b>supabase/migrations/20260623_training_certificates.sql</b> in Supabase, then refresh.</div><div class="tiny faint" style="margin-top:8px">${escapeHTML(e.message||e)}</div></div>`);
  }
}

function certEventForm(event){
  const e = event || defaultTrainingEvent();
  const eventOptions = CERT.events.length
    ? `<div class="field"><label>Saved event</label><select onchange="selectTrainingEvent(this.value)">${CERT.events.map(ev=>`<option value="${ev.id}" ${CERT.event?.id===ev.id?'selected':''}>${escapeHTML(ev.title)} · ${fmtDate(ev.event_date)}</option>`).join('')}</select></div>`
    : '';
  return `
    <div class="card pad" style="margin-bottom:14px">
      <div class="row between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div><h2 style="font-size:18px">Training event</h2><div class="muted small">Create one event, upload teachers, then generate certificates.</div></div>
        <button class="primary" onclick="saveTrainingEvent()">${CERT.event?'Save event':'Create event'}</button>
      </div>
      <div class="wrap-fields">
        ${eventOptions}
        <div class="field" style="flex:2"><label>Programme title</label><input id="certTitle" value="${escapeHTML(e.title)}"></div>
        <div class="field"><label>Date</label><input id="certDate" type="date" value="${String(e.event_date||'').slice(0,10)}"></div>
        <div class="field"><label>PD hours</label><input id="certHours" type="number" min="0.5" step="0.5" value="${escapeHTML(e.duration_hours||1)}"></div>
      </div>
      <div class="wrap-fields" style="margin-top:10px">
        <div class="field"><label>Subtitle</label><input id="certSubtitle" value="${escapeHTML(e.subtitle)}"></div>
        <div class="field"><label>Organizer</label><input id="certOrganizer" value="${escapeHTML(e.organizer_name)}"></div>
        <div class="field"><label>Certificate prefix</label><input id="certPrefix" value="${escapeHTML(e.certificate_prefix)}"></div>
      </div>
      <div class="wrap-fields" style="margin-top:10px">
        <div class="field"><label>Signatory 1 name</label><input id="certSig1Name" value="${escapeHTML(e.signatory_1_name)}"></div>
        <div class="field"><label>Signatory 1 title</label><input id="certSig1Title" value="${escapeHTML(e.signatory_1_title)}"></div>
        <div class="field"><label>Signatory 2 name</label><input id="certSig2Name" value="${escapeHTML(e.signatory_2_name)}"></div>
        <div class="field"><label>Signatory 2 title</label><input id="certSig2Title" value="${escapeHTML(e.signatory_2_title)}"></div>
      </div>
      <div class="field" style="margin-top:10px"><label>Session focus points, one per line</label><textarea id="certFocus" rows="5">${escapeHTML(e.focus_points)}</textarea></div>
    </div>`;
}

function certParticipantsPanel(){
  const disabled = CERT.event ? '' : 'disabled';
  const rows = CERT.participants.length ? CERT.participants.map(p=>`
    <div class="listrow">
      <div class="cert-id">${escapeHTML(p.certificate_id)}</div>
      <div style="flex:1;min-width:0"><b>${escapeHTML(p.name)}</b><div class="tiny faint">${escapeHTML(p.school||'School not set')} · ${escapeHTML(p.email||'No email')}</div></div>
      <div class="small muted">${escapeHTML(p.whatsapp||p.phone||'No phone')}</div>
      <button onclick="selectCertParticipant('${p.id}')">Preview</button>
      <button onclick="downloadCertificatePDF('${p.id}')">PDF</button>
      <button class="primary" onclick="sendCertificateWhatsApp('${p.id}')">${p.whatsapp_sent_at?'Sent again':'WhatsApp'}</button>
    </div>`).join('') : '<div class="muted small" style="padding:8px 0">No participants uploaded yet.</div>';
  return `
    <div class="card pad" style="margin-bottom:14px">
      <div class="row between" style="flex-wrap:wrap;gap:10px;margin-bottom:12px">
        <div><h2 style="font-size:18px">Participants</h2><div class="muted small">CSV columns: name, phone, whatsapp, email, school.</div></div>
        <div class="row" style="gap:8px;flex-wrap:wrap">
          <button onclick="downloadCertificateCSVTemplate()">Download sample CSV</button>
          <button ${disabled} onclick="document.getElementById('certCsvInput').click()">Upload CSV</button>
          <input id="certCsvInput" type="file" accept=".csv,text/csv" style="display:none" onchange="importCertificateCSV(this.files[0]);this.value=''">
          <button ${CERT.participants.length?'':'disabled'} onclick="exportCertificateReport()">Download report</button>
        </div>
      </div>
      ${rows}
      <div class="tiny faint" style="margin-top:10px">WhatsApp opens a ready message. Attach the downloaded PDF manually in MVP; API-based attachment/link delivery can come next.</div>
    </div>`;
}

function certificatePreview(event, participant){
  if(!event) return '<div class="card pad"><div class="muted">Create or select a training event to preview the certificate.</div></div>';
  const p = participant || {name:'Teacher Name',school:'School Name',certificate_id:`${event.certificate_prefix||'AVT-PD'}-000001`};
  const points = eventFocusPoints(event).slice(0,5);
  return `
    <div class="card pad">
      <div class="row between" style="margin-bottom:12px;gap:8px;flex-wrap:wrap">
        <div><h2 style="font-size:18px">Certificate preview</h2><div class="muted small">${escapeHTML(p.certificate_id)}</div></div>
        <button ${participant?'':'disabled'} onclick="downloadCertificatePDF('${participant?.id||''}')">Download PDF</button>
      </div>
      <div class="certificate-paper">
        <img class="cert-logo" alt="Aveti Learning" src="assets/images/aveti-logo.png">
        <div class="cert-kicker">Certificate of Participation</div>
        <div class="cert-line">This is to certify that</div>
        <div class="cert-name">${escapeHTML(p.name)}</div>
        <div class="cert-school">${escapeHTML(p.school||'')}</div>
        <div class="cert-line">has successfully participated in the</div>
        <div class="cert-subtitle">${escapeHTML(event.subtitle)}</div>
        <div class="cert-title">${escapeHTML(event.title)}</div>
        <div class="cert-organizer">organized by <b>${escapeHTML(event.organizer_name)}</b></div>
        <div class="cert-focus">
          ${points.map(point=>`<span>${escapeHTML(point)}</span>`).join('')}
        </div>
        <div class="cert-meta">
          <div><b>Date</b><br>${fmtDate(event.event_date)}</div>
          <div><b>PD Hours</b><br>${escapeHTML(event.duration_hours)} Hour${Number(event.duration_hours)===1?'':'s'}</div>
          <div><b>Certificate ID</b><br>${escapeHTML(p.certificate_id)}</div>
          <div class="cert-qr"><b>QR</b><br>${escapeHTML(p.certificate_id).slice(-6)}</div>
        </div>
        <div class="cert-thanks">Thank you for your commitment to continuous learning and educational excellence.</div>
        <div class="cert-signatures">
          <div><div class="sig-line"></div><b>${escapeHTML(event.signatory_1_name)}</b><br><span>${escapeHTML(event.signatory_1_title)}</span></div>
          <div style="${event.signatory_2_name?'':'visibility:hidden'}"><div class="sig-line"></div><b>${escapeHTML(event.signatory_2_name)}</b><br><span>${escapeHTML(event.signatory_2_title)}</span></div>
        </div>
      </div>
    </div>`;
}

function renderCertificates(){
  show(`
    ${demoNote}
    ${certEventForm(CERT.event)}
    ${certParticipantsPanel()}
    ${certificatePreview(CERT.event,selectedCertParticipant())}
  `);
}

function certEventPayload(){
  return {
    title:normalizeText(val('certTitle')),
    subtitle:normalizeText(val('certSubtitle')),
    event_date:val('certDate'),
    duration_hours:Number(val('certHours'))||1,
    organizer_name:normalizeText(val('certOrganizer'))||'AVETI LEARNING',
    focus_points:document.getElementById('certFocus').value.trim(),
    certificate_prefix:normalizeText(val('certPrefix'))||`AVT-PD-${new Date().getFullYear()}`,
    signatory_1_name:normalizeText(val('certSig1Name')),
    signatory_1_title:normalizeText(val('certSig1Title')),
    signatory_2_name:normalizeText(val('certSig2Name')),
    signatory_2_title:normalizeText(val('certSig2Title'))
  };
}

window.saveTrainingEvent = async ()=>{
  const payload = certEventPayload();
  if(!payload.title){ alert('Enter programme title.'); return; }
  if(!payload.event_date){ alert('Select event date.'); return; }
  try{
    CERT.event = CERT.event ? await DB.updateTrainingEvent(CERT.event.id,payload) : await DB.addTrainingEvent(payload);
    CERT.events = await DB.listTrainingEvents();
    CERT.participants = await DB.listTrainingParticipants(CERT.event.id);
    renderCertificates();
  }catch(e){ alert(e.message || 'Could not save training event.'); }
};

window.selectTrainingEvent = async id=>{
  CERT.event = CERT.events.find(e=>e.id===id) || null;
  CERT.participants = CERT.event ? await DB.listTrainingParticipants(CERT.event.id) : [];
  CERT.selectedId = CERT.participants[0]?.id || null;
  renderCertificates();
};

window.downloadCertificateCSVTemplate = ()=>{
  const rows = [
    ['name','phone','whatsapp','email','school'],
    ['Priya Sharma','9876543210','9876543210','priya@gmail.com','DAV Public School'],
    ['Rakesh Kumar','9123456789','9123456789','rakesh@gmail.com','OAV Bhubaneswar']
  ];
  downloadBlob('aveti-certificate-participants-template.csv','text/csv;charset=utf-8',rows.map(csvLine).join('\n'));
};

window.importCertificateCSV = async file=>{
  if(!file || !CERT.event) return;
  try{
    const rows = await readCSVFile(file);
    const warnings = [];
    const seen = new Set();
    const participants = rows.map((r,i)=>{
      const rowNo = i+2;
      const name = normalizeText(r.name || r.teacher_name || r.participant_name);
      if(!name){ warnings.push(`Row ${rowNo}: missing name.`); return null; }
      const email = normalizeText(r.email || r.email_id);
      const phone = cleanPhone(r.phone);
      const whatsapp = cleanPhone(r.whatsapp || r.whatsapp_number || r.phone);
      const key = [name.toLowerCase(), email.toLowerCase(), whatsapp].join('|');
      if(seen.has(key)){ warnings.push(`Row ${rowNo}: duplicate participant (${name}).`); return null; }
      seen.add(key);
      return {
        name,
        phone,
        whatsapp,
        email,
        school:normalizeText(r.school || r.school_name || r.organisation || r.organization),
        certificate_id:certIdFor(CERT.event,i),
        certificate_url:null,
        whatsapp_sent_at:null,
        email_sent_at:null,
        verified_at:null
      };
    }).filter(Boolean);
    if(!participants.length){ alert('No valid participants found.'); return; }
    CERT.participants = await DB.saveTrainingParticipants(CERT.event.id,participants);
    CERT.selectedId = CERT.participants[0]?.id || null;
    renderCertificates();
    alert(`Generated ${CERT.participants.length} certificate ID${CERT.participants.length===1?'':'s'}.${warnings.length?'\n\n'+warnings.slice(0,8).join('\n'):''}`);
  }catch(e){ alert(e.message || 'Could not read this CSV file.'); }
};

window.selectCertParticipant = id=>{ CERT.selectedId=id; renderCertificates(); };

function certificatePdfLines(event, participant){
  const yStart = 790;
  const points = eventFocusPoints(event).slice(0,5);
  const lines = [
    {text:'AVETI LEARNING',x:236,y:yStart,size:18},
    {text:'CERTIFICATE OF PARTICIPATION',x:170,y:748,size:20},
    {text:'This is to certify that',x:226,y:712,size:12},
    {text:participant.name,x:190,y:684,size:24},
    {text:participant.school||'',x:210,y:664,size:11},
    {text:'has successfully participated in the',x:196,y:636,size:12},
    {text:event.subtitle,x:160,y:612,size:15},
    {text:event.title,x:90,y:586,size:14},
    {text:`Organized by ${event.organizer_name}`,x:204,y:560,size:11},
    {text:'The session focused on:',x:70,y:526,size:12},
    ...points.map((point,i)=>({text:`- ${point}`,x:90,y:506-(i*18),size:10})),
    {text:`Date: ${fmtDate(event.event_date)}`,x:70,y:374,size:11},
    {text:`Professional Development Hours: ${event.duration_hours}`,x:70,y:354,size:11},
    {text:`Certificate ID: ${participant.certificate_id}`,x:70,y:334,size:11},
    {text:`Verify: ${certificateVerifyURL(participant)}`,x:70,y:314,size:8},
    {text:'Thank you for your commitment to continuous learning and educational excellence.',x:92,y:272,size:10},
    {text:event.signatory_1_name,x:80,y:176,size:11},
    {text:event.signatory_1_title,x:80,y:160,size:9}
  ];
  if(event.signatory_2_name){
    lines.push({text:event.signatory_2_name,x:380,y:176,size:11});
    lines.push({text:event.signatory_2_title,x:380,y:160,size:9});
  }
  return lines;
}

window.downloadCertificatePDF = id=>{
  const participant = CERT.participants.find(p=>p.id===id);
  if(!CERT.event || !participant){ alert('Select a participant first.'); return; }
  downloadBlob(`${fileSafe(participant.certificate_id+'-'+participant.name)}.pdf`,'application/pdf',simplePdf(certificatePdfLines(CERT.event,participant)));
};

function certificateWhatsAppMessage(participant){
  return `Hello ${participant.name},\n\nThank you for participating in the ${CERT.event.title} webinar.\n\nYour certificate is ready.\nCertificate ID: ${participant.certificate_id}\n\nRegards,\nTeam Aveti Learning`;
}

window.sendCertificateWhatsApp = async id=>{
  const participant = CERT.participants.find(p=>p.id===id);
  if(!participant) return;
  const phone = normalizeIndianPhone(participant.whatsapp || participant.phone);
  if(!phone){ alert('Add a valid Indian WhatsApp number for this participant.'); return; }
  const message = encodeURIComponent(certificateWhatsAppMessage(participant));
  try{
    await DB.updateTrainingParticipant(id,{whatsapp_sent_at:new Date().toISOString()});
    CERT.participants = await DB.listTrainingParticipants(CERT.event.id);
    renderCertificates();
  }catch(e){}
  window.open(`https://wa.me/91${phone}?text=${message}`,'_blank','noopener');
};

window.exportCertificateReport = ()=>{
  if(!CERT.event){ alert('No event selected.'); return; }
  const lines = [
    ['name','phone','whatsapp','email','school','certificate_id','certificate_url','whatsapp_sent_at','verified_at'],
    ...CERT.participants.map(p=>[p.name,p.phone,p.whatsapp,p.email,p.school,p.certificate_id,p.certificate_url||'',p.whatsapp_sent_at||'',p.verified_at||''])
  ];
  downloadBlob(`${fileSafe(CERT.event.title)}-certificate-report.csv`,'text/csv;charset=utf-8',lines.map(row=>row.map(csvCell).join(',')).join('\n'));
};

window.certificates = certificates;
