// ⚠️ ใส่ URL Web App ของคุมสิทธิ์ที่คุณจัดทำไว้ในขั้นตอนก่อนหน้านี้
const AUTH_API_ENDPOINT = "https://script.google.com/macros/s/AKfycbwvg_N-ZAqfZVJCyRTTizomDZR3_eH0WMgmxp8gc1YqUtYL6AZte4sRJlEIqwL3zs_PJA/exec"; 

async function executeAuth() {
  const btn = document.getElementById('btnLogin');
  const email = document.getElementById('inputEmail').value;
  const password = document.getElementById('inputPassword').value;
  
  if(!email || !password) { alert('กรุณากรอกข้อมูลให้ครบถ้วน'); return; }
  
  btn.disabled = true;
  btn.innerHTML = `กำลังตรวจสอบ...`;
  
  try {
    const response = await fetch(AUTH_API_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    
    if (result.success) {
      // ✅ บันทึก Session ไว้ใน localStorage เพื่อให้จำการ login ได้แม้ Refresh หน้า
      localStorage.setItem('oma_session', JSON.stringify({ email, password }));
      
      document.getElementById('login-window').remove(); // ทำลายหน้า Login ทิ้งทันทีเพื่อความปลอดภัย
      document.getElementById('portal-workspace').style.display = 'block';
      
      // ส่งรายการเมนูที่ได้รับสิทธิ์ไปวาดโครงสร้างหน้าเว็บ
      buildPortalUI(result.menus);
    } else {
      alert(result.message);
      btn.disabled = false;
      btn.innerHTML = 'เข้าสู่ระบบ';
    }
  } catch (err) {
    alert('ไม่สามารถเชื่อมต่อฐานข้อมูลสิทธิ์ส่วนกลางได้');
    btn.disabled = false;
    btn.innerHTML = 'เข้าสู่ระบบ';
  }
}

// คัดลอกเฉพาะฟังก์ชันนี้ไปแทนที่ฟังก์ชันเดิมใน js/auth.js ของคุณครับ
function buildPortalUI(menus) {
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
    
    if (menu.isIframe) {
      // ดึงทุกโมดูลที่เป็น Iframe มาแสดงผล (รวมถึงหน้าโครงการอันใหม่ของคุณด้วย)
      section.style.height = '100%';
      section.innerHTML = `
        <div style="width: 100%; height: calc(100vh - var(--topbar-h) - 48px); background: white; border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm);">
          <iframe src="${menu.src}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>`;
    } else {
      // ส่วนเผื่อเลือกในอนาคต หากมีหน้าจอภายในหน้าบ้านเอง
      section.innerHTML = `
        <div class="p-6 bg-white rounded-xl border border-gray-200">
          <p class="text-gray-500">กำลังโหลดเนื้อหาสำหรับโมดูล ${menu.label}...</p>
        </div>`;
    }
    
    mainContainer.appendChild(section);
    
if(isDefault) {
      document.getElementById('pageTitle').innerText = menu.label;
      
      // 💡 เคล็ดลับ: ซ่อนแถบฟิลเตอร์ (Topbar Filter) ของหน้าบ้านเดิม 
      // เพราะหน้าจอโครงการอันใหม่จะใช้ระบบฟิลเตอร์ที่สร้างอยู่ข้างใน Iframe ตัวเองแล้ว
      const filterGroup = document.getElementById('topbarFilter');
      if (filterGroup) {
        filterGroup.style.display = 'none';
      }
    }
  });}

// ✅ เช็คว่ามี Session เดิมที่ยัง Login ค้างอยู่ไหม (เรียกใช้ตอนเปิดหน้าเว็บ)
async function checkExistingSession() {
  const saved = localStorage.getItem('oma_session');
  if (!saved) return; // ไม่มี session เดิม ให้แสดงหน้า login ตามปกติ
  
  try {
    const { email, password } = JSON.parse(saved);
    
    const response = await fetch(AUTH_API_ENDPOINT, {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const result = await response.json();
    
    if (result.success) {
      // Session ยังใช้ได้ -> ข้ามหน้า Login ไปเลย
      const loginWindow = document.getElementById('login-window');
      if (loginWindow) loginWindow.remove();
      document.getElementById('portal-workspace').style.display = 'block';
      buildPortalUI(result.menus);
    } else {
      // รหัสผ่านอาจถูกเปลี่ยน หรือสิทธิ์ถูกถอน -> ล้าง session เก่าทิ้ง
      localStorage.removeItem('oma_session');
    }
  } catch (err) {
    // เชื่อมต่อไม่ได้ ก็ปล่อยให้แสดงหน้า login ตามปกติไปก่อน
    console.warn('ไม่สามารถตรวจสอบ session เดิมได้:', err);
  }
}

// 🔓 ฟังก์ชัน Logout
function logoutUser() {
  localStorage.removeItem('oma_session');
  location.reload(); // รีเฟรชหน้าใหม่ทั้งหมด กลับไปหน้า Login
}

// เรียกเช็ค session ทันทีที่หน้าเว็บโหลดเสร็จ
document.addEventListener('DOMContentLoaded', checkExistingSession);