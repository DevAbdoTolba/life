import * as SQLite from 'expo-sqlite';
import type { StateStorage } from 'zustand/middleware';

// Single SQLite database for key-value storage
const db = SQLite.openDatabaseSync('hayat-storage.db');
db.execSync(
  'CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT)'
);

/**
 * Zustand-compatible storage adapter using expo-sqlite.
 * Used with zustand's persist middleware.
 */
export const zustandStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const result = db.getFirstSync<{ value: string }>(
      'SELECT value FROM kv WHERE key = ?',
      name
    );
    return result?.value ?? null;
  },
  setItem: (name: string, value: string): void => {
    db.runSync(
      'INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)',
      name,
      value
    );
  },
  removeItem: (name: string): void => {
    db.runSync('DELETE FROM kv WHERE key = ?', name);
  },
};
