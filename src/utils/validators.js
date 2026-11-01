// Server-side validation. Pure functions: easy to unit-test (see tests/).
const HttpError = require('./HttpError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CATEGORIES = ['Workshop', 'Seminar', 'Competition', 'Cultural', 'Sports', 'Other'];

function validateSignup(b = {}) {
  const name = String(b.name || '').trim();
  const email = String(b.email || '').trim().toLowerCase();
  const password = String(b.password || '');
  if (name.length < 2 || name.length > 80) throw new HttpError(400, 'Name must be 2-80 characters');
  if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address');
  if (password.length < 8) throw new HttpError(400, 'Password must be at least 8 characters');
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) throw new HttpError(400, 'Password must contain a letter and a number');
  return { name, email, password };
}

function validateEvent(b = {}) {
  const title = String(b.title || '').trim();
  const venue = String(b.venue || '').trim();
  const description = String(b.description || '').trim();
  const category = CATEGORIES.includes(b.category) ? b.category : 'Other';
  const capacity = Number(b.capacity);
  const date = new Date(b.event_date);
  if (title.length < 3 || title.length > 150) throw new HttpError(400, 'Title must be 3-150 characters');
  if (!venue || venue.length > 150) throw new HttpError(400, 'Venue is required (max 150 characters)');
  if (!b.event_date || isNaN(date.getTime())) throw new HttpError(400, 'A valid date and time is required');
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 10000) throw new HttpError(400, 'Capacity must be a whole number from 1 to 10000');
  return { title, venue, description, category, capacity, event_date: String(b.event_date).replace('T', ' ') };
}

module.exports = { validateSignup, validateEvent, CATEGORIES, EMAIL_RE };
