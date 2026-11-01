// Home page: list, search, filter, register / cancel.
ready.then(() => {
  const list = $('#events'), msg = $('#msg'), search = $('#search'), cat = $('#category');
  cat.innerHTML = '<option value="">All Categories</option>' + CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');

  async function load() {
    try {
      const qs = new URLSearchParams({ q: search.value, category: cat.value });
      const events = await api('/api/events?' + qs);
      list.innerHTML = events.length ? events.map(card).join('') : `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <h3>No events found</h3>
          <p>No matching events found. Try adjusting your search query or category filter.</p>
        </div>`;
    } catch (e) { showMsg(msg, e.message); }
  }

  function card(e) {
    const full = e.registered >= e.capacity;
    let btn;
    if (e.is_past) btn = '<button class="btn" disabled>Event ended</button>';
    else if (e.is_registered) btn = `<button class="btn sec" data-cancel="${e.id}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Cancel registration</button>`;
    else if (full) btn = '<button class="btn" disabled>Event full</button>';
    else btn = `<button class="btn" data-reg="${e.id}">Register now</button>`;

    const badge = e.is_past ? 'Ended' : e.is_registered ? 'Registered' : full ? 'Full' : (e.capacity - e.registered) + ' seats left';
    const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
    const isHigh = pct >= 80;

    return `<article class="card">
      <div class="card-top">
        <span class="badge ${full ? 'full' : e.is_registered ? 'ok' : ''}">${badge}</span>
        <span class="badge cat">${esc(e.category)}</span>
      </div>
      <h2>${esc(e.title)}</h2>
      <div class="meta">
        <div class="meta-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          <span>${esc(fmtDate(e.event_date))}</span>
        </div>
        <div class="meta-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span>${esc(e.venue)}</span>
        </div>
      </div>
      <p>${esc(e.description)}</p>
      <div class="capacity-wrap">
        <div class="capacity-info">
          <span>Attendance</span>
          <span><strong>${e.registered}</strong> / ${e.capacity} seats</span>
        </div>
        <div class="capacity-bar">
          <div class="capacity-fill ${isHigh ? 'high' : ''}" style="width: ${pct}%"></div>
        </div>
      </div>
      <div class="actions">${btn}</div>
    </article>`;
  }

  list.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;
    const reg = btn.dataset.reg, can = btn.dataset.cancel;
    if (!reg && !can) return;
    if (!currentUser) { location.href = '/login.html'; return; }
    try {
      const r = await api(`/api/events/${reg || can}/register`, reg ? 'POST' : 'DELETE');
      showMsg(msg, r.message, true);
      load();
    } catch (e) { showMsg(msg, e.message); load(); }
  });

  let timer;
  search.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(load, 300); });
  cat.addEventListener('change', load);
  load();
});
