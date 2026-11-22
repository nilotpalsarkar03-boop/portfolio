(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // *word* in a title → rani pink
  const rich = s => esc(s).replace(/\*(.+?)\*/g, '<span class="rani">$1</span>');
  const $all = k => $$(`[data-c="${k}"]`);
  const onErr = 'onerror="this.hidden=true"';

  /* ---------- 1. Blueprint grid lines (12-col on the 1440 frame) ---------- */
  const colW = (1440 - 160 - 11 * 24) / 12;
  const xs = [80];
  for (let i = 0; i < 11; i++) xs.push(80 + (i + 1) * colW + i * 24 + 12);
  xs.push(1360);
  $$('.bp').forEach(bp => xs.forEach(x => {
    const s = document.createElement('span');
    s.style.left = (x / 1440 * 100) + '%';
    bp.appendChild(s);
  }));

  /* ---------- 2. Live IST clock ---------- */
  const fmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  const tick = () => $$('.ist-time').forEach(el => { el.textContent = fmt.format(new Date()) + ' IST'; });
  tick(); setInterval(tick, 30000);

  /* ---------- 3. Scale art-directed canvases (hero + collages) ---------- */
  const hero = $('.hero');
  const fit = () => {
    const w = window.innerWidth;
    if (hero) hero.style.setProperty('--s', (w <= 820 ? 1 : Math.min(1, w / 1440)).toFixed(4));
    $$('.art').forEach(a => {
      const cw = parseFloat(getComputedStyle(a).getPropertyValue('--w'));
      a.style.setProperty('--k', Math.min(1, a.clientWidth / cw).toFixed(4));
    });
  };
  fit(); addEventListener('resize', fit);

  /* ---------- 4. Reveal on scroll ---------- */
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { threshold: .12, rootMargin: '0px 0px -6% 0px' }) : null;
  const reveal = (root = document) => $$('.fade, .rv', root).forEach(el => {
    if (reduced || !io) el.classList.add('is-in'); else if (!el.classList.contains('is-in')) io.observe(el);
  });

  /* ---------- 5. Button arrows nudge on hover ---------- */
  const arrowCls = { '→': 'r', '↗': 'ne', '↑': 'u', '↓': 'd' };
  const arrows = (root = document) => $$('.btn', root).forEach(b => {
    if (b.dataset.arr) return; b.dataset.arr = 1;
    [...b.childNodes].forEach(n => {
      if (n.nodeType !== 3 || !/[→↗↑↓]/.test(n.nodeValue)) return;
      const span = document.createElement('span');
      span.innerHTML = esc(n.nodeValue).replace(/[→↗↑↓]/g, m => `<span class="arr arr--${arrowCls[m]}" aria-hidden="true">${m}</span>`);
      n.replaceWith(...span.childNodes);
    });
  });

  /* ---------- 6. Nav hides while scrolling down, returns on scroll up ---------- */
  const nav = $('.nav');
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
    if (y < lastY - 4 || y < 400) nav.classList.remove('is-hidden');
    lastY = y;
  }, { passive: true });

  /* ---------- 7. Toast ---------- */
  let toastT;
  const toast = msg => {
    $('.toast')?.remove(); clearTimeout(toastT);
    const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    document.body.appendChild(t); toastT = setTimeout(() => t.remove(), 2800);
  };

  /* ---------- 8. Email: copy on click too ---------- */
  $$('.email').forEach(a => a.addEventListener('click', () => {
    const v = a.textContent.trim();
    navigator.clipboard?.writeText(v).then(() => {
      a.querySelector('.copied')?.remove();
      const c = document.createElement('span'); c.className = 'copied'; c.textContent = 'copied ✓';
      a.appendChild(c); setTimeout(() => c.remove(), 1800);
    }).catch(() => {});
  }));

  /* ---------- Content from the admin page (content/*.json) ---------- */
  const load = n => fetch(`/content/${n}.json`, { cache: 'no-cache' }).then(r => r.ok ? r.json() : null).catch(() => null);
  // Images are served as-is (GitHub Pages has no image CDN); keep the helper so callers stay simple
  const cdn = src => src;
  const pic = (src, alt, w = 1600, cls = 'ph') => src
    ? `<img class="${cls}" src="${esc(cdn(src, w))}" alt="${esc(alt)}" loading="lazy" decoding="async" ${onErr}>` : '';

  function renderLinks(l) {
    if (!l) return;
    if (l.email) {
      $all('email').forEach(el => { el.firstChild.nodeValue = l.email; el.href = 'mailto:' + l.email; });
      $all('mailto').forEach(el => el.href = 'mailto:' + l.email);
    }
    ['linkedin', 'behance', 'github', 'instagram'].forEach(k => $all(k).forEach(el => { if (l[k]) el.href = l[k]; else el.hidden = true; }));
    $all('resume').forEach(el => { if (l.resume) { el.href = l.resume; el.target = '_blank'; el.rel = 'noopener'; } });
  }

  /* ================= HOME ================= */
  const section = $('#selected-work');
  if (section) {
    const views = { general: $('.view--general', section), designers: $('.view--designers', section) };
    const href = p => p.link ? `href="${esc(p.link)}" target="_blank" rel="noopener"` : 'href="#"';
    const num = i => String(i + 1).padStart(2, '0');
    const meta = p => [p.client, p.year].filter(Boolean).map(esc).join(' · ');
    const tags = (p, n, tag = 'li') => (p.tags || []).slice(0, n).map(t => `<${tag} class="chip">${esc(t)}</${tag}>`).join('');
    const plain = s => String(s || '').replace(/\*/g, '');

    function renderProjects(list) {
      const ps = (list || []).filter(p => p.visible !== false).slice(0, 6);
      if (!ps.length) return;
      const years = ps.map(p => p.year).filter(Boolean).sort();
      const countText = `${ps.length} project${ps.length > 1 ? 's' : ''}${years.length ? ' · ' + years[years.length - 1] : ''}`;
      $all('count').forEach(el => el.textContent = countText);

      const [f, ...rest] = ps;
      views.general.innerHTML = `
        <div class="featured fade">
          <div class="featured__media">
            <a class="sticker featured__sticker" ${href(f)} aria-label="Open ${esc(plain(f.title))}"><span class="sticker__img">Image${pic(f.cover, plain(f.title))}</span></a>
            ${f.note ? `<p class="note featured__note" aria-hidden="true">${esc(f.note)}</p>` : ''}
          </div>
          <div class="featured__info">
            <p class="display-l accent">01</p>
            <h3 class="h2">${rich(f.title)}</h3>
            ${f.summary ? `<p class="body-m secondary">${esc(f.summary)}</p>` : ''}
            <ul class="tags">${tags(f, 3)}</ul>
            <p class="label-s muted">${meta(f)}${f.role ? ' · ' + esc(f.role) : ''}</p>
            <a class="btn btn--primary" ${href(f)}>Read case study →</a>
          </div>
        </div>
        ${rest.length ? `<div class="index fade"><div class="kantha" aria-hidden="true"></div>${rest.map((p, i) => `
          <a class="irow" ${href(p)}>
            <span class="irow__num">${num(i + 1)}</span><span class="irow__title">${rich(p.title)}</span><span class="irow__spacer"></span>
            <span class="tags">${tags(p, 3, 'span')}</span><span class="label-s muted irow__year">${esc(p.year)}</span><span class="irow__arrow" aria-hidden="true"></span>
            <span class="sticker irow__preview" aria-hidden="true"><span class="sticker__img">Image${pic(p.cover, '', 480)}</span></span>
          </a>`).join('')}</div>` : ''}
        <a class="btn btn--outline" href="#">View all work →</a>`;

      const card = (p, i, grid) => {
        const src = p.card_image || p.cover;
        return `
        <article class="pcard fade${grid ? ' pcard--grid' : ''}">
          <a class="pcard__img${grid ? ' pcard__img--grid' : ''}${src ? ' has-img' : ''}" ${href(p)} aria-label="Open ${esc(plain(p.title))}">
            ${src ? pic(src, plain(p.title), 1600) : `<span>${grid ? 'Project image · 3:2' : 'Project image · 16:7'}</span>`}
            ${p.card_label ? `<span class="pcard__label${i === 0 ? ' pcard__label--subtle' : ''}">${esc(p.card_label)}</span>` : ''}
          </a>
          <div class="pcard__body">
            <p class="pcard__meta"><span class="label-m accent">${num(i)}</span><span class="label-s muted">${meta(p)}</span></p>
            <h3 class="${grid ? 'h3' : 'h2'}">${rich(p.title)}</h3>
            ${p.summary ? `<p class="body-m secondary">${esc(p.summary)}</p>` : ''}
            <ul class="tags">${tags(p, 3)}</ul>
            <a class="btn btn--ghost" ${href(p)}>Read case study →</a>
          </div>
        </article>`;
      };
      // 1 big, 2 small, 1 big, 2 small…
      let html = '', i = 0, big = true;
      while (i < ps.length) {
        if (big || i === ps.length - 1) { html += card(ps[i], i, false); i++; }
        else { html += `<div class="pgrid">${card(ps[i], i, true)}${card(ps[i + 1], i + 1, true)}</div>`; i += 2; }
        big = !big;
      }
      views.designers.innerHTML = html;
      wireRows(); arrows(section); reveal(section);
    }

    // The hover preview card follows the cursor along the row
    function wireRows() {
      $$('.irow', section).forEach(r => r.addEventListener('mousemove', e => {
        const b = r.getBoundingClientRect();
        r.style.setProperty('--px', Math.max(120, Math.min(b.width - 260, e.clientX - b.left - 100)) + 'px');
      }));
    }
    wireRows();

    function renderAbout(a) {
      if (!a) return;
      $all('status').forEach(el => el.hidden = a.open_to_work === false);
      ['hero_bio', 'about_heading', 'about_lead', 'about_body'].forEach(k => { if (a[k]) $all(k).forEach(el => el.textContent = a[k]); });
      if (Array.isArray(a.now) && a.now.length) $all('now').forEach(el => {
        el.innerHTML = a.now.map(n => `<div><dt class="label-s muted">${esc(n.label)}</dt><dd>${esc(n.text)}</dd></div>`).join('');
      });
    }

    // Tabs: For general / For designers. The designers version drops the YouTube section
    // and can be linked directly as nilotpaldesign.com/?for=designers
    const setView = (v, animate = true) => {
      if (!views[v]) v = 'general';
      section.dataset.view = v;
      document.body.dataset.view = v;
      $$('.tab').forEach(t => { const on = t.dataset.view === v; t.classList.toggle('is-active', on); t.setAttribute('aria-pressed', on); });
      Object.entries(views).forEach(([k, el]) => { el.hidden = k !== v; });
      if (animate) { views[v].classList.remove('is-entering'); void views[v].offsetWidth; views[v].classList.add('is-entering'); }
      reveal(views[v]);
      fit();
    };
    $$('.tab').forEach(tab => tab.addEventListener('click', () => {
      const v = tab.dataset.view;
      if (section.dataset.view === v) return;
      setView(v);
      const u = new URL(location.href);
      if (v === 'designers') u.searchParams.set('for', 'designers'); else u.searchParams.delete('for');
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    }));
    if (new URLSearchParams(location.search).get('for') === 'designers') setView('designers', false);

    Promise.all([load('projects'), load('about'), load('youtube')]).then(([p, a, y]) => {
      if (p) renderProjects(p.projects); renderAbout(a); renderYouTube(y);
    });
  }

  /* ---------- YouTube (home) ---------- */
  const ytId = u => (String(u || '').match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/) || [])[1];
  const play = (box, id) => {
    if (!id) return false;
    box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    return true;
  };
  function renderYouTube(y) {
    const sec = $('#youtube'); if (!sec) return;
    if (y && y.show_section === false) { sec.hidden = true; return; }
    const ch = y && (y.channel_url || (y.channel_handle ? 'https://www.youtube.com/' + (y.channel_handle.startsWith('@') ? '' : '@') + y.channel_handle : ''));
    if (ch) {
      $all('yt_channel').forEach(a => a.href = ch);
      $all('yt_subscribe').forEach(a => a.href = ch.replace(/\/$/, '') + '?sub_confirmation=1');
    }
    const vids = ((y && y.videos) || []).filter(v => v.visible !== false && ytId(v.link)).slice(0, 4);
    const thumbUrl = v => v.thumbnail ? cdn(v.thumbnail, 1280) : `https://i.ytimg.com/vi/${ytId(v.link)}/maxresdefault.jpg`;
    const thumbImg = v => `<img class="ph" src="${esc(thumbUrl(v))}" alt="" loading="lazy" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='https://i.ytimg.com/vi/${ytId(v.link)}/hqdefault.jpg'}else{this.hidden=true}">`;
    if (vids.length) {
      const [f, ...rest] = vids;
      const feat = $('[data-yt="feat"]', sec);
      $('.yt-thumb', feat).innerHTML = `${thumbImg(f)}<span class="yt-play" aria-hidden="true"></span>${f.duration ? `<span class="yt-dur">${esc(f.duration)}</span>` : ''}`;
      $('[data-yt="title"]', feat).textContent = f.title || 'Latest video';
      const d = $('[data-yt="desc"]', feat); d.textContent = f.description || ''; d.hidden = !f.description;
      const chips = [f.duration, ...String(f.meta || '').split('·')].map(s => (s || '').trim()).filter(Boolean);
      $('[data-yt="chips"]', feat).innerHTML = chips.map(c => `<li class="chip">${esc(c)}</li>`).join('');
      $('[data-yt="watch"]', feat).href = f.link;
      const row = $('[data-yt="row"]', sec);
      const more = $('.yt-more', sec), kan = $('.kantha', sec);
      if (rest.length) {
        row.innerHTML = rest.map((v, i) => `
          <a class="ycard fade" style="--d:${i * .08}s" href="${esc(v.link)}" target="_blank" rel="noopener" data-id="${ytId(v.link)}">
            <span class="yt-thumb">${thumbImg(v)}<span class="yt-play yt-play--s" aria-hidden="true"></span>${v.duration ? `<span class="yt-dur">${esc(v.duration)}</span>` : ''}</span>
            ${v.meta ? `<span class="label-s muted">${esc(v.meta)}</span>` : ''}<span class="ycard__title">${esc(v.title || 'Watch on YouTube')}</span>
          </a>`).join('');
      } else { row.hidden = more.hidden = kan.hidden = true; }
      feat.dataset.id = ytId(f.link);
      // Fill in missing titles from YouTube (via noembed, which allows browser requests)
      vids.forEach((v, i) => {
        if (v.title) return;
        fetch('https://noembed.com/embed?url=' + encodeURIComponent(v.link)).then(r => r.json()).then(j => {
          if (!j.title) return;
          if (i === 0) $('[data-yt="title"]', feat).textContent = j.title;
          else { const t = $$('.ycard__title', row)[i - 1]; if (t) t.textContent = j.title; }
        }).catch(() => {});
      });
      reveal(sec);
    }
    // Play right on the page
    sec.addEventListener('click', e => {
      const ft = e.target.closest('.yt-feat .yt-thumb');
      if (ft) { if (!play(ft, $('[data-yt="feat"]', sec).dataset.id)) location.href = $('[data-yt="watch"]', sec).href; return; }
      const card = e.target.closest('.ycard[data-id]');
      if (card && !e.metaKey && !e.ctrlKey) { e.preventDefault(); play($('.yt-thumb', card), card.dataset.id); }
    });
  }

  /* ================= PLAYGROUND ================= */
  const isPg = document.body.classList.contains('page-pg');
  if (isPg) {
    /* --- "No" sticker: says no in five languages --- */
    const NO = [['না', 'Bengali', 'bn'], ['नहीं', 'Hindi', 'hi'], ['নহয়', 'Assamese', 'as'], ['இல்லை', 'Tamil', 'ta'], ['No', 'English', 'en']];
    let ni = 0;
    const nbtn = $('.nostk__btn'), bub = $('.nostk__bubble');
    nbtn?.addEventListener('click', () => {
      ni = (ni + 1) % NO.length;
      const [w, l, code] = NO[ni];
      const word = $('.nostk__word', bub);
      word.textContent = w; word.lang = code; $('.nostk__lang', bub).textContent = l;
      [nbtn, bub].forEach((el, j) => { const c = j ? 'is-pop' : 'is-wiggle'; el.classList.remove(c); void el.offsetWidth; el.classList.add(c); });
    });

    /* --- Stickers --- */
    const grid = $('[data-c="stk_grid"]');
    let stickers = [];
    const SEED = ['Na logo', 'Cha lover', 'Blue lotus', 'Nomoshkar', 'Solder & chill', 'ESP32 inside', 'Kantha stitch', '404: Na'].map((n, i) => ({ name: n, year: '2026', size: '5 cm', status: 'available', category: ['bengali', 'bengali', 'bengali', 'bengali', 'tech', 'tech', 'doodles', 'doodles'][i], shape: [0, 1, 0, 0, 1, 0, 1, 0][i] ? 'square' : 'round' }));
    function renderStickers(data) {
      const list = (data && data.stickers || SEED).filter(s => s.visible !== false);
      stickers = list;
      const avail = list.filter(s => s.status !== 'soon');
      const soon = list.filter(s => s.status === 'soon');
      const cells = avail.map(s => `
        <div class="stk${s.shape === 'square' ? ' stk--square' : ''}" data-cat="${esc(s.category || 'doodles')}">
          <button class="stk__art" type="button" data-i="${list.indexOf(s)}" aria-label="Download the ${esc(s.name)} sticker">
            <span class="stk__in">${s.image ? `<img src="${esc(cdn(s.image, 480))}" alt="" loading="lazy" ${onErr}>` : 'Sticker art'}</span>
            <span class="stk__chip">↓ PNG · ${esc(s.size || '5 cm')}</span>
          </button>
          <p class="label-s">Sticker / ${esc(s.name)} / ${esc(s.year || '')}</p>
        </div>`);
      const soonCell = SOON.replace(' stk--pad', '');
      grid.innerHTML = cells.join('') + soon.map(() => soonCell).join('');
      grid.dataset.soon = soon.length;
      padSoon();
      $all('stk_count').forEach(el => el.textContent = avail.length);
      const sheet = $('[data-c="full_sheet"]');
      if (data && data.full_sheet) { sheet.href = data.full_sheet; sheet.setAttribute('download', ''); }
      else sheet.addEventListener('click', e => { e.preventDefault(); toast('The full A4 sheet is still at the printer — soon!'); });
      enter($$('.stk', grid));
    }
    // Fill the last row with "new sticker soon" slots, whatever the column count
    const SOON = `<div class="stk stk--soon stk--pad" data-cat="soon"><div class="stk__soon"><span>new sticker<br>soon</span></div><p class="label-s muted">Coming soon</p></div>`;
    function padSoon() {
      if (!grid) return;
      $$('.stk--pad', grid).forEach(el => el.remove());
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const vis = $$('.stk', grid).filter(el => !el.classList.contains('is-out'));
      let pad = (cols - vis.length % cols) % cols;
      if (!vis.some(el => el.dataset.cat === 'soon') && !pad) pad = cols;
      const on = ($('.filter.is-on') || {}).dataset?.f || 'all';
      if (on === 'all') grid.insertAdjacentHTML('beforeend', SOON.repeat(pad));
    }
    let lastCols = 0;
    addEventListener('resize', () => { const n = grid && getComputedStyle(grid).gridTemplateColumns.split(' ').length; if (n !== lastCols) { lastCols = n; padSoon(); } });
    const enter = els => els.forEach((el, i) => { el.style.setProperty('--d', (i * .04) + 's'); el.classList.remove('is-enter'); void el.offsetWidth; el.classList.add('is-enter'); });
    $$('.filter').forEach(b => b.addEventListener('click', () => {
      $$('.filter').forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b); });
      const f = b.dataset.f;
      $$('.stk--pad', grid).forEach(el => el.remove());
      $$('.stk', grid).forEach(el => { const on = f === 'all' || el.dataset.cat === f; el.classList.toggle('is-out', !on); });
      padSoon();
      enter($$('.stk', grid).filter(el => !el.classList.contains('is-out')));
    }));
    grid?.addEventListener('click', e => {
      const art = e.target.closest('.stk__art'); if (!art) return;
      const s = stickers[+art.dataset.i];
      art.classList.remove('is-peel'); void art.offsetWidth; art.classList.add('is-peel');
      const file = s.download || s.image;
      if (!file) { toast(`“${s.name}” is still at the printer — check back soon!`); return; }
      const a = document.createElement('a'); a.href = file; a.download = ''; document.body.appendChild(a); a.click(); a.remove();
      toast(`Downloading “${s.name}” ↓ print at 100%`);
    });

    /* --- Toolbox: draggable tool stickers --- */
    const TOOLS = [
      ['Serviece', 'haldi', 97.6, 55.9, 6.66, 19.6], ['Figma', 'white', 290, 34.6, -9.85, 19.3], ['Product Design', 'ink', 549.4, 43.4, -7.31, 20.3],
      ['Soldering iron', 'accent', 736, 77.2, 6.89, 20.8], ['Illustrator', 'rani', 930.5, 65.7, .33, 20.9], ['sticker Design', 'haldi', 1120.3, 107.1, -12.22, 17.4],
      ['VS Code', 'accent', 147.3, 202.2, 8.08, 17], ['Sketchbook', 'rani', 329.5, 159.5, 5.7, 19.1], ['After effect', 'haldi', 550.3, 209.7, 6.95, 17.3],
      ['Rhino 3D', 'white', 707.1, 184.8, -7.09, 19.9], ['Case study', 'ink', 933.8, 196.1, -11.08, 18.6], ['Premiere Pro', 'accent', 1220.9, 188.3, 6.86, 17.8],
      ['Fineliners', 'white', 113.1, 305.1, -3.97, 20.4], ['syetem', 'ink', 266.9, 305.8, 10.66, 17.1], ['Giga mapping', 'accent', 514.9, 300.1, -3.82, 16.4],
      ['Photoshop', 'rani', 727.3, 304, .11, 22.8], ['Graph editor', 'haldi', 954.4, 301.5, 1.58, 19.2], ['Unity', 'white', 1085.2, 316.1, 9.57, 18]
    ];
    const tbox = $('[data-c="tools"] .art__in');
    if (tbox) {
      tbox.insertAdjacentHTML('afterbegin', TOOLS.map(([t, c, x, y, r, fs], i) =>
        `<span class="tool tool--${c}" style="--cx:${x}px;--cy:${y}px;--r:${r}deg;--fs:${fs}px;--d:${(i * .035).toFixed(3)}s">${esc(t)}</span>`).join(''));
      let z = 10;
      $$('.tool', tbox).forEach(el => {
        let sx, sy, bx = 0, by = 0, moved = 0;
        el.addEventListener('pointerdown', e => {
          el.setPointerCapture(e.pointerId);
          sx = e.clientX; sy = e.clientY; moved = 0;
          bx = parseFloat(el.style.getPropertyValue('--dx')) || 0; by = parseFloat(el.style.getPropertyValue('--dy')) || 0;
          el.classList.add('is-drag', 'is-moved'); el.style.setProperty('--z', ++z);
        });
        el.addEventListener('pointermove', e => {
          if (!el.classList.contains('is-drag')) return;
          const k = tbox.getBoundingClientRect().width / tbox.offsetWidth || 1;
          const dx = (e.clientX - sx) / k, dy = (e.clientY - sy) / k;
          moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
          el.style.setProperty('--dx', bx + dx + 'px'); el.style.setProperty('--dy', by + dy + 'px');
        });
        const end = () => {
          if (!el.classList.contains('is-drag')) return;
          el.classList.remove('is-drag');
          if (moved < 4) { // a tap: give it a little flip
            const r = parseFloat(el.style.getPropertyValue('--r'));
            el.style.setProperty('--r', (r > 0 ? r - 360 : r + 360) + 'deg');
          } else el.style.setProperty('--r', (Math.random() * 24 - 12).toFixed(1) + 'deg');
        };
        el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
      });
    }

    /* --- Notebook: tick lines on and off --- */
    const NOTES = [[1, 'i need to done with my minor project'], [0, 'Preparing for my masters exam'], [0, 'Portfolio is still not finish ,OOMG!!'], [1, 'Yes!!  script for new yt video is done']];
    const nb = $('[data-c="notebook"]');
    if (nb) {
      let deco = '';
      for (let i = 0; i < 9; i++) deco += `<span class="nb__line" style="top:${110 + i * 48}px"></span><span class="nb__hole" style="top:${40 + i * 56}px"></span>`;
      nb.insertAdjacentHTML('afterbegin', deco);
      const box = '<span class="nb__box" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><rect class="nb__sq" x="8" y="8" width="13" height="13" rx="1.5" stroke="#57544E" stroke-width="1.6"/><path class="nb__ck" d="M5 15.5l6 6.5L24 6" stroke="#3D4FD6" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
      $('.nb__list', nb).innerHTML = NOTES.map(([d, t]) => `<li><button class="nb__item${d ? ' is-done' : ''}" type="button" aria-pressed="${!!d}">${box}<span class="nb__txt">${esc(t)}</span></button></li>`).join('');
      nb.addEventListener('click', e => {
        const it = e.target.closest('.nb__item'); if (!it) return;
        const on = it.classList.toggle('is-done'); it.setAttribute('aria-pressed', on);
        if (on && $$('.nb__item', nb).every(x => x.classList.contains('is-done'))) toast('Everything ticked. Time for chai ☕');
      });
    }

    Promise.all([load('stickers')]).then(([s]) => renderStickers(s));
  }

  load('links').then(renderLinks);
  arrows(); reveal(); fit();
})();
