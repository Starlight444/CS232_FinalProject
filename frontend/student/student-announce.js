const API_BASE_URL = 'https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default';

const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.token) {
    window.location.href = "../auth/login.html";
}

const TOKEN = userData ? userData.token : '';
const USER_ID = userData ? userData.user_id : '';

let allAnnouncements = [];
let sortOrder = 'newest';
let activeFilter = 'all';
const creatorNameCache = {};

// Load Components
function loadSidebar() {
    fetch('../components/student-sidebar/sidebar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('sidebar-placeholder').innerHTML = html;
            const script = document.createElement('script');
            script.src = '../components/student-sidebar/sidebar.js';
            document.body.appendChild(script);
        })
        .catch(err => console.error('Error loading sidebar:', err));
}

function loadNavbar() {
    fetch('../components/student-navbar/student-navbar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('navbar-placeholder').innerHTML = html;
            const script = document.createElement('script');
            script.src = '../components/student-navbar/student-navbar.js';
            document.body.appendChild(script);
        })
        .catch(err => console.error('Error loading navbar:', err));
}

// Fetch Data
async function loadAnnouncements() {
    const listEl = document.getElementById('announcement-list');
    listEl.innerHTML = `<div class="loading-state">Loading announcements...</div>`;

    try {
        const headers = { 'Authorization': `Bearer ${TOKEN}` };
        const courseRes = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}?role=${userData.role}`, { headers });
        const courseJson = await courseRes.json();

        const courses = Array.isArray(courseJson) ? courseJson : (courseJson.data || []);

        if (!courses.length) {
            listEl.innerHTML = `<div class="empty-state">No courses enrolled.</div>`;
            return;
        }

        const courseMap = {};
        courses.forEach(c => { courseMap[c.course_id] = c; });

        // ดึง announcements ของแต่ละ course (merged: internal + external)
        // TODO: รอ backend ทำ /announcements/merged/:course_id
        //       ถ้ายังไม่พร้อม fetchMergedAnnouncements จะคืน [] แล้ว fallback เดิม
        const results = await Promise.all(
            courses.map(async (course) => {
                let merged = [];
                if (window.ScraperMerge) {
                    merged = await window.ScraperMerge.fetchMergedAnnouncements(
                        API_BASE_URL, course.course_id, TOKEN, course
                    );
                }
                if (merged.length) return merged;

                // Fallback ใช้ internal endpoint เดิม
                // TODO: ลบ block นี้เมื่อ merged endpoint พร้อมใช้งานจริง
                try {
                    const r = await fetch(
                        `${API_BASE_URL}/announcements/course/${course.course_id}`,
                        { headers }
                    );
                    const j = r.ok ? await r.json() : { data: [] };
                    return (j.data ?? [])
                        .filter(a => String(a.course_id).trim() === String(course.course_id).trim())
                        .map(a => window.ScraperMerge.normalizeAnnouncement(
                            { ...a, source: 'internal' },
                            course
                        ));
                } catch (err) {
                    console.error(`Error fetching for ${course.course_id}`, err);
                    return [];
                }
            })
        );
        allAnnouncements = results.flat();
        await resolveAnnouncementCreators(allAnnouncements);

        buildFilterOptions(courses);
        renderAnnouncements();
    } catch (err) {
        console.error('Error loading announcements:', err);
        listEl.innerHTML = `<div class="empty-state">Failed to load announcements.</div>`;
    }
}

// Build Filter Dropdown from Courses
function buildFilterOptions(courses) {
    const dropdown = document.getElementById('filter-dropdown');
    dropdown.innerHTML = `<button class="filter-option active" data-filter="all">All</button>`;
    courses.forEach(c => {
        const btn = document.createElement('button');
        btn.className = 'filter-option';
        btn.dataset.filter = c.course_id;
        btn.textContent = c.course_code;
        dropdown.appendChild(btn);
    });

    dropdown.querySelectorAll('.filter-option').forEach(btn => {
        btn.addEventListener('click', () => {
            dropdown.querySelectorAll('.filter-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.dataset.filter;
            dropdown.classList.remove('open');
            document.getElementById('filter-btn').classList.remove('active');
            renderAnnouncements();
        });
    });
}

// ==========================================
// ฟังก์ชันแสดงชื่อผู้สร้างประกาศ (สำหรับ internal)
// ==========================================
async function resolveAnnouncementCreators(announcements) {
    const extractCreatorId = (creator) => {
        if (!creator) return '';
        if (typeof creator === 'string') return creator.trim();
        if (typeof creator === 'object') return String(creator.user_id || creator.id || '').trim();
        return '';
    };

    const ids = Array.from(new Set(
        announcements
            .filter(a => a.source === 'internal')
            .map(a => extractCreatorId(a.created_by) || extractCreatorId(a._raw?.created_by))
            .filter(id => id && !creatorNameCache[id])
    ));

    if (!ids.length) return;

    const headers = { 'Authorization': `Bearer ${TOKEN}` };
    const results = await Promise.all(ids.map(async user_id => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${user_id}`, { headers });
            if (!res.ok) return null;
            const json = await res.json();
            const data = json.data || {};
            const fullName = data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim();
            return { user_id, name: fullName || user_id };
        } catch (err) {
            console.error('Failed to fetch user name for', user_id, err);
            return null;
        }
    }));

    results.forEach(item => {
        if (item?.user_id) {
            creatorNameCache[item.user_id] = item.name;
        }
    });

    announcements.forEach(a => {
        if (a.source === 'internal') {
            const rawCreator = a._raw?.created_by;
            const id = extractCreatorId(a.created_by) || extractCreatorId(rawCreator);
            const nameFromRaw = rawCreator?.name || (rawCreator?.first_name && rawCreator?.last_name)
                ? `${rawCreator.first_name} ${rawCreator.last_name}`.trim()
                : null;

            a.created_by_name = nameFromRaw || (id ? creatorNameCache[id] : null) || id;
            if (id) a.created_by = id;
        }
    });
}

// Render
function renderAnnouncements() {
    const listEl = document.getElementById('announcement-list');
    const searchTerm = document.getElementById('search-input').value.trim().toLowerCase();

    let filtered = allAnnouncements.filter(a => {
        if (activeFilter !== 'all' && String(a.course_id) !== String(activeFilter)) return false;
        if (searchTerm) {
            const haystack = `${a.title} ${a.content} ${a.course_code} ${a.course_name}`.toLowerCase();
            if (!haystack.includes(searchTerm)) return false;
        }
        return true;
    });

    filtered.sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at);
        const dateB = new Date(b.updated_at || b.created_at);

        // ถ้าเป็น newest เอาใหม่ขึ้นก่อน (b - a)
        // ถ้าเป็น oldest เอาเก่าขึ้นก่อน (a - b)
        return sortOrder === 'newest' ? (dateB - dateA) : (dateA - dateB);
    });

    if (!filtered.length) {
        listEl.innerHTML = `<div class="empty-state">No announcements found</div>`;
        return;
    }

    listEl.innerHTML = filtered
        .map((announcement, index) => createAnnouncementCard(announcement, index))
        .join('');
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSidebar();
    loadNavbar();

    loadAnnouncements();

    // search input
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', () => {
        renderAnnouncements();
    });

    // Sort toggle
    const sortLabel = document.getElementById('sort-label');
    sortLabel.addEventListener('click', () => {
        sortOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
        sortLabel.innerHTML = sortOrder === 'newest'
            ? `Newest <iconify-icon icon="ph:caret-down-bold" width="14" height="14"></iconify-icon>`
            : `Oldest <iconify-icon icon="ph:caret-up-bold" width="14" height="14"></iconify-icon>`;
        renderAnnouncements();
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

    filterDropdown.addEventListener('click', e => e.stopPropagation());

    // Sync button — เรียก scraper backend ให้ล้างและดึงใหม่ แล้วโหลด announcements ใหม่
    // TODO: confirm endpoint/method กับ backend ใน scraper-merge.js
    window.ScraperMerge?.bindSyncButton(
        document.getElementById('sync-btn'),
        API_BASE_URL,
        TOKEN,
        loadAnnouncements
    );
});