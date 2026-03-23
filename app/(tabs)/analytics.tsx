import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../src/components/ui/Text';
import { PeriodSelector } from '../../src/components/analytics/PeriodSelector';
import { useLogStore } from '../../src/stores/logStore';
import { getPeriodDates, formatPeriodLabel } from '../../src/utils/periodHelpers';
import type { PeriodType, DateRange } from '../../src/types/analytics';
import type { Log } from '../../src/database/types';
import { colors } from '../../src/constants/colors';
import { spacing, typography } from '../../src/constants/theme';

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  const [dateRange, setDateRange] = useState<DateRange>(getPeriodDates('week'));
  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getLogsByPeriod = useLogStore((s) => s.getLogsByPeriod);

  useEffect(() => {
    const range = getPeriodDates(selectedPeriod);
    setDateRange(range);
    setIsLoading(true);
    getLogsByPeriod(range.start, range.end)
      .then((fetchedLogs) => {
        setLogs(fetchedLogs);
      })
      .catch((error) => {
        console.error('[Analytics] Failed to fetch logs:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [selectedPeriod]);

  return (
    <SafeAreaView style={styles.container}>
      <PeriodSelector selected={selectedPeriod} onSelect={setSelectedPeriod} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Analytics</Text>

        {/* SummaryStatsRow */}

        {/* PillarBarChart, PillarDonutChart, TrendLineChart */}

        {/* BodyFillPreviewCard */}

        {/* ComparisonCards */}

        {/* TargetAnalyticsList */}

        {!isLoading && logs.length === 0 && (
          <Text style={styles.emptyState}>
            No logs yet for {formatPeriodLabel(selectedPeriod)}. Start swiping to see your analytics!
          </Text>
        )}

        {!isLoading && logs.length > 0 && (
          <Text style={styles.logCount}>
            {logs.length} logs found for {formatPeriodLabel(selectedPeriod)}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  screenTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  emptyState: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  logCount: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
});
