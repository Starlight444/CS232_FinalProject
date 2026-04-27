const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.token) {
  window.location.href = "../auth/login.html";
}
const TOKEN = userData ? userData.token : '';
const USER_ID = userData ? userData.user_id : '';

document.addEventListener("DOMContentLoaded", function () {
  loadTeacherSidebarNavbar();
});

function loadTeacherSidebarNavbar() {
  fetch('../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
    .then(r => r.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const container = document.getElementById('teacher-sidebar-navbar-container');

      const sidebar = doc.querySelector('#sidebar');
      const navbar = doc.querySelector('.navbar');
      if (sidebar) container.appendChild(sidebar);
      if (navbar) container.appendChild(navbar);

      const sidebarScript = document.createElement('script');
      sidebarScript.src = '../components/teacher-sidebar-navbar/teacher-sidebar.js';
      document.body.appendChild(sidebarScript);

      const navbarScript = document.createElement('script');
      navbarScript.src = '../components/teacher-sidebar-navbar/teacher-navbar.js';
      document.body.appendChild(navbarScript);

      sidebarScript.onload = () => {
        const sidebarEl = document.getElementById('sidebar');
        if (sidebarEl) {
          new MutationObserver(() => {
            const collapsed = sidebarEl.classList.contains('collapsed');
            document.body.classList.toggle('sidebar-collapsed', collapsed);
            setBottomColumns();
          }).observe(sidebarEl, { attributes: true, attributeFilter: ['class'] });
        }
      };
    })
    .catch(err => console.error("Error loading teacher sidebar/navbar:", err));
}

window.addEventListener('resize', setBottomColumns);

// ── Calendar ──
let currentViewDate = new Date();

function renderCalendar() {
  const titleEl = document.getElementById('cui-monthYear');
  const gridEl = document.getElementById('cui-weekGrid');
  const today = new Date();

  titleEl.innerText = currentViewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  const startOfWeek = new Date(currentViewDate);
  startOfWeek.setDate(currentViewDate.getDate() - currentViewDate.getDay());

  const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  gridEl.innerHTML = '';

  for (let i = 0; i < 7; i++) {
    const tempDate = new Date(startOfWeek);
    tempDate.setDate(startOfWeek.getDate() + i);
    const isToday = tempDate.toDateString() === today.toDateString();

    const dayCol = document.createElement('div');
    dayCol.className = `calendar-ui__day-col ${isToday ? 'calendar-ui__day-col--active' : ''}`;
    dayCol.innerHTML = `
      <span class="calendar-ui__day-name">${days[i]}</span>
      <div class="calendar-ui__date-num">${tempDate.getDate()}</div>
    `;
    gridEl.appendChild(dayCol);
  }
}

function changeWeek(days) {
  currentViewDate.setDate(currentViewDate.getDate() + days);
  renderCalendar();
}

renderCalendar();

// ── API ──
const API_BASE_URL = 'https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com';

// --- Dashboard Summary ---
async function updateDashboardSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`);
    const courses = await response.json();

    const safeCourses = Array.isArray(courses) ? courses : [];

    const totalCoursesEl = document.getElementById('total-courses-count');
    if (totalCoursesEl) totalCoursesEl.innerText = safeCourses.length;

    let grandTotalSubmitted = 0;
    let grandTotalStudents = 0;
    let totalMissing = 0;
    let coursesWithMissingCount = 0;

    safeCourses.forEach(course => {
      const stdInCourse = course.total_std || 0;
      const submittedInCourse = course.total_submitted_student || 0;
      const missingInCourse = Math.max(0, stdInCourse - submittedInCourse);

      grandTotalSubmitted += submittedInCourse;
      grandTotalStudents += stdInCourse;

      if (missingInCourse > 0) {
        totalMissing += missingInCourse;
        coursesWithMissingCount++;
      }
    });

    const toGradePct = grandTotalStudents > 0
      ? Math.round((grandTotalSubmitted / grandTotalStudents) * 100)
      : 0;

    const toGradeCount = document.getElementById('to-grade-count');
    if (toGradeCount) toGradeCount.innerText = grandTotalSubmitted;

    const gradingProgressBar = document.getElementById('grading-progress-bar');
    if (gradingProgressBar) gradingProgressBar.style.width = `${toGradePct}%`;

    const gradingPercentage = document.getElementById('grading-percentage');
    if (gradingPercentage) gradingPercentage.innerText = `${toGradePct}%`;

    const courseCountLabel = document.getElementById('course-count-label');
    if (courseCountLabel) courseCountLabel.innerText = `From ${safeCourses.length} courses`;

    const missingCountEl = document.getElementById('missing-count');
    if (missingCountEl) missingCountEl.innerText = totalMissing;

    const missingPct = grandTotalStudents > 0
      ? Math.round((totalMissing / grandTotalStudents) * 100)
      : 0;

    const missingBar = document.getElementById('missing-progress-bar');
    if (missingBar) missingBar.style.width = `${missingPct}%`;

    const missingPctText = document.getElementById('missing-percentage');
    if (missingPctText) missingPctText.innerText = `${missingPct}%`;

    const missingLabel = document.getElementById('missing-courses-label');
    if (missingLabel) {
      missingLabel.innerText = `From ${coursesWithMissingCount} courses`;
    }

  } catch (error) {
    console.error('Could not load dashboard summary:', error);
  }
}

// ── My Courses ──
async function loadCourses() {
  const CARD_COLORS = ['course-orange', 'course-teal', 'course-blue'];

  try {
    const response = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`);
    const courses = await response.json();

    const safeCourses = Array.isArray(courses) ? courses : [];

    const container = document.getElementById('course-container');
    if (!container) return;

    container.innerHTML = '';

    safeCourses.forEach((course, idx) => {
      const colorClass = CARD_COLORS[idx % CARD_COLORS.length];
      const codeColorClass = colorClass.replace('course-', 'code-');
      const studentCount = course.total_std || 0;

      container.innerHTML += `
        <div class="course-card" onclick="openCourseDetail('${course.course_id}')">
          <div class="course-top ${colorClass}">
            <div class="course-count">
              <img src="../assets/icons/teacher-dashboard/person.svg" class="icon-svg">
              ${studentCount}
            </div>
            <div class="course-assign-icon">
              <img src="../assets/icons/teacher-dashboard/assign.svg" class="icon-svg">
            </div>
          </div>
          <div class="course-bottom">
            <div><span class="course-code ${codeColorClass}">${course.course_code}</span></div>
            <div class="course-name">${course.course_name}</div>
          </div>
        </div>
      `;
    });

    setBottomColumns();
  } catch (error) {
    console.error('Error loading courses:', error);
    setBottomColumns();
  }
}

function openCourseDetail(courseId) {
  console.log("OPEN COURSE DETAIL:", courseId);

  window.location.href = `../teacher/courses-detail/courses-detail.html?course_id=${encodeURIComponent(courseId)}`;
}

// ── Needs Grading — state ──
let _gradingRows = [];
let _sortAsc = true;

async function loadNeedsGrading() {
  try {
    const courseRes = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`);
    const courses = await courseRes.json();

    const safeCourses = Array.isArray(courses) ? courses : [];
    const now = new Date();
    _gradingRows = [];

    const coursePromises = safeCourses.map(async (course) => {
      const assignRes = await fetch(`${API_BASE_URL}/assignments/${course.course_id}`);
      const assignResult = await assignRes.json();

      const assignments = Array.isArray(assignResult)
        ? assignResult
        : (assignResult.data || []);

      const assignPromises = assignments
        .filter(assign => new Date(assign.due_date) < now)
        .map(async (assign) => {
          const subRes = await fetch(`${API_BASE_URL}/submissions/assignment/${assign.assignment_id}`);
          const subData = await subRes.json();
          const submissions = Array.isArray(subData.data) ? subData.data : [];

          const submittedCount = submissions.filter(s => s.status === 'submitted').length;
          const totalStudents = course.total_std || 0;

          _gradingRows.push({
            course_code: course.course_code,
            assignment_id: assign.assignment_id,
            title: assign.title,
            due_date: assign.due_date,
            submitted: submittedCount,
            total: totalStudents,
          });
        });

      await Promise.all(assignPromises);
    });

    await Promise.all(coursePromises);

    const badgeNum = document.getElementById('badge-num');
    if (badgeNum) badgeNum.innerText = _gradingRows.length;

    console.log("GRADING ROWS", _gradingRows);
    renderGradingTable();
  } catch (err) {
    console.error('Error loading grading table:', err);
  }
}

function renderGradingTable() {
  const tableBody = document.getElementById('grading-table-body');
  if (!tableBody) return;

  const sorted = [..._gradingRows].sort((a, b) => {
    const diff = new Date(a.due_date) - new Date(b.due_date);
    return _sortAsc ? diff : -diff;
  });

  tableBody.innerHTML = sorted.map(item => {
    const missing = Math.max(0, item.total - item.submitted);
    return `
      <div class="grade-row-card">
        <div class="gcol-class">${item.course_code}</div>
        <div class="gcol-name">${item.title}</div>
        <div class="gcol-submitted">${item.submitted}/${item.total}</div>
        <div class="gcol-missing">${missing}</div>
        <div class="gcol-tograde">${item.submitted}</div>
        <div class="gcol-action">
          <button class="grade-btn"
            onclick="window.location.href='../teacher/teacher-assign-manage/teacher-assign-manage.html?id=${item.assignment_id}'">
            <svg xmlns="http://www.w3.org/2000/svg" width="17" height="15" viewBox="0 0 17 15" fill="none">
              <path d="M1 1H16M1 7H5.125M1 13H5.125" stroke="white" stroke-width="2" stroke-linecap="round"/>
              <path d="M11.3125 11.125C12.1579 11.125 12.9686 10.7892 13.5664 10.1914C14.1642 9.59363 14.5 8.78288 14.5 7.9375C14.5 7.09212 14.1642 6.28137 13.5664 5.6836C12.9686 5.08582 12.1579 4.75 11.3125 4.75C10.4671 4.75 9.65637 5.08582 9.0586 5.6836C8.46082 6.28137 8.125 7.09212 8.125 7.9375C8.125 8.78288 8.46082 9.59363 9.0586 10.1914C9.65637 10.7892 10.4671 11.125 11.3125 11.125Z" stroke="white" stroke-width="2"/>
              <path d="M13.375 10.375L16 13.0187" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleGradingSort() {
  _sortAsc = !_sortAsc;

  const group = document.querySelector('.panel-sort-group');
  const label = document.querySelector('.panel-sort-label');

  if (label) label.textContent = _sortAsc ? 'Oldest' : 'Newest';
  if (group) group.classList.toggle('sort-desc', !_sortAsc);

  renderGradingTable();
}

function setBottomColumns() {
  const section = document.querySelector('.bottom-section');
  if (!section) return;

  const CARD_W = 220;
  const GAP = 20;
  const PAD = 40;
  const MAX_ROW = 3;
  const RIGHT_MAX = 570;
  const CONTENT_PAD = 60;

  const isCollapsed = document.body.classList.contains('sidebar-collapsed');
  const sidebarW = isCollapsed
    ? parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-collapsed-width') || '75')
    : parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width') || '250');

  const dashW = window.innerWidth - sidebarW - CONTENT_PAD;

  const totalCards = document.querySelectorAll('#course-container .course-card').length;
  const n = Math.min(totalCards || 1, MAX_ROW);

  const naturalLeft = PAD + n * CARD_W + (n - 1) * GAP;
  const rightW = Math.min(dashW - naturalLeft, RIGHT_MAX);
  const leftW = dashW - rightW;

  section.style.gridTemplateColumns = `${leftW}px ${rightW}px`;
}

// ── Recent Announcement ──
function renderAnnouncements(announcements) {
  const container = document.getElementById("announcements-container");
  if (!container) return;

  container.innerHTML = "";

  if (!announcements || announcements.length === 0) {
    container.innerHTML = `
      <div class="ann-card">
        <div class="ann-body">No announcements</div>
      </div>
    `;
    return;
  }

  const sorted = announcements.sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  sorted.slice(0, 5).forEach(a => {
    container.innerHTML += `
      <div class="ann-card">
        <div class="ann-title">${a.title || "Untitled Announcement"}</div>
        <div class="ann-body">${a.course_code || "-"}</div>
        <div class="ann-time">${getTimeAgo(a.created_at)}</div>
      </div>
    `;
  });
}

async function loadAnnouncements() {
  try {
    const courseRes = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`
      }
    });

    const courses = await courseRes.json();
    const safeCourses = Array.isArray(courses) ? courses : (courses.data || []);

    let allAnnouncements = [];

    for (const course of safeCourses) {
      const annRes = await fetch(`${API_BASE_URL}/announcements/course/${course.course_id}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`
        }
      });

      const annResult = await annRes.json();

      const announcements = Array.isArray(annResult)
        ? annResult
        : (annResult.data || []);

      announcements.forEach(a => {
        a.course_code = course.course_code;
        a.course_name = course.course_name;
      });

      allAnnouncements.push(...announcements);
    }

    renderAnnouncements(allAnnouncements);

  } catch (error) {
    console.error("Error loading announcements:", error);
  }
}

function getTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "Now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hours ago`;

  return `${days} days ago`;
}

document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const welcomeEl = document.querySelector('.welcome');
  if (welcomeEl && user) {
    welcomeEl.textContent = `Welcome back, ${user.first_name}`;
  }
  loadAnnouncements();
});

window.addEventListener('DOMContentLoaded', () => {
  updateDashboardSummary();
  loadNeedsGrading();
  loadCourses();
});