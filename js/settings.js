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

// รายชื่อโครงการที่ยัง Active จากไฟล์ Project List / WBS จริง — ใช้เป็นตัวช่วย autocomplete
// ในแท็บ "โครงการ" เท่านั้น (พิมพ์เองได้ตามปกติ ไม่ได้บังคับเลือกจาก list นี้) ถ้ามีโครงการ
// ใหม่ที่ยังไม่อยู่ใน list นี้ ก็แค่พิมพ์รหัส/ชื่อเองแล้วกด "+ เพิ่มแถว" ตามปกติได้เลย
const KNOWN_PROJECTS = {
  "SI2019038": "ซื้อขายพร้อมติดตั้งจอ LED พร้อมอุปกรณ์ประกอบ",
  "SI2020059": "ซื้อขายพร้อมติดตั้งอุปกรณ์ Ethernet Switch Layer 3",
  "ISS2022024": "ซื้อขายพร้อมติดตั้งระบบวิทยุสื่อสาร แบบดิจิตอล พร้อมอุปกรณ์ประกอบการใช้งาน ในพื้นที่ กฟก.1 ในพื้นที่รวม 7 จังหวัด เฟส 2",
  "NB230001": "ซื้อขายโครงการประหยัดพลังงานแบบรับประกันผลการประหยัด โครงการติดตั้งระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์ (Solar Cell) แบบติดตั้งบนหลังคา (Roof Top) ขนาดกำลังพิกัดรวม 321.6 kWdc",
  "ITS180291.1": "SCADA for Pink Line project #ABB",
  "ISS2023045": "จัดซื้อพร้อมติดตั้งวิทยุสื่อสาร สฟ ตาพระยา จังหวัดสระแก้ว",
  "ITS210014": "Park and Ride Building and SSS Modification for Pink Line",
  "ISS2022045": "ปรับปรุงประสิทธิภาพระบบควบคุมและป้องกันสถานีไฟฟ้า ระยะที่ 1",
  "ITS230013": "ซื้อขายเครื่องผลิตแผ่นป้ายทะเบียนรถแบบอัตโนมัติ พร้อมติดตั้ง จำนวน 1 ระบบ (จำนวน 2 ชุด)",
  "ISS2024055": "จัดซื้อแผ่นฟิล์มความร้อน Hot Stamping Film",
  "ISS2021045": "ปรับปรุงระบบป้องกัน เพื่อทดแทนผลิตภัณฑ์ ABB และ SIEMENS ให้รองรับเทคโนโลยี IEC61850",
  "ISS2022069": "บริการที่ปรึกษาโครงการจ้างเหมาปรับปรุงระบบป้องกัน เพื่อทดแทนผลิตภัณฑ์ ABB และ SIEMENS ให้รองรับเทคโนโลยี IEC61850 (บันทึกข้อตกลงแก้ไขเพิ่มเติม) i-service",
  "ISS2022074": "บริการที่ปรึกษาโครงการจ้างเหมาปรับปรุงระบบป้องกัน เพื่อทดแทนผลิตภัณฑ์ ABB และ SIEMENS ให้รองรับเทคโนโลยี IEC61850-NARI",
  "ISS2022075": "ปรับปรุงระบบป้องกัน เพื่อทดแทนผลิตภัณฑ์ ABB และ SIEMENS ให้รองรับเทคโนโลยี IEC61850 (ข้อตกลงแก้ไขเพิ่มเติม ครั้งที่ 1)",
  "ISS2023020": "บริการที่ปรึกษาโครงการจ้างเหมาปรับปรุงระบบป้องกัน เพื่อทดแทนผลิตภัณฑ์ ABB และ SIEMENS ให้รองรับเทคโนโลยี IEC61850 (บันทึกข้อตกลงแก้ไขเพิ่มเติม ครั้งที่ 1) NARI",
  "ISS2023021": "บริการที่ปรึกษาโครงการจ้างเหมาปรับปรุงระบบป้องกัน เพื่อทดแทนผลิตภัณฑ์ ABB และ SIEMENS ให้รองรับเทคโนโลยี IEC61850 (บันทึกข้อตกลงแก้ไขเพิ่มเติม ครั้งที่ 1) i-service",
  "MA2024022": "บำรุงรักษาศูนย์ควบคุมระบบป้องกันน้ำท่วมกรุงเทพมหานคร",
  "NB230004": "ติดตั้งระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์ แบบติดตั้งบนหลังคา ขนาดกำลังการผลิต 495 kWp และ 132 kWp โรงเรียนพระหฤทัยดอนเมือง",
  "ITS240108": "Active intermediate",
  "ITS240119": "New Model Pivot Switch",
  "ITS240068": "Spur Line Norming Point Installation",
  "NB230002": "ติดตั้งระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์ แบบติดตั้งบนหลังคา ขนาดกำลังการผลิต 672 kWp โรงเรียนพระหฤทัยคอนแวนต์",
  "NB230003": "ติดตั้งระบบผลิตไฟฟ้าจากพลังงานแสงอาทิตย์ แบบติดตั้งบนหลังคา ขนาดกำลังการผลิต 605 kWp และ 100 kWp โรงเรียนพระหฤทัยนนทบุรี",
  "ISS2024018": "ปรับปรุงระบบกล้องโทรทัศน์วงจรปิด (CCTV)พร้อมอุปกรณ์ประกอบและการเชื่อมโยงสัญญาณไปยังกองรักษาการณ์ประจำพระราชฐาน วังสระปทุม",
  "ITS250053": "Antivirus Symantec Endpoint Protection (24 Months)",
  "ITS220007": "Additional Works at Spur Line of Pink Line",
  "MA2025049": "บำรุงรักษาระบบกล้องโทรทัศน์วงจรปิด (CCTV)พร้อมอุปกรณ์ประกอบ และการเชื่อมโยงสัญญาณไปยังกองรักษาการณ์ประจำพระราชฐานหรือสถานีตำรวจนครบครบาลโดยรอบเขตพระราชฐานและสถานที่สำคัญ",
  "MA2025048": "บำรุงรักษาระบบเครือข่ายสื่อสารของกรุงเทพมหานคร",
  "MA2025031": "บำรุงรักษาและซ่อมแชมแก้ไขเครื่องจักรผลิตแผ่นป้ายทะเบียนรถแบบอัดโนมัติ ประจำปีงบประมาณ พ.ศ. 2569",
  "ITS190178.1": "Power Rail - Pink Line #Pandrol",
  "ITS190178.2": "Power Rail - Yellow Line #Pandrol",
  "ISS2025047": "SCADA บึงทองหลาง",
  "MA2026010": "Maintenance Service for Fiber Optic Transmission Equipment (FOTE) System 10 months (1 Mar-31 Dec 2026)",
  "MA2025044": "บำรุงรักษาสายสัญญาณและอุปกรณ์จัดการเครือข่ายของกรุงเทพมหานคร",
  "ISS2024039": "รายการค่าใช้จ่ายในการจัดหาพร้อมติดตั้ง เครื่ื่องวัดระดับน้ำในคลอง 68 จุด",
  "MA2026022": "จ้างเหมาตรวจซ่อมและบำรุงรักษาระบบวิทยุสื่อสารแบบ Digital",
  "ISS2023044": "จ้างเหมาติดตั้งสายใยแก้วนำแสงรองรับงาน SCADA/DMS",
  "ISS2025008": "ก่อสร้างระบบไหลเวียนน้ำคลองไผ่สิงโต",
  "ITS250052": "Sprocket spare part for gold line",
  "ITS250066": "งานพัฒนาโปรแกรมบริหารงานบำรุงรักษาเชิงป้องกัน และงานแจ้งซ่อม"
};

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg,#D62828,#b71c1c)', 'linear-gradient(135deg,#1A5276,#154360)',
  'linear-gradient(135deg,#1E8449,#186a37)', 'linear-gradient(135deg,#8B5CF6,#6d28d9)',
  'linear-gradient(135deg,#D68910,#b3720c)'
];
function avatarHtml(email, name, sizePx) {
  // รูปกับตัวอักษรสี (fallback) วางซ้อนกันไว้ทั้งคู่เสมอ — ถ้าโหลดรูปสำเร็จจะบังตัวอักษร
  // ไว้ ถ้าโหลดพัง (onerror) แค่ลบ <img> ทิ้ง ตัวอักษรที่วางไว้ข้างใต้อยู่แล้วก็โผล่ออกมา
  // เอง ไม่ต้องประกอบ HTML string ใหม่ตอน error
  const size = sizePx || 34;
  const photos = (SETTINGS_DATA && SETTINGS_DATA.employeePhotos) || {};
  const photo = photos[String(email || '').trim().toLowerCase()];
  const bg = AVATAR_GRADIENTS[_avatarColorIdx_(email)];
  const wrapStyle = 'width:' + size + 'px;height:' + size + 'px;border-radius:50%;flex-shrink:0;overflow:hidden;position:relative;';
  const fallbackStyle = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:\'Prompt\',sans-serif;font-weight:700;color:#fff;font-size:' + Math.round(size * 0.36) + 'px;background:' + bg + ';';
  const fallback = '<div style="' + fallbackStyle + '">' + escHtml(_initials_(name, email)) + '</div>';
  const img = photo ? '<img src="' + escHtml(photo) + '" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" onerror="this.remove()">' : '';
  return '<div style="' + wrapStyle + '">' + fallback + img + '</div>';
}
function _initials_(name, email) {
  // ชื่อไทยตัดอักษรแรกมาทำ initials ไม่ได้ตรงๆ (สระนำอย่าง "ไ"/"เ" แยกจากพยัญชนะ
  // ทำให้ได้ตัวย่อที่อ่านไม่รู้เรื่อง) ใช้ initials จากอีเมลแทนถ้าชื่อเป็นภาษาไทย
  const n = String(name || '').trim();
  if (n && !/[฀-๿]/.test(n)) {
    const parts = n.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  return String(email || '').split('@')[0].slice(0, 2).toUpperCase();
}
function _avatarColorIdx_(email) {
  const s = String(email || '');
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % AVATAR_GRADIENTS.length;
}

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
  if (!container) return;
  container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;padding:60px 0"><div class="spinner"></div></div>';
  const r = await settingsApi('getSettings', {});
  // ถ้าระหว่างรอ API หน้านี้ถูกแทนที่/หลุดออกจากเอกสารไปแล้ว ให้เลิกทำงานเงียบๆ
  // แทนที่จะไปพัง innerHTML ของ node ที่ไม่มีใครมองเห็นแล้ว
  if (!container.isConnected) return;
  if (!r.success) {
    container.innerHTML = '<div class="p-6 bg-white rounded-xl border border-gray-200"><p class="text-red-500">' + escHtml(r.message || 'โหลดข้อมูลไม่สำเร็จ') + '</p></div>';
    return;
  }
  SETTINGS_DATA = r;
  drawSettings(container);
}

function drawSettings(container) {
  if (!container || !container.isConnected) return;
  const tabs = [['users', 'ผู้ใช้งาน'], ['roles', 'สิทธิ์ตามตำแหน่ง'], ['projects', 'โครงการ'], ['appPages', 'สิทธิ์ในแอปลูก (ละเอียด)']];
  container.innerHTML =
    '<div class="section-header"><h2 class="section-title">Authorization</h2></div>' +
    '<div class="flex gap-2 flex-wrap mb-5" id="settingsTabBar">' +
    tabs.map(t => '<button data-tab="' + t[0] + '" class="settings-tab-btn px-4 py-2 rounded-full text-sm font-medium border ' +
      (SETTINGS_TAB === t[0] ? 'bg-[#D62828] text-white border-[#D62828]' : 'bg-white text-gray-600 border-gray-200') + '">' + t[1] + '</button>').join('') +
    '</div>' +
    '<div id="settingsTabBody"></div>';

  // สโคปแค่ในตัว container เอง ไม่ใช่ querySelectorAll ทั้งเอกสาร กันปุ่มแท็บของการ
  // render รอบเก่า (ถ้ามีค้าง) ไปยิง event ซ้อนกับรอบปัจจุบัน
  container.querySelectorAll('.settings-tab-btn').forEach(b => b.addEventListener('click', () => {
    SETTINGS_TAB = b.dataset.tab;
    drawSettings(container);
  }));

  const body = container.querySelector('#settingsTabBody');
  if (!body) return;
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
      '<td><div class="flex items-center gap-3">' + avatarHtml(u.email, u.name) +
        '<div><div class="font-semibold">' + escHtml(u.email) + (u.firstLogin === 'Y' ? ' <span class="badge alert">ยังไม่เปลี่ยนรหัส</span>' : '') + '</div>' +
        '<div class="text-xs text-gray-400">' + escHtml(u.name) + '</div></div></div></td>' +
      '<td>' + escHtml(roleLabel) + '</td>' +
      '<td>' + scope + '</td>' +
      '<td>' + (u.active ? '<span class="badge active">ใช้งาน</span>' : '<span class="badge closed">ปิด</span>') + '</td>' +
      '<td><div class="flex gap-2 justify-end">' +
        '<button data-edit="' + escHtml(u.email) + '" class="px-3 py-1.5 text-xs rounded-lg border border-gray-200 hover:bg-gray-50">แก้ไข</button>' +
        '<button data-del="' + escHtml(u.email) + '" class="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100">ลบ</button>' +
      '</div></td></tr>';
  }).join('');

  body.innerHTML =
    '<div class="card"><div class="card-header"><div><div class="card-title">ผู้ใช้งานทั้งหมด</div></div>' +
    '<button id="btnAddUser" class="px-4 py-2 bg-[#D62828] text-white rounded-lg text-sm font-medium hover:bg-red-700">+ เพิ่มผู้ใช้</button></div>' +
    '<div class="card-body"><div class="table-wrap"><table><thead><tr><th>ผู้ใช้งาน</th><th>ตำแหน่ง</th><th>โครงการ</th><th>สถานะ</th><th></th></tr></thead>' +
    '<tbody>' + (rows || '<tr><td colspan="5" class="text-center text-gray-400 py-6">ยังไม่มีผู้ใช้</td></tr>') + '</tbody></table></div></div></div>';

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
  ov.className = 'modal-overlay';
  ov.innerHTML =
    '<div class="modal-box">' +
    '<h3>' + (isNew ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้') + '</h3>' +
    '<div id="mIdentity" class="modal-identity"></div>' +
    '<div class="space-y-3">' +
    '<div><label>อีเมล</label><input id="mEmail" type="email" value="' + escHtml(u.email) + '" ' + (isNew ? '' : 'readonly') + '></div>' +
    '<div><label>ชื่อ-นามสกุล</label><input id="mName" type="text" value="' + escHtml(u.name) + '"></div>' +
    '<div><label>ตำแหน่ง</label><select id="mRole">' +
      s.roles.filter(r => r.active).map(r => '<option value="' + escHtml(r.role) + '"' + (r.role === u.role ? ' selected' : '') + '>' + escHtml(r.label) + '</option>').join('') +
    '</select></div>' +
    '<div id="mProjWrap"><label>โครงการที่เข้าถึงได้</label>' +
      '<div class="grid grid-cols-2 gap-2" id="mProjects">' +
      (s.projects.length ? s.projects.filter(p => p.active).map(p =>
        '<label class="field-check"><input type="checkbox" value="' + escHtml(p.code) + '"' + (u.projects.indexOf(p.code) !== -1 ? ' checked' : '') + '> ' + escHtml(p.name || p.code) + '</label>').join('')
        : '<span class="text-xs text-gray-400">ยังไม่มีโครงการ — เพิ่มได้ที่แท็บ "โครงการ"</span>') +
      '</div></div>' +
    '<div><label>' + (isNew ? 'รหัสผ่านเริ่มต้น' : 'ตั้งรหัสผ่านใหม่ (เว้นว่าง = ไม่เปลี่ยน)') + '</label><input id="mPass" type="password"></div>' +
    '<label class="field-check"><input type="checkbox" id="mActive"' + (u.active ? ' checked' : '') + '> เปิดใช้งานบัญชีนี้</label>' +
    '</div>' +
    '<div class="flex gap-2 justify-end mt-5">' +
    '<button id="mCancel" class="btn-ghost">ยกเลิก</button>' +
    '<button id="mSave" class="btn-primary">บันทึก</button>' +
    '</div></div>';
  document.body.appendChild(ov);

  // แสดงรูป/ชื่อ/อีเมลด้านบน popup ให้ตรงกับสิ่งที่พิมพ์อยู่ตอนนี้ — เพิ่มผู้ใช้ใหม่จะ
  // เริ่มจากไม่มีรูป พอพิมพ์อีเมลตรงกับพนักงานที่มีรูปจริงจะขึ้นรูปให้ทันที
  const renderIdentity = () => {
    const email = document.getElementById('mEmail').value.trim();
    const name = document.getElementById('mName').value.trim();
    const idEl = document.getElementById('mIdentity');
    idEl.innerHTML = avatarHtml(email, name, 68) +
      '<div class="m-name">' + (escHtml(name) || '<span style="color:var(--text-3)">ยังไม่มีชื่อ</span>') + '</div>' +
      '<div class="m-email">' + (escHtml(email) || '—') + '</div>';
  };
  renderIdentity();
  document.getElementById('mEmail').addEventListener('input', renderIdentity);
  document.getElementById('mName').addEventListener('input', renderIdentity);

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
    '<div class="card"><div class="card-header"><div><div class="card-title">สิทธิ์การเข้าถึงตามตำแหน่ง</div></div></div>' +
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
  const codeInput = (code) => '<input data-code list="projCodeList" type="text" value="' + escHtml(code || '') + '" class="w-full p-1.5 border border-gray-200 rounded text-sm">';
  const nameInput = (name) => '<input data-name type="text" value="' + escHtml(name || '') + '" class="w-full p-1.5 border border-gray-200 rounded text-sm">';
  const rowsHtml = s.projects.map(p =>
    '<tr data-row><td>' + codeInput(p.code) + '</td>' +
    '<td>' + nameInput(p.name) + '</td>' +
    '<td class="text-center"><input data-active type="checkbox"' + (p.active ? ' checked' : '') + '></td>' +
    '<td><button data-remove class="px-3 py-1.5 text-xs rounded-lg bg-red-50 text-red-600 hover:bg-red-100">ลบ</button></td></tr>'
  ).join('');

  // ตัวช่วย autocomplete รหัสโครงการ — พิมพ์เองได้ตามปกติ นี่แค่แนะนำจากรายชื่อโครงการ
  // จริงที่มีอยู่ (ดู KNOWN_PROJECTS ด้านบนไฟล์) พอเลือก/พิมพ์รหัสตรงกับที่รู้จัก จะเติม
  // ชื่อโครงการให้อัตโนมัติ (เฉพาะตอนช่องชื่อยังว่างอยู่ ไม่ทับชื่อที่พิมพ์เองไว้แล้ว)
  const datalistHtml = '<datalist id="projCodeList">' +
    Object.keys(KNOWN_PROJECTS).map(code => '<option value="' + escHtml(code) + '">' + escHtml(KNOWN_PROJECTS[code]) + '</option>').join('') +
    '</datalist>';

  body.innerHTML =
    '<div class="card"><div class="card-header"><div><div class="card-title">โครงการ</div></div></div>' +
    '<div class="card-body"><div class="table-wrap"><table><thead><tr><th>รหัส</th><th>ชื่อโครงการ</th><th class="text-center">ใช้งาน</th><th></th></tr></thead>' +
    '<tbody id="projRows">' + rowsHtml + '</tbody></table></div>' +
    '<div class="flex justify-between mt-4"><button id="btnAddRow" class="px-4 py-2 border border-gray-200 rounded-lg text-sm">+ เพิ่มแถว</button>' +
    '<button id="btnSaveProj" class="px-4 py-2 bg-[#D62828] text-white rounded-lg text-sm font-medium">บันทึกโครงการ</button></div></div></div>' +
    datalistHtml;

  function wireRow(tr) {
    tr.querySelector('[data-remove]').addEventListener('click', () => tr.remove());
    const codeEl = tr.querySelector('[data-code]');
    const nameEl = tr.querySelector('[data-name]');
    codeEl.addEventListener('input', () => {
      const known = KNOWN_PROJECTS[codeEl.value.trim()];
      if (known && !nameEl.value.trim()) nameEl.value = known;
    });
  }
  document.querySelectorAll('#projRows tr').forEach(wireRow);

  document.getElementById('btnAddRow').addEventListener('click', () => {
    const tr = document.createElement('tr');
    tr.dataset.row = '';
    tr.innerHTML = '<td>' + codeInput('') + '</td>' +
      '<td>' + nameInput('') + '</td>' +
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
    // ใช้ชื่อแอปตามที่แสดงจริงในแถบเมนูซ้าย (มาจาก Auth.gs) แทน appId ดิบๆ ให้อ่านง่ายขึ้น
    const appLabel = ((s.menus || []).find(m => m.id === appId) || {}).label || appId;
    const head = '<tr><th>หน้า / ฟีเจอร์</th>' + roles.map(r =>
      '<th class="text-center"><button type="button" data-role-toggle="' + escHtml(r.role) + '" class="font-semibold hover:text-[#D62828]" title="คลิกเพื่อติ๊ก/ปลดติ๊กทั้งคอลัมน์">' + escHtml(r.label) + '</button></th>').join('') + '</tr>';
    const rowsHtml = cfg.allPages.map(pageId => {
      const cells = roles.map(r => {
        const checked = (cfg.perRole[r.role] || []).indexOf(pageId) !== -1;
        return '<td class="text-center"><input type="checkbox" data-page="' + escHtml(pageId) + '" data-role="' + escHtml(r.role) + '"' + (checked ? ' checked' : '') + '></td>';
      }).join('');
      return '<tr><td>' + escHtml(pageId) + '</td>' + cells + '</tr>';
    }).join('');

    return '<div class="card mb-4" data-app="' + escHtml(appId) + '"><div class="card-header"><div><div class="card-title">' + escHtml(appLabel) + '</div></div></div>' +
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
