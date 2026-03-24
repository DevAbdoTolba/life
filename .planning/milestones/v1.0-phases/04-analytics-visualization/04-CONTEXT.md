# Phase 04: Analytics & Visualization - Context

**Gathered:** 2026-03-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the analytics screen with bullet journal style charts (bar, pie, trend lines) and the physics-based body-fill visualization. Includes time period selection, period comparison, and target-specific analytics. The analytics tab placeholder gets replaced with a fully functional visualization system.

Requirements covered: VIZ-01, VIZ-02, VIZ-03, VIZ-04, VIZ-05.

</domain>

<decisions>
## Implementation Decisions

### Analytics Screen Structure
- **D-01:** Scrollable single page with card sections — no sub-tabs or extra navigation within the analytics tab
- **D-02:** ScreenContainer with `scrollable={true}` wraps the entire analytics view
- **D-03:** Content order: time period selector (sticky top) → summary stats → pillar charts → body-fill entry card → comparison section → target analytics

### Chart Types & Arrangement
- **D-04:** Summary stats row at top showing total logs, pillar breakdown, and positive/negative ratio for selected period
- **D-05:** Pillar-grouped bar charts showing daily log counts by direction, using pillar positive/negative colors from design system
- **D-06:** Pie/donut chart showing pillar distribution for selected period
- **D-07:** Trend line chart showing log frequency over time with pillar color coding
- **D-08:** Use react-native-gifted-charts (ADR-024) for all chart rendering — native-optimized, highest performance priority

### Time Period Selector
- **D-09:** Horizontal pill toggle row with preset periods: Today, Week, Month, Custom
- **D-10:** Preset toggles are the initial implementation (ADR-023) — custom date range picker available but secondary
- **D-11:** Sticky at top of scroll view so period selection is always accessible
- **D-12:** Custom range uses a date picker modal (not inline)

### Body-Fill Visualization
- **D-13:** Dedicated full-screen view launched from a preview card in the analytics scroll
- **D-14:** Cartoonish segmented SVG body silhouette boundary (ADR-025) — not anatomically detailed
- **D-15:** Matter.js physics engine with Skia rendering for colored balls falling into body segments
- **D-16:** Ball colors map to pillar positive/negative colors using existing `getLogColor()`
- **D-17:** Ball aggregation for high log counts (ADR-026) — larger balls represent multiple logs to prevent memory overflow
- **D-18:** Balls fill body in log chronological order for the selected period

### Period Comparison
- **D-19:** Stacked before/after cards (e.g., "This Week" on top, "Last Week" below) with delta indicators showing change
- **D-20:** Delta shown as percentage change and absolute count difference per pillar
- **D-21:** Comparison available for Week and Month periods (Today comparison not meaningful)

### Target-Specific Analytics
- **D-22:** Target analytics accessible by tapping a target in a target list within analytics
- **D-23:** Shows individual target trend line (log frequency over time) and total log count
- **D-24:** Respects privacy — shows codename if target is masked

### Claude's Discretion
- Loading skeleton design for charts while data loads
- Exact chart dimensions, padding, and label formatting
- Animation/transition details for period switching
- Empty state design when no logs exist for a period
- Physics ball sizes, gravity, and bounce parameters (within 60fps constraint)
- Preview card design for body-fill entry point
- Scroll behavior and section spacing

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Analytics Charting
- `.planning/PROJECT.md` §Key Decisions — ADR-022 (split analytics execution: charts first, physics second), ADR-024 (react-native-gifted-charts), ADR-023 (preset time period toggles)

### Physics Visualization
- `.planning/PROJECT.md` §Key Decisions — ADR-005 (Matter.js + Skia), ADR-025 (simplified physics boundary for 60fps), ADR-026 (ball aggregation for high log counts)

### Data Layer
- `src/stores/logStore.ts` — Existing `getLogsByPeriod()` method for period-based queries
- `src/database/schema.ts` — `logs` table with `created_at` and `pillar_id` indexes, `periods` table for custom evaluation periods
- `src/database/types.ts` — `Log`, `Period` type definitions

### Design System
- `src/constants/colors.ts` — 6 pillar colors (positive/negative per pillar), dark theme palette
- `src/constants/pillars.ts` — `getLogColor(pillarId, direction)` for mapping logs to colors
- `src/constants/theme.ts` — Typography, spacing, border radius tokens

### Requirements
- `.planning/REQUIREMENTS.md` §Visualization — VIZ-01 through VIZ-05 acceptance criteria

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Card` component (`src/components/ui/Card.tsx`): Pressable card with dark surface background — use for stat cards, chart containers, body-fill preview
- `ScreenContainer` (`src/components/ui/ScreenContainer.tsx`): Scrollable screen wrapper with SafeAreaView — use as analytics page container
- `Badge` (`src/components/ui/Badge.tsx`): Small label component — use for stat indicators
- `Text` (`src/components/ui/Text.tsx`): Themed text component
- `getLogColor()` (`src/constants/pillars.ts`): Maps (pillarId, direction) → color string — direct input for chart colors and physics ball colors
- `useLogStore.getLogsByPeriod()` (`src/stores/logStore.ts`): Fetches logs for a date range from SQLite — data source for all analytics

### Established Patterns
- Zustand stores with async SQLite queries (logStore, targetStore patterns)
- Dark theme with `colors.background` (#0A0A0F) and `colors.surface` (#14141F)
- StyleSheet.create pattern with theme constants imported from `src/constants`
- Expo Router file-based routing (`app/(tabs)/analytics.tsx` is the entry point)

### Integration Points
- `app/(tabs)/analytics.tsx` — Replace placeholder with full analytics screen
- `src/stores/logStore.ts` — May need additional query methods (e.g., grouped by pillar, daily aggregations)
- `src/database/schema.ts` — `periods` table already exists for custom period storage
- Navigation to body-fill full-screen view (Expo Router modal or stack push)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The bullet journal style is the creative direction — charts should feel like a personal journal's analytics page, not a corporate dashboard.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 04-analytics-visualization*
*Context gathered: 2026-03-23*
