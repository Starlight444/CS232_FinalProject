// =============================================================
// Teacher — Assignments Overview
// อ้างอิง pattern จาก announcement-page.js
// =============================================================

document.addEventListener('DOMContentLoaded', () => {
    const BASE_URL = 'https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com';
    // const BASE_URL = 'https://2z3eq1a51d.execute-api.us-east-1.amazonaws.com/default';

    // ---------- Sidebar / Navbar loader ----------
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

                // sync body class with sidebar collapsed state
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

    // ---------- Auth guard ----------
    const userData = JSON.parse(localStorage.getItem('user'));
    if (!userData || !userData.token) {
        window.location.href = '../../auth/login.html';
        return;
    }
    const TOKEN = userData.token;
    const USER_ID = userData.user_id;

    // ---------- State ----------
    let ASSIGNMENTS = [];
    let activeSort = 'closest';
    let activeFilter = 'all';
    let searchQuery = '';
    let activeMenuRow = null;

    // ---------- DOM refs ----------
    const tbody = document.getElementById('assignments-tbody');
    const emptyMsg = document.getElementById('empty-msg');
    const searchInput = document.getElementById('search-input');
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    const filterWrap = filterBtn ? filterBtn.closest('.filter-wrap') : null;
    const addBtn = document.getElementById('add-assignment-btn');
    const rowActionMenu = document.getElementById('row-action-menu');

    // ---------- Status mapping ----------
    function mapStatus(assign) {
        const now = new Date();
        const due = new Date(assign.due_date);

        if (assign.status === 'closed') return 'complete';

        if (due < now) {
            const diffMs = now - due;
            if (diffMs <= 24 * 60 * 60 * 1000) return 'due-today';
            return 'overdue';
        }
        const diffMs = due - now;
        if (diffMs <= 24 * 60 * 60 * 1000) return 'due-today';
        return 'upcoming';
    }

    // ---------- Fetch assignments ----------
    async function fetchAssignments() {
        showLoading();

        try {
            const courseRes = await fetch(`${BASE_URL}/courses/my/${USER_ID}`, {
                headers: { Authorization: `Bearer ${TOKEN}` }
            });
            const courseJson = await courseRes.json();
            const allCourses = Array.isArray(courseJson) ? courseJson : (courseJson.data || []);

            const courses = allCourses.filter(
                c => c.role === 'teacher' || c.role === 'ta' || !c.role
            );

            updateFilterDropdown(courses);

            if (window.renderSidebarCourses) {
                window.renderSidebarCourses(courses);
            }

            if (courses.length === 0) {
                ASSIGNMENTS = [];
                render();
                return;
            }

            const coursePromises = courses.map(async (course) => {
                const assignRes = await fetch(`${BASE_URL}/assignments/${course.course_id}`, {
                    headers: { Authorization: `Bearer ${TOKEN}` }
                });
                const assignJson = await assignRes.json();
                const assignments = Array.isArray(assignJson)
                    ? assignJson
                    : (assignJson.data || []);

                const totalStudents = course.total_std || 0;

                const rows = await Promise.all(
                    assignments.map(async (a) => {
                        let submitted = 0;
                        try {
                            const subRes = await fetch(
                                `${BASE_URL}/submissions/assignment/${a.assignment_id}`,
                                { headers: { Authorization: `Bearer ${TOKEN}` } }
                            );
                            const subJson = await subRes.json();
                            const subs = Array.isArray(subJson)
                                ? subJson
                                : (subJson.data || []);
                            submitted = subs.filter(s => s.status === 'submitted' || s.status === 'graded').length;
                        } catch (err) {
                            console.warn(`submissions fetch failed for ${a.assignment_id}`, err);
                        }

                        return {
                            id: a.assignment_id,
                            course_id: course.course_id,
                            course_code: course.course_code,
                            name: a.title,
                            due: new Date(a.due_date),
                            max_score: a.max_score || 0,
                            rawStatus: a.status,
                            status: mapStatus(a),
                            submitted,
                            total: totalStudents
                        };
                    })
                );

                return rows;
            });

            const allRows = (await Promise.all(coursePromises)).flat();
            ASSIGNMENTS = allRows;
            render();
        } catch (err) {
            console.error('Error fetching teacher assignments:', err);
            tbody.innerHTML = `
                <tr class="loading-row">
                    <td colspan="5" style="color:#CF2D2D;">Failed to load assignments. Please check the server.</td>
                </tr>`;
            emptyMsg.style.display = 'none';
        }
    }

    // ---------- Filter dropdown — populate by course_code ----------
    function updateFilterDropdown(courses) {
        if (!filterDropdown) return;

        filterDropdown.querySelectorAll('.filter-option').forEach(b => {
            if (b.dataset.class !== 'all') b.remove();
        });

        courses.forEach(course => {
            const opt = document.createElement('button');
            opt.type = 'button';
            opt.className = 'filter-option';
            opt.dataset.class = course.course_code;
            opt.textContent = course.course_code;
            filterDropdown.appendChild(opt);
        });

        filterDropdown.querySelectorAll('.filter-option').forEach(btn => {
            btn.addEventListener('click', () => {
                filterDropdown.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeFilter = btn.dataset.class;
                if (filterWrap) filterWrap.classList.remove('open');
                render();
            });
        });
    }

    // ---------- Render ----------
    function showLoading() {
        if (!tbody) return;
        tbody.innerHTML = `
            <tr class="loading-row">
                <td colspan="5">Loading assignments…</td>
            </tr>`;
        if (emptyMsg) emptyMsg.style.display = 'none';
    }

    function formatDue(date) {
        if (!(date instanceof Date) || isNaN(date)) return '-';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function render() {
        if (!tbody) return;

        let list = ASSIGNMENTS.slice();

        if (activeFilter !== 'all') {
            list = list.filter(a => a.course_code === activeFilter);
        }

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(a =>
                (a.name || '').toLowerCase().includes(q) ||
                (a.course_code || '').toLowerCase().includes(q)
            );
        }

        list.sort((a, b) =>
            activeSort === 'closest' ? a.due - b.due : b.due - a.due
        );

        if (list.length === 0) {
            tbody.innerHTML = '';
            if (emptyMsg) emptyMsg.style.display = 'block';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';

        tbody.innerHTML = list.map(a => {
            const dueClass = (a.status === 'due-today' || a.status === 'overdue') ? 'due-urgent' : '';
            const submittedText = `${a.submitted}/${a.total}`;
            return `
                <tr data-assignment-id="${a.id}" data-course-id="${a.course_id}">
                    <td class="cell-class">${escapeHtml(a.course_code || '-')}</td>
                    <td class="cell-name">${escapeHtml(a.name || '-')}</td>
                    <td class="cell-due ${dueClass}">${formatDue(a.due)}</td>
                    <td class="cell-submitted">${submittedText}</td>
                    <td class="cell-action">
                        <button class="kebab-btn" type="button" aria-label="Actions">
                            <iconify-icon icon="mi:options-vertical" width="18" height="18"></iconify-icon>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // ---------- Row action menu helpers ----------
    function openRowMenu(kebabEl, rowEl) {
        if (!rowActionMenu) return;
        activeMenuRow = rowEl;

        const rect = kebabEl.getBoundingClientRect();
        rowActionMenu.hidden = false;
        rowActionMenu.style.top = `${rect.bottom + window.scrollY + 4}px`;
        rowActionMenu.style.left = `${rect.right + window.scrollX - rowActionMenu.offsetWidth}px`;
    }

    function hideRowMenu() {
        if (!rowActionMenu) return;
        rowActionMenu.hidden = true;
        activeMenuRow = null;
    }

    async function closeAssignment(assignmentId) {
        if (!confirm('Close this assignment? Students will no longer be able to submit.')) return;
        try {
            const res = await fetch(`${BASE_URL}/assignments/${assignmentId}/close`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${TOKEN}`
                },
                body: JSON.stringify({ status: 'closed' })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            await fetchAssignments();
        } catch (err) {
            console.error('Failed to close assignment:', err);
            alert('Failed to close assignment.');
        }
    }

    function handleRowAction(action, assignmentId, courseId) {
        switch (action) {
            case 'grade':
                window.location.href =
                    `../teacher-assign-manage/teacher-assign-manage.html?id=${assignmentId}&course_id=${courseId}`;
                break;
            case 'edit':
                window.location.href =
                    `../create-assignment/create-assignment.html?id=${assignmentId}&course_id=${courseId}`;
                break;
            case 'close':
                closeAssignment(assignmentId);
                break;
        }
    }

    // ---------- UI bindings ----------
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeSort = btn.dataset.sort;
            render();
        });
    });

    if (searchInput) {
        searchInput.addEventListener('input', e => {
            searchQuery = e.target.value.trim();
            render();
        });
    }

    if (filterBtn && filterWrap) {
        filterBtn.addEventListener('click', e => {
            e.stopPropagation();
            filterWrap.classList.toggle('open');
        });
    }

    document.addEventListener('click', () => {
        if (filterWrap) filterWrap.classList.remove('open');
        hideRowMenu();
    });

    if (filterDropdown) {
        filterDropdown.addEventListener('click', e => e.stopPropagation());
    }

    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const selected = ASSIGNMENTS.find(a => a.course_code === activeFilter);
            const courseId = selected ? selected.course_id : '';
            const target = courseId
                ? `../create-assignment/create-assignment.html?course_id=${courseId}`
                : '../create-assignment/create-assignment.html';
            window.location.href = target;
        });
    }

    if (tbody) {
        tbody.addEventListener('click', e => {
            const kebab = e.target.closest('.kebab-btn');
            const row = e.target.closest('tr[data-assignment-id]');
            if (!row) return;

            if (kebab) {
                e.stopPropagation();
                openRowMenu(kebab, row);
                return;
            }

            const assignmentId = row.dataset.assignmentId;
            const courseId = row.dataset.courseId;
            window.location.href =
                `../teacher-assign-manage/teacher-assign-manage.html?id=${assignmentId}&course_id=${courseId}`;
        });
    }

    if (rowActionMenu) {
        rowActionMenu.addEventListener('click', e => {
            e.stopPropagation();
            const item = e.target.closest('.row-action-item');
            if (!item || !activeMenuRow) return;
            const action = item.dataset.action;
            const assignmentId = activeMenuRow.dataset.assignmentId;
            const courseId = activeMenuRow.dataset.courseId;
            handleRowAction(action, assignmentId, courseId);
            hideRowMenu();
        });
    }

    // ---------- Start ----------
    fetchAssignments();
});
