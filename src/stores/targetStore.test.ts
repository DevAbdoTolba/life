import { useTargetStore } from './targetStore';
import type { Target } from '../database/types';

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

function makeTarget(overrides: Partial<Target> = {}): Target {
  return {
    id: 'target-' + Math.random(),
    pillarId: 1,
    realName: 'Test Target',
    codename: null,
    isMasked: false,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

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

describe('targetStore — getActiveTargetsByPillar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTargetStore.setState({ targets: [], isLoading: false });
  });

  it('returns [] when no targets exist for the pillar', () => {
    useTargetStore.setState({ targets: [] });
    const result = useTargetStore.getState().getActiveTargetsByPillar(1);
    expect(result).toEqual([]);
  });

  it('returns both targets when 2 active targets exist for pillarId=1', () => {
    const t1 = makeTarget({ id: 't1', pillarId: 1, status: 'active' });
    const t2 = makeTarget({ id: 't2', pillarId: 1, status: 'active' });
    useTargetStore.setState({ targets: [t1, t2] });
    const result = useTargetStore.getState().getActiveTargetsByPillar(1);
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id)).toEqual(['t1', 't2']);
  });

  it('returns only 3 targets when 5 active targets exist for pillarId=1', () => {
    const targets = Array.from({ length: 5 }, (_, i) =>
      makeTarget({ id: `t${i + 1}`, pillarId: 1, status: 'active' })
    );
    useTargetStore.setState({ targets });
    const result = useTargetStore.getState().getActiveTargetsByPillar(1);
    expect(result).toHaveLength(3);
  });

  it('excludes targets with status="completed"', () => {
    const active = makeTarget({ id: 'active', pillarId: 1, status: 'active' });
    const completed = makeTarget({ id: 'completed', pillarId: 1, status: 'completed' });
    useTargetStore.setState({ targets: [active, completed] });
    const result = useTargetStore.getState().getActiveTargetsByPillar(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('active');
  });

  it('excludes targets with status="deleted"', () => {
    const active = makeTarget({ id: 'active', pillarId: 1, status: 'active' });
    const deleted = makeTarget({ id: 'deleted', pillarId: 1, status: 'deleted' });
    useTargetStore.setState({ targets: [active, deleted] });
    const result = useTargetStore.getState().getActiveTargetsByPillar(1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('active');
  });

  it('only returns targets for the queried pillarId', () => {
    const p1 = makeTarget({ id: 'p1', pillarId: 1, status: 'active' });
    const p2 = makeTarget({ id: 'p2', pillarId: 2, status: 'active' });
    useTargetStore.setState({ targets: [p1, p2] });
    const result = useTargetStore.getState().getActiveTargetsByPillar(1);
    expect(result).toHaveLength(1);
    expect(result[0].pillarId).toBe(1);
  });
});
