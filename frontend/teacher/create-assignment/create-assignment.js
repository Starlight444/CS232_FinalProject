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