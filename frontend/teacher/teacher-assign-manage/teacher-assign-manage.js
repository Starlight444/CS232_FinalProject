// const API_BASE_URL = 'https://2z3eq1a51d.execute-api.us-east-1.amazonaws.com/default'; 
const API_BASE_URL = 'https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com';

//const urlParams = new URLSearchParams(window.location.search);
//const ASSIGNMENT_ID = urlParams.get('id');
const urlParams = new URLSearchParams(window.location.search);
const ASSIGNMENT_ID = urlParams.get('id');      //--> ตอนนี้ยังเป็น course_id อยู่ ต้องเปลี่ยน💥

// 🚨 ดัก Error กรณีที่ไม่มี ID ส่งมา (เช่น เข้าหน้านี้ตรงๆ)
if (!ASSIGNMENT_ID) {
    alert("ไม่พบ ID ของงาน รบกวนกลับไปเลือกงานจาก Dashboard ใหม่");
    window.location.href = '../teacher-dashboard.html'; // เด้งกลับหน้า Dashboard
}

const _manageUrlParams = new URLSearchParams(window.location.search);
const _manageCourseId = _manageUrlParams.get('course_id');

function goBack() {
    if (_manageCourseId) {
        window.location.href = '../courses-detail/courses-detail.html?course_id=' + _manageCourseId;
    } else {
        history.back();
    }
}

document.addEventListener("DOMContentLoaded", function () {
  loadTeacherSidebarNavbar();
});

function loadTeacherSidebarNavbar() {
  fetch('../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
    .then(r => r.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const container = document.getElementById('teacher-sidebar-navbar-container');

      const sidebar = doc.querySelector('#sidebar');
      const navbar = doc.querySelector('.navbar');
      if (sidebar) container.appendChild(sidebar);
      if (navbar) container.appendChild(navbar);

      const sidebarScript = document.createElement('script');
      sidebarScript.src = '../components/teacher-sidebar-navbar/teacher-sidebar.js';
      document.body.appendChild(sidebarScript);

      const navbarScript = document.createElement('script');
      navbarScript.src = '../components/teacher-sidebar-navbar/teacher-navbar.js';
      document.body.appendChild(navbarScript);

      sidebarScript.onload = () => {
        const sidebarEl = document.getElementById('sidebar');
        if (sidebarEl) {
          new MutationObserver(() => {
            const collapsed = sidebarEl.classList.contains('collapsed');
            document.body.classList.toggle('sidebar-collapsed', collapsed);
          }).observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
        }
      };
    })
    .catch(err => console.error("Error loading teacher sidebar/navbar:", err));
}

// 1. ดึงข้อมูลรายละเอียดงานด้านบน (เหมือนเดิม)
ASS_ID = '64bf7a97-b91e-4214-ade3-6c0e4344f1bf';    //mock assignment_id
async function loadAssignmentDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/detail/${ASS_ID}`);
        if (!response.ok) throw new Error('ดึงข้อมูลงานไม่สำเร็จ');
        const result = await response.json();
        renderAssignmentDetails(result.data);
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderAssignmentDetails(data) {
    document.getElementById('display-title').textContent = data.title;

    const date = new Date(data.due_date);
    document.getElementById('display-due-date').textContent = `Due date on ${date.toLocaleString()}`;

    document.getElementById('display-instructions').textContent = data.description || 'No description';    
    // ตัดการแสดง Points ทิ้งไปเลยก็ได้ถ้าไม่มีการให้คะแนนแล้ว
    const pointsEl = document.getElementById('display-points');
    if(pointsEl) pointsEl.style.display = 'none';

    const formatsContainer = document.getElementById('display-allowed-formats');
    if (formatsContainer && data.allowed_file_types) {
        formatsContainer.innerHTML = ''; 
        const formatsArray = data.allowed_file_types.split(','); 
        formatsArray.forEach(format => {
            const formatTrimmed = format.trim().toLowerCase();
            const badge = document.createElement('span');
            badge.className = 'format-badge';
            
            let iconHtml = '<iconify-icon icon="ph:file-duotone"></iconify-icon>'; 
            if(formatTrimmed === 'pdf') iconHtml = '<iconify-icon icon="ph:file-pdf-duotone" style="color:#EF4444;"></iconify-icon>';
            else if(formatTrimmed === 'zip') iconHtml = '<iconify-icon icon="ph:file-archive-duotone" style="color:#333;"></iconify-icon>';

            badge.innerHTML = `${iconHtml} ${formatTrimmed.toUpperCase()}`;
            formatsContainer.appendChild(badge);
        });
    }
}

// 2. ดึงข้อมูลรายชื่อนักศึกษา
async function loadStudentsByStatus(statusFilter) {
    const tbody = document.querySelector('.grading-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" align="center">กำลังโหลดข้อมูล... </td></tr>';

    try {
        const response = await fetch(`${API_BASE_URL}/submissions/assignment/${ASS_ID}`);   //ใช้ mock assignment_id
        if (!response.ok) throw new Error('ดึงข้อมูลนักศึกษาไม่สำเร็จ');

        const result = await response.json();
        const allSubmissions = result.data || [];

        const tabStatusMap = {
            'Needs Grading': 'submitted',
            'Fully Graded':  'graded',
            'Missing':       'missing'
        };
        const targetStatus = tabStatusMap[statusFilter];
        const filtered = allSubmissions.filter(s => s.status === targetStatus);

        renderTable(filtered, statusFilter);
    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = '<tr><td colspan="5" align="center" style="color:red;">ไม่มีข้อมูลนักศึกษาในสถานะนี้</td></tr>';
    }
}

// 3. จัดการ Tab Switching
const tabItems = document.querySelectorAll('.tab-item');
tabItems.forEach(tab => {
    tab.addEventListener('click', (e) => {
        tabItems.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');
        
        const currentFilter = e.currentTarget.textContent.trim(); // 'Submitted' หรือ 'Missing'
        loadStudentsByStatus(currentFilter);
    });
});

// 4. ฟังก์ชันวาดตาราง (อัปเดตใหม่ ตัดคอลัมน์คะแนนทิ้ง)
function renderTable(studentsData, filterStr) {
    const tbody = document.querySelector('.grading-table tbody');
    tbody.innerHTML = ''; 

    if(!studentsData || studentsData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" align="center">ไม่มีนักศึกษาในกลุ่ม ${filterStr}</td></tr>`;
        return;
    }

    studentsData.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = 'table-row';

        // จัดการ Status Badge
        let statusContent = '';
        if (filterStr === 'Submitted') {
            statusContent = `<span class="badge badge-submitted">Submitted</span>`;
        } else {
            statusContent = `<span class="badge badge-missing">Missing</span>`;
        }

        // จัดการปุ่มเปิดไฟล์
        let submissionContent = '';
        const fileUrl = student.attachments && student.attachments[0];
        if (fileUrl) {
            submissionContent = `<button class="file-btn" type="button" onclick="window.open('${fileUrl}', '_blank')">
                                    <iconify-icon icon="material-icon-theme:pdf" width="24" height="24"></iconify-icon>
                                    View File
                                 </button>`;
        } else {
            submissionContent = `<span style="color: var(--text-muted); font-size: 0.9rem;">No File</span>`;
        }

        const submittedAt = student.submitted_at
            ? new Date(student.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
            : '-';

        tr.innerHTML = `
            <td>${student.student_code || '-'}</td>
            <td>${student.student_name || '-'}</td>
            <td>${submittedAt}</td>
            <td>${statusContent}</td>
            <td>${submissionContent}</td>
        `;
        tbody.appendChild(tr);
    });
}

// สั่งรันครั้งแรก
loadAssignmentDetails();
loadStudentsByStatus('Needs Grading');

document.addEventListener("DOMContentLoaded", () => {
    const activeTab = document.querySelector('.tab-item.active');
    if (activeTab) {
        const currentFilter = activeTab.textContent.trim();
        loadStudentsByStatus(currentFilter);
    }
});