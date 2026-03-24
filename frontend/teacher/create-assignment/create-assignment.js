document.addEventListener('DOMContentLoaded', () => {

    // 1. จัดการเรื่อง Checkbox "Any"
    const anyCheckbox = document.getElementById('check-any');
    const formatCheckboxes = document.querySelectorAll('.format-check');

    // ถ้ากด Any ให้ล้างอันอื่นออก
    anyCheckbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            formatCheckboxes.forEach(cb => cb.checked = false);
        }
    });

    // ถ้าไปกดเลือกไฟล์เฉพาะเจาะจง ให้เอาติ๊ก Any ออก
    formatCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            const isAnyChecked = Array.from(formatCheckboxes).some(checkbox => checkbox.checked);
            if (isAnyChecked) {
                anyCheckbox.checked = false;
            } else {
                // ถ้าเอาติ๊กออกหมด ให้กลับไปเลือก Any อัตโนมัติ
                anyCheckbox.checked = true;
            }
        });
    });

    // 2. เอฟเฟกต์ Drag & Drop ไฟล์ (แค่ทำสีให้ดูสวยตอนลากผ่าน)
    const dropZone = document.getElementById('drop-zone');

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        // ตรงนี้สามารถดึง e.dataTransfer.files ไปใช้งานต่อได้
        console.log("Files dropped:", e.dataTransfer.files);
    });

    // 3. จำลองการกด Post (บันทึกข้อมูล)
    const form = document.getElementById('create-assignment-form');
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // ป้องกันเว็บรีเฟรช

        // จำลองโหลดนิดนึง แล้วเด้งกลับไปหน้า Dashboard (หรือหน้าที่แล้ว)
        const postBtn = document.querySelector('.btn-post');
        postBtn.innerHTML = '<iconify-icon icon="line-md:loading-twotone-loop" width="24"></iconify-icon> Posting...';
        postBtn.style.opacity = '0.8';

        setTimeout(() => {
            alert('สร้าง Assignment สำเร็จแล้วค่ะคนสวย! 🎉');
            // คำสั่งพากลับไปหน้าเดิม
            history.back();
        }, 1000);
    });

});
// ==========================================
// ระบบเช็คโหมด (Create vs Edit)
// ==========================================

// 1. อ่านค่าจาก URL (เช่น create-assignment.html?mode=edit)
const urlParams = new URLSearchParams(window.location.search);
const mode = urlParams.get('mode');

// 2. ถ้า URL ระบุว่าเป็นโหมด Edit ให้เปลี่ยนหน้าตาและยัดข้อมูล
if (mode === 'edit') {

    // 2.1 เปลี่ยนหัวข้อและข้อความปุ่ม
    document.getElementById('page-title').textContent = 'Edit Assignment';
    document.getElementById('submit-btn').textContent = 'Save Changes';

    // 2.2 จำลองข้อมูลเดิมที่ดึงมาจาก Database
    const mockEditData = {
        title: "Assignment 2: Entity-Relationship (ER) Diagram",
        course: "cs232",
        description: "ให้นักศึกษาออกแบบ Entity-Relationship (ER) Diagram สำหรับระบบจัดการร้านหนังสือออนไลน์...",
        dueDate: "2026-03-11T23:59", // Format ของ input type="datetime-local"
        points: 100,
        formats: ["PDF", "Zip"] // สมมติว่าเคยอนุญาตแค่ 2 ไฟล์นี้
    };

    // 2.3 ยัดข้อมูลใส่กล่อง Input
    document.getElementById('assign-title').value = mockEditData.title;
    document.getElementById('assign-course').value = mockEditData.course;
    document.getElementById('assign-desc').value = mockEditData.description;
    document.getElementById('assign-date').value = mockEditData.dueDate;
    document.getElementById('assign-points').value = mockEditData.points;

    // 2.4 จัดการ Checkbox ประเภทไฟล์
    document.getElementById('check-any').checked = false; // เอาติ๊ก Any ออก
    const checkboxes = document.querySelectorAll('.format-check');
    checkboxes.forEach(cb => {
        // ถ้า value ของ Checkbox ตรงกับข้อมูลใน Database ให้ติ๊กถูก
        if (mockEditData.formats.includes(cb.value)) {
            cb.checked = true;
        }
    });
}

// ==========================================
// ปรับปรุงปุ่ม Post/Save ให้แสดงข้อความแจ้งเตือนตามโหมด
// ==========================================
const form = document.getElementById('create-assignment-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submit-btn');
    const isEdit = mode === 'edit';

    // เปลี่ยนข้อความตอนกำลังโหลด
    submitBtn.innerHTML = `<iconify-icon icon="line-md:loading-twotone-loop" width="24"></iconify-icon> ${isEdit ? 'Saving...' : 'Posting...'}`;
    submitBtn.style.opacity = '0.8';

    setTimeout(() => {
        // โชว์ข้อความตามโหมด
        if (isEdit) {
            alert('บันทึกการแก้ไขเรียบร้อยแล้วค่ะ! ✨');
        } else {
            alert('สร้าง Assignment สำเร็จแล้วค่ะคนสวย! 🎉');
        }
        history.back();
    }, 1000);
});