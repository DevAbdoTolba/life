import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Log } from '../../database/types';
import type { PillarId, SwipeDirection } from '../../constants/pillars';
import { getLogColor, swipeDirections } from '../../constants/pillars';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';
import { useTargetStore } from '../../stores/targetStore';

interface LogHistoryItemProps {
  log: Log;
}

export function LogHistoryItem({ log }: LogHistoryItemProps) {
  const dotColor = getLogColor(log.pillarId as PillarId, log.direction as SwipeDirection);
  const directionLabel = swipeDirections[log.direction as SwipeDirection]?.label ?? log.direction;
  const target = useTargetStore((s) => log.targetId ? s.targets.find((t) => t.id === log.targetId) : undefined);
  const time = new Date(log.createdAt).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={styles.direction} numberOfLines={1}>
          {directionLabel}{target ? ` · ${target.realName}` : ''}
        </Text>
        <Text style={styles.time}>{time}</Text>
      </View>
      {log.note ? (
        <Text style={styles.note} numberOfLines={2}>{log.note}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  direction: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  time: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  note: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: 16, // 8px dot + 8px gap = aligned under direction text
  },
});
