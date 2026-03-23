import type { PillarId, SwipeDirection } from '../../constants/pillars';

/**
 * Result of a joystick swipe gesture.
 */
export interface SwipeResult {
  pillarId: PillarId;
  direction: SwipeDirection;
  wasHeld: boolean;
}

/**
 * Props for the Joystick component.
 */
export interface JoystickProps {
  pillarId: PillarId;
  onSwipe: (result: SwipeResult) => void;
  onHoldStart?: (direction: SwipeDirection) => void;
  onHoldEnd?: () => void;
  disabled?: boolean;
}

/**
 * Internal state of the joystick gesture.
 */
export type JoystickState = 'idle' | 'dragging' | 'holding' | 'completing';
