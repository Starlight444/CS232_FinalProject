document.addEventListener("DOMContentLoaded", function () {
    loadSidebar();
    loadNavbar();
    initTabIndicator();
    fetchMembers(courseId);
});

function loadSidebar() {
    fetch('../components/student-sidebar/sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
            const script = document.createElement('script');
            script.src = '../components/student-sidebar/sidebar.js';
            document.body.appendChild(script);
        })
        .catch(err => console.error("Error loading sidebar:", err));
}

function loadNavbar() {
    fetch('../components/student-navbar/student-navbar.html')
        .then(response => response.text())
        .then(data => {
            const container = document.getElementById('student-navbar-container') || document.getElementById('student-container');
            if (container) {
                container.innerHTML = data; 
            }
            const script = document.createElement('script');
            script.src = '../components/student-navbar/student-navbar.js';
            document.body.appendChild(script);
        })
        .catch(err => console.error("Error loading navbar:", err));
}

/* ============================================================
   Sliding Tab Indicator
   ============================================================ */
function initTabIndicator() {
    const nav = document.getElementById('tab-nav');
    const indicator = document.getElementById('tab-indicator');
    if (!nav || !indicator) return;

    const allButtons = Array.from(nav.querySelectorAll('.tab-btn'));
    const activeBtn = nav.querySelector('.tab-btn.active');
    if (activeBtn) {
        moveIndicator(activeBtn, false);
        const contentBody = document.querySelector('.tab-content-body');
        const idx = allButtons.indexOf(activeBtn);
        if (contentBody) {
            contentBody.classList.toggle('first-tab-active', idx === 0);
            contentBody.classList.toggle('last-tab-active', idx === allButtons.length - 1);
        }
    }

    window.addEventListener('resize', () => {
        const current = nav.querySelector('.tab-btn.active');
        if (current) moveIndicator(current, false);
    });

    const main = document.querySelector('.main');
    if (main) {
        main.addEventListener('transitionend', (e) => {
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

    const nav = document.getElementById('tab-nav');
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const left = btnRect.left - navRect.left;
    const width = btnRect.width;

    if (!animate) {
        indicator.style.transition = 'none';
        indicator.getBoundingClientRect();
    } else {
        indicator.style.transition = 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    indicator.style.left = left + 'px';
    indicator.style.width = width + 'px';
}

/* ============================================================
   Switch Tab
   ============================================================ */
function switchTab(element, tabId) {
    const allButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const allPanels = document.querySelectorAll('.tab-panel');
    const targetPanel = document.getElementById(tabId);
    const contentBody = document.querySelector('.tab-content-body');

    allButtons.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');

    moveIndicator(element, true);

    allPanels.forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });

    // Flush corners for first/last tab
    const idx = allButtons.indexOf(element);
    contentBody.classList.toggle('first-tab-active', idx === 0);
    contentBody.classList.toggle('last-tab-active', idx === allButtons.length - 1);

    targetPanel.style.display = 'flex';
    setTimeout(() => {
        targetPanel.classList.add('active');
    }, 10);
}

// API
const API_BASE_URL = 'http://127.0.0.1:8000';

const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.token) {
    window.location.href = "../auth/login.html";
}
const TOKEN   = userData ? userData.token   : '';
const USER_ID = userData ? userData.user_id : '';

const urlParams = new URLSearchParams(window.location.search);
const courseId = urlParams.get('course_id') || urlParams.get('id');

document.addEventListener('DOMContentLoaded', () => {
    if (courseId) {
        fetchAssignments(courseId);
        fetchAnnouncements(courseId);
    }
    renderMaterials();

    // Sync button — เรียก scraper backend แล้วโหลด assignments + announcements ใหม่
    // TODO: confirm endpoint/method กับ backend ใน scraper-merge.js
    window.ScraperMerge?.bindSyncButton(
        document.getElementById('sync-btn'),
        API_BASE_URL,
        TOKEN,
        async () => {
            if (!courseId) return;
            await Promise.all([
                fetchAssignments(courseId),
                fetchAnnouncements(courseId),
            ]);
        }
    );
});

async function fetchAssignments(courseId) {
    try {
        // fetch for course code
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        const resCourse = await fetch(`${API_BASE_URL}/courses/my/${user.user_id}?role=${user.role}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const courseData = await resCourse.json();
        const courses = courseData;
        const course = courses.find(c => String(c.course_id) === String(courseId));
        const courseCode = course?.course_code || "N/A";

        // ใช้ merged endpoint รวม internal + external
        // TODO: รอ backend confirm /assignments/merged/:course_id
        let merged = [];
        if (window.ScraperMerge) {
            merged = await window.ScraperMerge.fetchMergedAssignments(
                API_BASE_URL, courseId, TOKEN, course || {}
            );
        }

        // Fallback: ใช้ internal endpoint เดิมถ้า merged ยังไม่พร้อม
        // TODO: ลบ block fallback นี้เมื่อ merged endpoint ใช้งานได้จริง
        if (!merged.length) {
            const resAssignments = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const dataAssignments = await resAssignments.json();
            const allTasks = dataAssignments.data || [];
            merged = allTasks.map(t => window.ScraperMerge.normalizeAssignment(
                { ...t, source: 'internal' },
                course || {}
            ));
        }

        // ดึง submission status เฉพาะ internal
        const tasksWithStatus = await Promise.all(merged.map(async (m) => {
            const base = {
                // คงรูปแบบเดิมที่ renderAssignments ต้องการ
                assignment_id: m.id,
                title: m.title,
                due_date: m.due_date,
                max_score: m.max_score,
                course_code: m.course_code || courseCode,
                // ฟิลด์เพิ่มสำหรับ external
                isExternal: m.isExternal,
                external_url: m.external_url,
                source: m.source,
            };
            if (m.isExternal) return { ...base, status: null };
            try {
                const resSub = await fetch(
                    `${API_BASE_URL}/submissions/assignment/${m.id}/student/${USER_ID}`,
                    { headers: { 'Authorization': `Bearer ${TOKEN}` } }
                );
                const dataSub = await resSub.json();
                return {
                    ...base,
                    status: (dataSub.data && dataSub.data.status) ? dataSub.data.status : (dataSub.status || null)
                };
            } catch {
                return { ...base, status: null };
            }
        }));

        const countEl = document.getElementById('assignment-count');
        if (countEl) countEl.textContent = tasksWithStatus.length;
        renderAssignments(tasksWithStatus);
    } catch (error) {
        console.error('Error:', error);
    }
}

function renderAssignments(tasks) {
    const now = new Date();
    const lists = {
        today: document.getElementById('list-today'),
        overdue: document.getElementById('list-overdue'),
        upcoming: document.getElementById('list-upcoming'),
        complete: document.getElementById('list-complete')
    };

    Object.values(lists).forEach(el => el.innerHTML = '');

    tasks.forEach(task => {
        const dueDate = new Date(task.due_date);
        const isSubmitted = task.status === 'submitted'; 
        
        const cardHTML = createCardHTML(task);

        if (isSubmitted) {
            // 1. ถ้าส่งแล้ว -> Complete (ไม่สนใจวันที่) 
            lists.complete.innerHTML += cardHTML;
        } else if (dueDate < now && dueDate.toDateString() !== now.toDateString()) {
            // 2. ถ้ายังไม่ส่ง และเลยกำหนดแล้ว -> Overdue 
            lists.overdue.innerHTML += cardHTML;
        } else if (dueDate.toDateString() === now.toDateString()) {
            // 3. ถ้ายังไม่ส่ง และเป็นวันนี้ -> Due Today 
            lists.today.innerHTML += cardHTML;
        } else {
            // 4. ถ้ายังไม่ส่ง และยังไม่ถึงกำหนด -> Upcoming 
            lists.upcoming.innerHTML += cardHTML;
        }
    });

    checkEmptyStates();
}

// fetch course members
async function fetchMembers(courseId) {
    const container = document.getElementById('people'); // must have this div in HTML

    try {
        const res = await fetch(`${API_BASE_URL}/members/${courseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await res.json();
        const members = data.data || data; // กันได้ทั้งแบบมี data / ไม่มี

        if (!members || members.length === 0) {
            container.innerHTML = `<div class="empty-state">No members</div>`;
            return;
        }

        await renderMembers(members);

    } catch (err) {
        console.error("Error fetching members:", err);
        container.innerHTML = `<div class="empty-state">Failed to load members</div>`;
    }
}

async function renderMembers(members) {
    const container = document.getElementById('member-list');
    if (!container) return;

    const cards = await Promise.all(members.map(async (m) => {
        try {
            const res = await fetch(`${API_BASE_URL}/users/${m.user_id}`, {
                headers: {
                    'Authorization': `Bearer ${TOKEN}`
                }
            });

            const userData = await res.json();

            const name = userData.data?.full_name 
                || `${userData.data?.first_name || ''} ${userData.data?.last_name || ''}`.trim()
                || "Unknown";

            const initial = name.charAt(0).toUpperCase();

            return {
                role: m.role,
                html: `
                    <div class="member-card ${m.role}">
                        <div class="member-avatar">${initial}</div>
                        <div class="member-info">
                            <div class="member-name">${name}</div>
                            <div class="member-role">${m.role}</div>
                        </div>
                    </div>
                `
            };
        } catch (err) {
            return {
                role: m.role,
                html: `
                    <div class="member-card ${m.role}">
                        <div class="member-avatar">U</div>
                        <div class="member-info">
                            <div class="member-name">Unknown</div>
                            <div class="member-role">${m.role}</div>
                        </div>
                    </div>
                `
            };
        }
    }));

    // Map role
    const teachers = cards.filter(c => c.role === 'teacher');
    const students = cards.filter(c => c.role === 'student');

    // render as sections
    container.innerHTML = `
        <div class="member-section">
            <div class="member-section-title"><iconify-icon icon="ph:chalkboard-teacher-bold"></iconify-icon> Teacher</div>
            <div class="member-list">
                ${teachers.map(c => c.html).join('')}
            </div>
        </div>

        <div class="member-section">
            <div class="member-section-title"><iconify-icon icon="ph:student-bold"></iconify-icon> Students</div>
            <div class="member-list">
                ${students.map(c => c.html).join('')}
            </div>
        </div>
    `;
}

function checkEmptyStates() {
    const groups = ['today', 'overdue', 'upcoming', 'complete'];
    groups.forEach(id => {
        const list = document.getElementById(`list-${id}`);
        const groupWrapper = document.getElementById(`group-${id}`);
        if (list.innerHTML === '') {
            list.innerHTML = `<div class="empty-state">No ${id} assignments.</div>`;
        }
    });
}

function getRelativeTime(dueDate, isSubmitted) {
    if (isSubmitted) return "Submitted";

    const now = new Date();
    const diffInMs = dueDate - now;
    
    
    const diffInMin = Math.floor(diffInMs / (1000 * 60));
    const diffInHrs = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    // 1. ถ้าเลยกำหนด (Past)
    if (diffInMs < 0) {
        const absDays = Math.abs(diffInDays);
        if (absDays === 0) return "Past due today";
        return `${absDays} day${absDays > 1 ? 's' : ''} past`;
    }

    // 2. ถ้าเป็นวันนี้ (Today)
    if (dueDate.toDateString() === now.toDateString()) {
        if (diffInHrs > 0) return `Due in ${diffInHrs} hr${diffInHrs > 1 ? 's' : ''}`;
        return `Due in ${diffInMin} min${diffInMin > 1 ? 's' : ''}`;
    }

    // 3. ถ้ามากกว่า 31 วัน (Months)
    if (diffInDays > 31) {
        const months = Math.floor(diffInDays / 30);
        return `Due in ${months} month${months > 1 ? 's' : ''}`;
    }

    // 4. ทั่วไป (Days)
    return `Due in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
}

const ACCENT_COLORS = ['#E53935', '#F9A825', '#6D4C41', '#1565C0', '#2E7D32', '#6A1B9A'];

function getTimeAgo(dateStr) {
    const diffMs = new Date() - new Date(dateStr);
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return 'Now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

async function fetchAnnouncements(courseId) {
    const container = document.getElementById('announcement-list');

    try {
        // ใช้ merged endpoint รวม internal + external
        // TODO: รอ backend confirm /announcements/merged/:course_id
        let announcements = [];
        if (window.ScraperMerge) {
            announcements = await window.ScraperMerge.fetchMergedAnnouncements(
                API_BASE_URL, courseId, TOKEN, {}
            );
        }

        // Fallback: ใช้ internal endpoint เดิมถ้า merged ยังไม่พร้อม
        // TODO: ลบ block fallback นี้เมื่อ merged พร้อมจริง
        if (!announcements.length) {
            const res = await fetch(`${API_BASE_URL}/announcements/course/${courseId}`, {
                headers: { 'Authorization': `Bearer ${TOKEN}` }
            });
            const data = await res.json();
            announcements = (data.data || []).map(a =>
                window.ScraperMerge.normalizeAnnouncement({ ...a, source: 'internal' }, {})
            );
        }

        if (announcements.length === 0) {
            container.innerHTML = `<div class="empty-state">No announcements yet.</div>`;
            return;
        }

        // เรียงประกาศล่าสุดไว้บนสุด
        announcements = announcements.sort((a, b) => {
            return new Date(b.created_at) - new Date(a.created_at);
        });

        const personIcon = `
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="50" height="50" rx="25" fill="#E6E6E6"/>
                <path d="M24.9997 21.6666C28.6816 21.6666 31.6663 18.6818 31.6663 14.9999C31.6663 11.318 28.6816 8.33325 24.9997 8.33325C21.3178 8.33325 18.333 11.318 18.333 14.9999C18.333 18.6818 21.3178 21.6666 24.9997 21.6666Z" fill="black"/>
                <path d="M38.3337 34.1667C38.3337 38.3084 38.3337 41.6667 25.0003 41.6667C11.667 41.6667 11.667 38.3084 11.667 34.1667C11.667 30.0251 17.637 26.6667 25.0003 26.6667C32.3637 26.6667 38.3337 30.0251 38.3337 34.1667Z" fill="black"/>
            </svg>
        `;

        container.innerHTML = announcements.map((a, index) => {
            // ให้ NEW เฉพาะประกาศล่าสุดอันเดียวเท่านั้น
            const isLatest = index === 0;
            const timeAgo = getTimeAgo(a.created_at);

            // External announcement -> เปิด link ภายนอกเมื่อคลิก
            const isExternal = !!a.isExternal;
            const externalUrl = a.external_url || '';
            const cardOnclick = isExternal && externalUrl
                ? `onclick="window.open('${externalUrl}','_blank','noopener,noreferrer')" style="cursor:pointer;"`
                : '';
            const externalBadge = isExternal
                ? `<span class="ext-badge" title="From external source">
                       <iconify-icon icon="ph:link-bold" width="12" height="12"></iconify-icon> External
                   </span>`
                : '';

            return `
                <div class="announcement-card${isExternal ? ' is-external' : ''}" ${cardOnclick}>
                    <div class="announcement-content-area">
                        <div class="announcement-icon">${personIcon}</div>

                        <div class="announcement-card-info">
                            <div class="announcement-title-row">
                                <span class="announcement-course">${a.title} ${externalBadge}</span>
                                ${isLatest ? '<span class="announcement-new-badge">NEW</span>' : ''}
                            </div>

                            <p class="announcement-body">${a.content}</p>
                            <span class="announcement-time">${timeAgo}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Error fetching announcements:', err);
        container.innerHTML = `<div class="empty-state">Failed to load announcements.</div>`;
    }
}

/* ============================================================
   Materials Tab — Mock Data & Render
   ============================================================ */

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

const _MAT_LAB = `<svg xmlns="http://www.w3.org/2000/svg" width="21" height="17" viewBox="0 0 21 17" fill="none">
  <path d="M2.08333 16.6667C1.51042 16.6667 1.02014 16.4628 0.6125 16.0552C0.204861 15.6476 0.000694444 15.1569 0 14.5833V2.08333C0 1.51042 0.204167 1.02014 0.6125 0.6125C1.02083 0.204861 1.51111 0.000694444 2.08333 0H13.5417C13.8715 0 14.184 0.0739581 14.4792 0.221875C14.7743 0.369791 15.0174 0.573611 15.2083 0.833333L19.8958 7.08333C20.1736 7.44792 20.3125 7.86458 20.3125 8.33333C20.3125 8.80208 20.1736 9.21875 19.8958 9.58333L15.2083 15.8333C15.0174 16.0938 14.7743 16.2979 14.4792 16.4458C14.184 16.5938 13.8715 16.6674 13.5417 16.6667H2.08333Z" fill="white"/>
  <path d="M2.08333 16.6667C1.51042 16.6667 1.02014 16.4628 0.6125 16.0552C0.204861 15.6476 0.000694444 15.1569 0 14.5833V2.08333C0 1.51042 0.204167 1.02014 0.6125 0.6125C1.02083 0.204861 1.51111 0.000694444 2.08333 0H13.5417C13.8715 0 14.184 0.0739581 14.4792 0.221875C14.7743 0.369791 15.0174 0.573611 15.2083 0.833333L19.8958 7.08333C20.1736 7.44792 20.3125 7.86458 20.3125 8.33333C20.3125 8.80208 20.1736 9.21875 19.8958 9.58333L15.2083 15.8333C15.0174 16.0938 14.7743 16.2979 14.4792 16.4458C14.184 16.5938 13.8715 16.6674 13.5417 16.6667H2.08333Z" fill="#6E6CDF" fill-opacity="0.5"/>
</svg>`;

const _MAT_ASSIGN = `<svg width="17" height="20" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg" fill="#6E6CDF">
  <path d="M1.88889 20C1.36944 20 0.924926 19.8043 0.555333 19.413C0.185741 19.0217 0.00062963 18.5507 0 18V4C0 3.45 0.185111 2.97933 0.555333 2.588C0.925556 2.19667 1.37007 2.00067 1.88889 2H5.85556C6.06018 1.4 6.4027 0.916667 6.88311 0.55C7.36352 0.183333 7.90248 0 8.5 0C9.09752 0 9.6368 0.183333 10.1178 0.55C10.5989 0.916667 10.9411 1.4 11.1444 2H15.1111C15.6306 2 16.0754 2.196 16.4456 2.588C16.8158 2.98 17.0006 3.45067 17 4V18C17 18.55 16.8152 19.021 16.4456 19.413C16.076 19.805 15.6312 20.0007 15.1111 20H1.88889ZM4.72222 16H9.44444C9.71204 16 9.9365 15.904 10.1178 15.712C10.2992 15.52 10.3895 15.2827 10.3889 15C10.3883 14.7173 10.2976 14.48 10.1169 14.288C9.93618 14.096 9.71204 14 9.44444 14H4.72222C4.45463 14 4.23048 14.096 4.04978 14.288C3.86907 14.48 3.77841 14.7173 3.77778 15C3.77715 15.2827 3.86781 15.5203 4.04978 15.713C4.23174 15.9057 4.45589 16.0013 4.72222 16ZM4.72222 12H12.2778C12.5454 12 12.7698 11.904 12.9512 11.712C13.1325 11.52 13.2229 11.2827 13.2222 11C13.2216 10.7173 13.1309 10.48 12.9502 10.288C12.7695 10.096 12.5454 10 12.2778 10H4.72222C4.45463 10 4.23048 10.096 4.04978 10.288C3.86907 10.48 3.77841 10.7173 3.77778 11C3.77715 11.2827 3.86781 11.5203 4.04978 11.713C4.23174 11.9057 4.45589 12.0013 4.72222 12ZM4.72222 8H12.2778C12.5454 8 12.7698 7.904 12.9512 7.712C13.1325 7.52 13.2229 7.28267 13.2222 7C13.2216 6.71733 13.1309 6.48 12.9502 6.288C12.7695 6.096 12.5454 6 12.2778 6H4.72222C4.45463 6 4.23048 6.096 4.04978 6.288C3.86907 6.48 3.77841 6.71733 3.77778 7C3.77715 7.28267 3.86781 7.52033 4.04978 7.713C4.23174 7.90567 4.45589 8.00133 4.72222 8Z"/>
</svg>`;

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

const SEMESTER_START = new Date('2026-01-06T00:00:00');

function _getWeekNum(dateStr) {
    const d = new Date(dateStr);
    const diff = Math.floor((d - SEMESTER_START) / (1000 * 60 * 60 * 24));
    return Math.floor(diff / 7) + 1;
}

const _CHEVRON = `<svg class="week-chevron" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7.5 5L12.5 10L7.5 15" stroke="#6E6CDF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

function _matItemHTML(item) {
    if (item.type === 'pdf') {
        return `<div class="material-item">
            <div class="mat-icon-box">${_MAT_BOOK}</div>
            <div class="mat-chip">
                <span class="mat-pdf-badge">PDF</span>
                <span class="mat-filename">${item.name}</span>
            </div>
        </div>`;
    }
    if (item.type === 'mp4') {
        return `<div class="material-item">
            <div class="mat-icon-box">${_MAT_VIDEO}</div>
            <div class="mat-chip">
                ${_MAT_MP4_BADGE}
                <span class="mat-filename">${item.name}</span>
            </div>
        </div>`;
    }
    if (item.type === 'assignment') {
        return `<div class="material-item">
            <div class="mat-icon-box mat-icon-box--assign">${_MAT_ASSIGN}</div>
            <span class="mat-label">${item.name}</span>
        </div>`;
    }
    return '';
}

async function renderMaterials() {
    const container = document.getElementById('materials-list');
    if (!container) return;

    // Map assignments from API to weeks by due_date
    const assignByWeek = {};
    if (courseId) {
        try {
            const res = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
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
                <div class="week-info">
                    <span class="week-title">General</span>
                </div>
            </div>
            <div class="week-content"></div>
        </div>`;

    const weeksHTML = MATERIALS_WEEKS.map(w => {
        const apiAssigns = (assignByWeek[w.num] || []).map(a =>
            _matItemHTML({ type: 'assignment', name: a.title })
        ).join('');
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

function createCardHTML(task) {
    const dueDate = new Date(task.due_date);
    const isSubmitted = task.status === 'submitted';
    const isPast = dueDate < new Date() && !isSubmitted;
    
    const relativeStatus = getRelativeTime(dueDate, isSubmitted);
    
    const fullDeadline = dueDate.toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    // External assignment (จาก scraper) -> เปิด external_url แทนหน้า submit
    const isExternal = !!task.isExternal;
    const externalUrl = task.external_url || '';
    const onclickAction = isExternal && externalUrl
        ? `window.open('${externalUrl}','_blank','noopener,noreferrer')`
        : `window.location.href='../student/student-assign-submit.html?id=${task.assignment_id}&course_id=${courseId}'`;
    const externalBadge = isExternal
        ? `<span class="ext-badge" title="From external source">
               <iconify-icon icon="ph:link-bold" width="12" height="12"></iconify-icon> External
           </span>`
        : '';

    return `
        <div class="assignment-card${isExternal ? ' is-external' : ''}" onclick="${onclickAction}">
            <div class="task-icon">${task.course_code}</div>
            <div class="task-details">
                <span class="task-name">${task.title} ${externalBadge}</span> 
                <span class="task-status ${isPast ? 'status-past' : ''} ${isSubmitted ? 'status-complete' : ''}">
                    ${relativeStatus}
                </span> 
                <span class="task-deadline-full">Deadline: ${fullDeadline}</span> 
            </div>
            <div class="task-points">${task.max_score || 0} pts</div> 
        </div>
    `;
}


