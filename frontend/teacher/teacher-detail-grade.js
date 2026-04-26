const students = [
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
  { id: "6709111111", name: "นางสาววัญโอ เมืองน่าน", a1: 12, a2: 18, midterm: 40 },
];

const editSVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
</svg>`;

function renderTable(data) {
  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";
  data.forEach((s, i) => {
    const total = s.a1 + s.a2 + s.midterm;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${s.id}</td>
      <td>${s.name}</td>
      <td>${s.a1}</td>
      <td>${s.a2}</td>
      <td>${s.midterm}</td>
      <td class="total">${total}</td>
      <td><button class="edit-btn">${editSVG}</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// Search filter
document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.toLowerCase();
  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(q) || s.id.includes(q)
  );
  renderTable(filtered);
});

renderTable(students);