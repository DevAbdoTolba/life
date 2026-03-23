import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Text } from './Text';
import { spacing, borderRadius } from '../../constants';

type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  text: string;
  color: string;
  size?: BadgeSize;
  style?: ViewStyle;
}

export function Badge({ text, color, size = 'sm', style }: BadgeProps) {
  return (
    <View
      style={[
        styles.badge,
        size === 'md' && styles.badgeMd,
        { backgroundColor: `${color}20` },
        style,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text
        variant="caption"
        color={color}
        style={size === 'md' ? styles.textMd : undefined}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  badgeMd: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  textMd: {
    fontSize: 14,
  },
});
