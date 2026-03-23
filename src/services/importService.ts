import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getDatabase } from '../database/db';
import type { BackupFile } from './exportService';

export type { BackupFile };

export interface BackupSummary {
  logCount: number;
  targetCount: number;
  periodCount: number;
  oldestLog: string | null;
  newestLog: string | null;
  rawData: BackupFile;
}

/**
 * Open document picker for user to select a JSON backup file.
 * Per D-03: Validates schema structure and returns summary for user confirmation.
 * Returns null if user cancels.
 */
export async function pickBackupFile(): Promise<BackupSummary | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true, // Critical for Android content:// URIs
  });

  if (result.canceled) return null;

  const uri = result.assets[0].uri;
  const content = await FileSystem.readAsStringAsync(uri);
  let parsed: BackupFile;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('File is not valid JSON');
  }

  // Schema validation
  if (
    parsed.version !== 1 ||
    !parsed.data ||
    !Array.isArray(parsed.data.logs) ||
    !Array.isArray(parsed.data.targets)
  ) {
    throw new Error('Invalid or incompatible backup file');
  }

  const logs = parsed.data.logs;
  return {
    logCount: logs.length,
    targetCount: parsed.data.targets.length,
    periodCount: parsed.data.periods?.length ?? 0,
    oldestLog: logs.length > 0 ? logs[0].created_at : null,
    newestLog: logs.length > 0 ? logs[logs.length - 1].created_at : null,
    rawData: parsed,
  };
}

/**
 * Restore database from a validated backup file.
 * Per D-04: Full replace — DELETEs all existing data then INSERTs backup data.
 * Must be called after user confirms via pickBackupFile summary.
 */
export async function restoreFromBackup(backup: BackupFile): Promise<void> {
  const db = getDatabase();

  // Full replace: clear all tables first
  await db.execAsync(
    'DELETE FROM logs; DELETE FROM target_history; DELETE FROM targets; DELETE FROM periods; DELETE FROM settings;'
  );

  // Re-insert logs
  for (const log of backup.data.logs) {
    await db.runAsync(
      'INSERT INTO logs (id, pillar_id, direction, target_id, note, created_at, _status, _changed) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [log.id, log.pillar_id, log.direction, log.target_id ?? null, log.note ?? null, log.created_at, log._status ?? 'active', log._changed ?? '']
    );
  }

  // Re-insert targets
  for (const t of backup.data.targets) {
    await db.runAsync(
      'INSERT INTO targets (id, pillar_id, real_name, codename, is_masked, status, created_at, updated_at, _status, _changed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [t.id, t.pillar_id, t.real_name, t.codename ?? null, t.is_masked ?? 0, t.status ?? 'active', t.created_at, t.updated_at, t._status ?? 'active', t._changed ?? '']
    );
  }

  // Re-insert target_history
  for (const h of (backup.data.target_history ?? [])) {
    await db.runAsync(
      'INSERT INTO target_history (id, target_id, old_status, new_status, changed_at) VALUES (?, ?, ?, ?, ?)',
      [h.id, h.target_id, h.old_status, h.new_status, h.changed_at]
    );
  }

  // Re-insert periods
  for (const p of (backup.data.periods ?? [])) {
    await db.runAsync(
      'INSERT INTO periods (id, name, start_date, end_date, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [p.id, p.name, p.start_date, p.end_date, p.is_active ?? 1, p.created_at]
    );
  }

  // Re-insert settings
  for (const s of (backup.data.settings ?? [])) {
    await db.runAsync(
      'INSERT INTO settings (key, value) VALUES (?, ?)',
      [s.key, s.value]
    );
  }
}
