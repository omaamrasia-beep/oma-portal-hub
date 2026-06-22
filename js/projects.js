// ⚠️ ใส่ URL Web App ข้อมูลโครงการที่ได้จาก ส่วนที่ 1 ตรงนี้
const PROJECT_API_ENDPOINT = "https://script.google.com/macros/s/AKfycby9rcg2XpKlEjftsexNZCx8InupiBBN71aEHGRdKVEcp_og7-CzP5qwzMLfDUJfUwPzcA/exec"; 

window.currentFilters = window.currentFilters || { year: 'All', customer: 'All', type: 'All', refCode: '', pm: 'All', status: 'Active' };
window.globalProjectData = []; 
let durationGaugeInstance = null;
let warrantyChartInstance = null;
let valueTrendChartInstance = null;

/**
 * ฟังก์ชันหลักในการเปิดใช้งานหน้าโครงการ (ถูกเรียกอัตโนมัติจากระบบสิทธิ์)
 */
function initProjectDashboard() {
  Chart.defaults.font.family = "'Bai Jamjuree', sans-serif";
  fetchDashboardData();
}

/**
 * ดึงข้อมูลโครงการแบบ Real-time จาก Apps Script API
 */
async function fetchDashboardData() {
  if(window.globalProjectData.length > 0) return; 

  try {
    const response = await fetch(PROJECT_API_ENDPOINT);
    const result = await response.json();
    
    if (result.success) {
      // เอาข้อมูลโครงการไปเก็บในตัวแปร Global ตามลอจิกเดิมของคุณ
      window.globalProjectData = result.projects;
      
      // ส่งข้อมูลการแจ้งเตือนสัญญาไปเก็บบนระบบ (ถ้ามีโมดูลแจ้งเตือนรองรับ)
      if (result.alerts && typeof window.loadContractAlertsToPanel === 'function') {
        window.loadContractAlertsToPanel(result.alerts);
      }
      
      // เรียกลอจิกการทำ Dropdown และฟิลเตอร์ดั้งเดิมของคุณทำงานต่อทันที
      populateDropdowns(window.globalProjectData);
      
      const yearEl = document.getElementById('filterYear');
      if(yearEl) window.currentFilters.year = yearEl.value;
      const custEl = document.getElementById('filterCustomer');
      if(custEl) window.currentFilters.customer = custEl.value;
      const pmEl = document.getElementById('filterPM');
      if(pmEl) window.currentFilters.pm = pmEl.value;
      const statusEl = document.getElementById('filterStatus');
      window.currentFilters.status = statusEl ? statusEl.value : 'Active'; 
      
      applyAllFilters();
    } else {
      alert("ดึงข้อมูลโครงการไม่สำเร็จ: " + result.message);
    }
  } catch (err) {
    console.error(err);
    alert("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูลโครงการหลัก");
  }
}

// ==========================================
// คัดลอกฟังก์ชันประมวลผลดั้งเดิมทั้งหมดของคุณมาวางต่อตรงนี้ได้เลยครับ
// = "populateDropdowns(data)"
// - "handleSearch()", "applyCascadingFilter()", "clearAllFilters()", "filterTableByType()"
// - "applyAllFilters()", "renderFilterChips()", "renderDashboardCards()", "handleCardClick()"
// - "renderWarrantyChart()", "renderProjectTable()", "renderValueTrendChart()", "renderGanttChart()"
// - "parseDate()", "getStatusTheme()", "calculateDynamicStatus()"
// ==========================================

// ==========================================
// --- 2. SETUP DROPDOWN ---
// ==========================================
function populateDropdowns(data) {
  let minYear = null;
  let maxYear = null;
  const customers = new Set();
  const pms = new Set();
  const statuses = new Set();

  data.forEach(p => {
    const sDate = parseDate(p.ContractStartDate);
    const eDate = parseDate(p.ContractEndDate);
    
    if (sDate) {
      const y = sDate.getFullYear();
      if (!minYear || y < minYear) minYear = y;
      if (!maxYear || y > maxYear) maxYear = y;
    }
    if (eDate) {
      const y = eDate.getFullYear();
      if (!minYear || y < minYear) minYear = y;
      if (!maxYear || y > maxYear) maxYear = y;
    }
    if (p.Customer && p.Customer.trim() !== '') customers.add(p.Customer.trim());
    if (p.ProjectManagement && p.ProjectManagement.trim() !== '') pms.add(p.ProjectManagement.trim());
    if (p.StatusOfContract && p.StatusOfContract.trim() !== '') statuses.add(p.StatusOfContract.trim());
  });

  const yearEl = document.getElementById('filterYear');
  if (yearEl) {
    yearEl.innerHTML = '<option value="All">All</option>';
    if (minYear && maxYear) {
      for (let y = maxYear; y >= minYear; y--) {
        const opt = document.createElement('option');
        opt.value = y.toString();
        opt.textContent = y;
        yearEl.appendChild(opt);
      }
    }
  }

  const custEl = document.getElementById('filterCustomer');
  if (custEl) {
    custEl.innerHTML = '<option value="All">All</option>';
    Array.from(customers).sort().forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      custEl.appendChild(opt);
    });
  }

  const pmEl = document.getElementById('filterPM');
  if (pmEl) {
    pmEl.innerHTML = '<option value="All">All</option>';
    Array.from(pms).sort().forEach(pm => {
      const opt = document.createElement('option');
      opt.value = pm;
      opt.textContent = pm;
      pmEl.appendChild(opt);
    });
  }

  const statusEl = document.getElementById('filterStatus');
  if (statusEl) {
    statusEl.innerHTML = '<option value="All">All</option>';
    Array.from(statuses).sort().forEach(st => {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      statusEl.appendChild(opt);
    });
    // ล็อคค่าเริ่มต้นหน้า UI ให้เป็น Active
    statusEl.value = 'Active'; 
  }
}

// ==========================================
// --- 3. TRIGGER FUNCTIONS ---
// ==========================================

// เมื่อผู้ใช้พิมพ์ในช่องค้นหา (Real-time Search)
window.handleSearch = function() {
  window.currentFilters.refCode = document.getElementById('searchInput')?.value || '';
  applyAllFilters();
};

// เมื่อผู้ใช้เปลี่ยน Dropdown ใน Filter Panel
window.applyCascadingFilter = function() {
  window.currentFilters.year = document.getElementById('filterYear')?.value || 'All';
  window.currentFilters.customer = document.getElementById('filterCustomer')?.value || 'All';
  window.currentFilters.pm = document.getElementById('filterPM')?.value || 'All';
  window.currentFilters.status = document.getElementById('filterStatus')?.value || 'Active';
  applyAllFilters();
};

// เมื่อผู้ใช้กดปุ่ม ล้างทั้งหมด
window.clearAllFilters = function() {
  if (document.getElementById('filterYear')) document.getElementById('filterYear').value = "All";
  if (document.getElementById('filterCustomer')) document.getElementById('filterCustomer').value = "All";
  if (document.getElementById('filterPM')) document.getElementById('filterPM').value = "All";
  if (document.getElementById('filterStatus')) document.getElementById('filterStatus').value = "Active"; // บังคับกลับไปที่ Active
  if (document.getElementById('searchInput')) document.getElementById('searchInput').value = "";
  
  window.currentFilters = { year: 'All', customer: 'All', type: 'All', refCode: '', pm: 'All', status: 'Active' };
  applyAllFilters();
};

// เมื่อผู้ใช้กดการ์ด (Project Type)
window.filterTableByType = function(type) {
  window.currentFilters.type = type;
  applyAllFilters();
  const tableEl = document.getElementById('projectTable');
  if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// ==========================================
// --- 4. MASTER CONTROLLER ---
// ==========================================
window.applyAllFilters = function() {
  let data = window.globalProjectData.map(p => ({...p}));

  // กำหนดค่า Default ป้องกันค่าเป็น undefined เพื่อไม่ให้ข้อมูลหาย
  const year = window.currentFilters.year || 'All';
  const customer = window.currentFilters.customer || 'All';
  const refCode = window.currentFilters.refCode || '';
  const type = window.currentFilters.type || 'All';
  const pm = window.currentFilters.pm || 'All';
  const status = window.currentFilters.status || 'Active';

  // 1. กรองตาม "ปี"
  if (year !== 'All') {
    data = data.filter(p => {
      const sY = parseDate(p.ContractStartDate)?.getFullYear().toString();
      const eY = parseDate(p.ContractEndDate)?.getFullYear().toString();
      const hY = parseDate(p.HandoverDate)?.getFullYear().toString();
      
      let isActiveInYear = false;
      const start = parseDate(p.ContractStartDate);
      const end = parseDate(p.ContractEndDate);
      if (start && end && start.getFullYear() <= parseInt(year) && end.getFullYear() >= parseInt(year)) {
        isActiveInYear = true;
      }
      return sY === year || eY === year || hY === year || isActiveInYear;
    });
    
    if (typeof calculateDynamicStatus === 'function') {
      data.forEach(p => p.StatusofProject = calculateDynamicStatus(p, year));
    }
  }

  // 2. กรองตาม "ลูกค้า"
  if (customer !== 'All') {
    data = data.filter(p => p.Customer && p.Customer.trim() === customer);
  }

  // 3. กรองตาม "Project Manager"
  if (pm !== 'All') {
    data = data.filter(p => p.ProjectManagement && p.ProjectManagement.trim() === pm);
  }

  // 4. กรองตาม "Project Status" (รองรับความคลาดเคลื่อนของตัวพิมพ์เล็ก-ใหญ่)
  if (status !== 'All') {
    data = data.filter(p => {
      const currentStatus = (p.StatusOfContract || p.StatusofContract || "").toString().trim().toLowerCase();
      return currentStatus === status.toLowerCase();
    });
  }

  // 5. กรองตาม "ช่องค้นหา (Search)"
  if (refCode) {
    const keyword = refCode.toLowerCase();
    data = data.filter(p => 
      (p.ProjectName && p.ProjectName.toLowerCase().includes(keyword)) || 
      (p.RefCode && p.RefCode.toLowerCase().includes(keyword)) ||
      (p.RefProject && p.RefProject.toLowerCase().includes(keyword))
    );
  }

  if (typeof renderDashboardCards === 'function') renderDashboardCards(data);

  // 6. กรองตาม "ประเภท (Type)"
  let finalData = data;
  if (type !== 'All') {
    finalData = data.filter(item => (item.ProjectType || "").includes(type));
  }

  renderFilterChips();

  if (typeof renderWarrantyChart === 'function') renderWarrantyChart(finalData);
  if (typeof renderValueTrendChart === 'function') renderValueTrendChart(finalData);
  if (typeof renderGanttChart === 'function') renderGanttChart(finalData);
  if (typeof renderProjectTable === 'function') renderProjectTable(finalData);
  
  if (typeof renderDurationGauge === 'function') {
    renderDurationGauge(refCode || ''); 
  }
};

// ฟังก์ชันเสริมสำหรับวาดแท็ก (Chips) ใต้ Topbar
function renderFilterChips() {
  const container = document.getElementById('filterChipsContainer');
  if (!container) return;
  
  const { year, customer, refCode, type, pm, status } = window.currentFilters;
  let chips = [];
  
  if (year !== 'All') chips.push(`ปี: ${year}`);
  if (customer !== 'All') chips.push(`ลูกค้า: ${customer}`);
  if (pm !== 'All') chips.push(`PM: ${pm}`);
  if (status !== 'All') chips.push(`สถานะ: ${status}`);
  if (refCode) chips.push(`ค้นหา: ${refCode}`);
  if (type !== 'All') chips.push(`ประเภท: ${type}`);

  if (chips.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = chips.map(c => `
    <span style="display:inline-flex; align-items:center; padding: 4px 12px; background: #fff; border: 1px solid rgba(214, 40, 40, 0.2); color: #D62828; border-radius: 20px; font-size: 11px; font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin-right: 6px; margin-bottom: 6px;">
      ${c}
    </span>`).join('');
  
  html += `<button onclick="clearAllFilters()" style="background:transparent; border:none; color:#566573; font-size:11px; font-weight:600; cursor:pointer; text-decoration:underline;">ล้างทั้งหมด</button>`;
  
  container.innerHTML = html;
}

function renderDashboardCards(data) {
  const cardsContainer = document.getElementById('dashboardCards');
  if (!cardsContainer) return;

  // 1. ถ้ายังไม่มีการเลือก ให้ตั้งค่าเริ่มต้นเป็น 'All' ไว้ที่คอนเทนเนอร์
  if (!cardsContainer.dataset.selected) {
    cardsContainer.dataset.selected = 'All';
  }
  
  // ดึงค่าปัจจุบันที่เลือกไว้ออกมาเช็ค
  const currentSelected = cardsContainer.dataset.selected;

  let activeData = data.filter(item => (item.StatusofProject || "").toString().toLowerCase() !== 'end' && !(item.StatusofProject || "").toString().toLowerCase().includes('close'));
  const count = (type) => activeData.filter(i => (i.ProjectType || "").includes(type)).length;

  // 2. ฟังก์ชันเช็คเพื่อใส่คลาส active-selected ให้ตรงกับการ์ดที่เลือกอยู่
  const getActive = (type) => currentSelected === type ? 'active-selected' : '';

  cardsContainer.innerHTML = `
    <div class="stat-card red ${getActive('All')}" onclick="handleCardClick('All')">
      <div class="stat-icon red"><i class="bi bi-collection-fill"></i></div>
      <div class="stat-label">โครงการทั้งหมด (Active)</div>
      <div class="stat-value red">${activeData.length}</div>
    </div>
    <div class="stat-card cyan ${getActive('Maintenance')}" onclick="handleCardClick('Maintenance')">
      <div class="stat-icon cyan"><i class="bi bi-wrench-adjustable"></i></div>
      <div class="stat-label">Maintenance</div>
      <div class="stat-value cyan">${count("Maintenance")}</div>
    </div>
    <div class="stat-card violet ${getActive('Warranty')}" onclick="handleCardClick('Warranty')">
      <div class="stat-icon violet"><i class="bi bi-shield-check"></i></div>
      <div class="stat-label">Warranty</div>
      <div class="stat-value violet">${count("Warranty")}</div>
    </div>
    <div class="stat-card pink ${getActive('Investment')}" onclick="handleCardClick('Investment')">
      <div class="stat-icon pink"><i class="bi bi-graph-up-arrow"></i></div>
      <div class="stat-label">Investment</div>
      <div class="stat-value pink">${count("Investment")}</div>
    </div>
  `;
}

function handleCardClick(type) {
  const cardsContainer = document.getElementById('dashboardCards');
  if (cardsContainer) {
    // บันทึกค่าที่เลือกลงใน dataset ของคอนเทนเนอร์
    cardsContainer.dataset.selected = type;
  }

  // ดึงข้อมูลฐานข้อมูลหลักจากระบบ
  const rawData = window.globalProjectData || [];

  // 1. กรองข้อมูลเฉพาะโครงการที่ Active (ไม่เป็น end หรือ close) เหมือนเงื่อนไขของการ์ด
  let filteredData = rawData.filter(item => 
    (item.StatusofProject || "").toString().toLowerCase() !== 'end' && 
    !(item.StatusofProject || "").toString().toLowerCase().includes('close')
  );

  // 2. ถ้าไม่ได้เลือก 'All' ให้กรองประเภทข้อมูลตามการ์ดที่ถูกคลิกเพิ่ม
  if (type !== 'All') {
    filteredData = filteredData.filter(item => 
      (item.ProjectType || "").includes(type)
    );
  }

  // 3. สั่ง Re-render การ์ดแดชบอร์ดเพื่อให้ขอบสีแดงย้ายตามตัวที่คลิก
  if (typeof renderDashboardCards === 'function') {
    renderDashboardCards(rawData);
  }

  // 4. อัปเดตข้อมูลใน Warranty Chart (Project Even) ให้สัมพันธ์ตามประเภทที่เลือก
  if (typeof renderWarrantyChart === 'function') {
    renderWarrantyChart(filteredData);
  }

  // 5. อัปเดตข้อมูลใน Gantt Chart ให้สัมพันธ์กันไปด้วย
  if (typeof renderGanttChart === 'function') {
    renderGanttChart(filteredData);
  }

  // 6. อัปเดตตารางรายชื่อโครงการด้านล่างสุด
  if (typeof renderProjectTable === 'function') {
    renderProjectTable(filteredData);

}
}

// ==========================================
// 1. ฟังก์ชัน Project Events 
// ==========================================
function renderWarrantyChart(dataToRender) {
  const canvas = document.getElementById('warrantyChart');
  if(!canvas) return;

  // 1. หาช่วงปีแบบ Dynamic จากข้อมูลจริงที่ถูกส่งเข้ามา (แก้ปัญหาข้อมูลปีอื่นไม่แสดง)
  let minYear = new Date().getFullYear();
  let maxYear = minYear;

  const validYears = [];
  dataToRender.forEach(item => {
    const h = typeof parseDate === 'function' ? parseDate(item.HandoverDate) : new Date(item.HandoverDate);
    const e = typeof parseDate === 'function' ? parseDate(item.ContractEndDate) : new Date(item.ContractEndDate);
    const c = typeof parseDate === 'function' ? parseDate(item.ClosedProjectDate) : new Date(item.ClosedProjectDate);
    
    if (h && !isNaN(h.getTime())) validYears.push(h.getFullYear());
    if (e && !isNaN(e.getTime())) validYears.push(e.getFullYear());
    if (c && !isNaN(c.getTime())) validYears.push(c.getFullYear());
  });

  if (validYears.length > 0) {
    minYear = Math.min(...validYears);
    maxYear = Math.max(...validYears);
  }

  const titleEl = document.getElementById('eventTimelineTitle');
  if (titleEl) {
    titleEl.innerText = minYear === maxYear ? `Project Even (${minYear})` : `Project Even 2026`;
  }

  // 2. สร้าง Labels แกน X
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const labels = [];
  const totalMonths = (maxYear - minYear + 1) * 12;
  
  for (let y = minYear; y <= maxYear; y++) {
    for (let m = 0; m < 12; m++) {
      labels.push(`${monthNames[m]} ${y}`);
    }
  }

  // หาค่าตำแหน่งเดือนเริ่มต้นสําหรับแสดงผลหน้าแรก (ปีปัจจุบัน)
  const currentYear = new Date().getFullYear();
  const defaultYear = Math.max(minYear, Math.min(currentYear, maxYear));
  const defaultStartIndex = (defaultYear - minYear) * 12;

  // 3. จัดการ DOM และ Scroll bar แนวนอนด้านล่างกราฟ
  const parentEl = canvas.parentElement;
  parentEl.style.overflow = 'visible'; 
  canvas.style.width = '100%'; 
  canvas.style.maxHeight = 'calc(100% - 25px)';
  
  if (parentEl.clientHeight < 100) { 
    parentEl.style.height = '400px'; 
  }

  const oldInner = document.getElementById('warrantyChartInner');
  if (oldInner) {
    parentEl.insertBefore(canvas, oldInner);
    oldInner.remove();
  }

  let scrollContainer = document.getElementById('warrantyScrollContainer');
  if (!scrollContainer) {
    scrollContainer = document.createElement('div');
    scrollContainer.id = 'warrantyScrollContainer';
    scrollContainer.style.overflowX = 'hidden';
    scrollContainer.style.width = '100%';
    scrollContainer.style.marginTop = '10px';

    const dummyContent = document.createElement('div');
    dummyContent.id = 'warrantyScrollContent';
    dummyContent.style.height = '1px';

    scrollContainer.appendChild(dummyContent);
    parentEl.appendChild(scrollContainer);

    scrollContainer.addEventListener('scroll', function() {
      const maxStartIndex = totalMonths - 12;
      const startIndex = Math.round(scrollPercent * maxStartIndex);

      if (window.warrantyChartInstance) {
        window.warrantyChartInstance.options.scales.x.min = startIndex;
        // ตัด Math.min() ออก และล็อคจุดสิ้นสุดให้เป็น startIndex + 11 เสมอ
        window.warrantyChartInstance.options.scales.x.max = startIndex + 11; 
        window.warrantyChartInstance.update();
      }
    });
  }

  const dummyContent = document.getElementById('warrantyScrollContent');
  if (totalMonths > 12) {
    scrollContainer.style.display = 'block';
    const ratio = totalMonths / 12;
    dummyContent.style.width = `${ratio * 100}%`;
    setTimeout(() => {
      const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
      const scrollPercent = defaultStartIndex / (totalMonths - 12);
      scrollContainer.scrollLeft = maxScroll * scrollPercent;
    }, 10);
  } else {
    scrollContainer.style.display = 'none';
  }

  // 4. สร้างโครงสร้างข้อมูลสำหรับ Dataset กราฟแท่ง
  let dsHandover = { label: 'New Contract', data: new Array(totalMonths).fill(0), backgroundColor: '#10B981', stack: 'Stack 0', borderRadius: 4 };
  let dsEnd = { label: 'End of Contract', data: new Array(totalMonths).fill(0), backgroundColor: '#F9A825', stack: 'Stack 0', borderRadius: 4 };
  let dsClosed = { label: 'Closed', data: new Array(totalMonths).fill(0), backgroundColor: '#64748B', stack: 'Stack 0', borderRadius: 4 };

  // 5. นับจํานวนข้อมูลแยกสล็อตรายเดือน
  dataToRender.forEach(item => {
    let eDate = typeof parseDate === 'function' ? parseDate(item.ContractEndDate) : new Date(item.ContractEndDate);
    let hDate = typeof parseDate === 'function' ? parseDate(item.HandoverDate) : new Date(item.HandoverDate);
    let cDate = typeof parseDate === 'function' ? parseDate(item.ClosedProjectDate) : new Date(item.ClosedProjectDate);

    if (hDate && hDate.getFullYear() >= minYear && hDate.getFullYear() <= maxYear) {
      let idx = (hDate.getFullYear() - minYear) * 12 + hDate.getMonth();
      dsHandover.data[idx]++;
    }
    if (eDate && eDate.getFullYear() >= minYear && eDate.getFullYear() <= maxYear) {
      let idx = (eDate.getFullYear() - minYear) * 12 + eDate.getMonth();
      dsEnd.data[idx]++;
    }
    if (cDate && cDate.getFullYear() >= minYear && cDate.getFullYear() <= maxYear) {
      let idx = (cDate.getFullYear() - minYear) * 12 + cDate.getMonth();
      dsClosed.data[idx]++;
    }
  });

  let datasets = [dsHandover, dsEnd, dsClosed].filter(ds => ds.data.some(v => v > 0));

  if (window.warrantyChartInstance) window.warrantyChartInstance.destroy();

  window.warrantyChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'bar', 
    data: { labels: labels, datasets: datasets },
    options: { 
      responsive: true, 
      maintainAspectRatio: false, 
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
      scales: { 
        x: { 
          stacked: true, 
          grid: { display: false },
          min: defaultStartIndex, 
          max: defaultStartIndex + 11 
        },
        y: { 
          stacked: true, 
          ticks: { stepSize: 1 }, 
          border: { display: false } 
        } 
      },
      onClick: (event, elements) => {
        if (elements.length > 0) {
          const dsIndex = elements[0].datasetIndex;
          const dataIndex = elements[0].index; 
          const clickedEvent = datasets[dsIndex].label;

          const clickedYear = minYear + Math.floor(dataIndex / 12);
          const clickedMonth = dataIndex % 12;

          let filteredTable = dataToRender.filter(item => {
            let d;
            if (clickedEvent === 'New Contract') d = typeof parseDate === 'function' ? parseDate(item.HandoverDate) : new Date(item.HandoverDate);
            else if (clickedEvent === 'End of Contract') d = typeof parseDate === 'function' ? parseDate(item.ContractEndDate) : new Date(item.ContractEndDate);
            else if (clickedEvent === 'Closed') d = typeof parseDate === 'function' ? parseDate(item.ClosedProjectDate) : new Date(item.ClosedProjectDate);
            
            return d && d.getFullYear() === clickedYear && d.getMonth() === clickedMonth;
          });
          
          // สั่งอัปเดตตารางรายชื่อโครงการ
          if (typeof renderProjectTable === 'function') {
            renderProjectTable(filteredTable);
            const tableEl = document.getElementById('projectTable');
            if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          // สั่งอัปเดตเส้น Gantt Chart ให้กรองตามเงื่อนไขที่คลิกไปพร้อมกัน
          if (typeof renderGanttChart === 'function') {
            renderGanttChart(filteredTable);
          }
        } else { 
          // กรณีคลิกที่ว่างในกราฟ ให้เคลียร์กลับไปแสดงผลข้อมูลตั้งต้นตามฟิลเตอร์เดิม
          if (typeof renderProjectTable === 'function') {
            renderProjectTable(dataToRender); 
          }
          if (typeof renderGanttChart === 'function') {
            renderGanttChart(dataToRender); 
          }
        }
      }
    }
  });
}

function updateGanttLayout(isFiltered) {
  const wrapper = document.getElementById('ganttWrapper');
  const gauge = document.getElementById('durationGaugeContainer');
  
  if (isFiltered) {
    // ถ้ามีการ Filter หรือเลือกประเภท: ให้ Gantt แสดงเต็มจอ
    wrapper.className = 'gantt-full-mode';
  } else {
    // ถ้าแสดงทั้งหมด (All): ให้กลับไปแสดง 2 คอลัมน์
    wrapper.className = 'gantt-grid-mode';
  }
}
// ==========================================
// 2. ฟังก์ชันเลือกแถวในตาราง: แก้ไขให้เชื่อมโยงกับ Gauge แม่นยำขึ้น
// ==========================================
window.selectProjectFromTable = function(event, refId) {
    if (event) event.stopPropagation(); 
    if (!refId) return;
    
    let target = refId.toString().trim();
    let select = document.getElementById('projectSelect');
    
    // พยายามซิงค์ค่ากับ Dropdown ชื่อโครงการ (ถ้ามี)
    if (select) {
      for(let i = 0; i < select.options.length; i++) {
        if(select.options[i].value.trim() === target) { 
          select.selectedIndex = i; 
          break; 
        }
      }
    }
    
    // บังคับอัปเดต State กลาง แล้วสั่ง Render ใหม่ทั้งหมด (รวมถึง Gauge)
    window.currentFilters.refCode = target;
    applyAllFilters();
    
    // เลื่อนหน้าจอไปที่กราฟ Gauge
    const gaugeEl = document.getElementById('durationGauge');
    if (gaugeEl) gaugeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
};


function renderProjectTable(dataArray) {
  const tbody = document.getElementById('projectTableBody');
  if(!tbody) return;
  tbody.innerHTML = ''; 

  // 1. จัดการตารางให้ล็อคความกว้าง และให้ข้อความปัดบรรทัด (ตัด Scroll Bar แนวนอน)
  const table = tbody.closest('table');
  if (table) {
    table.style.width = '100%';
    table.style.tableLayout = 'fixed'; // บังคับให้ตารางอยู่ในขอบเขตหน้าจอ
  }

  // กรณีไม่มีข้อมูล (เปลี่ยน colspan เป็น 13 ให้ตรงกับจำนวน <td> จริง)
  if(!dataArray || dataArray.length === 0) { 
    tbody.innerHTML = '<tr><td colspan="13" style="text-align:center; padding: 20px; font-family: \'Prompt\', sans-serif; color: var(--text-3);">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</td></tr>'; 
    return; 
  }

  // 2. เรียงลำดับข้อมูล HandoverDate จากล่าสุด (ใหม่สุด) ไปเก่าสุด
  const sortedData = [...dataArray].sort((a, b) => {
    // ใช้ parseDate แปลงวันที่เพื่อนำมาเทียบค่า หากแปลงไม่ได้ให้ค่าเป็น 0 (ไปอยู่ท้ายสุด)
    const dateA = typeof parseDate === 'function' && parseDate(a.HandoverDate) ? parseDate(a.HandoverDate).getTime() : 0;
    const dateB = typeof parseDate === 'function' && parseDate(b.HandoverDate) ? parseDate(b.HandoverDate).getTime() : 0;
    return dateB - dateA;
  });

  // ใช้ sortedData แทน dataArray ในการวนลูปสร้างตาราง
  sortedData.forEach(row => {
    let statusRaw = (row['StatusOfContract'] || "").trim();
    let theme = typeof getStatusTheme === 'function' ? getStatusTheme(statusRaw) : { class: '', color: '#000' };
    let refSafe = (row.RefCode || row.ProjectName || '').toString().replace(/'/g, "\\'").trim();
    
    if (statusRaw.toLowerCase() === 'end') {
      theme = { class: 'bg-gray-100', color: '#6B7280' };
    }
    
    let linkUrl = row.ContractInfo ? row.ContractInfo.toString().trim() : "";
    let actionHtml = linkUrl 
      ? `<a href="${linkUrl}" target="_blank" onclick="event.stopPropagation()" class="badge" style="background: var(--info-bg); color: var(--info); text-decoration: none; cursor: pointer;">ดูข้อมูล</a>` 
      : '-';

    // เพิ่ม style พื้นฐานให้เซลล์ เพื่อป้องกันข้อความยาวดันขอบตาราง
    const tdWrap = "word-wrap: break-word; white-space: normal; overflow-wrap: break-word;";

    tbody.innerHTML += `
      <tr onclick="typeof selectProjectFromTable === 'function' ? selectProjectFromTable(event, '${refSafe}') : null" style="cursor:pointer; border-bottom: 1px solid var(--border);" title="คลิกเพื่อดูกราฟความคืบหน้า">
        <td style="${tdWrap}">${row.Customer || '-'}</td>
        <td style="${tdWrap}">${row.ContractNo || '-'}</td>
        <td style="font-weight: 600; color: var(--navy); font-family: 'Bai Jamjuree', sans-serif; ${tdWrap}">${row.ProjectName || '-'}</td>
        <td style="${tdWrap}"><code style="background:var(--bg); padding:2px 5px; border-radius:3px; color:var(--navy); word-break: break-all;">${row.RefCode || '-'}</code></td>
        <td style="${tdWrap}">${row.HandoverDate || '-'}</td>
        <td style="${tdWrap}">${row.ContractStartDate || '-'}</td>
        <td style="${tdWrap}">${row.ContractEndDate || '-'}</td>
        <td style="${tdWrap}">${row['ContractPeriod(Month)'] || '-'}</td>
        <td style="text-align: right; ${tdWrap}">
          ${!isNaN(parseFloat(row['ProjectValue(ExVat)'])) ? parseFloat(row['ProjectValue(ExVat)']).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2}) : (row['ProjectValue(ExVat)'] || '-')}
        </td>
        <td style="text-align: center; ${tdWrap}">${actionHtml}</td>
        <td style="${tdWrap}">${row.ProjectManagement || '-'}</td>
        <td style="text-align: center; ${tdWrap}">
          <span class="badge ${theme.class}" style="background-color: ${theme.color}20; color: ${theme.color}; border: 1px solid ${theme.color}40; display: inline-block;">
            ${statusRaw || '-'}
          </span>
        </td>
        <td style="${tdWrap}">${row.ClosedProjectDate || '-'}</td>
      </tr>
    `;
  });
}

function renderValueTrendChart() {
  const canvas = document.getElementById('valueTrendChart');
  if (!canvas) return;

  const rawData = window.globalProjectData || [];

  // 1. กำหนดประเภทข้อมูลที่ต้องการแสดง
  const typeConfig = [
    { key: 'Maintenance',     color: '#06B6D4' },
    { key: 'Additional work', color: '#F97316' },
  ];
  const targetTypes = typeConfig.map(t => t.key);

  // 2. ดึงเฉพาะปีที่มีข้อมูลของประเภทที่กำหนดเท่านั้น
  const yearSet = new Set();
  rawData.forEach(p => {
    const pType = p.ProjectType || '';
    const hasTargetType = targetTypes.some(t => pType.includes(t));
    
    if (hasTargetType) {
      const y = parseDate(p.ContractStartDate)?.getFullYear();
      if (y) yearSet.add(y);
    }
  });
  const years = Array.from(yearSet).sort();

  // จัดการ Scroll bar แนวนอน
  const wrapper = canvas.parentElement;
  if (wrapper) {
    wrapper.style.overflowX = 'hidden';
    wrapper.style.overflowY = 'hidden';
    const minWidth = Math.max(years.length * 80, wrapper.clientWidth || 600);
    canvas.style.minWidth = `${minWidth}px`;
  }

  // 3. สร้าง Datasets
  const datasets = typeConfig.map(tc => {
    return {
      label: tc.key,
      data: years.map(y => {
        // กรองหาโปรเจกต์ของประเภทนั้นๆ ในปีนั้นๆ
        const filteredProjects = rawData.filter(p => {
          const py = parseDate(p.ContractStartDate)?.getFullYear();
          return py === y && (p.ProjectType || '').includes(tc.key);
        });

        // หากไม่มีโปรเจกต์เลย ให้คืนค่า null (กราฟจะไม่พล็อตจุดนี้) แทนที่จะเป็น 0
        if (filteredProjects.length === 0) {
          return null;
        }

        const total = filteredProjects.reduce((sum, p) => {
          const val = parseFloat((p['ProjectValue(ExVat)'] || '0').toString().replace(/,/g, ''));
          return sum + (isNaN(val) ? 0 : val);
        }, 0);
        
        return parseFloat((total / 1e6).toFixed(2));
      }),
      backgroundColor: tc.color + '33',
      borderColor: tc.color,
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.3,
      fill: false,
      hidden: false,
      spanGaps: true // <--- สำคัญ: สั่งให้เส้นเชื่อมต่อกันข้ามจุดที่เป็น null
    };
  });


  if (window.valueTrendChartInstance) window.valueTrendChartInstance.destroy();

  window.valueTrendChartInstance = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: { labels: years.map(String), datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} ล้านบาท`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { autoSkip: false } },
        y: { border: { display: false }, ticks: { callback: v => v + ' M' } }
      },
      onClick: (event, elements) => {
        if (!elements.length) return;
        const yearClicked = parseInt(years[elements[0].index]);
        const typeClicked = typeConfig[elements[0].datasetIndex].key;
        const filtered = window.globalProjectData.filter(p => {
          const py = parseDate(p.ContractStartDate)?.getFullYear();
          return py === yearClicked && (p.ProjectType || '').includes(typeClicked);
        });
        
        if (typeof renderProjectTable === 'function') {
            renderProjectTable(filtered);
            const tableEl = document.getElementById('projectTable');
            if (tableEl) tableEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    }
  });
}

function renderGanttChart(data) {
  const container = document.getElementById('ganttContainer');
  if (!container) return;
  if (!data || data.length === 0) {
    container.innerHTML = '<p style="padding:16px; color:#6B7280; font-size:13px;">ไม่พบข้อมูล</p>';
    return;
  }

  const parseLocal = (d) => {
    if (!d) return null;
    let dateObj = typeof parseDate === 'function' ? parseDate(d) : new Date(d);
    return isNaN(dateObj.getTime()) ? null : dateObj;
  };

  const formatDate = (d) => {
    if (!d) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
  };

  const getDuration = (s, e) => {
    if (!s || !e) return '';
    let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    let days = e.getDate() - s.getDate();
    if (days < 0) { months -= 1; days += 30; }
    if (months > 0 && days > 0 && days < 28) return `${months}M ${days}D`;
    if (months > 0) return `${months + (days >= 28 ? 1 : 0)}M`;
    return `${days}D`;
  };

  let minDate = null, maxDate = null;
  const validData = [];

  data.forEach(p => {
    const s = parseLocal(p.ContractStartDate);
    const e = parseLocal(p.ContractEndDate);
    if (s && e) {
      validData.push({ ...p, parsedStart: s, parsedEnd: e });
      if (!minDate || s < minDate) minDate = new Date(s);
      if (!maxDate || e > maxDate) maxDate = new Date(e);
    }
  });

  if (!minDate || !maxDate || validData.length === 0) {
    container.innerHTML = '<p style="padding:16px; color:#6B7280;">ไม่พบข้อมูลวันที่เริ่มต้น-สิ้นสุดในระบบ</p>';
    return;
  }

  validData.sort((a, b) => a.parsedStart - b.parsedStart);

  minDate.setMonth(minDate.getMonth() - 1);
  maxDate.setMonth(maxDate.getMonth() + 1);
  
  const totalMs = maxDate.getTime() - minDate.getTime();
  const today = new Date();
  const todayPct = Math.max(0, Math.min(100, ((today - minDate) / totalMs) * 100));

  const typeColor = {
    'Maintenance':     '#06B6D4',
    'Warranty':        '#8B5CF6',
    'Investment':      '#10B981',
  };

  const styleBlock = `
    <style>
      #ganttContainer {
        --g-lbl: 180px; 
        --muted: #6B7280;
        --red: #D62828;
        --ink: #111827;
        --line: #E5E7EB;
        --line-2: #F3F4F6;
        --slate-soft: #F1F5F9;
      }
      .gantt-body { padding:14px 18px 18px; overflow-x:auto; }
      .gantt { min-width:800px; padding-right:48px; padding-left:8px; display: flex; flex-direction: column; }
      .g-head { display:flex; align-items:flex-end; height:20px; margin-bottom:6px; }
      .g-head-sp { width:var(--g-lbl); flex-shrink:0; }
      .g-axis { position:relative; flex:1; height:18px; border-bottom:1px solid var(--line); }
      .g-tick { position:absolute; bottom:2px; transform:translateX(-50%); }
      .g-tick span { font-size:9px; color:var(--muted); font-weight:600; white-space:nowrap; }
      .g-body { position:relative; }
      .g-grid-wrap { position:absolute; left:var(--g-lbl); right:0; top:0; bottom:0; pointer-events:none; z-index:0; }
      .g-grid { position:absolute; top:0; bottom:0; width:1px; background:var(--line-2); transform:translateX(-50%); }
      .g-today { position:absolute; top:-2px; bottom:0; width:0; border-left:2px dashed var(--red); z-index:4; }
      .g-today span { position:absolute; top:-2px; left:4px; font-size:8px; font-weight:800; color:var(--red); letter-spacing:.4px; background:#fff; padding:0 2px; border-radius:2px; }
      .g-row { display:grid; grid-template-columns:var(--g-lbl) 1fr; align-items:center; height:42px; position:relative; border-bottom:1px solid var(--line-2); z-index:1; transition:background 0.2s;}
      .g-row:hover { background-color: var(--slate-soft); }
      .g-label { display:flex; flex-direction:column; justify-content:center; padding-right:12px; overflow:hidden; }
      .g-code { font-size:11.5px; font-weight:700; color:var(--ink); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .g-dur { font-size:9.5px; font-weight:600; color:var(--muted); }
      .g-name { font-size:9.5px; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
      .g-lane { position:relative; height:100%; }
      .g-bar { position:absolute; top:50%; transform:translateY(-50%); height:16px; border-radius:8px; background:#E7EAEE; min-width:2px; z-index:2; cursor:pointer; }
      .g-bar.active { background:#E1EFE5; }
      .g-bar.done { background:#D4EDDB; }
      .g-bar.future { background:var(--slate-soft); }
      .g-bar-fill { position:absolute; left:0; top:0; bottom:0; border-radius:8px; transition:width .6s; z-index:1; }
      .g-bar-pct { position:absolute; top:50%; transform:translate(4px,-50%); font-size:9.5px; font-weight:800; color:#0B6B30; z-index:3; white-space:nowrap; }
      .g-date { position:absolute; top:50%; transform:translateY(-50%); font-size:8.5px; color:var(--muted); font-weight:600; white-space:nowrap; }
      .g-date-s { right:calc(100% + 5px); }
      .g-date-e { left:calc(100% + 5px); }
    </style>
  `;

  const dashboardCards = document.getElementById('dashboardCards');
  const currentSelectedType = dashboardCards ? (dashboardCards.dataset.selected || 'All') : 'All';
  
  // ปรับเงื่อนไขตรงนี้: ให้ทั้ง 'All' และ 'Investment' แสดงสเกลรายปี
  const isYearlyScale = (currentSelectedType === 'All' || currentSelectedType === 'Investment');

  let axisHTML = '';
  let gridHTML = '';
  let cur = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
  
  while (cur <= maxDate) {
    const pct = ((cur.getTime() - minDate.getTime()) / totalMs) * 100;
    let drawTick = false;
    let labelText = '';

    if (isYearlyScale) {
      if (cur.getMonth() === 0) {
        drawTick = true;
        labelText = cur.getFullYear();
      }
    } else {
      if (cur.getMonth() % 3 === 0) {
        drawTick = true;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        labelText = `${months[cur.getMonth()]} ${cur.getFullYear().toString().slice(-2)}`;
      }
    }

    if (drawTick) {
      axisHTML += `<div class="g-tick" style="left:${pct.toFixed(2)}%;"><span>${labelText}</span></div>`;
      gridHTML += `<div class="g-grid" style="left:${pct.toFixed(2)}%;"></div>`;
    }
    cur.setMonth(cur.getMonth() + 1);
  }

  const todayHTML = `<div class="g-today" style="left:${todayPct.toFixed(2)}%;"><span>TODAY</span></div>`;

  let rowsHTML = '';
  validData.forEach((p) => {
    const sDate = p.parsedStart;
    const eDate = p.parsedEnd;
    const left = Math.max(0, ((sDate.getTime() - minDate.getTime()) / totalMs) * 100);
    const right = Math.min(100, ((eDate.getTime() - minDate.getTime()) / totalMs) * 100);
    const width = Math.max(0.5, right - left);

    let progressPct = 0;
    if (today >= eDate) progressPct = 100;
    else if (today > sDate) progressPct = ((today - sDate) / (eDate - sDate)) * 100;

    const topLabel = p.RefCode || '-';
    const bottomLabel = p.ShortProjectName || '-';
    const sDateStr = formatDate(sDate);
    const eDateStr = formatDate(eDate);
    const durStr = getDuration(sDate, eDate);

    let barClass = 'g-bar';
    if (progressPct === 100) barClass += ' done';
    else if (progressPct > 0) barClass += ' active';
    else barClass += ' future';

    const subName = p.ProjectType || 'MA';
    const typeMatch = Object.entries(typeColor).find(([k]) => subName.includes(k));
    const color = typeMatch ? typeMatch[1] : '#94A3B8';

    rowsHTML += `
      <div class="g-row" onclick="selectProjectFromTable(event, '${(p.RefCode || '').replace(/'/g, "\\'")}')">
        <div class="g-label" title="${p.ProjectName || ''}">
          <div class="g-code">${topLabel} <span class="g-dur">(${durStr})</span></div>
          <div class="g-name">${bottomLabel}</div>
        </div>
        <div class="g-lane">
          <div class="${barClass}" style="left:${left.toFixed(2)}%; width:${width.toFixed(2)}%;">
            <div class="g-bar-fill" style="background:${color}; width:${progressPct.toFixed(2)}%; opacity:0.9;"></div>
            <div class="g-bar-pct" style="left:${progressPct.toFixed(2)}%;">${Math.round(progressPct)}%</div>
            <div class="g-date g-date-s">${sDateStr}</div>
            <div class="g-date g-date-e">${eDateStr}</div>
          </div>
        </div>
      </div>
    `;
  });

  const legendHTML = `<div style="display:flex; flex-wrap:wrap; gap:12px; padding:8px 12px; border-bottom:1px solid var(--line); font-size:11px; background:#fff; position:sticky; top:0; left:0; z-index:30;">
    ${Object.entries(typeColor).map(([k, c]) => `
      <span style="display:flex; align-items:center; gap:4px;">
        <span style="width:10px; height:10px; border-radius:2px; background:${c};"></span>${k}
      </span>`).join('')}
    <span style="display:flex; align-items:center; gap:4px; margin-left:8px;">
      <span style="width:1px; height:12px; border-left:2px dashed var(--red);"></span> Today
    </span>
  </div>`;

  container.innerHTML = styleBlock + legendHTML + `
    <div class="gantt-body" id="ganttBodyScroll">
      <div class="gantt" style="min-width: 800px;">
        <div class="g-head">
          <div class="g-head-sp"></div>
          <div class="g-axis">${axisHTML}</div>
        </div>
        <div class="g-body">
          <div class="g-grid-wrap">
            ${gridHTML}
            ${todayHTML}
          </div>
          ${rowsHTML}
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const scrollContainer = document.getElementById('ganttBodyScroll');
    if (!scrollContainer) return;
    const pct = ((today.getTime() - minDate.getTime()) / totalMs);
    const gLblWidth = 180;
    const timelineWidth = scrollContainer.scrollWidth - gLblWidth;
    
    scrollContainer.scrollLeft = Math.max(0, (timelineWidth * pct) - (scrollContainer.clientWidth / 2) + gLblWidth);
  }, 100);
}

// ==========================================
// --- HELPER FUNCTIONS (ฟังก์ชันตัวช่วยที่หายไป) ---
// ==========================================
function parseDate(val) {
  if (!val || val === "-") return null;
  if (typeof val === 'number') return new Date((val - 25569) * 86400 * 1000); 
  
  let dateStr = val.toString().trim();
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  let parts = dateStr.split(/[-/T ]/);
  if (parts.length >= 3) {
    let year, month, day;
    if (parts[0].length === 4) { 
      year = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; day = parseInt(parts[2], 10);
    } else { 
      day = parseInt(parts[0], 10); month = parseInt(parts[1], 10) - 1; year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
    }
    d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function getStatusTheme(statusText) {
  let s = (statusText || "").toLowerCase().trim();
  if (s.includes('active')) return { color: '#FFA0E2', class: 'status-active' };
  if (s.includes('new')|| s.includes('new contract')) return { color: '#10B981', class: 'status-new' }; 
  if (s.includes('end') || s.includes('hold') || s.includes('pending')) return { color: '#F59E0B', class: 'status-hold' }; 
  if (s.includes('close')) return { color: '#64748B', class: 'status-end' }; 
  return { color: '#F59E0B', class: 'status-hold' }; 
}

function calculateDynamicStatus(project, yearStr) {
  if (yearStr === "All") return project.StatusofProject; 
  
  const y = parseInt(yearStr, 10);
  const closedDate = parseDate(project.ClosedProjectDate);
  if (closedDate) return "Closed";

  const handoverDate = parseDate(project.HandoverDate);
  if (handoverDate && handoverDate.getFullYear() === y) return "New Contract";

  const contractEndDate = parseDate(project.ContractEndDate);
  if (contractEndDate && contractEndDate.getFullYear() === y) return "End of Contract";

  const today = new Date();
  if (contractEndDate && contractEndDate >= today) return "Active";

  return project.StatusofProject || "-";
}

// ==========================================
  // --- LOGIC: คลิกพื้นที่ว่างเพื่อเคลียร์ข้อมูล ---
  // ==========================================
  document.addEventListener('click', function(e) {
    // ระบุพื้นที่ที่คลิกแล้ว "ไม่ตัอง" ยกเลิก Filter
    const isInteractiveArea = e.target.closest('#projectTable') || 
                              e.target.closest('canvas') || 
                              e.target.closest('#topbar') || 
                              e.target.closest('.stat-card') || 
                              e.target.closest('#sidebar') ||
                              e.target.closest('#filterChipsContainer'); // เพิ่มจุดชิปเข้ามาด้วย
    
    // ถ้าคลิกนอกพื้นที่เหล่านี้ ให้ล้างข้อมูลทั้งหมด
    if (!isInteractiveArea) {
      if (typeof clearAllFilters === 'function') {
        clearAllFilters();
      }
    }

    if (typeof renderGanttChart === 'function') {
  // 1. รีเซ็ตสถานะของ Dashboard Card ให้กลับเป็น 'All'
  const dashboardCards = document.getElementById('dashboardCards');
  if (dashboardCards) {
    dashboardCards.dataset.selected = 'All'; 
  }

  // 2. เรียกฟังก์ชันวาด Gantt Chart ใหม่ด้วยข้อมูลตั้งต้น
  renderGanttChart(dataToRender); 
}
  });