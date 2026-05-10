(() => {
  const gradeUrlParams = new URLSearchParams(window.location.search);
  const gradeCourseId = gradeUrlParams.get('course_id');

  const GRADE_API_BASE_URL = 'https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default';

  const userData = JSON.parse(localStorage.getItem('user') || 'null');
  const TOKEN = userData ? userData.token : '';

  // ทำให้ปุ่ม Back ใน HTML onclick="goBack()" ยังเรียกได้
  window.goBack = function () {
    if (gradeCourseId) {
      window.location.href = 'courses-detail/courses-detail.html?course_id=' + gradeCourseId;
    } else {
      history.back();
    }
  };

  function loadTeacherSidebarNavbar() {
    fetch('../components/teacher-sidebar-navbar/teacher-sidebar-navbar.html')
      .then(r => r.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const sidebar = doc.querySelector('#sidebar');
        const navbar = doc.querySelector('.navbar');

        const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
        const navbarPlaceholder = document.getElementById('navbar-placeholder');

        if (sidebar && sidebarPlaceholder) {
          sidebarPlaceholder.appendChild(sidebar);
        }

        if (navbar && navbarPlaceholder) {
          navbarPlaceholder.appendChild(navbar);
        }

        const sidebarScript = document.createElement('script');
        sidebarScript.src = '../components/teacher-sidebar-navbar/teacher-sidebar.js?v=3';
        document.body.appendChild(sidebarScript);

        const navbarScript = document.createElement('script');
        navbarScript.src = '../components/teacher-sidebar-navbar/teacher-navbar.js?v=3';
        document.body.appendChild(navbarScript);
      })
      .catch(err => console.error('Error loading teacher sidebar/navbar:', err));
  }

  const editSVG = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  `;

  let allStudents = [];

  async function fetchUserDetail(userId) {
    try {
      const response = await fetch(`${GRADE_API_BASE_URL}/users/${userId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result || !result.data) {
        return null;
      }

      return result.data;

    } catch (err) {
      console.warn('fetchUserDetail failed:', userId, err);
      return null;
    }
  }

  function getStudentDisplayName(user) {
    if (!user) return '-';

    if (user.full_name) return user.full_name;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || '-';
  }

  function getStudentDisplayId(member, user) {
    // ถ้า backend ส่ง student_id มา ใช้ student_id ก่อน
    return user?.student_id || member?.student_id || '-';
  }

  function renderTable(data) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!data || data.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center;">No students</td>
        </tr>
      `;
      return;
    }

    data.forEach((student, i) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${i + 1}</td>
        <td>${student.student_id || '-'}</td>
        <td>${student.student_name || '-'}</td>
        <td>-</td>
        <td>-</td>
        <td>-</td>
        <td class="total">-</td>
        <td>
          <button class="edit-btn" type="button">${editSVG}</button>
        </td>
      `;

      tbody.appendChild(tr);
    });
  }

  async function loadMembers() {
    const tbody = document.getElementById('tableBody');

    if (!gradeCourseId) {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center;color:red;">
              ไม่พบ course_id
            </td>
          </tr>
        `;
      }
      return;
    }

    try {
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center;">
              Loading students...
            </td>
          </tr>
        `;
      }

      const response = await fetch(`${GRADE_API_BASE_URL}/members/${gradeCourseId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      });

      const result = await response.json().catch(() => null);

      console.log('MEMBERS RESPONSE:', result);

      if (!response.ok) {
        throw new Error(result?.detail || 'โหลดรายชื่อนักศึกษาไม่สำเร็จ');
      }

      const members = Array.isArray(result) ? result : (result?.data || []);

      const studentMembers = members.filter(m => m.role === 'student');

      allStudents = await Promise.all(
        studentMembers.map(async (member) => {
          const user = await fetchUserDetail(member.user_id);

          return {
            member_id: member.member_id,
            student_id: getStudentDisplayId(member, user),
            student_name: getStudentDisplayName(user),
            role: member.role
          };
        })
      );

      console.log('STUDENTS ONLY:', allStudents);

      renderTable(allStudents);

    } catch (err) {
      console.error('Error loading members:', err);

      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8" style="text-align:center;color:red;">
              โหลดข้อมูลไม่สำเร็จ
            </td>
          </tr>
        `;
      }
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadTeacherSidebarNavbar();
    loadMembers();

    const searchInput = document.getElementById('searchInput');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();

        const filtered = allStudents.filter(student =>
          String(student.student_id || '').toLowerCase().includes(q) ||
          String(student.student_name || '').toLowerCase().includes(q)
        );

        renderTable(filtered);
      });
    }
  });
})();