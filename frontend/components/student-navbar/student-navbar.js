const bellBtn = document.getElementById('bell-btn');
const notifDropdown = document.getElementById('notif-dropdown');
const clearBtn = document.getElementById('clear-btn');
const notifList = document.getElementById('notif-list');
const notifBadge = document.getElementById('notif-badge');

//เปิด Dropdown
bellBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    notifDropdown.classList.toggle('open');
});

//ปิด Dropdown
document.addEventListener('click', () => {
    notifDropdown.classList.remove('open');
});

//ป้องกันการปิด Dropdown เมื่อคลิกข้างในตัวมันเอง
notifDropdown.addEventListener('click', (e) => {
    e.stopPropagation();
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