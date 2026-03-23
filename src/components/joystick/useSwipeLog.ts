import { useRef, useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { useLogStore } from '../../stores/logStore';
import type { PillarId } from '../../constants/pillars';
import type { SwipeResult } from './types';
import { DEBOUNCE_MS } from './constants';

export function useSwipeLog(pillarId: PillarId) {
  const addLog = useLogStore((state) => state.addLog);
  const [pendingLogId, setPendingLogId] = useState<string | null>(null);
  const lastSwipeTime = useRef<number>(0);

  const handleSwipe = useCallback(async (result: SwipeResult, targetId: string | null = null) => {
    const now = Date.now();
    if (now - lastSwipeTime.current < DEBOUNCE_MS) {
      return;
    }
    lastSwipeTime.current = now;

    const logId = await addLog(result.pillarId, result.direction, targetId);

    if (targetId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Small delay prevents gesture handler conflict with modal autoFocus
    setTimeout(() => setPendingLogId(logId), 50);
  }, [addLog]);

  const clearPendingLogId = useCallback(() => setPendingLogId(null), []);

  return { handleSwipe, pendingLogId, clearPendingLogId };
}
