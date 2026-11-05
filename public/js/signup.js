ready.then(() => {
  $('#form').addEventListener('submit', async e => {
    e.preventDefault();
    const msg = $('#msg'), pw = $('#password').value;
    // client-side validation (the server checks everything again)
    if ($('#name').value.trim().length < 2) return showMsg(msg, 'Enter your full name');
    if (pw.length < 8) return showMsg(msg, 'Password must be at least 8 characters');
    if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return showMsg(msg, 'Password must contain a letter and a number');
    if (pw !== $('#confirm').value) return showMsg(msg, 'Passwords do not match');
    try {
      const r = await api('/api/auth/register', 'POST', { name: $('#name').value, email: $('#email').value, password: pw });
      showMsg(msg, r.message, true);
      setTimeout(() => location.href = '/', 900);
    } catch (err) { showMsg(msg, err.message); }
  });
});
