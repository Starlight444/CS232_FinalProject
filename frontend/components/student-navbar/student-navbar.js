//const bellBtn = document.getElementById('bell-btn');
//const notifDropdown = document.getElementById('notif-dropdown');
//const clearBtn = document.getElementById('clear-btn');
//const notifList = document.getElementById('notif-list');
//const notifBadge = document.getElementById('notif-badge');
const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

const avatarGradient = document.getElementById('avatar-gradient');
const userName = document.getElementById('user-name');
const userEmail = document.getElementById('user-email');
const userID = document.getElementById('user-id');

const user = JSON.parse(localStorage.getItem("user")); //ดึงข้อมูล user จาก local storage


function profileInfo() {
    userName.textContent = `${user.first_name} ${user.last_name}`;
    userEmail.textContent = `${user.email}`

    if (user.role == 'student') {
        userID.textContent = `ID: ${user.student_id}`;
    } else {
        userID.textContent = `ID: ${user.teacher_id}`;
    }

    const Fname = user.first_name;
    const nameAlpha = Fname[0].toUpperCase();
    avatarGradient.textContent = `${nameAlpha}`;
}
document.addEventListener("DOMContentLoaded", () => {
    profileInfo();
});

//เปิด Notification Dropdown
/*bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    // ปิด Profile 
    profileDropdown.classList.remove('open');
    notifDropdown.classList.toggle('open');
});*/

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
/*clearBtn.addEventListener('click', () => {
    notifList.innerHTML = `
        <li style="padding: 10px; margin-left: -50px; text-align: center; color: #888; font-size:12px">
            No new notification
        </li>`;

    if (notifBadge) {
        notifBadge.style.display = 'none';
    }
});*/