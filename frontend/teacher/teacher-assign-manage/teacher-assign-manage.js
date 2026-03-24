// ==========================================
// 0. Mock Data: จำลองข้อมูล Assignment
// ==========================================
const backendAssignmentData = {
    title: "Assignment 2: Entity-Relationship (ER) Diagram Design",
    dueDate: "WE 11 Mar 26, 11:59 PM",
    instructions: "ให้นักศึกษาออกแบบ Entity-Relationship (ER) Diagram สำหรับระบบจัดการร้านหนังสือออนไลน์ (E-Commerce Book Store) โดยต้องประกอบด้วย Entity อย่างน้อย 5 ตัว พร้อมระบุ Primary Key, Foreign Key ให้ถูกต้อง",
    points: 100,
    // ✨ เพิ่มประเภทไฟล์ที่อาจารย์เลือกไว้ตรงนี้ (เป็น Array) ✨
    allowedFormats: ['PDF', 'Image (.jpg, .png)', 'Zip (.zip)'], 
    file: {
        name: "CS232_Assign02_Instruction.pdf",
        size: "1.2 MB"
    }
};

// ==========================================
// 0.1 ฟังก์ชันเอาข้อมูล Backend ไปแสดงบนหน้าเว็บ
// ==========================================
function renderAssignmentDetails() {
    // โยนข้อมูล Text ทั่วไป
    document.getElementById('display-title').textContent = backendAssignmentData.title;
    document.getElementById('display-due-date').textContent = `Due date on ${backendAssignmentData.dueDate}`;
    document.getElementById('display-instructions').textContent = backendAssignmentData.instructions;
    document.getElementById('display-points').textContent = `${backendAssignmentData.points} Points`;
    document.getElementById('display-file-name').textContent = backendAssignmentData.file.name;
    document.getElementById('display-file-size').textContent = backendAssignmentData.file.size;

    // ✨ โยนข้อมูล Supported Formats (วนลูปสร้างป้าย Badge) ✨
    const formatsContainer = document.getElementById('display-allowed-formats');
    formatsContainer.innerHTML = ''; // เคลียร์ของเก่าก่อน
    
    backendAssignmentData.allowedFormats.forEach(format => {
        // สร้างแท็ก <span> ขึ้นมาใหม่
        const badge = document.createElement('span');
        badge.className = 'format-badge';
        
        // ถ้าเป็นแบบโปรหน่อย สามารถดักจับชื่อเพื่อใส่ไอคอน Iconify ได้ด้วย!
        let iconHtml = '';
        if(format.includes('PDF')) iconHtml = '<iconify-icon icon="ph:file-pdf-duotone" style="color:#EF4444;"></iconify-icon>';
        else if(format.includes('Word')) iconHtml = '<iconify-icon icon="ph:file-doc-duotone" style="color:#2563EB;"></iconify-icon>';
        else if(format.includes('Image')) iconHtml = '<iconify-icon icon="ph:image-duotone" style="color:#10B981;"></iconify-icon>';
        else if(format.includes('Zip')) iconHtml = '<iconify-icon icon="ph:file-archive-duotone" style="color:#333;"></iconify-icon>';
        else iconHtml = '<iconify-icon icon="ph:file-duotone"></iconify-icon>'; // ค่าเริ่มต้นเผื่อเลือก Any

        // ประกอบไอคอนเข้ากับชื่อประเภทไฟล์
        badge.innerHTML = `${iconHtml} ${format}`;
        formatsContainer.appendChild(badge);
    });
}

// สั่งให้ฟังก์ชันทำงานทันทีที่โหลดหน้าเว็บ
renderAssignmentDetails();
// ==========================================
// 1. Mock Data (ข้อมูลนักศึกษาจำลอง)
// แบ่งตาม 3 สถานะ: Needs Grading, Fully Graded, Missing
// ==========================================
const mockStudents = [
    // --- กลุ่ม Needs Grading ---
    { id: "67091111111", name: "นางสาวขวัญใจ เมืองน่าน", date: "12 Feb 2026", status: "Submitted", file: "assign_01.pdf", grade: "", hasFeedback: false },
    { id: "67091111112", name: "นายสมชาย ใจดี", date: "11 Feb 2026", status: "Submitted", file: "my_work.pdf", grade: "", hasFeedback: false },
    
    // --- กลุ่ม Fully Graded ---
    { id: "67091111113", name: "นางสาวเรียนดี รักสงบ", date: "10 Feb 2026", status: "Graded", file: "hw_final.pdf", grade: "9", hasFeedback: true },
    { id: "67091111114", name: "นายตั้งใจ ใฝ่รู้", date: "10 Feb 2026", status: "Graded", file: "cs232_assign1.pdf", grade: "10", hasFeedback: false },

    // --- กลุ่ม Missing ---
    { id: "67091111115", name: "นายสายเสมอ นอนดึก", date: "-", status: "Missing", file: null, grade: "0", hasFeedback: false },
    { id: "67091111116", name: "นางสาวลืมส่ง งาน", date: "-", status: "Missing", file: null, grade: "0", hasFeedback: false }
];

// ==========================================
// 2. จัดการเรื่อง Tab Switching (คลิกสลับแท็บ)
// ==========================================
// ==========================================
// 2. จัดการเรื่อง Tab Switching (คลิกสลับแท็บ)
// ==========================================
const tabItems = document.querySelectorAll('.tab-item');
const editGradesBtn = document.getElementById('edit-grades-btn'); // ดึงปุ่ม Edit มารอไว้

let currentFilter = 'Needs Grading'; 

tabItems.forEach(tab => {
    tab.addEventListener('click', () => {
        tabItems.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentFilter = tab.textContent.trim();
        
        // ✨ เพิ่มลอจิกซ่อน/แสดงปุ่ม Edit ตรงนี้ค่ะ ✨
        if (currentFilter === 'Fully Graded') {
            editGradesBtn.style.display = 'flex'; // แสดงปุ่ม (ใช้ flex เพราะ css ปุ่มเราเป็น flex)
        } else {
            editGradesBtn.style.display = 'none'; // ซ่อนปุ่มในหน้าอื่นๆ
        }
        
        renderTable(currentFilter);
    });
});

// สำคัญ: ตอนโหลดหน้าเว็บครั้งแรก แท็บเป็น Needs Grading ต้องสั่งซ่อนปุ่ม Edit ไว้ก่อนด้วยค่ะ
editGradesBtn.style.display = 'none';


// ==========================================
// 3. ฟังก์ชันอัปเดตตาราง (Render Table)
// ==========================================
function renderTable(filterStr) {
    const tbody = document.querySelector('.grading-table tbody');
    tbody.innerHTML = ''; // ล้างข้อมูลเก่าทิ้งก่อนวาดใหม่

    // กรองข้อมูล: ถ้าแท็บคือ "Needs Grading" เอาเฉพาะคนที่ Submitted
    let filteredStudents = mockStudents;
    if (filterStr === 'Needs Grading') {
        filteredStudents = mockStudents.filter(student => student.status === 'Submitted');
    } else if (filterStr === 'Fully Graded') {
        filteredStudents = mockStudents.filter(student => student.status === 'Graded');
    } else if (filterStr === 'Missing') {
        filteredStudents = mockStudents.filter(student => student.status === 'Missing');
    }

    // เอาข้อมูลที่กรองแล้วมาวนลูปสร้าง <tr>
    filteredStudents.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = 'table-row';

        // --- จัดการหน้าตาของ Status ---
        let statusContent = '';
        let statusClass = '';

        if (student.status === 'Submitted') {
            statusContent = `<span class="badge badge-submitted">Submitted</span>`; // ใช้ Badge จาก CSS ที่เราทำ
        } else if (student.status === 'Graded') {
            statusContent = `<span class="badge badge-graded">Graded</span>`;
        } else if (student.status === 'Missing') {
            statusContent = `<span class="badge badge-missing">Missing</span>`;
        }

        // --- จัดการปุ่ม File ---
        let submissionContent = '';
        if (student.file) {
            submissionContent = `<button class="file-btn" type="button">
                                    <iconify-icon icon="material-icon-theme:pdf" width="24" height="24"></iconify-icon>
                                    ${student.file}
                                 </button>`;
        } else {
            submissionContent = `<span style="color: var(--text-muted); font-size: 0.9rem;">No File</span>`;
        }

        // --- จัดการไอคอน Feedback (3 สถานะ) ---
        let feedbackIcon = '';
        if (student.hasFeedback === true || student.status === 'Graded') {
            feedbackIcon = `<iconify-icon icon="hugeicons:bubble-chat-done" width="24" height="24" style="color: var(--green-positive);"></iconify-icon>`;
        } else if (student.status === 'Missing') {
            feedbackIcon = `<iconify-icon icon="hugeicons:bubble-chat-lock" width="24" height="24" style="color: var(--text-muted); opacity: 0.5;"></iconify-icon>`;
        } else {
            feedbackIcon = `<iconify-icon icon="hugeicons:bubble-chat" width="24" height="24" style="color: var(--text-main);"></iconify-icon>`;
        }

        // --- จัดการช่อง Grade ---
        let gradeInputHTML = '';
        if (student.status === 'Missing') {
             // หน้า Missing ให้โชว์เป็นเครื่องหมายขีด (-) สไตล์ตัวหนังสือสีเทา (ไม่มีกล่อง Input)
             gradeInputHTML = `<span style="color: var(--text-muted); font-weight: 500;">-</span>`; 
             // 💡 ทริค: ถ้าคนสวยอยากให้โชว์เลข 0 ก็เปลี่ยนเครื่องหมาย - เป็นเลข 0 ได้เลยค่ะ
        } else {
             // หน้าอื่นๆ (Needs Grading, Fully Graded) ให้โชว์กล่อง Input เหมือนเดิม
             gradeInputHTML = `<input type="text" class="grade-input" size="3" value="${student.grade}">`;
        }

        // --- ประกอบร่าง HTML ---
        tr.innerHTML = `
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.date}</td>
            <td>${statusContent}</td>
            <td>${submissionContent}</td>
            <td>${gradeInputHTML}</td>
            <td align="center">
                <button class="feedback-btn" type="button" style="background: none; border: none; cursor: pointer;">
                    ${feedbackIcon}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 4. สั่งรันฟังก์ชันครั้งแรกตอนโหลดหน้าเว็บ
// ให้โชว์แท็บ Needs Grading ก่อน
renderTable('Needs Grading');