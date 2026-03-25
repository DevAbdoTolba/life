import { useCallback } from 'react';
import { useTargetStore } from '../../stores/targetStore';
import type { PillarId, SwipeDirection } from '../../constants/pillars';
import { RADIAL_MENU_RADIUS, RADIAL_HIT_RADIUS } from './constants';
import type { Target } from '../../database/types';

export interface TargetPosition {
  target: Target;
  x: number;
  y: number;
  angle: number;
}

/**
 * Pure fan position calculation — exported for unit testing.
 * Computes symmetric 30-degree-interval positions around the base direction angle.
 */
export function computeFanPositions(
  targets: Target[],
  direction: SwipeDirection,
  radius: number = RADIAL_MENU_RADIUS
): TargetPosition[] {
  if (targets.length === 0) return [];

  let baseAngle = 0;
  switch (direction) {
    case 'up': baseAngle = 90; break;
    case 'left': baseAngle = 180; break;
    case 'down': baseAngle = 270; break;
    case 'right': baseAngle = 0; break;
  }

  const STEP_DEG = 30;
  const spread = (targets.length - 1) * STEP_DEG;
  const startAngle = baseAngle - spread / 2;

  return targets.map((target, idx) => {
    const angle = startAngle + STEP_DEG * idx;
    const angleRad = angle * (Math.PI / 180);
    return {
      target,
      x: radius * Math.cos(angleRad),
      y: -radius * Math.sin(angleRad),
      angle,
    };
  });
}

export function useRadialMenu(pillarId: PillarId) {
  const getActiveTargetsByPillar = useTargetStore((state) => state.getActiveTargetsByPillar);
  const targets = getActiveTargetsByPillar(pillarId);

  const getTargetPositions = useCallback((direction: SwipeDirection): TargetPosition[] => {
    return computeFanPositions(targets, direction);
  }, [targets]);

  const getClosestTarget = useCallback((x: number, y: number, positions: TargetPosition[]): Target | null => {
    let closest: Target | null = null;
    let minDist = RADIAL_HIT_RADIUS;

    for (const pos of positions) {
      const dist = Math.sqrt((pos.x - x) ** 2 + (pos.y - y) ** 2);
      if (dist < minDist) {
        minDist = dist;
        closest = pos.target;
      }
    }
    return closest;
  }, []);

  return { targets, getTargetPositions, getClosestTarget };
}
