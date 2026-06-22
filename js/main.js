// ฟังก์ชันสลับหน้าโมดูล
function switchModule(targetId, element, title) {
  // ลบคลาสแอคทีฟจากปุ่มเมนูและเซกชันเดิมทั้งหมด
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
  
  // เปิดการทำงานให้เมนูและเซกชันใหม่
  if(element) element.classList.add('active');
  
  const targetSection = document.getElementById(targetId);
  if(targetSection) {
    targetSection.classList.add('active');
  }
  
  document.getElementById('pageTitle').innerText = title;
  
  // ซ่อน/แสดงกล่องค้นหาบน Topbar เฉพาะหน้าโครงการหลัก
  const topbarFilter = document.getElementById('topbarFilter');
  if (topbarFilter) {
    topbarFilter.style.display = (targetId === 'sec-projects-dash') ? 'flex' : 'none';
  }
}

// ฟังก์ชันย่อขยายแถบเมนูด้านข้าง
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  if(sidebar) sidebar.classList.toggle('collapsed');
}

// ==========================================
// --- UI CONTROLS (Sidebar & Sections) ---
// ==========================================

// ฟังก์ชันย่อ/ขยาย Sidebar หลัก
window.toggleSidebar = function() { 
  document.getElementById('sidebar').classList.toggle('collapsed'); 
};

// ฟังก์ชันเปิด/ปิด เมนูลูก (Submenu)
window.toggleSub = function(subId, element) {
  const subMenu = document.getElementById(subId);
  const arrow = element.querySelector('.nav-arrow');
  const isOpen = subMenu.classList.contains('open');

  document.querySelectorAll('.nav-sub').forEach(el => el.classList.remove('open'));
  document.querySelectorAll('.nav-arrow').forEach(el => el.style.transform = 'rotate(0deg)');

  if (!isOpen) {
    subMenu.classList.add('open');
    if(arrow) arrow.style.transform = 'rotate(180deg)';
  }
};

// ฟังก์ชันหลักในการสลับหน้าจอเว็บแอป
window.loadPage = function(sectionId, element, customTitle = null) {
  // 1. จัดการแถบ Active ในเมนู Sidebar
  document.querySelectorAll('.nav-item').forEach(a => a.classList.remove('active'));
  document.querySelectorAll('.nav-sub-item').forEach(a => a.classList.remove('active'));
  
  if(element) {
    element.classList.add('active');
    if(element.classList.contains('nav-sub-item')) {
       element.closest('.nav-sub').previousElementSibling.classList.add('active');
    } else {
       document.querySelectorAll('.nav-sub').forEach(el => el.classList.remove('open'));
       document.querySelectorAll('.nav-arrow').forEach(el => el.style.transform = 'rotate(0deg)');
    }
  }

  // 2. ซ่อนทุกหน้า และแสดงเฉพาะหน้าที่เลือก
  document.querySelectorAll('.page-section').forEach(sec => {
    sec.classList.remove('active');
    sec.style.display = 'none'; 
  });
  
  const targetSec = document.getElementById(sectionId);
  if(targetSec) {
    targetSec.classList.add('active');
    targetSec.style.display = 'block'; 
  }

  // 3. เปลี่ยนหัวข้อหน้าจอหลัก (Title)
  const pageMeta = {
    'sec-projects-dash': { title: 'ข้อมูลโครงการ (Project Info)' },
    'sec-finance-dash': { title: 'การเงิน (Finance)' },
    'sec-wbs-dash': { title: 'ความคืบหน้า (Work Progress)' },
    'sec-assets-dash': { title: 'อุปกรณ์โครงการ (Assets)' },
    'sec-vehicles-dash': { title: 'รถ (Vehicle)' },
    'sec-kpi-dash': { title: 'KPI Dashboard' },
    'sec-solar-dash': { title: 'Solar Monitoring' },
  };

  let meta = pageMeta[sectionId] || { title: customTitle || 'อยู่ระหว่างพัฒนา' };
  if(document.getElementById('pageTitle')) document.getElementById('pageTitle').innerText = meta.title;

  // 4. ซ่อน/แสดง กล่องค้นหาและ Dropdown บน Topbar (แสดงเฉพาะหน้าแรกโครงการ)
  const filterGroup = document.getElementById('topbarFilter');
  if (filterGroup) {
    filterGroup.style.display = (sectionId === 'sec-projects-dash') ? 'flex' : 'none'; 
  }

  // 5. โหลดข้อมูลตามหน้าที่เรียกใช้งานแบบ Dynamic
  if(sectionId === 'sec-projects-dash' && typeof fetchDashboardData === 'function') {
    fetchDashboardData();
  }
  if(sectionId === 'sec-kpi-dash' && typeof initKpiSystem === 'function') {
    setTimeout(() => { initKpiSystem(); }, 100);
  }
  if (sectionId === 'sec-impact-glass' && typeof initImpactGlass === 'function') {
    setTimeout(function() { initImpactGlass(); }, 100);
  }
};