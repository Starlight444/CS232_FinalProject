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

function mapStatus(a) {
    const now = new Date();
    const dueDate = new Date(a.due_date);

    // ถ้าส่งแล้ว 
    if (a.status === 'submitted' || a.status === 'graded') {
        return 'complete';
    }
    // ถ้ายังไม่ส่งและเลยกำหนด
    if (dueDate < now) {
        return 'overdue';
    }
    // ถ้ายังไม่ส่งและยังไม่ถึงกำหนด
    return 'upcoming';
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

        // ดึงงานของแต่ละคอร์ส
        for (let course of courses) {

            // Step 2 — ดึง assignments ของ course นี้
            const assignRes = await fetch(`${BASE_URL}/assignments/${course.course_id}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const assignJson = await assignRes.json();
            if (!assignJson.success || !Array.isArray(assignJson.data)) continue;

            // Step 3 — ดึง submission status ของแต่ละ assignment พร้อมกัน
            const assignmentsWithStatus = await Promise.all(
                assignJson.data.map(async (a) => {
                    try {
                        const subRes = await fetch(
                            `${BASE_URL}/submissions/assignment/${a.assignment_id}/student/${USER_ID}`,
                            { headers: { 'Authorization': `Bearer ${TOKEN}` } }
                        );
                        const subJson = await subRes.json();
                        // ใช้ status จาก submission แทน assignment
                        const submissionStatus = subJson.data?.status || null;
                        return { ...a, status: submissionStatus };
                    } catch {
                        return { ...a, status: null };
                    }
                })
            );

            const mapped = assignmentsWithStatus.map(a => ({
                id: a.assignment_id,
                course_id: course.course_id,
                name: a.title,
                className: course.course_code,
                points: a.max_score || 0,
                due: new Date(a.due_date),
                status: mapStatus(a) // mapStatus ใช้ status จาก submission แล้ว
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
    if (a.status === 'due-today') {
        const mins = a.minutesLeft;
        if (mins < 60) return { text: `Due in ${mins} minutes`, cls: 'due-urgent' };
        return { text: `Due in ${Math.round(mins / 60)} hours`, cls: 'due-urgent' };
    }
    if (a.status === 'overdue') {
        const days = Math.round((now - a.due) / 86400000);
        return { text: `Overdue by ${days} day${days !== 1 ? 's' : ''}`, cls: 'due-urgent' };
    }
    if (a.status === 'upcoming') {
        const days = Math.round((a.due - now) / 86400000);
        if (days <= 0) return { text: 'Due today', cls: 'due-urgent' };
        return { text: `Due in ${days} day${days !== 1 ? 's' : ''}`, cls: 'due-normal' };
    }
    // complete
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { text: `${a.due.getDate()} ${months[a.due.getMonth()]} ${a.due.getFullYear()}`, cls: 'due-done' };
}

function rightContent(a) {
    if (a.status === 'complete') {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.36641 12.0001L2.56641 8.20007L3.51641 7.25007L6.36641 10.1001L12.4831 3.9834L13.4331 4.9334L6.36641 12.0001Z" fill="#1ABC14"/>
        </svg>`;
    }
    if (a.status === 'overdue') {
        return `<svg class="ban-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
    }
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
        li.className = 'assignment-item';
        li.innerHTML = `
            <div class="assign-avatar">${a.className}</div>
            <div class="assign-info">
                <p class="assign-name">${a.name}</p>
                <p class="assign-due-label ${due.cls}">${due.text}</p>
                <p class="assign-class">${a.className}</p>
            </div>
            <div class="assign-right">${rightContent(a)}</div>
        `;
        li.addEventListener('click', () => {
            window.location.href = `student-assign-submit.html?id=${a.id}&course_id=${a.course_id}`;
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
