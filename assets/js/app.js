/* ---------- modal + nav wiring ---------- */
document.getElementById('saveDone').onclick=e=>{e.preventDefault();document.getElementById('saveOverlay').classList.remove('show');home();};
document.getElementById('saveToParents').onclick=()=>{document.getElementById('saveOverlay').classList.remove('show');openParents(CURRENT_TEST);};
document.getElementById('saveToTeacher').onclick=()=>{document.getElementById('saveOverlay').classList.remove('show');openTeacher(CURRENT_TEST);};
document.getElementById('saveToGrowth').onclick=()=>{document.getElementById('saveOverlay').classList.remove('show');growth();};
document.getElementById('navHome').onclick=home;
document.getElementById('navRoster').onclick=roster;
window.openTeacher=openTeacher; window.openParents=openParents; window.growth=growth; window.classInsights=classInsights; window.certificates=certificates; window.teacherActivation=teacherActivation; window.enterMarks=enterMarks;
window.appNavigate = route => {
  const target = ({home,marks:enterMarks,students:roster,'centre-admin':centreAdmin,teacher:openTeacher,parent:openParents,growth,insights:classInsights,certificates,activation:teacherActivation}[route]||home);
  localStorage.setItem('aveti:last-route',route);
  return target();
};
window.toggleSidebar = ()=>document.querySelector('.app-shell')?.classList.toggle('sidebar-collapsed');
window.toggleMoreMenu = ()=>{
  const menu=document.getElementById('moreMenu');
  if(!menu) return;
  const open=menu.classList.toggle('show');
  menu.setAttribute('aria-hidden',String(!open));
};

/* =============================================================
   AUTH (Supabase email/password). Demo mode skips login entirely.
   ============================================================= */
let AUTH_MODE = 'signin';
const loginOverlay = document.getElementById('loginOverlay');
const authErr = el => document.getElementById('authErr').textContent = el;

function renderAuthMode(){
  document.getElementById('loginTitle').textContent = AUTH_MODE==='signin' ? 'Sign in' : 'Create an account';
  document.getElementById('authSubmit').textContent = AUTH_MODE==='signin' ? 'Sign in' : 'Create account';
  document.getElementById('authToggle').textContent = AUTH_MODE==='signin' ? 'New centre? Create an account' : 'Have an account? Sign in';
  document.getElementById('authPass').setAttribute('autocomplete', AUTH_MODE==='signin'?'current-password':'new-password');
  authErr('');
}
document.getElementById('authToggle').onclick = e=>{ e.preventDefault(); AUTH_MODE = AUTH_MODE==='signin'?'signup':'signin'; renderAuthMode(); };

async function loadAccessContext(){
  const centres = await DB.listAccessibleCentres();
  if(!centres.length) throw new Error('This login has not been assigned to a tuition centre yet. Ask the Master Admin to create access.');
  ACCESS_CENTRES = centres;
  const active = centres.filter(c=>!c.archived_at && c.status!=='archived');
  if(!active.length) throw new Error('All centres assigned to this login are archived.');
  const saved = localStorage.getItem('aveti_active_centre');
  const selected = active.find(c=>c.id===saved) || active[0];
  CENTRE_ID = selected.id;
  localStorage.setItem('aveti_active_centre',CENTRE_ID);
  CONFIG.CENTRE = {...CONFIG.CENTRE,...selected,name:displayCentreName(selected.name)};
  if(Array.isArray(selected.band_config) && selected.band_config.length) CONFIG.BANDS = selected.band_config;
  renderAccessChrome();
}

function renderAccessChrome(){
  const host=document.getElementById('centreSwitcher');
  if(host){
    host.innerHTML=ACCESS_CENTRES.length>1
      ? `<label class="centre-switcher"><span class="tiny muted">Centre</span><select onchange="switchCentre(this.value)">${ACCESS_CENTRES.filter(c=>!c.archived_at&&c.status!=='archived').map(c=>`<option value="${c.id}" ${c.id===CENTRE_ID?'selected':''}>${displayCentreName(c.name)}</option>`).join('')}</select></label>`
      : `<span class="centre-name small">${CONFIG.CENTRE.name}</span>`;
  }
  document.querySelectorAll('[data-master-only]').forEach(el=>{el.style.display=ACCESS_ROLE==='master_admin'?'':'none';});
}
window.switchCentre = id=>{
  if(!ACCESS_CENTRES.some(c=>c.id===id)) return;
  localStorage.setItem('aveti_active_centre',id);
  location.reload();
}

async function afterLogin(){
  loginOverlay.classList.remove('show');
  document.querySelectorAll('[data-signout]').forEach(el=>el.style.display='');
  try { const {data:{user}} = await supa.auth.getUser(); CURRENT_USER_ID = user?.id || 'unknown-user'; } catch(e){}
  try {
    await loadAccessContext();
    const savedRoute=localStorage.getItem('aveti:last-route')||'home';
    window.appNavigate(savedRoute);
  }
  catch(e){ loginOverlay.classList.add('show'); authErr(e.message||'Unable to load centre access.'); }
}

document.getElementById('authSubmit').onclick = async ()=>{
  const email = document.getElementById('authEmail').value.trim();
  const password = document.getElementById('authPass').value;
  if(!email || !password){ authErr('Enter email and password.'); return; }
  authErr('');
  const fn = AUTH_MODE==='signup'
    ? supa.auth.signUp({ email, password })
    : supa.auth.signInWithPassword({ email, password });
  const { data, error } = await fn;
  if(error){ authErr(error.message); return; }
  if(AUTH_MODE==='signup' && !data.session){
    authErr('Account created — check your email to confirm, then sign in.');
    AUTH_MODE='signin'; renderAuthMode();
    return;
  }
  await afterLogin();
};

document.querySelectorAll('[data-signout]').forEach(button=>button.onclick = async ()=>{
  if(supa){ await supa.auth.signOut(); }
  location.reload();
});

async function init(){
  const verifyId = new URLSearchParams(location.search).get('verify');
  if(verifyId){ await verifyCertificate(verifyId); return; }
  if(!CONFIG.USE_SUPABASE){ home(); return; }          // demo mode: no login
  renderAuthMode();
  const { data:{ session } } = await supa.auth.getSession();
  if(session){ await afterLogin(); }
  else { loginOverlay.classList.add('show'); }
}

init();
