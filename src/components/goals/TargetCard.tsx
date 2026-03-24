import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { Target } from '../../database/types';
import { useSettingsStore } from '../../stores/settingsStore';
import { getPillarById } from '../../constants/pillars';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';

export interface TargetCardProps {
  target: Target;
  onPress?: (target: Target) => void;
}

export function TargetCard({ target, onPress }: TargetCardProps) {
  const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);
  const pillar = getPillarById(target.pillarId as ReturnType<typeof getPillarById>['id']);

  const shouldMask = target.isMasked && isPrivacyMode;
  const displayName = shouldMask ? target.codename : target.realName;

  const isActive = target.status === 'active';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: isActive ? pillar.positiveColor : colors.border },
        !isActive && styles.cardInactive
      ]}
      onPress={() => onPress?.(target)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text style={[styles.name, shouldMask && styles.maskedName]}>
          {shouldMask ? `🔒 ${displayName}` : displayName}
        </Text>
        <Text style={styles.statusBadge}>
          {target.status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardInactive: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  maskedName: {
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  statusBadge: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
