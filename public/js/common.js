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
