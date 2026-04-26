// sidebar
fetch('../components/student-sidebar/sidebar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('sidebar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-sidebar/sidebar.js";
        document.body.appendChild(script);
    });

// navbar
fetch('../components/student-navbar/student-navbar.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('navbar-placeholder').innerHTML = data;

        const script = document.createElement("script");
        script.src = "../components/student-navbar/student-navbar.js";
        document.body.appendChild(script);
    });

// main content
const fileInput = document.getElementById('file-input');
const workFiles = document.getElementById('work-files');
const submitBtn = document.getElementById('submit-btn');

let uploadedFiles = [];
let isSubmitted = false;

// api
const BASE_URL = 'https://2z3eq1a51d.execute-api.us-east-1.amazonaws.com/default';
// [เพิ่ม] ตรวจสอบ Token และดึงข้อมูล User จาก localStorage
const userData = JSON.parse(localStorage.getItem("user"));
if (!userData || !userData.token) {
    window.location.href = "../auth/login.html";
}
const TOKEN = userData ? userData.token : '';
const USER_ID = userData ? userData.user_id : '';

const urlParams = new URLSearchParams(window.location.search);
const assignment_Id = urlParams.get('id');
const courseId = urlParams.get('course_id');

// ตรวจสอบ ID ก่อนเริ่มทำงาน
if (!assignment_Id) {
    console.error("No assignment ID found");
    alert("ไม่พบรหัสการบ้าน กรุณากลับไปเลือกการบ้านใหม่อีกครั้ง");
}

async function checkCurrentSubmission() {
    try {
        const response = await fetch(`${BASE_URL}/submissions/assignment/${assignment_Id}/student/${USER_ID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json()
        if (json.data && json.data.status !== 'not_submitted') {
            isSubmitted = true;
            updateUISubmitted();
        }
    } catch (err) {
        console.error("Check submission error:", err);
    }
}

// ฟังก์ชันดึงข้อมูลการบ้านมาโชว์ 
async function fetchAssignmentDetail() {
    if (!assignment_Id || !courseId) return console.error("No assignment/course ID found");
    try {
        const response = await fetch(`${BASE_URL}/assignments/${courseId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();

        if (json.success) {
            const data = json.data.find(a => a.assignment_id === assignment_Id);
            if (!data) return console.error("Assignment not found in course");
            document.querySelector('.assign-header .assign-title').textContent = data.title;
            document.querySelector('.assign-due').textContent = `Due date on ${formatTimestamp(new Date(data.due_date))}`;
            document.querySelector('.section-body').textContent = data.description;
            document.querySelector('.assign-points').textContent = `${data.max_score} Points`;

            if (new Date() > new Date(data.due_date)) {
                updateUIDeadlinePassed();
            } else {
                checkCurrentSubmission();
            }
        }
    } catch (err) {
        console.error("Fetch Assignment Error:", err);
    }
}

function updateUISubmitted() {
    submitBtn.textContent = 'Edit Submission';
    submitBtn.classList.add('submitted');
    lockWorkBox(true);

    // แสดง timestamp
    const bar = submitBtn.parentElement;
    if (!document.querySelector('.submit-timestamp')) {
        const stamp = document.createElement('p');
        stamp.className = 'submit-timestamp';
        stamp.innerHTML = `<i class="fa-regular fa-circle-check"></i> Submitted on ${formatTimestamp(new Date())}`;
        bar.appendChild(stamp);
    }
}

function updateUIDeadlinePassed() {
    submitBtn.disabled = true;
    submitBtn.textContent = 'หมดเวลาส่งงาน';
    submitBtn.classList.add('submitted');
    lockWorkBox(true);

    const bar = submitBtn.parentElement;
    if (!document.querySelector('.submit-timestamp')) {
        const stamp = document.createElement('p');
        stamp.className = 'submit-timestamp';
        stamp.innerHTML = `<i class="fa-regular fa-circle-xmark"></i> หมดเวลาส่งงานแล้ว`;
        bar.appendChild(stamp);
    }
}

// api : submission
async function handleSubmission() {
    if (uploadedFiles.length === 0) {
        alert('Please upload at least one file before submitting.');
        return;
    }

    try {
        // เปลี่ยนสถานะปุ่มเป็น Uploading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        // POST /submissions/ — ส่ง FormData (assignment_id, course_id, student_id, file) ครั้งเดียว
        const userData = JSON.parse(localStorage.getItem("user") || '{}');
        const studentId = userData.user_id || '';

        const formData = new FormData();
        formData.append('file', uploadedFiles[0]);
        formData.append('assignment_id', assignment_Id);
        formData.append('course_id', courseId);
        formData.append('student_id', studentId);

        const submitRes = await fetch(`${BASE_URL}/submissions/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });
        const submitData = await submitRes.json();

        if (submitData.success) {
            isSubmitted = true;
            updateUISubmitted();
            alert("ส่งงานสำเร็จเรียบร้อย!");
        }
    } catch (err) {
        console.error("Submit Error:", err);
        alert("เกิดข้อผิดพลาด ลองใหม่อีกครั้ง");
    } finally {
        submitBtn.disabled = false;
    }
}
// เรียกทำงานทันทีที่โหลดหน้า
fetchAssignmentDetail();

// file selection
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(addFileCard);
    fileInput.value = ''; // same file can be re-added
});

// show file
function addFileCard(file) {
    uploadedFiles.push(file);

    const item = document.createElement('div');
    item.className = 'work-file-item';

    const thumb = document.createElement('div');
    thumb.className = 'work-thumb';

    // image preview
    if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = file.name;
        thumb.appendChild(img);
    } else {
        thumb.innerHTML = `<i class="fa-solid fa-file-lines" style="font-size: 40px; color: #aaa;"></i>`;
    }

    // remove file button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-file';
    removeBtn.innerHTML = '✕';
    removeBtn.addEventListener('click', () => {
        uploadedFiles = uploadedFiles.filter(f => f !== file);
        item.remove();
    });
    thumb.appendChild(removeBtn);

    // show file name
    const nameRow = document.createElement('div');
    nameRow.className = 'file-name';
    nameRow.textContent = file.name.length > 18 ? file.name.slice(0, 15) + '...' : file.name;

    item.appendChild(thumb);
    item.appendChild(nameRow);
    workFiles.appendChild(item);
}
// timestamp
function formatTimestamp(date) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${String(date.getFullYear()).slice(-2)}, ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// lock/unlock upload
function lockWorkBox(locked) {
    const addBtn = document.querySelector('.add-file-btn');
    const removeButtons = workFiles.querySelectorAll('.remove-file');
    if (locked) {
        addBtn.style.pointerEvents = 'none';
        addBtn.style.opacity = '0.5';
        removeButtons.forEach(b => b.style.display = 'none');
    } else {
        addBtn.style.pointerEvents = '';
        addBtn.style.opacity = '';
        removeButtons.forEach(b => b.style.display = 'flex');
    }
}

// submit button
submitBtn.addEventListener('click', () => {
    // Edit Submission
    if (isSubmitted) {
        if (confirm('Do you want to edit your submission? This will allow you to change files.')) {
            isSubmitted = false;

            submitBtn.textContent = 'Submit';
            submitBtn.classList.remove('submitted');

            lockWorkBox(false);

            //Timestamp
            const stamp = document.querySelector('.submit-timestamp');
            if (stamp) stamp.remove();
        }
    } else {
        handleSubmission();
    }


    /*isSubmitted = true;
    submitBtn.textContent = 'Edit Submission';
    submitBtn.classList.add('submitted');

    lockWorkBox(true);*/

});

// back button
const backBtn = document.getElementById('back-btn');

backBtn.addEventListener('click', () => {
    window.history.back();
});