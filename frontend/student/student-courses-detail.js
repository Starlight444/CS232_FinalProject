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
});

async function fetchAssignments(courseId) {
    try {
        const resAssignments = await fetch(`${API_BASE_URL}/assignments/${courseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const dataAssignments = await resAssignments.json();

        // fetch for course code
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        const resCourse = await fetch(`${API_BASE_URL}/courses/my/${user.user_id}?role=${user.role}`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });
        const courseData = await resCourse.json();
        
        const courses = courseData;
        const course = courses.find(c => String(c.course_id) === String(courseId));
        const courseCode = course?.course_code || "N/A";

        console.log("courseCode:", courseCode);

        const allTasks = dataAssignments.data || [];

        const tasksWithStatus = await Promise.all(allTasks.map(async (task) => {
            try {
                const resSub = await fetch(`${API_BASE_URL}/submissions/assignment/${task.assignment_id}/student/${USER_ID}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                });
                const dataSub = await resSub.json();

                console.log(`Task: ${task.title}, Status from API:`, dataSub);

                return {
                    ...task,
                    course_code: courseCode,
                    status: (dataSub.data && dataSub.data.status) ? dataSub.data.status : (dataSub.status || null)
                };
            } catch (err) {
                return { ...task, course_code: courseCode, status: null };
            }
        }));

        console.log("Final tasks to render:", tasksWithStatus);
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
    const container = document.getElementById('people'); // 🔥 ต้องมี div นี้ใน HTML

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

        renderMembers(members);

    } catch (err) {
        console.error("Error fetching members:", err);
        container.innerHTML = `<div class="empty-state">Failed to load members</div>`;
    }
}

function renderMembers(members) {
    const container = document.getElementById('member-list');

    container.innerHTML = members.map(m => {
        const name = m.full_name || m.name || "Unknown";
        const initial = name.charAt(0).toUpperCase();

        return `
            <div class="member-item">
                <div class="member-avatar">${initial}</div>
                <div class="member-name">${name}</div>
            </div>
        `;
    }).join('');
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
        const res = await fetch(`${API_BASE_URL}/announcements/course/${courseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        const announcements = data.data || [];

        if (announcements.length === 0) {
            container.innerHTML = `<div class="empty-state">No announcements yet.</div>`;
            return;
        }

        const personIcon = `<svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="50" height="50" rx="25" fill="#E6E6E6"/><path d="M24.9997 21.6666C28.6816 21.6666 31.6663 18.6818 31.6663 14.9999C31.6663 11.318 28.6816 8.33325 24.9997 8.33325C21.3178 8.33325 18.333 11.318 18.333 14.9999C18.333 18.6818 21.3178 21.6666 24.9997 21.6666Z" fill="black"/><path d="M38.3337 34.1667C38.3337 38.3084 38.3337 41.6667 25.0003 41.6667C11.667 41.6667 11.667 38.3084 11.667 34.1667C11.667 30.0251 17.637 26.6667 25.0003 26.6667C32.3637 26.6667 38.3337 30.0251 38.3337 34.1667Z" fill="black"/></svg>`;

        container.innerHTML = announcements.map((a) => {
            const isNew = (new Date() - new Date(a.created_at)) < 86400000;
            const timeAgo = getTimeAgo(a.created_at);
            return `
                <div class="announcement-card">
                    <div class="announcement-content-area">
                        <div class="announcement-icon">${personIcon}</div>
                        <div class="announcement-card-info">
                            <div class="announcement-title-row">
                                <span class="announcement-course">${a.title}</span>
                                ${isNew ? '<span class="announcement-new-badge">New</span>' : ''}
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

    return `
        <div class="assignment-card" onclick="window.location.href='../student/student-assign-submit.html?id=${task.assignment_id}&course_id=${courseId}'">
            <div class="task-icon">${task.course_code}</div>
            <div class="task-details">
                <span class="task-name">${task.title}</span> 
                <span class="task-status ${isPast ? 'status-past' : ''} ${isSubmitted ? 'status-complete' : ''}">
                    ${relativeStatus}
                </span> 
                <span class="task-deadline-full">Deadline: ${fullDeadline}</span> 
            </div>
            <div class="task-points">${task.max_score || 0} pts</div> 
        </div>
    `;
}


