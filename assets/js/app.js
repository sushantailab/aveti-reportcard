/* ---------- modal + nav wiring ---------- */
const closeSaveOverlay = ()=>document.getElementById('saveOverlay')?.classList.remove('show');
window.closeSaveOverlay = closeSaveOverlay;
document.getElementById('saveClose').onclick=closeSaveOverlay;
document.getElementById('saveDone').onclick=e=>{e.preventDefault();document.getElementById('saveOverlay').classList.remove('show');home();};
document.getElementById('saveToParents').onclick=()=>{closeSaveOverlay();openParents(CURRENT_TEST);};
document.getElementById('saveToTeacher').onclick=()=>{closeSaveOverlay();openTeacher(CURRENT_TEST);};
document.getElementById('saveToTeacherWhatsApp').onclick=()=>{closeSaveOverlay();shareTeacherReport(CURRENT_TEST);};
document.getElementById('saveToGrowth').onclick=()=>{closeSaveOverlay();growth();};
const navHome = document.getElementById('navHome');
const navRoster = document.getElementById('navRoster');
if(navHome) navHome.onclick=home;
if(navRoster) navRoster.onclick=roster;
window.openTeacher=openTeacher; window.openParents=openParents; window.growth=growth; window.classInsights=classInsights; window.certificates=certificates; window.monthlyReport=monthlyReport; window.teacherActivation=teacherActivation; window.enterMarks=enterMarks; window.teachers=teachers;
window.appNavigate = route => {
  const target = ({home,marks:enterMarks,students:roster,teachers,'centre-admin':centreAdmin,teacher:openTeacher,parent:openParents,growth,insights:classInsights,certificates,'monthly-report':monthlyReport,activation:teacherActivation}[route]||home);
  localStorage.setItem('aveti:last-route',route);
  if(typeof window.setActiveRoute === 'function') window.setActiveRoute(route);
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
const loginOverlay = document.getElementById('loginOverlay');
const authErr = el => document.getElementById('authErr').textContent = el;

/* Phase 0 fix (docs/ARCHITECTURE.md §7, item 6): public self-signup is closed.
   A centre login is created only by the Master Admin, from Centres → Shared Centre
   Admin login (assets/js/features/centre-admin.js), which uses the admin-centre
   Supabase Edge Function under the service-role key. This screen only signs in.
   This is a client-side convenience, not the security boundary — "Allow new users
   to sign up" must also be turned off for Email in the Supabase Auth dashboard,
   since a request straight to the API bypasses this file entirely. */
function renderAuthMode(){
  document.getElementById('loginTitle').textContent = 'Sign in';
  document.getElementById('authSubmit').textContent = 'Sign in';
  document.getElementById('authToggle').style.display = 'none';
  document.getElementById('authPass').setAttribute('autocomplete', 'current-password');
  authErr('');
}

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
  document.body.classList.add('is-authenticated');
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
  const { error } = await supa.auth.signInWithPassword({ email, password });
  if(error){ authErr(error.message); return; }
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
