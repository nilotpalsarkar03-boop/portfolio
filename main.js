(() => {
  // 1. Blueprint grid lines: 12-column grid on the 1440 frame (container edges + gutter centres)
  const colW = (1440 - 160 - 11 * 24) / 12;
  const xs = [80];
  for (let i = 0; i < 11; i++) xs.push(80 + (i + 1) * colW + i * 24 + 12);
  xs.push(1360);
  document.querySelectorAll('.bp').forEach(bp => {
    xs.forEach(x => {
      const s = document.createElement('span');
      s.style.left = (x / 1440 * 100) + '%';
      bp.appendChild(s);
    });
  });

  // 2. Live IST clock
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const tick = () => document.querySelectorAll('.ist-time').forEach(el => { el.textContent = fmt.format(new Date()) + ' IST'; });
  tick(); setInterval(tick, 30000);

  // 3. Scale the art-directed 1440×900 hero to fit narrower desktop screens
  const hero = document.querySelector('.hero');
  const fit = () => {
    const w = window.innerWidth;
    const s = w <= 820 ? 1 : Math.min(1, w / 1440);
    hero.style.setProperty('--s', s.toFixed(4));
  };
  fit(); window.addEventListener('resize', fit);

  // 4. "For general / For designers" tabs swap the Selected work section
  const section = document.getElementById('selected-work');
  const views = { general: section.querySelector('.view--general'), designers: section.querySelector('.view--designers') };
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const v = tab.dataset.view;
      if (section.dataset.view === v) return;
      section.dataset.view = v;
      document.querySelectorAll('.tab').forEach(t => { const on = t === tab; t.classList.toggle('is-active', on); t.setAttribute('aria-pressed', on); });
      Object.entries(views).forEach(([k, el]) => { el.hidden = k !== v; });
      views[v].classList.remove('is-entering'); void views[v].offsetWidth; views[v].classList.add('is-entering');
    });
  });
})();
