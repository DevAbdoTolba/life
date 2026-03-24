import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES_SQL, SCHEMA_VERSION } from './schema';

async function migrateSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'schema_version'`
  );
  const currentVersion = row ? parseInt(row.value, 10) : 1;

  if (currentVersion < 2) {
    // SQLite cannot ALTER CHECK constraints. Recreate the targets table.
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS targets_v2 (
        id TEXT PRIMARY KEY,
        pillar_id INTEGER NOT NULL CHECK(pillar_id IN (1, 2, 3)),
        real_name TEXT NOT NULL,
        codename TEXT,
        is_masked INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'failed', 'reduced', 'increased', 'deleted')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        _status TEXT DEFAULT 'active',
        _changed TEXT DEFAULT ''
      );
      INSERT INTO targets_v2 SELECT * FROM targets;
      DROP TABLE targets;
      ALTER TABLE targets_v2 RENAME TO targets;
      CREATE INDEX IF NOT EXISTS idx_targets_pillar_id ON targets(pillar_id);
      CREATE INDEX IF NOT EXISTS idx_targets_status ON targets(status);
    `);
    await db.runAsync(
      `UPDATE settings SET value = ? WHERE key = 'schema_version'`,
      [String(SCHEMA_VERSION)]
    );
    console.log('[Hayat DB] Migrated schema from v1 to v2');
  }
}

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

    // Run schema migrations
    await migrateSchema(db);

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
