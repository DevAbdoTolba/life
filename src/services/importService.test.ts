// Mock expo-document-picker
jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

// Mock expo-file-system/legacy
jest.mock('expo-file-system/legacy', () => ({
  readAsStringAsync: jest.fn(),
}));

// Mock database
const mockExecAsync = jest.fn();
const mockRunAsync = jest.fn();
jest.mock('../database/db', () => ({
  getDatabase: () => ({
    execAsync: mockExecAsync,
    runAsync: mockRunAsync,
  }),
}));

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { pickBackupFile, restoreFromBackup } from './importService';
import type { BackupFile } from './exportService';

beforeEach(() => {
  jest.clearAllMocks();
  mockExecAsync.mockResolvedValue(undefined);
  mockRunAsync.mockResolvedValue(undefined);
});

const validBackup: BackupFile = {
  version: 1,
  appVersion: '1.0.0',
  exportedAt: '2026-01-01T00:00:00.000Z',
  data: {
    logs: [
      { id: 'l1', pillar_id: 1, direction: 'up', created_at: '2026-01-01T08:00:00Z' },
      { id: 'l2', pillar_id: 2, direction: 'down', created_at: '2026-01-15T12:00:00Z' },
    ],
    targets: [{ id: 't1', pillar_id: 1, real_name: 'Prayer', status: 'active' }],
    target_history: [],
    periods: [],
    settings: [],
  },
};

describe('pickBackupFile', () => {
  test('Test 1: returns null when user cancels document picker', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({ canceled: true });

    const result = await pickBackupFile();
    expect(result).toBeNull();
  });

  test('Test 2: throws "Invalid or incompatible backup file" when JSON has no version field', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///test.json' }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      JSON.stringify({ data: { logs: [], targets: [] } }) // no version
    );

    await expect(pickBackupFile()).rejects.toThrow('Invalid or incompatible backup file');
  });

  test('Test 3: throws when JSON has no data.logs field', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///test.json' }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      JSON.stringify({ version: 1, data: { targets: [] } }) // no data.logs
    );

    await expect(pickBackupFile()).rejects.toThrow('Invalid or incompatible backup file');
  });

  test('Test 4: returns correct BackupSummary from valid backup', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock).mockResolvedValue({
      canceled: false,
      assets: [{ uri: 'file:///backup.json' }],
    });
    (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValue(
      JSON.stringify(validBackup)
    );

    const summary = await pickBackupFile();
    expect(summary).not.toBeNull();
    expect(summary!.logCount).toBe(2);
    expect(summary!.targetCount).toBe(1);
    expect(summary!.oldestLog).toBe('2026-01-01T08:00:00Z');
    expect(summary!.newestLog).toBe('2026-01-15T12:00:00Z');
  });
});

describe('restoreFromBackup', () => {
  test('Test 5: DELETEs all rows from all 5 tables before inserting', async () => {
    await restoreFromBackup(validBackup);

    expect(mockExecAsync).toHaveBeenCalledTimes(1);
    const execCall = (mockExecAsync as jest.Mock).mock.calls[0][0];
    expect(execCall).toContain('DELETE FROM logs');
    expect(execCall).toContain('DELETE FROM target_history');
    expect(execCall).toContain('DELETE FROM targets');
    expect(execCall).toContain('DELETE FROM periods');
    expect(execCall).toContain('DELETE FROM settings');
  });

  test('Test 6: INSERTs all log rows from backup data', async () => {
    await restoreFromBackup(validBackup);

    // 2 logs + 1 target = 3 runAsync calls
    const logInserts = (mockRunAsync as jest.Mock).mock.calls.filter(
      ([sql]) => sql.includes('INSERT INTO logs')
    );
    expect(logInserts).toHaveLength(2);
  });
});
