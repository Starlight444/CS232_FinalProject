const API_BASE_URL = 'http://localhost:3000/api'; 
const ASSIGNMENT_ID = '123-uuid';

// 1. ดึงข้อมูลรายละเอียดงานด้านบน (เหมือนเดิม)
async function loadAssignmentDetails() {
    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${ASSIGNMENT_ID}`);
        if (!response.ok) throw new Error('ดึงข้อมูลงานไม่สำเร็จ');
        const result = await response.json();
        renderAssignmentDetails(result.data);
    } catch (error) {
        console.error("Error:", error);
    }
}

function renderAssignmentDetails(data) {
    document.getElementById('display-title').textContent = data.title;
    document.getElementById('display-due-date').textContent = `Due date on ${data.due_date}`; 
    document.getElementById('display-instructions').textContent = data.description; 
    
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

// 2. ดึงข้อมูลรายชื่อนักศึกษา (อัปเดตใหม่)
async function loadStudentsByStatus(statusFilter) {
    const tbody = document.querySelector('.grading-table tbody');
    tbody.innerHTML = '<tr><td colspan="5" align="center">กำลังโหลดข้อมูล... ⏳</td></tr>';

    try {
        // แปลงชื่อ Tab ให้เป็น query ส่งให้ Backend (submitted หรือ missing)
        const apiStatus = statusFilter.toLowerCase();

        const response = await fetch(`${API_BASE_URL}/assignments/${ASSIGNMENT_ID}/students?status=${apiStatus}`);
        if (!response.ok) throw new Error('ดึงข้อมูลนักศึกษาไม่สำเร็จ');
        
        const realStudentsData = await response.json();
        renderTable(realStudentsData.data, statusFilter); // สมมติว่า Backend ส่งมาใน .data
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
        if (student.file_url) {
            submissionContent = `<button class="file-btn" type="button" onclick="window.open('${student.file_url}', '_blank')">
                                    <iconify-icon icon="material-icon-theme:pdf" width="24" height="24"></iconify-icon>
                                    View File
                                 </button>`;
        } else {
            submissionContent = `<span style="color: var(--text-muted); font-size: 0.9rem;">No File</span>`;
        }

        // วาดแค่ 5 คอลัมน์
        tr.innerHTML = `
            <td>${student.student_id || student.id}</td>
            <td>${student.first_name} ${student.last_name || ''}</td>
            <td>${student.submitted_date || '-'}</td>
            <td>${statusContent}</td>
            <td>${submissionContent}</td>
        `;
        tbody.appendChild(tr);
    });
}

// สั่งรันครั้งแรก
loadAssignmentDetails();
loadStudentsByStatus('Submitted');