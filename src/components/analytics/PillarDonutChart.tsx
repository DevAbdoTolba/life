import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';
import type { Log } from '../../database/types';

interface PillarDonutChartProps {
  logs: Log[];
}

const PILLAR_CONFIG = [
  { id: 1, color: colors.afterlifePositive, name: 'Afterlife' },
  { id: 2, color: colors.selfPositive, name: 'Self' },
  { id: 3, color: colors.othersPositive, name: 'Others' },
] as const;

export function PillarDonutChart({ logs }: PillarDonutChartProps) {
  const { pieData, pillarCounts } = useMemo(() => {
    const counts = { 1: 0, 2: 0, 3: 0 };
    for (const log of logs) {
      if (log.pillarId === 1 || log.pillarId === 2 || log.pillarId === 3) {
        counts[log.pillarId]++;
      }
    }

    const data = PILLAR_CONFIG
      .filter((p) => counts[p.id] > 0)
      .map((p) => ({
        value: counts[p.id],
        color: p.color,
        text: p.name,
      }));

    return { pieData: data, pillarCounts: counts };
  }, [logs]);

  return (
    <Card style={styles.card}>
      <Text style={styles.title}>Pillar Distribution</Text>
      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data</Text>
        </View>
      ) : (
        <>
          <View style={styles.chartContainer}>
            <PieChart
              data={pieData}
              donut
              innerRadius={50}
              radius={80}
              textColor={colors.textPrimary}
              textSize={10}
              showValuesAsLabels
              valuesTextColor={colors.textSecondary}
            />
          </View>

          {/* Legend */}
          <View style={styles.legend}>
            {PILLAR_CONFIG.map((pillar) => (
              <View key={pillar.id} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: pillar.color }]}
                />
                <Text style={styles.legendText}>
                  {pillar.name} ({pillarCounts[pillar.id]})
                </Text>
              </View>
            ))}
          </View>
        </>
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
