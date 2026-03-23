import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';
import { getLogColor } from '../../constants/pillars';
import type { DailyPillarCount, PeriodType } from '../../types/analytics';

interface PillarBarChartProps {
  dailyCounts: DailyPillarCount[];
  period: PeriodType;
}

function getDayLabel(day: string, period: PeriodType): string {
  if (period === 'today') return 'Today';
  if (period === 'week') {
    const date = new Date(day + 'T00:00:00');
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  }
  // month: show day number
  const date = new Date(day + 'T00:00:00');
  return String(date.getDate());
}

export function PillarBarChart({ dailyCounts, period }: PillarBarChartProps) {
  const { width } = useWindowDimensions();

  // Screen padding (xl * 2) + card padding (lg * 2)
  const chartWidth = width - spacing.xl * 2 - spacing.lg * 2;

  const { barData, maxValue } = useMemo(() => {
    if (dailyCounts.length === 0) {
      return { barData: [], maxValue: 5 };
    }

    // Group by day, preserving order
    const dayOrder: string[] = [];
    const byDay: Record<string, DailyPillarCount[]> = {};
    for (const item of dailyCounts) {
      if (!byDay[item.day]) {
        byDay[item.day] = [];
        dayOrder.push(item.day);
      }
      byDay[item.day].push(item);
    }

    const bars: { value: number; frontColor: string; label?: string }[] = [];
    let maxCount = 0;

    for (const day of dayOrder) {
      const dayItems = byDay[day];
      let isFirst = true;
      for (const item of dayItems) {
        if (item.count > maxCount) maxCount = item.count;
        bars.push({
          value: item.count,
          frontColor: getLogColor(item.pillarId, item.direction),
          label: isFirst ? getDayLabel(day, period) : undefined,
        });
        isFirst = false;
      }
    }

    return {
      barData: bars,
      maxValue: Math.max(maxCount, 5),
    };
  }, [dailyCounts, period]);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Daily Activity</Text>
      {barData.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No activity for this period</Text>
        </View>
      ) : (
        <BarChart
          data={barData}
          width={chartWidth}
          height={180}
          maxValue={maxValue}
          noOfSections={4}
          isAnimated
          barBorderRadius={4}
          spacing={12}
          initialSpacing={8}
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
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.sm,
  },
});
