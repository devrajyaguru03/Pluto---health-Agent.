import { createClient, type Client, type InStatement, type InArgs } from '@libsql/client';

let _db: Client | null = null;

export function getDb(): Client {
  if (!_db) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error('TURSO_DATABASE_URL environment variable is required');
    }

    _db = createClient({ url, authToken });
  }
  return _db;
}

// Typed helper that mirrors the full overloaded Client.execute signature
export const db = {
  execute(stmt: InStatement): ReturnType<Client['execute']> {
    return getDb().execute(stmt as any);
  },
  executeMultiple(sql: string): Promise<void> {
    return getDb().executeMultiple(sql);
  },
  batch(stmts: InStatement[], mode?: 'write' | 'read' | 'deferred'): ReturnType<Client['batch']> {
    return getDb().batch(stmts as any, mode);
  },
};

// ─── Schema Init ────────────────────────────────────────────────

export async function initDb() {
  await db.executeMultiple(`
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
}
