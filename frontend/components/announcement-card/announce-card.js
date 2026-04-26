// Announcement Card Component

const CARD_COLORS = [
    '#57c7c7',
    '#f0a06a',
    '#8c85d8',
    '#6bc47e',
    '#e07aac',
    '#5ba3e8',
    '#ff8a65',
    '#4db6ac',
    '#7986cb',
    '#ba68c8',
    '#a1887f',
    '#90a4ae',
    '#dce775',
    '#ffb74d',
    '#4fc3f7'
];

function getCardColor(courseId) {
    const str = String(courseId);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
}

function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);

    // ตรวจสอบว่าวันที่ถูกต้องหรือไม่
    if (isNaN(date.getTime())) return 'Invalid Date';

    // รูปแบบ: DD/MM/YYYY HH:MM (เช่น 25/04/2026 13:40)
    return date.toLocaleString('th-TH', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false // ใช้รูปแบบ 24 ชั่วโมง
    });
}

function isNew(dateString) {
    if (!dateString) return true;
    return (Date.now() - new Date(dateString)) / 3600000 < 24;
}

function createAnnouncementCard(announcement, index) {
    const color = getCardColor(announcement.course_id ?? index);
    const teacher = announcement.created_by?.name ?? String(announcement.created_by ?? '');

    return `
        <div class="card">
            <div class="card-bar" style="background:${color}"></div>

            <div class="card-content">
                <div class="course-info" style="font-weight: bold; color: ${color}; font-size: 0.85em;">
                    ${announcement.course_code ?? 'Unknown Course'}
                </div>
                <div class="teacher">${teacher || ''}</div>
                <h3 class="title">${announcement.title ?? ''}</h3>
                <div class="desc">${announcement.content ?? ''}</div>
                <div class="time">${formatTime(announcement.created_at)}</div>
            </div>

            ${isNew(announcement.created_at) ? '<div class="badge">New</div>' : ''}
        </div>
    `;
}
