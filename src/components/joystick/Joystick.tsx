import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  interpolateColor,
  runOnJS,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { getPillarById } from '../../constants/pillars';
import type { SwipeDirection } from '../../constants/pillars';
import { colors } from '../../constants/colors';
import type { JoystickProps, SwipeResult } from './types';
import { useSwipeLog } from './useSwipeLog';
import { NoteEntryModal } from './NoteEntryModal';
import { RadialMenu } from './RadialMenu';
import { useRadialMenu } from './useRadialMenu';
import {
  JOYSTICK_SIZE,
  KNOB_SIZE,
  SWIPE_THRESHOLD,
  HOLD_DURATION,
  MAX_DRAG_DISTANCE,
  INDICATOR_SIZE,
  CENTER_HOLD_THRESHOLD,
} from './constants';

// Snappy spring — fast snap-back, no lingering bounce
const FAST_SPRING = { damping: 28, stiffness: 400, mass: 0.8 };

/**
 * Determines swipe direction from translation vector using 45° wedges.
 * Returns null if distance is below threshold.
 */
function getSwipeDirection(
  translationX: number,
  translationY: number
): SwipeDirection | null {
  'worklet';
  const distance = Math.sqrt(translationX ** 2 + translationY ** 2);
  if (distance < SWIPE_THRESHOLD) return null;

  let angle = Math.atan2(-translationY, translationX) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  if (angle >= 315 || angle < 45) return 'right';
  if (angle >= 45 && angle < 135) return 'up';
  if (angle >= 135 && angle < 225) return 'left';
  return 'down';
}

/**
 * Maps a direction to a numeric index for shared values.
 * 0=none, 1=up, 2=down, 3=left, 4=right
 */
function directionToIndex(dir: SwipeDirection | null): number {
  'worklet';
  switch (dir) {
    case 'up': return 1;
    case 'down': return 2;
    case 'left': return 3;
    case 'right': return 4;
    default: return 0;
  }
}

function indexToDirection(idx: number): SwipeDirection | null {
  'worklet';
  switch (idx) {
    case 1: return 'up';
    case 2: return 'down';
    case 3: return 'left';
    case 4: return 'right';
    default: return null;
  }
}

/**
 * Interactive joystick with pan gesture, direction detection, and visual feedback.
 *
 * Hold behaviors:
 * - Center hold (< 15px): activates note mode for this touch (momentary)
 * - Directional hold (>= 15px for 400ms): shows target fan
 * - Center hold → drag: shows target fan immediately (note mode stays on)
 */
export function Joystick({
  pillarId,
  onSwipe,
  onHoldStart,
  onHoldEnd,
  disabled = false,
}: JoystickProps) {
  const pillar = getPillarById(pillarId);
  const { handleSwipe, pendingLogId, clearPendingLogId } = useSwipeLog(pillarId);
  const { getTargetPositions, getClosestTarget } = useRadialMenu(pillarId);

  const [radialVisible, setRadialVisible] = React.useState(false);
  const [radialDirection, setRadialDirection] = React.useState<SwipeDirection | null>(null);

  // Knob position
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Active direction indicator (0=none, 1=up, 2=down, 3=left, 4=right)
  const activeDirection = useSharedValue(0);

  // Confirmation flash opacity
  const flashOpacity = useSharedValue(0);

  // Direction color intensity (0=idle, 1=fully active)
  const dragIntensity = useSharedValue(0);

  // Direction valence: 0=positive, 1=negative
  const directionValence = useSharedValue(0);

  // Note mode — momentary, active only during a center-hold touch
  const noteModeActive = useSharedValue(0); // drives outer ring color animation
  const noteModeRef = useRef(false);        // JS-side truth for swipe gating

  // Hold state: 0=none, 1=center-held, 2=directional-held
  const holdState = useSharedValue(0);

  // Timer ref for center hold detection (JS thread)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track directional hold timing on UI thread
  const directionalHoldStart = useSharedValue(0);

  // ─── JS Callbacks ──────────────────────────────────────

  /**
   * Activate note mode on center hold (momentary — deactivates on release).
   */
  const activateNoteMode = useCallback(() => {
    noteModeRef.current = true;
    holdState.value = 1;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    noteModeActive.value = withTiming(1, { duration: 100 });
  }, [noteModeActive, holdState]);

  /**
   * Deactivate note mode on finger release.
   */
  const deactivateNoteMode = useCallback(() => {
    noteModeRef.current = false;
    noteModeActive.value = withTiming(0, { duration: 120 });
  }, [noteModeActive]);

  /**
   * Start hold timer on touch start. After HOLD_DURATION, if finger
   * is still near center, activate note mode.
   */
  const startHoldTimer = useCallback(() => {
    clearHoldTimer();
    holdTimerRef.current = setTimeout(() => {
      // Read current position from shared values
      const tx = translateX.value;
      const ty = translateY.value;
      const dist = Math.sqrt(tx * tx + ty * ty);

      if (dist < CENTER_HOLD_THRESHOLD) {
        activateNoteMode();
      }
    }, HOLD_DURATION);
  }, [activateNoteMode, translateX, translateY]);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  /**
   * Quick swipe completed — log entry.
   */
  const handleSwipeComplete = useCallback(
    (direction: SwipeDirection) => {
      const result: SwipeResult = { pillarId, direction, wasHeld: false };
      handleSwipe(result, null, noteModeRef.current);
      if (onSwipe) onSwipe(result);
    },
    [pillarId, onSwipe, handleSwipe]
  );

  /**
   * Show radial menu for directional hold.
   */
  const handleHoldStart = useCallback(
    (direction: SwipeDirection) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setRadialDirection(direction);
      setRadialVisible(true);
      onHoldStart?.(direction);
    },
    [onHoldStart]
  );

  /**
   * Directional hold ended — hit detection + log.
   */
  const handleHoldEnd = useCallback((tx: number, ty: number, dir: SwipeDirection) => {
    setRadialVisible(false);
    const positions = getTargetPositions(dir);
    const closest = getClosestTarget(tx, ty, positions);
    const result: SwipeResult = { pillarId, direction: dir, wasHeld: true };
    handleSwipe(result, closest ? closest.id : null, noteModeRef.current);
    onHoldEnd?.();
  }, [pillarId, getTargetPositions, getClosestTarget, handleSwipe, onHoldEnd]);

  /**
   * Cancel escape — dismiss radial menu, no log.
   */
  const handleHoldCancel = useCallback(() => {
    setRadialVisible(false);
  }, []);

  // ─── Gesture Setup ───────────────────────────────────

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      dragIntensity.value = 0;
      holdState.value = 0;
      directionalHoldStart.value = 0;
      runOnJS(startHoldTimer)();
    })
    .onUpdate((event) => {
      const { translationX: tx, translationY: ty } = event;

      // Clamp to max drag distance
      const distance = Math.sqrt(tx ** 2 + ty ** 2);
      const clampedDist = Math.min(distance, MAX_DRAG_DISTANCE);
      const angle = Math.atan2(ty, tx);

      translateX.value = clampedDist * Math.cos(angle);
      translateY.value = clampedDist * Math.sin(angle);

      // Update drag intensity
      dragIntensity.value = Math.min(distance / SWIPE_THRESHOLD, 1);

      // Detect current direction for indicators
      if (distance >= SWIPE_THRESHOLD * 0.6) {
        let deg = Math.atan2(-ty, tx) * (180 / Math.PI);
        if (deg < 0) deg += 360;

        let dirIdx = 0;
        if (deg >= 315 || deg < 45) dirIdx = 4;
        else if (deg >= 45 && deg < 135) dirIdx = 1;
        else if (deg >= 135 && deg < 225) dirIdx = 3;
        else dirIdx = 2;

        activeDirection.value = dirIdx;
        directionValence.value = (dirIdx === 1 || dirIdx === 4) ? 0 : 1;
      } else {
        activeDirection.value = 0;
      }

      // ── Directional hold detection ──
      if (holdState.value !== 2 && distance >= CENTER_HOLD_THRESHOLD) {
        // After center hold: show fan immediately when user drags out
        if (holdState.value === 1) {
          holdState.value = 2;
          const dir = getSwipeDirection(tx, ty);
          if (dir) {
            runOnJS(handleHoldStart)(dir);
          }
        } else {
          // No center hold — standard directional hold timing
          if (directionalHoldStart.value === 0) {
            directionalHoldStart.value = Date.now();
          } else if (Date.now() - directionalHoldStart.value >= HOLD_DURATION) {
            holdState.value = 2;
            const dir = getSwipeDirection(tx, ty);
            if (dir) {
              runOnJS(handleHoldStart)(dir);
            }
          }
        }
      } else if (distance < CENTER_HOLD_THRESHOLD) {
        // Back to center — reset directional timer
        directionalHoldStart.value = 0;
      }
    })
    .onEnd((event) => {
      runOnJS(clearHoldTimer)();

      const { translationX: tx, translationY: ty } = event;
      const dir = getSwipeDirection(tx, ty);
      const currentHold = holdState.value;

      if (currentHold === 2) {
        // Was in directional hold — check cancel vs select
        const dist = Math.sqrt(tx * tx + ty * ty);
        if (dist < CENTER_HOLD_THRESHOLD) {
          runOnJS(handleHoldCancel)();
        } else if (dir) {
          runOnJS(handleHoldEnd)(tx, ty, dir);
        } else {
          runOnJS(handleHoldCancel)();
        }
      } else if (dir && currentHold === 0) {
        // Quick swipe (no hold)
        runOnJS(handleSwipeComplete)(dir);

        // Brief confirmation flash
        flashOpacity.value = withSequence(
          withTiming(0.6, { duration: 80 }),
          withTiming(0, { duration: 100 })
        );
      }
      // else: center hold only, no swipe — just release

      // Always deactivate note mode on release
      runOnJS(deactivateNoteMode)();

      // Snap back fast
      translateX.value = withSpring(0, FAST_SPRING);
      translateY.value = withSpring(0, FAST_SPRING);
      activeDirection.value = 0;
      holdState.value = 0;
      directionalHoldStart.value = 0;
      dragIntensity.value = withTiming(0, { duration: 100 });
    });

  // ─── Animated Styles ─────────────────────────────────

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const outerRingAnimatedStyle = useAnimatedStyle(() => {
    const borderCol = interpolateColor(
      noteModeActive.value,
      [0, 1],
      [pillar.positiveColor, colors.accent]
    );
    return { borderColor: borderCol };
  });

  const flashAnimatedStyle = useAnimatedStyle(() => {
    const bgColor = interpolateColor(
      directionValence.value,
      [0, 1],
      [pillar.positiveColor, pillar.negativeColor]
    );
    return {
      backgroundColor: bgColor,
      opacity: flashOpacity.value * 0.4,
    };
  });

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.2 + dragIntensity.value * 0.4,
    shadowRadius: 8 + dragIntensity.value * 8,
  }));

  // Direction indicator styles
  const upIndicatorStyle = useAnimatedStyle(() => ({
    opacity: activeDirection.value === 1 ? 1 : 0.25,
    transform: [{ scale: activeDirection.value === 1 ? 1.4 : 1 }],
  }));
  const downIndicatorStyle = useAnimatedStyle(() => ({
    opacity: activeDirection.value === 2 ? 1 : 0.25,
    transform: [{ scale: activeDirection.value === 2 ? 1.4 : 1 }],
  }));
  const leftIndicatorStyle = useAnimatedStyle(() => ({
    opacity: activeDirection.value === 3 ? 1 : 0.25,
    transform: [{ scale: activeDirection.value === 3 ? 1.4 : 1 }],
  }));
  const rightIndicatorStyle = useAnimatedStyle(() => ({
    opacity: activeDirection.value === 4 ? 1 : 0.25,
    transform: [{ scale: activeDirection.value === 4 ? 1.4 : 1 }],
  }));

  // ─── Render ──────────────────────────────────────────

  return (
    <View style={styles.wrapper}>
      <RadialMenu
        visible={radialVisible}
        direction={radialDirection}
        pillarId={pillarId}
        thumbPosition={useDerivedValue(() => ({
          x: translateX.value,
          y: translateY.value,
        }))}
      />
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.outerRing,
            { shadowColor: pillar.positiveColor },
            outerRingAnimatedStyle,
            glowAnimatedStyle,
          ]}
        >
          {/* Direction indicators */}
          <Animated.View style={[styles.indicator, styles.indicatorUp, upIndicatorStyle]}>
            <View style={[styles.indicatorDot, { backgroundColor: pillar.positiveColor }]} />
          </Animated.View>
          <Animated.View style={[styles.indicator, styles.indicatorDown, downIndicatorStyle]}>
            <View style={[styles.indicatorDot, { backgroundColor: pillar.negativeColor }]} />
          </Animated.View>
          <Animated.View style={[styles.indicator, styles.indicatorLeft, leftIndicatorStyle]}>
            <View style={[styles.indicatorDot, { backgroundColor: pillar.negativeColor }]} />
          </Animated.View>
          <Animated.View style={[styles.indicator, styles.indicatorRight, rightIndicatorStyle]}>
            <View style={[styles.indicatorDot, { backgroundColor: pillar.positiveColor }]} />
          </Animated.View>

          {/* Confirmation flash overlay */}
          <Animated.View style={[styles.flashOverlay, flashAnimatedStyle]} />

          {/* Draggable knob */}
          <Animated.View
            style={[
              styles.knob,
              { backgroundColor: colors.surfaceLight },
              knobAnimatedStyle,
            ]}
          >
            <Animated.Text style={styles.emoji}>{pillar.emoji}</Animated.Text>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* Pillar label below joystick */}
      <View style={styles.labelContainer}>
        <Animated.Text style={styles.pillarName}>{pillar.name}</Animated.Text>
        <Animated.Text style={styles.pillarArabic}>{pillar.arabic}</Animated.Text>
      </View>
      <NoteEntryModal logId={pendingLogId} onClose={clearPendingLogId} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 8,
  },
  outerRing: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 10,
  },
  emoji: {
    fontSize: 24,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: JOYSTICK_SIZE / 2,
    zIndex: 5,
  },
  indicator: {
    position: 'absolute',
    width: INDICATOR_SIZE * 2,
    height: INDICATOR_SIZE * 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  indicatorDot: {
    width: INDICATOR_SIZE,
    height: INDICATOR_SIZE,
    borderRadius: INDICATOR_SIZE / 2,
  },
  indicatorUp: {
    top: 4,
    left: (JOYSTICK_SIZE - INDICATOR_SIZE * 2) / 2,
  },
  indicatorDown: {
    bottom: 4,
    left: (JOYSTICK_SIZE - INDICATOR_SIZE * 2) / 2,
  },
  indicatorLeft: {
    left: 4,
    top: (JOYSTICK_SIZE - INDICATOR_SIZE * 2) / 2,
  },
  indicatorRight: {
    right: 4,
    top: (JOYSTICK_SIZE - INDICATOR_SIZE * 2) / 2,
  },
  labelContainer: {
    alignItems: 'center',
    gap: 2,
  },
  pillarName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: colors.textSecondary,
  },
  pillarArabic: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: colors.textMuted,
  },
});
