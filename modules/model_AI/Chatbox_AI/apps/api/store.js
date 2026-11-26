import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
export function createStore(path) {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA secure_delete=ON;
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY, owner TEXT NOT NULL, role TEXT NOT NULL,
      content TEXT NOT NULL, created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS messages_owner ON messages(owner, id);`);
  return {
    list(owner) { return db.prepare('SELECT id, role, content, created_at FROM (SELECT * FROM messages WHERE owner=? ORDER BY id DESC LIMIT 100) ORDER BY id').all(owner); },
    appendPair(owner, question, answer) {
      db.exec('BEGIN IMMEDIATE');
      try {
        const insert = db.prepare('INSERT INTO messages(owner,role,content,created_at) VALUES(?,?,?,?)');
        insert.run(owner, 'user', question, Date.now()); insert.run(owner, 'assistant', answer, Date.now());
        db.prepare('DELETE FROM messages WHERE owner=? AND id NOT IN (SELECT id FROM messages WHERE owner=? ORDER BY id DESC LIMIT 100)').run(owner, owner);
        db.exec('COMMIT');
      } catch(e) { db.exec('ROLLBACK'); throw e; }
    },
    clear(owner) { db.prepare('DELETE FROM messages WHERE owner=?').run(owner); },
    prune(before) { db.prepare('DELETE FROM messages WHERE created_at<?').run(before); },
    close() { db.close(); },
  };
}
