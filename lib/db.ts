import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'pluto.db');

// Only log SQL in development
const db = new Database(dbPath, {
  verbose: process.env.NODE_ENV === 'development' ? undefined : undefined,
});
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema Init ────────────────────────────────────────────────

const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      email        TEXT    UNIQUE NOT NULL,
      password_hash TEXT   NOT NULL,
      bio          TEXT,
      created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT    NOT NULL DEFAULT 'New Chat',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role       TEXT    NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content    TEXT    NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
  `);

  // ── Migrate existing users table to add new columns if missing ──
  const userCols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const colNames = userCols.map(c => c.name);
  if (!colNames.includes('bio')) {
    db.exec('ALTER TABLE users ADD COLUMN bio TEXT');
  }
  if (!colNames.includes('updated_at')) {
    // SQLite doesn't allow non-constant defaults in ALTER TABLE,
    // so add column without default then backfill existing rows.
    db.exec('ALTER TABLE users ADD COLUMN updated_at DATETIME');
    db.exec("UPDATE users SET updated_at = created_at WHERE updated_at IS NULL");
  }

};

initDb();

export default db;
