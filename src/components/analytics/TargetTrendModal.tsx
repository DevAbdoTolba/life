import React, { useState, useEffect, useMemo } from 'react';
import { View, Modal, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { Text } from '../ui/Text';
import { colors } from '../../constants/colors';
import { spacing, typography, borderRadius } from '../../constants/theme';
import { getPillarById } from '../../constants/pillars';
import type { PillarId } from '../../constants/pillars';
import { useLogStore } from '../../stores/logStore';
import { useTargetStore } from '../../stores/targetStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { DateRange } from '../../types/analytics';
import type { Log } from '../../database/types';

interface TargetTrendModalProps {
  visible: boolean;
  targetId: string | null;
  dateRange: DateRange;
  onClose: () => void;
}

interface DailyCount {
  dayLabel: string;
  count: number;
}

export function TargetTrendModal({
  visible,
  targetId,
  dateRange,
  onClose,
}: TargetTrendModalProps) {
  const { width } = useWindowDimensions();
  const [targetLogs, setTargetLogs] = useState<Log[]>([]);
  const getLogsByTarget = useLogStore((s) => s.getLogsByTarget);
  const target = useTargetStore((s) =>
    s.targets.find((t) => t.id === targetId)
  );
  const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);

  useEffect(() => {
    if (!visible || !targetId) {
      setTargetLogs([]);
      return;
    }
    getLogsByTarget(targetId, dateRange.start, dateRange.end).then(setTargetLogs);
  }, [visible, targetId, dateRange.start, dateRange.end]);

  const dailyCounts = useMemo<DailyCount[]>(() => {
    if (!targetLogs.length) return [];
    const countsByDay: Record<string, number> = {};
    for (const log of targetLogs) {
      // date(createdAt) — extract YYYY-MM-DD
      const day = log.createdAt.slice(0, 10);
      countsByDay[day] = (countsByDay[day] || 0) + 1;
    }
    return Object.entries(countsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, count]) => ({
        dayLabel: day.slice(5), // MM-DD
        count,
      }));
  }, [targetLogs]);

  const chartWidth = width - spacing.xl * 4;

  const displayName =
    target
      ? target.isMasked && isPrivacyMode && target.codename
        ? target.codename
        : target.realName
      : '';

  const pillarColor =
    target ? getPillarById(target.pillarId as PillarId).positiveColor : colors.accent;

  const chartData = dailyCounts.map((d) => ({
    value: d.count,
    label: d.dayLabel,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.targetTitle}>{displayName}</Text>
            <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Total count */}
          <Text style={styles.totalCount}>{targetLogs.length} total logs</Text>

          {/* Chart or empty state */}
          {dailyCounts.length === 0 ? (
            <Text style={styles.emptyState}>No activity in this period</Text>
          ) : (
            <View style={styles.chartContainer}>
              <LineChart
                data={chartData}
                color={pillarColor}
                thickness={2}
                curved
                height={160}
                width={chartWidth}
                isAnimated
                backgroundColor={colors.surface}
                xAxisColor={colors.border}
                yAxisTextStyle={{ color: colors.textSecondary }}
                rulesColor={colors.border}
                rulesType="dashed"
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  targetTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  totalCount: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  chartContainer: {
    marginTop: spacing.sm,
  },
  emptyState: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
