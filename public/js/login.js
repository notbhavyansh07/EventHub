ready.then(() => {
  if (currentUser) { location.href = '/'; return; }
  $('#form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#msg');
    if (!$('#email').value || !$('#password').value) return showMsg(msg, 'Enter your email and password');
    try {
      const r = await api('/api/auth/login', 'POST', { email: $('#email').value, password: $('#password').value });
      location.href = r.user.role === 'admin' ? '/admin.html' : '/';
    } catch (err) { showMsg(msg, err.message); }
  });
});
