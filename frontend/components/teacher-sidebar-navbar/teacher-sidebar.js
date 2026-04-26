const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const submenu = document.getElementById('submenu');
const coursesItem = document.getElementById('courses-item');
const courseBtn = document.getElementById('courseBtn');

const BASE_URL = 'https://2z3eq1a51d.execute-api.us-east-1.amazonaws.com/default';

// คำนวณ base path ไปยัง /frontend/teacher/ ให้ถูกต้องไม่ว่าจะอยู่ที่ depth ไหน
function getTeacherBasePath() {
    const path = window.location.pathname;
    const idx = path.indexOf('/teacher/');
    if (idx !== -1) return path.substring(0, idx) + '/teacher/';
    return '';
}

const TEACHER_BASE = getTeacherBasePath();

//สถานะ Active
function setActiveLink(target) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    target.classList.add('active');
}

//การยุบ/ขยาย Sidebar
toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed');

    // ถ้า Sidebar ยุบ ให้ปิดเมนูย่อย
    if (sidebar.classList.contains('collapsed')) {
        coursesItem.classList.remove('open');
    }
});

//เมนู My courses
courseBtn.addEventListener('click', (e) => {
    e.preventDefault();

    // ถ้า Sidebar ยุบอยู่ ให้ขยายออกก่อน
    if (sidebar.classList.contains('collapsed')) {
        sidebar.classList.remove('collapsed');
    }

    setActiveLink(courseBtn);
    coursesItem.classList.add('open');
    window.location.href = TEACHER_BASE + 'teacher-mycourses.html';
});

//แผนที่หน้าของแต่ละปุ่ม (teacher)
const pageRoutes = {
    'dashboard': TEACHER_BASE + 'teacher-dashboard.html',
    'grading': TEACHER_BASE + 'teacher-assign-overview/teacher-assign-overview.html',
    'courses': TEACHER_BASE + 'teacher-mycourses.html',
    'announcements': TEACHER_BASE + 'teacher-announcement/announcement-page.html'
};
//จัดการเมนูหลักอื่นๆ
document.querySelectorAll('.nav-link[data-page]').forEach(link => {
    if (link.id === 'courseBtn') return;

    link.addEventListener('click', (e) => {
        e.preventDefault();

        // ตั้งค่า Active ให้เมนูที่คลิก
        setActiveLink(link);

        coursesItem.classList.remove('open');

        // ล้างสถานะ Active ของเมนูย่อย
        document.querySelectorAll('.sub-link').forEach(s => s.classList.remove('active-sub'));
        // นำทางไปยังหน้าที่กำหนด
        const page = link.getAttribute('data-page');
        console.log("Navigating to:", page); // เพิ่มไว้เช็คใน Console

        if (pageRoutes[page]) {
            window.location.href = pageRoutes[page];
        } else {
            console.warn("Route not found for:", page);
        }
    });
});

//จัดการเมนูย่อย
document.querySelectorAll('.sub-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();

        //ล้าง Active ของเมนูย่อยตัวอื่น
        document.querySelectorAll('.sub-link').forEach(l => l.classList.remove('active-sub'));

        //เพิ่ม Active ให้วิชาที่เลือก
        link.classList.add('active-sub');

        //ทำให้เมนู My courses Active ตัวเดียว
        setActiveLink(courseBtn);
    });
});

// ปุ่ม Log out
const logoutLink = document.querySelector('.logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = '/frontend/auth/login.html';
    });
}

// ฟังก์ชันวิชาใน Sidebar จากข้อมูลจริง
function renderSidebarCourses(courses) {
    const sidebarList = document.getElementById('submenu');
    if (!sidebarList) return;

    sidebarList.innerHTML = '';

    courses.forEach(course => {
        const li = document.createElement('li');
        const link = document.createElement('a');

        link.href = '#';
        link.className = 'sub-link';
        link.textContent = course.course_code;
        link.dataset.courseId = String(course.course_id);

        link.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = `${TEACHER_BASE}courses-detail/courses-detail.html?course_id=${course.course_id}`;
        });

        li.appendChild(link);
        sidebarList.appendChild(li);
    });

    highlightActiveCourseSubLink();
}

function highlightActiveCourseSubLink() {
    const COURSE_PAGES = ['courses-detail.html', 'teacher-detail-grade.html', 'teacher-assign-manage.html'];
    const currentFile = window.location.pathname.split('/').pop();
    if (!COURSE_PAGES.includes(currentFile)) return;

    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('course_id');
    if (!courseId) return;

    const subLink = document.querySelector(`.sub-link[data-course-id="${courseId}"]`);
    if (subLink) {
        document.querySelectorAll('.sub-link').forEach(l => l.classList.remove('active-sub'));
        subLink.classList.add('active-sub');
    }
}

// ตั้งค่า Active ตามหน้าปัจจุบัน
function initActiveFromURL() {
    const currentFile = window.location.pathname.split('/').pop();
    const reverseRoutes = {
        'teacher-dashboard.html': 'dashboard',
        'teacher-mycourses.html': 'courses',
        'teacher-assign-manage.html': 'courses',
        'teacher-assign-overview.html': 'grading',
        'teacher-detail-grade.html': 'courses',
        'create-assignment.html': 'grading',
        'announcement-page.html': 'announcements',
        'announcement-create.html': 'announcements',
        'courses-detail.html': 'courses',
        'teacher-assign-create.html': 'dashboard'
    };

    const activePage = reverseRoutes[currentFile];
    if (!activePage) return;

    if (activePage === 'courses') {
        setActiveLink(courseBtn);
        coursesItem.classList.add('open');
    } else {
        const activeLink = document.querySelector(`.nav-link[data-page="${activePage}"]`);
        if (activeLink) setActiveLink(activeLink);
    }
}
initActiveFromURL();

async function fetchSidebarCourses() {
    const userData = JSON.parse(localStorage.getItem('user'));
    const TOKEN = userData ? userData.token : '';
    const USER_ID = userData ? userData.user_id : '';

    try {
        const res = await fetch(`${BASE_URL}/courses/my/${USER_ID}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();
        renderSidebarCourses(data.data || data || []);
    } catch (err) {
        console.error('Error fetching sidebar courses:', err);
    }
}
fetchSidebarCourses();


// เรียกใช้ได้จากไฟล์อื่น
window.renderSidebarCourses = renderSidebarCourses;