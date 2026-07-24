/* ---------- MASTER CENTRE ADMIN ---------- */
async function centreAdmin(){
  if(ACCESS_ROLE!=='master_admin'){ home(); return; }
  setCrumb('Centre admin');
  const centres=await DB.listAccessibleCentres();
  const loginMap=await DB.listAllCentreLogins().catch(()=>({}));
  const cards=centres.map(c=>`
    <div class="card pad centre-admin-card">
      <div class="row between" style="gap:10px;align-items:flex-start">
        <div class="centre-admin-title">${c.logo_url?`<img class="centre-card-logo" src="${c.logo_url}" alt="${c.name} logo">`:''}<div><h3>${c.name}</h3><div class="small muted">${c.address||'No address'}${c.phone?' · '+c.phone:''}${c.email?' · '+c.email:''}</div>${c.centre_head_name?`<div class="tiny muted">Centre head: ${c.centre_head_name}</div>`:''}</div></div>
        <span class="status-pill ${c.archived_at||c.status==='archived'?'archived':'active'}">${c.archived_at||c.status==='archived'?'Archived':'Active'}</span>
      </div>
      <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
        ${c.archived_at||c.status==='archived'
          ? `<button onclick="restoreCentre('${c.id}')">Restore centre</button><button onclick="permanentlyDeleteCentre('${c.id}')" style="color:var(--red)">Permanently delete</button>`
          : `<button class="primary" onclick="switchCentre('${c.id}')">Open centre</button><button onclick="editCentre('${c.id}')">Edit centre</button><button onclick="archiveCentre('${c.id}')">Archive centre</button>`}
      </div>
      ${(loginMap[c.id]||[]).map(login=>`<div class="centre-login-row"><div><b>${login.email}</b><span class="tiny muted"> · ${login.active?'Active':'Disabled'}</span><div class="tiny muted">Password hidden for security</div></div><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end"><button onclick="resetCentreLoginPassword('${c.id}','${login.user_id}')">Set new password</button><button onclick="setCentreLoginStatus('${c.id}','${login.user_id}',${!login.active})">${login.active?'Disable':'Enable'}</button></div></div>`).join('')}
    </div>`).join('');
  show(`
    <div class="row between" style="margin-bottom:16px;gap:12px;flex-wrap:wrap"><div><div class="eyebrow">Master workspace</div><h2>Tuition centres</h2><div class="muted small">You control all centres. Centre Admin access is limited to one centre.</div></div></div>
    <div class="centre-admin-grid">${cards||'<div class="card pad">No centres yet.</div>'}</div>
    <div id="centreEditPanel"></div>
    <div class="card pad" style="margin-top:16px">
      <h3>Create a centre</h3><div class="muted small" style="margin:4px 0 14px">Existing data remains in its current centre.</div>
      <div class="wrap-fields"><div class="field"><label>Name</label><input id="newCentreName" placeholder="Aveti Tuition Centre 2"></div><div class="field"><label>Address</label><input id="newCentreAddress" placeholder="Centre address"></div><div class="field"><label>Phone</label><input id="newCentrePhone" placeholder="Phone"></div><div class="field"><label>Email</label><input id="newCentreEmail" type="email" placeholder="centre@example.com"></div><div class="field"><label>Centre head (optional)</label><input id="newCentreHead" placeholder="Name"></div><button class="primary" onclick="createCentreFromAdmin()">Create centre</button></div>
    </div>
    <div class="card pad" style="margin-top:16px">
      <h3>Shared Centre Admin login</h3><div class="muted small" style="margin:4px 0 14px">Creates one login for the selected centre. Do not reuse your Master Admin credentials.</div>
      <div class="wrap-fields"><div class="field"><label>Centre</label><select id="loginCentre">${centres.filter(c=>!c.archived_at&&c.status!=='archived').map(c=>`<option value="${c.id}">${c.name}</option>`).join('')}</select></div><div class="field"><label>Email / login ID</label><input id="centreLoginEmail" type="email" placeholder="centre1@aveti.org"></div><div class="field"><label>Temporary password</label><input id="centreLoginPassword" type="password" placeholder="Minimum 8 characters"></div><button class="primary" onclick="createCentreLoginFromAdmin()">Create login</button></div>
      <div id="centreAdminState" class="tiny muted" style="margin-top:8px"></div>
    </div>`);
}
window.createCentreFromAdmin=async()=>{
  const name=document.getElementById('newCentreName')?.value.trim();
  if(!name){alert('Enter a centre name.');return;}
  try{
    await DB.createCentre({name,address:document.getElementById('newCentreAddress')?.value.trim()||'',phone:document.getElementById('newCentrePhone')?.value.trim()||'',email:document.getElementById('newCentreEmail')?.value.trim()||'',centre_head_name:document.getElementById('newCentreHead')?.value.trim()||'',band_config:CONFIG.BANDS});
    await centreAdmin();
  }catch(e){alert(e.message||'Centre could not be created.');}
};
window.archiveCentre=async id=>{
  const c=ACCESS_CENTRES.find(x=>x.id===id);
  if(!c||!confirm(`Archive ${c.name}? Its data will be hidden but recoverable.`)) return;
  try{await DB.updateCentre(id,{status:'archived',archived_at:new Date().toISOString()});await centreAdmin();}catch(e){alert(e.message||'Centre could not be archived.');}
};
window.editCentre=async id=>{
  const c=ACCESS_CENTRES.find(x=>x.id===id);
  if(!c) return;
  const panel=document.getElementById('centreEditPanel');
  if(!panel) return;
  panel.innerHTML=`<div class="card pad centre-edit-panel"><div class="row between" style="gap:12px"><div><h3>Edit ${c.name}</h3><div class="small muted">These details appear on the centre’s reports.</div></div><button onclick="closeCentreEditor()">Close</button></div><div class="centre-branding-form"><div class="centre-logo-editor"><img id="centreLogoPreview" class="centre-logo-preview" src="${c.logo_url||'assets/images/aveti-logo.png'}" alt="Logo preview"><div><label class="small">Organisation logo</label><input id="editCentreLogo" type="file" accept="image/png,image/jpeg,image/webp" onchange="previewCentreLogo(this)"><div class="tiny muted">PNG, JPG, or WebP · maximum 2 MB</div>${c.logo_url?'<button type="button" class="tiny-button" onclick="removeCentreLogo()">Use Aveti default logo</button>':''}</div></div><div class="wrap-fields"><div class="field"><label>Name</label><input id="editCentreName" value="${c.name||''}"></div><div class="field"><label>Address</label><input id="editCentreAddress" value="${c.address||''}"></div><div class="field"><label>Phone</label><input id="editCentrePhone" value="${c.phone||''}"></div><div class="field"><label>Email</label><input id="editCentreEmail" type="email" value="${c.email||''}"></div><div class="field"><label>Centre head (optional)</label><input id="editCentreHead" value="${c.centre_head_name||''}"></div></div><input id="removeCentreLogo" type="hidden" value="false"><div class="row" style="justify-content:flex-end;margin-top:14px"><button class="primary" onclick="saveCentreDetails('${id}')">Save centre details</button></div></div></div>`;
  panel.scrollIntoView({behavior:'smooth',block:'start'});
};
window.closeCentreEditor=()=>{const panel=document.getElementById('centreEditPanel');if(panel)panel.innerHTML='';};
window.previewCentreLogo=input=>{const file=input.files?.[0];if(!file)return;const preview=document.getElementById('centreLogoPreview');if(preview)preview.src=URL.createObjectURL(file);document.getElementById('removeCentreLogo').value='false';};
window.removeCentreLogo=()=>{const preview=document.getElementById('centreLogoPreview');if(preview)preview.src='assets/images/aveti-logo.png';document.getElementById('editCentreLogo').value='';document.getElementById('removeCentreLogo').value='true';};
window.saveCentreDetails=async id=>{
  const name=document.getElementById('editCentreName')?.value.trim();
  if(!name){alert('Centre name cannot be empty.');return;}
  const button=event?.currentTarget;if(button)button.disabled=true;
  try{
    let logo_url;
    const file=document.getElementById('editCentreLogo')?.files?.[0];
    if(file) logo_url=await DB.uploadCentreLogo(id,file);
    else if(document.getElementById('removeCentreLogo')?.value==='true') logo_url='';
    const patch={name,address:document.getElementById('editCentreAddress')?.value.trim()||'',phone:document.getElementById('editCentrePhone')?.value.trim()||'',email:document.getElementById('editCentreEmail')?.value.trim()||'',centre_head_name:document.getElementById('editCentreHead')?.value.trim()||''};
    if(logo_url!==undefined) patch.logo_url=logo_url;
    await DB.updateCentre(id,patch);await centreAdmin();
  }catch(e){alert(e.message||'Centre details could not be updated.');if(button)button.disabled=false;}
};
window.restoreCentre=async id=>{
  try{await DB.updateCentre(id,{status:'active',archived_at:null});await centreAdmin();}catch(e){alert(e.message||'Centre could not be restored.');}
};
window.permanentlyDeleteCentre=async id=>{
  const c=ACCESS_CENTRES.find(x=>x.id===id);
  if(!c||!confirm(`Permanently delete ${c.name} and all of its data? This cannot be undone.`)) return;
  if(!confirm('Final confirmation: permanently delete this centre and all students, tests, marks, chapters, and centre records?')) return;
  try{await DB.deleteCentre(id);localStorage.removeItem('aveti_active_centre');await centreAdmin();}catch(e){alert(e.message||'Centre could not be deleted.');}
};
window.createCentreLoginFromAdmin=async()=>{
  const state=document.getElementById('centreAdminState');
  const centreId=document.getElementById('loginCentre')?.value;
  const email=document.getElementById('centreLoginEmail')?.value.trim();
  const password=document.getElementById('centreLoginPassword')?.value;
  if(!centreId||!email||!password){state.textContent='Enter a centre, email, and password.';return;}
  state.textContent='Creating login…';
  try{await DB.createCentreAdminLogin(centreId,email,password);state.textContent='Centre Admin login created. Share the credentials securely.';}
  catch(e){state.textContent=e.message||'Login could not be created.';}
};
window.setCentreLoginStatus=async(centreId,userId,active)=>{
  try{await DB.setCentreLoginStatus(centreId,userId,active);await centreAdmin();}
  catch(e){alert(e.message||'Login status could not be changed.');}
};
window.resetCentreLoginPassword=async(centreId,userId)=>{
  const password=prompt('Enter a new temporary password (minimum 8 characters). It will be shown once after saving:');
  if(password===null) return;
  if(password.length<8){alert('Password must be at least 8 characters.');return;}
  try{
    await DB.resetCentreLoginPassword(centreId,userId,password);
    alert(`New temporary password:\n\n${password}\n\nShare it securely. It will not be shown again here.`);
  }catch(e){alert(e.message||'Password could not be changed.');}
};
window.centreAdmin=centreAdmin;
