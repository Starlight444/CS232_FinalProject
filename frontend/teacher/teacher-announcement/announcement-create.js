document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // ตั้งค่า API
    // ==========================================
    const API_BASE_URL = 'https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default';

    // Auth
    const userData = JSON.parse(localStorage.getItem("user"));
    if (!userData || !userData.token) {
        window.location.href = '../../auth/login.html';
        return;
    }

    const TOKEN = userData.token;
    const USER_ID = userData.user_id;

    // ดึงค่าโหมดและ ID จาก URL สำหรับ edit mode
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const announcementId = urlParams.get('id');
    const isEdit = mode === 'edit' && !!announcementId;

    // ==========================================
    // โหลด Sidebar + Navbar teacher
    // ==========================================
    function loadTeacherSidebarNavbar() {
        fetch('../../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
            .then(r => r.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const container = document.getElementById('teacher-sidebar-navbar-container');
                if (!container) return;

                const sidebar = doc.querySelector('#sidebar');
                const navbar = doc.querySelector('.navbar');

                if (sidebar) container.appendChild(sidebar);
                if (navbar) container.appendChild(navbar);

                const navLinks = container.querySelectorAll('.nav-link');
                navLinks.forEach(a => a.classList.remove('active'));

                const announceLink = container.querySelector('[data-page="announcements"]');
                if (announceLink) announceLink.classList.add('active');

                const sidebarScript = document.createElement('script');
                sidebarScript.src = '../../components/teacher-sidebar-navbar/teacher-sidebar.js';
                document.body.appendChild(sidebarScript);

                const navbarScript = document.createElement('script');
                navbarScript.src = '../../components/teacher-sidebar-navbar/teacher-navbar.js';
                document.body.appendChild(navbarScript);

                sidebarScript.onload = () => {
                    const sidebarEl = document.getElementById('sidebar');
                    if (sidebarEl) {
                        new MutationObserver(() => {
                            const collapsed = sidebarEl.classList.contains('collapsed');
                            document.body.classList.toggle('sidebar-collapsed', collapsed);
                        }).observe(sidebarEl, {
                            attributes: true,
                            attributeFilter: ['class']
                        });
                    }
                };
            })
            .catch(err => console.error('Error loading teacher sidebar/navbar:', err));
    }

    loadTeacherSidebarNavbar();

    // ==========================================
    // 1. โหลดรายวิชาจริงของ teacher มาใส่ Dropdown
    // ==========================================
    async function loadTeacherCourses() {
        const courseSelect = document.getElementById('announce-course');
        if (!courseSelect) return;

        try {
            courseSelect.innerHTML = '<option value="" disabled selected>กำลังโหลดวิชา...</option>';

            const response = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error('ดึงข้อมูลวิชาไม่สำเร็จ');
            }

            const result = await response.json();

            // รองรับทั้งกรณี backend ส่งเป็น list ตรง ๆ หรือส่งเป็น { data: [...] }
            const courses = Array.isArray(result) ? result : (result.data || []);

            courseSelect.innerHTML = '<option value="" disabled selected>Select Courses</option>';

            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = `${course.course_code} - ${course.course_name}`;
                courseSelect.appendChild(option);
            });

        } catch (error) {
            console.error('Error loading courses:', error);
            courseSelect.innerHTML = '<option value="" disabled selected>โหลดวิชาไม่สำเร็จ</option>';
        }
    }

    await loadTeacherCourses();

    // ==========================================
    // 2. จัดการ Drag & Drop / เลือกไฟล์
    // ตอนนี้ backend announcement ยังไม่มี endpoint แนบไฟล์
    // เลยเก็บ UI ไว้ก่อน แต่ตอน submit จะสร้างประกาศโดยไม่ส่งไฟล์
    // ==========================================
    let selectedFile = null;
    const dropZone = document.getElementById('drop-zone');
    let fileInput = document.getElementById('file-upload');

    function updateFileUI(file) {
        if (!dropZone || !file) return;

        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        dropZone.innerHTML = `
            <iconify-icon icon="ph:file-text-duotone" width="40" style="color: #6E6CDF;"></iconify-icon>
            <p style="margin: 8px 0; font-weight: 500; color: #1f2937;">${file.name}</p>
            <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #6b7280;">Size: ${fileSizeMB} MB</p>
            <button type="button" id="remove-file-btn" style="padding: 6px 16px; border: 1px solid #ef4444; color: #ef4444; border-radius: 20px; background: #fef2f2; cursor: pointer; font-size: 0.85rem; font-weight: 500;">
                Remove File
            </button>
        `;

        const removeBtn = document.getElementById('remove-file-btn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                selectedFile = null;
                resetFileUI();
            });
        }
    }

    function resetFileUI() {
        if (!dropZone) return;

        dropZone.innerHTML = `
            <iconify-icon icon="ph:cloud-arrow-up-light" class="upload-icon"></iconify-icon>
            <p>Drag &amp; drop files or <label for="file-upload" class="browse-link">Browse</label></p>
            <small>Supported formats: JPG, PNG, MP4, PDF, PSD, AI, Word, PPT, Zip</small>
            <input type="file" id="file-upload" hidden multiple>
        `;

        fileInput = document.getElementById('file-upload');

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    selectedFile = e.target.files[0];
                    updateFileUI(selectedFile);
                }
            });
        }
    }

    if (dropZone) {
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

            if (e.dataTransfer.files.length > 0) {
                selectedFile = e.dataTransfer.files[0];
                updateFileUI(selectedFile);
            }
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedFile = e.target.files[0];
                updateFileUI(selectedFile);
            }
        });
    }

    // ==========================================
    // 3. โหมด Edit: ดึงข้อมูลประกาศเดิมมายัดใส่ฟอร์ม
    // ==========================================
    const submitBtn = document.getElementById('submit-btn');
    const pageTitle = document.getElementById('page-title');

    if (isEdit) {
        if (pageTitle) pageTitle.textContent = 'Edit Announcement';
        if (submitBtn) submitBtn.textContent = 'Save Changes';
        document.title = 'Edit Announcement';

        try {
            const response = await fetch(`${API_BASE_URL}/announcements/${announcementId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });

            if (!response.ok) {
                throw new Error('ดึงข้อมูลประกาศเดิมไม่สำเร็จ');
            }

            const result = await response.json();
            const data = result.data || {};

            const titleInput = document.getElementById('announce-title');
            const descInput = document.getElementById('announce-desc');
            const courseSelect = document.getElementById('announce-course');

            if (titleInput) titleInput.value = data.title || '';
            if (descInput) descInput.value = data.content || '';

            if (courseSelect && data.course_id) {
                courseSelect.value = data.course_id;
                courseSelect.disabled = true;
            }

        } catch (error) {
            console.error('Error fetching announcement for edit:', error);
            alert('โหลดข้อมูลประกาศเดิมไม่สำเร็จ');
        }
    }

    // ==========================================
    // 4. Submit: POST create หรือ PUT edit จริง
    // ==========================================
    const form = document.getElementById('create-announcement-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!submitBtn) return;

            const originalBtnText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.8';

            try {
                submitBtn.innerHTML = `
                    <iconify-icon icon="line-md:loading-twotone-loop" width="20"></iconify-icon>
                    ${isEdit ? 'Saving...' : 'Posting...'}
                `;

                const selectedCourseId = document.getElementById('announce-course').value;
                const titleVal = document.getElementById('announce-title').value.trim();
                const contentVal = document.getElementById('announce-desc').value.trim();

                if (!isEdit && !selectedCourseId) {
                    alert('กรุณาเลือกวิชาก่อนนะคะ!');
                    throw new Error('No course selected');
                }

                if (!titleVal) {
                    alert('กรุณากรอกหัวข้อประกาศ');
                    throw new Error('No title');
                }

                if (selectedFile) {
                    console.warn('Selected file ignored because announcement attachment API is not available yet.');
                }

                const payload = isEdit
                    ? {
                        title: titleVal,
                        content: contentVal
                    }
                    : {
                        title: titleVal,
                        content: contentVal,
                        course_id: selectedCourseId
                    };

                let fetchUrl = '';
                let fetchMethod = '';

                if (isEdit) {
                    fetchUrl = `${API_BASE_URL}/announcements/${announcementId}`;
                    fetchMethod = 'PUT';
                } else {
                    fetchUrl = `${API_BASE_URL}/announcements`;
                    fetchMethod = 'POST';
                }

                const response = await fetch(fetchUrl, {
                    method: fetchMethod,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify(payload)
                });

                const responseData = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(responseData.detail || 'บันทึกประกาศไม่สำเร็จ');
                }

                alert(isEdit ? 'บันทึกการแก้ไขเรียบร้อยแล้ว!' : 'สร้างประกาศสำเร็จแล้ว!');
                window.location.href = 'announcement-page.html';

            } catch (error) {
                console.error('Submit Error:', error);

                if (!['No course selected', 'No title'].includes(error.message)) {
                    alert('เกิดข้อผิดพลาด: ' + error.message);
                }

                submitBtn.innerHTML = originalBtnText;
                submitBtn.style.opacity = '1';
                submitBtn.disabled = false;
            }
        });
    }
});