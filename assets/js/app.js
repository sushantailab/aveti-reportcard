/* ---------- modal + nav wiring ---------- */
document.getElementById('saveDone').onclick=e=>{e.preventDefault();document.getElementById('saveOverlay').classList.remove('show');home();};
document.getElementById('saveToParents').onclick=()=>{document.getElementById('saveOverlay').classList.remove('show');openParents(CURRENT_TEST);};
document.getElementById('saveToTeacher').onclick=()=>{document.getElementById('saveOverlay').classList.remove('show');openTeacher(CURRENT_TEST);};
document.getElementById('saveToGrowth').onclick=()=>{document.getElementById('saveOverlay').classList.remove('show');growth();};
document.getElementById('navHome').onclick=home;
document.getElementById('navRoster').onclick=roster;
window.openTeacher=openTeacher; window.openParents=openParents; window.growth=growth; window.classInsights=classInsights; window.enterMarks=enterMarks;

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

async function ensureCentre(){
  let { data } = await supa.from('centres').select('id,name,address,phone,band_config,owner_user_id').limit(1);
  if (data && data.length){
    CENTRE_ID = data[0].id;
    if(Array.isArray(data[0].band_config) && data[0].band_config.length) CONFIG.BANDS = data[0].band_config;
    return;
  }
  const { data:created, error } = await supa.from('centres')
    .insert({ name:CONFIG.CENTRE.name, address:CONFIG.CENTRE.address, phone:CONFIG.CENTRE.phone, band_config:CONFIG.BANDS })
    .select('id,name,address,phone,band_config,owner_user_id').single();
  if (error) throw error;
  CENTRE_ID = created.id;
}

async function afterLogin(){
  loginOverlay.classList.remove('show');
  document.getElementById('navSignout').style.display='';
  try { const {data:{user}} = await supa.auth.getUser(); CURRENT_USER_ID = user?.id || 'unknown-user'; } catch(e){}
  try { await ensureCentre(); } catch(e){ /* RLS/setup issue surfaces on first action */ }
  home();
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

document.getElementById('navSignout').onclick = async ()=>{
  if(supa){ await supa.auth.signOut(); }
  location.reload();
};

async function init(){
  if(!CONFIG.USE_SUPABASE){ home(); return; }          // demo mode: no login
  renderAuthMode();
  const { data:{ session } } = await supa.auth.getSession();
  if(session){ await afterLogin(); }
  else { loginOverlay.classList.add('show'); }
}

init();
