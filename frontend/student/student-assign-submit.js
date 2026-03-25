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
        return;
    }

    // Submit ครั้งแรก
    if (uploadedFiles.length === 0) {
        alert('Please upload at least one file before submitting.');
        return;
    }

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
});
