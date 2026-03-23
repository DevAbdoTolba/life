/**
 * SQLite schema definitions for Hayat.
 * 5 tables: logs, targets, target_history, periods, settings
 *
 * Note: _status and _changed fields on logs and targets are for
 * future WatermelonDB migration compatibility (ADR-002).
 */

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = [
  // Action logs: the core data entity
  `CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    pillar_id INTEGER NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('up', 'down', 'left', 'right')),
    target_id TEXT,
    note TEXT,
    created_at TEXT NOT NULL,
    _status TEXT DEFAULT 'active',
    _changed TEXT DEFAULT ''
  );`,

  // Goals/targets per pillar
  `CREATE TABLE IF NOT EXISTS targets (
    id TEXT PRIMARY KEY,
    pillar_id INTEGER NOT NULL CHECK(pillar_id IN (1, 2, 3)),
    real_name TEXT NOT NULL,
    codename TEXT,
    is_masked INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'failed', 'reduced', 'increased')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    _status TEXT DEFAULT 'active',
    _changed TEXT DEFAULT ''
  );`,

  // Target lifecycle changelog
  `CREATE TABLE IF NOT EXISTS target_history (
    id TEXT PRIMARY KEY,
    target_id TEXT NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_at TEXT NOT NULL,
    FOREIGN KEY (target_id) REFERENCES targets(id)
  );`,

  // Custom evaluation periods
  `CREATE TABLE IF NOT EXISTS periods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );`,

  // Key-value settings
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,

  // Indexes for common queries
  `CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);`,
  `CREATE INDEX IF NOT EXISTS idx_logs_pillar_id ON logs(pillar_id);`,
  `CREATE INDEX IF NOT EXISTS idx_targets_pillar_id ON targets(pillar_id);`,
  `CREATE INDEX IF NOT EXISTS idx_targets_status ON targets(status);`,
  `CREATE INDEX IF NOT EXISTS idx_target_history_target_id ON target_history(target_id);`,
];
