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
