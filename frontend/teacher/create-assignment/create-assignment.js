document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    const userData = JSON.parse(localStorage.getItem('user') || 'null');

    if (!userData || !userData.token || !userData.user_id) {
        alert('Please login first.');
        window.location.href = '../../auth/login.html';
        return;
    }

    const TOKEN = userData.token;
    const USER_ID = userData.user_id;

    const urlParams = new URLSearchParams(window.location.search);
    const assignmentIdFromUrl = urlParams.get('id') || '';
    const courseIdFromUrl = urlParams.get('course_id') || '';
    const isEditMode = Boolean(assignmentIdFromUrl);

    // ==========================================
    // Go to assignment manage page
    // ==========================================
    function goTo(assignmentId, courseId) {
        window.location.href =
            `../teacher-assign-manage/teacher-assign-manage.html?id=${assignmentId}&course_id=${courseId}`;
    }

    function formatDateTimeLocal(value) {
        if (!value) return '';

        const date = new Date(value);
        if (isNaN(date)) return '';

        const pad = n => String(n).padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

    function applyAllowedFileTypes(allowedFileTypes) {
        const allowed = (allowedFileTypes || 'any')
            .split(',')
            .map(type => type.trim().toLowerCase())
            .filter(Boolean);

        const isAny = allowed.length === 0 || allowed.includes('any');

        if (anyCheckbox) {
            anyCheckbox.checked = isAny;
        }

        formatCheckboxes.forEach(cb => {
            cb.checked = !isAny && allowed.includes(cb.value.toLowerCase());
        });
    }

    async function loadAssignmentForEdit() {
        if (!isEditMode) return;

        const pageTitle = document.getElementById('page-title');
        const submitBtn = document.getElementById('submit-btn');

        if (pageTitle) pageTitle.textContent = 'Edit Assignment';
        if (submitBtn) submitBtn.textContent = 'Save';

        try {
            const response = await fetch(`${API_BASE_URL}/assignments/detail/${assignmentIdFromUrl}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${TOKEN}`
                }
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(result?.detail || `HTTP ${response.status}`);
            }

            const assignment = result?.data || {};
            const titleEl = document.getElementById('assign-title');
            const courseEl = document.getElementById('assign-course');
            const descEl = document.getElementById('assign-desc');
            const dateEl = document.getElementById('assign-date');
            const pointsEl = document.getElementById('assign-points');

            if (titleEl) titleEl.value = assignment.title || '';
            if (courseEl) courseEl.value = assignment.course_id || courseIdFromUrl || '';
            if (descEl) descEl.value = assignment.description || '';
            if (dateEl) dateEl.value = formatDateTimeLocal(assignment.due_date);
            if (pointsEl) pointsEl.value = assignment.max_score ?? 0;

            applyAllowedFileTypes(assignment.allowed_file_types);
        } catch (error) {
            console.error('Error loading assignment for edit:', error);
            alert('Failed to load assignment: ' + error.message);
            history.back();
        }
    }

    await loadTeacherCourses();
    await loadAssignmentForEdit();

    // ==========================================
    // Upload file UI
    // ==========================================
    let selectedTeacherFiles = [];
    const dropZone = document.getElementById('drop-zone');
    let fileInput = document.getElementById('file-upload');

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function getSelectedFilePanel() {
        let panel = document.getElementById('selected-file-panel');

        if (!panel && dropZone) {
            panel = document.createElement('div');
            panel.id = 'selected-file-panel';
            panel.className = 'selected-file-panel';
            dropZone.insertAdjacentElement('afterend', panel);
        }

        return panel;
    }

    function addTeacherFiles(files) {
        selectedTeacherFiles = selectedTeacherFiles.concat(Array.from(files));
        updateFileUI();
    }

    function bindFileInput() {
        fileInput = document.getElementById('file-upload');

        if (!fileInput) return;

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                addTeacherFiles(e.target.files);
            }
            fileInput.value = '';
        });
    }

    function updateFileUI() {
        const panel = getSelectedFilePanel();
        if (!panel) return;

        if (selectedTeacherFiles.length === 0) {
            panel.innerHTML = '';
            return;
        }

        const totalSizeMB = selectedTeacherFiles
            .reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);

        const fileListHtml = selectedTeacherFiles.map((file, index) => {
            const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
            return `
                <li class="selected-file-item">
                    <iconify-icon icon="ph:file-text-duotone" width="18" style="color: #6366f1;"></iconify-icon>
                    <span>${escapeHtml(file.name)}</span>
                    <small>${fileSizeMB} MB</small>
                    <button class="selected-file-remove" type="button" data-file-index="${index}" aria-label="Remove file">
                        <iconify-icon icon="ph:x-bold" width="14" height="14"></iconify-icon>
                    </button>
                </li>
            `;
        }).join('');

        panel.innerHTML = `
            <p style="margin: 12px 0 8px; font-weight: 500; color: #1f2937;">${selectedTeacherFiles.length} file${selectedTeacherFiles.length > 1 ? 's' : ''} selected</p>
            <p style="margin: 0 0 12px 0; font-size: 0.85rem; color: #6b7280;">Total size: ${totalSizeMB.toFixed(2)} MB</p>
            <ul class="selected-file-list">${fileListHtml}</ul>
            <button
                type="button"
                id="remove-file-btn"
                style="padding: 6px 16px; border: 1px solid #ef4444; color: #ef4444; border-radius: 20px; background: #fef2f2; cursor: pointer; font-size: 0.85rem; font-weight: 500;"
            >
                Remove File
            </button>
        `;

        panel.querySelectorAll('.selected-file-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = Number(btn.dataset.fileIndex);
                selectedTeacherFiles.splice(index, 1);
                updateFileUI();
            });
        });

        const removeBtn = document.getElementById('remove-file-btn');

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                selectedTeacherFiles = [];
                updateFileUI();
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
                addTeacherFiles(e.dataTransfer.files);
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
            submitBtn.innerHTML = isEditMode ? 'Saving...' : 'Posting...';

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

                const assignmentUrl = isEditMode
                    ? `${API_BASE_URL}/assignments/${assignmentIdFromUrl}`
                    : `${API_BASE_URL}/assignments/`;

                const response = await fetch(assignmentUrl, {
                    method: isEditMode ? 'PUT' : 'POST',
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

                const assignmentId = responseData?.data?.assignment_id || assignmentIdFromUrl;

                if (!assignmentId) {
                    throw new Error('Assignment saved but assignment_id was not returned.');
                }

                // Upload files after assignment created/updated.
                if (selectedTeacherFiles.length > 0) {
                    let uploadFailed = false;

                    for (let i = 0; i < selectedTeacherFiles.length; i++) {
                        const file = selectedTeacherFiles[i];
                        submitBtn.innerHTML = `Uploading file ${i + 1}/${selectedTeacherFiles.length}...`;
                        const fileFormData = new FormData();
                        fileFormData.append('file', file);

                        try {
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
                                uploadFailed = true;
                            }
                        } catch (uploadError) {
                            console.warn('File upload error:', uploadError);
                            uploadFailed = true;
                        }
                    }

                    if (uploadFailed) {
                        alert('Assignment saved, but some files failed to upload.');
                    }
                }

                alert(isEditMode ? 'Assignment updated successfully.' : 'Assignment created successfully.');

                // ส่งต่อ assignment ไปหน้า teacher-assign-manage
                goTo(assignmentId, selectedCourseId);

            } catch (error) {
                console.error('Submit Error:', error);

                if (!['No course selected', 'No title', 'No due date'].includes(error.message)) {
                    alert((isEditMode ? 'Update' : 'Create') + ' assignment failed: ' + error.message);
                }

                submitBtn.disabled = false;
                submitBtn.style.opacity = '1';
                submitBtn.innerHTML = originalText;
            }
        });
    }
});
