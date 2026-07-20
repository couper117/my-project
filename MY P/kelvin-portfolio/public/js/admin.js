/* =====================================================
   admin.js — schema-driven CRUD dashboard.
===================================================== */
(function () {
  'use strict';

  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------------- api helper ---------------- */
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

  function toast(msg, isErr) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'show' + (isErr ? ' err' : '');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.className = '', 2600);
  }

  /* ---------------- schemas ---------------- */
  const DOC_TABS = {
    profile: {
      title: 'Profile', desc: 'Your identity — hero section content.',
      fields: [
        { k: 'nameLines.0', label: 'Name — line 1' },
        { k: 'nameLines.1', label: 'Name — line 2' },
        { k: 'logo', label: 'Logo text (top-left)' },
        { k: 'role', label: 'Role / title' },
        { k: 'meta', label: 'Meta line (school, city, age)' },
        { k: 'badge', label: 'Photo badge' },
        { k: 'nextLabel', label: '"Currently" label' },
        { k: 'nextValue', label: '"Currently" value' },
        { k: 'signature', label: 'Signature' },
        { k: 'photo', label: 'Hero photo', type: 'image' },
        { k: 'cvUrl', label: 'CV file (PDF — shows "Download CV" button)', type: 'image' }
      ]
    },
    quote1: {
      title: 'Message', desc: 'First big quote. Wrap words in **stars** to highlight them.',
      fields: [{ k: 'label', label: 'Small label' }, { k: 'text', label: 'Quote text', type: 'textarea' }]
    },
    quote2: {
      title: 'Philosophy', desc: 'Second big quote. **stars** = highlighted words.',
      fields: [{ k: 'label', label: 'Small label' }, { k: 'text', label: 'Quote text', type: 'textarea' }]
    },
    split: {
      title: 'Split banners', desc: 'The two big ON CODE / OFF CODE panels.',
      fields: [
        { k: 'a1', label: 'Left — word 1' }, { k: 'a2', label: 'Left — word 2 (outlined)' },
        { k: 'aDesc', label: 'Left — description', type: 'textarea' },
        { k: 'b1', label: 'Right — word 1' }, { k: 'b2', label: 'Right — word 2 (outlined)' },
        { k: 'bDesc', label: 'Right — description', type: 'textarea' }
      ]
    },
    sections: {
      title: 'Section titles', desc: 'Headings for gallery, projects, skills and socials.',
      fields: [
        { k: 'galleryT1', label: 'Gallery title — part 1' }, { k: 'galleryT2', label: 'Gallery title — part 2 (outlined)' },
        { k: 'projectsT1', label: 'Projects title — part 1' }, { k: 'projectsT2', label: 'Projects title — part 2 (outlined)' },
        { k: 'projectsDesc', label: 'Projects intro text', type: 'textarea' },
        { k: 'skillsT1', label: 'Skills title — part 1' }, { k: 'skillsT2', label: 'Skills title — part 2 (outlined)' },
        { k: 'socialsT1', label: 'Socials title — part 1' }, { k: 'socialsT2', label: 'Socials title — part 2 (outlined)' },
        { k: 'timelineT1', label: 'Timeline title — part 1' }, { k: 'timelineT2', label: 'Timeline title — part 2 (outlined)' },
        { k: 'contactT1', label: 'Contact title — part 1' }, { k: 'contactT2', label: 'Contact title — part 2 (outlined)' },
        { k: 'contactDesc', label: 'Contact intro text', type: 'textarea' }
      ]
    },
    footer: {
      title: 'Footer', desc: 'The lime footer block.',
      fields: [
        { k: 'big', label: 'Big statement' }, { k: 'email', label: 'Email' },
        { k: 'tagline', label: 'Tagline' }, { k: 'copyright', label: 'Copyright line' },
        { k: 'credit', label: 'Credit line' }
      ]
    }
  };

  const COLLECTION_TABS = {
    gallery: {
      title: 'Gallery', desc: 'Photos in the horizontal-scroll journey.',
      itemLabel: it => `${it.place || 'Photo'} — ${it.year || ''}`,
      fields: [{ k: 'img', label: 'Photo', type: 'image' }, { k: 'place', label: 'Place / caption' }, { k: 'year', label: 'Year' }],
      blank: { img: '', place: 'New place', year: '2026' }
    },
    projects: {
      title: 'Projects', desc: 'Your Hall of Fame project cards.',
      itemLabel: it => it.title || 'Project',
      fields: [
        { k: 'title', label: 'Title' }, { k: 'year', label: 'Year' }, { k: 'tag', label: 'Tag (e.g. PHP)' },
        { k: 'desc', label: 'Description', type: 'textarea' }, { k: 'link', label: 'Link (GitHub / live site)' },
        { k: 'img', label: 'Screenshot (optional)', type: 'image' }
      ],
      blank: { title: 'New Project', year: '2026', tag: 'Web', desc: '', link: '', img: '' }
    },
    skills: {
      title: 'Skills', desc: 'Tech stack shown in the moving strips.',
      itemLabel: it => it.name || 'Skill',
      fields: [{ k: 'name', label: 'Skill name' }],
      blank: { name: 'New Skill' }
    },
    socials: {
      title: 'Socials', desc: 'Links in the contact section.',
      itemLabel: it => it.name || 'Link',
      fields: [{ k: 'name', label: 'Name' }, { k: 'handle', label: 'Handle shown' }, { k: 'url', label: 'URL' }],
      blank: { name: 'New Link', handle: '@handle', url: 'https://' }
    },
    marquee: {
      title: 'Marquee', desc: 'Scrolling text strip under the hero.',
      itemLabel: it => it.text || 'Text',
      fields: [{ k: 'text', label: 'Text' }],
      blank: { text: 'New text' }
    },
    timeline: {
      title: 'Timeline', desc: 'Your career / education milestones.',
      itemLabel: it => `${it.period || ''} — ${it.title || 'Milestone'}`,
      fields: [
        { k: 'period', label: 'Period (e.g. 2024 — Present)' }, { k: 'title', label: 'Title' },
        { k: 'org', label: 'Organisation / place' }, { k: 'desc', label: 'Description', type: 'textarea' }
      ],
      blank: { period: '2026', title: 'New Milestone', org: '', desc: '' }
    }
  };

  const TAB_ORDER = ['inbox', 'profile', 'quote1', 'quote2', 'gallery', 'split', 'projects', 'timeline', 'skills', 'socials', 'marquee', 'sections', 'footer', 'account'];

  let content = {};
  let activeTab = 'profile';
  const hashTab = location.hash.slice(1);
  if (hashTab) activeTab = hashTab; // validated when tabs render

  const getPath = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const setPath = (o, p, v) => {
    const ks = p.split('.'); const last = ks.pop();
    let t = o;
    for (const k of ks) { if (typeof t[k] !== 'object' || t[k] === null) t[k] = /^\d+$/.test(k) ? [] : {}; t = t[k]; }
    t[last] = v;
  };

  /* ---------------- auth flow ---------------- */
  async function boot() {
    try {
      await api('/api/auth/me');
      await loadContent();
      showDash();
    } catch {
      $('#login-view').classList.remove('hidden');
    }
  }

  $('#login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await api('/api/auth/login', { method: 'POST', body: { username: f.get('username'), password: f.get('password') } });
      $('#login-error').textContent = '';
      await loadContent();
      $('#login-view').classList.add('hidden');
      showDash();
    } catch (err) {
      $('#login-error').textContent = err.message;
    }
  });

  $('#logout-btn').addEventListener('click', async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    location.reload();
  });

  async function loadContent() { content = await api('/api/content'); }

  function showDash() {
    $('#dash-view').classList.remove('hidden');
    renderTabs();
    renderPanel();
  }

  /* ---------------- tabs ---------------- */
  function renderTabs() {
    if (!TAB_ORDER.includes(activeTab)) activeTab = 'profile';
    $('#tabs').innerHTML = TAB_ORDER.map(t => {
      const title = t === 'account' ? 'Account'
        : t === 'inbox' ? 'Inbox'
        : (DOC_TABS[t] || COLLECTION_TABS[t]).title;
      return `<button data-tab="${t}" class="${t === activeTab ? 'active' : ''}">${title}</button>`;
    }).join('');
    $('#tabs').querySelectorAll('button').forEach(b =>
      b.addEventListener('click', () => {
        activeTab = b.dataset.tab;
        try { history.replaceState(null, '', '#' + activeTab); } catch (e) { /* ignore */ }
        renderTabs(); renderPanel();
      }));
  }

  /* ---------------- panels ---------------- */
  function fieldHtml(f, value, prefix) {
    const id = prefix + '__' + f.k.replace(/\./g, '_');
    if (f.type === 'image') {
      return `<div class="img-field" data-field="${f.k}">
        <img src="${esc(value || '')}" alt="">
        <div class="img-actions">
          <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.1em">${esc(f.label)}</span>
          <input type="text" data-k="${f.k}" id="${id}" value="${esc(value || '')}" placeholder="https://… or upload →">
          <button type="button" class="btn sm upload-btn" data-target="${id}">Upload image</button>
        </div>
      </div>`;
    }
    if (f.type === 'textarea') {
      return `<label style="grid-column:1/-1">${esc(f.label)}<textarea data-k="${f.k}" id="${id}">${esc(value || '')}</textarea></label>`;
    }
    return `<label>${esc(f.label)}<input type="text" data-k="${f.k}" id="${id}" value="${esc(value || '')}"></label>`;
  }

  function wireUploads(root) {
    root.querySelectorAll('.img-field img').forEach(img => {
      img.addEventListener('error', () => { img.style.opacity = .2; });
      if (!img.getAttribute('src')) img.style.opacity = .2;
    });
    root.querySelectorAll('.upload-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        const file = $('#file-input');
        file.onchange = async () => {
          if (!file.files[0]) return;
          const fd = new FormData();
          fd.append('image', file.files[0]);
          file.value = '';
          try {
            btn.textContent = 'Uploading…';
            const { url } = await api('/api/upload', { method: 'POST', body: fd });
            input.value = url;
            const img = btn.closest('.img-field').querySelector('img');
            img.src = url; img.style.opacity = 1;
            toast('Image uploaded ✓');
          } catch (e) { toast(e.message, true); }
          btn.textContent = 'Upload image';
        };
        file.click();
      });
    });
  }

  function readFields(root, base) {
    root.querySelectorAll('[data-k]').forEach(el => setPath(base, el.dataset.k, el.value));
    return base;
  }

  function renderPanel() {
    const panel = $('#panel-content');
    if (activeTab === 'account') return renderAccount(panel);
    if (activeTab === 'inbox') return renderInbox(panel);
    if (DOC_TABS[activeTab]) return renderDocPanel(panel, activeTab);
    renderCollectionPanel(panel, activeTab);
  }

  /* --- inbox (contact-form messages) --- */
  async function renderInbox(panel) {
    panel.innerHTML = '<h2>Inbox</h2><p class="desc">Loading…</p>';
    let data;
    try { data = await api('/api/messages'); }
    catch (e) { panel.innerHTML = `<h2>Inbox</h2><p class="desc">${esc(e.message)}</p>`; return; }
    const msgs = data.messages;
    panel.innerHTML = `
      <h2>Inbox</h2>
      <p class="desc">${msgs.length ? `${msgs.length} message${msgs.length > 1 ? 's' : ''} — ${data.unread} unread. Sent through the contact form on your site.` : 'No messages yet — they will appear here when someone uses the contact form on your site.'}</p>
      <div id="msg-list"></div>`;
    $('#msg-list').innerHTML = msgs.map(m => `
      <div class="item-row ${m.read ? '' : 'unread'}" data-id="${m.id}">
        <div class="item-head">
          <span class="t">${m.read ? '' : '● '}${esc(m.name)} <span style="color:var(--muted);font-weight:400">&lt;${esc(m.email)}&gt;</span></span>
          <span class="actions">
            <span style="color:var(--muted);font-size:11px;white-space:nowrap">${esc(m.created_at)}</span>
            <button class="btn sm danger del-msg">Delete</button>
          </span>
        </div>
        <div class="item-body">
          <p style="white-space:pre-wrap;line-height:1.6;font-size:14px">${esc(m.message)}</p>
          <div class="save-row"><a class="btn sm" href="mailto:${esc(m.email)}">Reply by email</a></div>
        </div>
      </div>`).join('');
    $('#msg-list').querySelectorAll('.item-head').forEach(h =>
      h.addEventListener('click', async e => {
        if (e.target.closest('button')) return;
        const row = h.closest('.item-row');
        row.classList.toggle('open');
        if (row.classList.contains('unread')) {
          row.classList.remove('unread');
          await api(`/api/messages/${row.dataset.id}/read`, { method: 'PUT' }).catch(() => {});
        }
      }));
    $('#msg-list').querySelectorAll('.del-msg').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this message?')) return;
        try {
          await api('/api/messages/' + btn.closest('.item-row').dataset.id, { method: 'DELETE' });
          renderInbox(panel);
        } catch (e) { toast(e.message, true); }
      }));
  }

  /* --- single-document sections --- */
  function renderDocPanel(panel, key) {
    const schema = DOC_TABS[key];
    const doc = content[key] || {};
    panel.innerHTML = `
      <h2>${schema.title}</h2><p class="desc">${schema.desc}</p>
      <div class="card">
        <div class="grid2">${schema.fields.map(f => fieldHtml(f, getPath(doc, f.k), key)).join('')}</div>
        <div class="save-row"><button class="btn primary" id="doc-save">Save changes</button></div>
      </div>`;
    wireUploads(panel);
    $('#doc-save').addEventListener('click', async () => {
      try {
        const updated = readFields(panel, JSON.parse(JSON.stringify(doc)));
        content[key] = await api('/api/docs/' + key, { method: 'PUT', body: updated });
        toast('Saved ✓');
      } catch (e) { toast(e.message, true); }
    });
  }

  /* --- collections --- */
  function renderCollectionPanel(panel, col) {
    const schema = COLLECTION_TABS[col];
    const items = content[col] || [];
    panel.innerHTML = `
      <h2>${schema.title}</h2><p class="desc">${schema.desc}</p>
      <button class="btn primary add-row" id="add-item">+ Add ${schema.title.replace(/s$/, '').toLowerCase()}</button>
      <div id="items"></div>`;
    const wrap = $('#items');
    wrap.innerHTML = items.map((it, i) => `
      <div class="item-row" data-id="${it.id}">
        <div class="item-head">
          <span class="t">${esc(schema.itemLabel(it))}</span>
          <span class="actions">
            <button class="btn sm mv" data-dir="up" title="Move up" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn sm mv" data-dir="down" title="Move down" ${i === items.length - 1 ? 'disabled' : ''}>↓</button>
            <button class="btn sm danger del">Delete</button>
          </span>
        </div>
        <div class="item-body">
          <div class="grid2">${schema.fields.map(f => fieldHtml(f, it[f.k], col + it.id)).join('')}</div>
          <div class="save-row"><button class="btn primary save-item">Save</button></div>
        </div>
      </div>`).join('');
    wireUploads(wrap);

    wrap.querySelectorAll('.item-head').forEach(h =>
      h.addEventListener('click', e => {
        if (e.target.closest('button')) return;
        h.closest('.item-row').classList.toggle('open');
      }));

    wrap.querySelectorAll('.save-item').forEach(btn =>
      btn.addEventListener('click', async () => {
        const row = btn.closest('.item-row');
        const id = row.dataset.id;
        try {
          const data = readFields(row, {});
          await api(`/api/items/${col}/${id}`, { method: 'PUT', body: data });
          await loadContent(); renderPanel();
          toast('Saved ✓');
        } catch (e) { toast(e.message, true); }
      }));

    wrap.querySelectorAll('.del').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this item?')) return;
        const id = btn.closest('.item-row').dataset.id;
        try {
          await api(`/api/items/${col}/${id}`, { method: 'DELETE' });
          await loadContent(); renderPanel();
          toast('Deleted ✓');
        } catch (e) { toast(e.message, true); }
      }));

    wrap.querySelectorAll('.mv').forEach(btn =>
      btn.addEventListener('click', async () => {
        const id = btn.closest('.item-row').dataset.id;
        try {
          await api(`/api/items/${col}/${id}/move`, { method: 'PUT', body: { dir: btn.dataset.dir } });
          await loadContent(); renderPanel();
        } catch (e) { toast(e.message, true); }
      }));

    $('#add-item').addEventListener('click', async () => {
      try {
        await api('/api/items/' + col, { method: 'POST', body: schema.blank });
        await loadContent(); renderPanel();
        toast('Added — click it to edit ✓');
      } catch (e) { toast(e.message, true); }
    });
  }

  /* --- account --- */
  function renderAccount(panel) {
    panel.innerHTML = `
      <h2>Account</h2><p class="desc">Change your admin password.</p>
      <div class="card">
        <label>Current password<input type="password" id="pw-current" autocomplete="current-password"></label>
        <label>New password (min 8 chars)<input type="password" id="pw-next" autocomplete="new-password"></label>
        <label>Repeat new password<input type="password" id="pw-next2" autocomplete="new-password"></label>
        <div class="save-row"><button class="btn primary" id="pw-save">Change password</button></div>
      </div>`;
    $('#pw-save').addEventListener('click', async () => {
      const next = $('#pw-next').value;
      if (next !== $('#pw-next2').value) return toast('Passwords do not match', true);
      try {
        await api('/api/auth/password', { method: 'PUT', body: { current: $('#pw-current').value, next } });
        toast('Password changed ✓');
        panel.querySelectorAll('input').forEach(i => i.value = '');
      } catch (e) { toast(e.message, true); }
    });
  }

  boot();
})();
