const profileBtn = document.getElementById('profile-btn');
const profileDropdown = document.getElementById('profile-dropdown');

if (profileBtn && profileDropdown) {
    profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('open');
    });

    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// ปิด Dropdown
document.addEventListener('click', () => {
    if (profileDropdown && profileDropdown.classList.contains('open')) {
        profileDropdown.classList.remove('open');
    }
});

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
profileInfo();