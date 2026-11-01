// SQLite connection and emulation layer matching mysql2/promise pool interface
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const dbDir = path.join(__dirname, '..', '..', 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbFile = path.join(dbDir, 'eventhub.sqlite');
const db = new DatabaseSync(dbFile);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

// Define MySQL NOW() function
db.function('NOW', () => new Date().toISOString().replace('T', ' ').slice(0, 19));

// Initialize schema if not present
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'user',
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT,
    venue       TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'Other',
    event_date  DATETIME NOT NULL,
    capacity    INTEGER NOT NULL CHECK (capacity > 0),
    created_by  INTEGER NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS registrations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    event_id      INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, event_id),
    FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
  CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
`);

// Insert initial sample events if table is empty
const eventCount = db.prepare('SELECT COUNT(*) as c FROM events').get().c;
if (eventCount === 0) {
  const insertSample = db.prepare(`
    INSERT INTO events (title, description, venue, category, event_date, capacity) VALUES
    ('Intro to Web Development Workshop','Hands-on HTML, CSS and JavaScript basics for beginners.','Seminar Hall A','Workshop','2026-12-02 10:00:00',60),
    ('Hackathon 2026','12-hour team coding challenge. Bring your laptop.','Computer Lab 2','Competition','2026-12-09 09:00:00',40),
    ('Career Guidance Talk','Industry speakers discuss careers in software.','Main Auditorium','Seminar','2026-12-12 14:00:00',200),
    ('Annual Cultural Night','Music, dance and drama performances by students.','Open Air Theatre','Cultural','2026-12-18 18:00:00',300),
    ('Inter-Department Cricket Cup','Knockout cricket tournament between departments.','College Ground','Sports','2026-12-20 08:30:00',120);
  `);
  insertSample.run();
}

function normalizeSql(sql) {
  let s = sql.trim();
  // Strip FOR UPDATE
  s = s.replace(/\s+FOR\s+UPDATE/gi, '');
  // Map MySQL ON DUPLICATE KEY UPDATE for users
  if (/ON\s+DUPLICATE\s+KEY\s+UPDATE/i.test(s)) {
    s = s.replace(/ON\s+DUPLICATE\s+KEY\s+UPDATE.*$/is, 'ON CONFLICT(email) DO UPDATE SET password_hash = excluded.password_hash, role = excluded.role');
  }
  return s;
}

function executeQuery(sql, params = []) {
  const cleanSql = normalizeSql(sql);
  const isSelect = /^\s*SELECT\b/i.test(cleanSql);

  try {
    const stmt = db.prepare(cleanSql);
    if (isSelect) {
      const rows = stmt.all(...params);
      return [rows, []];
    } else {
      const info = stmt.run(...params);
      return [{
        insertId: Number(info.lastInsertRowid),
        affectedRows: info.changes
      }, []];
    }
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      err.code = 'ER_DUP_ENTRY';
    }
    throw err;
  }
}

let inTransaction = false;

const pool = {
  async query(sql, params) {
    return executeQuery(sql, params);
  },
  async getConnection() {
    return {
      async query(sql, params) {
        return executeQuery(sql, params);
      },
      async beginTransaction() {
        if (!inTransaction) {
          db.exec('BEGIN IMMEDIATE');
          inTransaction = true;
        }
      },
      async commit() {
        if (inTransaction) {
          db.exec('COMMIT');
          inTransaction = false;
        }
      },
      async rollback() {
        if (inTransaction) {
          try {
            db.exec('ROLLBACK');
          } catch (_) {}
          inTransaction = false;
        }
      },
      release() {}
    };
  }
};

module.exports = pool;
