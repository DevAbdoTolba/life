import React, { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolateColor,
  runOnJS,
  Easing,
  useDerivedValue,
  SharedValue,
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
  SNAP_BACK_CONFIG,
  INDICATOR_SIZE,
  CENTER_HOLD_THRESHOLD,
} from './constants';

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

  // atan2 with inverted Y (screen coordinates have Y going down)
  let angle = Math.atan2(-translationY, translationX) * (180 / Math.PI);
  if (angle < 0) angle += 360;

  // Map angles to directions (45° wedges centered on cardinal directions)
  // Right: 315-45, Up: 45-135, Left: 135-225, Down: 225-315
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

/**
 * Interactive joystick component with pan gesture, spring snap-back,
 * direction detection, and visual feedback.
 *
 * The knob follows the user's thumb, detects 4-directional swipes,
 * and supports a hold gesture for target selection (radial menu).
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

  // Shared values for knob position
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Active direction indicator (0=none, 1=up, 2=down, 3=left, 4=right)
  const activeDirection = useSharedValue(0);

  // Processing state (1 = animating confirmation, 0 = idle)
  const isProcessing = useSharedValue(0);

  // Hold state (1 = holding, 0 = not)
  const isHolding = useSharedValue(0);

  // Confirmation flash opacity
  const flashOpacity = useSharedValue(0);

  // Confirmation scale
  const confirmScale = useSharedValue(1);

  // Direction color intensity (0 = idle, 1 = fully active)
  const dragIntensity = useSharedValue(0);

  // direction color: 0 = positive, 1 = negative (shared value for color interpolation)
  const directionValence = useSharedValue(0);

  // Note mode state (D-05, D-06)
  const noteModeGlow = useSharedValue(0); // drives pulsing ring opacity
  const noteModeRef = useRef(false);       // JS-side truth for gating

  /**
   * JS callback when a quick swipe completes.
   * Called via runOnJS from the gesture handler.
   */
  const handleSwipeComplete = useCallback(
    (direction: SwipeDirection, wasHeld: boolean) => {
      const result: SwipeResult = { pillarId, direction, wasHeld };
      handleSwipe(result, null, noteModeRef.current); // pass noteMode (D-07, UX-01)
      if (onSwipe) onSwipe(result);
    },
    [pillarId, onSwipe, handleSwipe]
  );

  /**
   * JS callback for center hold — toggles note mode on/off (D-02, BUG-03).
   * Heavy haptic fires. No radial menu.
   */
  const handleCenterHold = useCallback(() => {
    noteModeRef.current = !noteModeRef.current;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (noteModeRef.current) {
      // Pulse glow ring: opacity oscillates 0.4 <-> 1.0 forever
      noteModeGlow.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 600 }),
          withTiming(0.4, { duration: 600 })
        ),
        -1,
        true
      );
    } else {
      // Fade out glow ring
      noteModeGlow.value = withTiming(0, { duration: 200 });
    }
  }, [noteModeGlow]);

  /**
   * JS callback when hold starts — notifies parent to show radial menu.
   */
  const handleHoldStart = useCallback(
    (direction: SwipeDirection) => {
      setRadialDirection(direction);
      setRadialVisible(true);
      onHoldStart?.(direction);
    },
    [onHoldStart]
  );

  /**
   * JS callback when hold ends.
   */
  const handleHoldEnd = useCallback((tx: number, ty: number, dir: SwipeDirection) => {
    setRadialVisible(false);

    // Hit detection
    const positions = getTargetPositions(dir);
    const closest = getClosestTarget(tx, ty, positions);

    // Log the targeted entry
    const result: SwipeResult = { pillarId, direction: dir, wasHeld: true };
    handleSwipe(result, closest ? closest.id : null, noteModeRef.current);

    onHoldEnd?.();
  }, [pillarId, getTargetPositions, getClosestTarget, handleSwipe, onHoldEnd]);

  /**
   * JS callback when directional hold is released at center — cancel escape (D-04).
   * Dismisses radial menu, no log, no note.
   */
  const handleHoldCancel = useCallback(() => {
    setRadialVisible(false);
  }, []);

  // ─── Gesture Setup ───────────────────────────────────

  const panGesture = Gesture.Pan()
    .enabled(!disabled)
    .onStart(() => {
      if (isProcessing.value === 1) return;
      dragIntensity.value = 0;
    })
    .onUpdate((event) => {
      if (isProcessing.value === 1) return;

      const { translationX: tx, translationY: ty } = event;

      // Clamp to max drag distance using polar coordinates
      const distance = Math.sqrt(tx ** 2 + ty ** 2);
      const clampedDist = Math.min(distance, MAX_DRAG_DISTANCE);
      const angle = Math.atan2(ty, tx);

      translateX.value = clampedDist * Math.cos(angle);
      translateY.value = clampedDist * Math.sin(angle);

      // Update drag intensity based on distance
      dragIntensity.value = Math.min(distance / SWIPE_THRESHOLD, 1);

      // Detect current direction for indicators
      if (distance >= SWIPE_THRESHOLD * 0.6) {
        // Using inline direction detection for worklet compatibility
        let deg = Math.atan2(-ty, tx) * (180 / Math.PI);
        if (deg < 0) deg += 360;

        let dirIdx = 0;
        if (deg >= 315 || deg < 45) dirIdx = 4; // right
        else if (deg >= 45 && deg < 135) dirIdx = 1; // up
        else if (deg >= 135 && deg < 225) dirIdx = 3; // left
        else dirIdx = 2; // down

        activeDirection.value = dirIdx;

        // Set valence: up(1) and right(4) are positive, down(2) and left(3) are negative
        directionValence.value = (dirIdx === 1 || dirIdx === 4) ? 0 : 1;
      } else {
        activeDirection.value = 0;
      }
    })
    .onEnd((event) => {
      if (isProcessing.value === 1) return;

      const { translationX: tx, translationY: ty } = event;
      const dir = getSwipeDirection(tx, ty);

      if (dir && isHolding.value === 0) {
        // Valid quick swipe (not a hold) — fire callback on JS thread
        isProcessing.value = 1;

        runOnJS(handleSwipeComplete)(dir, false);

        // Confirmation animation: flash + scale pulse
        flashOpacity.value = withSequence(
          withTiming(1, { duration: 150, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
        );
        confirmScale.value = withSequence(
          withSpring(1.08, { damping: 12, stiffness: 200 }),
          withSpring(1, SNAP_BACK_CONFIG, () => {
            isProcessing.value = 0;
          })
        );
      } else if (isHolding.value === 1) {
        // Was holding — check for cancel escape (D-04)
        const dist = Math.sqrt(tx * tx + ty * ty);
        if (dist < CENTER_HOLD_THRESHOLD) {
          // Cancel escape — released at center during directional hold
          runOnJS(handleHoldCancel)();
        } else if (dir) {
          // Normal hold release — hit detection + log
          runOnJS(handleHoldEnd)(tx, ty, dir);
        } else {
          // No valid direction but was holding — cancel
          runOnJS(handleHoldCancel)();
        }
        isHolding.value = 0;
      }

      // Snap knob back to center
      translateX.value = withSpring(0, SNAP_BACK_CONFIG);
      translateY.value = withSpring(0, SNAP_BACK_CONFIG);
      activeDirection.value = 0;
      dragIntensity.value = withTiming(0, { duration: 200 });
    });

  const longPressGesture = Gesture.LongPress()
    .enabled(!disabled)
    .minDuration(HOLD_DURATION)
    .maxDistance(MAX_DRAG_DISTANCE)
    .onStart(() => {
      if (isProcessing.value === 1) return;
      isHolding.value = 1;

      const tx = translateX.value;
      const ty = translateY.value;
      const dist = Math.sqrt(tx * tx + ty * ty);

      if (dist < CENTER_HOLD_THRESHOLD) {
        // CENTER HOLD — toggle note mode, no radial menu (BUG-03, D-01, D-02)
        // Reset isHolding immediately so panGesture.onEnd won't interfere
        isHolding.value = 0;
        runOnJS(handleCenterHold)();
      } else {
        // DIRECTIONAL HOLD — show target fan (BUG-04, D-03)
        let deg = Math.atan2(-ty, tx) * (180 / Math.PI);
        if (deg < 0) deg += 360;

        let dir: SwipeDirection = 'up';
        if (deg >= 315 || deg < 45) dir = 'right';
        else if (deg >= 45 && deg < 135) dir = 'up';
        else if (deg >= 135 && deg < 225) dir = 'left';
        else dir = 'down';

        runOnJS(handleHoldStart)(dir);
      }
    });

  const composedGesture = Gesture.Simultaneous(panGesture, longPressGesture);

  // ─── Animated Styles ─────────────────────────────────

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: confirmScale.value }],
  }));

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

  // Note mode glow ring style (D-05)
  const noteGlowStyle = useAnimatedStyle(() => ({
    opacity: noteModeGlow.value,
  }));

  // Direction indicator animated styles (inlined per D-10/D-11 — no factory wrapper)
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
      <GestureDetector gesture={composedGesture}>
        <Animated.View
          style={[
            styles.outerRing,
            {
              borderColor: pillar.positiveColor,
              shadowColor: pillar.positiveColor,
            },
            containerAnimatedStyle,
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
            {/* Note mode glow ring (D-05) — inside knob view to translate with it */}
            <Animated.View
              style={[styles.noteGlowRing, noteGlowStyle]}
              pointerEvents="none"
            />
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
    // Base glow
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
  noteGlowRing: {
    position: 'absolute',
    width: KNOB_SIZE + 8,    // 64px
    height: KNOB_SIZE + 8,   // 64px
    borderRadius: (KNOB_SIZE + 8) / 2,  // 32px
    borderWidth: 2,
    borderColor: colors.accent,  // #F5A623
    top: -4,    // centers on 56px knob
    left: -4,
    zIndex: 9,
  },
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: JOYSTICK_SIZE / 2,
    zIndex: 5,
  },
  // Direction indicators
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
