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

    const isOpen = coursesItem.classList.toggle('open');

    if (isOpen) {
        setActiveLink(courseBtn);
    }
});

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
toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
    document.body.classList.toggle("sidebar-collapsed");
});

// ฟังก์ชันวิชาใน Sidebar จากข้อมูลจริง
function renderSidebarCourses(courses) {
    const sidebarList = document.getElementById('submenu');
    if (!sidebarList) return;

    // ล้างวิชาเก่า ออกให้หมด
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

        li.appendChild(link);
        sidebarList.appendChild(li);
    });
}

// ทำให้ฟังก์ชันนี้เรียกใช้ได้จากไฟล์อื่น (Global Scope)
window.renderSidebarCourses = renderSidebarCourses;