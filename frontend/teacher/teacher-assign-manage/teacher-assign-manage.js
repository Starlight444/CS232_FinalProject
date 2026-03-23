document.addEventListener('DOMContentLoaded', () => {
    // เลือกแท็บและตัวตารางมาเตรียมไว้
    const tabs = document.querySelectorAll('.tab-item');
    const tbody = document.querySelector('.grading-table tbody');

    // ข้อมูลจำลอง (Mock Data) สำหรับแต่ละหน้าให้ตรงกับ Figma
    const mockData = {
        'Needs Grading': [
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Submitted', file: 'assign_01.pdf', grade: '', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Submitted', file: 'assign_01.pdf', grade: '', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Submitted', file: 'assign_01.pdf', grade: '', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Submitted', file: 'assign_01.pdf', grade: '', hasFeedback: false }
        ],
        'Fully Graded': [
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Graded', file: 'assign_01.pdf', grade: '9', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Graded', file: 'assign_01.pdf', grade: '9', hasFeedback: true }, // มีจุดเขียวที่แชท
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Graded', file: 'assign_01.pdf', grade: '9', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Graded', file: 'assign_01.pdf', grade: '9', hasFeedback: true }  // มีจุดเขียวที่แชท
        ],
        'Missing': [
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Missing', file: null, grade: '0', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Missing', file: null, grade: '0', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Missing', file: null, grade: '0', hasFeedback: false },
            { id: '67091111111', name: 'นางสาวขวัญใจ เมืองน่าน', date: '12 Feb 2026', status: 'Missing', file: null, grade: '0', hasFeedback: false }
        ]
    };

    // ฟังก์ชันสร้างตารางใหม่ตามแท็บที่เลือก
    // ฟังก์ชันสร้างตารางใหม่ตามแท็บที่เลือก
    function renderTable(tabName) {
        tbody.innerHTML = ''; // ล้างข้อมูลเก่าออกก่อน
        const data = mockData[tabName];

        data.forEach(student => {
            const tr = document.createElement('tr');
            tr.className = 'table-row';

            // 1. จัดการสีของ Status และ ไอคอน (Iconify)
            let statusClass = '';
            let statusContent = ''; 

            if (student.status === 'Submitted') {
                statusClass = 'submitted'; 
                statusContent = `<div style="display: flex; align-items: center; gap: 6px; color: #28a745;">
                                    <span style="width: 8px; height: 8px; background-color: #28a745; border-radius: 50%; flex-shrink: 0;"></span>
                                    <span>${student.status}</span>
                                 </div>`;
            } 
            else if (student.status === 'Graded') {
                statusClass = 'graded'; 
                statusContent = `<div style="display: flex; align-items: center; gap: 6px; color: #6E6CDF;">
                                    <span style="width: 8px; height: 8px; background-color: #6E6CDF; border-radius: 50%; flex-shrink: 0;"></span>
                                    <span>${student.status}</span>
                                 </div>`;
            } 
            else if (student.status === 'Missing') {
                statusClass = 'missing'; 
                statusContent = `<div style="display: flex; align-items: center; gap: 6px; color: #DC3545;">
                                    <span style="width: 8px; height: 8px; background-color: #DC3545; border-radius: 50%; flex-shrink: 0;"></span>
                                    <span>${student.status}</span>
                                 </div>`;
            }

            // 2. จัดการช่องไฟล์แนบ
            let submissionContent = '';
            if (student.file) {
                submissionContent = `<button class="file-btn" type="button"><span class="icon icon-pdf">picture_as_pdf</span> ${student.file}</button>`;
            } else {
                submissionContent = `<span style="color: #9ca3af; font-size: 0.9rem;">No File</span>`;
            }

            // 3. จัดการจุดสีเขียวบนไอคอนแชท (Feedback)
            let feedbackIcon = student.hasFeedback
                ? `<div style="position: relative; display: inline-block;">
                       <span class="icon" style="color: #333;">chat</span>
                       <span style="position: absolute; top: -2px; right: -4px; width: 8px; height: 8px; background-color: #28a745; border-radius: 50%; border: 1.5px solid white;"></span>
                   </div>`
                : `<span class="icon">chat</span>`;

            // วาดโครงสร้าง HTML ของแต่ละแถว
            tr.innerHTML = `
                <td>${student.id}</td>
                <td>${student.name}</td>
                <td>${student.date}</td>
                <td class="status-cell ${statusClass}">${statusContent}</td>
                <td>${submissionContent}</td>
                <td><input type="text" class="grade-input" size="3" value="${student.grade}"></td>
                <td align="center"><button class="feedback-btn" type="button" style="background: none; border: none; cursor: pointer;">${feedbackIcon}</button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    // ฟังก์ชันดักจับการคลิกเปลี่ยนแท็บ
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            // ลบสีแท็บเก่าออกให้หมด
            tabs.forEach(t => t.classList.remove('active'));
            // ระบายสีแท็บใหม่ที่เพิ่งคลิก
            const clickedTab = e.currentTarget;
            clickedTab.classList.add('active');

            // เปลี่ยนข้อมูลในตาราง
            const tabName = clickedTab.textContent.trim();
            renderTable(tabName);
        });
    });

    // เปิดหน้ามาปุ๊บ ให้โชว์ข้อมูลหน้า Needs Grading ก่อนเลย
    renderTable('Needs Grading');
});