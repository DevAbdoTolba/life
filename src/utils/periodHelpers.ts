import type { PeriodType, DateRange } from '../types/analytics';

/** Get start/end ISO strings for a preset period, computed in local time */
export function getPeriodDates(period: PeriodType): DateRange {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  if (period === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (period === 'week') {
    const dayOfWeek = now.getDay(); // 0 = Sunday
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString(), end: end.toISOString() };
  }
  // 'custom' returns full month as default; caller overrides via CustomDatePicker
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

/** Get the previous period dates for comparison (D-19, D-21) */
export function getPreviousPeriodDates(period: 'week' | 'month'): DateRange {
  const current = getPeriodDates(period);
  const startDate = new Date(current.start);
  const endDate = new Date(current.end);
  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
    endDate.setDate(endDate.getDate() - 7);
  } else {
    startDate.setMonth(startDate.getMonth() - 1);
    endDate.setMonth(endDate.getMonth() - 1);
  }
  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

/** Human-readable label for a period */
export function formatPeriodLabel(period: PeriodType): string {
  switch (period) {
    case 'today': return 'Today';
    case 'week': return 'This Week';
    case 'month': return 'This Month';
    case 'custom': return 'Custom Range';
  }
}

/** Get day labels for bar chart x-axis based on period */
export function getDayLabels(period: PeriodType): string[] {
  if (period === 'today') return ['Today'];
  if (period === 'week') {
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  }
  // For month, return day numbers 1-31 (actual days computed from data)
  return [];
}
