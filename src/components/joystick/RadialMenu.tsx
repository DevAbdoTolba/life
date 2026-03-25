import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { getPillarById, type PillarId, type SwipeDirection } from '../../constants/pillars';
import { RADIAL_BUBBLE_SIZE, RADIAL_HIT_RADIUS } from './constants';
import { useRadialMenu, type TargetPosition } from './useRadialMenu';
import { colors } from '../../constants/colors';
import { useSettingsStore } from '../../stores/settingsStore';

interface RadialMenuProps {
  visible: boolean;
  direction: SwipeDirection | null;
  pillarId: PillarId;
  thumbPosition: SharedValue<{ x: number; y: number }>;
}

function RadialBubble({
  position,
  index,
  visible,
  thumbPosition,
  pillarColor,
  isPrivacyMode,
}: {
  position: TargetPosition;
  index: number;
  visible: boolean;
  thumbPosition: SharedValue<{ x: number; y: number }>;
  pillarColor: string;
  isPrivacyMode: boolean;
}) {
  const { x, y, target } = position;
  const displayName = target.isMasked && isPrivacyMode ? target.codename : target.realName;

  // Entrance/exit scale — driven only by `visible`, not by thumb movement
  const entryScale = useSharedValue(0);
  React.useEffect(() => {
    if (visible) {
      entryScale.value = withDelay(
        index * 15,
        withSpring(1, { damping: 20, stiffness: 300 })
      );
    } else {
      entryScale.value = withTiming(0, { duration: 60 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    // Hover effect — reacts to thumb position every frame (cheap, no animation)
    const dist = Math.sqrt(
      (thumbPosition.value.x - x) ** 2 + (thumbPosition.value.y - y) ** 2
    );
    const isHovered = dist < RADIAL_HIT_RADIUS;
    const hoverScale = isHovered ? 1.2 : 1;
    const opacity = isHovered ? 1 : 0.8;

    return {
      opacity,
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: entryScale.value * hoverScale },
      ],
    };
  });

  return (
    <Animated.View style={[styles.bubble, { backgroundColor: pillarColor }, animatedStyle]}>
      <Text style={styles.bubbleText} numberOfLines={1}>
        {displayName || 'Target'}
      </Text>
    </Animated.View>
  );
}

export function RadialMenu({
  visible,
  direction,
  pillarId,
  thumbPosition,
}: RadialMenuProps) {
  const { getTargetPositions } = useRadialMenu(pillarId);
  const pillar = getPillarById(pillarId);
  const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);

  // Compute positions ONCE per direction change or targets change
  const positions = React.useMemo(() => {
    if (!direction) return [];
    return getTargetPositions(direction);
  }, [direction, getTargetPositions]);

  if (!direction && !visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.centerContainer}>
        {positions.map((pos, index) => (
          <RadialBubble
            key={pos.target.id}
            position={pos}
            index={index}
            visible={visible}
            thumbPosition={thumbPosition}
            pillarColor={pillar.positiveColor}
            isPrivacyMode={isPrivacyMode}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubble: {
    position: 'absolute',
    width: RADIAL_BUBBLE_SIZE,
    height: RADIAL_BUBBLE_SIZE,
    borderRadius: RADIAL_BUBBLE_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  bubbleText: {
    color: colors.textPrimary,
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
  },
});
