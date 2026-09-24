// ============================================================
//  js/settings.js — หน้า "ตั้งค่าสิทธิ์" (เฉพาะ Admin)
// ============================================================
//  คุยกับ Auth.gs ตัวเดียวกับที่ auth.js ใช้ login (AUTH_API_ENDPOINT) แต่ action
//  พวกนี้ต้องมี token แนบไปด้วยเสมอ (guardAdmin() ฝั่ง Auth.gs เช็คจาก token ไม่ใช่
//  email/password) — window.AUTH_TOKEN ถูกตั้งไว้แล้วตอน login/checkExistingSession
//  สำเร็จใน auth.js
// ============================================================

let SETTINGS_DATA = null;
let SETTINGS_TAB = 'users';

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function settingsApi(action, payload) {
  const res = await fetch(AUTH_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(Object.assign({ action, token: window.AUTH_TOKEN }, payload || {}))
  });
  const text = await res.text();
  return JSON.parse(text);
}

function settingsToast(msg, isError) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:' +
    (isError ? '#E74C3C' : '#1C2833') + ';color:#fff;padding:11px 18px;border-radius:10px;z-index:300;font-size:13px;box-shadow:0 8px 22px rgba(0,0,0,.18)';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

async function renderSettingsModule(container) {
  container.innerHTML = '<div class="p-6 bg-white rounded-xl border border-gray-200"><p class="text-gray-500">กำลังโหลดข้อมูลสิทธิ์…</p></div>';
  const r = await settingsApi('getSettings', {});
  if (!r.success) {
    container.innerHTML = '<div class="p-6 bg-white rounded-xl border border-gray-200"><p class="text-red-500">' + escHtml(r.message || 'โหลดข้อมูลไม่สำเร็จ') + '</p></div>';
    return;
  }
  SETTINGS_DATA = r;
  drawSettings(container);
}

function drawSettings(container) {
  const tabs = [['users', 'ผู้ใช้งาน'], ['roles', 'สิทธิ์ตามตำแหน่ง'], ['projects', 'โครงการ'], ['appPages', 'สิทธิ์ในแอปลูก (ละเอียด)']];
  container.innerHTML =
    '<div class="section-header"><h2 class="section-title">ตั้งค่าสิทธิ์</h2></div>' +
    '<div class="flex gap-2 flex-wrap mb-5" id="settingsTabBar">' +
    tabs.map(t => '<button data-tab="' + t[0] + '" class="settings-tab-btn px-4 py-2 rounded-full text-sm font-medium border ' +
      (SETTINGS_TAB === t[0] ? 'bg-[#D62828] text-white border-[#D62828]' : 'bg-white text-gray-600 border-gray-200') + '">' + t[1] + '</button>').join('') +
    '</div>' +
    '<div id="settingsTabBody"></div>';

  document.querySelectorAll('.settings-tab-btn').forEach(b => b.addEventListener('click', () => {
    SETTINGS_TAB = b.dataset.tab;
    drawSettings(container);
  }));

  const body = document.getElementById('settingsTabBody');
  if (SETTINGS_TAB === 'users') renderUsersTab(body);
  else if (SETTINGS_TAB === 'roles') renderRolesTab(body);
  else if (SETTINGS_TAB === 'projects') renderProjectsTab(body);
  else if (SETTINGS_TAB === 'appPages') renderAppPagesTab(body);
}

/* ── ผู้ใช้งาน ─────────────────────────────────── */
function renderUsersTab(body) {
  const s = SETTINGS_DATA;
  const rows = s.users.map(u => {
    const roleLabel = (s.roles.find(r => r.role === u.role) || {}).label || u.role || '—';
    const scopeRole = s.roles.find(r => r.role === u.role) || {};
    const scope = scopeRole.projectScope === 'all'
      ? '<span class="badge active">ทุกโครงการ</span>'
      : (u.projects.length ? u.projects.map(p => '<span class="badge closed">' + escHtml(p) + '</span>').join(' ') : '<span class="badge alert">ยังไม่ผูกโครงการ</span>');
    return '<tr>' +
      '<td>' + escHtml(u.email) + (u.firstLogin === 'Y' ? ' <span class="badge alert">ยังไม่เปลี่ยนรหัส</span>' : '') + '</td>' +
      '<td>' + escHtml(u.name) + '</td>' +
      '<td>' + escHtml(roleLabel) + '</td>' +
      '<td>' + scope + '</td>' +
      '<td>' + (u.active ? '<span class="badge active">ใช้งาน</span>' : '<span class="badge closed">ปิด</span>') + '</td>' +
      '<td><div class="flex gap-2 justify-end">' +
        '<button data-edit="' + escHtml(u.email) + '" class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">แก้ไข</button>' +
        '<button data-del="' + escHtml(u.email) + '" class="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100">ลบ</button>' +
      '</div></td></tr>';
  }).join('');

  body.innerHTML =
    '<div class="card"><div class="card-header"><div><div class="card-title">ผู้ใช้งานทั้งหมด</div><div class="card-sub">กำหนดตำแหน่งและโครงการที่ผู้ใช้แต่ละคนเข้าถึงได้</div></div>' +
    '<button id="btnAddUser" class="px-4 py-2 bg-[#D62828] text-white rounded-lg text-sm font-medium hover:bg-red-700">+ เพิ่มผู้ใช้</button></div>' +
    '<div class="card-body"><div class="table-wrap"><table><thead><tr><th>อีเมล</th><th>ชื่อ</th><th>ตำแหน่ง</th><th>โครงการ</th><th>สถานะ</th><th></th></tr></thead>' +
    '<tbody>' + (rows || '<tr><td colspan="6" class="text-center text-gray-400 py-6">ยังไม่มีผู้ใช้</td></tr>') + '</tbody></table></div></div></div>';

  document.getElementById('btnAddUser').addEventListener('click', () => userModal(null));
  document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () =>
    userModal(SETTINGS_DATA.users.find(u => u.email === b.dataset.edit))));
  document.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => {
    if (!confirm('ลบผู้ใช้ ' + b.dataset.del + ' ?')) return;
    const r = await settingsApi('deleteUser', { email: b.dataset.del });
    if (!r.success) return settingsToast(r.message, true);
    settingsToast('ลบผู้ใช้แล้ว');
    renderSettingsModule(document.getElementById('sec-settings'));
  }));
}

function userModal(user) {
  const s = SETTINGS_DATA;
  const isNew = !user;
  const u = user || { email: '', name: '', role: (s.roles[0] || {}).role || 'viewer', projects: [], active: true };

  const ov = document.createElement('div');
  ov.className = 'fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[250]';
  ov.innerHTML =
    '<div class="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-auto">' +
    '<h3 class="font-heading font-semibold text-lg mb-4">' + (isNew ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้') + '</h3>' +
    '<div class="space-y-3">' +
    '<div><label class="block text-xs font-semibold text-gray-500 mb-1">อีเมล</label><input id="mEmail" type="email" value="' + escHtml(u.email) + '" ' + (isNew ? '' : 'readonly') + ' class="w-full p-2.5 border border-gray-200 rounded-lg text-sm"></div>' +
    '<div><label class="block text-xs font-semibold text-gray-500 mb-1">ชื่อ-นามสกุล</label><input id="mName" type="text" value="' + escHtml(u.name) + '" class="w-full p-2.5 border border-gray-200 rounded-lg text-sm"></div>' +
    '<div><label class="block text-xs font-semibold text-gray-500 mb-1">ตำแหน่ง</label><select id="mRole" class="w-full p-2.5 border border-gray-200 rounded-lg text-sm">' +
      s.roles.filter(r => r.active).map(r => '<option value="' + escHtml(r.role) + '"' + (r.role === u.role ? ' selected' : '') + '>' + escHtml(r.label) + '</option>').join('') +
    '</select></div>' +
    '<div id="mProjWrap"><label class="block text-xs font-semibold text-gray-500 mb-1">โครงการที่เข้าถึงได้</label>' +
      '<div class="grid grid-cols-2 gap-2" id="mProjects">' +
      (s.projects.length ? s.projects.filter(p => p.active).map(p =>
        '<label class="flex items-center gap-2 text-sm border border-gray-200 rounded-lg p-2"><input type="checkbox" value="' + escHtml(p.code) + '"' + (u.projects.indexOf(p.code) !== -1 ? ' checked' : '') + '> ' + escHtml(p.name || p.code) + '</label>').join('')
        : '<span class="text-xs text-gray-400">ยังไม่มีโครงการ — เพิ่มได้ที่แท็บ "โครงการ"</span>') +
      '</div></div>' +
    '<div><label class="block text-xs font-semibold text-gray-500 mb-1">' + (isNew ? 'รหัสผ่านเริ่มต้น' : 'ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)') + '</label><input id="mPass" type="password" class="w-full p-2.5 border border-gray-200 rounded-lg text-sm"></div>' +
    '<label class="flex items-center gap-2 text-sm"><input type="checkbox" id="mActive"' + (u.active ? ' checked' : '') + '> เปิดใช้งานบัญชีนี้</label>' +
    '</div>' +
    '<div class="flex gap-2 justify-end mt-5">' +
    '<button id="mCancel" class="px-4 py-2 rounded-lg border border-gray-200 text-sm">ยกเลิก</button>' +
    '<button id="mSave" class="px-4 py-2 rounded-lg bg-[#D62828] text-white text-sm font-medium">บันทึก</button>' +
    '</div></div>';
  document.body.appendChild(ov);

  const syncScope = () => {
    const role = document.getElementById('mRole').value;
    const scope = (s.roles.find(r => r.role === role) || {}).projectScope;
    document.getElementById('mProjWrap').style.display = scope === 'all' ? 'none' : '';
  };
  document.getElementById('mRole').addEventListener('change', syncScope);
  syncScope();

  document.getElementById('mCancel').addEventListener('click', () => ov.remove());
  document.getElementById('mSave').addEventListener('click', async () => {
    const email = document.getElementById('mEmail').value.trim();
    if (!email || email.indexOf('@') === -1) return settingsToast('อีเมลไม่ถูกต้อง', true);
    const projects = Array.from(document.querySelectorAll('#mProjects input:checked')).map(c => c.value);
    const payload = {
      email, name: document.getElementById('mName').value.trim(),
      role: document.getElementById('mRole').value, projects,
      active: document.getElementById('mActive').checked
    };
    const pass = document.getElementById('mPass').value;
    if (pass) payload.password = pass;
    const r = await settingsApi('saveUser', { user: payload });
    if (!r.success) return settingsToast(r.message, true);
    settingsToast('บันทึกผู้ใช้แล้ว');
    ov.remove();
    renderSettingsModule(document.getElementById('sec-settings'));
  });
}

/* ── สิทธิ์ตามตำแหน่ง (role × page) ───────────── */
function renderRolesTab(body) {
  const s = SETTINGS_DATA;
  const head = '<tr><th>ตำแหน่ง</th><th>ขอบเขตโครงการ</th>' + s.menus.map(m => '<th class="text-center">' + escHtml(m.label) + '</th>').join('') + '<th class="text-center">ใช้งาน</th></tr>';

  const rowsHtml = s.roles.map(r => {
    const locked = r.role === 'admin';
    const ids = r.menuIds || [];
    return '<tr data-role="' + escHtml(r.role) + '">' +
      '<td><b>' + escHtml(r.label) + '</b><div class="text-xs text-gray-400">' + escHtml(r.role) + '</div></td>' +
      '<td><select data-scope class="p-1.5 border border-gray-200 rounded text-xs" ' + (locked ? 'disabled' : '') + '>' +
      '<option value="own"' + (r.projectScope === 'own' ? ' selected' : '') + '>เฉพาะโครงการของตัวเอง</option>' +
      '<option value="all"' + (r.projectScope === 'all' ? ' selected' : '') + '>ทุกโครงการ</option></select></td>' +
      s.menus.map(m => {
        const disabled = locked || (m.adminOnly && r.role !== 'admin');
        const checked = locked ? true : ids.indexOf(m.id) !== -1;
        return '<td class="text-center"><input type="checkbox" data-menu="' + escHtml(m.id) + '"' + (checked ? ' checked' : '') + (disabled ? ' disabled' : '') + '></td>';
      }).join('') +
      '<td class="text-center"><input type="checkbox" data-active' + (r.active ? ' checked' : '') + (locked ? ' disabled' : '') + '></td></tr>';
  }).join('');

  body.innerHTML =
    '<div class="card"><div class="card-header"><div><div class="card-title">สิทธิ์การเข้าถึงตามตำแหน่ง</div>' +
    '<div class="card-sub">ติ๊กว่าตำแหน่งไหนเห็นแอปไหนได้บ้าง · Admin ถูกล็อกให้เห็นทุกอย่างเสมอ</div></div></div>' +
    '<div class="card-body"><div class="table-wrap"><table id="rolesTable"><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table></div>' +
    '<div class="flex justify-end mt-4"><button id="btnSaveRoles" class="px-4 py-2 bg-[#D62828] text-white rounded-lg text-sm font-medium">บันทึกสิทธิ์</button></div></div></div>';

  document.getElementById('btnSaveRoles').addEventListener('click', async () => {
    const roles = Array.from(document.querySelectorAll('#rolesTable tbody tr')).map(tr => {
      const role = tr.dataset.role;
      const src = SETTINGS_DATA.roles.find(r => r.role === role);
      return {
        role, label: src.label,
        menuIds: Array.from(tr.querySelectorAll('[data-menu]:checked')).map(c => c.dataset.menu),
        projectScope: tr.querySelector('[data-scope]').value,
        active: tr.querySelector('[data-active]').checked
      };
    });
    const r = await settingsApi('saveRoles', { roles });
    if (!r.success) return settingsToast(r.message, true);
    settingsToast('บันทึกสิทธิ์ตามตำแหน่งแล้ว');
    renderSettingsModule(document.getElementById('sec-settings'));
  });
}

/* ── โครงการ ──────────────────────────────────── */
function renderProjectsTab(body) {
  const s = SETTINGS_DATA;
  const rowsHtml = s.projects.map(p =>
    '<tr data-row><td><input data-code type="text" value="' + escHtml(p.code) + '" class="w-full p-1.5 border border-gray-200 rounded text-sm"></td>' +
    '<td><input data-name type="text" value="' + escHtml(p.name) + '" class="w-full p-1.5 border border-gray-200 rounded text-sm"></td>' +
    '<td class="text-center"><input data-active type="checkbox"' + (p.active ? ' checked' : '') + '></td>' +
    '<td><button data-remove class="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100">ลบ</button></td></tr>'
  ).join('');

  body.innerHTML =
    '<div class="card"><div class="card-header"><div><div class="card-title">โครงการ</div><div class="card-sub">รายชื่อโครงการที่ใช้ผูกกับผู้ใช้ · รหัสโครงการ (code) จะถูกส่งเข้าไปให้แดชบอร์ดลูกกรองข้อมูล</div></div></div>' +
    '<div class="card-body"><div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อโครงการ</th><th class="text-center">ใช้งาน</th><th></th></tr></thead>' +
    '<tbody id="projRows">' + rowsHtml + '</tbody></table></div>' +
    '<div class="flex justify-between mt-4"><button id="btnAddRow" class="px-4 py-2 border border-gray-200 rounded-lg text-sm">+ เพิ่มแถว</button>' +
    '<button id="btnSaveProj" class="px-4 py-2 bg-[#D62828] text-white rounded-lg text-sm font-medium">บันทึกโครงการ</button></div></div></div>';

  function wireRow(tr) {
    tr.querySelector('[data-remove]').addEventListener('click', () => tr.remove());
  }
  document.querySelectorAll('#projRows tr').forEach(wireRow);

  document.getElementById('btnAddRow').addEventListener('click', () => {
    const tr = document.createElement('tr');
    tr.dataset.row = '';
    tr.innerHTML = '<td><input data-code type="text" class="w-full p-1.5 border border-gray-200 rounded text-sm"></td>' +
      '<td><input data-name type="text" class="w-full p-1.5 border border-gray-200 rounded text-sm"></td>' +
      '<td class="text-center"><input data-active type="checkbox" checked></td>' +
      '<td><button data-remove class="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100">ลบ</button></td>';
    document.getElementById('projRows').appendChild(tr);
    wireRow(tr);
  });

  document.getElementById('btnSaveProj').addEventListener('click', async () => {
    const projects = Array.from(document.querySelectorAll('#projRows tr')).map(tr => ({
      code: tr.querySelector('[data-code]').value.trim(),
      name: tr.querySelector('[data-name]').value.trim(),
      active: tr.querySelector('[data-active]').checked
    })).filter(p => p.code);
    const r = await settingsApi('saveProjects', { projects });
    if (!r.success) return settingsToast(r.message, true);
    settingsToast('บันทึกโครงการแล้ว');
    renderSettingsModule(document.getElementById('sec-settings'));
  });
}

/* ── สิทธิ์ในแอปลูก (ละเอียดกว่าระดับเมนู) ─────── */
function renderAppPagesTab(body) {
  const s = SETTINGS_DATA;
  const appIds = Object.keys(s.appPages || {});
  const roles = s.roles.filter(r => r.role !== 'admin');

  if (!appIds.length) {
    body.innerHTML = '<div class="card"><div class="card-body text-center text-gray-400 py-6">ยังไม่มีแอปลูกที่ลงทะเบียนสิทธิ์ระดับหน้าไว้</div></div>';
    return;
  }

  const cards = appIds.map(appId => {
    const cfg = s.appPages[appId];
    const head = '<tr><th>หน้า / ฟีเจอร์</th>' + roles.map(r =>
      '<th class="text-center"><button type="button" data-role-toggle="' + escHtml(r.role) + '" class="font-semibold hover:text-[#D62828]" title="คลิกเพื่อติ๊ก/ปลดติ๊กทั้งคอลัมน์">' + escHtml(r.label) + '</button></th>').join('') + '</tr>';
    const rowsHtml = cfg.allPages.map(pageId => {
      const cells = roles.map(r => {
        const checked = (cfg.perRole[r.role] || []).indexOf(pageId) !== -1;
        return '<td class="text-center"><input type="checkbox" data-page="' + escHtml(pageId) + '" data-role="' + escHtml(r.role) + '"' + (checked ? ' checked' : '') + '></td>';
      }).join('');
      return '<tr><td>' + escHtml(pageId) + '</td>' + cells + '</tr>';
    }).join('');

    return '<div class="card mb-4" data-app="' + escHtml(appId) + '"><div class="card-header"><div><div class="card-title">' + escHtml(appId) + '</div>' +
      '<div class="card-sub">กำหนดว่าแต่ละตำแหน่งเห็น/ใช้หน้าไหนได้บ้างภายในแอปนี้ · คลิกชื่อตำแหน่งเพื่อติ๊ก/ปลดติ๊กทั้งคอลัมน์</div></div></div>' +
      '<div class="card-body"><div class="table-wrap"><table><thead>' + head + '</thead><tbody>' + rowsHtml + '</tbody></table></div>' +
      '<div class="flex justify-end mt-4"><button data-save-app="' + escHtml(appId) + '" class="px-4 py-2 bg-[#D62828] text-white rounded-lg text-sm font-medium">บันทึกสิทธิ์แอปนี้</button></div></div></div>';
  }).join('');

  body.innerHTML = cards;

  document.querySelectorAll('[data-role-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const card = btn.closest('[data-app]');
    const boxes = Array.from(card.querySelectorAll('input[type=checkbox][data-role="' + btn.dataset.roleToggle + '"]'));
    const allOn = boxes.every(b => b.checked);
    boxes.forEach(b => { b.checked = !allOn; });
  }));

  document.querySelectorAll('[data-save-app]').forEach(btn => btn.addEventListener('click', async () => {
    const appId = btn.dataset.saveApp;
    const card = document.querySelector('[data-app="' + appId + '"]');
    const perms = {};
    roles.forEach(r => { perms[r.role] = []; });
    card.querySelectorAll('input[type=checkbox]').forEach(cb => { if (cb.checked) perms[cb.dataset.role].push(cb.dataset.page); });
    const r = await settingsApi('saveAppPages', { appId, perms });
    if (!r.success) return settingsToast(r.message, true);
    settingsToast('บันทึกสิทธิ์แอปนี้แล้ว');
    renderSettingsModule(document.getElementById('sec-settings'));
  }));
}
