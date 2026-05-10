/* =========================================================================
 * scraper-merge.js
 * -------------------------------------------------------------------------
 * Helper สำหรับฝั่ง Student เพื่อรวมข้อมูล internal + external (จาก scraper)
 * เข้ามาในหน้าเดียวกัน
 *
 * Shape ที่ backend ยืนยันแล้ว (assignment):
 *   internal -> { assignment_id, title, description, due_date, max_score,
 *                 allowed_file_types, course_id, status, submit_count,
 *                 is_external: false }
 *   external -> { assignment_id, title, due_date, course_id, status,
 *                 course_link, box_link, submission_status, grading_status,
 *                 time_remaining, last_modified, file_submission,
 *                 is_external: true }
 *
 * Discriminator: ใช้ field boolean `is_external`
 * External link  : ใช้ `box_link` ก่อน, fallback เป็น `course_link`
 *
 * ======================================================================= */

// -------------------------------------------------------------------------
// 1) Endpoints
// -------------------------------------------------------------------------
// Backend ส่ง endpoint รวมเป็นก้อนเดียวต่อ user (ไม่แยกตาม course):
//   GET  /assignments/all     -> { success, data: [ ...mixed internal+external ] }
//   GET  /announcements/all   -> { success, data: [ ...mixed internal+external ] }
//   POST /assignments/sync    -> { success, mode, data: [...scraped raw...] }
//   POST /announcements/sync  -> { success, mode, data: [...scraped raw...] }
// per-course filter ทำที่ฝั่ง client โดยใช้ field `course_id`
const API_BASE_URL = "https://qj1zsidavd.execute-api.us-east-1.amazonaws.com/default";

const SCRAPER_ENDPOINTS = {
    mergedAssignmentsAll: () => `/assignments/all`,
    mergedAnnouncementsAll: () => `/announcements/all`,
    syncAssignments: () => `/assignments/scraper`,
    syncAnnouncements: () => `/announcements/scraper`,
};

// -------------------------------------------------------------------------
// 2) Normalize: ทำให้ item มี shape เดียวกันไม่ว่าจะมาจาก internal หรือ external
// -------------------------------------------------------------------------
/**
 * แปลง assignment ดิบ (ทั้ง internal และ external) ให้เป็น shape เดียว
 * @param {object} raw   - object จาก API
 * @param {object} course - course object (course_code, course_id, course_name)
 */
function normalizeAssignment(raw, course = {}) {
    const isExternal = raw.is_external === true;

    // external link: box_link ชี้ตรง assignment, course_link ชี้หน้าวิชา
    const externalUrl = isExternal
        ? (raw.box_link || raw.course_link || null)
        : null;

    return {
        id: raw.assignment_id,
        source: isExternal ? 'external' : 'internal',
        isExternal,
        course_id: raw.course_id ?? course.course_id,
        course_code: raw.course_code ?? course.course_code ?? '',
        course_name: raw.course_name ?? course.course_name ?? '',
        title: raw.title ?? '',
        description: raw.description ?? '',
        due_date: raw.due_date ?? null,
        max_score: raw.max_score ?? 0,
        // external เท่านั้น — คลิกแล้วเปิดเว็บภายนอก (box_link > course_link)
        external_url: externalUrl,
        // internal: 'published' / 'draft'
        // external: 'Not graded' / 'Submitted for grading' / ...
        status: raw.status ?? null,
        // เฉพาะ external (ใช้แสดงผลเสริมได้ถ้าต้องการ)
        submission_status: raw.submission_status ?? null,
        grading_status: raw.grading_status ?? null,
        time_remaining: raw.time_remaining ?? null,
        file_submission: raw.file_submission ?? null,
        // เฉพาะ internal
        submit_count: raw.submit_count ?? 0,
        allowed_file_types: raw.allowed_file_types ?? '',
        _raw: raw,
    };
}

/**
 * แปลง announcement ดิบให้ shape เดียวกัน
 */
function normalizeAnnouncement(raw, course = {}) {
    // Shape ที่ backend ยืนยันแล้ว:
    //   internal -> { id, title, content, created_at, course_id, is_external: false }
    //   external -> { id, title, created_at, course_id, author, course_name,
    //                 course_link, box_link, is_external: true }
    //   หมายเหตุ: external "ไม่มี" field content
    const isExternal = raw.is_external === true;

    // box_link = discussion thread (ลึกตรง post), course_link = หน้า moodle course
    const externalUrl = isExternal
        ? (raw.box_link || raw.course_link || null)
        : null;

    return {
        id: raw.id ?? raw.announcement_id,
        source: isExternal ? 'external' : 'internal',
        isExternal,
        course_id: raw.course_id ?? course.course_id,
        course_code: raw.course_code ?? course.course_code ?? '',
        // external ส่ง course_name มาเอง (เช่น "CS217 (2/2568)")
        course_name: raw.course_name ?? course.course_name ?? '',
        title: raw.title ?? '',
        content: raw.content ?? '',           // external ไม่มี content
        created_at: raw.created_at ?? null,
        external_url: externalUrl,
        // เฉพาะ external
        author: raw.author ?? null,
        _raw: raw,
    };
}

// -------------------------------------------------------------------------
// 3) Fetcher: ดึงข้อมูลรวมจาก endpoint /assignments/all (และ /announcements/all)
// -------------------------------------------------------------------------
// In-flight cache: ป้องกันยิงซ้ำเมื่อ consumer วน loop ตาม course
// (เช่น home.js fetch ทีละวิชา) — ทุกการเรียกจะ share Promise เดียวกัน
// จนกว่าจะ invalidate (sync) หรือเรียก force=true
const _cache = {
    assignments: null, // Promise<Array<NormalizedAssignment>> | null
    announcements: null,
};

function invalidateCache() {
    _cache.assignments = null;
    _cache.announcements = null;
}

async function _fetchJson(baseUrl, path, token) {
    const res = await fetch(`${baseUrl}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // backend wrap: { success, data: [...] } | array ตรง ๆ ก็รองรับ
    return Array.isArray(json) ? json : (json.data || []);
}

/**
 * ดึง assignments ทั้งหมดของ user (internal + external รวมกัน)
 * @returns {Promise<Array>} normalized assignments (ยังไม่ filter)
 */
function fetchAllMergedAssignments(token, { force = false } = {}) {
    if (!force && _cache.assignments) return _cache.assignments;
    const p = (async () => {
        try {
            const list = await _fetchJson(API_BASE_URL, SCRAPER_ENDPOINTS.mergedAssignmentsAll(), token);
            return list.map(item => normalizeAssignment(item));
        } catch (err) {
            console.warn('[scraper-merge] /assignments/all failed:', err);
            _cache.assignments = null; // ให้ลองใหม่ครั้งหน้า
            return [];
        }
    })();
    _cache.assignments = p;
    return p;
}

/**
 * Backward-compat: ดึง assignments รวมของ "วิชาเดียว"
 * — ใช้ /assignments/all แล้ว filter ด้วย course_id ใน client
 *   (cache ทำให้ลูปวนทุกวิชายิง backend ครั้งเดียว)
 */
async function fetchMergedAssignments(courseId, token, course = {}) {
    const all = await fetchAllMergedAssignments(token);
    return all
        .filter(a => a.course_id === courseId)
        .map(a => ({
            ...a,
            course_code: a.course_code || course.course_code || '',
            course_name: a.course_name || course.course_name || '',
        }));
}

/**
 * ดึง announcements ทั้งหมด (รอ backend confirm endpoint จริง)
 */
function fetchAllMergedAnnouncements(token, { force = false } = {}) {
    if (!force && _cache.announcements) return _cache.announcements;
    const p = (async () => {
        try {
            const list = await _fetchJson(API_BASE_URL, SCRAPER_ENDPOINTS.mergedAnnouncementsAll(), token);
            return list.map(item => normalizeAnnouncement(item));
        } catch (err) {
            console.warn('[scraper-merge] /announcements/all failed:', err);
            _cache.announcements = null;
            return [];
        }
    })();
    _cache.announcements = p;
    return p;
}

/**
 * Backward-compat: ดึง announcements ของวิชาเดียว
 */
async function fetchMergedAnnouncements(courseId, token, course = {}) {
    const all = await fetchAllMergedAnnouncements(token);
    return all
        .filter(a => a.course_id === courseId)
        .map(a => ({
            ...a,
            course_code: a.course_code || course.course_code || '',
            course_name: a.course_name || course.course_name || '',
        }));
}

// -------------------------------------------------------------------------
// 4) Sync: เรียก backend ให้ล้างข้อมูล external แล้ว scrape ใหม่
// -------------------------------------------------------------------------
async function _postSync(baseUrl, path, token) {
    try {
        const res = await fetch(`${baseUrl}${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json().catch(() => ({}));
        // backend ตอบ { success: true, mode: 'real', data: [...] }
        return json.success !== false;
    } catch (err) {
        console.error(`[scraper-merge] sync ${path} failed:`, err);
        return false;
    }
}

/**
 * ยิง sync ทั้งสอง endpoint แบบขนาน
 * - POST /assignments/sync
 * - POST /announcements/sync
 *
 * @returns {Promise<{ assignments: boolean, announcements: boolean, ok: boolean }>}
 *   `ok` จะเป็น true เมื่อทั้งสองสำเร็จ
 */
async function triggerScraperSync(token) {
    const [assignments, announcements] = await Promise.all([
        _postSync(API_BASE_URL, SCRAPER_ENDPOINTS.syncAssignments(), token),
        _postSync(API_BASE_URL, SCRAPER_ENDPOINTS.syncAnnouncements(), token),
    ]);
    return { assignments, announcements, ok: assignments && announcements };
}

/**
 * Bind ปุ่ม sync ใน DOM กับการเรียก backend แล้ว reload list หลัง sync เสร็จ
 *
 * @param {HTMLElement} btn        - element ปุ่ม
 * @param {string}      token
 * @param {Function}    reloadFn   - ฟังก์ชันโหลดข้อมูลใหม่ (เช่น fetchAssignments)
 */

function bindSyncButton(btn, token, reloadFn) {
    if (!btn) return;
    btn.addEventListener('click', async () => {
        btn.disabled = true;
        const original = btn.innerHTML;
        btn.innerHTML = `<iconify-icon icon="ph:arrows-clockwise-bold" width="18" height="18"></iconify-icon> Syncing...`;
        btn.classList.add('syncing');

        const result = await triggerScraperSync(token);

        // ล้าง cache เพื่อให้ reloadFn ดึงข้อมูลใหม่จาก backend จริง ๆ
        invalidateCache();

        // ไม่ว่า sync จะสำเร็จหรือไม่ก็ reload เพื่อให้แน่ใจว่า UI ใช้ข้อมูลล่าสุด
        try { await reloadFn?.(); } catch (e) { console.error(e); }

        btn.disabled = false;
        btn.innerHTML = original;
        btn.classList.remove('syncing');

        // TODO: เปลี่ยนเป็น toast/notification component ที่โปรเจกต์ใช้จริง
        if (!result.ok) {
            const failed = [
                !result.assignments && 'assignments',
                !result.announcements && 'announcements',
            ].filter(Boolean).join(' & ');
            alert(`Sync ${failed} failed. Please try again later.`);
        }
    });
}

// -------------------------------------------------------------------------
// 5) Click handler: card ของ external item ต้องเปิด link ภายนอก
// -------------------------------------------------------------------------
/**
 * คืน handler สำหรับการคลิกการ์ด assignment
 * - external -> เปิด external_url
 * - internal -> ไปหน้า assignment detail ของระบบเรา
 */
function handleAssignmentClick(item, internalDetailUrlBuilder) {
    if (item.isExternal) {
        if (item.external_url) {
            window.open(item.external_url, '_blank', 'noopener,noreferrer');
        } else {
            console.warn('[scraper-merge] external assignment has no external_url', item);
        }
        return;
    }
    // internal -> หน้า submit ในระบบเรา
    window.location.href = internalDetailUrlBuilder(item);
}

function handleAnnouncementClick(item) {
    if (item.isExternal && item.external_url) {
        window.open(item.external_url, '_blank', 'noopener,noreferrer');
    }
    // internal announcement: ปัจจุบันยังไม่มี detail page เลยไม่ทำอะไร
}

// expose to global (ทุกหน้าโหลดเป็น <script> ธรรมดา)
window.ScraperMerge = {
    SCRAPER_ENDPOINTS,
    normalizeAssignment,
    normalizeAnnouncement,
    // ดึงทีเดียว (แนะนำใช้ตัวนี้สำหรับหน้าที่อยากได้ทั้งหมด เช่น home, student-all-assign)
    fetchAllMergedAssignments,
    fetchAllMergedAnnouncements,
    // ตัว filter per-course (ใช้ cache ภายใน — เรียกซ้ำใน loop ปลอดภัย)
    fetchMergedAssignments,
    fetchMergedAnnouncements,
    invalidateCache,
    triggerScraperSync,
    bindSyncButton,
    handleAssignmentClick,
    handleAnnouncementClick,
};