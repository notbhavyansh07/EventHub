// Admin panel: dashboard numbers, event CRUD, attendee list, CSV export.
ready.then(async () => {
  if (!currentUser) return location.href = '/login.html';
  if (currentUser.role !== 'admin') return location.href = '/';
  const form = $('#form'), msg = $('#msg'), rows = $('#rows');
  let events = [];
  $('#category').innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');

  // CSV Exporter for Attendee rosters
  function downloadCsv(attendees, eventTitle) {
    if (!attendees.length) {
      alert('No attendees to export for this event.');
      return;
    }
    const headers = ['Name', 'Email', 'Registered At'];
    const csvRows = [headers.join(',')];
    attendees.forEach(a => {
      const row = [
        `"${(a.name || '').replace(/"/g, '""')}"`,
        `"${(a.email || '').replace(/"/g, '""')}"`,
        `"${(a.registered_at || '').replace(/"/g, '""')}"`
      ];
      csvRows.push(row.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const sanitizedTitle = eventTitle.toLowerCase().replace(/[^a-z0-9]/gi, '_');
    link.setAttribute('download', `${sanitizedTitle}_attendees.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function load() {
    try {
      const s = await api('/api/stats');
      $('#stats').innerHTML = [
        ['Total Events', s.events, '#6366f1'],
        ['Upcoming Events', s.upcoming, '#10b981'],
        ['Enrolled Students', s.users, '#a855f7'],
        ['Total Registrations', s.registrations, '#f97316']
      ].map(x => `
        <div class="stat">
          <b>${x[1]}</b>
          <span>${x[0]}</span>
        </div>
      `).join('');

      events = await api('/api/events');
      rows.innerHTML = events.length ? events.map(e => {
        const pct = Math.min(100, Math.round((e.registered / e.capacity) * 100));
        return `<tr>
          <td style="font-weight: 600; color: #ffffff;">${esc(e.title)}</td>
          <td><span class="badge cat">${esc(e.category)}</span></td>
          <td style="color: var(--ink-secondary); font-size: 0.88rem;">${esc(fmtDate(e.event_date))}</td>
          <td>
            <div style="font-size: 0.85rem; margin-bottom: 0.25rem;"><strong>${e.registered}</strong> / ${e.capacity} (${pct}%)</div>
            <div class="capacity-bar" style="height: 4px; width: 100px;">
              <div class="capacity-fill ${pct >= 80 ? 'high' : ''}" style="width: ${pct}%"></div>
            </div>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 0.4rem; justify-content: flex-end;">
              <button class="btn sec" data-att="${e.id}" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;">Attendees</button>
              <button class="btn sec" data-csv="${e.id}" title="Download CSV" style="padding: 0.35rem 0.65rem; font-size: 0.82rem;">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                CSV
              </button>
              <button class="btn sec" data-edit="${e.id}" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;">Edit</button>
              <button class="btn danger" data-del="${e.id}" style="padding: 0.35rem 0.75rem; font-size: 0.82rem;">Delete</button>
            </div>
          </td>
        </tr>`;
      }).join('') : '<tr><td colspan="5" style="text-align: center; color: var(--muted); padding: 2.5rem;">No events scheduled yet. Create your first event above.</td></tr>';
    } catch (e) { showMsg(msg, e.message); }
  }

  function resetForm() {
    form.reset();
    $('#event_id').value = '';
    $('#save').textContent = 'Create Event';
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const data = {
      title: $('#title').value,
      venue: $('#venue').value,
      category: $('#category').value,
      event_date: $('#event_date').value,
      capacity: $('#capacity').value,
      description: $('#description').value
    };
    const id = $('#event_id').value;
    try {
      const r = await api(id ? `/api/events/${id}` : '/api/events', id ? 'PUT' : 'POST', data);
      showMsg(msg, r.message, true);
      resetForm();
      load();
    } catch (err) { showMsg(msg, err.message); }
  });

  $('#clear').addEventListener('click', resetForm);

  rows.addEventListener('click', async ev => {
    const t = ev.target.closest('button');
    if (!t) return;
    try {
      if (t.dataset.del && confirm('Delete this event and all its registrations?')) {
        const r = await api('/api/events/' + t.dataset.del, 'DELETE');
        showMsg(msg, r.message, true);
        load();
      } else if (t.dataset.edit) {
        const e = events.find(x => x.id == t.dataset.edit);
        $('#event_id').value = e.id;
        $('#title').value = e.title;
        $('#venue').value = e.venue;
        $('#category').value = e.category;
        $('#event_date').value = e.event_date.slice(0, 16).replace(' ', 'T');
        $('#capacity').value = e.capacity;
        $('#description').value = e.description || '';
        $('#save').textContent = 'Update Event';
        scrollTo({ top: 0, behavior: 'smooth' });
      } else if (t.dataset.att) {
        const list = await api(`/api/events/${t.dataset.att}/attendees`);
        const e = events.find(x => x.id == t.dataset.att);
        $('#att-list').innerHTML = list.length
          ? `<li style="background: rgba(99, 102, 241, 0.1); border-color: rgba(99, 102, 241, 0.3); font-weight: 600; display: flex; justify-content: space-between; align-items: center;">
              <span>Showing ${list.length} attendees for "${esc(e ? e.title : 'Event')}":</span>
              <button class="btn sec" id="export-att-btn" style="padding: 0.3rem 0.65rem; font-size: 0.75rem;">Export CSV</button>
            </li>` +
            list.map(a => `
              <li style="display: flex; justify-content: space-between; align-items: center;">
                <span><strong>${esc(a.name)}</strong> (${esc(a.email)})</span>
                <span style="font-size: 0.8rem; color: var(--muted);">${esc(fmtDate(a.registered_at))}</span>
              </li>
            `).join('')
          : `<li style="text-align: center; color: var(--muted); padding: 1.5rem 0;">No students have registered for this event yet.</li>`;

        const exportBtn = $('#export-att-btn');
        if (exportBtn) {
          exportBtn.onclick = () => downloadCsv(list, e ? e.title : 'event');
        }
      } else if (t.dataset.csv) {
        const list = await api(`/api/events/${t.dataset.csv}/attendees`);
        const e = events.find(x => x.id == t.dataset.csv);
        downloadCsv(list, e ? e.title : 'event');
      }
    } catch (err) { showMsg(msg, err.message); }
  });

  load();
});
