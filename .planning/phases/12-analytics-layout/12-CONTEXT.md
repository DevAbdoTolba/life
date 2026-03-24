# Phase 12: Analytics & Layout - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the daily activity bar chart with a line chart showing per-pillar trends, and reposition the home screen layout so joysticks are in the thumb-reach zone with the activity list peeking below. Requirements: UX-02, UX-03.

</domain>

<decisions>
## Implementation Decisions

### Line Chart (UX-02)
- **D-01:** Daily activity displays as a line chart with one line per pillar: Afterlife (golden #F5A623), Self (green #10B981), Others (blue #3B82F6).
- **D-02:** Each line shows total log count per day for that pillar (sum across all directions).
- **D-03:** The chart MUST fit within its content container — no overflow or clipping. This applies to the analytics page generally: any overflow issues in other charts should be fixed if encountered.
- **D-04:** Use `react-native-gifted-charts` LineChart (same library as current BarChart — already installed).

### Home Screen Layout (UX-03)
- **D-05:** Joysticks stay in their current triangle layout position (already near bottom of viewport). No major layout inversion needed.
- **D-06:** The activity list appears BELOW the joystick triangle, with the most recent entry peeking (~60px, one full row showing pillar color + direction + time).
- **D-07:** The activity list is scrollable on demand — user can scroll up to see full history.
- **D-08:** Header remains at top but can be compact (app name + action count).

### Claude's Discretion
- Exact line chart styling (line thickness, data point markers, curve interpolation)
- How the FlatList/ScrollView arrangement works to keep joysticks visible while list scrolls below
- Whether to use a bottom sheet, scroll view, or other mechanism for the peeking activity list
- Any chart overflow fixes needed on the analytics page beyond the daily activity chart

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Analytics
- `src/components/analytics/PillarBarChart.tsx` — Current BarChart implementation (to be replaced with LineChart), data transformation, gifted-charts usage
- `src/components/analytics/TrendLineChart.tsx` — Existing line chart component (may have reusable patterns)
- `src/types/analytics.ts` — DailyPillarCount type, PeriodType
- `src/constants/pillars.ts` — Pillar colors (positiveColor per pillar for line colors)

### Home Screen Layout
- `app/(tabs)/index.tsx` — Current FlatList layout with ListHeaderComponent containing joystick triangle, log history below
- `src/components/joystick/constants.ts` — JOYSTICK_SIZE (100px)
- `src/components/ui/LogHistoryItem.tsx` — Individual log entry component rendered in activity list
- `src/constants/theme.ts` — spacing, typography values

### Project Decisions
- `.planning/PROJECT.md` — ADR-024 (react-native-gifted-charts chosen for perf), ADR-020 (joysticks only on home)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PillarBarChart.tsx`: data transformation logic (grouping by day, label formatting) — reusable for line chart
- `TrendLineChart.tsx`: may already use gifted-charts LineChart API
- `LogHistoryItem.tsx`: existing log entry renderer for the activity list
- `react-native-gifted-charts`: already installed, exports both BarChart and LineChart

### Established Patterns
- Charts wrapped in Card component with title
- `useWindowDimensions()` for responsive chart width
- `useMemo` for data transformation
- FlatList with ListHeaderComponent for combined header + list layout

### Integration Points
- Replace BarChart import with LineChart in PillarBarChart.tsx (or create new component)
- Home screen FlatList structure needs restructuring: joysticks fixed, list peeks below
- `getTodayLogs()` already provides data for the activity list

</code_context>

<specifics>
## Specific Ideas

- User emphasized no ugly overflow — charts must respect their containers
- Joysticks are already almost at the bottom — layout change is mostly about adding the peek, not a full restructure
- One row peek (~60px) below joysticks — enough to show latest entry and invite scrolling

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-analytics-layout*
*Context gathered: 2026-03-24*
