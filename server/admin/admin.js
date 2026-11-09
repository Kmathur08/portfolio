/* Portfolio admin: edit the content document and save it to the server. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clone = o => JSON.parse(JSON.stringify(o));
  const api = async (url, opts = {}) => {
    const r = await fetch(url, { credentials: 'same-origin', ...opts, headers: { 'X-Admin-Request': '1', ...(opts.json ? { 'Content-Type': 'application/json' } : {}), ...(opts.headers || {}) }, body: opts.json ? JSON.stringify(opts.json) : opts.body });
    const data = await r.json().catch(() => ({}));
    if (r.status === 401 && !url.includes('/auth/')) { showLogin(); throw new Error('Your session ended. Sign in again; your edits are still on this page.'); }
    if (!r.ok) throw new Error(data.error || `Request failed (${r.status})`);
    return data;
  };

  let content = null, saved = '', current = 'profile', open = new Set(), meta = { previews: [], icons: [] };

  // ---------- path helpers ----------
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);
  const set = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach((k, i) => { if (a[k] == null) a[k] = /^\d+$/.test(ks[i + 1]) ? [] : {}; a = a[k]; }); a[ks.at(-1)] = v; };

  // ---------- section definitions ----------
  const F = (k, label, type = 'text', extra = {}) => ({ k, label, type, ...extra });
  const PREVIEW_NAMES = { meet: 'Video call (Meetly)', thandak: 'Heat app + WhatsApp (Thandak)', paper: 'Sign-in + exam paper (PaperSetu)', interview: 'Voice interview (PrepWise)', api: 'API code (RDIS LMS)', kanban: 'Kanban board', dash: 'Analytics dashboard', code: 'Code editor', chat: 'AI chat', phone: 'Phone feed', sphere: 'Particle sphere', gradient: 'Gradient blob', kinetic: 'Kinetic type' };
  const ICON_NAMES = { pen: 'Pen', globe: 'Globe', bot: 'Robot', grid: 'Grid' };
  const SECTIONS = {
    profile: { title: 'Profile', sub: 'Your name, intro, contact details and links.', kind: 'object', groups: [
      ['About you', [F('name', 'Full name'), F('firstName', 'First name', 'text', { hint: 'Used in the logo, the "hey there" line and the big footer name.' }), F('availability', 'Availability badge', 'text', { hint: 'The small pill above your name, e.g. "Open to internships".' }), F('education', 'Line under the intro'), F('lead', 'Intro paragraph', 'textarea', { wide: true }), F('location', 'Location')]],
      ['Contact', [F('email', 'Email', 'email'), F('usualReply', 'Usual reply time')]],
      ['Profile links', [F('links.github', 'GitHub URL', 'url'), F('links.linkedin', 'LinkedIn URL', 'url'), F('links.leetcode', 'LeetCode URL', 'url'), F('links.codolio', 'Codolio URL', 'url')]],
      ['Buttons in the contact section', [F('contactLinks', '', 'pairs', { wide: true, a: 'label', b: 'url', aLabel: 'Label', bLabel: 'URL' })]] ] },
    projects: { title: 'Projects', sub: 'The stacked project cards and their case studies. The first one shows first.', kind: 'list', path: 'projects',
      itemTitle: x => x.name || 'New project', itemSub: x => x.kicker || '', swatch: x => x.accent,
      blank: () => ({ slug: '', name: 'New project', kicker: '', year: String(new Date().getFullYear()), role: '', platform: 'Web', team: 'Solo', accent: '#7fd1ff', preview: 'code', summary: '', metric: { value: '', label: '' }, chips: [], story: { challenge: '', approach: '', outcome: '' }, stats: [{ value: '', label: '' }, { value: '', label: '' }, { value: '', label: '' }], stack: [], live: '', repo: '' }),
      groups: [
        ['Basics', [F('name', 'Project name'), F('kicker', 'Handwritten tagline'), F('year', 'Year'), F('role', 'Your role'), F('platform', 'Platform'), F('team', 'Team'), F('accent', 'Accent colour', 'color'), F('preview', 'Animated preview', 'select', { options: () => meta.previews.map(p => [p, PREVIEW_NAMES[p] || p]) })]],
        ['Card', [F('summary', 'Short description', 'textarea', { wide: true }), F('metric.value', 'Highlight number', 'text', { hint: 'e.g. 6, <2s, 733' }), F('metric.label', 'Highlight label'), F('chips', 'Card tags', 'tags', { wide: true, hint: 'Up to 4, separated by commas.' })]],
        ['Case study', [F('story.challenge', 'Challenge', 'textarea', { wide: true }), F('story.approach', 'Approach', 'textarea', { wide: true }), F('story.outcome', 'Outcome', 'textarea', { wide: true }),
          F('stats.0.value', 'Stat 1'), F('stats.0.label', 'Stat 1 label'), F('stats.1.value', 'Stat 2'), F('stats.1.label', 'Stat 2 label'), F('stats.2.value', 'Stat 3'), F('stats.2.label', 'Stat 3 label')]],
        ['Stack and links', [F('stack', 'Tech stack', 'tags', { wide: true, hint: 'Separate with commas.' }), F('live', 'Live site URL', 'url', { hint: 'Leave empty if it is not deployed.' }), F('repo', 'Code URL', 'url', { hint: 'Leave empty for a private repo; the case study then says "demo on request".' }), F('slug', 'Link name', 'text', { hint: 'Used in the address, e.g. #project=meetly. Filled from the name if empty.' })]] ] },
    experience: { title: 'Experience', sub: 'The "Road so far" timeline: internships, education and what you are doing now. Oldest first.', kind: 'list', path: 'experience',
      itemTitle: x => x.title || 'New entry', itemSub: x => x.when || '', blank: () => ({ when: '', title: 'New entry', text: '' }),
      groups: [['', [F('when', 'When', 'text', { hint: 'e.g. Jun – Jul 2025' }), F('title', 'Title', 'text', { hint: 'e.g. Front-end Intern' }), F('text', 'Description', 'textarea', { wide: true, hint: 'Company, city and one line about what you did.' })]]] },
    services: { title: 'Services', sub: 'What you offer, shown as an accordion.', kind: 'list', path: 'services',
      itemTitle: x => x.title || 'New service', itemSub: x => x.tag || '', blank: () => ({ title: 'New service', tag: '', icon: 'pen', description: '', items: [], duration: '', audience: '' }),
      groups: [['', [F('title', 'Title'), F('tag', 'Short tag'), F('icon', 'Icon', 'select', { options: () => meta.icons.map(i => [i, ICON_NAMES[i] || i]) }), F('duration', 'Typical length'), F('description', 'Description', 'textarea', { wide: true }), F('items', 'What is included', 'tags', { wide: true, hint: 'Separate with commas.' }), F('audience', 'Best for')]]] },
    tools: { title: 'Tools and skills', sub: 'The scrolling toolkit pills. Add anything new you learn.', kind: 'tools', path: 'tools' },
    sideProjects: { title: 'Side projects', sub: 'The "More on GitHub" list. Hovering a row shows these details.', kind: 'list', path: 'sideProjects', compact: true,
      itemTitle: x => x.title || 'New side project', itemSub: x => x.year || '', blank: () => ({ year: String(new Date().getFullYear()), title: 'New side project', description: '', tags: '', url: '' }),
      groups: [['', [F('title', 'Title'), F('year', 'Year'), F('description', 'One line about it', 'text', { wide: true }), F('tags', 'Tags', 'text', { hint: 'Separate with " · ", e.g. Python · ML' }), F('url', 'Link (repo or live site)', 'url')]]] },
    resume: { title: 'Resume', sub: 'The PDF behind every "Resume" button on your site.', kind: 'resume' },
    history: { title: 'History', sub: 'Every save keeps the previous version. Restore one if something goes wrong.', kind: 'history' }
  };

  // ---------- field rendering ----------
  function fieldHTML(f, obj, base) {
    const id = 'f_' + (base + f.k).replace(/[^\w]/g, '_'), v = get(obj, f.k), path = base + f.k;
    const hint = f.hint ? `<span class="hint">${esc(f.hint)}</span>` : '';
    const lab = f.label ? `<label for="${id}">${esc(f.label)}</label>` : '';
    const wide = f.wide ? ' wide' : '';
    if (f.type === 'textarea') return `<div class="field${wide}">${lab}<textarea id="${id}" data-path="${path}">${esc(v)}</textarea>${hint}</div>`;
    if (f.type === 'select') return `<div class="field${wide}">${lab}<select id="${id}" data-path="${path}">${f.options().map(([val, name]) => `<option value="${esc(val)}"${val === v ? ' selected' : ''}>${esc(name)}</option>`).join('')}</select>${hint}</div>`;
    if (f.type === 'tags') return `<div class="field${wide}">${lab}<input id="${id}" data-path="${path}" data-tags value="${esc((v || []).join(', '))}" />${hint}</div>`;
    if (f.type === 'color') return `<div class="field${wide}">${lab}<div class="colorrow"><input type="color" id="${id}" data-path="${path}" value="${esc(v || '#ffffff')}" /><input aria-label="${esc(f.label)} hex" data-path="${path}" value="${esc(v || '')}" /></div>${hint}</div>`;
    if (f.type === 'pairs') {
      const list = v || [];
      return `<div class="field wide"><div class="rows" data-pairs="${path}">${list.map((x, i) => `<div class="row3"><div class="field"><span class="lbl">${esc(f.aLabel)}</span><input data-path="${path}.${i}.${f.a}" value="${esc(x[f.a])}" /></div><div class="field"><span class="lbl">${esc(f.bLabel)}</span><input type="url" data-path="${path}.${i}.${f.b}" value="${esc(x[f.b])}" /></div><button class="btn small danger" type="button" data-del-pair="${path}" data-i="${i}">Remove</button></div>`).join('')}
        <button class="btn small" type="button" data-add-pair="${path}" data-a="${f.a}" data-b="${f.b}">+ Add button</button></div></div>`;
    }
    return `<div class="field${wide}">${lab}<input id="${id}" type="${f.type}" data-path="${path}" value="${esc(v)}" />${hint}</div>`;
  }
  const groupsHTML = (groups, obj, base) => groups.map(([t, fields]) => `<div>${t ? `<div class="group-t">${esc(t)}</div>` : ''}<div class="grid">${fields.map(f => fieldHTML(f, obj, base)).join('')}</div></div>`).join('');

  // ---------- views ----------
  function render() {
    const sec = SECTIONS[current];
    $('#title').textContent = sec.title; $('#subtitle').textContent = sec.sub;
    $('#nav').innerHTML = Object.entries(SECTIONS).map(([k, s]) => { const n = s.path ? (content[s.path] || []).length : ''; return `<button class="nav-btn${k === current ? ' on' : ''}" data-sec="${k}" type="button">${esc(s.title)}${n !== '' ? `<span class="n">${n}</span>` : ''}</button>`; }).join('');
    const v = $('#view');
    if (sec.kind === 'object') v.innerHTML = `<div class="card">${groupsHTML(sec.groups, content.profile, 'profile.')}</div>`.replace(/<\/div><div>/g, '</div><div style="margin-top:22px">');
    else if (sec.kind === 'list') {
      const list = content[sec.path] || [];
      v.innerHTML = list.map((x, i) => {
        const key = sec.path + i, isOpen = open.has(key);
        return `<div class="item${isOpen ? ' open' : ''}${sec.compact ? ' compact' : ''}"><div class="item-h" data-toggle="${key}">
          ${sec.swatch ? `<span class="sw" style="background:${esc(sec.swatch(x))}"></span>` : ''}<span class="t">${esc(sec.itemTitle(x))}</span><span class="s">${esc(sec.itemSub(x))}</span>
          <span class="acts"><button class="ic" type="button" title="Move up" aria-label="Move up" data-move="-1" data-i="${i}"${i === 0 ? ' disabled' : ''}>↑</button><button class="ic" type="button" title="Move down" aria-label="Move down" data-move="1" data-i="${i}"${i === list.length - 1 ? ' disabled' : ''}>↓</button><button class="ic" type="button" title="${isOpen ? 'Collapse' : 'Edit'}" aria-label="${isOpen ? 'Collapse' : 'Edit'}" data-toggle="${key}">${isOpen ? '−' : '✎'}</button></span></div>
          <div class="item-b">${groupsHTML(sec.groups, x, `${sec.path}.${i}.`)}<div><button class="btn small danger" type="button" data-del="${i}">Delete this ${sec.title.toLowerCase().replace(/s$/, '')}</button></div></div></div>`;
      }).join('') + `<button class="btn add" type="button" data-add>+ Add ${sec.title.toLowerCase().replace(/s$/, '')}</button>`;
    } else if (sec.kind === 'tools') {
      const list = content.tools || [];
      v.innerHTML = `<div class="rows">${list.map((t, i) => `<div class="tool-row"><input aria-label="Tool name" data-path="tools.${i}.name" value="${esc(t.name)}" placeholder="Name" />
        <input aria-label="Badge letters" data-path="tools.${i}.short" value="${esc(t.short)}" maxlength="3" placeholder="Ab" />
        <div class="colorrow"><input type="color" aria-label="Badge colour" data-path="tools.${i}.color" value="${esc(t.color || '#ffffff')}" /><span class="chip" style="background:${esc(t.color)}">${esc(t.short)}</span></div>
        <button class="ic btn small" type="button" data-move="-1" data-i="${i}" aria-label="Move up"${i === 0 ? ' disabled' : ''}>↑</button><button class="ic btn small" type="button" data-move="1" data-i="${i}" aria-label="Move down"${i === list.length - 1 ? ' disabled' : ''}>↓</button><button class="btn small danger" type="button" data-del="${i}">Remove</button></div>`).join('')}</div>
        <button class="btn add" type="button" data-add>+ Add tool</button>`;
    } else if (sec.kind === 'resume') {
      const r = content.resume || {};
      v.innerHTML = `<div class="card"><div class="resume"><div class="pdf">PDF</div><div><h2>Current resume</h2><p class="muted">${esc([r.pages && `${r.pages} page${r.pages > 1 ? 's' : ''}`, r.size, r.updated && 'updated ' + r.updated].filter(Boolean).join(' · ') || 'No details yet')}</p>
        <p style="margin:10px 0 0"><a class="btn small" href="${esc(r.url ? (r.url.startsWith('/') ? r.url : '/' + r.url) : '#')}" target="_blank" rel="noopener">Open current PDF ↗</a></p></div></div></div>
        <label class="drop" id="drop" for="resumeFile"><b>Upload a new resume</b><br><span class="hint">Click to choose a PDF or drop it here. It replaces the file behind every Resume button straight away.</span></label>
        <input type="file" id="resumeFile" accept="application/pdf" hidden />`;
      bindResume();
    } else if (sec.kind === 'history') {
      v.innerHTML = `<div class="hist" id="hist"><p class="muted">Loading saved versions…</p></div>`;
      loadHistory();
    }
  }

  // ---------- events ----------
  function markDirty() {
    const dirty = JSON.stringify(content) !== saved;
    $('#save').disabled = !dirty;
    $('#state').textContent = dirty ? 'Unsaved changes' : 'All changes saved';
    $('#state').classList.toggle('dirty', dirty);
  }
  document.addEventListener('input', e => {
    const el = e.target, path = el.dataset?.path; if (!path) return;
    let val = el.value;
    if (el.hasAttribute('data-tags')) val = val.split(',').map(s => s.trim()).filter(Boolean);
    set(content, path, val);
    // keep the colour picker and its hex box in step
    if (el.type === 'color' || /color|accent/.test(path)) document.querySelectorAll(`[data-path="${CSS.escape(path)}"]`).forEach(o => { if (o !== el && (o.type !== 'color' || /^#[0-9a-f]{6}$/i.test(val))) o.value = val; });
    const chip = el.closest('.tool-row')?.querySelector('.chip'); if (chip) { const i = path.split('.')[1]; chip.style.background = content.tools[i].color; chip.textContent = content.tools[i].short; }
    const h = el.closest('.item')?.querySelector('.item-h'); const sec = SECTIONS[current];
    if (h && sec.itemTitle) { const i = +path.split('.')[1], x = content[sec.path][i]; $('.t', h).textContent = sec.itemTitle(x); $('.s', h).textContent = sec.itemSub(x); const sw = $('.sw', h); if (sw) sw.style.background = sec.swatch(x); }
    markDirty();
  });
  document.addEventListener('click', e => {
    const t = e.target.closest('button, [data-toggle]'); if (!t) return;
    const sec = SECTIONS[current];
    if (t.dataset.sec) { current = t.dataset.sec; render(); scrollTo(0, 0); return; }
    if (t.dataset.toggle && !e.target.closest('[data-move]')) { const k = t.dataset.toggle; open.has(k) ? open.delete(k) : open.add(k); render(); return; }
    if (t.dataset.move) { e.stopPropagation(); const i = +t.dataset.i, j = i + +t.dataset.move, l = content[sec.path]; if (!l || j < 0 || j >= l.length) return; [l[i], l[j]] = [l[j], l[i]]; open.clear(); render(); markDirty(); return; }
    if ('add' in t.dataset) { const l = content[sec.path] = content[sec.path] || []; l.push(sec.blank ? sec.blank() : { name: '', short: '', color: '#ffffff' }); open.add(sec.path + (l.length - 1)); render(); markDirty(); return; }
    if (t.dataset.del != null) {
      if (!t.classList.contains('confirm')) { const label = t.textContent; t.classList.add('confirm'); t.textContent = 'Click again to delete'; setTimeout(() => { if (t.isConnected) { t.classList.remove('confirm'); t.textContent = label; } }, 3000); return; }
      content[sec.path].splice(+t.dataset.del, 1); open.clear(); render(); markDirty(); return;
    }
    if (t.dataset.addPair) { const l = get(content, t.dataset.addPair) || []; l.push({ [t.dataset.a]: '', [t.dataset.b]: '' }); set(content, t.dataset.addPair, l); render(); markDirty(); return; }
    if (t.dataset.delPair) { get(content, t.dataset.delPair).splice(+t.dataset.i, 1); render(); markDirty(); return; }
  });
  $('#save').addEventListener('click', save);
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); if (!$('#save').disabled) save(); } });
  addEventListener('beforeunload', e => { if (content && JSON.stringify(content) !== saved) { e.preventDefault(); e.returnValue = ''; } });

  async function save() {
    $('#save').disabled = true; $('#state').textContent = 'Saving…';
    try {
      const r = await api('/api/admin/content', { method: 'PUT', json: content });
      content = r.content; saved = JSON.stringify(content); render(); markDirty();
      toast('Saved. Your site is updated.');
    } catch (err) { toast(err.message, true); markDirty(); }
  }

  function bindResume() {
    const drop = $('#drop'), input = $('#resumeFile');
    const upload = async file => {
      if (!file) return;
      if (file.type !== 'application/pdf') return toast('Please choose a PDF file.', true);
      drop.innerHTML = '<b>Uploading…</b>';
      try {
        const r = await api('/api/admin/resume', { method: 'POST', body: file, headers: { 'Content-Type': 'application/pdf' } });
        content.resume = r.resume; const s = JSON.parse(saved); s.resume = r.resume; saved = JSON.stringify(s);
        render(); markDirty(); toast('New resume is live.');
      } catch (err) { toast(err.message, true); render(); }
    };
    input.addEventListener('change', () => upload(input.files[0]));
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', e => upload(e.dataTransfer.files[0]));
  }

  async function loadHistory() {
    try {
      const list = await api('/api/admin/backups');
      const nice = n => { const m = n.match(/content-(\d{4})-(\d\d)-(\d\d)T(\d\d)-(\d\d)-(\d\d)/); return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`).toLocaleString() : n; };
      $('#hist').innerHTML = list.length ? list.map(b => `<div class="hist-row"><div><b>${esc(nice(b.name))}</b><div class="mono">${esc(b.name.replace(/^.*-(\w+)\.json$/, '$1').replace('save', 'before a save').replace('resume', 'before a resume upload'))} · ${Math.round(b.size / 1024)} KB</div></div><button class="btn small" type="button" data-restore="${esc(b.name)}">Restore</button></div>`).join('') : '<p class="muted">No saved versions yet. One is kept every time you save.</p>';
    } catch (err) { $('#hist').innerHTML = `<p class="err">${esc(err.message)}</p>`; }
  }
  document.addEventListener('click', async e => {
    const b = e.target.closest('[data-restore]'); if (!b) return;
    if (!b.classList.contains('danger')) { const dirty = JSON.stringify(content) !== saved; b.classList.add('danger', 'confirm'); b.textContent = dirty ? 'Discard unsaved edits and restore?' : 'Click again to restore'; return; }
    try { const r = await api(`/api/admin/backups/${encodeURIComponent(b.dataset.restore)}/restore`, { method: 'POST' }); content = r.content; saved = JSON.stringify(content); markDirty(); toast('Restored. Your site shows that version now.'); render(); }
    catch (err) { toast(err.message, true); }
  });

  let tt; function toast(msg, bad) { const t = $('#toast'); t.textContent = msg; t.classList.toggle('bad', !!bad); t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), bad ? 6000 : 2800); }

  // ---------- sign in ----------
  function showLogin(msg) { $('#app').hidden = true; $('#login').hidden = false; $('#loginErr').textContent = msg || ''; $('#pw').focus(); }
  $('#logout').addEventListener('click', async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.reload(); });
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault(); $('#loginErr').textContent = '';
    try { await api('/api/auth/login', { method: 'POST', json: { password: $('#pw').value } }); $('#pw').value = ''; await start(); }
    catch (err) { $('#loginErr').textContent = err.message; }
  });
  async function start() {
    const keep = content && JSON.stringify(content) !== saved ? content : null;
    const [c, m] = await Promise.all([fetch('/api/content').then(r => r.json()), api('/api/admin/meta')]);
    meta = m; content = keep || c; if (!keep) saved = JSON.stringify(c);
    $('#login').hidden = true; $('#app').hidden = false; render(); markDirty();
  }
  fetch('/api/auth/me').then(r => r.json()).then(s => s.admin ? start() : showLogin(s.configured ? '' : 'No admin password yet. Run "npm run set-password" in the server folder.'));
})();
