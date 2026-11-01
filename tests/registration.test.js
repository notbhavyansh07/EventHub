// Tests the registration business rules with a FAKE database (no MySQL needed).
const test = require('node:test');
const assert = require('node:assert');

let scenario; // set by each test
const fakePool = { getConnection: async () => ({
  beginTransaction: async () => {}, commit: async () => { scenario.committed = true; },
  rollback: async () => { scenario.rolledBack = true; }, release: () => {},
  query: async sql => {
    if (sql.includes('FOR UPDATE')) return [[scenario.event]];
    if (sql.includes('COUNT(*)')) return [[{ c: scenario.count }]];
    if (sql.startsWith('INSERT')) { if (scenario.duplicate) { const e = new Error('dup'); e.code = 'ER_DUP_ENTRY'; throw e; } return [{}]; }
  }
}) };
const dbPath = require.resolve('../src/config/db');
require.cache[dbPath] = { id: dbPath, filename: dbPath, loaded: true, exports: fakePool };
const { register } = require('../src/controllers/registrationController');

function run(s) {
  scenario = { committed: false, rolledBack: false, ...s };
  return new Promise(resolve => {
    const req = { params: { id: 1 }, session: { user: { id: 7 } } };
    const res = { statusCode: 200, status(c) { this.statusCode = c; return this; }, json(b) { resolve({ res: this, body: b, err: null }); } };
    register(req, res, err => resolve({ res, body: null, err }));
  });
}

test('registers when seats are free', async () => {
  const r = await run({ event: { capacity: 10, is_past: 0 }, count: 3 });
  assert.strictEqual(r.res.statusCode, 201); assert.ok(scenario.committed);
});
test('blocks when the event is full (409) and rolls back', async () => {
  const r = await run({ event: { capacity: 3, is_past: 0 }, count: 3 });
  assert.strictEqual(r.err.status, 409); assert.match(r.err.message, /full/); assert.ok(scenario.rolledBack);
});
test('blocks a past event (400)', async () => {
  const r = await run({ event: { capacity: 10, is_past: 1 }, count: 0 });
  assert.strictEqual(r.err.status, 400);
});
test('returns 404 for an unknown event', async () => {
  const r = await run({ event: undefined, count: 0 });
  assert.strictEqual(r.err.status, 404);
});
test('blocks duplicate registration (409)', async () => {
  const r = await run({ event: { capacity: 10, is_past: 0 }, count: 1, duplicate: true });
  assert.strictEqual(r.err.status, 409); assert.match(r.err.message, /already registered/);
});
