const pool = require('../config/db');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');
const { validateEvent, CATEGORIES } = require('../utils/validators');

// GET /api/events?q=text&category=Workshop   (public)
exports.list = asyncHandler(async (req, res) => {
  const q = `%${String(req.query.q || '').trim()}%`;
  const category = CATEGORIES.includes(req.query.category) ? req.query.category : '';
  const uid = req.session && req.session.user ? req.session.user.id : 0;
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.description, e.venue, e.category, e.event_date, e.capacity,
            (e.event_date < NOW()) AS is_past,
            (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) AS registered,
            EXISTS(SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?) AS is_registered
     FROM events e
     WHERE (e.title LIKE ? OR e.venue LIKE ?) AND (? = '' OR e.category = ?)
     ORDER BY e.event_date ASC`, [uid, q, q, category, category]);
  res.json(rows);
});

// POST /api/events   (admin)
exports.create = asyncHandler(async (req, res) => {
  const e = validateEvent(req.body);
  const [r] = await pool.query(
    'INSERT INTO events (title, description, venue, category, event_date, capacity, created_by) VALUES (?,?,?,?,?,?,?)',
    [e.title, e.description, e.venue, e.category, e.event_date, e.capacity, req.session.user.id]);
  res.status(201).json({ id: r.insertId, message: 'Event created' });
});

// PUT /api/events/:id   (admin)
exports.update = asyncHandler(async (req, res) => {
  const e = validateEvent(req.body);
  const [r] = await pool.query(
    'UPDATE events SET title=?, description=?, venue=?, category=?, event_date=?, capacity=? WHERE id=?',
    [e.title, e.description, e.venue, e.category, e.event_date, e.capacity, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Event not found');
  res.json({ message: 'Event updated' });
});

// DELETE /api/events/:id   (admin)
exports.remove = asyncHandler(async (req, res) => {
  const [r] = await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'Event not found');
  res.json({ message: 'Event deleted' });
});

// GET /api/events/:id/attendees   (admin)
exports.attendees = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT u.name, u.email, r.registered_at FROM registrations r
     JOIN users u ON u.id = r.user_id WHERE r.event_id = ? ORDER BY r.registered_at`, [req.params.id]);
  res.json(rows);
});

// GET /api/stats   (admin) - numbers for the dashboard
exports.stats = asyncHandler(async (req, res) => {
  const [[row]] = await pool.query(
    `SELECT (SELECT COUNT(*) FROM events) AS events,
            (SELECT COUNT(*) FROM events WHERE event_date >= NOW()) AS upcoming,
            (SELECT COUNT(*) FROM users WHERE role = 'user') AS users,
            (SELECT COUNT(*) FROM registrations) AS registrations`);
  res.json(row);
});
