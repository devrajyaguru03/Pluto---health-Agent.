import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'pluto.db');

// Ensure the database file exists
const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

// Initialize database schema
const initDb = () => {
  const checkTable = db.prepare("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='users'").get() as { count: number };
  
  if (checkTable.count === 0) {
    console.log('Initializing database schema...');
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Database initialized successfully.');
  }
};

initDb();

export default db;
