import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography } from '../../constants/theme';
import { getPillarById } from '../../constants/pillars';
import type { PillarId } from '../../constants/pillars';
import { useTargetStore } from '../../stores/targetStore';
import type { PeriodType, DateRange } from '../../types/analytics';
import type { Log } from '../../database/types';

interface TargetAnalyticsListProps {
  logs: Log[];
  period: PeriodType;
  dateRange: DateRange;
  onTargetPress: (targetId: string) => void;
}

export function TargetAnalyticsList({
  logs,
  period,
  dateRange,
  onTargetPress,
}: TargetAnalyticsListProps) {
  const targets = useTargetStore((s) => s.targets);

  const activeTargets = useMemo(
    () => targets.filter((t) => t.status === 'active'),
    [targets]
  );

  const targetsWithCounts = useMemo(() => {
    return activeTargets
      .map((target) => ({
        ...target,
        logCount: logs.filter((l) => l.targetId === target.id).length,
      }))
      .sort((a, b) => b.logCount - a.logCount);
  }, [activeTargets, logs]);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Target Activity</Text>

      {targetsWithCounts.length === 0 ? (
        <Text style={styles.emptyState}>
          No targets yet. Create goals in the Goals tab.
        </Text>
      ) : (
        targetsWithCounts.map((target) => {
          const pillar = getPillarById(target.pillarId as PillarId);
          // D-24: show codename if masked, otherwise real name
          const displayName = target.isMasked && target.codename
            ? target.codename
            : target.realName;

          return (
            <Card
              key={target.id}
              onPress={() => onTargetPress(target.id)}
              style={styles.targetCard}
            >
              <View style={styles.row}>
                <View
                  style={[
                    styles.pillarDot,
                    { backgroundColor: pillar.positiveColor },
                  ]}
                />
                <Text style={styles.targetName}>{displayName}</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{target.logCount}</Text>
                </View>
              </View>
            </Card>
          );
        })
      )}
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
  emptyState: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  targetCard: {
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillarDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.md,
  },
  targetName: {
    flex: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  countBadge: {
    marginLeft: spacing.sm,
  },
  countText: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
});
