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
  <circle cx="12" cy="12" r="3"/>
  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
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