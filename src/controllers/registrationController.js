const pool = require('../config/db');
const HttpError = require('../utils/HttpError');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/events/:id/register   (logged-in user)
exports.register = asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // Lock the event row so two people cannot take the last seat at the same moment.
    const [[ev]] = await conn.query(
      'SELECT capacity, (event_date < NOW()) AS is_past FROM events WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!ev) throw new HttpError(404, 'Event not found');
    if (ev.is_past) throw new HttpError(400, 'This event has already taken place');
    const [[{ c }]] = await conn.query('SELECT COUNT(*) AS c FROM registrations WHERE event_id = ?', [req.params.id]);
    if (c >= ev.capacity) throw new HttpError(409, 'Sorry, this event is full');
    await conn.query('INSERT INTO registrations (user_id, event_id) VALUES (?,?)', [req.session.user.id, req.params.id]);
    await conn.commit();
    res.status(201).json({ message: 'Registered successfully' });
  } catch (e) {
    await conn.rollback();
    if (e.code === 'ER_DUP_ENTRY') throw new HttpError(409, 'You are already registered for this event');
    throw e;
  } finally {
    conn.release();
  }
});

// DELETE /api/events/:id/register   (logged-in user)
exports.cancel = asyncHandler(async (req, res) => {
  const [r] = await pool.query('DELETE FROM registrations WHERE user_id = ? AND event_id = ?',
    [req.session.user.id, req.params.id]);
  if (!r.affectedRows) throw new HttpError(404, 'You are not registered for this event');
  res.json({ message: 'Registration cancelled' });
});

// GET /api/my/registrations   (logged-in user)
exports.mine = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.venue, e.category, e.event_date, r.registered_at
     FROM registrations r JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ? ORDER BY e.event_date`, [req.session.user.id]);
  res.json(rows);
});
