const sidebar = document.getElementById('sidebar');
const toggleBtn = document.getElementById('toggleBtn');
const submenu = document.getElementById('submenu');
const coursesItem = document.getElementById('courses-item');
const courseBtn = document.getElementById('courseBtn');

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
    window.location.href = 'student-mycourses.html';
});

//แผนที่หน้าของแต่ละปุ่ม
const pageRoutes = {
    'home': 'home.html',
    'assignments': 'student-all-assign.html',
    'courses': 'student-mycourses.html',
    'announcements': 'student-announce.html'
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
        if (pageRoutes[page]) {
            window.location.href = pageRoutes[page];
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
/*toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    document.body.classList.toggle("sidebar-collapsed");
});*/

// ปุ่ม Log out
const logoutLink = document.querySelector('.logout-link');
if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = '../auth/login.html';
    });
}

function getActiveCourseIdFromURL() {
    const currentFile = window.location.pathname.split('/').pop();
    const urlParams = new URLSearchParams(window.location.search);

    // หน้า student-assign-submit.html
    // id = assignment_id
    // course_id = course_id ของวิชาจริง
    if (currentFile === 'student-assign-submit.html') {
        return urlParams.get('course_id');
    }

    // หน้า course detail
    // id = course_id
    if (currentFile === 'student-courses-detail.html') {
        return urlParams.get('id');
    }

    return urlParams.get('course_id') || urlParams.get('id');
}

// ตั้งค่า Active ตามหน้าปัจจุบัน
function initActiveFromURL() {
    const currentFile = window.location.pathname.split('/').pop();
    const urlParams = new URLSearchParams(window.location.search);

    if (currentFile === 'student-assign-submit.html' && urlParams.get('course_id')) {
        setActiveLink(courseBtn);
        coursesItem.classList.add('open');
        return;
    }


    const reverseRoutes = {
        'home.html': 'home',
        'student-all-assign.html': 'assignments',
        'student-announce.html': 'announcements',
        'student-mycourses.html': 'courses',
        'student-courses-detail.html': 'courses'
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

// ฟังก์ชันวิชาใน Sidebar จากข้อมูลจริง
function renderSidebarCourses(courses) {
    const sidebarList = document.getElementById('submenu');
    if (!sidebarList) return;

    sidebarList.innerHTML = '';

    // วนลูปสร้างวิชาใหม่
    courses.forEach(course => {
        const li = document.createElement('li');
        const link = document.createElement('a');

        link.href = "#";
        link.className = 'sub-link';
        link.textContent = course.course_code;

        // เมื่อคลิกวิชา ให้ไปหน้า courses detail
        link.addEventListener('click', (e) => {
            e.preventDefault();

            const courseId = course.course_id;
            window.location.href = `../student/student-courses-detail.html?id=${courseId}`;
        });

        // highlight วิชาที่ตรงกับ URL ปัจจุบัน
        const currentCourseId = getActiveCourseIdFromURL();

        if (currentCourseId && String(course.course_id) === String(currentCourseId)) {
            link.classList.add('active-sub');
            setActiveLink(courseBtn);
            coursesItem.classList.add('open');
        }

        li.appendChild(link);
        sidebarList.appendChild(li);
    });
}

// ดึงรายวิชาจาก API แล้วแสดงใน sidebar
async function fetchSidebarCourses() {
    const BASE_URL = "https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com";

    // [เพิ่ม] ตรวจสอบ Token และดึงข้อมูล User จาก localStorage
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.token) {
        window.location.href = "../auth/login.html";
    }

    const TOKEN = userData ? userData.token : '';
    const USER_ID = userData ? userData.user_id : '';

    try {
        //ดึงคอร์สทั้งหมด
        const courseRes = await fetch(`${BASE_URL}/courses/my/${USER_ID}?role=student`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        const data = await courseRes.json();
        const courses = data.data || data || [];
        renderSidebarCourses(courses);
    } catch (err) {
        console.error('Error fetching sidebar courses:', err);
    }
}
fetchSidebarCourses();

// เรียกใช้ได้จากไฟล์อื่น 
window.renderSidebarCourses = renderSidebarCourses;
