document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com';

    const userData = JSON.parse(localStorage.getItem('user') || 'null');

    if (!userData || !userData.token || !userData.user_id) {
        alert('Please login first.');
        window.location.href = '../../auth/login.html';
        return;
    }

    const TOKEN = userData.token;
    const USER_ID = userData.user_id;

    const urlParams = new URLSearchParams(window.location.search);
    const courseIdFromUrl = urlParams.get('course_id') || '';

    // ==========================================
    // Go to assignment manage page
    // ==========================================
    function goTo(assignmentId, courseId) {
        window.location.href =
            `../teacher-assign-manage/teacher-assign-manage.html?id=${assignmentId}&course_id=${courseId}`;
    }

    // ==========================================
    // Load sidebar + navbar
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
    // Load teacher courses into dropdown
    // ==========================================
    async function loadTeacherCourses() {
        const courseSelect = document.getElementById('assign-course');
        if (!courseSelect) return;

        try {
            courseSelect.innerHTML = '<option value="" disabled selected>Loading courses...</option>';

            const response = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            });

            const result = await response.json().catch(() => null);

            console.log('COURSES RESPONSE STATUS:', response.status);
            console.log('COURSES RESPONSE DATA:', result);

            if (!response.ok) {
                throw new Error(result?.detail || 'Failed to load courses');
            }

            const courses = Array.isArray(result) ? result : (result?.data || []);

            courseSelect.innerHTML = '<option value="" disabled selected>Select Courses</option>';

            if (courses.length === 0) {
                courseSelect.innerHTML = '<option value="" disabled selected>No courses found</option>';
                return;
            }

            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.course_id;
                option.textContent = `${course.course_code} - ${course.course_name}`;
                courseSelect.appendChild(option);
            });

            if (courseIdFromUrl) {
                courseSelect.value = courseIdFromUrl;
            }

        } catch (error) {
            console.error('Error loading courses:', error);
            courseSelect.innerHTML = '<option value="" disabled selected>Failed to load courses</option>';
            alert('Failed to load courses: ' + error.message);
        }
    }

    await loadTeacherCourses();

    // ==========================================
    // File type checkbox
    // ==========================================
    const anyCheckbox = document.getElementById('check-any');
    const formatCheckboxes = document.querySelectorAll('.format-check');

    if (anyCheckbox) {
        anyCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                formatCheckboxes.forEach(cb => cb.checked = false);
            }
        });

        formatCheckboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const hasSelected = Array.from(formatCheckboxes).some(cb => cb.checked);
                anyCheckbox.checked = !hasSelected;
            });
        });
    }

    function getAllowedFileTypes() {
        if (anyCheckbox && anyCheckbox.checked) {
            return 'any';
        }

        const selected = Array.from(formatCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value.toLowerCase());

        return selected.length > 0 ? selected.join(',') : 'any';
    }

    // ==========================================
    // Upload file UI
    // ==========================================
    let selectedTeacherFile = null;
    const dropZone = document.getElementById('drop-zone');
    let fileInput = document.getElementById('file-upload');

    function bindFileInput() {
        fileInput = document.getElementById('file-upload');

        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                selectedTeacherFile = e.target.files[0];
                updateFileUI(selectedTeacherFile);
            }
        });
    }

    function updateFileUI(file) {
        if (!dropZone || !file) return;

        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);

        dropZone.innerHTML = `
            <iconify-icon icon="ph:file-text-duotone" width="40" style="color: #6366f1;"></iconify-icon>
            <p style="margin: 8px 0; font-weight: 500; color: #1f2937;">${file.name}</p>
            <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #6b7280;">Size: ${fileSizeMB} MB</p>
            <button
                type="button"
                id="remove-file-btn"
                style="padding: 6px 16px; border: 1px solid #ef4444; color: #ef4444; border-radius: 20px; background: #fef2f2; cursor: pointer; font-size: 0.85rem; font-weight: 500;"
            >
                Remove File
            </button>
        `;

        const removeBtn = document.getElementById('remove-file-btn');

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                selectedTeacherFile = null;
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

        bindFileInput();
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
                selectedTeacherFile = e.dataTransfer.files[0];
                updateFileUI(selectedTeacherFile);
            }
        });
    }

    bindFileInput();

    // ==========================================
    // Submit create assignment
    // ==========================================
    const form = document.getElementById('create-assignment-form');
    const submitBtn = document.getElementById('submit-btn');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.8';
            submitBtn.innerHTML = 'Posting...';

            try {
                const selectedCourseId = document.getElementById('assign-course').value;
                const title = document.getElementById('assign-title').value.trim();
                const description = document.getElementById('assign-desc').value.trim();
                const dueDate = document.getElementById('assign-date').value;
                const maxScore = parseInt(document.getElementById('assign-points').value, 10) || 0;

                if (!selectedCourseId) {
                    alert('Please select a course.');
                    throw new Error('No course selected');
                }

                if (!title) {
                    alert('Please enter assignment title.');
                    throw new Error('No title');
                }

                if (!dueDate) {
                    alert('Please select due date.');
                    throw new Error('No due date');
                }

                const payload = {
                    title: title,
                    description: description,
                    due_date: dueDate,
                    max_score: maxScore,
                    course_id: selectedCourseId,
                    created_by: USER_ID,
                    allowed_file_types: getAllowedFileTypes()
                };

                console.log('CREATE ASSIGNMENT PAYLOAD:', payload);

                const response = await fetch(`${API_BASE_URL}/assignments/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${TOKEN}`
                    },
                    body: JSON.stringify(payload)
                });

                const responseData = await response.json().catch(() => null);

                console.log('CREATE ASSIGNMENT STATUS:', response.status);
                console.log('CREATE ASSIGNMENT RESPONSE:', responseData);

                if (!response.ok) {
                    throw new Error(responseData?.detail || responseData?.message || `HTTP ${response.status}`);
                }

                const assignmentId = responseData?.data?.assignment_id;

                if (!assignmentId) {
                    throw new Error('Assignment created but assignment_id was not returned.');
                }

                // Upload file after assignment created
                if (selectedTeacherFile) {
                    try {
                        submitBtn.innerHTML = 'Uploading file...';

                        const fileFormData = new FormData();
                        fileFormData.append('file', selectedTeacherFile);

                        const uploadResponse = await fetch(`${API_BASE_URL}/attachments/assignment/${assignmentId}`, {
                            method: 'POST',
                            headers: {
                                Authorization: `Bearer ${TOKEN}`
                            },
                            body: fileFormData
                        });

                        const uploadData = await uploadResponse.json().catch(() => null);

                        console.log('UPLOAD STATUS:', uploadResponse.status);
                        console.log('UPLOAD RESPONSE:', uploadData);

                        if (!uploadResponse.ok) {
                            console.warn('File upload failed:', uploadData);
                            alert('Assignment created, but file upload failed.');
                        }

                    } catch (uploadError) {
                        console.warn('File upload error:', uploadError);
                        alert('Assignment created, but file upload failed.');
                    }
                }

                alert('Assignment created successfully.');

                // ส่งต่อ assignment ไปหน้า teacher-assign-manage
                goTo(assignmentId, selectedCourseId);

            } catch (error) {
                console.error('Submit Error:', error);

                if (!['No course selected', 'No title', 'No due date'].includes(error.message)) {
                    alert('Create assignment failed: ' + error.message);
                }

                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.innerHTML = originalText;
            }
        });
    }
});