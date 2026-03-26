// sidebar
fetch('../components/student-sidebar/sidebar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-sidebar/sidebar.js";
        document.body.appendChild(script);
    });

// navbar
fetch('../components/student-navbar/student-navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-navbar/student-navbar.js";
        document.body.appendChild(script);
    });


// Mock Data
const now = new Date();

function daysFromNow(d, h = 23, m = 59) {
    const t = new Date(now);
    t.setDate(t.getDate() + d);
    t.setHours(h, m, 0, 0);
    return t;
}

const ASSIGNMENTS = [
    // Due Today
    { id: 1, name: 'Lab 1', className: 'CS222', points: 10, due: daysFromNow(0, now.getHours(), now.getMinutes() + 24), status: 'due-today', minutesLeft: 24 },
    { id: 2, name: 'Quiz 1', className: 'CS232', points: 20, due: daysFromNow(0, now.getHours() + 5, now.getMinutes()), status: 'due-today', minutesLeft: 300 },

    // Upcoming
    { id: 3, name: 'Assignment 2', className: 'CS222', points: 10, due: daysFromNow(2), status: 'upcoming' },
    { id: 4, name: 'Assignment Name', className: 'CS232', points: 30, due: daysFromNow(5), status: 'upcoming' },
    { id: 5, name: 'Assignment 3', className: 'CS242', points: 10, due: daysFromNow(7), status: 'upcoming' },

    // Overdue
    { id: 6, name: 'Lab 4', className: 'CS222', points: 5, due: daysFromNow(-3), status: 'overdue' },
    { id: 7, name: 'Lab 5', className: 'CS232', points: 5, due: daysFromNow(-7), status: 'overdue' },
    { id: 8, name: 'Lab 6', className: 'CS242', points: 10, due: daysFromNow(-20), status: 'overdue', submitted: false },

    // Complete
    { id: 9, name: 'Assignment 1', className: 'CS222', points: 10, due: daysFromNow(-10), status: 'complete', submitted: true },
    { id: 10, name: 'Lab 1', className: 'CS232', points: 10, due: daysFromNow(-14), status: 'complete', submitted: true },
    { id: 11, name: 'Assignment Name', className: 'CS252', points: 20, due: daysFromNow(-25), status: 'complete', submitted: true },
    { id: 12, name: 'Assignment Name', className: 'CS232', points: 10, due: daysFromNow(-30), status: 'complete', submitted: true },
];

//State 
let activeTab = 'upcoming';
let activeSort = 'closest';
let searchQuery = '';

const assignList = document.getElementById('assignment-list');
const emptyMsg = document.getElementById('empty-msg');
const searchInput = document.getElementById('search-input');

//update assignment container radius
function updateContainerRadius() {
    const tabs = document.querySelectorAll('.tab-btn');
    const container = document.querySelector('.assignment-container');
    if (!container) return;
    const total = tabs.length;

    tabs.forEach((tab, i) => {
        if (tab.classList.contains('active')) {
            const isFirst = i === 0;
            const isLast = i === total - 1;
            container.style.borderRadius = [
                isFirst ? '0' : '12px',   // top-left
                isLast ? '0' : '12px',   // top-right
                '12px',                      // bottom-right
                '12px'                       // bottom-left
            ].join(' ');
        }
    });
}

function formatDueLabel(a) {
    if (a.status === 'due-today') {
        const mins = a.minutesLeft;
        if (mins < 60) return { text: `Due in ${mins} minutes`, cls: 'due-urgent' };
        return { text: `Due in ${Math.round(mins / 60)} hours`, cls: 'due-urgent' };
    }
    if (a.status === 'overdue') {
        const days = Math.round((now - a.due) / 86400000);
        return { text: `Overdue by ${days} day${days !== 1 ? 's' : ''}`, cls: 'due-urgent' };
    }
    if (a.status === 'upcoming') {
        const days = Math.round((a.due - now) / 86400000);
        if (days <= 0) return { text: 'Due today', cls: 'due-urgent' };
        return { text: `Due in ${days} day${days !== 1 ? 's' : ''}`, cls: 'due-normal' };
    }
    // complete
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return { text: `${a.due.getDate()} ${months[a.due.getMonth()]} ${a.due.getFullYear()}`, cls: 'due-done' };
}

function rightContent(a) {
    if (a.status === 'complete') {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6.36641 12.0001L2.56641 8.20007L3.51641 7.25007L6.36641 10.1001L12.4831 3.9834L13.4331 4.9334L6.36641 12.0001Z" fill="#1ABC14"/>
        </svg>`;
    }
    if (a.status === 'overdue') {
        return `<svg class="ban-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`;
    }
    return `<span class="assign-points-label">${a.points} Point</span>`;
}

// Render 
function render() {
    let list = ASSIGNMENTS.filter(a => a.status === activeTab);
    // Search
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(a =>
            a.name.toLowerCase().includes(q) ||
            a.className.toLowerCase().includes(q)
        );
    }
    // Sort
    list.sort((a, b) =>
        activeSort === 'closest' ? a.due - b.due : b.due - a.due
    );

    assignList.innerHTML = '';

    if (list.length === 0) {
        assignList.innerHTML = `<li class="empty-msg">There are no assignment</li>`;
        return;
    }

    list.forEach(a => {
        const due = formatDueLabel(a);
        const li = document.createElement('li');
        li.className = 'assignment-item';
        li.innerHTML = `
            <div class="assign-avatar">Pic</div>
            <div class="assign-info">
                <p class="assign-name">${a.name}</p>
                <p class="assign-due-label ${due.cls}">${due.text}</p>
                <p class="assign-class">${a.className}</p>
            </div>
            <div class="assign-right">${rightContent(a)}</div>
        `;
        li.addEventListener('click', () => {
            window.location.href = `student-assign-submit.html?id=${a.id}`;
        });
        assignList.appendChild(li);
    });
}

// Tabs 
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.dataset.tab;
        render();
        updateContainerRadius();
    });
});

// Sort
document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeSort = btn.dataset.sort;
        render();
    });
});

// Search
searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    render();
});


render();
updateContainerRadius();
