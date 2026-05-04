// ── Auth & URL params ──────────────────────────────────────────────────────
const API_BASE_URL = 'https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default';

const userData = JSON.parse(localStorage.getItem('user'));
if (!userData || !userData.token) {
    window.location.href = '../auth/login.html';
}
const TOKEN   = userData ? userData.token   : '';
const USER_ID = userData ? userData.user_id : '';

const urlParams = new URLSearchParams(window.location.search);
const courseId  = urlParams.get('course_id') || urlParams.get('id');

if (!courseId) {
    alert('ไม่พบ ID ของ Course');
    window.location.href = '../teacher/teacher-dashboard.html';
}

// ── Bootstrap ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    loadTeacherSidebarNavbar();
    initTabIndicator();
    fetchCourseInfo();
    fetchAssignmentCount();
    fetchAnnouncements();
    fetchMembers();
    renderMaterials();
});

// ── Sidebar / Navbar ───────────────────────────────────────────────────────
function loadTeacherSidebarNavbar() {
    const CACHE_KEY = 'teacher-sidebar-html';

    function injectSidebar(html) {
        const parser    = new DOMParser();
        const doc       = parser.parseFromString(html, 'text/html');
        const container = document.getElementById('teacher-sidebar-navbar-container');
        if (!container) return;

        const sidebar = doc.querySelector('#sidebar');
        const navbar  = doc.querySelector('.navbar');
        if (sidebar) container.appendChild(sidebar);
        if (navbar)  container.appendChild(navbar);

        const sidebarScript = document.createElement('script');
        sidebarScript.src   = '../../components/teacher-sidebar-navbar/teacher-sidebar.js';
        document.body.appendChild(sidebarScript);

        const navbarScript = document.createElement('script');
        navbarScript.src   = '../../components/teacher-sidebar-navbar/teacher-navbar.js';
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
    }

    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
        injectSidebar(cached);
    } else {
        fetch('../../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
            .then(r => r.text())
            .then(html => {
                sessionStorage.setItem(CACHE_KEY, html);
                injectSidebar(html);
            })
            .catch(err => console.error('Error loading sidebar/navbar:', err));
    }
}

// ── Tab Indicator ──────────────────────────────────────────────────────────
function initTabIndicator() {
    const nav       = document.getElementById('tab-nav');
    const indicator = document.getElementById('tab-indicator');
    if (!nav || !indicator) return;

    const allButtons = Array.from(nav.querySelectorAll('.tab-btn'));
    const activeBtn  = nav.querySelector('.tab-btn.active');
    if (activeBtn) {
        moveIndicator(activeBtn, false);
        const idx         = allButtons.indexOf(activeBtn);
        const contentBody = document.querySelector('.tab-content-body');
        if (contentBody) {
            contentBody.classList.toggle('first-tab-active', idx === 0);
            contentBody.classList.toggle('last-tab-active',  idx === allButtons.length - 1);
        }
    }

    window.addEventListener('resize', () => {
        const current = nav.querySelector('.tab-btn.active');
        if (current) moveIndicator(current, false);
    });

    const main = document.querySelector('.main');
    if (main) {
        main.addEventListener('transitionend', e => {
            if (e.propertyName === 'width' || e.propertyName === 'margin-left') {
                const current = nav.querySelector('.tab-btn.active');
                if (current) moveIndicator(current, false);
            }
        });
    }
}

function moveIndicator(btn, animate = true) {
    const indicator = document.getElementById('tab-indicator');
    if (!indicator) return;
    const nav     = document.getElementById('tab-nav');
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    if (!animate) {
        indicator.style.transition = 'none';
        indicator.getBoundingClientRect();
    } else {
        indicator.style.transition = 'left 0.35s cubic-bezier(0.4,0,0.2,1), width 0.35s cubic-bezier(0.4,0,0.2,1)';
    }
    indicator.style.left  = (btnRect.left - navRect.left) + 'px';
    indicator.style.width = btnRect.width + 'px';
}

function switchTab(element, tabId) {
    const allButtons  = Array.from(document.querySelectorAll('.tab-btn'));
    const allPanels   = document.querySelectorAll('.tab-panel');
    const targetPanel = document.getElementById(tabId);
    const contentBody = document.querySelector('.tab-content-body');

    allButtons.forEach(t => t.classList.remove('active'));
    element.classList.add('active');
    moveIndicator(element, true);

    allPanels.forEach(p => {
        p.style.display = 'none';
        p.classList.remove('active');
    });

    const idx = allButtons.indexOf(element);
    contentBody.classList.toggle('first-tab-active', idx === 0);
    contentBody.classList.toggle('last-tab-active',  idx === allButtons.length - 1);

    targetPanel.style.display = 'flex';
    setTimeout(() => targetPanel.classList.add('active'), 10);
}

// ── Navigation helpers ─────────────────────────────────────────────────────

function goToGradeBook() {
    window.location.href = '../teacher-detail-grade.html?course_id=' + courseId;
}

function goToCreateAnnouncement() {
    window.location.href = '../teacher-announcement/announcement-create.html?course_id=' + courseId;
}

function goToCreateAssignment() {
    window.location.href = '../create-assignment/create-assignment.html?course_id=' + courseId;
}

function goToAssignmentDetail(assignmentId) {
    window.location.href = '../teacher-assign-manage/teacher-assign-manage.html?id=' + assignmentId + '&course_id=' + courseId;
}

function goToEditAnnouncement(announcementId) {
    window.location.href = '../teacher-announcement/announcement-create.html?mode=edit&id=' + announcementId;
}

// ── Course Info → Banner ───────────────────────────────────────────────────
async function fetchCourseInfo() {
    try {
        const res  = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}?role=teacher`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        
        const data = await res.json();
        const courses = Array.isArray(data) ? data : (data.data || []);
        const course  = courses.find(c => String(c.course_id) === String(courseId));

        if (!course) return;

        const nameEl  = document.getElementById('banner-course-name');
        const countEl = document.getElementById('banner-student-count');

        if (nameEl)  nameEl.textContent  = `${course.course_code}  ${course.course_name}`;
        if (countEl) countEl.textContent = course.total_std ?? '–';
    } catch (err) {
        console.error('fetchCourseInfo error:', err);
    }
}

// ── Assignment Count + Table ───────────────────────────────────────────────
let _allAssignments  = [];
let _activeFilter    = 'all';

function _formatDue(dateStr) {
    if (!dateStr) return '–';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function _isPastDue(dateStr) {
    return dateStr && new Date(dateStr) < new Date();
}

async function fetchAssignmentCount() {
    const tbody = document.getElementById('assign-table-body');
    try {
        const res         = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data        = await res.json();
        const assignments = data.data || [];

        const el = document.getElementById('assignment-count');
        if (el) el.textContent = assignments.length;

        const withCounts = await Promise.all(assignments.map(async a => {
            try {
                const r    = await fetch(`${API_BASE_URL}/submissions/assignment/${a.assignment_id}`, {
                    headers: { 'Authorization': `Bearer ${TOKEN}` }
                });
                const json = await r.json();
                const subs = json.data || json || [];
                return { ...a, _subCount: Array.isArray(subs) ? subs.length : '–' };
            } catch {
                return { ...a, _subCount: '–' };
            }
        }));

        _allAssignments = withCounts;
        applyAssignFilter(_activeFilter);
    } catch (err) {
        console.error('fetchAssignmentCount error:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="assign-loading">Failed to load assignments.</td></tr>`;
    }
}

function applyAssignFilter(filter) {
    _activeFilter = filter;

    // อัป label ปุ่ม filter
    const labels = { all: 'Filter', 'to-review': 'To Review', upcoming: 'Upcoming', reviewed: 'Reviewed' };
    const filterBtn = document.getElementById('assign-filter-btn');
    if (filterBtn) filterBtn.querySelector('.filter-label').textContent = labels[filter] || 'Filter';

    // ปิด dropdown
    const fd = document.getElementById('assign-filter-dropdown');
    if (fd) fd.classList.remove('open');

    if (filter === 'reviewed') {
        renderAssignmentTable([]);
        const tbody = document.getElementById('assign-table-body');
        if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="assign-loading">No assignments.</td></tr>`;
        return;
    }

    let list = _allAssignments;
    if (filter === 'to-review')  list = list.filter(a => _isPastDue(a.due_date));
    if (filter === 'upcoming')   list = list.filter(a => !_isPastDue(a.due_date));

    renderAssignmentTable(list);
}

function renderAssignmentTable(assignments) {
    const tbody = document.getElementById('assign-table-body');
    if (!tbody) return;

    if (!assignments.length) {
        tbody.innerHTML = `<tr><td colspan="4" class="assign-loading">No assignments.</td></tr>`;
        return;
    }

    tbody.innerHTML = assignments.map(a => `
        <tr>
            <td class="assign-name">${a.title}</td>
            <td class="assign-due">${_formatDue(a.due_date)}</td>
            <td class="assign-submitted">${a._subCount ?? '–'}</td>
            <td>
                <div class="assign-menu-wrap">
                    <button class="assign-menu-btn" onclick="toggleAssignMenu(this)">⋮</button>
                    <div class="assign-dropdown">
                        <button class="assign-dropdown-item" onclick="goToAssignmentDetail('${a.assignment_id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            View Assignment
                        </button>
                    </div>
                </div>
            </td>
        </tr>`).join('');
}

function toggleAssignFilter() {
    const fd = document.getElementById('assign-filter-dropdown');
    if (fd) fd.classList.toggle('open');
}

function toggleAssignMenu(btn) {
    const dropdown = btn.nextElementSibling;
    const isOpen   = dropdown.classList.contains('open');
    document.querySelectorAll('.assign-dropdown.open').forEach(d => d.classList.remove('open'));
    if (!isOpen) dropdown.classList.add('open');
}

document.addEventListener('click', e => {
    if (!e.target.closest('.assign-menu-wrap')) {
        document.querySelectorAll('.assign-dropdown.open').forEach(d => d.classList.remove('open'));
    }
    if (!e.target.closest('.assign-filter-wrap')) {
        const fd = document.getElementById('assign-filter-dropdown');
        if (fd) fd.classList.remove('open');
    }
});

// ── Announcements ─────────────────────────────────────────────────────────
function getTimeAgo(dateStr) {
    const diffMs  = new Date() - new Date(dateStr);
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays= Math.floor(diffMs / 86400000);
    if (diffMin < 1)  return 'Now';
    if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
    if (diffHrs < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

async function fetchAnnouncements() {
    const container = document.getElementById('announcement-list');
    try {
        const res  = await fetch(`${API_BASE_URL}/announcements/course/${courseId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data          = await res.json();
        const announcements = data.data || [];

        if (announcements.length === 0) {
            container.innerHTML = `<div class="empty-state">No announcements yet.</div>`;
            return;
        }

        const personIcon = `<svg width="44" height="44" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50" rx="25" fill="#E6E6E6"/><path d="M24.9997 21.6666C28.6816 21.6666 31.6663 18.6818 31.6663 14.9999C31.6663 11.318 28.6816 8.33325 24.9997 8.33325C21.3178 8.33325 18.333 11.318 18.333 14.9999C18.333 18.6818 21.3178 21.6666 24.9997 21.6666Z" fill="black"/><path d="M38.3337 34.1667C38.3337 38.3084 38.3337 41.6667 25.0003 41.6667C11.667 41.6667 11.667 38.3084 11.667 34.1667C11.667 30.0251 17.637 26.6667 25.0003 26.6667C32.3637 26.6667 38.3337 30.0251 38.3337 34.1667Z" fill="black"/></svg>`;

        const editIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

        announcements.sort((a, b) =>
            new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at)
        );

        container.innerHTML = announcements.map(a => {
            const timeAgo = getTimeAgo(a.updated_at || a.created_at);
            const hasBeenEdited = a.updated_at && a.updated_at !== a.created_at;
            const editedBadge = hasBeenEdited ? '<span class="announcement-edited">Edited</span>' : '';

            return `
                <div class="announcement-card">
                    <div class="announcement-content-area">
                        <div class="announcement-icon">${personIcon}</div>
                        <div class="announcement-card-info">
                            <div class="announcement-title-row">
                                <span class="announcement-course">${a.title}</span>
                            </div>
                            <p class="announcement-body">${a.content || a.description || ''}</p>
                            <span class="announcement-time">${timeAgo} ${editedBadge}</span>
                        </div>
                    </div>
                    <button class="announcement-edit-btn" onclick="goToEditAnnouncement('${a.announcement_id}')" title="Edit">
                        ${editIcon}
                    </button>
                </div>`;
        }).join('');
    } catch (err) {
        console.error('fetchAnnouncements error:', err);
        container.innerHTML = `<div class="empty-state">Failed to load announcements.</div>`;
    }
}

// ── Members / People ──────────────────────────────────────────────────────
async function fetchMembers() {
    const container = document.getElementById('people');
    try {
        const res  = await fetch(`${API_BASE_URL}/members/${courseId}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data    = await res.json();
        const members = data.data || data;

        if (!members || members.length === 0) {
            container.innerHTML = `<div class="empty-state">No members.</div>`;
            return;
        }
        await renderMembers(members);
    } catch (err) {
        console.error('fetchMembers error:', err);
        container.innerHTML = `<div class="empty-state">Failed to load members.</div>`;
    }
}

async function renderMembers(members) {
    const container = document.getElementById('member-list');
    if (!container) return;

    const cards = await Promise.all(members.map(async m => {
        try {
            const res      = await fetch(`${API_BASE_URL}/users/${m.user_id}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const userData = await res.json();
            const name     = userData.data?.full_name
                || `${userData.data?.first_name || ''} ${userData.data?.last_name || ''}`.trim()
                || 'Unknown';
            const initial  = name.charAt(0).toUpperCase();
            return {
                role: m.role,
                html: `<div class="member-card ${m.role}">
                    <div class="member-avatar">${initial}</div>
                    <div class="member-info">
                        <div class="member-name">${name}</div>
                        <div class="member-role">${m.role}</div>
                    </div>
                </div>`
            };
        } catch {
            return {
                role: m.role,
                html: `<div class="member-card ${m.role}">
                    <div class="member-avatar">U</div>
                    <div class="member-info">
                        <div class="member-name">Unknown</div>
                        <div class="member-role">${m.role}</div>
                    </div>
                </div>`
            };
        }
    }));

    const teachers = cards.filter(c => c.role === 'teacher');
    const students = cards.filter(c => c.role === 'student');

    container.innerHTML = `
        <div class="member-section">
            <div class="member-section-title"> Teacher</div>
            <div class="member-list">${teachers.map(c => c.html).join('')}</div>
        </div>
        <div class="member-section">
            <div class="member-section-title"> Students</div>
            <div class="member-list">${students.map(c => c.html).join('')}</div>
        </div>`;
}

// ── Materials (mock weeks + API assignments) ───────────────────────────────
const _MAT_BOOK = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.53164 2.19967C5.68789 2.31009 5.24206 2.51322 4.92331 2.82467C4.6056 3.13717 4.39831 3.57467 4.28477 4.40072C4.1681 5.25176 4.16602 6.37884 4.16602 7.99447V16.9216C4.57849 16.6399 5.03615 16.431 5.51914 16.3038C6.06914 16.1591 6.71081 16.1591 7.65143 16.1601H20.8327V7.99551C20.8327 6.37884 20.8306 5.25176 20.7139 4.40072C20.6004 3.57467 20.3931 3.13717 20.0754 2.82467C19.7566 2.51322 19.3108 2.31009 18.4671 2.19967C17.5983 2.08509 16.4483 2.08301 14.7983 2.08301H10.2004C8.55039 2.08301 7.40039 2.08509 6.53164 2.19967ZM7.03997 6.86947C7.03997 6.4028 7.42539 6.02467 7.90143 6.02467H17.0973C17.3233 6.02273 17.5408 6.11044 17.7023 6.26858C17.8638 6.42673 17.956 6.64243 17.9587 6.86842C17.9562 7.0946 17.8642 7.31057 17.7027 7.46894C17.5412 7.62731 17.3234 7.71516 17.0973 7.71322H7.90143C7.67543 7.71516 7.45786 7.62746 7.29639 7.46931C7.13493 7.31116 7.04272 7.09546 7.03997 6.86947ZM7.90143 9.96634C7.67543 9.9644 7.45786 10.0521 7.29639 10.2103C7.13493 10.3684 7.04272 10.5841 7.03997 10.8101C7.03997 11.2768 7.42539 11.6549 7.90143 11.6549H13.6483C13.8745 11.6571 14.0923 11.5695 14.254 11.4113C14.4157 11.2532 14.5081 11.0373 14.5108 10.8111C14.5083 10.5848 14.4161 10.3687 14.2544 10.2102C14.0927 10.0518 13.8747 9.96412 13.6483 9.96634H7.90143Z" fill="white"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M6.53164 2.19967C5.68789 2.31009 5.24206 2.51322 4.92331 2.82467C4.6056 3.13717 4.39831 3.57467 4.28477 4.40072C4.1681 5.25176 4.16602 6.37884 4.16602 7.99447V16.9216C4.57849 16.6399 5.03615 16.431 5.51914 16.3038C6.06914 16.1591 6.71081 16.1591 7.65143 16.1601H20.8327V7.99551C20.8327 6.37884 20.8306 5.25176 20.7139 4.40072C20.6004 3.57467 20.3931 3.13717 20.0754 2.82467C19.7566 2.51322 19.3108 2.31009 18.4671 2.19967C17.5983 2.08509 16.4483 2.08301 14.7983 2.08301H10.2004C8.55039 2.08301 7.40039 2.08509 6.53164 2.19967ZM7.03997 6.86947C7.03997 6.4028 7.42539 6.02467 7.90143 6.02467H17.0973C17.3233 6.02273 17.5408 6.11044 17.7023 6.26858C17.8638 6.42673 17.956 6.64243 17.9587 6.86842C17.9562 7.0946 17.8642 7.31057 17.7027 7.46894C17.5412 7.62731 17.3234 7.71516 17.0973 7.71322H7.90143C7.67543 7.71516 7.45786 7.62746 7.29639 7.46931C7.13493 7.31116 7.04272 7.09546 7.03997 6.86947ZM7.90143 9.96634C7.67543 9.9644 7.45786 10.0521 7.29639 10.2103C7.13493 10.3684 7.04272 10.5841 7.03997 10.8101C7.03997 11.2768 7.42539 11.6549 7.90143 11.6549H13.6483C13.8745 11.6571 14.0923 11.5695 14.254 11.4113C14.4157 11.2532 14.5081 11.0373 14.5108 10.8111C14.5083 10.5848 14.4161 10.3687 14.2544 10.2102C14.0927 10.0518 13.8747 9.96412 13.6483 9.96634H7.90143Z" fill="#6E6CDF" fill-opacity="0.5"/>
  <path d="M7.78372 17.8486H20.8327C20.8296 19.0257 20.8108 19.9049 20.715 20.5986C20.6014 21.4247 20.3941 21.8622 20.0764 22.1747C19.7577 22.4861 19.3118 22.6893 18.4681 22.7997C17.5993 22.9143 16.4493 22.9163 14.7993 22.9163H10.2004C8.55039 22.9163 7.40039 22.9143 6.53164 22.8007C5.68789 22.6893 5.24206 22.4861 4.92331 22.1747C4.6056 21.8622 4.39831 21.4247 4.28477 20.5986C4.24206 20.2861 4.21393 19.9351 4.19727 19.5361C4.34004 19.146 4.57555 18.7963 4.8835 18.5174C5.19145 18.2385 5.5626 18.0387 5.96497 17.9351C6.26706 17.8559 6.65977 17.8486 7.78372 17.8486Z" fill="white"/>
  <path d="M7.78372 17.8486H20.8327C20.8296 19.0257 20.8108 19.9049 20.715 20.5986C20.6014 21.4247 20.3941 21.8622 20.0764 22.1747C19.7577 22.4861 19.3118 22.6893 18.4681 22.7997C17.5993 22.9143 16.4493 22.9163 14.7993 22.9163H10.2004C8.55039 22.9163 7.40039 22.9143 6.53164 22.8007C5.68789 22.6893 5.24206 22.4861 4.92331 22.1747C4.6056 21.8622 4.39831 21.4247 4.28477 20.5986C4.24206 20.2861 4.21393 19.9351 4.19727 19.5361C4.34004 19.146 4.57555 18.7963 4.8835 18.5174C5.19145 18.2385 5.5626 18.0387 5.96497 17.9351C6.26706 17.8559 6.65977 17.8486 7.78372 17.8486Z" fill="#6E6CDF" fill-opacity="0.5"/>
</svg>`;

const _MAT_VIDEO = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.16732 3.125C3.61478 3.125 3.08488 3.34449 2.69418 3.73519C2.30348 4.12589 2.08398 4.6558 2.08398 5.20833V19.7917C2.08398 20.3442 2.30348 20.8741 2.69418 21.2648C3.08488 21.6555 3.61478 21.875 4.16732 21.875H20.834C21.3865 21.875 21.9164 21.6555 22.3071 21.2648C22.6978 20.8741 22.9173 20.3442 22.9173 19.7917V5.20833C22.9173 4.6558 22.6978 4.12589 22.3071 3.73519C21.9164 3.34449 21.3865 3.125 20.834 3.125H4.16732ZM8.98503 8.98958C9.00814 8.79043 9.07748 8.59944 9.18752 8.43185C9.29755 8.26426 9.44523 8.12471 9.61878 8.02432C9.79232 7.92394 9.98693 7.86551 10.1871 7.85369C10.3872 7.84187 10.5873 7.87699 10.7715 7.95625C11.2965 8.18125 12.4048 8.6875 13.809 9.49792C14.7958 10.0619 15.7488 10.6831 16.6632 11.3583C16.8239 11.478 16.9545 11.6335 17.0444 11.8125C17.1344 11.9916 17.1812 12.1892 17.1812 12.3896C17.1812 12.59 17.1344 12.7876 17.0444 12.9666C16.9545 13.1457 16.8239 13.3012 16.6632 13.4208C15.7488 14.0953 14.7958 14.7158 13.809 15.2792C12.8274 15.8525 11.8132 16.368 10.7715 16.8229C10.5873 16.9024 10.3872 16.9377 10.187 16.926C9.98673 16.9143 9.79203 16.8559 9.61843 16.7555C9.44482 16.655 9.29711 16.5154 9.18713 16.3477C9.07715 16.18 9.00793 15.9888 8.98503 15.7896C8.86004 14.6606 8.79883 13.5255 8.80169 12.3896C8.80169 10.774 8.91836 9.55729 8.98503 8.98958Z" fill="white"/>
  <path fill-rule="evenodd" clip-rule="evenodd" d="M4.16732 3.125C3.61478 3.125 3.08488 3.34449 2.69418 3.73519C2.30348 4.12589 2.08398 4.6558 2.08398 5.20833V19.7917C2.08398 20.3442 2.30348 20.8741 2.69418 21.2648C3.08488 21.6555 3.61478 21.875 4.16732 21.875H20.834C21.3865 21.875 21.9164 21.6555 22.3071 21.2648C22.6978 20.8741 22.9173 20.3442 22.9173 19.7917V5.20833C22.9173 4.6558 22.6978 4.12589 22.3071 3.73519C21.9164 3.34449 21.3865 3.125 20.834 3.125H4.16732ZM8.98503 8.98958C9.00814 8.79043 9.07748 8.59944 9.18752 8.43185C9.29755 8.26426 9.44523 8.12471 9.61878 8.02432C9.79232 7.92394 9.98693 7.86551 10.1871 7.85369C10.3872 7.84187 10.5873 7.87699 10.7715 7.95625C11.2965 8.18125 12.4048 8.6875 13.809 9.49792C14.7958 10.0619 15.7488 10.6831 16.6632 11.3583C16.8239 11.478 16.9545 11.6335 17.0444 11.8125C17.1344 11.9916 17.1812 12.1892 17.1812 12.3896C17.1812 12.59 17.1344 12.7876 17.0444 12.9666C16.9545 13.1457 16.8239 13.3012 16.6632 13.4208C15.7488 14.0953 14.7958 14.7158 13.809 15.2792C12.8274 15.8525 11.8132 16.368 10.7715 16.8229C10.5873 16.9024 10.3872 16.9377 10.187 16.926C9.98673 16.9143 9.79203 16.8559 9.61843 16.7555C9.44482 16.655 9.29711 16.5154 9.18713 16.3477C9.07715 16.18 9.00793 15.9888 8.98503 15.7896C8.86004 14.6606 8.79883 13.5255 8.80169 12.3896C8.80169 10.774 8.91836 9.55729 8.98503 8.98958Z" fill="#6E6CDF" fill-opacity="0.5"/>
</svg>`;

const _MAT_MP4_BADGE = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M10 1.33301H2.66666V8.66635H4V2.66635H9.44666L12 5.21966V8.66635H13.3333V4.66635L10 1.33301ZM4.49469 12.1645C4.42666 12.3731 4.34866 12.6431 4.26 12.9725C4.172 12.6391 4.094 12.3698 4.02866 12.1645L3.33666 9.99979H2V14.0038H2.83334V10.7625C2.92534 11.1078 3.006 11.3845 3.07334 11.5938L3.85334 14.0038H4.62734L5.43 11.5258C5.51266 11.2731 5.58666 11.0191 5.65 10.7625V14.0038H6.518V9.99982H5.196L4.49469 12.1645ZM8.61247 9.99979C8.99647 9.99979 9.28912 10.0251 9.49113 10.0758C9.76981 10.1478 9.98248 10.3052 10.1291 10.5478C10.2485 10.7418 10.3078 10.9691 10.3078 11.2291C10.3078 11.6525 10.1665 11.9778 9.88381 12.2038C9.76113 12.3018 9.61313 12.3725 9.43847 12.4144C9.26447 12.4565 9.03981 12.4778 8.76447 12.4778H8.38647V14.0038H7.48447V9.99982L8.61247 9.99979ZM8.62313 10.6785H8.36381V11.7998H8.62313C8.87381 11.7998 9.05381 11.7731 9.16313 11.7204C9.32513 11.6418 9.40581 11.4878 9.40581 11.2604C9.40581 11.0365 9.32781 10.8765 9.17181 10.7825C9.05712 10.7125 8.87381 10.6785 8.62313 10.6785ZM12.6099 12.447H11.4999L12.6099 10.8423V12.447ZM13.4605 12.447V9.99966H12.4012L10.6665 12.3877V13.0944H12.5879V14.0037H13.4605V13.0944H14.0005V12.447H13.4605Z" fill="black"/>
</svg>`;

const _MAT_ASSIGN = `<svg width="17" height="20" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg" fill="#6E6CDF">
  <path d="M1.88889 20C1.36944 20 0.924926 19.8043 0.555333 19.413C0.185741 19.0217 0.00062963 18.5507 0 18V4C0 3.45 0.185111 2.97933 0.555333 2.588C0.925556 2.19667 1.37007 2.00067 1.88889 2H5.85556C6.06018 1.4 6.4027 0.916667 6.88311 0.55C7.36352 0.183333 7.90248 0 8.5 0C9.09752 0 9.6368 0.183333 10.1178 0.55C10.5989 0.916667 10.9411 1.4 11.1444 2H15.1111C15.6306 2 16.0754 2.196 16.4456 2.588C16.8158 2.98 17.0006 3.45067 17 4V18C17 18.55 16.8152 19.021 16.4456 19.413C16.076 19.805 15.6312 20.0007 15.1111 20H1.88889ZM4.72222 16H9.44444C9.71204 16 9.9365 15.904 10.1178 15.712C10.2992 15.52 10.3895 15.2827 10.3889 15C10.3883 14.7173 10.2976 14.48 10.1169 14.288C9.93618 14.096 9.71204 14 9.44444 14H4.72222C4.45463 14 4.23048 14.096 4.04978 14.288C3.86907 14.48 3.77841 14.7173 3.77778 15C3.77715 15.2827 3.86781 15.5203 4.04978 15.713C4.23174 15.9057 4.45589 16.0013 4.72222 16ZM4.72222 12H12.2778C12.5454 12 12.7698 11.904 12.9512 11.712C13.1325 11.52 13.2229 11.2827 13.2222 11C13.2216 10.7173 13.1309 10.48 12.9502 10.288C12.7695 10.096 12.5454 10 12.2778 10H4.72222C4.45463 10 4.23048 10.096 4.04978 10.288C3.86907 10.48 3.77841 10.7173 3.77778 11C3.77715 11.2827 3.86781 11.5203 4.04978 11.713C4.23174 11.9057 4.45589 12.0013 4.72222 12ZM4.72222 8H12.2778C12.5454 8 12.7698 7.904 12.9512 7.712C13.1325 7.52 13.2229 7.28267 13.2222 7C13.2216 6.71733 13.1309 6.48 12.9502 6.288C12.7695 6.096 12.5454 6 12.2778 6H4.72222C4.45463 6 4.23048 6.096 4.04978 6.288C3.86907 6.48 3.77841 6.71733 3.77778 7C3.77715 7.28267 3.86781 7.52033 4.04978 7.713C4.23174 7.90567 4.45589 8.00133 4.72222 8Z"/>
</svg>`;

const _CHEVRON = `<svg class="week-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
  <path d="M7.5 5L12.5 10L7.5 15" stroke="#6E6CDF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const SEMESTER_START = new Date('2026-01-06T00:00:00');

function _getWeekNum(dateStr) {
    const d    = new Date(dateStr);
    const diff = Math.floor((d - SEMESTER_START) / (1000 * 60 * 60 * 24));
    return Math.floor(diff / 7) + 1;
}

const MATERIALS_WEEKS = [
    { num: 1,  range: '6 January \u2013 12 January',    isNow: false, items: [{ type:'pdf', name:'Module_01.pdf' }, { type:'mp4', name:'Module_01.mp4' }] },
    { num: 2,  range: '13 January \u2013 19 January',   isNow: false, items: [{ type:'pdf', name:'Module_02.pdf' }, { type:'mp4', name:'Module_02.mp4' }] },
    { num: 3,  range: '20 January \u2013 26 January',   isNow: false, items: [{ type:'pdf', name:'Module_03.pdf' }, { type:'mp4', name:'Module_03.mp4' }] },
    { num: 4,  range: '27 January \u2013 2 February',   isNow: false, items: [{ type:'pdf', name:'Module_04.pdf' }, { type:'mp4', name:'Module_04.mp4' }] },
    { num: 5,  range: '3 February \u2013 9 February',   isNow: false, items: [{ type:'pdf', name:'Module_05.pdf' }, { type:'mp4', name:'Module_05.mp4' }] },
    { num: 6,  range: '10 February \u2013 16 February', isNow: false, items: [{ type:'pdf', name:'Module_06.pdf' }, { type:'mp4', name:'Module_06.mp4' }] },
    { num: 7,  range: '17 February \u2013 23 February', isNow: false, items: [{ type:'pdf', name:'Module_07.pdf' }, { type:'mp4', name:'Module_07.mp4' }] },
    { num: 8,  range: '24 February \u2013 2 March',     isNow: false, items: [{ type:'pdf', name:'Module_08.pdf' }, { type:'mp4', name:'Module_08.mp4' }] },
    { num: 9,  range: '3 March \u2013 9 March',         isNow: false, items: [{ type:'pdf', name:'Module_09.pdf' }, { type:'mp4', name:'Module_09.mp4' }] },
    { num: 10, range: '10 March \u2013 16 March',       isNow: false, items: [{ type:'pdf', name:'Module_10.pdf' }, { type:'mp4', name:'Module_10.mp4' }] },
    { num: 11, range: '17 March \u2013 23 March',       isNow: false, items: [{ type:'pdf', name:'Module_11.pdf' }, { type:'mp4', name:'Module_11.mp4' }] },
    { num: 12, range: '24 March \u2013 30 March',       isNow: false, items: [{ type:'pdf', name:'Module_12.pdf' }, { type:'mp4', name:'Module_12.mp4' }] },
    { num: 13, range: '31 March \u2013 6 April',        isNow: false, items: [{ type:'pdf', name:'Module_13.pdf' }, { type:'mp4', name:'Module_13.mp4' }] },
    { num: 14, range: '7 April \u2013 13 April',        isNow: false, items: [{ type:'pdf', name:'Module_14.pdf' }, { type:'mp4', name:'Module_14.mp4' }] },
    { num: 15, range: '14 April \u2013 20 April',       isNow: false, items: [{ type:'pdf', name:'Module_15.pdf' }, { type:'mp4', name:'Module_15.mp4' }] },
    { num: 16, range: '21 April \u2013 27 April',       isNow: true,  items: [{ type:'pdf', name:'Module_16.pdf' }, { type:'mp4', name:'Module_16.mp4' }] },
    { num: 17, range: '28 April \u2013 4 May',          isNow: false, items: [] },
];

function _matItemHTML(item) {
    if (item.type === 'pdf') return `<div class="material-item">
        <div class="mat-icon-box">${_MAT_BOOK}</div>
        <div class="mat-chip"><span class="mat-pdf-badge">PDF</span><span class="mat-filename">${item.name}</span></div>
    </div>`;
    if (item.type === 'mp4') return `<div class="material-item">
        <div class="mat-icon-box">${_MAT_VIDEO}</div>
        <div class="mat-chip">${_MAT_MP4_BADGE}<span class="mat-filename">${item.name}</span></div>
    </div>`;
    if (item.type === 'assignment') return `<div class="material-item">
        <div class="mat-icon-box mat-icon-box--assign">${_MAT_ASSIGN}</div>
        <span class="mat-label">${item.name}</span>
    </div>`;
    return '';
}

async function renderMaterials() {
    const container = document.getElementById('materials-list');
    if (!container) return;

    const assignByWeek = {};
    if (courseId) {
        try {
            const res  = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const data = await res.json();
            (data.data || []).forEach(a => {
                const wn = _getWeekNum(a.due_date);
                if (wn >= 1 && wn <= 17) {
                    if (!assignByWeek[wn]) assignByWeek[wn] = [];
                    assignByWeek[wn].push(a);
                }
            });
        } catch (e) {
            console.error('Materials: failed to load assignments', e);
        }
    }

    const generalHTML = `
        <div class="week-section" id="week-general">
            <div class="week-header" onclick="toggleWeek('week-general')">
                ${_CHEVRON}
                <div class="week-info"><span class="week-title">General</span></div>
            </div>
            <div class="week-content"></div>
        </div>`;

    const weeksHTML = MATERIALS_WEEKS.map(w => {
        const apiAssigns = (assignByWeek[w.num] || [])
            .map(a => _matItemHTML({ type: 'assignment', name: a.title })).join('');
        return `
        <div class="week-section${w.isNow ? ' open' : ''}" id="week-${w.num}">
            <div class="week-header" onclick="toggleWeek('week-${w.num}')">
                ${_CHEVRON}
                <div class="week-info">
                    <span class="week-title">Week ${w.num}</span>
                    <span class="week-date">${w.range}</span>
                </div>
                ${w.isNow ? '<span class="week-now-badge">Now</span>' : ''}
            </div>
            <div class="week-content">
                ${w.items.map(_matItemHTML).join('')}${apiAssigns}
            </div>
        </div>`;
    }).join('');

    container.innerHTML = generalHTML + weeksHTML;
}

function toggleWeek(weekId) {
    const section = document.getElementById(weekId);
    if (section) section.classList.toggle('open');
}