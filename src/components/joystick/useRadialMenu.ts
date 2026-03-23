import { useCallback } from 'react';
import { useTargetStore } from '../../stores/targetStore';
import type { PillarId, SwipeDirection } from '../../constants/pillars';
import { RADIAL_MENU_RADIUS, RADIAL_ARC_SPAN, RADIAL_HIT_RADIUS } from './constants';
import type { Target } from '../../database/types';

export interface TargetPosition {
  target: Target;
  x: number;
  y: number;
  angle: number;
}

export function useRadialMenu(pillarId: PillarId) {
  const getTargetsByPillar = useTargetStore((state) => state.getTargetsByPillar);
  const targets = getTargetsByPillar(pillarId);

  const getTargetPositions = useCallback((direction: SwipeDirection): TargetPosition[] => {
    if (targets.length === 0) return [];
    
    // Joystick uses: right=0, up=90, left=180, down=270
    let baseAngle = 0;
    switch (direction) {
      case 'up': baseAngle = 90; break;
      case 'left': baseAngle = 180; break;
      case 'down': baseAngle = 270; break;
      case 'right': baseAngle = 0; break;
    }

    const n = targets.length;
    const startAngle = baseAngle - RADIAL_ARC_SPAN / 2;
    const step = n > 1 ? RADIAL_ARC_SPAN / (n - 1) : 0;

    return targets.map((target, idx) => {
      const angle = n === 1 ? baseAngle : startAngle + step * idx;
      const angleRad = angle * (Math.PI / 180);
      
      return {
        target,
        x: RADIAL_MENU_RADIUS * Math.cos(angleRad),
        // Invert Y for React Native coordinates (Y points down)
        y: -RADIAL_MENU_RADIUS * Math.sin(angleRad),
        angle,
      };
    });
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
