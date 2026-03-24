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

let uploadedFiles = [];

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

    // show file name
    const nameRow = document.createElement('div');
    nameRow.className = 'file-name';
    nameRow.textContent = file.name.length > 18 ? file.name.slice(0, 15) + '...' : file.name;

    item.appendChild(thumb);
    item.appendChild(nameRow);
    workFiles.appendChild(item);
}