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
    
    // 1. วาดปุ่มเมนูใน Sidebar
    const navLink = document.createElement('a');
    navLink.href = "javascript:void(0)";
    navLink.className = `nav-item ${isDefault ? 'active' : ''}`;
    navLink.innerHTML = `<span class="nav-icon"><i class="bi ${menu.icon}"></i></span><span class="nav-label">${menu.label}</span>`;
    navLink.onclick = function() { switchModule(menu.id, this, menu.label); };
    navContainer.appendChild(navLink);
    
    // 2. วาดเซกชันเนื้อหา
    const section = document.createElement('section');
    section.id = menu.id;
    section.className = `page-section ${isDefault ? 'active' : ''}`;
    
    if (menu.isIframe) {
      section.style.height = '100%';
      section.innerHTML = `
        <div style="width: 100%; height: calc(100vh - var(--topbar-h) - 48px); background: white; border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; box-shadow: var(--shadow-sm);">
          <iframe src="${menu.src}" style="width: 100%; height: 100%; border: none;"></iframe>
        </div>`;
    } else {
      // 🚀 หน้าแดชบอร์ดโครงการหลักชุดเต็มตามรูปแบบเดิมของคุณ 100%
      section.innerHTML = `
        <div class="section-header">
          <div><div class="section-title text-gray-800">เจาะลึกตามประเภทโครงการ</div></div>
        </div>

        <div class="stat-grid-5" id="dashboardCards"></div>

        <div style="display:grid; grid-template-columns:1fr 1fr; grid-template-rows:auto auto; gap:20px; margin-bottom:24px;">
          <div class="card" style="grid-column: 1 / -1; width: 100%;">
            <div class="card-header">
              <div><div class="card-title" id="eventTimelineTitle">Project Event</div><div class="card-sub">จำนวนโครงการแยกตามเดือนและสถานะ</div></div>
            </div>
            <div class="card-body"><div style="position:relative; height:240px; width:100%;"><canvas id="warrantyChart"></canvas></div></div>
          </div>

          <div class="card" style="grid-column: 1 / -1; width: 100%;">
            <div class="card-header">
              <div><div class="card-title">Project Value Trend (ExVat)</div><div class="card-sub">มูลค่าโครงการประเภท Maintenance</div></div>
            </div>
            <div class="card-body">
              <div id="valueTrendLegend" style="display:flex; flex-wrap:wrap; gap:12px; margin-bottom:12px; font-size:12px;"></div>
              <div style="position:relative; height:210px; width:100%;"><canvas id="valueTrendChart"></canvas></div>
            </div>
          </div>

          <div class="card" style="grid-column: 1 / -1; width: 100%;">
            <div class="card-header">
              <div><div class="card-title">Project Timeline (Gantt)</div><div class="card-sub">ระยะเวลาสัญญาโครงการ</div></div>
            </div>
            <div class="card-body" style="padding:0;">
              <div id="ganttContainer" style="width: 100%; min-width: 800px;"></div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div><div class="card-title">Project List</div><div class="card-sub">ข้อมูลโครงการทั้งหมด</div></div>
            <button class="btn btn-outline" style="font-size: 12px; padding: 6px 14px; border: 1px solid var(--border); background: var(--bg); border-radius: 6px; cursor: pointer; color: var(--text-2); font-weight: 600;" onclick="renderProjectTable(window.globalProjectData)">แสดงทั้งหมด</button>
          </div>
          <div class="table-wrap">
            <table id="projectTable">
              <thead>
                <tr><th>Customer</th> <th>ContractNo</th> <th>ProjectName</th> <th>RefCode</th> <th>Handover</th> <th>ContractStart</th> <th>ContractEnd</th> <th>ContractPeriod</th> <th>ProjectValue(ExVat)</th> <th>ContractInfo</th> <th>PM</th> <th>StatusOfContract</th><th>ClosedDate</th> </tr>
              </thead>
              <tbody id="projectTableBody"></tbody>
            </table>
          </div>
        </div>
      `;
      
      // เรียกใช้ระบบ Engine ประมวลผลและวาดกราฟทันทีหลังสร้างหน้าจอเสร็จ
      if (typeof initProjectDashboard === 'function') {
        setTimeout(initProjectDashboard, 50);
      }
    }
    
    mainContainer.appendChild(section);
    if(isDefault) {
      document.getElementById('pageTitle').innerText = menu.label;
      const filterGroup = document.getElementById('topbarFilter');
      if (filterGroup && menu.id === 'sec-projects-dash') filterGroup.style.display = 'flex';
    }
  });
}