document.addEventListener('DOMContentLoaded', async () => {
    // ==========================================
    // ตั้งค่า API
    // ==========================================
    const API_BASE_URL = 'https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com';

    // ==========================================
    // โหลด Sidebar + Navbar
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
    // Auth
    // ==========================================
    const userData = JSON.parse(localStorage.getItem('user'));

    if (!userData || !userData.token) {
        window.location.href = '../../auth/login.html';
        return;
    }

    const TOKEN = userData.token;
    const USER_ID = userData.user_id;

    // ==========================================
    // State
    // ==========================================
    let allAnnouncements = [];
    let sortOrder = 'newest';
    let selectedCourse = 'all';

    // ==========================================
    // โหลดประกาศทั้งหมดจาก API จริง
    // วิธีทำ:
    // 1. ดึง course ของ teacher จาก /courses/my/{USER_ID}
    // 2. เอา course_id แต่ละตัวไปดึง /announcements/course/{course_id}
    // 3. รวมประกาศทั้งหมดแล้ว render
    // ==========================================
    async function loadAnnouncements() {
        const listEl = document.getElementById('announcement-list');

        if (!listEl) return;

        try {
            listEl.innerHTML = '<p class="loading-state">กำลังโหลด...</p>';

            const headers = {
                'Authorization': `Bearer ${TOKEN}`
            };

            // 1) ดึง courses ของ teacher
            const coursesRes = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`, {
                method: 'GET',
                headers
            });

            if (!coursesRes.ok) {
                throw new Error('fetch courses failed');
            }

            const coursesResult = await coursesRes.json();

            // รองรับทั้งกรณี backend ส่ง list ตรง ๆ และส่ง { data: [...] }
            const courses = Array.isArray(coursesResult)
                ? coursesResult
                : (coursesResult.data || []);

            populateFilterDropdown(courses);

            if (courses.length === 0) {
                allAnnouncements = [];
                renderList();
                return;
            }

            // 2) ดึง announcements ของแต่ละ course
            const results = await Promise.all(
                courses.map(course =>
                    fetch(`${API_BASE_URL}/announcements/course/${course.course_id}`, {
                        method: 'GET',
                        headers
                    })
                        .then(async r => {
                            if (!r.ok) {
                                console.error(`Fetch announcements failed for ${course.course_id}`);
                                return [];
                            }

                            const data = await r.json();
                            const announcements = Array.isArray(data)
                                ? data
                                : (data.data || []);

                            return announcements.map(a => ({
                                ...a,
                                course_code: course.course_code,
                                course_name: course.course_name
                            }));
                        })
                        .catch(err => {
                            console.error(`Error fetching announcements for ${course.course_id}:`, err);
                            return [];
                        })
                )
            );

            // 3) รวม announcements ทุกวิชา
            allAnnouncements = results.flat();

            console.log('[Announcements] courses:', courses);
            console.log('[Announcements] allAnnouncements:', allAnnouncements);

            renderList();

        } catch (err) {
            console.error('Critical Error:', err);
            listEl.innerHTML = '<p class="loading-state">ไม่สามารถโหลดข้อมูลประกาศได้ กรุณาลองใหม่อีกครั้ง</p>';
        }
    }

    // ==========================================
    // เติม Filter dropdown ด้วย courses จริง
    // ==========================================
    function populateFilterDropdown(courses) {
        const dropdown = document.getElementById('filter-dropdown');
        if (!dropdown) return;

        dropdown.innerHTML = '<button class="filter-option active" data-filter="all">All</button>';

        courses.forEach(course => {
            const btn = document.createElement('button');
            btn.className = 'filter-option';
            btn.dataset.filter = course.course_id;
            btn.textContent = course.course_code;
            dropdown.appendChild(btn);
        });
    }

    // ==========================================
    // Render list
    // ==========================================
    function renderList() {
        const listEl = document.getElementById('announcement-list');
        const searchInput = document.getElementById('search-input');

        if (!listEl) return;

        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        let filtered = allAnnouncements.filter(a => {
            const matchCourse =
                selectedCourse === 'all' ||
                String(a.course_id).trim() === String(selectedCourse).trim();

            const text = `
                ${a.title ?? ''}
                ${a.content ?? ''}
                ${a.course_code ?? ''}
                ${a.course_name ?? ''}
            `.toLowerCase();

            return matchCourse && text.includes(query);
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.created_at || 0);
            const dateB = new Date(b.created_at || 0);
            const diff = dateB - dateA;

            return sortOrder === 'newest' ? diff : -diff;
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<p class="empty-state">ไม่พบประกาศ</p>';
            return;
        }

        // ใช้ createAnnouncementCard จาก announce-card.js
        listEl.innerHTML = filtered
            .map((a, i) => createAnnouncementCard(a, i))
            .join('');
    }

    // ==========================================
    // Search
    // ==========================================
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', renderList);
    }

    // ==========================================
    // Sort toggle
    // ==========================================
    const sortBtn = document.getElementById('sort-btn');
    if (sortBtn) {
        sortBtn.addEventListener('click', () => {
            sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';

            const sortLabel = document.getElementById('sort-label');
            const sortIcon = document.getElementById('sort-icon');

            if (sortLabel) {
                sortLabel.textContent = sortOrder === 'newest' ? 'Newest' : 'Oldest';
            }

            if (sortIcon) {
                sortIcon.setAttribute(
                    'icon',
                    sortOrder === 'newest' ? 'bx:down-arrow-alt' : 'bx:up-arrow-alt'
                );
            }

            renderList();
        });
    }

    // ==========================================
    // Filter dropdown
    // ==========================================
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');

    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('open');
            filterBtn.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            if (filterDropdown.classList.contains('open')) {
                filterDropdown.classList.remove('open');
                filterBtn.classList.remove('active');
            }
        });

        filterDropdown.addEventListener('click', e => {
            e.stopPropagation();

            const btn = e.target.closest('.filter-option');
            if (!btn) return;

            filterDropdown
                .querySelectorAll('.filter-option')
                .forEach(b => b.classList.remove('active'));

            btn.classList.add('active');

            selectedCourse = btn.dataset.filter;

            filterDropdown.classList.remove('open');
            filterBtn.classList.remove('active');

            renderList();
        });
    }

    // ==========================================
    // เริ่มโหลดข้อมูล
    // ==========================================
    await loadAnnouncements();
});