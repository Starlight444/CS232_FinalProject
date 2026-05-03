const bellBtn = document.getElementById('bell-btn');
const notifDropdown = document.getElementById('notif-dropdown');
const clearBtn = document.getElementById('clear-btn');
const notifList = document.getElementById('notif-list');
const notifBadge = document.getElementById('notif-badge');
const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');
const avatarGradient = document.getElementById('avatar-gradient');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userID = document.getElementById('user-id');
let currentNotifications = [];

const user = JSON.parse(localStorage.getItem("user")); //ดึงข้อมูล user จาก local storage

const API_BASE_URL = 'http://127.0.0.1:8000';

//เปิด Notification Dropdown
bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // ปิด Profile 
    profileDropdown.classList.remove('open');
    notifDropdown.classList.toggle('open');

    if (notifDropdown.classList.contains('open')) {
        markAllNotificationsAsRead(currentNotifications);
        updateBadge(currentNotifications);
    }
});

//เปิด Profile Dropdown
profileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // ปิด Notification 
    //notifDropdown.classList.remove('open');
    profileDropdown.classList.toggle('open');
});

//ปิด Dropdown
document.addEventListener('click', () => {
    //notifDropdown.classList.remove('open');
    profileDropdown.classList.remove('open');
});

//ป้องกันการปิด Dropdown เมื่อคลิกข้างในตัวมันเอง
notifDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
});
profileDropdown.addEventListener('click', (e) => {
    e.stopPropagation()
});

//Clear All
clearBtn.addEventListener('click', () => {
    notifList.innerHTML = `
        <li style="padding: 10px; margin-left: -50px; text-align: center; color: #888; font-size:12px">
            No new notification
        </li>`;

    if (notifBadge) {
        notifBadge.style.display = 'none';
    }
});

// ข้อมูลใน profile dropdown
function profileInfo() {
    userName.textContent = `${user.first_name} ${user.last_name}`;
    userEmail.textContent = `${user.email}`
    
    if (user.role == 'student') {
        userID.textContent = `ID: ${user.student_id}`
    } else {
        userID.textContent = `ID: ${user.teacher_id}`
    }

    const Fname = user.first_name;
    const nameAlpha = Fname[0].toUpperCase();
    avatarGradient.textContent = `${nameAlpha}`;
}
profileInfo();

// ข้อมูลใน notification dropdown
async function loadNotifications() {
    try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) return;

        // 1) ดึงรายวิชาของ user
        const courseRes = await fetch(
            `${API_BASE_URL}/courses/my/${user.user_id}?role=${user.role}`
        );
        const courseJson = await courseRes.json();
        const courses = Array.isArray(courseJson) ? courseJson : (courseJson.data || []);

        let notifications = [];

        // 2) ดึง announcement ของทุกวิชา
        for (const course of courses) {
            const annRes = await fetch(
                `${API_BASE_URL}/announcements/course/${course.course_id}`
            );

            const annJson = await annRes.json();
            const announcements = annJson.data || [];
            

            announcements.forEach(a => {
                const isEdited = a.updated_at && a.updated_at !== a.created_at;
                const sort_time = isEdited ? a.updated_at : a.created_at;
                notifications.push({
                    id: a.announcement_id,
                    course_code: course.course_code,
                    text: a.title,
                    created_at: a.created_at,
                    updated_at: a.updated_at,
                    isEdited: isEdited,
                    sort_time: sort_time
                });
            });
        }

        // 3) เรียงใหม่ล่าสุดก่อน (ใช้ sort_time เพื่อให้ประกาศที่แก้ไขล่าสุดขึ้นก่อน)
        notifications.sort(
            (a, b) => new Date(b.sort_time) - new Date(a.sort_time)
        );

        currentNotifications = notifications;
        renderNotifications(notifications);
        updateBadge(notifications);

    } catch (error) {
        console.error("Load notifications error:", error);
    }
}

// render in HTML
function renderNotifications(notifications) {
    notifList.innerHTML = "";

    if (!notifications.length) {
        notifList.innerHTML = `
            <li style="padding: 10px; margin-left: -50px; text-align: center; color: #888; font-size:12px">
                No new notification
            </li>`;
        notifBadge.style.display = "none";
        return;
    }

    const sorted = notifications.sort(
        (a, b) => new Date(b.sort_time) - new Date(a.sort_time)
    );

    sorted.slice(0, 10).forEach(n => {
        notifList.innerHTML += createNotificationItem(n);
    });

    notifBadge.style.display = "flex";
    notifBadge.textContent = sorted.length;
}

// create noti per each
function createNotificationItem(n) {
    const editedLabel = n.isEdited ? '<span class="notif-edited">Edited</span>' : '';
    return `
        <li class="notif-item">
            <div class="notif-subject-tag">${n.course_code}</div>
            <div class="notif-body">
                <p class="notif-text">${n.text}</p>
                <p class="notif-time">${getTimeAgo(n.sort_time)} ${editedLabel}</p>
            </div>
        </li>
    `;
}

// time ago
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

function getReadNotifications() {
    return JSON.parse(localStorage.getItem("readNotifications")) || [];
}

function markAllNotificationsAsRead(notifications) {
    const ids = notifications.map(n => n.id);
    localStorage.setItem("readNotifications", JSON.stringify(ids));
}

function updateBadge(notifications) {
    const readIds = getReadNotifications();

    const unreadCount = notifications.filter(
        n => !readIds.includes(n.id)
    ).length;

    if (unreadCount === 0) {
        notifBadge.style.display = "none";
    } else {
        notifBadge.style.display = "flex";
        notifBadge.textContent = unreadCount;
    }
}

loadNotifications();