ready.then(async () => {
  if (!currentUser) return location.href = '/login.html';
  const body = $('#rows'), msg = $('#msg');
  let myRegistrations = [];

  async function load() {
    try {
      myRegistrations = await api('/api/my/registrations');
      body.innerHTML = myRegistrations.length ? myRegistrations.map(r =>
        `<tr>
          <td style="font-weight: 600; color: #ffffff;">${esc(r.title)}</td>
          <td><span class="badge cat">${esc(r.category)}</span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--ink-secondary);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              <span>${esc(fmtDate(r.event_date))}</span>
            </div>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.4rem; color: var(--ink-secondary);">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span>${esc(r.venue)}</span>
            </div>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.4rem; align-items: center; justify-content: flex-end;">
              <button class="btn" data-pass="${r.id}" style="padding: 0.4rem 0.75rem; font-size: 0.82rem; background: linear-gradient(135deg, #10b981, #059669);">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
                Pass
              </button>
              <a href="${esc(getGoogleCalendarUrl(r))}" target="_blank" rel="noopener noreferrer" class="btn-icon" title="Add to Google Calendar">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </a>
              <button class="btn-icon" data-share="${r.id}" title="Share event">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
              <button class="btn sec" data-cancel="${r.id}" style="padding: 0.4rem 0.75rem; font-size: 0.82rem; color: #f87171;">
                Cancel
              </button>
            </div>
          </td>
        </tr>`).join('')
        : `<tr><td colspan="5" style="text-align: center; padding: 4rem 1rem;">
             <div class="empty-state">
               <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                 <rect x="3" y="4" width="18" height="18" rx="2"></rect>
                 <line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line>
               </svg>
               <h3>No active registrations</h3>
               <p>You haven't signed up for any events yet.</p>
               <a href="/" class="btn" style="margin-top: 1rem;">Browse upcoming events</a>
             </div>
           </td></tr>`;
    } catch (e) { showMsg(msg, e.message); }
  }

  body.addEventListener('click', async ev => {
    const btn = ev.target.closest('button');
    if (!btn) return;

    if (btn.dataset.share) {
      const r = myRegistrations.find(x => x.id == btn.dataset.share);
      if (r) shareEvent(r);
      return;
    }

    if (btn.dataset.pass) {
      const r = myRegistrations.find(x => x.id == btn.dataset.pass);
      if (r) showTicketModal(r, currentUser ? currentUser.name : '');
      return;
    }

    const id = btn.dataset.cancel;
    if (!id || !confirm('Cancel this registration?')) return;
    try {
      await api(`/api/events/${id}/register`, 'DELETE');
      showMsg(msg, 'Registration successfully cancelled', true);
      load();
    } catch (e) { showMsg(msg, e.message); }
  });

  load();
});
