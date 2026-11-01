const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');
const { validateSignup } = require('../utils/validators');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = validateSignup(req.body);
  const hash = await bcrypt.hash(password, 10);          // never store plain passwords
  try {
    await pool.query('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)', [name, email, hash]);
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'This email is already registered');
    throw e;
  }
  res.status(201).json({ message: 'Account created. You can log in now.' });
});

exports.login = asyncHandler(async (req, res, next) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  const [rows] = await pool.query('SELECT id, name, email, role, password_hash FROM users WHERE email = ?', [email]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(password, u.password_hash))) throw new HttpError(401, 'Invalid email or password');
  req.session.regenerate(err => {                         // new session id on login (prevents session fixation)
    if (err) return next(err);
    req.session.user = { id: u.id, name: u.name, email: u.email, role: u.role };
    res.json({ user: req.session.user });
  });
});

exports.logout = (req, res) => {
  req.session.destroy(() => { res.clearCookie('connect.sid'); res.json({ message: 'Logged out' }); });
};

exports.me = (req, res) => res.json({ user: (req.session && req.session.user) || null });
