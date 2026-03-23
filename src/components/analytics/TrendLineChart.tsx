import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';
import type { DailyPillarCount, PeriodType } from '../../types/analytics';

interface TrendLineChartProps {
  dailyCounts: DailyPillarCount[];
  period: PeriodType;
}

function getDayLabel(day: string, period: PeriodType): string {
  if (period === 'today') return 'Today';
  if (period === 'week') {
    const date = new Date(day + 'T00:00:00');
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  }
  const date = new Date(day + 'T00:00:00');
  return String(date.getDate());
}

export function TrendLineChart({ dailyCounts, period }: TrendLineChartProps) {
  const { width } = useWindowDimensions();
  const chartWidth = width - spacing.xl * 2 - spacing.lg * 2;

  const lineDataSets = useMemo(() => {
    if (dailyCounts.length === 0) {
      return null;
    }

    // Collect all unique days in order
    const daySet = new Set<string>();
    for (const item of dailyCounts) {
      daySet.add(item.day);
    }
    const days = Array.from(daySet).sort();

    // Build per-pillar daily totals (sum across all directions)
    const pillarTotals: Record<1 | 2 | 3, number[]> = {
      1: days.map(() => 0),
      2: days.map(() => 0),
      3: days.map(() => 0),
    };

    for (const item of dailyCounts) {
      const dayIndex = days.indexOf(item.day);
      if (dayIndex >= 0 && (item.pillarId === 1 || item.pillarId === 2 || item.pillarId === 3)) {
        pillarTotals[item.pillarId][dayIndex] += item.count;
      }
    }

    // Build x-axis labels
    const xLabels = days.map((day) => getDayLabel(day, period));

    return [
      {
        data: pillarTotals[1].map((value, i) => ({ value, label: xLabels[i] })),
        color: colors.afterlifePositive,
        thickness: 2,
        curved: true,
        areaChart: true,
        startFillColor: colors.afterlifePositive,
        endFillColor: colors.afterlifePositive,
        startOpacity: 0.15,
        endOpacity: 0,
      },
      {
        data: pillarTotals[2].map((value, i) => ({ value, label: xLabels[i] })),
        color: colors.selfPositive,
        thickness: 2,
        curved: true,
        areaChart: true,
        startFillColor: colors.selfPositive,
        endFillColor: colors.selfPositive,
        startOpacity: 0.15,
        endOpacity: 0,
      },
      {
        data: pillarTotals[3].map((value, i) => ({ value, label: xLabels[i] })),
        color: colors.othersPositive,
        thickness: 2,
        curved: true,
        areaChart: true,
        startFillColor: colors.othersPositive,
        endFillColor: colors.othersPositive,
        startOpacity: 0.15,
        endOpacity: 0,
      },
    ];
  }, [dailyCounts, period]);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Activity Trends</Text>
      {!lineDataSets ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data</Text>
        </View>
      ) : (
        <LineChart
          dataSet={lineDataSets}
          areaChart
          startFillColor={colors.afterlifePositive}
          startOpacity={0.15}
          endOpacity={0}
          height={140}
          width={chartWidth}
          backgroundColor={colors.surface}
          xAxisColor={colors.border}
          yAxisTextStyle={{
            color: colors.textSecondary,
            fontFamily: 'Inter_400Regular',
          }}
          xAxisLabelTextStyle={{
            color: colors.textSecondary,
            fontFamily: 'Inter_400Regular',
            fontSize: 10,
          }}
          rulesColor={colors.border}
          rulesType="dashed"
          isAnimated
          noOfSections={4}
        />
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  emptyState: {
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
  },
});
