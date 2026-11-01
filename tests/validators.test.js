const test = require('node:test');
const assert = require('node:assert');
const { validateSignup, validateEvent } = require('../src/utils/validators');

const goodEvent = { title: 'Hack Day', venue: 'Lab 1', event_date: '2026-12-01T10:00', capacity: 50, category: 'Competition' };

test('signup: accepts valid data and lower-cases the email', () => {
  const r = validateSignup({ name: ' Asha ', email: 'ASHA@Mail.com', password: 'abcd1234' });
  assert.deepStrictEqual(r, { name: 'Asha', email: 'asha@mail.com', password: 'abcd1234' });
});
test('signup: rejects short password', () => assert.throws(() => validateSignup({ name: 'Asha', email: 'a@b.co', password: 'abc12' }), /8 characters/));
test('signup: rejects password without a number', () => assert.throws(() => validateSignup({ name: 'Asha', email: 'a@b.co', password: 'abcdefgh' }), /letter and a number/));
test('signup: rejects bad email', () => assert.throws(() => validateSignup({ name: 'Asha', email: 'not-an-email', password: 'abcd1234' }), /valid email/));
test('signup: rejects empty name', () => assert.throws(() => validateSignup({ name: '', email: 'a@b.co', password: 'abcd1234' }), /Name/));

test('event: accepts valid data and fixes the date format', () => {
  const e = validateEvent(goodEvent);
  assert.strictEqual(e.event_date, '2026-12-01 10:00');
  assert.strictEqual(e.category, 'Competition');
});
test('event: unknown category falls back to Other', () => assert.strictEqual(validateEvent({ ...goodEvent, category: 'Hacking' }).category, 'Other'));
test('event: rejects capacity 0', () => assert.throws(() => validateEvent({ ...goodEvent, capacity: 0 }), /Capacity/));
test('event: rejects decimal capacity', () => assert.throws(() => validateEvent({ ...goodEvent, capacity: 10.5 }), /Capacity/));
test('event: rejects missing date', () => assert.throws(() => validateEvent({ ...goodEvent, event_date: '' }), /date/));
test('event: rejects short title', () => assert.throws(() => validateEvent({ ...goodEvent, title: 'ab' }), /Title/));
