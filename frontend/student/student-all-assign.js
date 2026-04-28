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



// api
const BASE_URL = 'https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com';

// [เพิ่ม] ตรวจสอบ Token และดึงข้อมูล User จาก localStorage
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.token) {
    window.location.href = "../auth/login.html";
}

const TOKEN = userData ? userData.token : '';
const USER_ID = userData ? userData.user_id : '';

let ASSIGNMENTS = [];

function parseLocalDate(dateInput) {
    //  FIX: ถ้าเป็น Date อยู่แล้ว → ใช้เลย
    if (dateInput instanceof Date) {
        return dateInput;
    }

    //  FIX: ถ้าเป็น string ค่อย parse
    if (typeof dateInput === "string") {
        const [datePart, timePart] = dateInput.split("T");
        if (!datePart || !timePart) return new Date(dateInput);

        const [y, m, d] = datePart.split("-").map(Number);
        const [hh, mm, ss] = timePart.split(":").map(Number);

        return new Date(y, m - 1, d, hh, mm, ss || 0);
    }

    // fallback กันตาย
    return new Date(dateInput);
}

function mapStatus(a) {
    const now = new Date();
    const dueDate = parseLocalDate(a.due);

    // 1. COMPLETE (ต้องเช็คก่อน)
    if (a.isExternal) {
        if (a.submission_status === "Submitted for grading") {
            return "complete";
        }
    } else {
        if (a.status === 'submitted' || a.status === 'graded') {
            return "complete";
        }
    }

    //  2. DUE TODAY (แก้หลัก)
    const isSameDay =
        dueDate.getFullYear() === now.getFullYear() &&
        dueDate.getMonth() === now.getMonth() &&
        dueDate.getDate() === now.getDate();

    if (isSameDay) {
        return "due-today";
    }

    //  3. OVERDUE
    if (dueDate < now) {
        return "overdue";
    }

    //  4. UPCOMING
    return "upcoming";
}

async function fetchAssignments() {
    try {
        //ดึงคอร์สทั้งหมด
        const courseRes = await fetch(`${BASE_URL}/courses/my/${USER_ID}?role=student`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        const courseJson = await courseRes.json();
        const courses = courseJson || [];
        //อัปเดตปุ่ม Filter วิชา
        updateFilterUI(courses);
        //เรียกฟังก์ชันแสดงวิชาใน sidebar.js
        if (window.renderSidebarCourses) {
            window.renderSidebarCourses(courses);
        }

        let allAssignments = [];

        // ดึงงานของแต่ละคอร์ส (ใช้ merged endpoint รวม internal + external)
        // TODO: รอ backend ทำ /assignments/merged/:course_id ให้เรียบร้อยก่อน
        //       ตอนนี้ถ้า merged ยังไม่มี fetchMergedAssignments จะคืน [] แล้วเราจะ
        //       fallback ไปใช้ internal endpoint เดิมก่อน เพื่อไม่ให้หน้าเสีย
        for (let course of courses) {
            let merged = [];
            if (window.ScraperMerge) {
                merged = await window.ScraperMerge.fetchMergedAssignments(
                    BASE_URL, course.course_id, TOKEN, course
                );
            }

            // Fallback: ถ้า merged ว่าง (อาจเพราะ endpoint ยังไม่พร้อม) → ใช้ internal เดิม
            // TODO: เมื่อ merged endpoint พร้อมจริง ค่อยลบ block fallback นี้ออก
            if (!merged.length) {
                const assignRes = await fetch(`${BASE_URL}/assignments/${course.course_id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                const assignJson = await assignRes.json();
                if (!assignJson.success || !Array.isArray(assignJson.data)) continue;
                merged = assignJson.data.map(a =>
                    window.ScraperMerge.normalizeAssignment(
                        { ...a, source: 'internal' },
                        course
                    )
                );
            }

            // ดึง submission status เฉพาะ internal (external ไม่มีในระบบเรา)
            const withStatus = await Promise.all(merged.map(async (m) => {
                if (m.isExternal) return m; // external ไม่มี submission
                try {
                    const subRes = await fetch(
                        `${BASE_URL}/submissions/assignment/${m.id}/student/${USER_ID}`,
                        { headers: { 'Authorization': `Bearer ${TOKEN}` } }
                    );
                    const subJson = await subRes.json();
                    return { ...m, status: subJson.data?.status || null };
                } catch {
                    return { ...m, status: null };
                }
            }));

            const mapped = withStatus.map(m => ({
                id: m.id,
                course_id: m.course_id,
                name: m.title,
                className: m.course_code,
                points: m.max_score || 0,
                due: m.due_date ? new Date(m.due_date) : new Date(),

                // 🔥 ส่งข้อมูลครบให้ mapStatus
                status: mapStatus({
                    status: m.status,                      // internal
                    submission_status: m.submission_status, // external
                    due: m.due_date ? new Date(m.due_date) : new Date(),
                    isExternal: m.isExternal
                }),

                isExternal: m.isExternal,
                external_url: m.external_url,
                source: m.source,
            }));

            allAssignments.push(...mapped);
        }
        ASSIGNMENTS = allAssignments;
        render();

    } catch (err) {
        console.error("Error fetching assignments:", err);
        assignList.innerHTML = `<li class="empty-msg" style="color: red;">Failed to connect to server.</li>`;
    }
}


const now = new Date();

function daysFromNow(d, h = 23, m = 59) {
    const t = new Date(now);
    t.setDate(t.getDate() + d);
    t.setHours(h, m, 0, 0);
    return t;
}

//State 
let activeTab = 'upcoming';
let activeSort = 'closest';
let searchQuery = '';

const assignList = document.getElementById('assignment-list');
const emptyMsg = document.getElementById('empty-msg');
const searchInput = document.getElementById('search-input');

//update assignment container radius
function updateContainerRadius() {
    const tabs = document.querySelectorAll('.tab-btn');
    const container = document.querySelector('.assignment-container');
    if (!container) return;
    const total = tabs.length;

    tabs.forEach((tab, i) => {
        if (tab.classList.contains('active')) {
            const isFirst = i === 0;
            const isLast = i === total - 1;
            container.style.borderRadius = [
                isFirst ? '0' : '12px',   // top-left
                isLast ? '0' : '12px',   // top-right
                '12px',                      // bottom-right
                '12px'                       // bottom-left
            ].join(' ');
        }
    });
}

function formatDueLabel(a) {
    const now = new Date();
    const due = parseLocalDate(a.due); //  ใช้ตัว parse ที่เคยแก้ไว้

    const diff = due - now; // milliseconds
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(diff / 86400000);

    // COMPLETE
    if (a.status === 'complete') {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return {
            text: `${due.getDate()} ${months[due.getMonth()]} ${due.getFullYear()}`,
            cls: 'due-done'
        };
    }

    // OVERDUE
    if (a.status === 'overdue') {
        const overdueDays = Math.abs(Math.floor(diff / 86400000));
        return {
            text: `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`,
            cls: 'due-urgent'
        };
    }

    // DUE TODAY
    if (a.status === 'due-today') {
        if (mins <= 0) {
            return { text: "Due now", cls: 'due-urgent' };
        }
        if (mins < 60) {
            return { text: `Due in ${mins} minutes`, cls: 'due-urgent' };
        }
        return { text: `Due in ${hours} hours`, cls: 'due-urgent' };
    }

    // UPCOMING
    if (days <= 0) {
        return { text: "Due today", cls: 'due-urgent' };
    }

    return {
        text: `Due in ${days} day${days !== 1 ? 's' : ''}`,
        cls: 'due-normal'
    };
}

function rightContent(a) {
    // FIX: external ไม่ต้องแสดงอะไรเลย
    if (a.isExternal) {
        return '';
    }
    if (a.status === 'complete') {
        return `<iconify-icon icon="ph:check-circle-fill" style="color: #1ABC14; font-size: 20px;"></iconify-icon>`;
    }
    if (a.status === 'overdue') {
        return `<iconify-icon icon="ph:prohibit-bold" style="color: #E53935; font-size: 20px;"></iconify-icon>`;
    }
    // NORMAL (internal เท่านั้น)
    return `<span class="assign-points-label">${a.points} Point</span>`;
}

function updateFilterUI(courses) {
    const filterDropdown = document.getElementById('filter-dropdown');

    // วนลูปสร้างตัวเลือกจากวิชาที่ดึงมาจาก API
    courses.forEach(course => {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.dataset.class = course.course_code;
        option.textContent = course.course_code;

        // ใส่ Event Listener ให้ปุ่มที่สร้างขึ้นใหม่
        option.addEventListener('click', () => {
            document.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
            option.classList.add('active');
            activeFilter = option.dataset.class;
            filterWrap.classList.remove('open');
            render();
        });

        filterDropdown.appendChild(option);
    });
}

// Render 
function render() {
    let list = ASSIGNMENTS.filter(a => a.status === activeTab);
    // Filter by class
    if (activeFilter !== 'all') {
        list = list.filter(a => a.className === activeFilter);
    }
    // Search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.className.toLowerCase().includes(q)
        );
    }
    // Sort
    list.sort((a, b) =>
        activeSort === 'closest' ? a.due - b.due : b.due - a.due
    );

    assignList.innerHTML = '';

    if (list.length === 0) {
        assignList.innerHTML = `<li class="empty-msg">There are no assignment</li>`;
        return;
    }

    list.forEach(a => {
        const due = formatDueLabel(a);
        const li = document.createElement('li');
        li.className = 'assignment-item' + (a.isExternal ? ' is-external' : '');
        // ป้าย External สำหรับ assignment ที่มาจาก scraper
        const externalBadge = a.isExternal
            ? `<span class="ext-badge" title="From external source">
                   <iconify-icon icon="ph:link-bold" width="12" height="12"></iconify-icon> External
               </span>`
            : '';
        li.innerHTML = `
            <div class="assign-avatar">${a.className}</div>
            <div class="assign-info">
                <p class="assign-name">${a.name} ${externalBadge}</p>
                <p class="assign-due-label ${due.cls}">${due.text}</p>
                <p class="assign-class">${a.className}</p>
            </div>
            <div class="assign-right">${rightContent(a)}</div>
        `;
        li.addEventListener('click', () => {
            // external -> เปิดลิงก์ภายนอกในแท็บใหม่ , internal -> หน้า submit เดิม
            window.ScraperMerge?.handleAssignmentClick(
                a,
                (item) => `student-assign-submit.html?id=${item.id}&course_id=${item.course_id}`
            );
        });
        assignList.appendChild(li);
    });
}

// Tabs 
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        render();
        updateContainerRadius();
    });
});

// Sort
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSort = btn.dataset.sort;
        render();
    });
});

// Search
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    render();
});

// Filter 
let activeFilter = 'all';

const filterBtn = document.getElementById('filter-btn');
const filterDropdown = document.getElementById('filter-dropdown');
const filterWrap = filterBtn.closest('.filter-wrap');



// dropdown
filterBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    filterWrap.classList.toggle('open');
});

// ปิดdropdown
document.addEventListener('click', () => {
    filterWrap.classList.remove('open');
});

filterDropdown.addEventListener('click', e => e.stopPropagation());

document.querySelectorAll('.filter-option').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.class;
        filterWrap.classList.remove('open');
        render();
    });
});

updateContainerRadius();
fetchAssignments();

// Bind ปุ่ม Sync (เรียก scraper ให้ล้าง+ดึงใหม่ แล้ว reload list)
// TODO: confirm endpoint/method กับ backend ใน scraper-merge.js
window.ScraperMerge?.bindSyncButton(
    document.getElementById('sync-btn'),
    BASE_URL,
    TOKEN,
    fetchAssignments
);
