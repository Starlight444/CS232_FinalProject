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