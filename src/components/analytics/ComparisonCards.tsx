import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { pillars, getPillarById } from '../../constants/pillars';
import type { PillarId } from '../../constants/pillars';
import { useLogStore } from '../../stores/logStore';
import { getPreviousPeriodDates } from '../../utils/periodHelpers';
import type { PeriodType, DateRange, PeriodComparison } from '../../types/analytics';
import type { Log } from '../../database/types';

interface ComparisonCardsProps {
  period: PeriodType;
  currentLogs: Log[];
  dateRange: DateRange;
}

export function ComparisonCards({ period, currentLogs, dateRange }: ComparisonCardsProps) {
  const [previousLogs, setPreviousLogs] = useState<Log[]>([]);
  const getLogsByPeriod = useLogStore((s) => s.getLogsByPeriod);

  useEffect(() => {
    if (period !== 'week' && period !== 'month') return;
    const prevRange = getPreviousPeriodDates(period);
    getLogsByPeriod(prevRange.start, prevRange.end).then(setPreviousLogs);
  }, [period]);

  const comparisons = useMemo<PeriodComparison[]>(() => {
    return [1, 2, 3].map((pid) => {
      const currentCount = currentLogs.filter((l) => l.pillarId === pid).length;
      const previousCount = previousLogs.filter((l) => l.pillarId === pid).length;
      const absoluteDelta = currentCount - previousCount;
      const percentageDelta =
        previousCount > 0
          ? Math.round(((currentCount - previousCount) / previousCount) * 100)
          : currentCount > 0
          ? 100
          : 0;
      return {
        pillarId: pid as PillarId,
        currentCount,
        previousCount,
        absoluteDelta,
        percentageDelta,
      };
    });
  }, [currentLogs, previousLogs]);

  // D-21: Only render for week and month periods
  if (period !== 'week' && period !== 'month') {
    return null;
  }

  const currentLabel = period === 'week' ? 'This Week' : 'This Month';
  const previousLabel = period === 'week' ? 'Last Week' : 'Last Month';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Period Comparison</Text>

      {/* Current period card */}
      <Card style={styles.periodCard}>
        <Text style={styles.periodCardLabel}>{currentLabel}</Text>
        <View style={styles.pillarsRow}>
          {comparisons.map((comp) => {
            const pillar = getPillarById(comp.pillarId);
            return (
              <View key={comp.pillarId} style={styles.pillarItem}>
                <View
                  style={[styles.pillarDot, { backgroundColor: pillar.positiveColor }]}
                />
                <Text style={styles.pillarName}>{pillar.name}</Text>
                <Text style={styles.pillarCount}>{comp.currentCount}</Text>
              </View>
            );
          })}
        </View>
      </Card>

      {/* Delta indicators */}
      <View style={styles.deltaRow}>
        {comparisons.map((comp) => {
          const isPositive = comp.absoluteDelta > 0;
          const isNegative = comp.absoluteDelta < 0;
          const isZero = comp.absoluteDelta === 0;
          const deltaColor = isPositive
            ? colors.success
            : isNegative
            ? colors.error
            : colors.textMuted;
          const arrowIcon = isPositive ? '↑' : isNegative ? '↓' : '—';
          const percentText = isPositive
            ? `+${comp.percentageDelta}%`
            : isNegative
            ? `${comp.percentageDelta}%`
            : '0%';
          const absText = isPositive
            ? `(+${comp.absoluteDelta})`
            : isNegative
            ? `(${comp.absoluteDelta})`
            : '(0)';
          const pillar = getPillarById(comp.pillarId);

          return (
            <View key={comp.pillarId} style={styles.deltaItem}>
              <Text style={styles.deltaArrow}>
                <Text style={[styles.deltaArrow, { color: deltaColor }]}>{arrowIcon}</Text>
              </Text>
              <Text style={[styles.deltaPercent, { color: deltaColor }]}>{percentText}</Text>
              <Text style={[styles.deltaAbs, { color: deltaColor }]}>{absText}</Text>
            </View>
          );
        })}
      </View>

      {/* Previous period card */}
      <Card style={styles.periodCard}>
        <Text style={styles.periodCardLabel}>{previousLabel}</Text>
        <View style={styles.pillarsRow}>
          {comparisons.map((comp) => {
            const pillar = getPillarById(comp.pillarId);
            return (
              <View key={comp.pillarId} style={styles.pillarItem}>
                <View
                  style={[styles.pillarDot, { backgroundColor: pillar.positiveColor }]}
                />
                <Text style={styles.pillarName}>{pillar.name}</Text>
                <Text style={styles.pillarCount}>{comp.previousCount}</Text>
              </View>
            );
          })}
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  periodCard: {
    marginBottom: spacing.xs,
  },
  periodCardLabel: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  pillarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pillarItem: {
    alignItems: 'center',
    flex: 1,
  },
  pillarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  pillarName: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  pillarCount: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  deltaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  deltaItem: {
    flex: 1,
    alignItems: 'center',
  },
  deltaArrow: {
    fontSize: typography.sizes.lg,
    fontFamily: typography.fontFamily.bold,
  },
  deltaPercent: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.sm,
  },
  deltaAbs: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
