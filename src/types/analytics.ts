import type { PillarId, SwipeDirection } from '../constants/pillars';

/** Period types for the time period selector (D-09) */
export type PeriodType = 'today' | 'week' | 'month' | 'custom';

/** Date range tuple */
export interface DateRange {
  start: string; // ISO 8601
  end: string;   // ISO 8601
}

/** Daily log count grouped by pillar and direction — used by PillarBarChart */
export interface DailyPillarCount {
  day: string;        // 'YYYY-MM-DD'
  pillarId: PillarId;
  direction: SwipeDirection;
  count: number;
}

/** Summary stats per pillar — used by SummaryStatsRow and PillarDonutChart */
export interface PillarSummary {
  pillarId: PillarId;
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
}

/** Per-target summary — used by TargetAnalyticsList */
export interface TargetSummary {
  targetId: string;
  logCount: number;
}

/** Comparison delta between two periods — used by ComparisonCards */
export interface PeriodComparison {
  pillarId: PillarId;
  currentCount: number;
  previousCount: number;
  absoluteDelta: number;     // currentCount - previousCount
  percentageDelta: number;   // ((current - previous) / previous) * 100, 0 if previous is 0
}
