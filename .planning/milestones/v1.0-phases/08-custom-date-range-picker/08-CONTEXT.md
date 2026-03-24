# Phase 08: Custom Date Range Picker - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a date range picker UI to the analytics screen that lets users select custom start/end dates when the "Custom" period pill is tapped. This completes the VIZ-03 requirement by replacing the current month fallback with actual user-selected date ranges.

Requirements covered: VIZ-03 (custom range portion).

</domain>

<decisions>
## Implementation Decisions

### Date Picker Component
- Use `react-native-date-picker` library — pure native, Expo-compatible, dark theme support
- Single calendar view with "Start" / "End" toggle — simpler UI, less screen space
- Bottom sheet modal presentation (consistent with NoteEntryModal pattern)
- Two sequential date inputs: pick start date, then pick end date

### Date Range UX
- Default range when "Custom" tapped: current month (matches existing `getPeriodDates` fallback)
- No max date range limit — user freedom, local-only data
- Date display format: "Mar 24, 2026" (MMM DD, YYYY) — readable, compact
- Subtitle below "Custom" pill showing selected range (e.g., "Mar 1 – Mar 24")

### Analytics Integration
- Custom range stored in component state; `useEffect` uses custom range directly instead of calling `getPeriodDates` when period is 'custom'
- Custom range persists in component state across tab switches
- Pass custom DateRange to body-fill screen via route params (existing pattern)

### Claude's Discretion
- Exact modal dimensions and animation
- Calendar styling details within dark theme
- Edge cases (start after end date prevention)
- Transition animation when switching to/from custom

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PeriodSelector` (`src/components/analytics/PeriodSelector.tsx`): Already has 'custom' pill — needs to show subtitle and trigger date picker
- `getPeriodDates()` (`src/utils/periodHelpers.ts`): Custom case returns current month as fallback — will be bypassed by state-driven custom range
- `NoteEntryModal` pattern: Bottom sheet modal with dark theme — reuse modal structure
- `DateRange` type (`src/types/analytics.ts`): Already defined with `start` and `end` ISO strings

### Established Patterns
- Bottom sheet modals with overlay dismiss (NoteEntryModal, TargetTrendModal)
- Dark theme: `colors.background` (#0A0A0F), `colors.surface` (#14141F), `colors.accent`
- `useEffect` with dependency array for data fetching on state change
- Inter font family via typography constants

### Integration Points
- `app/(tabs)/analytics.tsx`: Main analytics screen — add custom range state and date picker trigger
- `src/components/analytics/PeriodSelector.tsx`: Add subtitle display and onCustomPress callback
- `src/utils/periodHelpers.ts`: May need `formatDateShort()` helper for subtitle display
- `app/body-fill.tsx`: Already receives period via route params — extend for custom range

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following existing dark theme and modal patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
