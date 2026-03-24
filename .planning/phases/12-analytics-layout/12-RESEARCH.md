# Phase 12: Analytics & Layout - Research

**Researched:** 2026-03-24
**Domain:** react-native-gifted-charts LineChart API, React Native FlatList layout patterns
**Confidence:** HIGH

## Summary

Phase 12 has two independent work items: replacing the daily activity bar chart with a multi-line area chart, and restructuring the home screen so joysticks sit in the viewport with a 60px activity peek strip below.

For the line chart (UX-02), the project already contains a working template: `TrendLineChart.tsx` uses the exact `LineChart` + `dataSet` API at the correct version (1.4.76 installed). The new component is a predictable merge of the data transformation logic from `PillarBarChart` (group by day, build per-pillar totals, compute max) with the rendering logic from `TrendLineChart` (multi-line `dataSet`, area fill, axis chrome). The overflow problem with the bar chart occurs because grouped bars multiply the rendered bar count past the available `width`, causing clipping. The `LineChart` with `dataSet` sidesteps this entirely — it projects 3 lines onto the same x-axis at any width.

For the home screen layout (UX-03), the current `FlatList` in `index.tsx` places the header (containing joysticks) and the log list inside a single scroll container. The joysticks are already near the lower portion of the screen. The change adds a fixed 60px peek region below the joystick triangle by constraining the outer container with `flex` and adding a `maxHeight`-constrained FlatList at the bottom that the user can scroll to expand. The `TrendLineChart` and `PillarBarChart` components show the established patterns for `useWindowDimensions`, `useMemo`, and card wrapping that this phase must follow.

**Primary recommendation:** Implement `PillarActivityLineChart` by combining the data transformation from `PillarBarChart` with the `LineChart` rendering pattern from `TrendLineChart`, then restructure `index.tsx` to use a fixed-height peek container below the joystick view.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Line Chart (UX-02)**
- D-01: Daily activity displays as a line chart with one line per pillar: Afterlife (golden #F5A623), Self (green #10B981), Others (blue #3B82F6).
- D-02: Each line shows total log count per day for that pillar (sum across all directions).
- D-03: The chart MUST fit within its content container — no overflow or clipping. This applies to the analytics page generally: any overflow issues in other charts should be fixed if encountered.
- D-04: Use `react-native-gifted-charts` LineChart (same library as current BarChart — already installed).

**Home Screen Layout (UX-03)**
- D-05: Joysticks stay in their current triangle layout position (already near bottom of viewport). No major layout inversion needed.
- D-06: The activity list appears BELOW the joystick triangle, with the most recent entry peeking (~60px, one full row showing pillar color + direction + time).
- D-07: The activity list is scrollable on demand — user can scroll up to see full history.
- D-08: Header remains at top but can be compact (app name + action count).

### Claude's Discretion
- Exact line chart styling (line thickness, data point markers, curve interpolation)
- How the FlatList/ScrollView arrangement works to keep joysticks visible while list scrolls below
- Whether to use a bottom sheet, scroll view, or other mechanism for the peeking activity list
- Any chart overflow fixes needed on the analytics page beyond the daily activity chart

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-02 | Daily activity displays as line chart instead of bar chart (bar chart had ugly overflow) | `TrendLineChart.tsx` provides the complete LineChart+dataSet pattern; `PillarBarChart.tsx` provides the data transformation logic; both can be merged into a new component |
| UX-03 | Analog joysticks positioned in thumb-reach zone; activity list pushed below viewport with only latest entry peeking | Current `index.tsx` FlatList structure understood; restructuring to fixed-height peek strip is straightforward with `flex` + `maxHeight` container |
</phase_requirements>

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-gifted-charts | 1.4.76 (installed) | LineChart, BarChart, PieChart | Already in use (ADR-024); locked decision D-04 |
| gifted-charts-core | (peer) | DataSet type, lineDataItem type | Internal to gifted-charts; exposes type definitions used for dataSet prop |
| React Native FlatList | (bundled) | Scrollable activity list | Already in use on home screen |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| useWindowDimensions | RN built-in | Responsive chart width calculation | Width formula: `width - spacing.xl * 2 - spacing.lg * 2` |
| useMemo | React built-in | Data transformation memoization | Wrap all per-pillar aggregation to prevent recalculation on re-render |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| LineChart dataSet prop | Three separate LineChart instances | dataSet is the correct multi-line API; separate instances would fight over x-axis alignment |
| FlatList with maxHeight peek | Bottom sheet library (gorhom/react-native-bottom-sheet) | Bottom sheet adds dependency and complexity; simple maxHeight FlatList satisfies D-06/D-07 without external dep |
| FlatList with maxHeight peek | ScrollView + View | FlatList already used on home screen and handles large lists more efficiently |

**Installation:** No new packages required. All dependencies are already installed.

**Version verification:** react-native-gifted-charts 1.4.76 confirmed installed via `node_modules/react-native-gifted-charts/package.json`.

---

## Architecture Patterns

### Recommended Project Structure

No new directories required. Changes are confined to:

```
src/components/analytics/
├── PillarActivityLineChart.tsx   # NEW — replaces PillarBarChart in analytics.tsx
├── PillarBarChart.tsx            # Kept (reference), no longer imported by analytics.tsx
└── TrendLineChart.tsx            # Unchanged — reuse its LineChart pattern

app/(tabs)/
└── index.tsx                     # MODIFIED — joystick + peek layout restructure
```

### Pattern 1: Multi-line gifted-charts LineChart with dataSet

**What:** Use the `dataSet` prop on `LineChart` (not `data`) to render multiple lines on a shared x-axis. Each dataset entry is a `DataSet` object with its own `data`, `color`, `curved`, `areaChart`, fill colors, and opacities.

**When to use:** Whenever multiple series share the same x-axis labels (days). This is the only correct pattern for multi-line gifted-charts — `data` prop is for single-line only.

**Verified source:** `src/components/analytics/TrendLineChart.tsx` (existing production code using this exact API), `gifted-charts-core/dist/utils/types.d.ts` (DataSet interface confirmed).

**Example:**
```typescript
// Source: TrendLineChart.tsx (existing codebase pattern)
const lineDataSets = useMemo(() => {
  // collect all unique days sorted
  const daySet = new Set<string>();
  for (const item of dailyCounts) daySet.add(item.day);
  const days = Array.from(daySet).sort();

  // per-pillar daily totals (sum across all directions per day)
  const pillarTotals: Record<1 | 2 | 3, number[]> = {
    1: days.map(() => 0),
    2: days.map(() => 0),
    3: days.map(() => 0),
  };
  for (const item of dailyCounts) {
    const dayIndex = days.indexOf(item.day);
    if (dayIndex >= 0 && (item.pillarId === 1 || item.pillarId === 2 || item.pillarId === 3)) {
      pillarTotals[item.pillarId][dayIndex] += item.count;
    }
  }

  const xLabels = days.map((day) => getDayLabel(day, period));
  return [
    {
      data: pillarTotals[1].map((value, i) => ({ value, label: xLabels[i] })),
      color: colors.afterlifePositive,  // #F5A623 — D-01
      thickness: 2,
      curved: true,
      areaChart: true,
      startFillColor: colors.afterlifePositive,
      endFillColor: colors.afterlifePositive,
      startOpacity: 0.15,
      endOpacity: 0,
    },
    // ... pillar 2 (selfPositive #10B981), pillar 3 (othersPositive #3B82F6)
  ];
}, [dailyCounts, period]);

<LineChart
  dataSet={lineDataSets}
  areaChart
  width={chartWidth}
  height={180}  // matches PillarBarChart height — D-03
  noOfSections={4}
  isAnimated
  // ... axis chrome matching existing chart style
/>
```

### Pattern 2: Home screen peek layout with fixed-height FlatList

**What:** Divide the home screen into three vertically stacked flex regions: (1) compact header, (2) joystick triangle taking remaining space via `flex: 1`, (3) fixed-height peek container (60px) for the activity list. The peek container holds a `FlatList` that is scroll-enabled; scrolling expands it naturally past the 60px boundary.

**When to use:** When joysticks must always be visible but a list below needs to be accessible.

**Key insight:** `maxHeight` on the FlatList's container does NOT prevent scrolling past the boundary — once the user scrolls, the content scrolls within the remaining screen space. To get the "peek then expand" behavior, the peek container must be a separate `View` with `maxHeight: 60` initially, but the FlatList inside should be allowed to extend (controlled by the parent flex). The correct approach per UI-SPEC is: outer container `flex: 1` (full screen), inner layout `SafeAreaView` with three children — compact header, joystick `View` with `flex: 1`, and peek `FlatList` with `style={{ maxHeight: 60 }}` that the user can scroll.

**Example:**
```typescript
// Source: UI-SPEC.md layout contract + app/(tabs)/index.tsx (existing structure)
<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
  {/* 1. Compact header */}
  <View style={styles.header}>
    <Text style={styles.title}>Hayat</Text>
    <Text style={styles.actionCount}>{todayLogs.length} actions today</Text>
  </View>

  {/* 2. Joystick triangle — takes remaining space */}
  <View style={styles.triangleContainer}>
    {/* top row: Afterlife */}
    {/* bottom row: Self + Others */}
  </View>

  {/* 3. Peek strip — 60px initial, scrollable */}
  <View style={styles.peekContainer}>
    <FlatList
      data={todayLogs}
      renderItem={...}
      scrollEnabled
      showsVerticalScrollIndicator={false}
    />
  </View>
</SafeAreaView>

// styles.peekContainer: { maxHeight: 60, borderTopWidth: 1, borderTopColor: colors.border }
// styles.triangleContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
// styles.header: { paddingTop: spacing.lg, paddingBottom: spacing.lg, alignItems: 'center' }
```

### Anti-Patterns to Avoid

- **Using `data` prop instead of `dataSet` for multi-line charts:** The `data` prop is for single-line LineChart. Multi-series requires `dataSet: DataSet[]`. Using `data` for multiple pillars is not possible.
- **Calculating `maxValue` per-bar as in PillarBarChart:** The bar chart tracks the max of individual counts per pillar per direction. For the line chart, max should be the max of per-pillar daily TOTALS (sum across directions), not raw direction counts.
- **Placing the FlatList inside `ListHeaderComponent` of another FlatList:** Nested FlatLists cause scroll conflicts on the home screen. The peek structure should be a sibling to the joystick view, not nested.
- **Using the same outer FlatList pattern from index.tsx:** The current FlatList-with-ListHeaderComponent pattern must be replaced with the three-region layout described above.
- **Not clamping chart width:** Charts without an explicit `width` prop will attempt to measure their container and may overflow cards. Always use `useWindowDimensions().width - spacing.xl * 2 - spacing.lg * 2`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-line chart with shared x-axis | Custom SVG line renderer | `LineChart` with `dataSet` prop from react-native-gifted-charts | Chart library handles axis alignment, animation, area fills, touch events |
| Responsive chart width | Manual screen dimension tracking | `useWindowDimensions()` | React hook that updates on orientation changes; already the project pattern |
| Per-pillar color assignment | Custom color mapping function | `colors.afterlifePositive`, `colors.selfPositive`, `colors.othersPositive` from `src/constants/colors.ts` | Established color tokens; use directly |
| Log row rendering | Custom list item | `LogHistoryItem` from `src/components/ui` | Already built, tested, and used on home screen |

**Key insight:** The entire chart implementation already exists in `TrendLineChart.tsx` as a working reference. The new component should closely follow that file's structure, differing only in: (1) height (180 vs 140), (2) title ("Daily Activity" vs "Activity Trends"), (3) empty state height (180 vs 140), and (4) the x-label logic copied from `PillarBarChart`.

---

## Common Pitfalls

### Pitfall 1: Bar chart overflow root cause

**What goes wrong:** The existing `PillarBarChart` overflows because it renders one bar per `(day, pillarId, direction)` combination. For a week with 3 pillars and 4 directions each, that's up to 84 bars in a fixed `width`. The bar library calculates each bar's pixel width from `(width - initialSpacing) / barCount`, causing bars to squeeze together or extend past the container.

**Why it happens:** The grouped bar pattern multiplies bar count by the number of series × number of directions. `gifted-charts` does not automatically compress grouped bars to fit the available width.

**How to avoid:** The `LineChart` with `dataSet` renders N data points per series (one per day), not N×pillars×directions. A 7-day week produces 7 x-axis points regardless of pillar count. Width is always respected.

**Warning signs:** If switching to LineChart but keeping the bar chart's data shape (one point per pillar-direction pair), the x-axis will have duplicate day labels and the chart will appear correct in width but wrong in data.

### Pitfall 2: dataSet vs data prop on LineChart

**What goes wrong:** Passing `data` instead of `dataSet` for a multi-line chart results in a single-line chart showing only the first dataset's values.

**Why it happens:** `LineChart` has both `data: lineDataItem[]` (single line) and `dataSet: DataSet[]` (multi-line) props. TypeScript does not prevent passing both.

**How to avoid:** Use `dataSet` exclusively for the multi-pillar chart. Do not pass `data` alongside `dataSet`.

**Warning signs:** Only one colored line appears in the chart despite three datasets being constructed.

### Pitfall 3: Home screen joystick scroll-out

**What goes wrong:** If the joystick container does not have a fixed height or `flex: 1`, a long activity list will push the joysticks above the viewport when the user scrolls the peek list upward.

**Why it happens:** The current FlatList-with-ListHeaderComponent pattern allows the entire header (including joysticks) to scroll. The new layout must keep joysticks in a non-scrolling region.

**How to avoid:** Place joysticks in a `View` with `flex: 1` that is a direct child of `SafeAreaView`, NOT inside any ScrollView or FlatList header. The peek FlatList must be a sibling, not a child of the joystick view.

**Warning signs:** Joysticks disappear from screen when user scrolls up on the activity list.

### Pitfall 4: Empty activity list — no peek strip visible

**What goes wrong:** If the activity list is empty and the peek container only shows when `todayLogs.length > 0`, the user sees no affordance that a list exists.

**Why it happens:** Conditional rendering hides the strip entirely when empty.

**How to avoid:** Always render the 60px peek container. When empty, show the "No activity yet" empty state text. This matches the UI-SPEC interaction states contract.

**Warning signs:** The 60px gap between joysticks and bottom edge disappears when the log list is empty.

### Pitfall 5: maxValue calculation for the line chart

**What goes wrong:** Using the maximum raw `item.count` (per-direction count) instead of the maximum per-pillar daily total. This results in a y-axis that is too low if a single pillar has many logs across multiple directions.

**Why it happens:** `PillarBarChart` uses max per direction item, which works for individual bars. For totals-per-pillar, the max is the sum of direction counts for the busiest pillar on the busiest day.

**How to avoid:** After building `pillarTotals`, compute `maxCount = Math.max(...Object.values(pillarTotals).flat())`. Floor at 5 to avoid a flat chart with zero data.

---

## Code Examples

Verified patterns from codebase:

### Chart width formula (from both existing chart components)
```typescript
// Source: src/components/analytics/PillarBarChart.tsx (line 31)
// Source: src/components/analytics/TrendLineChart.tsx (line 27)
const { width } = useWindowDimensions();
const chartWidth = width - spacing.xl * 2 - spacing.lg * 2;
// spacing.xl = 24, spacing.lg = 16 → chartWidth = width - 80
```

### DataSet type (confirmed from gifted-charts-core/dist/utils/types.d.ts)
```typescript
interface DataSet {
  data: lineDataItem[];         // { value: number; label?: string }[]
  color?: string;               // line color
  thickness?: number;           // line width in px
  curved?: boolean;             // smooth interpolation
  areaChart?: boolean;          // enable fill below line
  startFillColor?: string;      // fill color at top
  endFillColor?: string;        // fill color at bottom
  startOpacity?: number;        // fill opacity at top (0.15 used in TrendLineChart)
  endOpacity?: number;          // fill opacity at bottom (0 = transparent)
  hideDataPoints?: boolean;     // hide circle markers on data points
}
```

### Pillar colors (from src/constants/colors.ts)
```typescript
// Afterlife: colors.afterlifePositive = '#F5A623'
// Self:      colors.selfPositive = '#10B981'
// Others:    colors.othersPositive = '#3B82F6'
```

### LogHistoryItem height calculation (from src/components/ui/LogHistoryItem.tsx)
```typescript
// paddingVertical: spacing.sm (8px × 2 = 16px)
// topRow height: ~28px (8px dot + text line at ~16px lineHeight + gap)
// borderBottomWidth: hairline (~1px)
// Total ≈ 45px, padded to 60px with peekContainer minHeight
```

### Analytics page import replacement
```typescript
// analytics.tsx — change this one import and usage:
// Before: import { PillarBarChart } from '../../src/components/analytics/PillarBarChart';
// After:  import { PillarActivityLineChart } from '../../src/components/analytics/PillarActivityLineChart';
// Usage: <PillarActivityLineChart dailyCounts={dailyCounts} period={selectedPeriod} />
// Props interface is identical to PillarBarChartProps
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BarChart with grouped bars per day | LineChart with dataSet (one line per pillar) | Phase 12 | Eliminates overflow; trend continuity is visible |
| FlatList-with-header (scrollable joysticks) | Three-region layout (header + fixed joystick + peek list) | Phase 12 | Joysticks always visible; list accessible via scroll |

**Deprecated/outdated:**
- `PillarBarChart`: Still kept in the codebase but no longer imported by `analytics.tsx` after Phase 12. Not deleted — preserves reference.

---

## Open Questions

1. **Scroll behavior when activity list expands**
   - What we know: UI-SPEC says `maxHeight: 60` peek, `scrollEnabled: true`
   - What's unclear: When user scrolls the peek FlatList upward, does the joystick view scroll away too? React Native's `FlatList` with a fixed-height container will scroll content within it — but if the container is `maxHeight: 60`, scrolling will reveal more list rows within that same region, not expand the container height.
   - Recommendation: Set `style={{ flex: 1 }}` on the peek FlatList (not `maxHeight`) inside a container with `maxHeight: 60`. This will show only 60px initially but allow internal scroll. Test on device to confirm this matches expected UX — the joystick view should NOT scroll away.

2. **Other chart overflow issues on analytics page (D-03)**
   - What we know: The bar chart is the confirmed overflow source. `TrendLineChart` uses explicit `width` formula. `PillarDonutChart` uses `PieChart` with fixed `radius={80}` and `alignItems: 'center'` — no width-related overflow risk. `TargetTrendModal` uses a scrollable modal.
   - What's unclear: Whether any overflow actually manifests visually at runtime on narrow screens.
   - Recommendation: No preemptive fixes needed for other charts unless overflow is observed during Phase 12 execution. Document as "fix-if-encountered" (already in D-03).

---

## Environment Availability

Step 2.6: SKIPPED — Phase 12 is purely code changes within the existing React Native project. No external tools, services, CLIs, runtimes, or databases beyond what the project already uses. Expo development server and `npm test` are already functional from Phase 9.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29 with jest-expo preset (native) + ts-jest (unit) |
| Config file | `jest.config.js` (root), `jest.unit.config.js` (unit only) |
| Quick run command | `npx jest --config jest.unit.config.js` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UX-02 | Daily activity line chart renders without overflow | Manual visual inspection (Expo Go) | n/a — chart rendering requires native renderer | Manual only |
| UX-02 | `buildLineDataSets` correctly aggregates per-pillar daily totals | Unit | `npx jest --config jest.unit.config.js src/utils/analyticsHelpers.test.ts` | Wave 0 gap |
| UX-03 | Joysticks visible without scrolling on first render | Manual visual inspection (Expo Go) | n/a — layout requires native measurement | Manual only |
| UX-03 | Activity peek strip shows most recent log at 60px height | Manual visual inspection (Expo Go) | n/a — visual/layout | Manual only |

**Note:** Both requirements are primarily visual/layout and require device or simulator testing. The only automatable piece is the data transformation logic if extracted to a testable utility.

### Sampling Rate

- **Per task commit:** `npx jest --config jest.unit.config.js` (fast — node environment, no RN deps)
- **Per wave merge:** `npx jest` (full suite including native component tests)
- **Phase gate:** Full suite green + manual visual check in Expo Go before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/utils/analyticsHelpers.test.ts` — unit test for per-pillar daily total aggregation (optional; if aggregation logic is kept inline in the component, this gap is not blocking)

*(Existing test infrastructure covers the framework setup; no framework install needed.)*

---

## Sources

### Primary (HIGH confidence)
- `/home/appuser/workspace/life/src/components/analytics/TrendLineChart.tsx` — complete working LineChart+dataSet pattern; confirmed production code
- `/home/appuser/workspace/life/src/components/analytics/PillarBarChart.tsx` — data transformation and axis chrome patterns; confirmed production code
- `/home/appuser/workspace/life/app/(tabs)/index.tsx` — current home screen FlatList structure; confirmed production code
- `/home/appuser/workspace/life/node_modules/gifted-charts-core/dist/utils/types.d.ts` — `DataSet` interface; confirmed installed type definitions
- `/home/appuser/workspace/life/node_modules/gifted-charts-core/dist/LineChart/types.d.ts` — `LineChartPropsType` including `dataSet`, `width`, `height`, `noOfSections`, `maxValue`, `areaChart`, `curved` props; confirmed installed type definitions
- `/home/appuser/workspace/life/.planning/phases/12-analytics-layout/12-UI-SPEC.md` — prescriptive layout and chart spec; source of truth for dimensions

### Secondary (MEDIUM confidence)
- `.planning/phases/12-analytics-layout/12-CONTEXT.md` — user decisions D-01 through D-08; gathered by discuss-phase agent
- `.planning/PROJECT.md` — ADR-024 (gifted-charts chosen), ADR-020 (joysticks home only)

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — library already installed, existing production code using the exact API
- Architecture: HIGH — both patterns (LineChart dataSet, peek FlatList) directly verified in existing codebase files
- Pitfalls: HIGH — root causes traced to actual type definitions and existing code logic

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (gifted-charts stable, no expected API changes)
