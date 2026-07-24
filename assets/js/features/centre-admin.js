/* ---------- MASTER CENTRE ADMIN ---------- */
async function centreAdmin(){
  if(ACCESS_ROLE!=='master_admin'){ home(); return; }
  setCrumb('Centre admin');
  const centres=await DB.listAccessibleCentres();
  const loginLists=await Promise.all(centres.map(async c=>[c.id,await DB.listCentreLogins(c.id).catch(()=>[])]));
  const loginMap=Object.fromEntries(loginLists);
  const cards=centres.map(c=>`
    <div class="card pad centre-admin-card">
      <div class="row between" style="gap:10px;align-items:flex-start">
        <div><h3>${c.name}</h3><div class="small muted">${c.address||'No address'}${c.phone?' · '+c.phone:''}</div></div>
        <span class="status-pill ${c.archived_at||c.status==='archived'?'archived':'active'}">${c.archived_at||c.status==='archived'?'Archived':'Active'}</span>
      </div>
      <div class="row" style="margin-top:14px;gap:8px;flex-wrap:wrap">
        ${c.archived_at||c.status==='archived'
          ? `<button onclick="restoreCentre('${c.id}')">Restore centre</button><button onclick="permanentlyDeleteCentre('${c.id}')" style="color:var(--red)">Permanently delete</button>`
          : `<button class="primary" onclick="switchCentre('${c.id}')">Open centre</button><button onclick="archiveCentre('${c.id}')">Archive centre</button>`}
      </div>
      ${(loginMap[c.id]||[]).map(login=>`<div class="centre-login-row"><div><b>${login.email}</b><span class="tiny muted"> · ${login.active?'Active':'Disabled'}</span><div class="tiny muted">Password hidden for security</div></div><div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end"><button onclick="resetCentreLoginPassword('${c.id}','${login.user_id}')">Set new password</button><button onclick="setCentreLoginStatus('${c.id}','${login.user_id}',${!login.active})">${login.active?'Disable':'Enable'}</button></div></div>`).join('')}
    </div>`).join('');
  show(`
    <div class="row between" style="margin-bottom:16px;gap:12px;flex-wrap:wrap"><div><div class="eyebrow">Master workspace</div><h2>Tuition centres</h2><div class="muted small">You control all centres. Centre Admin access is limited to one centre.</div></div></div>
    <div class="centre-admin-grid">${cards||'<div class="card pad">No centres yet.</div>'}</div>
    <div class="card pad" style="margin-top:16px">
      <h3>Create a centre</h3><div class="muted small" style="margin:4px 0 14px">Existing data remains in its current centre.</div>
      <div class="wrap-fields"><div class="field"><label>Name</label><input id="newCentreName" placeholder="Aveti Tuition Centre 2"></div><div class="field"><label>Address</label><input id="newCentreAddress" placeholder="Centre address"></div><div class="field"><label>Phone</label><input id="newCentrePhone" placeholder="Phone"></div><button class="primary" onclick="createCentreFromAdmin()">Create centre</button></div>
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
    await DB.createCentre({name,address:document.getElementById('newCentreAddress')?.value.trim()||'',phone:document.getElementById('newCentrePhone')?.value.trim()||'',band_config:CONFIG.BANDS});
    await centreAdmin();
  }catch(e){alert(e.message||'Centre could not be created.');}
};
window.archiveCentre=async id=>{
  const c=ACCESS_CENTRES.find(x=>x.id===id);
  if(!c||!confirm(`Archive ${c.name}? Its data will be hidden but recoverable.`)) return;
  try{await DB.updateCentre(id,{status:'archived',archived_at:new Date().toISOString()});await centreAdmin();}catch(e){alert(e.message||'Centre could not be archived.');}
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
