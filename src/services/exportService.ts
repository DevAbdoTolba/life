import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/db';

export interface BackupFile {
  version: number;
  appVersion: string;
  exportedAt: string;
  data: {
    logs: any[];
    targets: any[];
    target_history: any[];
    periods: any[];
    settings: any[];
  };
}

/**
 * Export all database tables to a JSON file and open the OS share sheet.
 * Per D-01: Single JSON file containing all 5 tables.
 * Per D-02: Uses expo-sharing to open OS share sheet.
 */
export async function exportAllData(): Promise<void> {
  const db = getDatabase();

  const [logs, targets, targetHistory, periods, settings] = await Promise.all([
    db.getAllAsync('SELECT * FROM logs ORDER BY created_at ASC'),
    db.getAllAsync('SELECT * FROM targets'),
    db.getAllAsync('SELECT * FROM target_history'),
    db.getAllAsync('SELECT * FROM periods'),
    db.getAllAsync('SELECT * FROM settings'),
  ]);

  const backup: BackupFile = {
    version: 1,
    appVersion: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      logs,
      targets,
      target_history: targetHistory,
      periods,
      settings,
    },
  };

  const filename = `hayat-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File(Paths.cache, filename);
  file.write(JSON.stringify(backup, null, 2));

  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing is not available on this device');
  }

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Save Hayat Backup',
    UTI: 'public.json',
  });
}
