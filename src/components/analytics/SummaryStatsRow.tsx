import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';
import { pillars, getPillarById } from '../../constants/pillars';
import type { PillarId } from '../../constants/pillars';
import type { Log } from '../../database/types';

interface SummaryStatsRowProps {
  logs: Log[];
}

export function SummaryStatsRow({ logs }: SummaryStatsRowProps) {
  const stats = useMemo(() => {
    if (logs.length === 0) {
      return null;
    }

    const totalLogs = logs.length;

    // Count per pillar
    const pillarCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    for (const log of logs) {
      if (log.pillarId in pillarCounts) {
        pillarCounts[log.pillarId]++;
      }
    }

    // Count positive logs (up = direct positive, right = indirect positive)
    const positiveCount = logs.filter(
      (l) => l.direction === 'up' || l.direction === 'right'
    ).length;
    const negativeCount = totalLogs - positiveCount;
    const positiveRatio = Math.round((positiveCount / totalLogs) * 100);

    // Find top pillar
    let topPillarId: PillarId = 1;
    let topCount = 0;
    for (const [idStr, count] of Object.entries(pillarCounts)) {
      if (count > topCount) {
        topCount = count;
        topPillarId = Number(idStr) as PillarId;
      }
    }
    const topPillar = getPillarById(topPillarId);

    return {
      totalLogs,
      positiveRatio,
      topPillar,
    };
  }, [logs]);

  return (
    <View style={styles.row}>
      {/* Cell 1: Total Logs */}
      <Card style={styles.cell}>
        <Text style={styles.value}>{stats ? stats.totalLogs : '--'}</Text>
        <Text style={styles.label}>Total Logs</Text>
      </Card>

      {/* Cell 2: Positive/Negative Ratio */}
      <Card style={styles.cell}>
        <Text style={styles.value}>
          {stats ? `${stats.positiveRatio}%` : '--'}
        </Text>
        <Text style={styles.label}>+/- Ratio</Text>
      </Card>

      {/* Cell 3: Top Pillar */}
      <Card style={styles.cell}>
        <Text style={styles.value}>
          {stats ? stats.topPillar.emoji : '--'}
        </Text>
        <Text style={styles.label}>Most Active</Text>
        {stats && (
          <Text style={styles.pillarName}>{stats.topPillar.name}</Text>
        )}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  value: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
  },
  label: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  pillarName: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
