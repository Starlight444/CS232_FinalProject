document.addEventListener('DOMContentLoaded', async () => {
    const API_BASE_URL = 'https://2z3eq1a51d.execute-api.us-east-1.amazonaws.com/default';

    // โหลด Sidebar + Navbar
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

                const logoImg = document.getElementById('logo-img');
                if (logoImg) logoImg.src = '../../components/image/tulogo.png';


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
                        }).observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
                    }
                };
            })
            .catch(err => console.error('Error loading teacher sidebar/navbar:', err));
    }

    loadTeacherSidebarNavbar();

    // Auth
    const userData = JSON.parse(localStorage.getItem('user'));
    const TOKEN = userData?.token ?? '';
    const USER_ID = userData?.user_id ?? '';

    // State
    let allAnnouncements = [];
    let sortOrder = 'newest';
    let selectedCourse = 'all';


    // โหลดประกาศทั้งหมดจาก API (ผ่าน courses ของ teacher)
    async function loadAnnouncements() {
        const listEl = document.getElementById('announcement-list');
        try {
            const headers = { 'Authorization': `Bearer ${TOKEN}` };

            // ดึง courses ของ teacher
            const coursesRes = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`, { headers });
            if (!coursesRes.ok) throw new Error('fetch courses failed');
            const coursesResult = await coursesRes.json();
            const courses = coursesResult.data ?? [];

            // ดึง announcements ของแต่ละ course แล้วรวมกัน
            const results = await Promise.all(
                courses.map(course =>
                    fetch(`${API_BASE_URL}/announcements/course/${course.course_id}`, { headers })
                        .then(r => r.ok ? r.json() : { data: [] })
                        .then(r => (r.data ?? [])
                            .filter(a => String(a.course_id).trim() === String(course.course_id).trim())
                            .map(a => ({ ...a, course_code: course.course_code }))
                        )
                        .catch(err => {
                            console.error(`Error fetching for ${course.course_id}`, err);
                            return [];
                        })
                )
            );
            allAnnouncements = results.flat();
            populateFilterDropdown(courses);
            renderList();
        } catch (err) {
            console.error('Critical Error:', err);
            listEl.innerHTML = '<p class="loading-state">ไม่สามารถโหลดข้อมูลประกาศได้ กรุณาลองใหม่อีกครั้ง</p>';
            // Mock fallback เมื่อ Backend ยังไม่พร้อม
            /*allAnnouncements = [
                {
                    announcement_id: '1',
                    course_id: 'cs251',
                    course_code: 'CS251',
                    created_by: { name: 'Teacher' },
                    title: 'Midterm Exam Scores',
                    content: 'ดูคะแนนสอบกลางภาค (ประกาศแบบ individual score) ที่เมนู Grades ด้านข้างมือ คะแนนเฉลี่ยสำหรับการสอบกลางภาค คือ 44.13 (คะแนนเต็ม 100)',
                    created_at: new Date().toISOString()
                },
                {
                    announcement_id: '2',
                    course_id: 'cs222',
                    course_code: 'CS222',
                    created_by: 'TA',
                    title: 'ประกาศจาก TA',
                    content: 'เนื่องจากสถานการณ์ที่โรคอีสุกอีใสระบาดในคณะรัฐศาสตร์ และทางคณะวิทยาศาสตร์...',
                    created_at: new Date(Date.now() - 2 * 3600000).toISOString()
                }
            ];*/
        }
    }

    // Populate filter dropdown ด้วย courses จริง
    function populateFilterDropdown(courses) {
        const dropdown = document.getElementById('filter-dropdown');
        dropdown.innerHTML = '<button class="filter-option active" data-filter="all">All</button>';
        courses.forEach(course => {
            const btn = document.createElement('button');
            btn.className = 'filter-option';
            btn.dataset.filter = course.course_id;
            btn.textContent = course.course_code;
            dropdown.appendChild(btn);
        });
    }

    // Render: filter + sort + สร้าง card จาก component
    function renderList() {
        const listEl = document.getElementById('announcement-list');
        const query = document.getElementById('search-input').value.toLowerCase().trim();

        let filtered = allAnnouncements.filter(a => {
            const matchCourse = selectedCourse === 'all' || a.course_id === selectedCourse;
            const text = `${a.title ?? ''} ${a.content ?? ''} ${a.course_code ?? ''}`.toLowerCase();
            return matchCourse && text.includes(query);
        });

        filtered.sort((a, b) => {
            const diff = new Date(b.created_at) - new Date(a.created_at);
            return sortOrder === 'newest' ? diff : -diff;
        });

        if (filtered.length === 0) {
            listEl.innerHTML = '<p class="empty-state">ไม่พบประกาศ</p>';
            return;
        }

        // ใช้ createAnnouncementCard จาก component announce-card.js
        listEl.innerHTML = filtered.map((a, i) => createAnnouncementCard(a, i)).join('');
    }

    // Search
    document.getElementById('search-input').addEventListener('input', renderList);

    // Sort toggle
    document.getElementById('sort-btn').addEventListener('click', () => {
        sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
        document.getElementById('sort-label').textContent = sortOrder === 'newest' ? 'Newest' : 'Oldest';
        document.getElementById('sort-icon').setAttribute(
            'icon',
            sortOrder === 'newest' ? 'bx:down-arrow-alt' : 'bx:up-arrow-alt'
        );
        renderList();
    });

    // Filter dropdown toggle
    const filterBtn = document.getElementById('filter-btn');
    const filterDropdown = document.getElementById('filter-dropdown');

    // เปิด/ปิด dropdown เมื่อคลิกปุ่ม
    filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterDropdown.classList.toggle('open');
        filterBtn.classList.toggle('active');
    });

    // ปิด dropdown เมื่อคลิกที่อื่น
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

        filterDropdown.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        selectedCourse = btn.dataset.filter;
        filterDropdown.classList.remove('open');
        filterBtn.classList.remove('active');
        renderList();
    });

    await loadAnnouncements();
});
