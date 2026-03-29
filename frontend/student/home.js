const BASE_URL = "http://127.0.0.1:8000";
fetch('/frontend/components/student-sidebar/sidebar.html')
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

// Calendar fix: September 2021 starts on Wednesday (index 3)
// Rebuild calendar correctly
const calGrid = document.querySelector('.cal-grid');
const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
calGrid.innerHTML = '';

// Day name headers
dayNames.forEach(d => {
  const el = document.createElement('div');
  el.className = 'cal-day-name';
  el.textContent = d;
  calGrid.appendChild(el);
});

// Sep 2021 starts on Wednesday = index 3
for (let i = 0; i < 3; i++) {
  const el = document.createElement('div');
  el.className = 'cal-day empty';
  calGrid.appendChild(el);
}

for (let d = 1; d <= 30; d++) {
  const el = document.createElement('div');
  el.className = 'cal-day';
  if (d === 19) el.classList.add('today');
  el.textContent = d;
  calGrid.appendChild(el);
}

// Nav highlight
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});
async function loadHomeData() {
  // 1. ดึง user จาก localStorage
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;

  // แสดงชื่อ
  document.querySelector('.welcome').textContent = `Welcome, ${user.first_name}`;

  // 2. ดึง courses ของ user
  const courseRes = await fetch(`${BASE_URL}/courses/my/${user.user_id}?role=${user.role}`);
  const courseJson = await courseRes.json();
  const courses = courseJson.data;
  if (!courses || courses.length === 0) return;

  // 3. ดึง assignments และ announcements จากทุก course
  let allAssignments = [];
  let allAnnouncements = [];

  for (const course of courses) {
    const [asgRes, annRes] = await Promise.all([
      fetch(`${BASE_URL}/assignments/${course.course_id}`),
      fetch(`${BASE_URL}/announcements/course/${course.course_id}`)
    ]);
    const asgJson = await asgRes.json();
    const annJson = await annRes.json();

    if (asgJson.data) allAssignments.push(...asgJson.data);
    if (annJson.data) allAnnouncements.push(...annJson.data);
  }

  // 4. แสดงผล
  renderStats(allAssignments);
  renderAssignments(allAssignments);
  renderAnnouncements(allAnnouncements);
}

function renderStats(assignments) {
  const now = new Date();
  const today = now.toDateString();

  let dueToday = 0, upcoming = 0, overdue = 0, complete = 0;

  assignments.forEach(a => {
    const due = new Date(a.due_date);
    if (a.status === 'submitted') {
      complete++;
    } else if (due.toDateString() === today) {
      dueToday++;
    } else if (due < now) {
      overdue++;
    } else {
      upcoming++;
    }
  });

  document.querySelector('.due-today .stat-num').textContent = dueToday;
  document.querySelector('.active-stat .stat-num').textContent = upcoming;
  document.querySelector('.overdue .stat-num').textContent = overdue;
  document.querySelector('.complete .stat-num').textContent = complete;
}

function renderAssignments(assignments) {
  const list = document.querySelector('.assign-list');
  list.innerHTML = '';
  const now = new Date();

  // เอาแค่ที่ยังไม่ submit และเรียงตาม due_date
  const pending = assignments
    .filter(a => a.status !== 'submitted')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  if (pending.length === 0) {
    list.innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No upcoming assignments</p>';
    return;
  }

  pending.forEach(a => {
    const due = new Date(a.due_date);
    const diff = due - now;
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const mins = Math.floor(diff / 1000 / 60);

    let dueText = '';
    let dueClass = 'gray';

    if (diff < 0) {
      dueText = 'Overdue';
      dueClass = 'red';
    } else if (mins < 60) {
      dueText = `Due in ${mins} minutes`;
      dueClass = 'red';
    } else if (hours < 24) {
      dueText = `Due in ${hours} hours`;
      dueClass = 'red';
    } else {
      dueText = `Due in ${Math.floor(hours / 24)} days`;
      dueClass = 'gray';
    }

    list.innerHTML += `
      <div class="assign-item">
        <div class="assign-avatar">Pic</div>
        <div class="assign-info">
          <div class="assign-name">${a.title}</div>
          <div class="assign-due ${dueClass}">${dueText}</div>
          <div class="assign-class">${a.course_id}</div>
        </div>
        <div class="assign-points">${a.max_score} Point</div>
      </div>`;
  });
}

function renderAnnouncements(announcements) {
  const container = document.querySelector('.ann-card');
  const title = container.querySelector('.ann-title');
  container.innerHTML = '';
  container.appendChild(title);

  if (announcements.length === 0) {
    container.innerHTML += '<p style="color:#888;font-size:13px;">No announcements</p>';
    return;
  }

  announcements.slice(0, 5).forEach(a => {
    const timeAgo = getTimeAgo(new Date(a.created_at));
    container.innerHTML += `
      <div class="ann-item">
        <div class="ann-item-title">${a.title}</div>
        <div class="ann-item-body">${a.content}</div>
        <div class="ann-item-time">${timeAgo}</div>
      </div>`;
  });
}

function getTimeAgo(date) {
  const diff = new Date() - date;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins} minutes ago`;
  if (hours < 24) return `${hours} hours ago`;
  return `${days} days ago`;
}

// เรียกใช้ตอนหน้าโหลด
loadHomeData();