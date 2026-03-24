import { formatDateShort, formatDateRangeLabel, getPeriodDates } from './periodHelpers';

describe('formatDateShort', () => {
  it('formats a Date object as "MMM DD, YYYY"', () => {
    // Use a fixed date to avoid timezone flakiness
    const d = new Date(2026, 2, 24); // March 24, 2026 (month is 0-indexed)
    expect(formatDateShort(d)).toBe('Mar 24, 2026');
  });

  it('formats an ISO string to human-readable date', () => {
    // Use a local-midnight ISO string to avoid timezone shifting
    const d = new Date(2026, 2, 1); // March 1, 2026
    const iso = d.toISOString();
    const result = formatDateShort(iso);
    // Should contain "Mar" and "2026"
    expect(result).toContain('Mar');
    expect(result).toContain('2026');
    expect(result).toContain('1');
  });

  it('formats first of a month correctly', () => {
    const d = new Date(2026, 0, 1); // January 1, 2026
    expect(formatDateShort(d)).toBe('Jan 1, 2026');
  });
});

describe('formatDateRangeLabel', () => {
  it('formats a same-month range with en-dash separator', () => {
    const start = new Date(2026, 2, 1); // March 1, 2026
    const end = new Date(2026, 2, 24); // March 24, 2026
    const result = formatDateRangeLabel({ start: start.toISOString(), end: end.toISOString() });
    // Should contain "Mar 1" and "Mar 24" separated by en-dash
    expect(result).toContain('Mar 1');
    expect(result).toContain('Mar 24');
    expect(result).toContain('\u2013'); // en-dash U+2013
  });

  it('formats a cross-month range correctly', () => {
    const start = new Date(2026, 1, 15); // Feb 15, 2026
    const end = new Date(2026, 2, 10);   // Mar 10, 2026
    const result = formatDateRangeLabel({ start: start.toISOString(), end: end.toISOString() });
    expect(result).toContain('Feb 15');
    expect(result).toContain('Mar 10');
    expect(result).toContain('\u2013'); // en-dash U+2013
  });

  it('produces a non-empty string for any valid range', () => {
    const start = new Date(2026, 0, 1);
    const end = new Date(2026, 11, 31);
    const result = formatDateRangeLabel({ start: start.toISOString(), end: end.toISOString() });
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).toContain('\u2013');
  });
});

describe('getPeriodDates custom fallback', () => {
  it("returns start on the first day of the current month", () => {
    const result = getPeriodDates('custom');
    const startDate = new Date(result.start);
    expect(startDate.getDate()).toBe(1);
  });

  it('returns valid ISO strings for start and end', () => {
    const result = getPeriodDates('custom');
    expect(() => new Date(result.start)).not.toThrow();
    expect(() => new Date(result.end)).not.toThrow();
    expect(result.start).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.end).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns end date within today', () => {
    const result = getPeriodDates('custom');
    const endDate = new Date(result.end);
    const today = new Date();
    expect(endDate.getFullYear()).toBe(today.getFullYear());
    expect(endDate.getMonth()).toBe(today.getMonth());
    expect(endDate.getDate()).toBe(today.getDate());
  });
});
