// sidebar
fetch('../components/student-sidebar/sidebar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-sidebar/sidebar.js";
        document.body.appendChild(script);
    });

// navbar
fetch('../components/student-navbar/student-navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-navbar/student-navbar.js";
        document.body.appendChild(script);
    });

// main content
const submitBtn = document.getElementById('submit-btn');

let selectedStudentFiles = [];
let submittedFileInfos = [];
let isSubmitted = false;

// api
const BASE_URL = 'http://127.0.0.1:8000';
// [เพิ่ม] ตรวจสอบ Token และดึงข้อมูล User จาก localStorage
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.token) {
    window.location.href = "../auth/login.html";
}
const TOKEN = userData ? userData.token : '';
const USER_ID = userData ? userData.user_id : '';

const urlParams = new URLSearchParams(window.location.search);
const assignment_Id = urlParams.get('id');
const courseId = urlParams.get('course_id');

// ตรวจสอบ ID ก่อนเริ่มทำงาน
if (!assignment_Id) {
    console.error("No assignment ID found");
    alert("ไม่พบรหัสการบ้าน กรุณากลับไปเลือกการบ้านใหม่อีกครั้ง");
}

async function checkCurrentSubmission() {
    try {
        const response = await fetch(`${BASE_URL}/submissions/assignment/${assignment_Id}/student/${USER_ID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();
        if (json.data && json.data.status !== 'not_submitted') {
            isSubmitted = true;
            updateUISubmitted();
            if (json.data.submission_id) {
                showSubmittedFileFromAPI(json.data.submission_id);
            }
            if (json.data.status === 'graded') {
                showGradeSection(json.data.score, json.data.feedback, json.data.graded_at);
            }
        }
    } catch (err) {
        console.error("Check submission error:", err);
    }
}

function showGradeSection(score, feedback, submittedAt) {
    // Show feedback section
    const section = document.getElementById('grade-section');
    if (section) {
        section.style.display = '';
        const feedbackText = document.getElementById('grade-feedback-text');
        if (feedbackText) feedbackText.textContent = feedback || 'ไม่มี feedback';
    }

    // Show grade at top right
    const pointsEl = document.getElementById('assign-points');
    const gradeTopEl = document.getElementById('assign-grade-top');
    const gradeScoreEl = document.getElementById('assign-grade-score');
    const gradeMaxEl = document.getElementById('assign-grade-max');

    const maxRaw = pointsEl?.textContent || '';
    const maxNum = maxRaw.replace(/[^0-9]/g, '');

    if (pointsEl) pointsEl.style.display = 'none';
    if (gradeTopEl) gradeTopEl.style.display = '';

    if (gradeScoreEl) gradeScoreEl.textContent = score ?? '-';
    if (gradeMaxEl) gradeMaxEl.textContent = maxNum || '-';

    // Show "Returned" line with date
    const returnedEl = document.getElementById('assign-returned');
    const returnedDateEl = document.getElementById('assign-returned-date');
    if (returnedEl) {
        returnedEl.style.display = '';
        if (returnedDateEl && submittedAt) {
            returnedDateEl.textContent = formatTimestamp(parseBackendDate(submittedAt));
        }
    }
}

async function showSubmittedFileFromAPI(submissionId) {
    try {
        const response = await fetch(`${BASE_URL}/attachments/submission/${submissionId}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.data?.length) return;

        // ถ้า user เลือกไฟล์ใหม่ก่อน API จะตอบ ไม่ overwrite
        if (selectedStudentFiles.length > 0) return;

        submittedFileInfos = result.data.map((attachment, index) => {
            const fileUrl = attachment.file_url?.startsWith('http')
                ? attachment.file_url
                : `${BASE_URL}/${attachment.file_url}`;
            return { name: attachment.file_name || `Submitted File ${index + 1}`, fileUrl };
        });
        clearFileList();
        submittedFileInfos.forEach(file => renderFileRow(file.name, file.fileUrl, false));
    } catch (err) {
        console.error('Error fetching submitted file:', err);
    }
}

// ฟังก์ชันดึงข้อมูลการบ้านมาโชว์
async function fetchAssignmentDetail() {
    if (!assignment_Id || !courseId) return console.error("No assignment/course ID found");
    try {
        const response = await fetch(`${BASE_URL}/assignments/${courseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();

        if (json.success) {
            const data = json.data.find(a => a.assignment_id === assignment_Id);
            if (!data) return console.error("Assignment not found in course");
            document.querySelector('.assign-header .assign-title').textContent = data.title;
            document.querySelector('.assign-due').textContent = `Due date on ${formatTimestamp(new Date(data.due_date))}`;
            document.querySelector('.section-body').textContent = data.description;
            document.querySelector('.assign-points').textContent = `${data.max_score} Points`;

            renderAllowedFormats(data.allowed_file_types || 'any');
            updateFileInputAccept(data.allowed_file_types || 'any');

            if (new Date() > new Date(data.due_date)) {
                updateUIDeadlinePassed();
            } else {
                checkCurrentSubmission();
            }
        }
    } catch (err) {
        console.error("Fetch Assignment Error:", err);
    }
}

async function fetchAssignmentAttachments() {
    try {
        const response = await fetch(`${BASE_URL}/attachments/assignment/${assignment_Id}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const result = await response.json().catch(() => null);
        if (!response.ok || !result?.data?.length) return;

        const container = document.getElementById('teacher-file-container');
        if (!container) return;

        const iconHtml = '<iconify-icon icon="material-icon-theme:pdf" width="24" height="24"></iconify-icon>';

        container.innerHTML = '';
        result.data.forEach((attachment, index) => {
            const fileUrl = attachment.file_url?.startsWith('http')
                ? attachment.file_url
                : `${BASE_URL}/${attachment.file_url}`;

            const btn = document.createElement('div');
            btn.className = 'teacher-file-btn';
            btn.innerHTML = `${iconHtml}<span>${attachment.file_name || `View File ${index + 1}`}</span>`;
            btn.addEventListener('click', () => window.open(fileUrl, '_blank'));
            container.appendChild(btn);
        });
    } catch (err) {
        console.error('Error fetching attachments:', err);
    }
}

function showSubmittedFileFromLocal(files) {
    if (!files || files.length === 0) return;
    submittedFileInfos = files.map(file => ({
        name: file.name,
        fileUrl: URL.createObjectURL(file)
    }));
    clearFileList();
    submittedFileInfos.forEach(file => renderFileRow(file.name, file.fileUrl, false));
}

function renderAllowedFormats(allowedTypes) {
    const container = document.getElementById('display-allowed-formats');
    if (!container) return;
    container.innerHTML = '';
    const types = allowedTypes === 'any' ? ['any'] : allowedTypes.split(',');
    types.forEach(type => {
        const t = type.trim().toLowerCase();
        const badge = document.createElement('span');
        badge.className = 'format-badge';
        let icon = '<iconify-icon icon="ph:file-duotone"></iconify-icon>';
        if (t === 'pdf') icon = '<iconify-icon icon="ph:file-pdf-duotone" style="color:#EF4444;"></iconify-icon>';
        else if (t === 'zip') icon = '<iconify-icon icon="ph:file-archive-duotone" style="color:#333;"></iconify-icon>';
        else if (t === 'word') icon = '<iconify-icon icon="ph:file-doc-duotone" style="color:#2563EB;"></iconify-icon>';
        else if (t === 'image') icon = '<iconify-icon icon="ph:image-duotone" style="color:#38BDF8;"></iconify-icon>';
        else if (t === 'any') icon = '<iconify-icon icon="ph:files-duotone" style="color:#6E6CDF;"></iconify-icon>';
        badge.innerHTML = `${icon} ${t.toUpperCase()}`;
        container.appendChild(badge);
    });
}

function updateFileInputAccept(allowedTypes) {
    const input = document.getElementById('file-input');
    if (!input) return;
    if (allowedTypes === 'any') { input.removeAttribute('accept'); return; }
    const typeMap = { pdf: '.pdf', word: '.doc,.docx', image: '.jpg,.jpeg,.png,.gif', zip: '.zip' };
    const accepts = allowedTypes.split(',').map(t => typeMap[t.trim().toLowerCase()] || '').filter(Boolean);
    if (accepts.length > 0) input.accept = accepts.join(',');
}

function updateUISubmitted() {
    submitBtn.textContent = 'Edit Submission';
    submitBtn.classList.add('submitted');
    lockWorkBox(true);

    // แสดง timestamp
    const bar = submitBtn.parentElement;
    if (!document.querySelector('.submit-timestamp')) {
        const stamp = document.createElement('p');
        stamp.className = 'submit-timestamp';
        stamp.innerHTML = `<iconify-icon icon="ph:check-circle-fill" style="color: #1ABC14; vertical-align: middle;"></iconify-icon> Submitted on ${formatTimestamp(new Date())}`;
        bar.appendChild(stamp);
    }
}

function updateUIDeadlinePassed() {
    submitBtn.disabled = true;
    submitBtn.textContent = 'หมดเวลาส่งงาน';
    submitBtn.classList.add('submitted');
    lockWorkBox(true);

    const bar = submitBtn.parentElement;
    if (!document.querySelector('.submit-timestamp')) {
        const stamp = document.createElement('p');
        stamp.className = 'submit-timestamp';
        stamp.innerHTML = `<iconify-icon icon="ph:x-circle-fill" style="color: #E53935; vertical-align: middle;"></iconify-icon> หมดเวลาส่งงานแล้ว`;
        bar.appendChild(stamp);
    }
}

// api : submission
async function handleSubmission() {
    if (selectedStudentFiles.length === 0) {
        alert('Please upload at least one file before submitting.');
        return;
    }

    try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        const userData = JSON.parse(localStorage.getItem("user") || '{}');
        const studentId = userData.user_id || '';

        const formData = new FormData();
        selectedStudentFiles.forEach(file => {
            formData.append('file', file);
        });
        formData.append('assignment_id', assignment_Id);
        formData.append('course_id', courseId);
        formData.append('student_id', studentId);

        const submitRes = await fetch(`${BASE_URL}/submissions/`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${TOKEN}`
                // ห้ามใส่ Content-Type เองเวลาใช้ FormData
            },
            body: formData
        });

        const submitData = await submitRes.json();

        if (submitData.success) {
            isSubmitted = true;
            updateUISubmitted();
            showSubmittedFileFromLocal(selectedStudentFiles);
            alert("ส่งงานสำเร็จเรียบร้อย!");
        } else {
            console.error("Submit failed:", submitData);
            alert(submitData.message || "ส่งงานไม่สำเร็จ");
        }

    } catch (err) {
        console.error("Submit Error:", err);
        alert("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    } finally {
        submitBtn.disabled = false;
        if (!isSubmitted) {
            submitBtn.textContent = 'Submit';
        }
    }
}
// เรียกทำงานทันทีที่โหลดหน้า
fetchAssignmentDetail();
fetchAssignmentAttachments();

// file list helpers
function clearFileList() {
    const list = document.getElementById('my-work-list');
    if (list) list.innerHTML = '';
}

function renderFileRow(name, fileUrl, canDelete, onDelete) {
    const list = document.getElementById('my-work-list');
    if (!list) return;

    const ft = (name.split('.').pop() || '').toLowerCase();
    const iconHtml = ft === 'pdf'
        ? '<iconify-icon icon="material-icon-theme:pdf" width="22" height="22"></iconify-icon>'
        : '<iconify-icon icon="ph:file-duotone" width="22" height="22" style="color:#6b7280;"></iconify-icon>';

    const row = document.createElement('div');
    row.className = 'work-file-row';
    row.innerHTML = iconHtml;

    const nameBtn = document.createElement('button');
    nameBtn.className = 'work-file-row-name';
    nameBtn.textContent = name;
    if (fileUrl) nameBtn.addEventListener('click', () => window.open(fileUrl, '_blank'));
    row.appendChild(nameBtn);

    if (canDelete) {
        const menuWrapper = document.createElement('div');
        menuWrapper.className = 'file-menu-wrapper';

        const menuBtn = document.createElement('button');
        menuBtn.className = 'work-file-row-menu';
        menuBtn.innerHTML = '<iconify-icon icon="ph:dots-three-vertical-bold" width="18" height="18"></iconify-icon>';

        const dropdown = document.createElement('div');
        dropdown.className = 'file-row-dropdown';

        const deleteOpt = document.createElement('button');
        deleteOpt.className = 'dropdown-option dropdown-option-danger';
        deleteOpt.innerHTML = '<iconify-icon icon="ph:trash-duotone" width="16" height="16"></iconify-icon> Delete';
        deleteOpt.addEventListener('click', () => {
            if (onDelete) onDelete();
            row.remove();
            dropdown.style.display = 'none';
            const zone = document.getElementById('student-drop-zone');
            if (zone && selectedStudentFiles.length === 0) zone.style.display = 'flex';
        });
        dropdown.appendChild(deleteOpt);

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.file-row-dropdown').forEach(d => d.style.display = 'none');
            dropdown.style.display = 'block';
        });

        menuWrapper.appendChild(menuBtn);
        menuWrapper.appendChild(dropdown);
        row.appendChild(menuWrapper);
    }

    list.appendChild(row);
}

function renderSelectedStudentFiles() {
    clearFileList();
    selectedStudentFiles.forEach(file => {
        const localUrl = URL.createObjectURL(file);
        renderFileRow(file.name, localUrl, true, () => {
            selectedStudentFiles = selectedStudentFiles.filter(selected => selected !== file);
        });
    });

    if (dropZone) {
        dropZone.style.display = 'flex';
    }
}

// drop zone setup
const dropZone = document.getElementById('student-drop-zone');
const fileInput = document.getElementById('file-input');

document.addEventListener('click', () => {
    document.querySelectorAll('.file-row-dropdown').forEach(d => d.style.display = 'none');
});

if (fileInput) {
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedStudentFiles = selectedStudentFiles.concat(Array.from(e.target.files));
            submittedFileInfos = [];
            renderSelectedStudentFiles();
        }
        fileInput.value = '';
    });
}

if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            selectedStudentFiles = selectedStudentFiles.concat(Array.from(e.dataTransfer.files));
            submittedFileInfos = [];
            renderSelectedStudentFiles();
        }
    });
}
// timestamp
function parseBackendDate(str) {
    if (!str) return null;
    // backend ส่ง UTC มาแต่ไม่มี Z → ต้องบอก JS ว่าเป็น UTC
    if (typeof str === 'string' && !str.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(str)) {
        str = str + 'Z';
    }
    return new Date(str);
}

function formatTimestamp(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const thai = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    return `${days[thai.getDay()]} ${String(thai.getDate()).padStart(2, '0')} ${months[thai.getMonth()]} ${String(thai.getFullYear()).slice(-2)}, ${String(thai.getHours()).padStart(2, '0')}:${String(thai.getMinutes()).padStart(2, '0')}`;
}

// lock/unlock upload
function lockWorkBox(locked) {
    const zone = document.getElementById('student-drop-zone');
    if (!zone) return;
    if (locked) {
        zone.style.display = 'none';
    } else {
        // Edit mode: re-render submitted file with canDelete=true (don't clear)
        if (submittedFileInfos.length > 0) {
            clearFileList();
            submittedFileInfos.forEach(file => renderFileRow(file.name, file.fileUrl, true));
        }
        selectedStudentFiles = [];
        zone.style.display = 'flex';
    }
}

const cancelBtn = document.getElementById('cancel-btn');

function enterEditMode() {
    isSubmitted = false;
    submitBtn.textContent = 'Submit';
    submitBtn.classList.remove('submitted');
    cancelBtn.style.display = 'inline-flex';
    lockWorkBox(false);
    const stamp = document.querySelector('.submit-timestamp');
    if (stamp) stamp.remove();
}

function exitEditMode() {
    isSubmitted = true;
    cancelBtn.style.display = 'none';
    updateUISubmitted();
    if (submittedFileInfos.length > 0) {
        clearFileList();
        submittedFileInfos.forEach(file => renderFileRow(file.name, file.fileUrl, false));
    }
    selectedStudentFiles = [];
}

// submit button
submitBtn.addEventListener('click', () => {
    if (isSubmitted) {
        if (confirm('Do you want to edit your submission? This will allow you to change files.')) {
            enterEditMode();
        }
    } else {
        handleSubmission();
    }
});

cancelBtn.addEventListener('click', () => {
    exitEditMode();
});

// back button
const backBtn = document.getElementById('back-btn');

backBtn.addEventListener('click', () => {
    window.history.back();
});
