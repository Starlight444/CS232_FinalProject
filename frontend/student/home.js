const BASE_URL = "https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default";

fetch('../components/student-sidebar/sidebar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('sidebar-placeholder').innerHTML = data;
    
  if (!document.querySelector('script[src="../components/student-sidebar/sidebar.js"]')) {
    const script = document.createElement("script");
    script.src = "../components/student-sidebar/sidebar.js";
    document.body.appendChild(script);
  }
  });

// navbar
fetch('../components/student-navbar/student-navbar.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('navbar-placeholder').innerHTML = data;

    if (!document.querySelector('script[src="../components/student-navbar/student-navbar.js"]')) {
      const script = document.createElement("script");
      script.src = "../components/student-navbar/student-navbar.js";
      document.body.appendChild(script);
    }
  });

// Nav highlight
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', e => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
  });
});

// ---------- main content ----------

// calendar render
function renderCalendar(assignments) {
  const calGrid = document.querySelector('.cal-grid');
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  calGrid.innerHTML = '';

  const now = new Date();

  document.querySelector('.cal-month').textContent =
    now.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    });

  const year = now.getFullYear();
  const month = now.getMonth(); // เดือนปัจจุบัน

  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  // map deadline count by date
  const deadlineMap = {};

  assignments.forEach(a => {
    const due = new Date(a.due_date);

    // เอาเฉพาะเดือนปัจจุบัน
    if (
      due.getMonth() === month &&
      due.getFullYear() === year
    ) {
      const day = due.getDate();
      deadlineMap[day] = (deadlineMap[day] || 0) + 1;
    }
  });

  // day names
  dayNames.forEach(day => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = day;
    calGrid.appendChild(el);
  });

  // empty cells
  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    calGrid.appendChild(el);
  }

  // dates
  for (let d = 1; d <= totalDays; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day';

    if (deadlineMap[d]) {
      el.classList.add('has-deadline');
    }

    if (d === now.getDate()) {
      el.classList.add('today');
    }

    el.innerHTML = `
      <div>${d}</div>
      ${deadlineMap[d] ? `<span class="deadline-count">${deadlineMap[d]}</span>` : ''}
    `;

    calGrid.appendChild(el);
  }
}

// รายการการบ้านแยกหมวดหมู่ due today, upcoming, overdue, complete
let categorizedAssignments = {
  dueToday: [],
  upcoming: [],
  overdue: [],
  complete: []
};

let currentTab = "dueToday";

// function หลัก
async function loadHomeData() {
  try {
    // 1. ดึง user จาก localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) return;

    // แสดงชื่อ
    document.querySelector('.page-title').textContent = `Welcome, ${user.first_name}`;

    // 2. ดึง courses ของ user
    const courseRes = await fetch(`${BASE_URL}/courses/my/${user.user_id}?role=${user.role}`);
    const courseJson = await courseRes.json();
    const courses = courseJson;

    if (!courses || courses.length === 0) {
      renderAssignmentList([]);
      return;
    }

    let allAssignments = [];
    let allAnnouncements = [];

    // 3. get assignments + announcements ของทุกวิชา (merged: internal + external)
    // TODO: รอ backend confirm /assignments/merged และ /announcements/merged
    for (const course of courses) {
      // ----- ASSIGNMENTS -----
      let mergedAsg = [];
      if (window.ScraperMerge) {
        mergedAsg = await window.ScraperMerge.fetchMergedAssignments(
          course.course_id, user.token || '', course
        );
      }
      // Fallback: internal เดิม
      // TODO: ลบเมื่อ merged พร้อมจริง
      if (!mergedAsg.length) {
        const asgRes = await fetch(`${BASE_URL}/assignments/${course.course_id}`);
        const asgJson = await asgRes.json();
        mergedAsg = (asgJson.data || []).map(a =>
          window.ScraperMerge.normalizeAssignment({ ...a, source: 'internal' }, course)
        );
      }

      // ----- ANNOUNCEMENTS -----
      let mergedAnn = [];
      if (window.ScraperMerge) {
        mergedAnn = await window.ScraperMerge.fetchMergedAnnouncements(
          course.course_id, user.token || '', course
        );
      }
      if (!mergedAnn.length) {
        const annRes = await fetch(`${BASE_URL}/announcements/course/${course.course_id}`);
        const annJson = await annRes.json();
        mergedAnn = (annJson.data || []).map(a =>
          window.ScraperMerge.normalizeAnnouncement({ ...a, source: 'internal' }, course)
        );
      }

      // ใส่ course_name ให้ครบ
      mergedAnn.forEach(a => { a.course_name = course.course_name; });
      allAnnouncements.push(...mergedAnn);

      // 4. check submission per assignment (เฉพาะ internal)
      for (const m of mergedAsg) {
        let submission = null;
        if (!m.isExternal) {
          try {
            const subRes = await fetch(
              `${BASE_URL}/submissions/assignment/${m.id}/student/${user.user_id}`
            );
            const subJson = await subRes.json();
            submission = subJson.data;
          } catch { /* noop */ }
        }
        // เก็บใน shape เดิมที่ส่วนอื่นๆ ของ home.js ใช้
        allAssignments.push({
          assignment_id: m.id,
          title: m.title,
          due_date: m.due_date,
          max_score: m.max_score,
          course_id: m.course_id,
          course_name: course.course_name,
          course_code: course.course_code,
          submission,
          // ✅ เพิ่มอันนี้
          submission_status: m.submission_status,
          // ฟิลด์เพิ่มสำหรับ external
          isExternal: m.isExternal,
          external_url: m.external_url,
          source: m.source,
        });
      }
    }

    // 4) categorize
    categorizedAssignments = categorizeAssignments(allAssignments);

    // 5) render stat count
    updateStatNumbers();

    // 6) render default tab
    renderAssignmentList(categorizedAssignments[currentTab]);

    // 7) render announcement
    renderAnnouncements(allAnnouncements);

    // 8) bind click event
    setupStatTabs();

    // 9) render calendar
    renderCalendar(allAssignments);


  } catch (error) {
    console.error("Load home data error:", error);
  }
}

// แยก assignment ตามหมวดหมู่
function categorizeAssignments(assignments) {
  const now = new Date();
  const today = now.toDateString();

  const result = {
    dueToday: [],
    upcoming: [],
    overdue: [],
    complete: []
  };

  assignments.forEach(a => {
    const due = new Date(a.due_date);

    // ✅ แก้ตรงนี้: แยก internal vs external
    let submitted = false;

    if (a.isExternal) {
      // external: ใช้ submission_status จาก scraper
      submitted = a.submission_status === "Submitted for grading";
    } else {
      // internal: ใช้ submission object เดิม
      submitted = a.submission && a.submission.submission_id;
    }

    // ✅ logic ใหม่
    if (submitted) {
      result.complete.push(a); // ส่งแล้ว = complete เสมอ
    } else if (due < now) {
      result.overdue.push(a);
    } else if (due.toDateString() === today) {
      result.dueToday.push(a);
    } else {
      result.upcoming.push(a);
    }
  });

  return result;
}

// แสดงตัวเลขใน Assignment
function updateStatNumbers() {
  document.querySelector(".due-today .stat-num").textContent =
    categorizedAssignments.dueToday.length;

  document.querySelector(".upcoming .stat-num").textContent =
    categorizedAssignments.upcoming.length;

  document.querySelector(".overdue .stat-num").textContent =
    categorizedAssignments.overdue.length;

  document.querySelector(".complete .stat-num").textContent =
    categorizedAssignments.complete.length;
}

// สลับปุ่ม active ใน Assignment
function setupStatTabs() {
  const mapping = [
    { selector: ".due-today", key: "dueToday" },
    { selector: ".upcoming", key: "upcoming" },
    { selector: ".overdue", key: "overdue" },
    { selector: ".complete", key: "complete" }
  ];

  mapping.forEach(item => {
    const el = document.querySelector(item.selector);

    el.onclick = () => {
      document.querySelectorAll(".stat-item")
        .forEach(i => i.classList.remove("active-stat"));

      el.classList.add("active-stat");

      currentTab = item.key;

      renderAssignmentList(categorizedAssignments[currentTab]);
    };
  });
}

// สร้างรายการการบ้าน
function renderAssignmentList(assignments) {
  const list = document.querySelector(".assign-list");
  list.innerHTML = "";

  if (assignments.length === 0) {
    list.innerHTML = `
      <p style="color:#888;text-align:center;padding:20px;">
        No assignments
      </p>`;
    return;
  }

  assignments.forEach(a => {
    const dueText = getDueText(a);

    const item = document.createElement('div');
    item.className = 'assign-item' + (a.isExternal ? ' is-external' : '');

    const externalBadge = a.isExternal
      ? `<span class="ext-badge" title="From external source">
             <iconify-icon icon="ph:link-bold" width="12" height="12"></iconify-icon> External
         </span>`
      : '';

    item.innerHTML = `
      <div class="assign-avatar">${a.course_code}</div>
      <div class="assign-info">
        <div class="assign-name">${a.title} ${externalBadge}</div>
        <div class="assign-due">${dueText}</div>
        <div class="assign-class">${a.course_name}</div>
      </div>
      <div class="assign-points"> ${a.isExternal ? '' : `${a.max_score} Point`}</div>
    `;

    // click card event — external เปิด link ภายนอก, internal ไปหน้า submit
    item.addEventListener('click', () => {
      if (a.isExternal) {
        if (a.external_url) {
          window.open(a.external_url, '_blank', 'noopener,noreferrer');
        }
        return;
      }
      window.location.href = `../student/student-assign-submit.html?id=${a.assignment_id}&course_id=${a.course_id}`;
    });

    list.appendChild(item);
  });
}

// คำนวณ due text ที่การ์ดการบ้าน
function getDueText(a) {
  const now = new Date();
  const due = new Date(a.due_date);

  const diff = due - now;
  const mins = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(diff / 1000 / 60 / 60 / 24);

  const isSubmitted = a.submission && a.submission.submission_id;

  if (isSubmitted) {
    return due.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  if (diff < 0) {
    const overdueDays = Math.abs(Math.floor(diff / 86400000));
    return `Overdue by ${overdueDays} day${overdueDays !== 1 ? 's' : ''}`;
  }

  const isToday = due.toDateString() === now.toDateString();
  if (isToday) {
    if (mins < 60) return `Due in ${mins} minutes`;
    return `Due in ${hours} hours`;
  }

  return `Due in ${days} day${days !== 1 ? 's' : ''}`;
}

// render announcement
function renderAnnouncements(announcements) {
  const container = document.querySelector(".ann-card");

  if (!announcements || announcements.length === 0) {
    container.innerHTML += `
      <p style="color:#888;font-size:13px;">No announcements</p>
    `;
    return;
  }

  // เรียงใหม่ล่าสุดก่อน (ใช้ _raw.updated_at เพราะ normalizeAnnouncement ไม่ map updated_at ออกมา)
  const sorted = announcements.sort((a, b) => {
    const tA = a._raw?.updated_at || a.updated_at || a.created_at;
    const tB = b._raw?.updated_at || b.updated_at || b.created_at;
    return new Date(tB) - new Date(tA);
  });

  // เอาแค่ 5 อันล่าสุด
  sorted.slice(0, 5).forEach(a => {
    const updatedAt = a._raw?.updated_at || a.updated_at || null;
    const isExternal = !!a.isExternal;
    const externalUrl = a.external_url || '';
    const onclickAttr = isExternal && externalUrl
      ? `onclick="window.open('${externalUrl}','_blank','noopener,noreferrer')" style="cursor:pointer;"`
      : '';
    const externalBadge = isExternal
      ? `<span class="ext-badge" title="From external source">
             <iconify-icon icon="ph:link-bold" width="12" height="12"></iconify-icon> External
         </span>`
      : '';
    const hasBeenEdited = updatedAt && updatedAt !== a.created_at;
    const editedBadge = hasBeenEdited ? '<span class="ann-edited">Edited</span>' : '';
    container.innerHTML += `
      <div class="ann-item${isExternal ? ' is-external' : ''}" ${onclickAttr}>
        <div class="ann-item-title">${a.course_name} ${externalBadge}</div>
        <div class="ann-item-body">${a.title}</div>
        <div class="ann-item-time">${getTimeAgo(updatedAt || a.created_at)} ${editedBadge}</div>
      </div>
    `;
  });
}

// function เวลา
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

// เรียกใช้ตอนหน้าโหลด
loadHomeData();

// Bind ปุ่ม Sync (เรียก scraper backend ให้ล้าง+ดึงใหม่ แล้ว reload home)
// TODO: confirm endpoint/method กับ backend ใน scraper-merge.js
const _user = JSON.parse(localStorage.getItem("user") || "null");
window.ScraperMerge?.bindSyncButton(
  document.getElementById('sync-btn'),
  _user?.token || '',
  loadHomeData
);