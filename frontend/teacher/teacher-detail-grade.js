const _gradeUrlParams = new URLSearchParams(window.location.search);
const _gradeCourseId = _gradeUrlParams.get('course_id');

function goBack() {
    if (_gradeCourseId) {
        window.location.href = 'courses-detail/courses-detail.html?course_id=' + _gradeCourseId;
    } else {
        history.back();
    }
}

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

const BASE_URL = "https://ayx2aewxn3.execute-api.us-east-1.amazonaws.com";

const editSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

let allMembers = [];

function renderTable(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  data.forEach((m, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${m.user_id}</td>
      <td>${m.role}</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td class="total">-</td>
      <td><button class="edit-btn">${editSVG}</button></td>
    `;
    tbody.appendChild(tr);
  });
}

fetch(`${BASE_URL}/members/${_gradeCourseId}`)
  .then(res => res.json())
  .then(members => {
    allMembers = members;
    renderTable(members);
  })
  .catch(err => console.error(err));

document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = allMembers.filter(m => m.user_id.includes(q));
  renderTable(filtered);
});
