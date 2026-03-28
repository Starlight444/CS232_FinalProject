document.addEventListener("DOMContentLoaded", function () {
    loadSidebar();
    loadNavbar();
    initTabIndicator();
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

    const activeBtn = nav.querySelector('.tab-btn.active');
    if (activeBtn) moveIndicator(activeBtn, false);

    window.addEventListener('resize', () => {
        const current = nav.querySelector('.tab-btn.active');
        if (current) moveIndicator(current, false);
    });
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
    const allButtons = document.querySelectorAll('.tab-btn');
    const allPanels = document.querySelectorAll('.tab-panel');
    const targetPanel = document.getElementById(tabId);

    allButtons.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');

    moveIndicator(element, true);

    allPanels.forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });

    targetPanel.style.display = 'flex'; 
    setTimeout(() => {
        targetPanel.classList.add('active');
    }, 10);
}

// API
// เปลี่ยน BASE_URL
const API_BASE_URL = 'http://localhost:3000';
// --- [MOCK] ---
// ไม่เรียก Token
// URL ยังไม่มี course_id 

const urlParams = new URLSearchParams(window.location.search);
//MOCK urlParam
const courseId = urlParams.get('course_id')|| 'uuid-001';

document.addEventListener('DOMContentLoaded', () => {
    if (courseId) {
        fetchAssignments(courseId);
    }
});

async function fetchAssignments(courseId) {
    try {
        const resAssignments = await fetch(`${API_BASE_URL}/courses/${courseId}/assignments`);
        const dataAssignments = await resAssignments.json();
        const allTasks = dataAssignments.data || [];

        const tasksWithStatus = await Promise.all(allTasks.map(async (task) => {
            try {
                const resSub = await fetch(`${API_BASE_URL}/assignments/${task.assignment_id}/submission`);
                const dataSub = await resSub.json();

                console.log(`Task: ${task.title}, Status from API:`, dataSub);

                return {
                    ...task,
                    status: (dataSub.data && dataSub.data.status) ? dataSub.data.status : (dataSub.status || null)
                };
            } catch (err) {
                return { ...task, status: null };
            }
        }));

        console.log("Final tasks to render:", tasksWithStatus);
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
        <div class="assignment-card" onclick="window.location.href='../student/student-assign-submit.html?id=${task.assignment_id}'">
            <div class="task-icon">Pic</div>
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


