// sidebar
fetch('../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/teacher-sidebar-navbar/teacher-navbar.js";
        document.body.appendChild(script);
    });

// navbar
fetch('../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/teacher-sidebar-navbar/teacher-navbar.js";
        document.body.appendChild(script);
    });
const courses = [
  { code: "CS222", name: "OPERATING SYSTEMS",                           bg: "#E8926A" },
  { code: "CS232", name: "INTRODUCTION TO CLOUD\nCOMPUTING TECHNOLOGY", bg: "#3BCFCF" },
  { code: "CS242", name: "COMPUTER PROGRAMMING\nUSING PYTHON/PYTHON...", bg: "#7B9FD4" },
  { code: "CS251", name: "DATABASE SYSTEMS 1",                           bg: "#6DC06D" },
];

const docSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
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

const grid = document.getElementById("coursesGrid");

courses.forEach((c) => {
  const card = document.createElement("div");
  card.className = "course-card";
  card.innerHTML = `
    <div class="card-banner" style="background:${c.bg};">
      <div class="card-banner-icons">
        <span class="icon-doc">${docSVG}</span>
        <span class="icon-gear-wrap">
          <span class="icon-gear">${gearSVG}</span>
          <span class="red-dot"></span>
        </span>
      </div>
      <span class="course-code">${c.code}</span>
    </div>
    <div class="card-body">
      <div class="course-name">${c.name.replace(/\n/g, "<br>")}</div>
    </div>
  `;
  grid.appendChild(card);
});