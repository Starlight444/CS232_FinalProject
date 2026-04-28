const BASE_URL = "http://127.0.0.1:8000";

const colorMap = {
  "CS222": "#E8926A",
  "CS232": "#3BCFCF",
  "CS242": "#7B9FD4",
  "CS251": "#6DC06D",
};

const docSVG =fetch `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
  <polyline points="14 2 14 8 20 8"/>
  <line x1="16" y1="13" x2="8" y2="13"/>
  <line x1="16" y1="17" x2="8" y2="17"/>
</svg>`;

const gearSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M22 8.5c0 2.5-1.5 4.5-4 5.5H6c-2.5-1-4-3-4-5.5S3.5 4 6 3h12c2.5 1 4 3 4 5.5z"/>
  <path d="M6 14v4"/>
  <path d="M10 14v4"/>
</svg>`;

function renderCourses(courses) {
  const grid = document.getElementById("coursesGrid");
  grid.innerHTML = "";
  courses.forEach((c) => {
    const bg = colorMap[c.course_code] || "#999";
    const card = document.createElement("div");
    card.className = "course-card";
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
        <div class="course-name">${c.course_name.toUpperCase()}</div>
      </div>
    `;
    grid.appendChild(card);
  });
}

fetch(`${BASE_URL}/courses/`)
  .then(res => res.json())
  .then(data => renderCourses(data))
  .catch(err => console.error(err));

function loadScriptOnce(src) {
  if (document.querySelector(`script[src="${src}"]`)) return;

  const script = document.createElement("script");
  script.src = src;
  document.body.appendChild(script);
}

fetch('../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
  .then(response => response.text())
  .then(data => {
    const doc = new DOMParser().parseFromString(data, 'text/html');

    const sidebar = doc.querySelector('#sidebar');
    const navbar = doc.querySelector('.navbar');

    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    const navbarPlaceholder = document.getElementById('navbar-placeholder');

    sidebarPlaceholder.innerHTML = '';
    navbarPlaceholder.innerHTML = '';

    if (sidebar) sidebarPlaceholder.appendChild(sidebar);
    if (navbar) navbarPlaceholder.appendChild(navbar);

    loadScriptOnce("../components/teacher-sidebar-navbar/teacher-navbar.js");
    loadScriptOnce("../components/teacher-sidebar-navbar/teacher-sidebar.js");
  })
  .catch(err => console.error("Load sidebar/navbar error:", err));