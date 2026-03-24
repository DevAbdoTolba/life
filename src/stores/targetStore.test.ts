import { useTargetStore } from './targetStore';

// Mock the database module
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();

jest.mock('../database', () => ({
  getDatabase: jest.fn(() => ({
    runAsync: mockRunAsync,
    getAllAsync: mockGetAllAsync,
  })),
}));

// Mock uuid to return a fixed value
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123'),
}));

describe('targetStore — deleteTarget', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRunAsync.mockResolvedValue(undefined);
    // Reset store state
    useTargetStore.setState({
      targets: [],
      isLoading: false,
    });
  });

  it('calls UPDATE with status="deleted" instead of DELETE', async () => {
    // Pre-populate store with a target
    useTargetStore.setState({
      targets: [
        {
          id: 'target-1',
          pillarId: 1,
          realName: 'Test Target',
          codename: null,
          isMasked: false,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    await useTargetStore.getState().deleteTarget('target-1');

    // First call should be UPDATE (not DELETE)
    expect(mockRunAsync).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE targets SET status = 'deleted'"),
      expect.any(Array)
    );

    // Ensure DELETE was NOT called
    const allCalls = mockRunAsync.mock.calls;
    const hasDelete = allCalls.some(([sql]: [string]) =>
      sql.toUpperCase().includes('DELETE FROM targets')
    );
    expect(hasDelete).toBe(false);
  });

  it('inserts a row into target_history with old_status and new_status="deleted"', async () => {
    useTargetStore.setState({
      targets: [
        {
          id: 'target-1',
          pillarId: 1,
          realName: 'Test Target',
          codename: null,
          isMasked: false,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    await useTargetStore.getState().deleteTarget('target-1');

    // Second call should be INSERT INTO target_history
    const insertCall = mockRunAsync.mock.calls.find(([sql]: [string]) =>
      sql.includes('INSERT INTO target_history')
    );
    expect(insertCall).toBeDefined();

    // Verify parameters include old_status='active' and new_status='deleted'
    const [, params] = insertCall!;
    expect(params).toContain('active');   // old_status
    expect(params).toContain('deleted');  // new_status
    expect(params).toContain('target-1'); // target_id
  });

  it('removes the target from in-memory state.targets array', async () => {
    useTargetStore.setState({
      targets: [
        {
          id: 'target-1',
          pillarId: 1,
          realName: 'Test Target',
          codename: null,
          isMasked: false,
          status: 'active',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
    });

    await useTargetStore.getState().deleteTarget('target-1');

    const { targets } = useTargetStore.getState();
    expect(targets).toHaveLength(0);
  });

  it('is a no-op when target id not found in state', async () => {
    useTargetStore.setState({ targets: [] });

    await useTargetStore.getState().deleteTarget('nonexistent-id');

    // db.runAsync should NOT be called for unknown targets
    expect(mockRunAsync).not.toHaveBeenCalled();
  });
});
