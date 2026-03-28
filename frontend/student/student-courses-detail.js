document.addEventListener("DOMContentLoaded", function () {
    loadSidebar();
    loadNavbar();
    initTabIndicator();
});

function loadSidebar() {
    fetch('../components/student-sidebar/sidebar.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('sidebar-container').innerHTML = data;
            const script = document.createElement('script');
            script.src = '../components/student-sidebar/sidebar.js';
            document.body.appendChild(script);
        })
        .catch(err => console.error("Error loading sidebar:", err));
}

function loadNavbar() {
    fetch('../components/student-navbar/student-navbar.html')
        .then(response => response.text())
        .then(data => {
            const container = document.getElementById('student-navbar-container') || document.getElementById('student-container');
            if (container) {
                container.innerHTML = data; 
            }
            const script = document.createElement('script');
            script.src = '../components/student-navbar/student-navbar.js';
            document.body.appendChild(script);
        })
        .catch(err => console.error("Error loading navbar:", err));
}

/* ============================================================
   Sliding Tab Indicator
   ============================================================ */
function initTabIndicator() {
    const nav = document.getElementById('tab-nav');
    const indicator = document.getElementById('tab-indicator');
    if (!nav || !indicator) return;

    const activeBtn = nav.querySelector('.tab-btn.active');
    if (activeBtn) moveIndicator(activeBtn, false);

    window.addEventListener('resize', () => {
        const current = nav.querySelector('.tab-btn.active');
        if (current) moveIndicator(current, false);
    });
}

function moveIndicator(btn, animate = true) {
    const indicator = document.getElementById('tab-indicator');
    if (!indicator) return;

    const nav = document.getElementById('tab-nav');
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();

    const left = btnRect.left - navRect.left;
    const width = btnRect.width;

    if (!animate) {
        indicator.style.transition = 'none';
        indicator.getBoundingClientRect();
    } else {
        indicator.style.transition = 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
    }

    indicator.style.left = left + 'px';
    indicator.style.width = width + 'px';
}

/* ============================================================
   Switch Tab
   ============================================================ */
function switchTab(element, tabId) {
    const allButtons = document.querySelectorAll('.tab-btn');
    const allPanels = document.querySelectorAll('.tab-panel');
    const targetPanel = document.getElementById(tabId);

    allButtons.forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');

    moveIndicator(element, true);

    allPanels.forEach(panel => {
        panel.style.display = 'none';
        panel.classList.remove('active');
    });

    targetPanel.style.display = 'flex'; 
    setTimeout(() => {
        targetPanel.classList.add('active');
    }, 10);
}
