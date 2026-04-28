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

    // External announcements (จาก scraper) จะคลิกแล้วเปิด link ภายนอก
    // box_link ถูกแปลงเป็น external_url แล้วใน scraper-merge.normalizeAnnouncement
    // (priority: box_link > course_link)
    const isExternal = announcement.isExternal || announcement.source === 'external';
    const externalUrl = announcement.external_url || '';
    const externalAttrs = isExternal && externalUrl
        ? `data-external-url="${externalUrl}" style="cursor:pointer;"`
        : '';
    const externalBadge = isExternal
        ? `<span class="ext-badge" title="From external source">
               <iconify-icon icon="ph:link-bold" width="12" height="12"></iconify-icon> External
           </span>`
        : '';

    // External ไม่ส่ง content มา → แสดง CTA ลิงก์ไป Moodle แทน
    const rawContent = announcement.content ?? '';
    const descHtml = (isExternal && !rawContent && externalUrl)
        ? `<div class="desc desc-external-cta">Click to view on Moodle →</div>`
        : `<div class="desc">${rawContent}</div>`;

    // external ใช้ author จาก scraper, internal ใช้ created_by
    const authorLine = isExternal
        ? (announcement.author || '')
        : (announcement.author_name || '');

    return `
        <div class="card${isExternal ? ' is-external' : ''}" ${externalAttrs}
             onclick="${isExternal && externalUrl ? `window.open('${externalUrl}','_blank','noopener,noreferrer')` : ''}">
            <div class="card-bar" style="background:${color}"></div>

            <div class="card-content">
                <div class="course-info" style="font-weight: bold; color: ${color}; font-size: 0.85em;">
                    ${announcement.course_code ?? announcement.course_name ?? 'Unknown Course'} ${externalBadge}
                </div>
                <div class="teacher">${authorLine}</div>
                <h3 class="title">${announcement.title ?? ''}</h3>
                ${descHtml}
                <div class="time">${formatTime(announcement.created_at)}</div>
            </div>

            ${isNew(announcement.created_at) ? '<div class="badge">New</div>' : ''}
        </div>
    `;
}