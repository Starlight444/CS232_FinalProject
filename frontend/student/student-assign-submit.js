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
<<<<<<< HEAD
const backBtn = document.getElementById('back-btn');

// back button
backBtn.addEventListener('click', () => {
    window.location.href = 'student-all-assign.html';
});
=======
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e

let uploadedFiles = [];
let isSubmitted = false;

// api
const BASE_URL = 'http://localhost:3000';

// ดึงข้อมูล User และ Token จาก localStorage
//const userData = JSON.parse(localStorage.getItem("user"));
//if (!userData || !userData.token) {
//console.warn("No token found, redirecting to login...");
// window.location.href = "../auth/login.html"; // เปิดใช้เมื่อพร้อม
//}
//const TOKEN = userData ? userData.token : '';
const TOKEN = 'test-token'; // เป็นแบบนี้ชั่วคราวเพื่อเช็คว่า API เชื่อมติดไหม

const urlParams = new URLSearchParams(window.location.search);
<<<<<<< HEAD
const assignment_id = new URLSearchParams(window.location.search).get('id'); // ดึง ID จาก URL (?id=uuid)

// ตรวจสอบ ID ก่อนเริ่มทำงาน
if (!assignment_id) {
    console.error("No assignment ID found");
=======
const assignment_Id = new URLSearchParams(window.location.search).get('id'); // ดึง ID จาก URL (?id=uuid)

// ตรวจสอบ ID ก่อนเริ่มทำงาน
if (!assignment_Id) {
    console.error("No assignment ID found"); // ตรงกับ Error ในภาพ
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e
    alert("ไม่พบรหัสการบ้าน กรุณากลับไปเลือกการบ้านใหม่อีกครั้ง");
}

// ฟังก์ชันดึงข้อมูลการบ้านมาโชว์ 
async function fetchAssignmentDetail() {
<<<<<<< HEAD

    try {
        const response = await fetch(`${BASE_URL}/assignments/${assignment_id}`, {
=======
    if (!assignment_Id) return console.error("No assignment ID found");
    try {
        const response = await fetch(`${BASE_URL}/assignments/${assignment_Id}`, {
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const json = await response.json();

        if (json.success) {
            const data = json.data;
            document.querySelector('.assign-header .assign-title').textContent = data.title;
            document.querySelector('.assign-due').textContent = `Due date on ${formatTimestamp(new Date(data.due_date))}`;
            document.querySelector('.section-body').textContent = data.description;
            document.querySelector('.assign-points').textContent = `${data.max_score} Points`;

            // ตรวจสอบว่าเคยส่งงานนี้ไปหรือยัง (ถ้ามี API Get Submission)
            checkCurrentSubmission();
        }
    } catch (err) {
        console.error("Fetch Assignment Error:", err);
    }
}

<<<<<<< HEAD
function updateUISubmitted() {
    isSubmitted = true;
    submitBtn.textContent = 'Edit Submission';
    submitBtn.classList.add('submitted');
    lockWorkBox(true);

    // Timestamp 
    const bar = submitBtn.parentElement;
    if (!document.querySelector('.submit-timestamp')) {
        const stamp = document.createElement('p');
        stamp.className = 'submit-timestamp';
        stamp.innerHTML = `<i class="fa-regular fa-circle-check"></i> Submitted on ${formatTimestamp(new Date())}`;
        bar.appendChild(stamp);
    }


}
// เพิ่มฟังก์ชันนี้
async function checkCurrentSubmission() {
    // ดึงข้อมูลการส่งงานเดิม (ถ้ามี API)
    // ตัวอย่าง: ถ้า API ยังไม่พร้อมให้ปล่อยว่างไว้ก่อน
}

=======
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e
// api : submission
async function handleSubmission() {
    if (uploadedFiles.length === 0) {
        alert('Please upload at least one file before submitting.');
        return;
    }

    try {
        // เปลี่ยนสถานะปุ่มเป็น Loading
        submitBtn.disabled = true;
        submitBtn.textContent = 'Uploading...';

        // Upload File 
        const formData = new FormData();
        if (uploadedFiles.length > 0) {
            formData.append('file', uploadedFiles[0]);
<<<<<<< HEAD
            formData.append('assignment_id', assignment_id);
=======
            formData.append('assignment_id', assignmentId);
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e
        }

        const uploadRes = await fetch(`${BASE_URL}/attachments`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${TOKEN}` },
            body: formData
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error("Upload Failed");

        const fileUrl = uploadData.data.file_url;

        // api : submit assihnment 
<<<<<<< HEAD
        const submitRes = await fetch(`${BASE_URL}/assignments/${assignment_id}/submit`, {
=======
        const submitRes = await fetch(`${BASE_URL}/assignments/${assignmentId}/submit`, {
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file_url: fileUrl })
        });
        const submitData = await submitRes.json();

        if (submitData.success) {
            isSubmitted = true;
            updateUISubmitted();
            alert("ส่งงานสำเร็จเรียบร้อย!");
<<<<<<< HEAD
            // Timestamp 
            const bar = submitBtn.parentElement;
            if (!document.querySelector('.submit-timestamp')) {
                const stamp = document.createElement('p');
                stamp.className = 'submit-timestamp';
                stamp.innerHTML = `<i class="fa-regular fa-circle-check"></i> Submitted on ${formatTimestamp(new Date())}`;
                bar.appendChild(stamp);
            }
=======
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e
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


<<<<<<< HEAD
=======
    /*isSubmitted = true;
    submitBtn.textContent = 'Edit Submission';
    submitBtn.classList.add('submitted');

    lockWorkBox(true);*/

    // Timestamp 
    const bar = submitBtn.parentElement;
    if (!document.querySelector('.submit-timestamp')) {
        const stamp = document.createElement('p');
        stamp.className = 'submit-timestamp';
        stamp.innerHTML = `<i class="fa-regular fa-circle-check"></i> Submitted on ${formatTimestamp(new Date())}`;
        bar.appendChild(stamp);
    }
>>>>>>> c7453da1a242c45ef3a1160339dbd3f11b4ec35e
});
