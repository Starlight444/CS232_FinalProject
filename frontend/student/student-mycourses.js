const BASE_URL = "https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default";

const colorMap = {
  "CS222": "#E8926A",
  "CS232": "#3BCFCF",
  "CS242": "#7B9FD4",
  "CS251": "#6DC06D",
};

const docIcon = `<iconify-icon icon="ph:file-text-bold" width="16" height="16" style="color: white;"></iconify-icon>`;
const gearIcon = `<iconify-icon icon="ph:gear-bold" width="16" height="16" style="color: white;"></iconify-icon>`;

function renderCourses(courses) {
  const grid = document.getElementById("coursesGrid");
  grid.innerHTML = "";
  courses.forEach((c) => {
    const bg = colorMap[c.course_code] || "#999";
    const courseId = c.course_id || c.id;
    const card = document.createElement("div");
    card.style.cursor = "pointer";
    card.className = "course-card";
    card.addEventListener("click", () => {
      window.location.href = `student-courses-detail.html?course_id=${courseId}`;
    });
    card.innerHTML = `
      <div class="card-banner" style="background:${bg};">
        <div class="card-banner-icons">
          <span class="icon-doc">${docIcon}</span>
          <span class="icon-gear-wrap">
            <span class="icon-gear">${gearIcon}</span>
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

fetch('../components/student-sidebar/sidebar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('sidebar-placeholder').innerHTML = data;
    const script = document.createElement("script");
    script.src = "../components/student-sidebar/sidebar.js";
    document.body.appendChild(script);
  });

fetch('../components/student-navbar/student-navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;
    const script = document.createElement("script");
    script.src = "../components/student-navbar/student-navbar.js";
    document.body.appendChild(script);
  });