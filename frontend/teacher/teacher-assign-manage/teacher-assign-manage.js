const API_BASE_URL = 'https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default';

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
    loadAssignmentAttachments();
    loadStudentsByStatus('Needs Grading');
    bindAssignmentActions();

    const activeTab = document.querySelector('.tab-item.active');
    if (activeTab) {
        activeTab.classList.remove('active');
    }

    const firstTab = document.querySelector('.tab-item');
    if (firstTab) {
        firstTab.classList.add('active');
    }
});

function bindAssignmentActions() {
    const editBtn = document.getElementById('edit-assignment-btn');
    const deleteBtn = document.getElementById('delete-assignment-btn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const courseQuery = COURSE_ID ? `&course_id=${encodeURIComponent(COURSE_ID)}` : '';
            window.location.href =
                `../create-assignment/create-assignment.html?id=${encodeURIComponent(ASSIGNMENT_ID)}${courseQuery}`;
        });
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteAssignment);
    }
}

async function deleteAssignment() {
    const confirmed = confirm('Delete this assignment? This will also remove its submissions and attached files.');
    if (!confirmed) return;

    const deleteBtn = document.getElementById('delete-assignment-btn');
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.style.opacity = '0.7';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/assignments/${ASSIGNMENT_ID}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${TOKEN}`
            }
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(result?.detail || result?.message || `HTTP ${response.status}`);
        }

        alert('Assignment deleted successfully.');

        if (COURSE_ID) {
            window.location.href = `../courses-detail/courses-detail.html?course_id=${COURSE_ID}`;
        } else {
            window.location.href = '../teacher-assign-overview/teacher-assign-overview.html';
        }
    } catch (error) {
        console.error('Delete assignment failed:', error);
        alert('Delete assignment failed: ' + error.message);

        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.style.opacity = '1';
        }
    }
}

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
        fileNameEl.textContent = 'No file attached';
    }

    if (fileSizeEl) {
        fileSizeEl.textContent = '-';
    }
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ==========================================
// 1b. ดึงไฟล์แนบของ assignment
// ==========================================
async function loadAssignmentAttachments() {
    try {
        const response = await fetch(`${API_BASE_URL}/attachments/assignment/${ASSIGNMENT_ID}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) return;

        const attachments = result?.data || [];
        if (attachments.length === 0) return;

        const fileGroup = document.querySelector('.file-preview-group');
        if (!fileGroup) return;

        const fileButtons = attachments.map(attachment => {
            const fileType = (attachment.file_type || 'file').toUpperCase();
            const fileUrl = attachment.file_url?.startsWith('http')
                ? attachment.file_url
                : `${API_BASE_URL}/${attachment.file_url}`;

            return `
                <button class="file-btn assignment-attachment-btn" type="button" data-file-url="${escapeHtml(fileUrl)}">
                    <iconify-icon icon="material-icon-theme:pdf" width="24" height="24"></iconify-icon>
                    <span>${escapeHtml(attachment.file_name || `View ${fileType} File`)}</span>
                </button>
            `;
        }).join('');

        fileGroup.innerHTML = `
            <div class="file-preview-rect">
                <p>${attachments.length} File${attachments.length > 1 ? 's' : ''}<br><span style="font-size: 0.75rem;">Attached</span></p>
            </div>
            <div class="assignment-attachment-list">
                ${fileButtons}
            </div>
        `;

        fileGroup.querySelectorAll('.assignment-attachment-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.open(btn.dataset.fileUrl, '_blank');
            });
        });

    } catch (error) {
        console.error('Error loading assignment attachments:', error);
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

async function fetchUserInfo(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'GET',
            headers: { Authorization: `Bearer ${TOKEN}` }
        });
        const result = await response.json().catch(() => null);
        if (!response.ok) return { name: '-', student_code: '-' };
        const d = result?.data;
        return {
            name: d?.full_name || `${d?.first_name || ''} ${d?.last_name || ''}`.trim() || '-',
            student_code: d?.student_id || '-'
        };
    } catch (err) {
        console.warn('fetchUserInfo failed:', userId, err);
        return { name: '-', student_code: '-' };
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
                submissions.map(s => String(s.user_id || s.student_id))
            );

            const missingStudents = members.filter(m =>
                m.role === 'student' && !submittedStudentIds.has(String(m.user_id))
            );

            rows = missingStudents.map(m => ({
                user_id: m.user_id,
                submitted_at: null,
                status: 'missing',
                attachments: []
            }));
        }
        const rowsWithNames = await Promise.all(rows.map(async row => {
            const userId = row.user_id || row.student_id;
            let name = row.student_name && row.student_name !== '-' ? row.student_name : null;
            let student_code = row.student_code || null;

            if (!name || !student_code) {
                const info = await fetchUserInfo(userId);
                if (!name) name = info.name;
                if (!student_code) student_code = info.student_code;
            }

            return {
                ...row,
                student_id: userId,
                student_code: student_code || '-',
                student_name: name || '-'
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
        tr.dataset.submissionId = student.submission_id || '';
        tr.dataset.feedback = student.feedback || '';

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
            const fileButtons = student.attachments.map((attachment, index) => {
                const rawUrl = typeof attachment === 'string' ? attachment : attachment.file_url;
                const fileName = typeof attachment === 'string'
                    ? `View File ${index + 1}`
                    : (attachment.file_name || `View File ${index + 1}`);
                const fileUrl = rawUrl?.startsWith('http') ? rawUrl : `${API_BASE_URL}/${rawUrl}`;

                return `
                    <button class="file-btn submission-file-btn" type="button" data-file-url="${escapeHtml(fileUrl)}">
                        <iconify-icon icon="material-icon-theme:pdf" width="24" height="24"></iconify-icon>
                        <span>${escapeHtml(fileName)}</span>
                    </button>
                `;
            }).join('');

            submissionContent = `<div class="submission-file-list">${fileButtons}</div>`;
        }

        const submittedAt = student.submitted_at
            ? new Date(student.submitted_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })
            : '-';

        tr.innerHTML = `
            <td>${student.student_code || student.student_id || '-'}</td>
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
            <td>
                <textarea
                    class="feedback-input"
                    rows="2"
                    placeholder="ใส่ feedback..."
                    ${student.status === 'missing' ? 'disabled' : ''}
                >${student.feedback || ''}</textarea>
            </td>
        `;

        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.submission-file-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.open(btn.dataset.fileUrl, '_blank');
        });
    });
}

// ==========================================
// 7. (removed – feedback is now inline textarea)
// ==========================================

// ==========================================
// 8. Edit & Save Grades buttons
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const editBtn = document.getElementById('edit-grades-btn');
    const saveBtn = document.getElementById('save-grades-btn');

    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const isEditing = editBtn.classList.toggle('active');
            const inputs = document.querySelectorAll('.grading-table tbody .grade-input');
            inputs.forEach(inp => {
                if (!inp.closest('tr')?.dataset.submissionId) return;
                inp.readOnly = !isEditing;
                inp.style.background = isEditing ? '' : '#f3f4f6';
            });
            editBtn.innerHTML = isEditing
                ? '<iconify-icon icon="material-symbols:close-rounded" width="20" height="20"></iconify-icon>Cancel'
                : '<iconify-icon icon="material-symbols:edit-outline-rounded" width="20" height="20"></iconify-icon>Edit';
        });
    }

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const rows = document.querySelectorAll('.grading-table tbody tr.table-row');
            if (!rows.length) return;

            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            let successCount = 0;
            let failCount = 0;

            for (const tr of rows) {
                const submissionId = tr.dataset.submissionId;
                if (!submissionId) continue;

                const input = tr.querySelector('.grade-input');
                if (!input || input.disabled) continue;

                const score = parseInt(input.value, 10);
                if (isNaN(score)) continue;

                const feedbackEl = tr.querySelector('.feedback-input');
                const feedback = feedbackEl ? feedbackEl.value : '';

                try {
                    const url = `${API_BASE_URL}/submissions/${submissionId}/grade?grader_id=${USER_ID}&course_id=${COURSE_ID}&score=${score}&feedback=${encodeURIComponent(feedback)}`;
                    const response = await fetch(url, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${TOKEN}` }
                    });

                    if (response.ok) {
                        successCount++;
                    } else {
                        const err = await response.json().catch(() => null);
                        console.error('Grade save failed:', err);
                        failCount++;
                    }
                } catch (err) {
                    console.error('Grade save error:', err);
                    failCount++;
                }
            }

            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Grades';

            if (failCount === 0 && successCount > 0) {
                alert(`บันทึกคะแนนสำเร็จ ${successCount} รายการ`);
                const activeTab = document.querySelector('.tab-item.active');
                loadStudentsByStatus(activeTab?.textContent.trim() || 'Needs Grading');
            } else if (successCount === 0 && failCount === 0) {
                alert('ไม่มีคะแนนที่จะบันทึก');
            } else {
                alert(`บันทึกสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
            }
        });
    }
});
