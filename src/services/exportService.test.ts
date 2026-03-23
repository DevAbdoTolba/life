// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation((dir, name) => ({
    uri: `file://${dir}/${name}`,
    write: jest.fn(),
  })),
  Paths: { cache: '/mock/cache' },
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
}));

// Mock database
const mockGetAllAsync = jest.fn();
jest.mock('../database/db', () => ({
  getDatabase: () => ({ getAllAsync: mockGetAllAsync }),
}));

import { exportAllData } from './exportService';
import * as Sharing from 'expo-sharing';
import { File } from 'expo-file-system';

beforeEach(() => {
  jest.clearAllMocks();
  // Default: each getAllAsync returns an empty array
  mockGetAllAsync.mockResolvedValue([]);
  (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
});

describe('exportAllData', () => {
  test('Test 1: queries all 5 tables', async () => {
    await exportAllData();
    expect(mockGetAllAsync).toHaveBeenCalledTimes(5);
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM logs ORDER BY created_at ASC');
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM targets');
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM target_history');
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM periods');
    expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM settings');
  });

  test('Test 2: backup JSON has correct structure', async () => {
    await exportAllData();

    const mockFileInstance = (File as unknown as jest.Mock).mock.results[0].value;
    const writeCall = mockFileInstance.write.mock.calls[0][0];
    const backup = JSON.parse(writeCall);

    expect(backup.version).toBe(1);
    expect(backup.appVersion).toBeDefined();
    expect(typeof backup.exportedAt).toBe('string');
    // exportedAt should be a valid ISO date string
    expect(() => new Date(backup.exportedAt)).not.toThrow();
    expect(backup.data).toBeDefined();
    expect(Object.keys(backup.data)).toEqual(
      expect.arrayContaining(['logs', 'targets', 'target_history', 'periods', 'settings'])
    );
  });

  test('Test 3: backup.data.logs and backup.data.targets are arrays', async () => {
    mockGetAllAsync.mockResolvedValue([{ id: '1' }]);
    await exportAllData();

    const mockFileInstance = (File as unknown as jest.Mock).mock.results[0].value;
    const writeCall = mockFileInstance.write.mock.calls[0][0];
    const backup = JSON.parse(writeCall);

    expect(Array.isArray(backup.data.logs)).toBe(true);
    expect(Array.isArray(backup.data.targets)).toBe(true);
  });

  test('Test 4: calls Sharing.shareAsync with mimeType application/json', async () => {
    await exportAllData();

    expect(Sharing.shareAsync).toHaveBeenCalledTimes(1);
    const [, options] = (Sharing.shareAsync as jest.Mock).mock.calls[0];
    expect(options.mimeType).toBe('application/json');
  });

  test('Test 5: throws if Sharing.isAvailableAsync returns false', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);

    await expect(exportAllData()).rejects.toThrow('Sharing is not available on this device');
  });
});
