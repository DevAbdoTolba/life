import React, { useState } from 'react';
import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { colors } from '../../constants/colors';
import { typography, spacing } from '../../constants/theme';
import {
  JOYSTICK_SIZE,
  KNOB_SIZE,
  SWIPE_THRESHOLD,
  MAX_DRAG_DISTANCE,
  SNAP_BACK_CONFIG,
  INDICATOR_SIZE,
} from '../joystick/constants';

type SwipeDirection = 'up' | 'down' | 'left' | 'right';

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

const DIRECTION_LABELS: Record<SwipeDirection, string> = {
  up: 'up',
  down: 'down',
  left: 'left',
  right: 'right',
};

export function GestureSlide() {
  const [swipeCount, setSwipeCount] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const activeDirection = useSharedValue(0); // 0=none, 1=up, 2=down, 3=left, 4=right
  const feedbackOpacity = useSharedValue(0);

  const handleSwipeDetected = (direction: SwipeDirection) => {
    const label = DIRECTION_LABELS[direction];
    setFeedbackText(`Nice! You swiped ${label}`);
    setSwipeCount((prev) => prev + 1);
  };

  const showFeedback = () => {
    feedbackOpacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 600 }),
      withTiming(0, { duration: 300 })
    );
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      // reset direction
      activeDirection.value = 0;
    })
    .onUpdate((event) => {
      const { translationX: tx, translationY: ty } = event;

      const distance = Math.sqrt(tx ** 2 + ty ** 2);
      const clampedDist = Math.min(distance, MAX_DRAG_DISTANCE);
      const angle = Math.atan2(ty, tx);

      translateX.value = clampedDist * Math.cos(angle);
      translateY.value = clampedDist * Math.sin(angle);

      if (distance >= SWIPE_THRESHOLD * 0.6) {
        let deg = Math.atan2(-ty, tx) * (180 / Math.PI);
        if (deg < 0) deg += 360;

        let dirIdx = 0;
        if (deg >= 315 || deg < 45) dirIdx = 4; // right
        else if (deg >= 45 && deg < 135) dirIdx = 1; // up
        else if (deg >= 135 && deg < 225) dirIdx = 3; // left
        else dirIdx = 2; // down

        activeDirection.value = dirIdx;
      } else {
        activeDirection.value = 0;
      }
    })
    .onEnd((event) => {
      const { translationX: tx, translationY: ty } = event;
      const dir = getSwipeDirection(tx, ty);

      if (dir) {
        runOnJS(handleSwipeDetected)(dir);
        runOnJS(showFeedback)();
      }

      // Snap back
      translateX.value = withSpring(0, SNAP_BACK_CONFIG);
      translateY.value = withSpring(0, SNAP_BACK_CONFIG);
      activeDirection.value = 0;
    });

  const knobAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const feedbackAnimatedStyle = useAnimatedStyle(() => ({
    opacity: feedbackOpacity.value,
  }));

  const createIndicatorStyle = (direction: number) =>
    useAnimatedStyle(() => ({
      opacity: activeDirection.value === direction ? 1 : 0.25,
      transform: [{ scale: activeDirection.value === direction ? 1.4 : 1 }],
    }));

  const upIndicatorStyle = createIndicatorStyle(1);
  const downIndicatorStyle = createIndicatorStyle(2);
  const leftIndicatorStyle = createIndicatorStyle(3);
  const rightIndicatorStyle = createIndicatorStyle(4);

  const hasSwipedSuccessfully = swipeCount > 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Swipe to Log</Text>
        <Text style={styles.subtitle}>Try swiping in any direction</Text>

        <View style={styles.joystickWrapper}>
          <GestureDetector gesture={panGesture}>
            <View style={styles.outerRing}>
              {/* Direction indicators */}
              <Animated.View style={[styles.indicator, styles.indicatorUp, upIndicatorStyle]}>
                <View style={[styles.indicatorDot, { backgroundColor: colors.accent }]} />
              </Animated.View>
              <Animated.View style={[styles.indicator, styles.indicatorDown, downIndicatorStyle]}>
                <View style={[styles.indicatorDot, { backgroundColor: colors.error }]} />
              </Animated.View>
              <Animated.View style={[styles.indicator, styles.indicatorLeft, leftIndicatorStyle]}>
                <View style={[styles.indicatorDot, { backgroundColor: colors.error }]} />
              </Animated.View>
              <Animated.View style={[styles.indicator, styles.indicatorRight, rightIndicatorStyle]}>
                <View style={[styles.indicatorDot, { backgroundColor: colors.accent }]} />
              </Animated.View>

              {/* Draggable knob */}
              <Animated.View style={[styles.knob, knobAnimatedStyle]} />
            </View>
          </GestureDetector>
        </View>

        {/* Feedback text */}
        <Animated.Text style={[styles.feedbackText, feedbackAnimatedStyle]}>
          {feedbackText}
        </Animated.Text>

        {/* Swipe counter */}
        <Text
          style={[
            styles.swipeCounter,
            hasSwipedSuccessfully && { color: colors.success },
          ]}
        >
          Swipes: {swipeCount}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  joystickWrapper: {
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  outerRing: {
    width: JOYSTICK_SIZE,
    height: JOYSTICK_SIZE,
    borderRadius: JOYSTICK_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: colors.surfaceLight,
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
  feedbackText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.lg,
    color: colors.accent,
    textAlign: 'center',
    height: 28,
    marginBottom: spacing.md,
  },
  swipeCounter: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
