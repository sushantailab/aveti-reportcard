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
const certSentCount = () => CERT.participants.filter(p=>p.whatsapp_sent_at).length;

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
    ? `<div class="field cert-saved-event"><label>Saved event</label><select onchange="selectTrainingEvent(this.value)">${CERT.events.map(ev=>`<option value="${ev.id}" ${CERT.event?.id===ev.id?'selected':''}>${escapeHTML(ev.title)} · ${fmtDate(ev.event_date)}</option>`).join('')}</select></div>`
    : '';
  return `
    <div class="card pad cert-panel">
      <div class="cert-panel-head">
        <div><div class="eyebrow">Step 1</div><h2>Training event</h2><div class="muted small">Create or edit the webinar details.</div></div>
        <div class="row cert-actions">
          ${CERT.event?'<button onclick="newTrainingEvent()">New event</button>':''}
          <button class="primary" onclick="saveTrainingEvent()">${CERT.event?'Save event':'Create event'}</button>
        </div>
      </div>
      <div class="cert-form-grid">
        ${eventOptions}
        <div class="field" style="flex:2"><label>Programme title</label><input id="certTitle" value="${escapeHTML(e.title)}"></div>
        <div class="field"><label>Date</label><input id="certDate" type="date" value="${String(e.event_date||'').slice(0,10)}"></div>
        <div class="field"><label>PD hours</label><input id="certHours" type="number" min="0.5" step="0.5" value="${escapeHTML(e.duration_hours||1)}"></div>
      </div>
      <div class="cert-form-grid cert-form-grid-3">
        <div class="field"><label>Subtitle</label><input id="certSubtitle" value="${escapeHTML(e.subtitle)}"></div>
        <div class="field"><label>Organizer</label><input id="certOrganizer" value="${escapeHTML(e.organizer_name)}"></div>
        <div class="field"><label>Certificate prefix</label><input id="certPrefix" value="${escapeHTML(e.certificate_prefix)}"></div>
      </div>
      <div class="cert-form-grid cert-form-grid-4">
        <div class="field"><label>Left signature name</label><input id="certSig1Name" value="${escapeHTML(e.signatory_1_name)}"></div>
        <div class="field"><label>Left signature title</label><input id="certSig1Title" value="${escapeHTML(e.signatory_1_title)}"></div>
        <div class="field"><label>Right signature name</label><input id="certSig2Name" value="${escapeHTML(e.signatory_2_name)}"></div>
        <div class="field"><label>Right signature title</label><input id="certSig2Title" value="${escapeHTML(e.signatory_2_title)}"></div>
      </div>
      <div class="field" style="margin-top:10px"><label>Session focus points, one per line</label><textarea id="certFocus" rows="5">${escapeHTML(e.focus_points)}</textarea></div>
    </div>`;
}

function certParticipantsPanel(){
  const disabled = CERT.event ? '' : 'disabled';
  const rows = CERT.participants.length ? CERT.participants.map(p=>`
    <div class="cert-participant ${p.id===CERT.selectedId?'selected':''}">
      <div class="cert-participant-main">
        <div class="cert-avatar">${escapeHTML((p.name||'?').trim().charAt(0).toUpperCase()||'?')}</div>
        <div style="min-width:0">
          <div class="cert-id">${escapeHTML(p.certificate_id)}</div>
          <b>${escapeHTML(p.name)}</b>
          <div class="tiny faint">${escapeHTML(p.school||'School not set')} · ${escapeHTML(p.email||'No email')}</div>
        </div>
        <div class="cert-phone">${escapeHTML(p.whatsapp||p.phone||'No phone')}</div>
      </div>
      <div class="cert-participant-actions">
        <button onclick="selectCertParticipant('${p.id}')">Preview</button>
        <button onclick="downloadCertificatePDF('${p.id}')">Download PDF</button>
        <button class="primary" onclick="sendCertificateWhatsApp('${p.id}')">${p.whatsapp_sent_at?'Open WhatsApp again':'Open WhatsApp'}</button>
      </div>
    </div>`).join('') : '<div class="cert-empty"><b>No participants yet.</b><br>Upload a CSV to generate certificate IDs, preview real certificates, download PDFs, and open WhatsApp messages.</div>';
  return `
    <div class="card pad cert-panel">
      <div class="cert-panel-head">
        <div><div class="eyebrow">Step 2</div><h2>Participants</h2><div class="muted small">CSV columns: name, phone, whatsapp, email, school.</div></div>
        <div class="row cert-actions">
          <button onclick="downloadCertificateCSVTemplate()">Download sample CSV</button>
          <button class="primary" ${disabled} onclick="document.getElementById('certCsvInput').click()">Upload CSV</button>
          <input id="certCsvInput" type="file" accept=".csv,text/csv" style="display:none" onchange="importCertificateCSV(this.files[0]);this.value=''">
          <button ${CERT.participants.length?'':'disabled'} onclick="exportCertificateReport()">Download report</button>
        </div>
      </div>
      <div class="cert-upload-note">
        <b>WhatsApp flow:</b> download the PDF first, then open the ready WhatsApp message and attach it manually.
      </div>
      <div class="cert-participant-list">${rows}</div>
    </div>`;
}

function certificatePaperHTML(event, participant){
  const p = participant;
  return `
    <div class="certificate-paper">
      <div class="cert-top">
        <img class="cert-logo" alt="Aveti Learning" src="assets/images/aveti-logo.png">
        <div>
          <div class="cert-small">Professional Development</div>
          <div class="cert-org">${escapeHTML(event.organizer_name)}</div>
        </div>
      </div>
      <div class="cert-kicker">Certificate of Participation</div>
      <div class="cert-line">This certifies that</div>
      <div class="cert-name">${escapeHTML(p.name)}</div>
      ${p.school?`<div class="cert-school">${escapeHTML(p.school)}</div>`:''}
      <div class="cert-line">participated in</div>
      <div class="cert-subtitle">${escapeHTML(event.subtitle)}</div>
      <div class="cert-title">${escapeHTML(event.title)}</div>
      <div class="cert-meta">
        <div><b>Date</b><br>${fmtDate(event.event_date)}</div>
        <div><b>PD Hours</b><br>${escapeHTML(event.duration_hours)} Hour${Number(event.duration_hours)===1?'':'s'}</div>
        <div><b>Certificate ID</b><br>${escapeHTML(p.certificate_id)}</div>
      </div>
      <div class="cert-thanks">Thank you for your commitment to continuous learning and educational excellence.</div>
      <div class="cert-signatures">
        <div><div class="sig-line"></div><b>${escapeHTML(event.signatory_1_name)}</b><br><span>${escapeHTML(event.signatory_1_title)}</span></div>
        <div style="${event.signatory_2_name?'':'visibility:hidden'}"><div class="sig-line"></div><b>${escapeHTML(event.signatory_2_name)}</b><br><span>${escapeHTML(event.signatory_2_title)}</span></div>
      </div>
    </div>`;
}

function certificatePreview(event, participant){
  if(!event) return '<div class="card pad"><div class="muted">Create or select a training event to preview the certificate.</div></div>';
  if(!participant) return `
    <div class="card pad cert-panel">
      <div class="cert-panel-head">
        <div><div class="eyebrow">Step 3</div><h2>Certificate preview</h2><div class="muted small">Upload participants to generate real certificates.</div></div>
        <button disabled>Download PDF</button>
      </div>
      <div class="cert-empty cert-empty-large">No teacher selected yet. Upload the CSV and the first certificate will appear here.</div>
    </div>`;
  const p = participant;
  return `
    <div class="card pad cert-panel cert-preview-panel">
      <div class="cert-panel-head">
        <div><div class="eyebrow">Step 3</div><h2>Certificate preview</h2><div class="muted small">${escapeHTML(p.certificate_id)}</div></div>
        <div class="row cert-actions">
          <button onclick="downloadCertificatePDF('${participant.id}')">Download PDF</button>
          <button class="primary" onclick="sendCertificateWhatsApp('${participant.id}')">Open WhatsApp</button>
        </div>
      </div>
      ${certificatePaperHTML(event,p)}
    </div>`;
}

function certificatesHero(){
  const hasEvent = !!CERT.event;
  const total = CERT.participants.length;
  const sent = certSentCount();
  return `
    <div class="cert-hero">
      <div>
        <div class="eyebrow">Aveti Certificates</div>
        <h1>Teacher PD certificate generator</h1>
        <p>Create an event, upload a CSV, preview certificates, download PDFs, and open WhatsApp messages from one place.</p>
      </div>
      <div class="cert-hero-metrics">
        <div><b>${CERT.events.length}</b><span>Events</span></div>
        <div><b>${total}</b><span>Participants</span></div>
        <div><b>${sent}</b><span>WhatsApp opened</span></div>
      </div>
    </div>
    <div class="cert-steps">
      <div class="${hasEvent?'done':''}"><b>1</b><span>Event details</span></div>
      <div class="${total?'done':''}"><b>2</b><span>Upload CSV</span></div>
      <div class="${selectedCertParticipant()?'done':''}"><b>3</b><span>Preview & send</span></div>
    </div>`;
}

function renderCertificates(){
  show(`
    ${demoNote}
    ${certificatesHero()}
    <div class="cert-workspace">
      <div>
        ${certEventForm(CERT.event)}
        ${certParticipantsPanel()}
      </div>
      <div class="cert-preview-column">
        ${certificatePreview(CERT.event,selectedCertParticipant())}
      </div>
    </div>
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

window.newTrainingEvent = ()=>{
  CERT.event = null;
  CERT.participants = [];
  CERT.selectedId = null;
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

function printCertificatePDF(event, participant){
  const printWindow = window.open('', '_blank');
  if(!printWindow){ alert('Please allow pop-ups to save the certificate PDF.'); return; }
  const baseHref = location.href.split('?')[0].replace(/[^/]*$/,'');
  const cssHref = new URL('assets/css/styles.css?v=20260623-3', baseHref).href;
  const title = fileSafe(participant.certificate_id+'-'+participant.name);
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHTML(title)}</title>
  <base href="${escapeHTML(baseHref)}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Onest:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${escapeHTML(cssHref)}">
  <style>
    @page{size:A4 landscape;margin:0}
    html,body{margin:0;background:#fff}
    body{display:flex;align-items:center;justify-content:center;min-height:100vh;padding:0}
    .certificate-paper{width:297mm;height:210mm;min-height:auto;border:0;border-radius:0;box-shadow:none;padding:18mm 22mm}
    .cert-top{margin-bottom:20mm}
    .cert-kicker{font-size:26pt}
    .cert-name{font-size:38pt}
    .cert-title{font-size:23pt}
    .cert-meta{margin-top:18mm}
    .cert-signatures{margin-top:22mm}
    *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  </style>
</head>
<body>${certificatePaperHTML(event,participant)}
<script>
  window.onload = () => setTimeout(() => { window.focus(); window.print(); }, 350);
</script>
</body>
</html>`);
  printWindow.document.close();
}

window.downloadCertificatePDF = id=>{
  const participant = CERT.participants.find(p=>p.id===id);
  if(!CERT.event || !participant){ alert('Select a participant first.'); return; }
  printCertificatePDF(CERT.event, participant);
};

function certificateWhatsAppMessage(participant){
  const link = participant.certificate_url || certificateVerifyURL(participant);
  return `Hello ${participant.name},\n\nThank you for participating in the ${CERT.event.title} webinar.\n\nYour certificate is ready.\nCertificate ID: ${participant.certificate_id}\nDownload PDF: ${link}\n\nRegards,\nTeam Aveti Learning`;
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

async function verifyCertificate(certificateId){
  setCrumb('Certificate verification');
  const id = normalizeText(certificateId);
  if(!id){
    show(`<div class="card pad"><h2 style="font-size:19px">Certificate verification</h2><div class="muted" style="margin-top:8px">No certificate ID found in this link.</div></div>`);
    return;
  }
  try{
    const record = await DB.verifyTrainingCertificate(id);
    if(!record){
      show(`<div class="card pad"><h2 style="font-size:19px">Certificate not found</h2><div class="muted" style="margin-top:8px">No valid Aveti certificate was found for <b>${escapeHTML(id)}</b>.</div></div>`);
      return;
    }
    const event = record.event || {};
    CERT.verifyRecord = record;
    show(`
      <div class="cert-verify-card">
        <img class="brandlogo" alt="Aveti Learning" src="assets/images/aveti-logo.png">
        <div class="pill ok" style="margin-top:14px">Certificate Verified</div>
        <h1>${escapeHTML(record.name)}</h1>
        <div class="muted">${escapeHTML(record.school || '')}</div>
        <div class="cert-verify-grid">
          <div><span>Program</span><b>${escapeHTML(event.title || 'Professional Development Webinar')}</b></div>
          <div><span>Date</span><b>${fmtDate(event.event_date)}</b></div>
          <div><span>PD Hours</span><b>${escapeHTML(event.duration_hours || 1)} Hour${Number(event.duration_hours)===1?'':'s'}</b></div>
          <div><span>Certificate ID</span><b>${escapeHTML(record.certificate_id)}</b></div>
        </div>
        <button class="primary" onclick="downloadVerifiedCertificate()">Download PDF</button>
        <div class="muted small">Issued by ${escapeHTML(event.organizer_name || 'AVETI LEARNING')}</div>
      </div>`);
  }catch(e){
    show(`<div class="card pad"><h2 style="font-size:19px">Verification unavailable</h2><div class="muted" style="margin-top:8px">Could not verify this certificate right now.</div><div class="tiny faint" style="margin-top:8px">${escapeHTML(e.message||e)}</div></div>`);
  }
}

window.downloadVerifiedCertificate = ()=>{
  const record = CERT.verifyRecord;
  if(!record){ alert('Certificate details are not loaded yet.'); return; }
  printCertificatePDF(record.event || {}, record);
};
window.verifyCertificate = verifyCertificate;
window.certificates = certificates;
