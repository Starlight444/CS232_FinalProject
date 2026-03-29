document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // 🌟 ตั้งค่า API
    // ==========================================
    const API_BASE_URL = 'https://2z3eq1a51d.execute-api.us-east-1.amazonaws.com/default';

    // ดึงค่าโหมดและ ID จาก URL
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const assignmentId = urlParams.get('id');

    function loadTeacherSidebarNavbar() {
        fetch('../../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
            .then(r => r.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const container = document.getElementById('teacher-sidebar-navbar-container');

                const sidebar = doc.querySelector('#sidebar');
                const navbar = doc.querySelector('.navbar');
                if (sidebar) container.appendChild(sidebar);
                if (navbar) container.appendChild(navbar);

                // Load sidebar JS (toggle / collapse logic)
                const sidebarScript = document.createElement('script');
                sidebarScript.src = '../../components/student-sidebar/sidebar.js';
                document.body.appendChild(sidebarScript);

                // Load navbar JS (profile dropdown)
                const navbarScript = document.createElement('script');
                navbarScript.src = '../../components/teacher-sidebar-navbar/teacher-navbar.js';
                document.body.appendChild(navbarScript);

                // sidebar.js toggles `.sidebar.collapsed` but teacher-dashboard.css
                // listens to `body.sidebar-collapsed` — sync them here
                sidebarScript.onload = () => {
                    const sidebarEl = document.getElementById('sidebar');
                    if (sidebarEl) {
                        new MutationObserver(() => {
                            const collapsed = sidebarEl.classList.contains('collapsed');
                            document.body.classList.toggle('sidebar-collapsed', collapsed);
                            setBottomColumns();
                        }).observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
                    }
                };
            })
            .catch(err => console.error("Error loading teacher sidebar/navbar:", err));
    }

    loadTeacherSidebarNavbar();
    await loadTeacherCourses();

    // ==========================================
    // 1. โหลดข้อมูลรายวิชามาใส่ Dropdown
    // ==========================================
    async function loadTeacherCourses() {
        const courseSelect = document.getElementById('assign-course');
        if (!courseSelect) return;

        try {
            courseSelect.innerHTML = '<option value="">กำลังโหลดวิชา... ⏳</option>';

            const response = await fetch(`${API_BASE_URL}/courses`, { method: 'GET' });
            if (!response.ok) throw new Error('ดึงข้อมูลวิชาไม่สำเร็จ');

            const result = await response.json();
            const courses = result.data || [];

            courseSelect.innerHTML = '<option value="" disabled selected>Select Courses</option>';
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = `${course.course_code} - ${course.course_name}`;
                courseSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading courses:', error);
            courseSelect.innerHTML = `
                <option value="" disabled selected>Select Courses</option>
                <option value="uuid-1234">CS232 - Database Systems (Mock)</option>
                <option value="uuid-5678">CS261 - Software Engineering (Mock)</option>
            `;
        }
    }
    await loadTeacherCourses(); // สั่งรันโหลดวิชาทันที

    // ==========================================
    // 2. จัดการ UI: Checkbox & Drag-Drop ไฟล์
    // ==========================================
    let selectedTeacherFile = null; // ตัวแปรเก็บไฟล์ที่อาจารย์เลือก

    const anyCheckbox = document.getElementById('check-any');
    const formatCheckboxes = document.querySelectorAll('.format-check');
    const dropZone = document.getElementById('drop-zone');
    let fileInput = document.getElementById('file-upload');

    // --- จัดการ Checkbox ---
    if (anyCheckbox) {
        anyCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) formatCheckboxes.forEach(cb => cb.checked = false);
        });

        formatCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const isAnyChecked = Array.from(formatCheckboxes).some(checkbox => checkbox.checked);
                anyCheckbox.checked = !isAnyChecked;
            });
        });
    }

    // --- ฟังก์ชันเปลี่ยนหน้าตากล่องอัปโหลด ---
    function updateFileUI(file) {
        if (!dropZone) return;

        if (file) {
            // โหมดมีไฟล์: โชว์ไอคอน, ชื่อไฟล์, ขนาดไฟล์ และปุ่มลบ
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            dropZone.innerHTML = `
                <iconify-icon icon="ph:file-text-duotone" width="40" style="color: #6366f1;"></iconify-icon>
                <p style="margin: 8px 0; font-weight: 500; color: #1f2937;">${file.name}</p>
                <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #6b7280;">Size: ${fileSizeMB} MB</p>
                <button type="button" id="remove-file-btn" style="padding: 6px 16px; border: 1px solid #ef4444; color: #ef4444; border-radius: 20px; background: #fef2f2; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                    Remove File
                </button>
            `;

            // ดักจับการกดปุ่มลบไฟล์
            document.getElementById('remove-file-btn').addEventListener('click', (e) => {
                e.preventDefault();
                selectedTeacherFile = null;
                resetFileUI(); // คืนค่าหน้าตากลับไปเป็นแบบเดิม
            });
        }
    }

    // --- ฟังก์ชันคืนค่าหน้าตากล่องอัปโหลดกลับเป็นเหมือนเดิม ---
    function resetFileUI() {
        if (!dropZone) return;

        // วาด HTML ของเดิมกลับคืนมา
        dropZone.innerHTML = `
            <iconify-icon icon="ph:cloud-arrow-up-light" class="upload-icon"></iconify-icon>
            <p>Drag & drop files or <label for="file-upload" class="browse-link">Browse</label></p>
            <small>Supported formats: JPG, PNG, MP4, PDF, PSD, AI, Word, PPT, Zip</small>
            <input type="file" id="file-upload" hidden multiple>
        `;

        // สำคัญมาก: ต้องผูก Event Listener ให้ปุ่ม Browse ตัวใหม่ที่เพิ่งถูกวาดขึ้นมา
        fileInput = document.getElementById('file-upload');
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedTeacherFile = e.target.files[0];
                updateFileUI(selectedTeacherFile);
            }
        });
    }

    // --- จัดการ Event การลากไฟล์ลงกล่อง (Drag & Drop) ---
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
                selectedTeacherFile = e.dataTransfer.files[0];
                updateFileUI(selectedTeacherFile); // เรียกฟังก์ชันเปลี่ยนหน้าตา
            }
        });
    }

    // --- จัดการ Event การกดปุ่ม Browse ---
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedTeacherFile = e.target.files[0];
                updateFileUI(selectedTeacherFile); // เรียกฟังก์ชันเปลี่ยนหน้าตา
            }
        });
    }

    // ==========================================
    // 3. จัดการโหมด Edit (GET ข้อมูลเก่ามายัดใส่ฟอร์ม)
    // ==========================================
    const submitBtn = document.getElementById('submit-btn');
    const isEdit = mode === 'edit';

    if (isEdit && assignmentId) {
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = 'Edit Assignment';
        if (submitBtn) submitBtn.textContent = 'Save Changes';

        try {
            const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`);
            if (!response.ok) throw new Error('ดึงข้อมูลเดิมไม่สำเร็จ');

            const result = await response.json();
            const editData = result.data;

            document.getElementById('assign-title').value = editData.title || '';
            document.getElementById('assign-desc').value = editData.description || '';
            document.getElementById('assign-date').value = editData.due_date ? editData.due_date.slice(0, 16) : '';
            document.getElementById('assign-points').value = editData.max_score || '';

            if (editData.allowed_file_types) {
                const formats = editData.allowed_file_types.split(',');
                if (formats.includes('any')) {
                    if (anyCheckbox) anyCheckbox.checked = true;
                } else {
                    if (anyCheckbox) anyCheckbox.checked = false;
                    formatCheckboxes.forEach(cb => {
                        if (formats.includes(cb.value.toLowerCase())) cb.checked = true;
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching edit data:', error);
        }
    }

    // ==========================================
    // 4. จัดการการกดปุ่ม POST/SAVE (อัปโหลดไฟล์ + สร้างงาน)
    // ==========================================
    const form = document.getElementById('create-assignment-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const originalBtnText = submitBtn.innerHTML;
            submitBtn.style.opacity = '0.8';
            submitBtn.disabled = true;

            try {
                let attachmentUrlOrId = null;

                // 🌟 ขั้นตอนที่ 1: อัปโหลดไฟล์ (ถ้ามีการเลือกไฟล์ไว้)
                if (selectedTeacherFile) {
                    submitBtn.innerHTML = `<iconify-icon icon="line-md:loading-twotone-loop" width="24"></iconify-icon> Uploading file...`;

                    const fileFormData = new FormData();
                    fileFormData.append('file', selectedTeacherFile);

                    const uploadRes = await fetch(`${API_BASE_URL}/attachments`, {
                        method: 'POST',
                        body: fileFormData
                    });

                    if (!uploadRes.ok) throw new Error('อัปโหลดไฟล์ไม่สำเร็จ (Backend อาจจะยังไม่รองรับ)');
                    const uploadData = await uploadRes.json();
                    attachmentUrlOrId = uploadData.data.attachment_id;
                }

                // 🌟 ขั้นตอนที่ 2: รวบรวมข้อมูลสร้าง Assignment
                submitBtn.innerHTML = `<iconify-icon icon="line-md:loading-twotone-loop" width="24"></iconify-icon> ${isEdit ? 'Saving...' : 'Posting...'}`;

                let allowedTypesStr = 'any';
                if (!anyCheckbox.checked) {
                    const selectedTypes = Array.from(formatCheckboxes)
                        .filter(cb => cb.checked).map(cb => cb.value.toLowerCase());
                    if (selectedTypes.length > 0) allowedTypesStr = selectedTypes.join(',');
                }

                const payload = {
                    title: document.getElementById('assign-title').value,
                    description: document.getElementById('assign-desc').value,
                    due_date: document.getElementById('assign-date').value,
                    max_score: parseInt(document.getElementById('assign-points').value) || 0,
                    status: "published",
                    allowed_file_types: allowedTypesStr,
                    attachment_id: attachmentUrlOrId // ส่ง ID ไฟล์ไปด้วย
                };

                let fetchUrl = '';
                let fetchMethod = '';

                if (isEdit) {
                    fetchUrl = `${API_BASE_URL}/assignments/${assignmentId}`;
                    fetchMethod = 'PATCH';
                } else {
                    const selectedCourseId = document.getElementById('assign-course').value;
                    if (!selectedCourseId) {
                        alert('กรุณาเลือกวิชาก่อนนะคะ!');
                        throw new Error('No course selected'); // หยุดการทำงานถ้าไม่เลือกวิชา
                    }
                    fetchUrl = `${API_BASE_URL}/courses/${selectedCourseId}/assignments`;
                    fetchMethod = 'POST';
                }

                // 🌟 ขั้นตอนที่ 3: ยิง API สร้าง/แก้ไข Assignment
                const response = await fetch(fetchUrl, {
                    method: fetchMethod,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error('บันทึกข้อมูล Assignment ไม่สำเร็จ');

                alert(isEdit ? 'บันทึกการแก้ไขเรียบร้อยแล้วค่ะ! ✨' : 'สร้าง Assignment สำเร็จแล้วค่ะ! 🎉');
                history.back();

            } catch (error) {
                console.error("Submit Error:", error);
                if (error.message !== 'No course selected') {
                    alert('เกิดข้อผิดพลาด: ' + error.message);
                }
                submitBtn.innerHTML = originalBtnText;
                submitBtn.style.opacity = '1';
                submitBtn.disabled = false;
            }
        });
    }
});
