function loadTeacherSidebarNavbar() {
  fetch('../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
    .then(r => r.text())
    .then(html => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const sidebar = doc.querySelector('#sidebar');
      const navbar = doc.querySelector('.navbar');
      if (sidebar) document.getElementById('sidebar-placeholder').appendChild(sidebar);
      if (navbar) document.getElementById('navbar-placeholder').appendChild(navbar);

      const sidebarScript = document.createElement('script');
      sidebarScript.src = '../components/teacher-sidebar-navbar/teacher-sidebar.js';
      document.body.appendChild(sidebarScript);

      const navbarScript = document.createElement('script');
      navbarScript.src = '../components/teacher-sidebar-navbar/teacher-navbar.js';
      document.body.appendChild(navbarScript);
    })
    .catch(err => console.error("Error loading teacher sidebar/navbar:", err));
}

document.addEventListener("DOMContentLoaded", function () {
  loadTeacherSidebarNavbar();
});
const API_BASE_URL = 'http://127.0.0.1:8000';
const userData = JSON.parse(localStorage.getItem('user'));
if (!userData || !userData.token) {
    window.location.href = '../auth/login.html';
}
const TOKEN   = userData ? userData.token   : '';
const USER_ID = userData ? userData.user_id : '';

const CARD_COLORS = ['#E8926A', '#3BCFCF', '#7B9FD4', '#6DC06D', '#A78BFA', '#F472B6'];

const docSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
</svg>`;

const gearSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
</svg>`;

async function loadCourses() {
    const grid = document.getElementById('coursesGrid');
    if (!grid) return;

    try {
        const res  = await fetch(`${API_BASE_URL}/courses/my/${USER_ID}`, {
            headers: { 'Authorization': `Bearer ${TOKEN}` }
        });
        const data = await res.json();
        const courses = Array.isArray(data) ? data : (data.data || []);

        if (courses.length === 0) {
            grid.innerHTML = '<p style="color:#aaa;padding:20px;">No courses found.</p>';
            return;
        }

        grid.innerHTML = '';
        courses.forEach((c, idx) => {
            const bg   = CARD_COLORS[idx % CARD_COLORS.length];
            const card = document.createElement('div');
            card.className = 'course-card';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <div class="card-banner" style="background:${bg};">
                    <div class="card-banner-icons">
                        <span class="icon-doc">${docSVG}</span>
                        <span class="icon-gear-wrap">
                            <span class="icon-gear">${gearSVG}</span>
                            <span class="red-dot"></span>
                        </span>
                    </div>
                    <span class="course-code">${c.course_code}</span>
                </div>
                <div class="card-body">
                    <div class="course-name">${c.course_name}</div>
                </div>
            `;
            card.addEventListener('click', () => {
                window.location.href = `../teacher/courses-detail/courses-detail.html?course_id=${c.course_id}`;
            });
            grid.appendChild(card);
        });
    } catch (err) {
        console.error('Error loading courses:', err);
    }
}

document.addEventListener('DOMContentLoaded', loadCourses);