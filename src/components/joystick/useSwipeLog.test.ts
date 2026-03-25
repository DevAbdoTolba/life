/**
 * Unit tests for useSwipeLog — note mode gate (UX-01, D-07, D-08).
 * Verifies pendingLogId is only set when noteMode=true.
 *
 * Runs under the 'native' jest project (jest-expo preset) which supports React hooks.
 */
import React from 'react';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { act, create } = require('react-test-renderer') as typeof import('react-test-renderer');
import { useSwipeLog } from './useSwipeLog';
import type { SwipeResult } from './types';
import type { PillarId } from '../../constants/pillars';

const mockAddLog = jest.fn().mockResolvedValue('log-123');

jest.mock('../../stores/logStore', () => ({
  useLogStore: jest.fn((selector: any) =>
    selector({ addLog: mockAddLog })
  ),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success' },
}));

const swipeResult: SwipeResult = {
  pillarId: 1,
  direction: 'up',
  wasHeld: false,
};

// Helper: render hook using react-test-renderer
function renderUseSwipeLog(pillarId: PillarId) {
  let hookResult: ReturnType<typeof useSwipeLog> | undefined;

  function TestComponent() {
    hookResult = useSwipeLog(pillarId);
    return null;
  }

  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(React.createElement(TestComponent));
  });

  return {
    get current() {
      return hookResult!;
    },
    renderer: renderer!,
  };
}

describe('useSwipeLog — note mode gate (UX-01)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockAddLog.mockResolvedValue('log-123');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does NOT set pendingLogId when noteMode is false', async () => {
    const hook = renderUseSwipeLog(1);

    await act(async () => {
      await hook.current.handleSwipe(swipeResult, null, false);
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(hook.current.pendingLogId).toBeNull();
  });

  it('does NOT set pendingLogId when noteMode is omitted (defaults false)', async () => {
    const hook = renderUseSwipeLog(1);

    await act(async () => {
      await hook.current.handleSwipe(swipeResult);
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(hook.current.pendingLogId).toBeNull();
  });

  it('DOES set pendingLogId when noteMode is true', async () => {
    const hook = renderUseSwipeLog(1);

    await act(async () => {
      await hook.current.handleSwipe(swipeResult, null, true);
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(hook.current.pendingLogId).toBe('log-123');
  });

  it('still calls addLog regardless of noteMode', async () => {
    const hook = renderUseSwipeLog(1);

    await act(async () => {
      await hook.current.handleSwipe(swipeResult, null, false);
    });

    expect(mockAddLog).toHaveBeenCalledWith(1, 'up', null);
  });
});
