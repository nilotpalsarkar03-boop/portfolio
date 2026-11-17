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

  // 4. Content from the admin page (content/*.json). The HTML keeps a fallback copy if loading fails.
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const arrow = '<svg class="note__arrow" width="56" height="28" viewBox="0 -2 60 34" fill="none"><path d="M1 4C29 -2 47 8 57 30" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M50.5 25.3L57 30L57.8 22" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const $all = k => document.querySelectorAll(`[data-c="${k}"]`);
  const img = (p, label) => p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">` : esc(label);
  const tags = (p, n, tag = 'li') => (p.tags || []).slice(0, n).map(t => `<${tag} class="chip">${esc(t)}</${tag}>`).join('');
  const href = p => p.link ? `href="${esc(p.link)}" target="_blank" rel="noopener"` : 'href="#"';
  const num = i => String(i + 1).padStart(2, '0');
  const meta = p => [p.client, p.year].filter(Boolean).map(esc).join(' · ');

  function renderProjects(list) {
    const ps = (list || []).filter(p => p.visible !== false).slice(0, 6);
    if (!ps.length) return;
    const years = ps.map(p => p.year).filter(Boolean).sort();
    const countText = `${ps.length} project${ps.length > 1 ? 's' : ''}${years.length ? ' · ' + years[years.length - 1] : ''}`;
    $all('count').forEach(el => el.textContent = countText);

    const [f, ...rest] = ps;
    views.general.innerHTML = `
      <div class="featured">
        <div class="featured__media">
          <a class="sticker featured__sticker" ${href(f)} aria-label="Open ${esc(f.title)}"><span class="sticker__img">${img(f, 'Image')}</span></a>
          ${f.note ? `<p class="note featured__note" aria-hidden="true">${esc(f.note)}${arrow}</p>` : ''}
        </div>
        <div class="featured__info">
          <p class="display-l accent">01</p>
          <h3 class="h2">${esc(f.title)}</h3>
          <p class="body-m secondary">${esc(f.summary)}</p>
          <ul class="tags">${tags(f, 3)}</ul>
          <p class="label-s muted">${meta(f)}${f.role ? ' · ' + esc(f.role) : ''}</p>
          <a class="btn btn--primary" ${href(f)}>Read case study →</a>
        </div>
      </div>
      ${rest.length ? `<div class="index"><div class="kantha" aria-hidden="true"></div>${rest.map((p, i) => `
        <a class="irow" ${href(p)}>
          <span class="irow__num">${num(i + 1)}</span><span class="irow__title">${esc(p.title)}</span><span class="irow__spacer"></span>
          <span class="tags">${tags(p, 2, 'span')}</span><span class="label-s muted">${esc(p.year)}</span><span class="irow__arrow" aria-hidden="true"></span>
          <span class="sticker irow__preview" aria-hidden="true"><span class="sticker__img">${img(p, 'Image')}</span></span>
        </a>`).join('')}</div>` : ''}
      <a class="btn btn--secondary" href="#">View all work →</a>`;

    const card = (p, i, grid) => `
      <article class="pcard${grid ? '' : ' pcard--featured'}">
        <a class="pcard__img${grid ? ' pcard__img--grid' : ''}" ${href(p)}>${img(p, grid ? 'Project image · 3:2' : 'Project image · 16:7')}</a>
        <div class="pcard__body">
          <p class="pcard__meta"><span class="label-m accent">${num(i)}</span><span class="label-s muted">${meta(p)}</span></p>
          <h3 class="${grid ? 'h3' : 'h2'}">${esc(p.title)}</h3>
          <p class="body-m secondary">${esc(p.summary)}</p>
          <ul class="tags">${tags(p, 3)}</ul>
          <a class="btn btn--ghost" ${href(p)}>Read case study →</a>
        </div>
      </article>`;
    // Featured, then pairs in a 2-column grid, repeating: 1 big, 2 small, 1 big, 2 small…
    let html = '', i = 0, big = true;
    while (i < ps.length) {
      if (big || i === ps.length - 1) { html += card(ps[i], i, false); i++; }
      else { html += `<div class="pgrid">${card(ps[i], i, true)}${card(ps[i + 1], i + 1, true)}</div>`; i += 2; }
      big = !big;
    }
    views.designers.innerHTML = html;
  }

  function renderAbout(a) {
    if (!a) return;
    $all('status').forEach(el => el.hidden = a.open_to_work === false);
    [['hero_bio'], ['about_heading'], ['about_lead'], ['about_body']].forEach(([k]) => { if (a[k]) $all(k).forEach(el => el.textContent = a[k]); });
    if (Array.isArray(a.now) && a.now.length) $all('now').forEach(el => {
      el.innerHTML = a.now.map(n => `<div><dt class="label-s muted">${esc(n.label)}</dt><dd>${esc(n.text)}</dd></div>`).join('');
    });
  }

  function renderLinks(l) {
    if (!l) return;
    if (l.email) {
      $all('email').forEach(el => { el.textContent = l.email; el.href = 'mailto:' + l.email; });
      $all('mailto').forEach(el => el.href = 'mailto:' + l.email);
    }
    ['linkedin', 'behance', 'github'].forEach(k => $all(k).forEach(el => { if (l[k]) el.href = l[k]; else el.hidden = true; }));
    $all('resume').forEach(el => { if (l.resume) { el.href = l.resume; el.target = '_blank'; el.rel = 'noopener'; } });
  }

  const load = n => fetch(`/content/${n}.json`, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null);

  // 5. "For general / For designers" tabs swap the Selected work section
  const section = document.getElementById('selected-work');
  const views = { general: section.querySelector('.view--general'), designers: section.querySelector('.view--designers') };
  Promise.all([load('projects'), load('about'), load('links')]).then(([p, a, l]) => {
    if (p) renderProjects(p.projects); renderAbout(a); renderLinks(l);
  });
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
