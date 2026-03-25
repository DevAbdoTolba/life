import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '../../src/components/ui/Text';
import { PeriodSelector } from '../../src/components/analytics/PeriodSelector';
import { SummaryStatsRow } from '../../src/components/analytics/SummaryStatsRow';
import { PillarActivityLineChart } from '../../src/components/analytics/PillarActivityLineChart';
import { PillarDonutChart } from '../../src/components/analytics/PillarDonutChart';
import { TrendLineChart } from '../../src/components/analytics/TrendLineChart';
import { BodyFillPreviewCard } from '../../src/components/analytics/BodyFillPreviewCard';
import { ComparisonCards } from '../../src/components/analytics/ComparisonCards';
import { TargetAnalyticsList } from '../../src/components/analytics/TargetAnalyticsList';
import { TargetTrendModal } from '../../src/components/analytics/TargetTrendModal';
import { CustomDateRangeModal } from '../../src/components/analytics/CustomDateRangeModal';
import { useLogStore } from '../../src/stores/logStore';
import { getPeriodDates, formatPeriodLabel, formatDateRangeLabel } from '../../src/utils/periodHelpers';
import type { PeriodType, DateRange, DailyPillarCount } from '../../src/types/analytics';
import type { Log } from '../../src/database/types';
import { colors } from '../../src/constants/colors';
import { spacing, typography } from '../../src/constants/theme';

export default function AnalyticsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('week');
  const [dateRange, setDateRange] = useState<DateRange>(getPeriodDates('week'));
  const [logs, setLogs] = useState<Log[]>([]);
  const [dailyCounts, setDailyCounts] = useState<DailyPillarCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [showTargetTrend, setShowTargetTrend] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange>(getPeriodDates('custom'));
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getLogsByPeriod = useLogStore((s) => s.getLogsByPeriod);
  const getDailyLogsByPillar = useLogStore((s) => s.getDailyLogsByPillar);

  const handleTargetPress = (targetId: string) => {
    setSelectedTargetId(targetId);
    setShowTargetTrend(true);
  };

  const handlePeriodSelect = (period: PeriodType) => {
    setSelectedPeriod(period);
    if (period === 'custom') {
      setShowDatePicker(true);
    }
  };

  const handleCustomPress = () => {
    setShowDatePicker(true);
  };

  const handleDateRangeConfirm = (range: DateRange) => {
    setCustomRange(range);
    setShowDatePicker(false);
  };

  useEffect(() => {
    const range = selectedPeriod === 'custom' ? customRange : getPeriodDates(selectedPeriod);
    setDateRange(range);
    setIsLoading(true);
    Promise.all([
      getLogsByPeriod(range.start, range.end),
      getDailyLogsByPillar(range.start, range.end),
    ])
      .then(([periodLogs, dailyData]) => {
        setLogs(periodLogs);
        setDailyCounts(dailyData);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [selectedPeriod, customRange]);

  return (
    <SafeAreaView style={styles.container}>
      <PeriodSelector
        selected={selectedPeriod}
        onSelect={handlePeriodSelect}
        customLabel={selectedPeriod === 'custom' ? formatDateRangeLabel(customRange) : undefined}
        onCustomPress={handleCustomPress}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenTitle}>Analytics</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : (
          <>
            {logs.length === 0 ? (
              <Text style={styles.emptyState}>
                No logs yet for {formatPeriodLabel(selectedPeriod)}. Start swiping to see your analytics!
              </Text>
            ) : (
              <>
                <SummaryStatsRow logs={logs} />
                <View style={styles.chartSpacer} />

                <PillarActivityLineChart dailyCounts={dailyCounts} period={selectedPeriod} />
                <View style={styles.chartSpacer} />

                <PillarDonutChart logs={logs} />
                <View style={styles.chartSpacer} />

                <TrendLineChart dailyCounts={dailyCounts} period={selectedPeriod} />
                <View style={styles.chartSpacer} />

                <BodyFillPreviewCard logCount={logs.length} dateRange={dateRange} />

                <ComparisonCards
                  period={selectedPeriod}
                  currentLogs={logs}
                  dateRange={dateRange}
                />

                <TargetAnalyticsList
                  logs={logs}
                  period={selectedPeriod}
                  dateRange={dateRange}
                  onTargetPress={handleTargetPress}
                />
              </>
            )}
          </>
        )}
      </ScrollView>

      <TargetTrendModal
        visible={showTargetTrend}
        targetId={selectedTargetId}
        dateRange={dateRange}
        onClose={() => {
          setShowTargetTrend(false);
          setSelectedTargetId(null);
        }}
      />

      <CustomDateRangeModal
        visible={showDatePicker}
        defaultStart={new Date(customRange.start)}
        defaultEnd={new Date(customRange.end)}
        onConfirm={handleDateRangeConfirm}
        onClose={() => setShowDatePicker(false)}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xxxl,
  },
  emptyState: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xxxl,
  },
  chartSpacer: {
    height: spacing.lg,
  },
});
