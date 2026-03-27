// Calendar fix: September 2021 starts on Wednesday (index 3)
  // Rebuild calendar correctly
  const calGrid = document.querySelector('.cal-grid');
  const dayNames = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  calGrid.innerHTML = '';

  // Day name headers
  dayNames.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = d;
    calGrid.appendChild(el);
  });

  // Sep 2021 starts on Wednesday = index 3
  for (let i = 0; i < 3; i++) {
    const el = document.createElement('div');
    el.className = 'cal-day empty';
    calGrid.appendChild(el);
  }

  for (let d = 1; d <= 30; d++) {
    const el = document.createElement('div');
    el.className = 'cal-day';
    if (d === 19) el.classList.add('today');
    el.textContent = d;
    calGrid.appendChild(el);
  }

  // Nav highlight
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });