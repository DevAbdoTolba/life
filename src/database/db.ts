import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the database. Creates tables if they don't exist.
 * Must be called once during app boot before any data operations.
 */
export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;

  try {
    db = await SQLite.openDatabaseAsync('hayat.db');

    // Enable WAL mode for better performance
    await db.execAsync('PRAGMA journal_mode = WAL;');

    // Create all tables
    for (const sql of CREATE_TABLES_SQL) {
      await db.execAsync(sql);
    }

    // Set schema version if not exists
    await db.runAsync(
      `INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`,
      ['schema_version', String(SCHEMA_VERSION)]
    );

    console.log('[Hayat DB] Database initialized successfully');
    return db;
  } catch (error) {
    console.error('[Hayat DB] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get the database instance. Throws if not initialized.
 */
export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    throw new Error(
      '[Hayat DB] Database not initialized. Call initDatabase() first.'
    );
  }
  return db;
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    console.log('[Hayat DB] Database closed');
  }
}
