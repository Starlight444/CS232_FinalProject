const API_BASE_URL = 'https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com';

const urlParams = new URLSearchParams(window.location.search);
const ASSIGNMENT_ID = urlParams.get('id');
const COURSE_ID = urlParams.get('course_id');

const userData = JSON.parse(localStorage.getItem('user') || 'null');
const TOKEN = userData ? userData.token : '';
const USER_ID = userData ? userData.user_id : '';

if (!ASSIGNMENT_ID) {
    alert('ไม่พบ ID ของงาน รบกวนกลับไปเลือกงานจาก Dashboard ใหม่');
    window.location.href = '../teacher-dashboard.html';
}

function goBack() {
    if (COURSE_ID) {
        window.location.href = '../courses-detail/courses-detail.html?course_id=' + COURSE_ID;
    } else {
        history.back();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadTeacherSidebarNavbar();
    loadAssignmentDetails();
    loadStudentsByStatus('Needs Grading');

    const activeTab = document.querySelector('.tab-item.active');
    if (activeTab) {
        activeTab.classList.remove('active');
    }

    const firstTab = document.querySelector('.tab-item');
    if (firstTab) {
        firstTab.classList.add('active');
    }
});

function loadTeacherSidebarNavbar() {
  fetch('../../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
    .then(r => r.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const container = document.getElementById('teacher-sidebar-navbar-container');

            if (!container) return;

            const sidebar = doc.querySelector('#sidebar');
            const navbar = doc.querySelector('.navbar');

            if (sidebar) container.appendChild(sidebar);
            if (navbar) container.appendChild(navbar);

            const sidebarScript = document.createElement('script');
            sidebarScript.src = '../../components/teacher-sidebar-navbar/teacher-sidebar.js';
            document.body.appendChild(sidebarScript);

            const navbarScript = document.createElement('script');
            navbarScript.src = '../../components/teacher-sidebar-navbar/teacher-navbar.js';
            document.body.appendChild(navbarScript);

            sidebarScript.onload = () => {
                const sidebarEl = document.getElementById('sidebar');

                if (sidebarEl) {
                    new MutationObserver(() => {
                        const collapsed = sidebarEl.classList.contains('collapsed');
                        document.body.classList.toggle('sidebar-collapsed', collapsed);
                    }).observe(sidebarEl, {
                        attributes: true,
                        attributeFilter: ['class']
                    });
                }
            };
        })
        .catch(err => console.error('Error loading teacher sidebar/navbar:', err));
}

// ==========================================
// 1. ดึงรายละเอียด assignment จาก id ใน URL
// ==========================================
async function loadAssignmentDetails() {
    try {
        console.log('ASSIGNMENT_ID from URL:', ASSIGNMENT_ID);

        const response = await fetch(`${API_BASE_URL}/assignments/detail/${ASSIGNMENT_ID}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        });

        const result = await response.json().catch(() => null);

        console.log('ASSIGNMENT DETAIL STATUS:', response.status);
        console.log('ASSIGNMENT DETAIL RESPONSE:', result);

        if (!response.ok) {
            throw new Error(result?.detail || `HTTP ${response.status}: ดึงข้อมูลงานไม่สำเร็จ`);
        }

        renderAssignmentDetails(result.data);

    } catch (error) {
        console.error('Error loading assignment details:', error);

        const titleEl = document.getElementById('display-title');
        const dateEl = document.getElementById('display-due-date');
        const instructionsEl = document.getElementById('display-instructions');

        if (titleEl) titleEl.textContent = 'โหลดข้อมูลงานไม่สำเร็จ';
        if (dateEl) dateEl.textContent = '-';
        if (instructionsEl) instructionsEl.textContent = error.message;
    }
}

function renderAssignmentDetails(data) {
    if (!data) return;

    const titleEl = document.getElementById('display-title');
    const dueEl = document.getElementById('display-due-date');
    const instructionsEl = document.getElementById('display-instructions');
    const pointsEl = document.getElementById('display-points');
    const formatsContainer = document.getElementById('display-allowed-formats');
    const fileNameEl = document.getElementById('display-file-name');
    const fileSizeEl = document.getElementById('display-file-size');

    if (titleEl) {
        titleEl.textContent = data.title || 'Untitled Assignment';
    }

    if (dueEl) {
        const date = data.due_date ? new Date(data.due_date) : null;
        dueEl.textContent = date && !isNaN(date)
            ? `Due date on ${date.toLocaleString()}`
            : 'No due date';
    }

    if (instructionsEl) {
        instructionsEl.textContent = data.description || 'No description';
    }

    if (pointsEl) {
        pointsEl.textContent = `${data.max_score ?? 0} Points`;
    }

    if (formatsContainer) {
        formatsContainer.innerHTML = '';

        const allowed = data.allowed_file_types || 'any';
        const formatsArray = allowed.split(',');

        formatsArray.forEach(format => {
            const formatTrimmed = format.trim().toLowerCase();
            const badge = document.createElement('span');
            badge.className = 'format-badge';

            let iconHtml = '<iconify-icon icon="ph:file-duotone"></iconify-icon>';

            if (formatTrimmed === 'pdf') {
                iconHtml = '<iconify-icon icon="ph:file-pdf-duotone" style="color:#EF4444;"></iconify-icon>';
            } else if (formatTrimmed === 'zip') {
                iconHtml = '<iconify-icon icon="ph:file-archive-duotone" style="color:#333;"></iconify-icon>';
            } else if (formatTrimmed === 'word') {
                iconHtml = '<iconify-icon icon="ph:file-doc-duotone" style="color:#2563EB;"></iconify-icon>';
            } else if (formatTrimmed === 'image') {
                iconHtml = '<iconify-icon icon="ph:image-duotone" style="color:#38BDF8;"></iconify-icon>';
            }

            badge.innerHTML = `${iconHtml} ${formatTrimmed.toUpperCase()}`;
            formatsContainer.appendChild(badge);
        });
    }

    if (fileNameEl) {
        fileNameEl.textContent = 'No attachment preview';
    }

    if (fileSizeEl) {
        fileSizeEl.textContent = '-';
    }
}

// ==========================================
// 2. ดึง submissions ของ assignment นี้
// ==========================================
async function fetchSubmissions() {
    const response = await fetch(`${API_BASE_URL}/submissions/assignment/${ASSIGNMENT_ID}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    });

    const result = await response.json().catch(() => null);

    console.log('SUBMISSIONS STATUS:', response.status);
    console.log('SUBMISSIONS RESPONSE:', result);

    if (!response.ok) {
        throw new Error(result?.detail || `HTTP ${response.status}: ดึง submissions ไม่สำเร็จ`);
    }

    return Array.isArray(result) ? result : (result?.data || []);
}

// ==========================================
// 3. ดึง members เพื่อทำ Missing tab
// ==========================================
async function fetchCourseMembers() {
    if (!COURSE_ID) return [];

    const response = await fetch(`${API_BASE_URL}/members/${COURSE_ID}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${TOKEN}`
        }
    });

    const result = await response.json().catch(() => null);

    console.log('MEMBERS STATUS:', response.status);
    console.log('MEMBERS RESPONSE:', result);

    if (!response.ok) {
        throw new Error(result?.detail || `HTTP ${response.status}: ดึง members ไม่สำเร็จ`);
    }

    return Array.isArray(result) ? result : (result?.data || []);
}

async function fetchUserName(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            return {
                student_id: '-',
                full_name: '-'
            };
        }

        return {
            student_id: result?.data?.student_id || '-',
            full_name:
                result?.data?.full_name ||
                `${result?.data?.first_name || ''} ${result?.data?.last_name || ''}`.trim() ||
                '-'
        };

    } catch (err) {
        console.warn('fetchUser failed:', userId, err);
        return {
            student_id: '-',
            full_name: '-'
        };
    }
}

// ==========================================
// 4. โหลดตารางตาม tab
// ==========================================
async function loadStudentsByStatus(statusFilter) {
    const tbody = document.querySelector('.grading-table tbody');

    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" align="center">กำลังโหลดข้อมูล...</td></tr>';

    try {
        const submissions = await fetchSubmissions();

        let rows = [];

        if (statusFilter === 'Needs Grading') {
            rows = submissions.filter(s => s.status === 'submitted');
        } else if (statusFilter === 'Fully Graded') {
            rows = submissions.filter(s => s.status === 'graded');
        } else if (statusFilter === 'Missing') {
            const members = await fetchCourseMembers();
            const submittedStudentIds = new Set(
                submissions.map(s => String(s.user_id))
            );

            const missingStudents = members.filter(m =>
                m.role === 'student' && !submittedStudentIds.has(String(m.user_id))
            );

            rows = missingStudents.map(m => ({
                user_id: m.user_id,
                student_id: m.user_id,
                student_name: '-',
                student_code: '-',
                submitted_at: null,
                status: 'missing',
                attachments: []
            }));
        }
        const rowsWithNames = await Promise.all(rows.map(async row => {
            const userId = row.user_id || row.student_id;
            if (row.student_name && row.student_name !== '-') {
                return {
                    ...row,
                    user_id: userId,
                    student_id: row.student_code || '-',
                    student_name: row.student_name
                };
            }

            const user = await fetchUserName(userId);

            return {
                ...row,
                user_id: userId,
                student_id: user.student_id,
                student_name: user.full_name
            };
        }));

        renderTable(rowsWithNames, statusFilter);

    } catch (error) {
        console.error('Error loading students by status:', error);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" align="center" style="color:red;">
                    โหลดข้อมูลไม่สำเร็จ: ${error.message}
                </td>
            </tr>
        `;
    }
}

// ==========================================
// 5. Tab Switching
// ==========================================
const tabItems = document.querySelectorAll('.tab-item');

tabItems.forEach(tab => {
    tab.addEventListener('click', (e) => {
        tabItems.forEach(t => t.classList.remove('active'));
        e.currentTarget.classList.add('active');

        const currentFilter = e.currentTarget.textContent.trim();
        loadStudentsByStatus(currentFilter);
    });
});

// ==========================================
// 6. Render table
// ==========================================
function renderTable(studentsData, filterStr) {
    const tbody = document.querySelector('.grading-table tbody');

    if (!tbody) return;

    tbody.innerHTML = '';

    if (!studentsData || studentsData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" align="center">
                    ไม่มีนักศึกษาในกลุ่ม ${filterStr}
                </td>
            </tr>
        `;
        return;
    }

    studentsData.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = 'table-row';

        let statusContent = '';

        if (student.status === 'submitted') {
            statusContent = '<span class="badge badge-submitted">Submitted</span>';
        } else if (student.status === 'graded') {
            statusContent = '<span class="badge badge-submitted">Graded</span>';
        } else {
            statusContent = '<span class="badge badge-missing">Missing</span>';
        }

        let submissionContent = '<span style="color: var(--text-muted); font-size: 0.9rem;">No File</span>';

        if (student.attachments && student.attachments.length > 0) {
            const fileUrl = student.attachments[0];

            submissionContent = `
                <button class="file-btn" type="button" onclick="window.open('${fileUrl}', '_blank')">
                    <iconify-icon icon="material-icon-theme:pdf" width="24" height="24"></iconify-icon>
                    View File
                </button>
            `;
        }

        const submittedAt = student.submitted_at
            ? new Date(student.submitted_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
            : '-';

        tr.innerHTML = `
            <td>${student.student_id || '-'}</td>
            <td>${student.student_name || '-'}</td>
            <td>${submittedAt}</td>
            <td>${statusContent}</td>
            <td>${submissionContent}</td>
            <td>
                <input
                    type="number"
                    class="grade-input"
                    size="3"
                    value="${student.score ?? ''}"
                    ${student.status === 'missing' ? 'disabled' : ''}
                >
            </td>
            <td align="center">
                <button
                    class="feedback-btn"
                    type="button"
                    ${student.status === 'missing' ? 'disabled' : ''}
                >
                    💬
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}