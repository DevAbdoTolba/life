import { useLogStore } from './logStore';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-1234'),
}));

// Mock database
const mockRunAsync = jest.fn().mockResolvedValue(undefined);
const mockGetAllAsync = jest.fn().mockResolvedValue([]);

jest.mock('../database', () => ({
  getDatabase: () => ({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  }),
}));

describe('logStore', () => {
  beforeEach(() => {
    // Reset store state
    useLogStore.setState({ todayLogs: [], isLoading: false });
    mockRunAsync.mockClear();
    mockGetAllAsync.mockClear();
  });

  describe('addLog', () => {
    it('returns the generated UUID string', async () => {
      const result = await useLogStore.getState().addLog(1, 'up');
      expect(typeof result).toBe('string');
      expect(result).toBe('test-uuid-1234');
    });

    it('inserts log with correct fields into database', async () => {
      await useLogStore.getState().addLog(2, 'down', 'target-abc', 'my note');
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockRunAsync.mock.calls[0];
      expect(sql).toContain('INSERT INTO logs');
      expect(params[0]).toBe('test-uuid-1234'); // id
      expect(params[1]).toBe(2);                // pillarId
      expect(params[2]).toBe('down');           // direction
      expect(params[3]).toBe('target-abc');     // targetId
      expect(params[4]).toBe('my note');        // note
      expect(typeof params[5]).toBe('string');  // createdAt ISO string
    });

    it('prepends new log to todayLogs state', async () => {
      await useLogStore.getState().addLog(1, 'up');
      const { todayLogs } = useLogStore.getState();
      expect(todayLogs).toHaveLength(1);
      expect(todayLogs[0].id).toBe('test-uuid-1234');
      expect(todayLogs[0].pillarId).toBe(1);
      expect(todayLogs[0].direction).toBe('up');
    });
  });

  describe('updateLogNote', () => {
    it('calls UPDATE SQL with correct id and note', async () => {
      await useLogStore.getState().updateLogNote('log-id-1', 'updated note');
      expect(mockRunAsync).toHaveBeenCalledTimes(1);
      const [sql, params] = mockRunAsync.mock.calls[0];
      expect(sql).toContain('UPDATE logs SET note');
      expect(params[0]).toBe('updated note');
      expect(params[1]).toBe('log-id-1');
    });

    it('updates todayLogs in-memory state for matching log', async () => {
      // Seed state with a log
      useLogStore.setState({
        todayLogs: [
          { id: 'log-id-1', pillarId: 1, direction: 'up', targetId: null, note: null, createdAt: '2026-01-01T00:00:00.000Z' },
          { id: 'log-id-2', pillarId: 2, direction: 'down', targetId: null, note: null, createdAt: '2026-01-01T00:01:00.000Z' },
        ],
      });

      await useLogStore.getState().updateLogNote('log-id-1', 'my new note');

      const { todayLogs } = useLogStore.getState();
      expect(todayLogs[0].note).toBe('my new note');
      expect(todayLogs[1].note).toBeNull(); // other log unchanged
    });
  });
});
