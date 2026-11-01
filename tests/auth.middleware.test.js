const test = require('node:test');
const assert = require('node:assert');
const { requireLogin, requireAdmin } = require('../src/middleware/auth');

const call = (mw, session) => { let e; mw({ session }, {}, err => { e = err; }); return e; };

test('requireLogin: blocks guests with 401', () => assert.strictEqual(call(requireLogin, {}).status, 401));
test('requireLogin: lets a user through', () => assert.strictEqual(call(requireLogin, { user: { role: 'user' } }), undefined));
test('requireAdmin: blocks guests with 401', () => assert.strictEqual(call(requireAdmin, {}).status, 401));
test('requireAdmin: blocks normal users with 403', () => assert.strictEqual(call(requireAdmin, { user: { role: 'user' } }).status, 403));
test('requireAdmin: lets an admin through', () => assert.strictEqual(call(requireAdmin, { user: { role: 'admin' } }), undefined));
