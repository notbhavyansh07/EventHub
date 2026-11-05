// Helpers shared by every page: API calls, safe HTML, navbar.
const $ = (s, el = document) => el.querySelector(s);
const CATEGORIES = ['Workshop', 'Seminar', 'Competition', 'Cultural', 'Sports', 'Other'];

// Escape text before putting it into innerHTML (prevents XSS).
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = s => new Date(s.replace(' ', 'T')).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

// fetch() wrapper: sends/receives JSON and throws a readable Error on failure.
async function api(url, method = 'GET', body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

let msgTimeout;
function showMsg(el, text, ok = false) {
  if (!el) return;
  clearTimeout(msgTimeout);
  const icon = ok
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  
  el.innerHTML = `${icon}<span>${esc(text)}</span>`;
  el.className = 'msg show ' + (ok ? 'good' : 'err');
  
  // Smoothly hide notification after 5 seconds
  msgTimeout = setTimeout(() => {
    el.className = 'msg';
  }, 5000);
}

let currentUser = null;

async function renderNav() {
  try { currentUser = (await api('/api/auth/me')).user; } catch (e) { currentUser = null; }
  const nav = $('#nav-links');
  if (!nav) return;
  if (!currentUser) {
    nav.innerHTML = '<a href="/login.html">Login</a><a href="/signup.html" class="btn" style="padding: 0.45rem 1rem; font-size: 0.88rem;">Get started</a>';
  } else {
    nav.innerHTML = '<a href="/">Events</a><a href="/my.html">My registrations</a>' +
      (currentUser.role === 'admin' ? '<a href="/admin.html">Admin panel</a>' : '') +
      `<span>Hi, ${esc(currentUser.name)}</span><button id="logout" type="button">Logout</button>`;
    $('#logout').onclick = async () => { await api('/api/auth/logout', 'POST'); location.href = '/'; };
  }
  nav.querySelectorAll('a').forEach(a => { if (a.getAttribute('href') === location.pathname) a.classList.add('active'); });
}

// Every page script waits for this before using currentUser.
const ready = renderNav();

// --- Modern Feature Utilities ---

// Toast notification popup
function showToast(text) {
  let toast = $('#toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>${esc(text)}</span>`;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// Generate Google Calendar Link
function getGoogleCalendarUrl(e) {
  const d = new Date(e.event_date.replace(' ', 'T'));
  const pad = n => String(n).padStart(2, '0');
  const formatUtc = date => {
    return date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) + 'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) + '00Z';
  };
  const start = formatUtc(d);
  const end = formatUtc(new Date(d.getTime() + 2 * 60 * 60 * 1000)); // default 2 hours duration
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    details: `${e.description || 'Campus Event on EventHub'}\n\nCategory: ${e.category}`,
    location: e.venue || 'Campus',
    dates: `${start}/${end}`
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// Share Event to Clipboard / Social
async function shareEvent(e) {
  const shareData = {
    title: e.title,
    text: `Check out ${e.title} happening at ${e.venue} on ${fmtDate(e.event_date)}!`,
    url: window.location.origin + '/?q=' + encodeURIComponent(e.title)
  };
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err);
    }
  }
  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    showToast('Event details copied to clipboard!');
  } catch (err) {
    showToast('Link copied!');
  }
}

// Show Digital Ticket Pass Modal with QR
function showTicketModal(e, attendeeName = '') {
  let modal = $('#ticket-modal');
  if (modal) modal.remove();

  const passCode = `EH-${e.id}-${Math.abs((attendeeName || 'GUEST').split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0)) % 100000}`;

  modal = document.createElement('div');
  modal.id = 'ticket-modal';
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="ticket-card" role="dialog" aria-modal="true" aria-labelledby="t-title">
      <div class="ticket-header">
        <div>
          <span class="ticket-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Verified Pass
          </span>
          <div style="font-size: 0.8rem; color: var(--muted); margin-top: 0.35rem;">Pass ID: <strong>#${esc(passCode)}</strong></div>
        </div>
        <button class="ticket-close" id="close-ticket" aria-label="Close modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="ticket-body">
        <h3 class="ticket-title" id="t-title">${esc(e.title)}</h3>
        <span class="badge cat">${esc(e.category)}</span>

        <div class="ticket-details">
          <div class="ticket-field">
            <span>Attendee</span>
            <strong>${esc(attendeeName || (currentUser ? currentUser.name : 'Student'))}</strong>
          </div>
          <div class="ticket-field">
            <span>Venue</span>
            <strong>${esc(e.venue)}</strong>
          </div>
          <div class="ticket-field" style="grid-column: 1 / -1;">
            <span>Date &amp; Time</span>
            <strong>${esc(fmtDate(e.event_date))}</strong>
          </div>
        </div>

        <div class="ticket-qr-wrap">
          <!-- Scalable SVG QR code representation -->
          <svg width="150" height="150" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="100" fill="#ffffff"/>
            <!-- Top-Left Target -->
            <rect x="8" y="8" width="28" height="28" rx="4" fill="#090d16"/>
            <rect x="14" y="14" width="16" height="16" rx="2" fill="#ffffff"/>
            <rect x="18" y="18" width="8" height="8" rx="1" fill="#090d16"/>
            <!-- Top-Right Target -->
            <rect x="64" y="8" width="28" height="28" rx="4" fill="#090d16"/>
            <rect x="70" y="14" width="16" height="16" rx="2" fill="#ffffff"/>
            <rect x="74" y="18" width="8" height="8" rx="1" fill="#090d16"/>
            <!-- Bottom-Left Target -->
            <rect x="8" y="64" width="28" height="28" rx="4" fill="#090d16"/>
            <rect x="14" y="70" width="16" height="16" rx="2" fill="#ffffff"/>
            <rect x="18" y="74" width="8" height="8" rx="1" fill="#090d16"/>
            <!-- Data Grid Simulation -->
            <rect x="42" y="12" width="6" height="6" fill="#090d16"/>
            <rect x="52" y="12" width="6" height="6" fill="#090d16"/>
            <rect x="42" y="24" width="6" height="12" fill="#090d16"/>
            <rect x="52" y="30" width="6" height="6" fill="#090d16"/>
            <rect x="12" y="42" width="8" height="6" fill="#090d16"/>
            <rect x="26" y="42" width="6" height="12" fill="#090d16"/>
            <rect x="40" y="44" width="20" height="6" fill="#090d16"/>
            <rect x="66" y="42" width="12" height="6" fill="#090d16"/>
            <rect x="82" y="46" width="6" height="12" fill="#090d16"/>
            <rect x="42" y="58" width="12" height="6" fill="#090d16"/>
            <rect x="60" y="56" width="6" height="14" fill="#090d16"/>
            <rect x="44" y="72" width="8" height="16" fill="#090d16"/>
            <rect x="62" y="76" width="16" height="6" fill="#090d16"/>
            <rect x="82" y="68" width="6" height="16" fill="#090d16"/>
          </svg>
          <div class="ticket-qr-hint">Scan at event desk for fast check-in</div>
        </div>
      </div>

      <div class="ticket-footer">
        <a href="${esc(getGoogleCalendarUrl(e))}" target="_blank" rel="noopener noreferrer" class="btn sec" style="font-size: 0.85rem; padding: 0.45rem 0.85rem;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line></svg>
          Add to Calendar
        </a>
        <button class="btn" onclick="window.print()" style="font-size: 0.85rem; padding: 0.45rem 0.85rem;">
          Print Pass
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector('#close-ticket').onclick = close;
  modal.onclick = ev => { if (ev.target === modal) close(); };
}
