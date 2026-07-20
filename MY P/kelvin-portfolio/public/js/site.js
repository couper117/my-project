/* =====================================================
   site.js — renders content from the API, plays the
   Lando-style animations, handles the contact form,
   and (when the admin is logged in) turns the whole
   page into an inline editor saved through the API.
===================================================== */
(function () {
  'use strict';

  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');

  let content = null;
  let editing = false;
  let isAdmin = false;

  async function api(url, opts = {}) {
    const res = await fetch(url, {
      headers: opts.body instanceof FormData ? {} : { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      ...opts,
      body: opts.body instanceof FormData ? opts.body : (opts.body ? JSON.stringify(opts.body) : undefined)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || ('Error ' + res.status));
    return data;
  }

  /* ---------------- theme ---------------- */
  $('theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
  });

  /* ---------------- menu ---------------- */
  const menu = $('menu');
  $('burger').addEventListener('click', () => menu.classList.add('open'));
  $('menu-close').addEventListener('click', () => menu.classList.remove('open'));
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));

  /* ---------------- custom cursor ---------------- */
  (function cursor() {
    if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const c = $('cursor');
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('mousemove', e => { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      x += (tx - x) * .18; y += (ty - y) * .18;
      c.style.transform = `translate(${x - 7}px,${y - 7}px)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', e => {
      c.classList.toggle('hovering', !!e.target.closest('a,button,.p-card,.soc-row'));
    });
  })();

  /* =====================================================
     RENDER
     data-edit="doc:<key>:<path>"  /  "item:<col>:<id>:<field>"
     data-editimg — same format, click-to-replace in edit mode
  ===================================================== */
  const de = (kind, a, b, c) => editing ? ` data-edit="${kind}:${a}:${b}${c !== undefined ? ':' + c : ''}"` : '';

  function bind(id, editRef, value, useRich) {
    const el = $(id);
    if (editing) {
      el.textContent = value ?? '';
      el.setAttribute('data-edit', editRef);
    } else {
      el.removeAttribute('data-edit');
      if (useRich) el.innerHTML = rich(value ?? '');
      else el.textContent = value ?? '';
    }
  }

  function render() {
    const d = content, p = d.profile;

    bind('nav-logo', 'doc:profile:logo', p.logo);
    $('hero-title').innerHTML = (p.nameLines || []).map((l, i) =>
      `<span class="line"><span${editing ? ` data-edit="doc:profile:nameLines.${i}"` : ''}>${esc(l)}</span></span>`).join('');
    bind('hero-role', 'doc:profile:role', p.role);
    bind('hero-meta', 'doc:profile:meta', p.meta);
    bind('hero-badge', 'doc:profile:badge', p.badge);
    bind('hero-next-label', 'doc:profile:nextLabel', p.nextLabel);
    bind('hero-next-value', 'doc:profile:nextValue', p.nextValue);
    bind('signature', 'doc:profile:signature', p.signature);
    const heroImg = $('hero-img');
    heroImg.src = p.photo;
    if (editing) heroImg.setAttribute('data-editimg', 'doc:profile:photo');
    else heroImg.removeAttribute('data-editimg');

    const cv = $('hero-cv');
    if (p.cvUrl) { cv.href = p.cvUrl; cv.classList.remove('hidden'); }
    else cv.classList.add('hidden');

    // marquee
    const mItems = d.marquee.map(x =>
      `<span${de('item', 'marquee', x.id, 'text')}><b>✦</b> ${esc(x.text)}${rm('marquee', x.id)}</span>`).join('');
    $('marquee-track').innerHTML = editing
      ? mItems + addBtn('marquee', '+ text')
      : mItems + mItems;

    // quotes
    bind('quote1-label', 'doc:quote1:label', d.quote1.label);
    bind('quote2-label', 'doc:quote2:label', d.quote2.label);
    renderQuote('quote1-text', 'quote1', d.quote1.text);
    renderQuote('quote2-text', 'quote2', d.quote2.text);

    // gallery
    bind('gallery-t1', 'doc:sections:galleryT1', d.sections.galleryT1);
    bind('gallery-t2', 'doc:sections:galleryT2', d.sections.galleryT2);
    $('g-track').innerHTML = d.gallery.map((g, i) => `
      <figure class="g-item" style="position:relative">
        ${rm('gallery', g.id)}
        <figcaption class="g-cap">
          <span${de('item', 'gallery', g.id, 'place')}>${esc(g.place)}</span>
          <b${de('item', 'gallery', g.id, 'year')}>${esc(g.year)}</b>
        </figcaption>
        <div class="g-img"><img src="${esc(g.img)}" alt="${esc(g.place)}" loading="lazy"${editing ? ` data-editimg="item:gallery:${g.id}:img"` : ''}></div>
        <span class="g-num">${String(i + 1).padStart(2, '0')}</span>
      </figure>`).join('') + (editing ? `<div style="align-self:center">${addBtn('gallery', '+ Add photo')}</div>` : '');

    // split
    bind('split-a1', 'doc:split:a1', d.split.a1);
    bind('split-a2', 'doc:split:a2', d.split.a2);
    bind('split-b1', 'doc:split:b1', d.split.b1);
    bind('split-b2', 'doc:split:b2', d.split.b2);
    bind('split-adesc', 'doc:split:aDesc', d.split.aDesc, true);
    bind('split-bdesc', 'doc:split:bDesc', d.split.bDesc, true);

    // projects
    bind('projects-t1', 'doc:sections:projectsT1', d.sections.projectsT1);
    bind('projects-t2', 'doc:sections:projectsT2', d.sections.projectsT2);
    bind('projects-desc', 'doc:sections:projectsDesc', d.sections.projectsDesc);
    $('p-grid').innerHTML = d.projects.map((pr, i) => `
      <a class="p-card" href="${esc(pr.link)}" target="_blank" rel="noopener">
        ${rm('projects', pr.id)}
        <span class="p-tag"${de('item', 'projects', pr.id, 'tag')}>${esc(pr.tag)}</span>
        <div class="p-img">
          ${pr.img
            ? `<img src="${esc(pr.img)}" alt="${esc(pr.title)}" loading="lazy"${editing ? ` data-editimg="item:projects:${pr.id}:img"` : ''}>`
            : `<div class="p-mono"${editing ? ` data-editimg="item:projects:${pr.id}:img"` : ''}>${esc((pr.title || 'P').slice(0, 1))}${String(i + 1).padStart(2, '0')}</div>`}
        </div>
        <div class="p-body">
          <h4${de('item', 'projects', pr.id, 'title')}>${esc(pr.title)}</h4>
          <span class="p-year"${de('item', 'projects', pr.id, 'year')}>${esc(pr.year)}</span>
        </div>
        <p class="p-desc"${de('item', 'projects', pr.id, 'desc')}>${esc(pr.desc)}</p>
        ${editing ? `<p class="p-desc" style="opacity:.7">link: <span data-edit="item:projects:${pr.id}:link">${esc(pr.link)}</span></p>` : ''}
      </a>`).join('') + (editing ? `<div class="add-wrap">${addBtn('projects', '+ Add project')}</div>` : '');

    // timeline
    bind('timeline-t1', 'doc:sections:timelineT1', d.sections.timelineT1);
    bind('timeline-t2', 'doc:sections:timelineT2', d.sections.timelineT2);
    $('tl-list').innerHTML = (d.timeline || []).map(t => `
      <div class="tl-row">
        ${rm('timeline', t.id)}
        <span class="tl-period"${de('item', 'timeline', t.id, 'period')}>${esc(t.period)}</span>
        <div>
          <div class="tl-title"${de('item', 'timeline', t.id, 'title')}>${esc(t.title)}</div>
          <div class="tl-org"${de('item', 'timeline', t.id, 'org')}>${esc(t.org)}</div>
        </div>
        <p class="tl-desc"${de('item', 'timeline', t.id, 'desc')}>${esc(t.desc)}</p>
      </div>`).join('') + (editing ? `<div class="add-wrap">${addBtn('timeline', '+ Add milestone')}</div>` : '');

    // skills
    bind('skills-t1', 'doc:sections:skillsT1', d.sections.skillsT1);
    bind('skills-t2', 'doc:sections:skillsT2', d.sections.skillsT2);
    const sHtml = d.skills.map(x =>
      `<span class="s-item"><span${de('item', 'skills', x.id, 'name')}>${esc(x.name)}</span>${rm('skills', x.id)}</span>`).join('');
    $('s-track-1').innerHTML = editing ? sHtml + addBtn('skills', '+ skill') : sHtml + sHtml;
    $('s-track-2').innerHTML = editing ? '' : sHtml + sHtml;

    // socials
    bind('socials-t1', 'doc:sections:socialsT1', d.sections.socialsT1);
    bind('socials-t2', 'doc:sections:socialsT2', d.sections.socialsT2);
    $('soc-list').innerHTML = d.socials.map(so => `
      <a class="soc-row" href="${esc(so.url)}" target="_blank" rel="noopener">
        ${rm('socials', so.id)}
        <span${de('item', 'socials', so.id, 'name')}>${esc(so.name)}</span>
        <span class="soc-handle"${de('item', 'socials', so.id, 'handle')}>${esc(so.handle)}${editing ? ` · <span data-edit="item:socials:${so.id}:url">${esc(so.url)}</span>` : ''}</span>
        <span class="arrow">↗</span>
      </a>`).join('') + (editing ? `<div class="add-wrap">${addBtn('socials', '+ Add link')}</div>` : '');

    // contact
    bind('contact-t1', 'doc:sections:contactT1', d.sections.contactT1);
    bind('contact-t2', 'doc:sections:contactT2', d.sections.contactT2);
    bind('contact-desc', 'doc:sections:contactDesc', d.sections.contactDesc);

    // footer
    bind('footer-big', 'doc:footer:big', d.footer.big);
    const mail = $('footer-mail');
    if (editing) { mail.textContent = d.footer.email; mail.setAttribute('data-edit', 'doc:footer:email'); }
    else { mail.removeAttribute('data-edit'); mail.textContent = d.footer.email; mail.href = 'mailto:' + d.footer.email; }
    bind('footer-tagline', 'doc:footer:tagline', d.footer.tagline);
    bind('footer-copyright', 'doc:footer:copyright', d.footer.copyright);
    bind('footer-credit', 'doc:footer:credit', d.footer.credit);

    document.title = `${(p.nameLines || []).join(' ').toUpperCase()} — ${p.role}`;

    if (editing) wireEditing();
  }

  const rm = (col, id) => editing ? `<button class="rm-x" data-rm="${col}:${id}" title="Remove">✕</button>` : '';
  const addBtn = (col, label) => `<button class="add-x" data-add="${col}">${esc(label)}</button>`;

  function renderQuote(id, docKey, text) {
    const el = $(id);
    if (editing) {
      el.textContent = text || '';
      el.setAttribute('data-edit', `doc:${docKey}:text`);
      return;
    }
    el.removeAttribute('data-edit');
    el.innerHTML = String(text || '').split(/\s+/).map(w => {
      const bold = /^\*\*.*\*\*[.,!?]?$/.test(w);
      const clean = esc(w.replace(/\*\*/g, ''));
      return `<span class="w">${bold ? `<b>${clean}</b>` : clean}</span>`;
    }).join(' ');
  }

  /* =====================================================
     ANIMATIONS
  ===================================================== */
  gsap.registerPlugin(ScrollTrigger);

  function runPreloader(then) {
    const count = document.querySelector('.pl-count');
    const bar = document.querySelector('.pl-bar i');
    const state = { v: 0 };
    gsap.timeline({ onComplete: then })
      .to('#pl-name-text', { y: 0, duration: .7, ease: 'power3.out' })
      .to(state, {
        v: 100, duration: 1.5, ease: 'power2.inOut',
        onUpdate: () => { count.textContent = Math.round(state.v); bar.style.width = state.v + '%'; }
      }, '<')
      .to('#preloader', { yPercent: -100, duration: .8, ease: 'power4.inOut', delay: .1 })
      .set('#preloader', { display: 'none' });
  }

  function heroIn() {
    gsap.to('#hero-title .line > span', { y: 0, duration: 1, ease: 'power4.out', stagger: .12 });
    gsap.timeline({ delay: .15 })
      .to('#hero-photo', { clipPath: 'inset(0% 0 0 0)', duration: 1.2, ease: 'power4.inOut' })
      .to('#hero-img', { scale: 1, duration: 1.6, ease: 'power3.out' }, '<.1')
      .to('#hero-img', { filter: 'grayscale(15%)', duration: 1.2 }, '<.4');
    gsap.fromTo('.hero-sub, .hero-next, .hero-scroll',
      { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: .8, stagger: .08, delay: .5 });
  }

  function initScroll() {
    if (editing) return;

    gsap.to('#hero-img', {
      yPercent: 10, scale: 1.08, ease: 'none',
      scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    const track = $('g-track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    if (dist() > 0) {
      gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '#gallery', start: 'top top', end: () => '+=' + dist(), scrub: 1, pin: true, invalidateOnRefresh: true }
      });
      document.querySelectorAll('.g-item img').forEach(img => {
        gsap.fromTo(img, { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: '#gallery', start: 'top top', end: () => '+=' + dist(), scrub: 1 }
        });
        img.style.filter = 'grayscale(85%)';
        ScrollTrigger.create({ trigger: img, start: 'top 85%', onEnter: () => gsap.to(img, { filter: 'grayscale(0%)', duration: .8 }) });
      });
    }

    ['quote1-text', 'quote2-text'].forEach(id => {
      const words = document.querySelectorAll('#' + id + ' .w');
      if (!words.length) return;
      gsap.to(words, {
        opacity: 1, stagger: .06, ease: 'none',
        scrollTrigger: { trigger: '#' + id, start: 'top 78%', end: 'bottom 45%', scrub: true }
      });
    });

    document.querySelectorAll('.g-head h3, .p-head h3, #skills h3, #socials h3, #timeline h3, #contact h3, .split-cell h3').forEach(h => {
      gsap.fromTo(h, { y: 60, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: h, start: 'top 88%' }
      });
    });

    gsap.utils.toArray('.p-card').forEach((c, i) => {
      gsap.fromTo(c, { y: 50, opacity: 0 }, {
        y: 0, opacity: 1, duration: .8, ease: 'power3.out', delay: (i % 3) * .08,
        scrollTrigger: { trigger: c, start: 'top 92%' }
      });
    });
    gsap.utils.toArray('.soc-row, .tl-row').forEach((r, i) => {
      gsap.fromTo(r, { x: -40, opacity: 0 }, {
        x: 0, opacity: 1, duration: .7, delay: (i % 6) * .05, ease: 'power3.out',
        scrollTrigger: { trigger: r, start: 'top 94%' }
      });
    });
    gsap.fromTo('footer .f-big', { y: 80, opacity: 0 }, {
      y: 0, opacity: 1, duration: 1, ease: 'power3.out',
      scrollTrigger: { trigger: 'footer', start: 'top 80%' }
    });

    ScrollTrigger.refresh();
  }

  /* =====================================================
     CONTACT FORM
  ===================================================== */
  $('contact-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.target, btn = f.querySelector('.c-send'), status = $('contact-status');
    const body = {
      name: f.name.value.trim(), email: f.email.value.trim(),
      message: f.message.value.trim(), website: f.website.value
    };
    status.className = 'c-status';
    if (!body.name || !body.email || !body.message) {
      status.textContent = 'Please fill in all fields.'; status.classList.add('err'); return;
    }
    btn.disabled = true; btn.textContent = 'Sending…';
    try {
      await api('/api/contact', { method: 'POST', body });
      status.textContent = 'Message sent — thank you! I will get back to you soon.';
      status.classList.add('ok');
      f.reset();
    } catch (err) {
      status.textContent = err.message; status.classList.add('err');
    }
    btn.disabled = false; btn.textContent = 'Send message →';
  });

  /* =====================================================
     ADMIN — inline editing on the live page
  ===================================================== */
  const BLANKS = {
    gallery: { img: '', place: 'New place', year: '2026' },
    projects: { title: 'New Project', year: '2026', tag: 'Web', desc: 'Describe it here.', link: 'https://github.com/couper117', img: '' },
    timeline: { period: '2026', title: 'New Milestone', org: 'Where', desc: 'What happened.' },
    skills: { name: 'New Skill' },
    socials: { name: 'New Link', handle: '@handle', url: 'https://' },
    marquee: { text: 'New text' }
  };

  async function checkAdmin() {
    try {
      const me = await api('/api/auth/me');
      isAdmin = true;
      $('ab-user').textContent = me.username;
      $('admin-bar').classList.remove('hidden');
    } catch { /* visitor */ }
  }

  $('ab-logout').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    location.reload();
  });

  $('ab-edit').addEventListener('click', enterEdit);
  $('ab-cancel').addEventListener('click', () => location.reload());
  $('ab-save').addEventListener('click', saveEdits);

  function enterEdit() {
    editing = true;
    document.documentElement.classList.add('editing');
    ScrollTrigger.getAll().forEach(t => t.kill());
    gsap.set('#g-track', { x: 0 });
    $('ab-edit').classList.add('hidden');
    $('ab-save').classList.remove('hidden');
    $('ab-cancel').classList.remove('hidden');
    $('edit-hint').classList.remove('hidden');
    render();
    gsap.set('#hero-title .line > span, .hero-sub, .hero-next', { clearProps: 'all' });
    gsap.set('#hero-photo', { clipPath: 'inset(0% 0 0 0)' });
    gsap.set('#hero-img', { scale: 1, filter: 'none' });
    document.querySelectorAll('.g-item img').forEach(i => i.style.filter = 'none');
    gsap.set('.p-card, .soc-row, .tl-row, footer .f-big, h3', { clearProps: 'all', opacity: 1 });
  }

  function wireEditing() {
    document.querySelectorAll('[data-edit]').forEach(el => {
      el.contentEditable = 'true';
      el.spellcheck = false;
    });
    document.querySelectorAll('[data-editimg]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault(); e.stopPropagation();
        pickImage(el.getAttribute('data-editimg'));
      });
    });
    document.querySelectorAll('[data-rm]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        if (!confirm('Remove this item?')) return;
        const [col, id] = btn.dataset.rm.split(':');
        try {
          await saveTexts();                       // don't lose typed edits
          await api(`/api/items/${col}/${id}`, { method: 'DELETE' });
          content = await api('/api/content');
          render();
        } catch (err) { alert(err.message); }
      });
    });
    document.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.preventDefault(); e.stopPropagation();
        const col = btn.dataset.add;
        try {
          await saveTexts();
          await api('/api/items/' + col, { method: 'POST', body: BLANKS[col] });
          content = await api('/api/content');
          render();
        } catch (err) { alert(err.message); }
      });
    });
  }

  let imgTarget = null;
  function pickImage(ref) {
    imgTarget = ref;
    $('edit-file').click();
  }
  $('edit-file').addEventListener('change', async function () {
    const file = this.files[0]; this.value = '';
    if (!file || !imgTarget) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const { url } = await api('/api/upload', { method: 'POST', body: fd });
      const parts = imgTarget.split(':');
      if (parts[0] === 'doc') {
        const doc = JSON.parse(JSON.stringify(content[parts[1]]));
        setPath(doc, parts[2], url);
        content[parts[1]] = await api('/api/docs/' + parts[1], { method: 'PUT', body: doc });
      } else {
        await api(`/api/items/${parts[1]}/${parts[2]}`, { method: 'PUT', body: { [parts[3]]: url } });
        content = await api('/api/content');
      }
      render();
    } catch (err) { alert(err.message); }
  });

  const setPath = (o, p, v) => {
    const ks = p.split('.'); const last = ks.pop();
    let t = o;
    for (const k of ks) { if (typeof t[k] !== 'object' || t[k] === null) t[k] = /^\d+$/.test(k) ? [] : {}; t = t[k]; }
    t[last] = v;
  };

  /* collect every edited text and push to the API */
  async function saveTexts() {
    const docs = {};      // key -> patched doc
    const items = {};     // col -> id -> fields
    document.querySelectorAll('[data-edit]').forEach(el => {
      const parts = el.getAttribute('data-edit').split(':');
      const val = el.innerText.trim();
      if (parts[0] === 'doc') {
        const key = parts[1];
        if (!docs[key]) docs[key] = JSON.parse(JSON.stringify(content[key]));
        setPath(docs[key], parts[2], val);
      } else {
        const [, col, id, field] = parts;
        (items[col] = items[col] || {});
        (items[col][id] = items[col][id] || {})[field] = val;
      }
    });
    for (const [key, doc] of Object.entries(docs)) {
      content[key] = await api('/api/docs/' + key, { method: 'PUT', body: doc });
    }
    for (const [col, byId] of Object.entries(items)) {
      for (const [id, fields] of Object.entries(byId)) {
        await api(`/api/items/${col}/${id}`, { method: 'PUT', body: fields });
      }
    }
  }

  async function saveEdits() {
    const btn = $('ab-save');
    btn.textContent = 'Saving…';
    try {
      await saveTexts();
      location.reload();
    } catch (err) {
      alert('Could not save: ' + err.message);
      btn.textContent = '✓ Save';
    }
  }

  /* =====================================================
     BOOT
  ===================================================== */
  Promise.all([
    api('/api/content'),
    checkAdmin()
  ]).then(([data]) => {
    content = data;
    render();
    runPreloader(heroIn);
    if (document.readyState === 'complete') initScroll();
    else window.addEventListener('load', initScroll);
  }).catch(err => {
    console.error(err);
    document.querySelector('.pl-name span').textContent = 'Could not load content — is the server running?';
    gsap.to('#pl-name-text', { y: 0, duration: .5 });
  });

  addEventListener('resize', () => { if (!editing) ScrollTrigger.refresh(); });
})();
