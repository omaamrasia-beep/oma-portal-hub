// ⚠️ ใส่ URL Web App ของคุมสิทธิ์ที่คุณจัดทำไว้ในขั้นตอนก่อนหน้านี้
const AUTH_API_ENDPOINT = "https://script.google.com/macros/s/AKfycbwvg_N-ZAqfZVJCyRTTizomDZR3_eH0WMgmxp8gc1YqUtYL6AZte4sRJlEIqwL3zs_PJA/exec";

// เก็บ token ของ session ปัจจุบันไว้ใช้เรียก action ที่ต้องยืนยันตัวตน (เช่น หน้า
// "ตั้งค่าสิทธิ์" — getSettings/saveUser/saveRoles/... ทุกตัวต้องมี token ถึงจะผ่าน
// guardAdmin() ฝั่ง Auth.gs ได้) ไม่เก็บลง localStorage เพราะ token หมดอายุได้เอง
// อยู่แล้ว (8 ชม.) และ checkExistingSession() ก็ยิง login ใหม่ให้ทุกครั้งที่เปิดหน้าเว็บ
window.AUTH_TOKEN = '';

// กัน buildPortalUI ถูกเรียกซ้ำสอง — checkExistingSession() (auto ตอนเปิดหน้า) กับ
// executeAuth() (ตอนกดปุ่ม login) เป็นคนละ flow ที่แยกอิสระจากกัน ถ้า auto-login ช้า
// (รอ Auth.gs ตอบ) แล้วผู้ใช้ใจร้อนกดปุ่ม login เองก่อน ทั้งสอง flow จะ resolve เกือบพร้อม
// กันและเรียก buildPortalUI ซ้อนกันทั้งคู่ — mainContainer.innerHTML ถูกล้างแล้วสร้างใหม่
// รอบที่สอง ทำให้ iframe ของ Projects (เมนู default) ถูกทิ้งแล้วโหลดใหม่ทั้งอัน เห็นเป็น
// จอกระพริบขาวแล้วข้อมูลเดิมกลับมา (ของใหม่ที่เพิ่งโหลดซ้ำ ไม่ใช่ค่าเก่าค้าง)
let _portalBuilt = false;

async function postAuth(payload) {
  const response = await fetch(AUTH_API_ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}: ${text.slice(0, 300)}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON response from auth server: ${text.slice(0, 300)}`);
  }
}

async function executeAuth() {
  const btn = document.getElementById('btnLogin');
  const email = document.getElementById('inputEmail').value;
  const password = document.getElementById('inputPassword').value;
  
  if(!email || !password) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
  
  btn.disabled = true;
  btn.innerHTML = `กำลังตรวจสอบ...`;
  
  try {
    const result = await postAuth({ email, password });
    
    if (result.success) {
      // ✅ บันทึก Session ไว้ใน localStorage เพื่อให้จำการ login ได้แม้ Refresh หน้า
      localStorage.setItem('oma_session', JSON.stringify({ email, password }));
      window.AUTH_TOKEN = result.token || '';

      const loginWindow = document.getElementById('login-window');
      if (loginWindow) loginWindow.remove(); // ทำลายหน้า Login ทิ้งทันทีเพื่อความปลอดภัย
      document.getElementById('portal-workspace').style.display = 'block';

      // ส่งรายการเมนูที่ได้รับสิทธิ์ไปวาดโครงสร้างหน้าเว็บ
      buildPortalUI(result.menus);
    } else {
      alert(result.message);
      btn.disabled = false;
      btn.innerHTML = 'เข้าสู่ระบบ';
    }
  } catch (err) {
    console.error('Auth request failed:', err);
    alert('ไม่สามารถเชื่อมต่อฐานข้อมูลสิทธิ์ส่วนกลางได้: ' + (err.message || err));
    btn.disabled = false;
    btn.innerHTML = 'เข้าสู่ระบบ';
  }
}

// คัดลอกเฉพาะฟังก์ชันนี้ไปแทนที่ฟังก์ชันเดิมใน js/auth.js ของคุณครับ
function buildPortalUI(menus) {
  // กันเรียกซ้ำสอง (ดูคำอธิบาย _portalBuilt ด้านบน) — ถ้าเคย build ไปแล้วรอบหนึ่งใน
  // การโหลดหน้าเว็บครั้งนี้ ไม่ต้อง build ซ้ำอีกไม่ว่าใครจะเรียกมา
  if (_portalBuilt) return;
  _portalBuilt = true;

  const navContainer = document.getElementById('sidebarNavContainer');
  const mainContainer = document.getElementById('main');

  navContainer.innerHTML = '';
  mainContainer.innerHTML = '';
  
  menus.forEach((menu, idx) => {
    const isDefault = idx === 0;
    
    // 1. สร้างปุ่มเมนูใน Sidebar ด้านซ้าย
    const navLink = document.createElement('a');
    navLink.href = "javascript:void(0)";
    navLink.className = `nav-item ${isDefault ? 'active' : ''}`;
    navLink.innerHTML = `<span class="nav-icon"><i class="bi ${menu.icon}"></i></span><span class="nav-label">${menu.label}</span>`;
    navLink.onclick = function() { switchModule(menu.id, this, menu.label); };
    navContainer.appendChild(navLink);
    
    // 2. สร้างเซกชันเนื้อหาหลัก (รองรับระบบ Iframe 100%)
    const section = document.createElement('section');
    section.id = menu.id;
    section.className = `page-section ${isDefault ? 'active' : ''}`;
    // ต่อเข้า DOM ก่อนเติมเนื้อหา — renderSettingsModule เป็น async, ถ้าต่อเข้า DOM
    // หลังเรียก จะมีช่วงสั้นๆ ที่ section ยังลอยอยู่นอกเอกสาร ทำให้ document.getElementById
    // หาลูกของมันไม่เจอถ้ามีโค้ดส่วนอื่นมาแข่งจังหวะกัน
    mainContainer.appendChild(section);

    if (menu.isIframe) {
      // โหลด iframe แบบ lazy: เมนูแรก (isDefault) โหลดทันที ส่วนที่เหลือรอจนกว่าจะถูก
      // คลิกเปิดจริง (ดู switchModule ใน main.js) — ไม่งั้นทุก child app ทั้ง 7 ตัวจะ
      // โหลดพร้อมกันหมดตั้งแต่ล็อกอิน ทำให้เว็บช้าและมี console warning จากแอปที่ไม่ได้เปิดดูด้วย
      //
      // ทุกแท็บ (รวมเมนู default) แสดง spinner แบบเดียวกันทับ iframe ไว้จนกว่าจะโหลดเสร็จ
      // (iframe.onload) แทนที่จะเห็นพื้นที่ว่างสีขาวเปล่าๆ ระหว่างรอ — ให้ทุกแอปลูกมี
      // ลักษณะตอนโหลดเหมือนกันหมด ไม่ว่าตัวแอปเองจะมีหน้าจอ loading ของตัวเองหรือไม่
      section.style.height = '100%';
      const srcAttr = isDefault ? `src="${menu.src}"` : `data-src="${menu.src}"`;
      section.innerHTML = `
        <div class="iframe-shell">
          <div class="iframe-loading"><div class="spinner"></div><p>กำลังโหลด...</p></div>
          <iframe ${srcAttr} style="width: 100%; height: 100%; border: none;" onload="this.previousElementSibling.classList.add('hide')"></iframe>
        </div>`;
    } else if (menu.id === 'sec-settings' && typeof renderSettingsModule === 'function') {
      // หน้า Authorization — เรนเดอร์จริงจาก js/settings.js (ไม่ใช่ placeholder)
      renderSettingsModule(section);
    } else {
      // ส่วนเผื่อเลือกในอนาคต หากมีหน้าจอภายในหน้าบ้านเอง
      section.innerHTML = `
        <div class="p-6 bg-white rounded-xl border border-gray-200">
          <p class="text-gray-500">กำลังโหลดเนื้อหาสำหรับโมดูล ${menu.label}...</p>
        </div>`;
    }

    if (isDefault) {
      const pageTitle = document.getElementById('pageTitle');
      if (pageTitle) {
        pageTitle.innerText = menu.label;
      }
    }
  });}

// ✅ เช็คว่ามี Session เดิมที่ยัง Login ค้างอยู่ไหม (เรียกใช้ตอนเปิดหน้าเว็บ)
async function checkExistingSession() {
  const saved = localStorage.getItem('oma_session');
  if (!saved) return; // ไม่มี session เดิม ให้แสดงหน้า login ตามปกติ
  
  try {
    const { email, password } = JSON.parse(saved);
    
    const result = await postAuth({ email, password });
    
    if (result.success) {
      // Session ยังใช้ได้ -> ข้ามหน้า Login ไปเลย
      window.AUTH_TOKEN = result.token || '';
      const loginWindow = document.getElementById('login-window');
      if (loginWindow) loginWindow.remove();
      document.getElementById('portal-workspace').style.display = 'block';
      buildPortalUI(result.menus);
    } else {
      // รหัสผ่านอาจถูกเปลี่ยน หรือสิทธิ์ถูกถอน -> ล้าง session เก่าทิ้ง
      localStorage.removeItem('oma_session');
    }
  } catch (err) {
    console.warn('ไม่สามารถตรวจสอบ session เดิมได้:', err);
  }
}

// 🔓 ฟังก์ชัน Logout
function logoutUser() {
  localStorage.removeItem('oma_session');
  window.AUTH_TOKEN = '';
  location.reload(); // รีเฟรชหน้าใหม่ทั้งหมด กลับไปหน้า Login
}

// เรียกเช็ค session ทันทีที่หน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', checkExistingSession);
