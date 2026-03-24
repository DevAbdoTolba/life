import React from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, borderRadius, typography } from '../../constants/theme';
import type { PeriodType } from '../../types/analytics';

interface PeriodSelectorProps {
  selected: PeriodType;
  onSelect: (period: PeriodType) => void;
  customLabel?: string;
  onCustomPress?: () => void;
}

const PERIODS: { key: PeriodType; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'custom', label: 'Custom' },
];

export function PeriodSelector({ selected, onSelect, customLabel, onCustomPress }: PeriodSelectorProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PERIODS.map((period) => {
          const isSelected = selected === period.key;
          return (
            <Pressable
              key={period.key}
              onPress={() => {
                onSelect(period.key);
                if (period.key === 'custom' && selected === 'custom') {
                  onCustomPress?.();
                }
              }}
              style={[styles.pill, isSelected ? styles.pillSelected : styles.pillUnselected]}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextSelected : styles.pillTextUnselected,
                ]}
              >
                {period.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {selected === 'custom' && customLabel ? (
        <Text style={styles.customSubtitle}>{customLabel}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
  },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    marginRight: spacing.sm,
  },
  pillSelected: {
    backgroundColor: colors.accent,
  },
  pillUnselected: {
    backgroundColor: colors.surface,
  },
  pillText: {
    fontSize: typography.sizes.sm,
  },
  pillTextSelected: {
    color: colors.background,
    fontFamily: typography.fontFamily.semibold,
  },
  pillTextUnselected: {
    color: colors.textSecondary,
    fontFamily: typography.fontFamily.regular,
  },
  customSubtitle: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
});
