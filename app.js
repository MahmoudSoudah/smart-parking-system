// ═══════════════════════════════════════════
//  CONFIG — matches your .env PORT=3000
// ═══════════════════════════════════════════
const API = 'http://localhost:3000';
const DISCOUNT_MIN   = 3;     // 3+ vehicles unlocks discount
const DISCOUNT_RATE  = 0.10;  // 10%

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let currentUser  = null;
let userVehicles = [];
let lotRateMap   = {};   // lot_id -> hourly_rate  (for price preview)

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
window.onload = () => {
  const saved = localStorage.getItem('sp_user');
  if (saved) {
    currentUser = JSON.parse(saved);
    launchApp();
  } else {
    switchPage('login-page');
  }
};

// ═══════════════════════════════════════════
//  DISCOUNT HELPERS
// ═══════════════════════════════════════════
const eligible   = ()      => userVehicles.length >= DISCOUNT_MIN;
const discAmt    = (amt)   => eligible() ? amt * DISCOUNT_RATE : 0;
const finalAmt   = (amt)   => amt - discAmt(amt);

// ═══════════════════════════════════════════
//  AUTH PAGES
// ═══════════════════════════════════════════
function switchPage(id) {
  ['login-page','register-page','user-app','admin-app']
    .forEach(p => document.getElementById(p)?.classList.add('hidden'));
  document.getElementById(id)?.classList.remove('hidden');
}

async function doLogin() {
  const email         = val('l-email');
  const password_hash = val('l-pass');
  if (!email || !password_hash)
    return showMsg('login-msg','err','Please fill in all fields.');
  try {
    const res  = await fetch(`${API}/users/login`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password_hash })
    });
    const data = await res.json();
    if (!res.ok) return showMsg('login-msg','err', data.message || 'Login failed.');
    currentUser = data;
    localStorage.setItem('sp_user', JSON.stringify(currentUser));
    showMsg('login-msg','ok','Login successful!');
    setTimeout(launchApp, 700);
  } catch {
    showMsg('login-msg','err','Cannot connect to server. Make sure it is running on port 3000.');
  }
}

async function doRegister() {
  const full_name     = val('r-name');
  const phone         = val('r-phone');
  const email         = val('r-email');
  const password_hash = val('r-pass');
  const role          = 'user'; // always user — admin accounts created directly in DB

  if (!full_name || !phone || !email || !password_hash)
    return showMsg('reg-msg','err','Please fill in all fields.');

  try {
    const res  = await fetch(`${API}/users/register`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ full_name, email, phone, password_hash, role })
    });
    const data = await res.json();
    if (!res.ok) return showMsg('reg-msg','err', data.message || 'Registration failed.');
    showMsg('reg-msg','ok','Account created! Redirecting to login...');
    setTimeout(() => switchPage('login-page'), 1200);
  } catch {
    showMsg('reg-msg','err','Cannot connect to server.');
  }
}

function doLogout() {
  currentUser  = null;
  userVehicles = [];
  localStorage.removeItem('sp_user');
  switchPage('login-page');
}

// ═══════════════════════════════════════════
//  LAUNCH APP — route by role
// ═══════════════════════════════════════════
function launchApp() {
  ['login-page','register-page','user-app','admin-app']
    .forEach(p => document.getElementById(p)?.classList.add('hidden'));

  const init = (currentUser.full_name || '?')[0].toUpperCase();

  if (currentUser.role === 'admin') {
    show('admin-app');
    setText('a-avatar',   init);
    setText('a-tb-avatar',init);
    setText('a-username', currentUser.full_name || 'Admin');
    setText('a-welcome',  `Admin Panel — ${currentUser.full_name?.split(' ')[0] || ''}`);
    aGoto('dashboard');
  } else {
    show('user-app');
    setText('u-avatar',   init);
    setText('u-tb-avatar',init);
    setText('u-username', currentUser.full_name || 'User');
    setText('u-welcome',  `Welcome back, ${currentUser.full_name?.split(' ')[0] || 'there'} 👋`);
    uGoto('dashboard');
  }
}

// ═══════════════════════════════════════════
//  USER NAVIGATION
// ═══════════════════════════════════════════
const U_TITLES = {
  dashboard:'Dashboard', vehicles:'My Vehicles',
  lots:'Parking Lots',   book:'Book a Slot',
  payments:'Payments',   violations:'Violations'
};

function uGoto(name) {
  document.querySelectorAll('#user-app .pg').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#user-app .sb-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`u-pg-${name}`)?.classList.add('active');
  document.getElementById(`u-nav-${name}`)?.classList.add('active');
  setText('u-tb-title', U_TITLES[name] || name);
  closeSB('user');

  if (name === 'dashboard')  uLoadDashboard();
  if (name === 'vehicles')   uLoadVehicles();
  if (name === 'lots')       uLoadLots();
  if (name === 'book')       uLoadBookPage();
  if (name === 'payments') {
    document.getElementById('receipt-card').style.display = 'none';
    refreshPayDiscount();
  }
  if (name === 'violations') {
    document.getElementById('vio-result-card').style.display = 'none';
  }
}

// ═══════════════════════════════════════════
//  ADMIN NAVIGATION
// ═══════════════════════════════════════════
const A_TITLES = {
  dashboard:'Admin Dashboard', lots:'Manage Lots',
  slots:'Manage Slots',        users:'All Users',
  reports:'Reports',           discounts:'Discount Management'
};

function aGoto(name) {
  document.querySelectorAll('#admin-app .pg').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#admin-app .sb-link').forEach(l => l.classList.remove('active'));
  document.getElementById(`a-pg-${name}`)?.classList.add('active');
  document.getElementById(`a-nav-${name}`)?.classList.add('active');
  setText('a-tb-title', A_TITLES[name] || name);
  closeSB('admin');

  if (name === 'dashboard') aLoadDashboard();
  if (name === 'lots')      aLoadLots();
  if (name === 'slots')     aLoadSlotsPage();
  if (name === 'users')     aLoadUsers();
  if (name === 'reports')   aLoadReports();
  if (name === 'discounts') aLoadDiscounts();
}

// ═══════════════════════════════════════════
//  SIDEBAR MOBILE
// ═══════════════════════════════════════════
function openSB(role) {
  document.getElementById(role==='admin'?'admin-sidebar':'user-sidebar')?.classList.add('open');
  document.getElementById(role==='admin'?'a-overlay':'u-overlay')?.classList.add('show');
}
function closeSB(role) {
  document.getElementById(role==='admin'?'admin-sidebar':'user-sidebar')?.classList.remove('open');
  document.getElementById(role==='admin'?'a-overlay':'u-overlay')?.classList.remove('show');
}

// ═══════════════════════════════════════════
//  USER — DASHBOARD
// ═══════════════════════════════════════════
async function uLoadDashboard() {
  // vehicles
  try {
    const r = await fetch(`${API}/vehicles/user/${currentUser.user_id}`);
    userVehicles = Array.isArray(await r.json()) ? await fetchJSON(`${API}/vehicles/user/${currentUser.user_id}`) : [];
    setText('u-kpi-veh', userVehicles.length);
    updateDiscountUI();
  } catch { setText('u-kpi-veh','–'); }

  // lots + slots
  try {
    const lots = await fetchJSON(`${API}/lots`);
    setText('u-kpi-lots', lots.length);
    lotRateMap = {};
    lots.forEach(l => lotRateMap[l.lot_id] = parseFloat(l.hourly_rate)||0);

    let avail = 0;
    await Promise.all(lots.map(async l => {
      try {
        const slots = await fetchJSON(`${API}/slots/${l.lot_id}`);
        avail += slots.filter(s => s.status === 'available').length;
      } catch {}
    }));
    setText('u-kpi-slots', avail);

    const el = document.getElementById('u-dash-lots');
    el.innerHTML = lots.slice(0,6).map(l => `
      <div class="lot-row">
        <div class="lot-row-ico"><i class="fa fa-parking"></i></div>
        <div>
          <div class="lot-row-name">${esc(l.lot_name)}</div>
          <div class="lot-row-city">${esc(l.city)}</div>
        </div>
        <div class="lot-row-rate">$${parseFloat(l.hourly_rate).toFixed(2)}/hr</div>
      </div>`).join('');
  } catch { setText('u-kpi-lots','–'); }
}

// ═══════════════════════════════════════════
//  DISCOUNT UI SYNC
// ═══════════════════════════════════════════
function updateDiscountUI() {
  const cnt = userVehicles.length;
  const ok  = cnt >= DISCOUNT_MIN;

  // KPI chip
  setText('u-kpi-disc', ok ? '10% OFF' : `${cnt}/${DISCOUNT_MIN} cars`);

  // Dashboard banner
  ok ? show('discount-banner') : hide('discount-banner');

  // Vehicles page progress
  const pct  = Math.min(100, Math.round(cnt / DISCOUNT_MIN * 100));
  const bar  = document.getElementById('dpc-bar');
  if (bar) bar.style.width = pct + '%';
  const txt = document.getElementById('dpc-text');
  if (txt) txt.textContent = ok
    ? `✓ Discount active! You have ${cnt} vehicles.`
    : `${cnt} of ${DISCOUNT_MIN} — add ${DISCOUNT_MIN - cnt} more to unlock.`;
  const badge = document.getElementById('dpc-badge');
  if (badge) {
    badge.className = ok ? 'dpc-badge unlocked' : 'dpc-badge locked';
    badge.innerHTML = ok
      ? '<i class="fa fa-tag"></i><span>10% OFF</span>'
      : '<i class="fa fa-lock"></i><span>10% OFF</span>';
  }
}

function refreshPayDiscount() {
  if (eligible()) show('pay-disc-notice'); else hide('pay-disc-notice');
}

// ═══════════════════════════════════════════
//  USER — VEHICLES
// ═══════════════════════════════════════════
async function uLoadVehicles() {
  const el = document.getElementById('veh-list');
  el.innerHTML = spinHTML();
  try {
    userVehicles = await fetchJSON(`${API}/vehicles/user/${currentUser.user_id}`);
    updateDiscountUI();
    if (!userVehicles.length) { el.innerHTML = emptyHTML('No vehicles yet. Add one!'); return; }
    el.innerHTML = userVehicles.map(v => `
      <div class="veh-item">
        <div class="veh-ico"><i class="fa fa-${v.vehicle_type==='motorcycle'?'motorcycle':v.vehicle_type==='truck'?'truck':'car'}"></i></div>
        <div>
          <div class="veh-plate">${esc(v.plate_number)}${eligible()?'<span class="veh-disc-tag">10% OFF</span>':''}</div>
          <div class="veh-meta">${esc(v.brand||'')} ${esc(v.color||'')} · ${esc(v.vehicle_type)}</div>
        </div>
      </div>`).join('');
  } catch { el.innerHTML = emptyHTML('Could not load vehicles'); }
}

async function addVehicle() {
  const plate_number = val('v-plate');
  const vehicle_type = val('v-type');
  const brand        = val('v-brand');
  const color        = val('v-color');
  if (!plate_number) return showMsg('veh-msg','err','Plate number is required.');
  try {
    const r = await fetch(`${API}/vehicles/add`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ user_id: currentUser.user_id, plate_number, vehicle_type, brand, color })
    });
    const d = await r.json();
    if (!r.ok) return showMsg('veh-msg','err', d.message || 'Failed to add vehicle.');
    showMsg('veh-msg','ok','Vehicle added successfully!');
    clearFields(['v-plate','v-brand','v-color']);
    uLoadVehicles();
  } catch { showMsg('veh-msg','err','Cannot connect to server.'); }
}

// ═══════════════════════════════════════════
//  USER — PARKING LOTS + DRAWER
// ═══════════════════════════════════════════
async function uLoadLots() {
  const el = document.getElementById('lots-grid');
  el.innerHTML = spinHTML();
  try {
    const lots = await fetchJSON(`${API}/lots`);
    if (!lots.length) { el.innerHTML = emptyHTML('No parking lots available'); return; }
    lots.forEach(l => lotRateMap[l.lot_id] = parseFloat(l.hourly_rate)||0);
    el.innerHTML = lots.map(l => `
      <div class="lot-card" onclick="openDrawer(${l.lot_id},'${esc(l.lot_name)}','${esc(l.city)}')">
        <div class="lot-card-img"><i class="fa fa-square-parking"></i></div>
        <div class="lot-card-body">
          <div class="lot-card-name">${esc(l.lot_name)}</div>
          <div class="lot-card-addr"><i class="fa fa-location-dot"></i> ${esc(l.address)}, ${esc(l.city)}</div>
        </div>
        <div class="lot-card-foot">
          <div>
            <div class="lot-rate">$${parseFloat(l.hourly_rate).toFixed(2)}<span>/hr</span></div>
            <div class="lot-slots-count">${l.total_slots} total slots</div>
          </div>
          <button type="button" class="lot-view-btn"
            onclick="event.stopPropagation();openDrawer(${l.lot_id},'${esc(l.lot_name)}','${esc(l.city)}')">
            View Slots
          </button>
        </div>
      </div>`).join('');
  } catch { el.innerHTML = emptyHTML('Could not load lots'); }
}

async function openDrawer(lot_id, name, city) {
  setText('drawer-title', name);
  setText('drawer-sub', city);
  document.getElementById('drawer-bg').classList.remove('hidden');
  document.getElementById('slot-drawer').classList.remove('hidden');

  const grid = document.getElementById('slot-grid');
  grid.innerHTML = spinHTML();
  try {
    const slots = await fetchJSON(`${API}/slots/${lot_id}`);
    if (!slots.length) { grid.innerHTML = emptyHTML('No slots in this lot'); return; }
    const avail = slots.filter(s=>s.status==='available').length;
    const occ   = slots.filter(s=>s.status==='occupied').length;
    const maint = slots.filter(s=>s.status==='maintenance').length;
    document.getElementById('slot-summary').innerHTML = `
      <span class="l-green"><i class="fa fa-circle"></i> ${avail} Available</span>
      <span class="l-red"><i class="fa fa-circle"></i> ${occ} Occupied</span>
      <span class="l-orange"><i class="fa fa-circle"></i> ${maint} Maintenance</span>`;
    grid.innerHTML = slots.map(s => {
      const st  = s.status || 'available';
      const ico = st==='available'?'fa-parking':st==='maintenance'?'fa-wrench':'fa-ban';
      return `<div class="slot-box ${st}" title="Floor ${s.floor_level} · ${s.slot_type}">
        <i class="fa ${ico}"></i>
        <span>${esc(s.slot_number)}</span>
        <span class="slot-type-lbl">${esc(s.slot_type||'')}</span>
      </div>`;
    }).join('');
  } catch { grid.innerHTML = emptyHTML('Could not load slots'); }
}

function closeDrawer() {
  document.getElementById('drawer-bg').classList.add('hidden');
  document.getElementById('slot-drawer').classList.add('hidden');
}

// ═══════════════════════════════════════════
//  USER — BOOK PAGE
// ═══════════════════════════════════════════
async function uLoadBookPage() {
  document.getElementById('booking-done-card').style.display = 'none';
  document.getElementById('price-preview').classList.add('hidden');
  eligible() ? show('book-disc-notice') : hide('book-disc-notice');

  // Default times
  const now   = new Date();
  const later = new Date(now.getTime() + 2 * 3600000);
  document.getElementById('b-start').value = dtLocal(now);
  document.getElementById('b-end').value   = dtLocal(later);

  // Load lots
  try {
    const lots = await fetchJSON(`${API}/lots`);
    lots.forEach(l => lotRateMap[l.lot_id] = parseFloat(l.hourly_rate)||0);
    const sel = document.getElementById('b-lot');
    sel.innerHTML = '<option value="">— Select a parking lot —</option>' +
      lots.map(l => `<option value="${l.lot_id}">${esc(l.lot_name)} · ${esc(l.city)}</option>`).join('');
  } catch { document.getElementById('b-lot').innerHTML = '<option value="">Could not load lots</option>'; }

  // Load vehicles
  try {
    userVehicles = await fetchJSON(`${API}/vehicles/user/${currentUser.user_id}`);
    const sel = document.getElementById('b-vehicle');
    if (!userVehicles.length) {
      sel.innerHTML = '<option value="">No vehicles — please add one first</option>';
    } else {
      sel.innerHTML = userVehicles.map(v =>
        `<option value="${v.vehicle_id}">${esc(v.plate_number)} (${esc(v.vehicle_type)})</option>`
      ).join('');
    }
  } catch { document.getElementById('b-vehicle').innerHTML = '<option value="">Could not load</option>'; }

  document.getElementById('b-slot').innerHTML = '<option value="">— Select a lot first —</option>';
}

async function loadBookSlots() {
  const lot_id = val('b-lot');
  const sel    = document.getElementById('b-slot');
  if (!lot_id) { sel.innerHTML = '<option value="">— Select a lot first —</option>'; return; }
  sel.innerHTML = '<option value="">Loading slots...</option>';
  try {
    const slots  = await fetchJSON(`${API}/slots/${lot_id}`);
    const avail  = slots.filter(s => s.status === 'available');
    if (!avail.length) {
      sel.innerHTML = '<option value="">No available slots in this lot</option>';
    } else {
      sel.innerHTML = '<option value="">— Choose a slot —</option>' +
        avail.map(s =>
          `<option value="${s.slot_id}">Slot ${esc(s.slot_number)} · Floor ${s.floor_level} · ${esc(s.slot_type)}</option>`
        ).join('');
    }
  } catch { sel.innerHTML = '<option value="">Error loading slots</option>'; }
  calcPreview();
}

function calcPreview() {
  const lot_id = val('b-lot');
  const start  = val('b-start');
  const end    = val('b-end');
  const prev   = document.getElementById('price-preview');

  if (!lot_id || !start || !end) { prev.classList.add('hidden'); return; }

  const hrs     = (new Date(end) - new Date(start)) / 3600000;
  if (hrs <= 0) { prev.classList.add('hidden'); return; }

  const rate    = lotRateMap[lot_id] || 0;
  const base    = Math.ceil(hrs) * rate;
  const disc    = discAmt(base);
  const total   = finalAmt(base);

  setText('pp-hrs',  `${Math.ceil(hrs)} hr${Math.ceil(hrs)!==1?'s':''}`);
  setText('pp-rate', `$${rate.toFixed(2)}/hr`);
  setText('pp-total',`$${total.toFixed(2)}`);

  const discRow = document.getElementById('pp-disc-row');
  if (eligible() && disc > 0) {
    discRow.classList.remove('hidden');
    setText('pp-disc', `-$${disc.toFixed(2)}`);
  } else {
    discRow.classList.add('hidden');
  }
  prev.classList.remove('hidden');
}

async function doBook() {
  const slot_id    = val('b-slot');
  const vehicle_id = val('b-vehicle');
  const start_time = val('b-start');
  const end_time   = val('b-end');

  if (!slot_id || !vehicle_id || !start_time || !end_time)
    return showMsg('book-msg','err','Please fill in all fields.');
  if (new Date(end_time) <= new Date(start_time))
    return showMsg('book-msg','err','End time must be after start time.');

  try {
    const r = await fetch(`${API}/reservations/book`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        user_id:    currentUser.user_id,
        slot_id:    parseInt(slot_id),
        vehicle_id: parseInt(vehicle_id),
        start_time, end_time
      })
    });
    const d = await r.json();
    if (!r.ok) return showMsg('book-msg','err', d.message || 'Booking failed.');

    showMsg('book-msg','ok','Booking confirmed!');
    setText('res-id-out', d.reservation_id);
    document.getElementById('p-resid').value = d.reservation_id;

    eligible() ? show('disc-applied-note') : hide('disc-applied-note');
    document.getElementById('booking-done-card').style.display = '';
  } catch { showMsg('book-msg','err','Cannot connect to server.'); }
}

// ═══════════════════════════════════════════
//  USER — PAYMENTS  (with 10% discount)
// ═══════════════════════════════════════════
async function doPayment() {
  const reservation_id = val('p-resid');
  const payment_method = val('p-method');
  if (!reservation_id || !payment_method)
    return showMsg('pay-msg','err','Both fields are required.');

  try {
    const r = await fetch(`${API}/payments/pay`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ reservation_id: parseInt(reservation_id), payment_method })
    });
    const d = await r.json();
    if (!r.ok) return showMsg('pay-msg','err', d.message || 'Payment failed.');

    // Apply discount in frontend
    const orig  = parseFloat(d.amount);
    const disc  = discAmt(orig);
    const paid  = finalAmt(orig);

    showMsg('pay-msg','ok','Payment processed successfully!');
    setText('rec-pid',  d.payment_id);
    setText('rec-hrs',  `${d.hours} hour${d.hours!==1?'s':''}`);
    setText('rec-orig', `$${orig.toFixed(2)}`);
    setText('rec-amt',  `$${paid.toFixed(2)}`);

    const discRow = document.getElementById('rec-disc-row');
    if (eligible() && disc > 0) {
      discRow.classList.remove('hidden');
      setText('rec-disc', `-$${disc.toFixed(2)}`);
    } else {
      discRow.classList.add('hidden');
    }
    document.getElementById('receipt-card').style.display = '';
  } catch { showMsg('pay-msg','err','Cannot connect to server.'); }
}

// ═══════════════════════════════════════════
//  USER — VIOLATIONS
// ═══════════════════════════════════════════
async function doViolation() {
  const reservation_id = val('vi-resid');
  const exit_time      = val('vi-exit');
  if (!reservation_id || !exit_time)
    return showMsg('vio-msg','err','Both fields are required.');

  try {
    const r = await fetch(`${API}/violations/check`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ reservation_id: parseInt(reservation_id), exit_time })
    });
    const d = await r.json();
    if (!r.ok) return showMsg('vio-msg','err', d.message || 'Check failed.');

    const body = document.getElementById('vio-result-body');
    document.getElementById('vio-result-card').style.display = '';

    if (!d.overstay_minutes || d.overstay_minutes <= 0) {
      body.innerHTML = `<div class="vio-clean">
        <i class="fa fa-circle-check"></i>
        <h3>No Violation</h3>
        <p>No overstay fine for this reservation.</p>
      </div>`;
    } else {
      body.innerHTML = `<div style="padding:20px">
        <div style="text-align:center;margin-bottom:14px">
          <i class="fa fa-triangle-exclamation" style="font-size:42px;color:var(--red)"></i>
        </div>
        <div class="fine-rows">
          <div class="fine-row"><span>Reservation</span><span>#${reservation_id}</span></div>
          <div class="fine-row"><span>Overstay</span><span>${d.overstay_minutes} minutes</span></div>
          <div class="fine-row total"><span>Fine Amount</span><span>$${parseFloat(d.fine_amount||0).toFixed(2)}</span></div>
        </div>
      </div>`;
    }
    showMsg('vio-msg','ok','Check complete!');
  } catch { showMsg('vio-msg','err','Cannot connect to server.'); }
}

// ═══════════════════════════════════════════
//  ADMIN — DASHBOARD
// ═══════════════════════════════════════════
async function aLoadDashboard() {
  try {
    const lots = await fetchJSON(`${API}/lots`);
    setText('a-kpi-lots', lots.length);

    let total = 0, avail = 0;
    let html  = '';

    for (const l of lots) {
      try {
        const slots = await fetchJSON(`${API}/slots/${l.lot_id}`);
        total += slots.length;
        avail += slots.filter(s=>s.status==='available').length;
        const occ = slots.filter(s=>s.status==='occupied').length;
        const pct = slots.length ? Math.round(occ/slots.length*100) : 0;
        html += `<div class="occ-item">
          <div class="occ-label">${esc(l.lot_name)}<span>${pct}% occupied</span></div>
          <div class="occ-bar-bg"><div class="occ-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
      } catch {}
    }
    setText('a-kpi-slots', total);
    setText('a-kpi-avail', avail);
    const oc = document.getElementById('a-occupancy');
    oc.innerHTML = html || emptyHTML('No slot data yet');
  } catch { setText('a-kpi-lots','–'); }

  // users count — calls GET /admin/users
  try {
    const r = await fetch(`${API}/admin/users`);
    if (r.ok) { const u = await r.json(); setText('a-kpi-users', u.length); }
    else setText('a-kpi-users', '–');
  } catch { setText('a-kpi-users','–'); }
}

// ═══════════════════════════════════════════
//  ADMIN — MANAGE LOTS  (POST /admin/lots)
// ═══════════════════════════════════════════
async function aLoadLots() {
  const el = document.getElementById('admin-lots-list');
  el.innerHTML = spinHTML();
  try {
    const lots = await fetchJSON(`${API}/lots`);
    if (!lots.length) { el.innerHTML = emptyHTML('No lots yet'); return; }
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>ID</th><th>Name</th><th>City</th><th>Slots</th><th>Rate/hr</th><th>Hours</th></tr></thead>
      <tbody>${lots.map(l=>`
        <tr>
          <td>#${l.lot_id}</td>
          <td><strong>${esc(l.lot_name)}</strong><br><small style="color:var(--muted)">${esc(l.address)}</small></td>
          <td>${esc(l.city)}</td>
          <td>${l.total_slots}</td>
          <td>$${parseFloat(l.hourly_rate).toFixed(2)}</td>
          <td>${esc(l.open_time||'–')} – ${esc(l.close_time||'–')}</td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch { el.innerHTML = emptyHTML('Could not load lots'); }
}

async function adminAddLot() {
  const lot_name    = val('al-name');
  const address     = val('al-addr');
  const city        = val('al-city');
  const total_slots = val('al-slots');
  const hourly_rate = val('al-rate');
  const open_time   = val('al-open')  || '07:00:00';
  const close_time  = val('al-close') || '23:00:00';

  if (!lot_name||!address||!city||!total_slots||!hourly_rate)
    return showMsg('lot-msg','err','All fields are required.');

  try {
    const r = await fetch(`${API}/admin/lots`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        admin_id: currentUser.user_id,
        lot_name, address, city,
        total_slots: parseInt(total_slots),
        hourly_rate: parseFloat(hourly_rate),
        open_time, close_time
      })
    });
    const d = await r.json();
    if (!r.ok) return showMsg('lot-msg','err', d.message || 'Failed.');
    showMsg('lot-msg','ok', `Lot "${lot_name}" added!`);
    clearFields(['al-name','al-addr','al-city','al-slots','al-rate']);
    aLoadLots();
  } catch { showMsg('lot-msg','err','Cannot connect to server.'); }
}

// ═══════════════════════════════════════════
//  ADMIN — MANAGE SLOTS  (POST + PUT /admin/slots)
// ═══════════════════════════════════════════
async function aLoadSlotsPage() {
  try {
    const lots = await fetchJSON(`${API}/lots`);
    const sel  = document.getElementById('as-lot');
    sel.innerHTML = '<option value="">— Select a lot —</option>' +
      lots.map(l => `<option value="${l.lot_id}">${esc(l.lot_name)}</option>`).join('');
  } catch {}
}

async function adminLoadSlots() {
  const lot_id = val('as-lot');
  const el     = document.getElementById('admin-slots-list');
  if (!lot_id) { el.innerHTML = emptyHTML('Select a lot first'); return; }
  el.innerHTML = spinHTML();
  try {
    const slots = await fetchJSON(`${API}/slots/${lot_id}`);
    if (!slots.length) { el.innerHTML = emptyHTML('No slots in this lot'); return; }
    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>ID</th><th>Number</th><th>Floor</th><th>Type</th><th>Status</th><th>Change Status</th></tr></thead>
      <tbody>${slots.map(s=>`
        <tr>
          <td>#${s.slot_id}</td>
          <td><strong>${esc(s.slot_number)}</strong></td>
          <td>Floor ${s.floor_level}</td>
          <td>${esc(s.slot_type)}</td>
          <td><span class="status-badge ${s.status}">${esc(s.status)}</span></td>
          <td>
            <select class="mini-select" onchange="adminUpdateSlot(${s.slot_id}, this.value)">
              <option value="">— Change —</option>
              <option value="available">✅ Available</option>
              <option value="occupied">🔴 Occupied</option>
              <option value="maintenance">🔧 Maintenance</option>
            </select>
          </td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch { el.innerHTML = emptyHTML('Could not load slots'); }
}

async function adminAddSlot() {
  const lot_id      = val('as-lot');
  const slot_number = val('as-num');
  const floor_level = val('as-floor') || '1';
  const slot_type   = val('as-type');

  if (!lot_id || !slot_number)
    return showMsg('slot-msg','err','Select a lot and enter a slot number.');

  try {
    const r = await fetch(`${API}/admin/slots`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        lot_id: parseInt(lot_id),
        slot_number,
        floor_level: parseInt(floor_level),
        slot_type
      })
    });
    const d = await r.json();
    if (!r.ok) return showMsg('slot-msg','err', d.message || 'Failed.');
    showMsg('slot-msg','ok', `Slot ${slot_number} added!`);
    clearFields(['as-num']);
    adminLoadSlots();
  } catch { showMsg('slot-msg','err','Cannot connect to server.'); }
}

async function adminUpdateSlot(slot_id, status) {
  if (!status) return;
  try {
    const r = await fetch(`${API}/admin/slots/${slot_id}/status`, {
      method:'PUT',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ status })
    });
    if (r.ok) adminLoadSlots();
    else { const d = await r.json(); alert(d.message || 'Failed to update'); }
  } catch { alert('Cannot connect to server'); }
}

// ═══════════════════════════════════════════
//  ADMIN — ALL USERS  (GET /admin/users)
// ═══════════════════════════════════════════
async function aLoadUsers() {
  const el = document.getElementById('admin-users-list');
  el.innerHTML = spinHTML();
  try {
    const r = await fetch(`${API}/admin/users`);
    if (!r.ok) {
      el.innerHTML = emptyHTML('GET /admin/users not found. Make sure routes_admin.js is added to your server.');
      return;
    }
    const users = await r.json();
    if (!users.length) { el.innerHTML = emptyHTML('No users registered yet'); return; }

    // Get vehicle counts for all users to mark discount eligibility
    const vCounts = {};
    await Promise.all(users.map(async u => {
      try {
        const vr = await fetch(`${API}/vehicles/user/${u.user_id}`);
        if (vr.ok) { const vd = await vr.json(); vCounts[u.user_id] = vd.length; }
        else vCounts[u.user_id] = 0;
      } catch { vCounts[u.user_id] = 0; }
    }));

    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Vehicles</th><th>Discount</th><th>Joined</th></tr></thead>
      <tbody>${users.map(u => {
        const vc  = vCounts[u.user_id] || 0;
        const ok  = vc >= DISCOUNT_MIN;
        return `<tr>
          <td>#${u.user_id}</td>
          <td><strong>${esc(u.full_name)}</strong></td>
          <td>${esc(u.email)}</td>
          <td>${esc(u.phone||'–')}</td>
          <td><span class="role-badge-tbl ${u.role}">${esc(u.role)}</span></td>
          <td style="font-weight:700;color:${vc>=DISCOUNT_MIN?'var(--gold)':'var(--muted)'}">${vc}</td>
          <td>${ok?'<span class="disc-user-tag">🏷️ 10% OFF</span>':'<span style="color:var(--muted);font-size:12px">–</span>'}</td>
          <td>${u.created_at?new Date(u.created_at).toLocaleDateString():'–'}</td>
        </tr>`;
      }).join('')}
      </tbody></table>`;
  } catch { el.innerHTML = emptyHTML('Could not load users'); }
}

// ═══════════════════════════════════════════
//  ADMIN — REPORTS
// ═══════════════════════════════════════════
async function aLoadReports() {
  const el = document.getElementById('admin-reports-body');
  el.innerHTML = spinHTML();
  try {
    const lots = await fetchJSON(`${API}/lots`);
    let html = '';
    for (const l of lots) {
      try {
        const slots = await fetchJSON(`${API}/slots/${l.lot_id}`);
        const avail = slots.filter(s=>s.status==='available').length;
        const occ   = slots.filter(s=>s.status==='occupied').length;
        const maint = slots.filter(s=>s.status==='maintenance').length;
        const pct   = slots.length ? Math.round(occ/slots.length*100) : 0;
        html += `<div class="report-card">
          <div class="report-head">
            <div>
              <div class="report-name">${esc(l.lot_name)}</div>
              <div class="report-city">${esc(l.city)} · $${parseFloat(l.hourly_rate).toFixed(2)}/hr</div>
            </div>
            <div class="report-pct">${pct}% occupied</div>
          </div>
          <div class="report-bar-bg">
            <div class="report-bar-fill" style="width:${pct}%"></div>
          </div>
          <div class="report-stats">
            <span class="rs g"><i class="fa fa-circle"></i>${avail} Available</span>
            <span class="rs r"><i class="fa fa-circle"></i>${occ} Occupied</span>
            <span class="rs o"><i class="fa fa-circle"></i>${maint} Maintenance</span>
            <span class="rs m"><i class="fa fa-layer-group"></i>${slots.length} Total</span>
          </div>
        </div>`;
      } catch {}
    }
    el.innerHTML = html || emptyHTML('No data');
  } catch { el.innerHTML = emptyHTML('Could not load'); }
}

// ═══════════════════════════════════════════
//  ADMIN — DISCOUNTS  (shows eligible users)
// ═══════════════════════════════════════════
async function aLoadDiscounts() {
  const el = document.getElementById('disc-eligible-list');
  el.innerHTML = spinHTML();
  try {
    const r = await fetch(`${API}/admin/users`);
    if (!r.ok) {
      el.innerHTML = emptyHTML('GET /admin/users not found. Add routes_admin.js to your server.');
      return;
    }
    const users = await r.json();
    const eligible_users = [];

    await Promise.all(users.map(async u => {
      try {
        const vr = await fetch(`${API}/vehicles/user/${u.user_id}`);
        if (vr.ok) {
          const vd = await vr.json();
          if (vd.length >= DISCOUNT_MIN) {
            eligible_users.push({ ...u, vCount: vd.length, vehicles: vd });
          }
        }
      } catch {}
    }));

    if (!eligible_users.length) {
      el.innerHTML = emptyHTML('No users qualify yet — need 3+ vehicles registered.');
      return;
    }

    el.innerHTML = `<table class="admin-table">
      <thead><tr><th>User</th><th>Email</th><th>Vehicles</th><th>Plates</th><th>Discount</th></tr></thead>
      <tbody>${eligible_users.map(u=>`
        <tr>
          <td><strong>${esc(u.full_name)}</strong><br><small>#${u.user_id}</small></td>
          <td>${esc(u.email)}</td>
          <td style="font-weight:800;color:var(--gold);font-size:16px">${u.vCount}</td>
          <td>${u.vehicles.map(v=>`<span style="background:var(--bg3);border:1px solid var(--border);border-radius:4px;padding:2px 7px;font-size:11px;margin:2px;display:inline-block;font-family:monospace">${esc(v.plate_number)}</span>`).join('')}</td>
          <td><span class="disc-user-tag" style="font-size:13px;padding:4px 12px">🏷️ 10% OFF</span></td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch { el.innerHTML = emptyHTML('Could not load'); }
}

// ═══════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════
async function fetchJSON(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
function val(id)         { return (document.getElementById(id)?.value || '').trim(); }
function setText(id, t)  { const e=document.getElementById(id); if(e) e.textContent=t; }
function show(id)        { document.getElementById(id)?.classList.remove('hidden'); }
function hide(id)        { document.getElementById(id)?.classList.add('hidden'); }
function esc(s)          { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function clearFields(ids){ ids.forEach(id=>{const e=document.getElementById(id);if(e)e.value='';}); }
function spinHTML()      { return `<div class="spin-wrap"><div class="spin"></div></div>`; }
function emptyHTML(m)    { return `<div class="empty"><i class="fa fa-inbox"></i><p>${m}</p></div>`; }
function dtLocal(d) {
  const p = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function showMsg(id, type, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = `msg-box ${type}`;
  el.innerHTML = `<i class="fa ${type==='ok'?'fa-circle-check':'fa-circle-exclamation'}"></i> ${msg}`;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 5000);
}