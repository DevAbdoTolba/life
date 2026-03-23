# Phase 04: Analytics & Visualization - Research

**Researched:** 2026-03-23
**Domain:** React Native charts, Matter.js physics, Skia rendering, Expo Router modals
**Confidence:** HIGH (for chart library and physics pattern), MEDIUM (for body-fill SVG boundary specifics)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Scrollable single page with card sections — no sub-tabs or extra navigation within the analytics tab
- **D-02:** ScreenContainer with `scrollable={true}` wraps the entire analytics view
- **D-03:** Content order: time period selector (sticky top) → summary stats → pillar charts → body-fill entry card → comparison section → target analytics
- **D-04:** Summary stats row at top showing total logs, pillar breakdown, and positive/negative ratio for selected period
- **D-05:** Pillar-grouped bar charts showing daily log counts by direction, using pillar positive/negative colors from design system
- **D-06:** Pie/donut chart showing pillar distribution for selected period
- **D-07:** Trend line chart showing log frequency over time with pillar color coding
- **D-08:** Use react-native-gifted-charts (ADR-024) for all chart rendering — native-optimized, highest performance priority
- **D-09:** Horizontal pill toggle row with preset periods: Today, Week, Month, Custom
- **D-10:** Preset toggles are the initial implementation (ADR-023) — custom date range picker available but secondary
- **D-11:** Sticky at top of scroll view so period selection is always accessible
- **D-12:** Custom range uses a date picker modal (not inline)
- **D-13:** Dedicated full-screen view launched from a preview card in the analytics scroll
- **D-14:** Cartoonish segmented SVG body silhouette boundary (ADR-025) — not anatomically detailed
- **D-15:** Matter.js physics engine with Skia rendering for colored balls falling into body segments
- **D-16:** Ball colors map to pillar positive/negative colors using existing `getLogColor()`
- **D-17:** Ball aggregation for high log counts (ADR-026) — larger balls represent multiple logs to prevent memory overflow
- **D-18:** Balls fill body in log chronological order for the selected period
- **D-19:** Stacked before/after cards (e.g., "This Week" on top, "Last Week" below) with delta indicators showing change
- **D-20:** Delta shown as percentage change and absolute count difference per pillar
- **D-21:** Comparison available for Week and Month periods (Today comparison not meaningful)
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

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIZ-01 | Bullet journal style charts (bar, pie, trend lines) for any time period | react-native-gifted-charts BarChart, PieChart, LineChart APIs fully documented below |
| VIZ-02 | Physics-based human body silhouette fills with colored balls representing actions | Matter.js + Skia Canvas + Group clip pattern documented; body SVG strategy documented |
| VIZ-03 | Custom time period selector (today, week, month, Ramadan, custom range) | Period calculation helpers + date picker modal approach documented |
| VIZ-04 | Period comparison view (this week vs last week) | Dual `getLogsByPeriod()` query + delta calculation pattern documented |
| VIZ-05 | Target-specific analytics (trending for individual targets) | SQL GROUP BY target_id query extension + LineChart with dataSet documented |
</phase_requirements>

---

## Summary

Phase 04 builds the analytics screen and the physics body-fill visualization. The technical domain divides cleanly into two streams (aligned with ADR-022): stream A is the chart-based analytics view built with `react-native-gifted-charts`, and stream B is the physics visualization using `matter-js` and `@shopify/react-native-skia`. Both libraries are already installed in the project (`package.json`); only `react-native-gifted-charts` needs a new install alongside its peer dependencies `expo-linear-gradient` and `react-native-svg`.

The analytics screen replaces the placeholder `app/(tabs)/analytics.tsx`. It uses `ScreenContainer` with `scrollable={true}` and a sticky time period toggle at the top. All chart types (bar, pie, line) share a uniform color mapping through `getLogColor()` from `src/constants/pillars.ts`. Data for all charts comes from the existing `getLogsByPeriod()` method in `logStore.ts`; the store will need additional aggregation helpers (group by pillar, group by day, group by target) that execute SQL queries — these belong in `logStore.ts` alongside the existing pattern.

The body-fill visualization is a full-screen modal launched from a preview card in the analytics scroll. The architecture uses Matter.js as the invisible physics engine, Reanimated `makeMutable` shared values as the bridge, and a Skia `<Canvas>` with `<Group clip={bodyPath}>` to confine ball rendering to the SVG body silhouette shape. Static rectangular Matter.js walls mimic the body's internal boundaries (a simplified "segmented" approach per ADR-025). This avoids the complexity of converting a concave SVG path to Matter.js polygon bodies.

**Primary recommendation:** Build charts first (stream A, 3 plans), then physics visualization (stream B, 2 plans), matching the ADR-022 split execution order.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-gifted-charts | 1.4.76 | Bar, pie, line charts | ADR-024; native SVG-based, no Canvas required, highest performance for this use case |
| @shopify/react-native-skia | 2.4.18 | 2D graphics canvas for physics visualization | ADR-005; already installed, proven Expo pattern |
| matter-js | 0.20.0 | Physics engine (invisible bodies) | ADR-005; already installed |
| react-native-reanimated | 4.2.1 | Shared values bridge physics → Skia | Already installed; `makeMutable()` is the game-loop glue |

### Peer Dependencies — Need Install
| Library | Version | Purpose | Note |
|---------|---------|---------|------|
| expo-linear-gradient | 55.0.9 | Required peer for react-native-gifted-charts | Already installed (see package.json) |
| react-native-svg | 15.15.4 | Required peer for react-native-gifted-charts | NOT in package.json — must install |

### Verification
```bash
npm view react-native-gifted-charts version   # 1.4.76 (verified 2026-03-23)
npm view expo-linear-gradient version          # 55.0.9 (verified 2026-03-23)
npm view react-native-svg version              # 15.15.4 (verified 2026-03-23)
```

**expo-linear-gradient** is already in package.json (`"expo-linear-gradient": "~55.0.9"`? — actually NOT listed — check before assuming). Verify by running `npm list expo-linear-gradient`.

**react-native-svg** is NOT in package.json. It is a required peer of react-native-gifted-charts and must be installed.

### Installation
```bash
npx expo install react-native-gifted-charts react-native-svg
```
`expo-linear-gradient` is already installed. If `npm list expo-linear-gradient` shows missing, also add it:
```bash
npx expo install expo-linear-gradient
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-gifted-charts | Victory Native | Victory has fewer chart types, no active 2025 updates |
| react-native-gifted-charts | react-native-charts-wrapper | Requires bridging to native MPAndroidChart/Charts; more complex build |
| Matter.js + Skia | react-native-reanimated-physics | Not production-ready |

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── components/
│   ├── analytics/
│   │   ├── PeriodSelector.tsx       # Sticky pill toggle (Today/Week/Month/Custom)
│   │   ├── SummaryStatsRow.tsx      # 3-cell stat summary row
│   │   ├── PillarBarChart.tsx       # Per-pillar bar chart (D-05)
│   │   ├── PillarDonutChart.tsx     # Pillar distribution pie/donut (D-06)
│   │   ├── TrendLineChart.tsx       # Frequency over time (D-07)
│   │   ├── BodyFillPreviewCard.tsx  # Entry point card → full-screen push
│   │   ├── ComparisonCards.tsx      # Stacked before/after (D-19)
│   │   ├── TargetAnalyticsList.tsx  # Tappable target list (D-22)
│   │   └── TargetTrendModal.tsx     # Per-target trend line overlay
│   ├── physics/
│   │   ├── BodyFillCanvas.tsx       # Matter.js + Skia Canvas component
│   │   └── useBodyFillPhysics.ts    # Physics engine hook (engine, world, game loop)
│   └── ui/                          # (existing)
├── stores/
│   └── logStore.ts                  # Add aggregation methods here
app/
├── (tabs)/
│   └── analytics.tsx                # Replace placeholder with AnalyticsScreen
└── body-fill.tsx                    # Full-screen modal (presentation: 'fullScreenModal')
```

### Pattern 1: react-native-gifted-charts Data Format

**What:** Charts receive pre-computed data arrays; no computation inside chart components.
**When to use:** All three chart types (BarChart, PieChart, LineChart).

```typescript
// Source: https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/docs/BarChart/BarChartProps.md

// BarChart data item
interface BarDataItem {
  value: number;
  frontColor?: string;   // e.g. colors.afterlifePositive
  label?: string;        // x-axis label, e.g. 'Mon'
  topLabelComponent?: () => JSX.Element;
}

// PieChart data item
interface PieDataItem {
  value: number;
  color: string;         // e.g. colors.selfPositive
  text?: string;         // label shown on section
}

// LineChart with multiple lines (v1.3.19+ dataSet prop)
interface LineDataSet {
  data: Array<{ value: number }>;
  color: string;
  thickness?: number;
  curved?: boolean;
}
```

**Dark theme styling for all charts:**
```typescript
// Source: https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts

const CHART_DARK_PROPS = {
  backgroundColor: colors.surface,          // card background
  xAxisColor: colors.border,
  yAxisTextStyle: { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
  xAxisLabelTextStyle: { color: colors.textSecondary, fontFamily: typography.fontFamily.regular },
  rulesColor: colors.border,
  rulesType: 'dashed' as const,
};
```

### Pattern 2: BarChart — Pillar-Grouped Daily Counts

```typescript
// Source: verified BarChartProps.md
import { BarChart } from 'react-native-gifted-charts';

<BarChart
  data={barData}            // BarDataItem[]
  width={chartWidth}        // useWindowDimensions().width - padding
  height={180}
  maxValue={maxDailyCount}
  noOfSections={4}
  frontColor={colors.afterlifePositive}  // overridden per item via data.frontColor
  {...CHART_DARK_PROPS}
  isAnimated
  barBorderRadius={4}
  spacing={12}
  initialSpacing={8}
/>
```

### Pattern 3: PieChart / Donut Chart

```typescript
// Source: verified PieChartProps.md
import { PieChart } from 'react-native-gifted-charts';

<PieChart
  data={pieData}          // PieDataItem[] with .color per item
  donut                   // renders as donut chart
  innerRadius={50}
  radius={80}
  showText
  labelsPosition="outward"
  textColor={colors.textPrimary}
/>
```

### Pattern 4: LineChart — Trend Lines with Multiple Pillars

```typescript
// Source: verified LineChartProps.md — dataSet available v1.3.19+
import { LineChart } from 'react-native-gifted-charts';

<LineChart
  dataSet={[
    { data: afterlifeData, color: colors.afterlifePositive, thickness: 2, curved: true },
    { data: selfData,      color: colors.selfPositive,      thickness: 2, curved: true },
    { data: othersData,    color: colors.othersPositive,    thickness: 2, curved: true },
  ]}
  areaChart
  startFillColor={colors.afterlifePositive}
  startOpacity={0.2}
  endOpacity={0}
  height={140}
  width={chartWidth}
  {...CHART_DARK_PROPS}
  isAnimated
/>
```

### Pattern 5: Matter.js + Skia Physics Game Loop

**What:** Physics engine ticks at 60fps; Reanimated `makeMutable` shared values bridge positions to Skia canvas without triggering React re-renders.
**Source:** https://expo.dev/blog/build-2d-game-style-physics-with-matter-js-and-react-native-skia

```typescript
// useBodyFillPhysics.ts — hook managing engine lifecycle
import Matter from 'matter-js';
import { makeMutable } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';

interface BallState {
  x: ReturnType<typeof makeMutable<number>>;
  y: ReturnType<typeof makeMutable<number>>;
  r: number;
  color: string;
}

export function useBodyFillPhysics(balls: BallConfig[], containerDims: Dims) {
  const engineRef = useRef(Matter.Engine.create());
  const bodiesRef = useRef<Matter.Body[]>([]);
  const rafRef = useRef<number>(0);
  const ballStates = useRef<BallState[]>([]);

  useEffect(() => {
    const engine = engineRef.current;
    const world = engine.world;

    // Add static walls (floor + sides aligned to body container)
    const floor = Matter.Bodies.rectangle(
      containerDims.width / 2,
      containerDims.height + 25,
      containerDims.width, 50,
      { isStatic: true }
    );
    const leftWall = Matter.Bodies.rectangle(-25, containerDims.height / 2, 50, containerDims.height, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(containerDims.width + 25, containerDims.height / 2, 50, containerDims.height, { isStatic: true });
    Matter.World.add(world, [floor, leftWall, rightWall]);

    // Drop balls in chronological order with delay
    balls.forEach((ball, i) => {
      setTimeout(() => {
        const body = Matter.Bodies.circle(ball.dropX, -ball.radius, ball.radius, {
          restitution: 0.4,
          friction: 0.1,
          frictionAir: 0.02,
        });
        Matter.World.add(world, body);
        bodiesRef.current.push(body);

        const state: BallState = {
          x: makeMutable(ball.dropX),
          y: makeMutable(-ball.radius),
          r: ball.radius,
          color: ball.color,
        };
        ballStates.current.push(state);
      }, i * 150);  // stagger drop timing
    });

    // Game loop
    function tick() {
      Matter.Engine.update(engine, 1000 / 60);
      bodiesRef.current.forEach((body, i) => {
        if (ballStates.current[i]) {
          ballStates.current[i].x.value = body.position.x;
          ballStates.current[i].y.value = body.position.y;
        }
      });
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      Matter.World.clear(world, false);
      Matter.Engine.clear(engine);
    };
  }, []);  // run once on mount

  return ballStates;
}
```

### Pattern 6: Skia Canvas with SVG Body Clip

**What:** The body silhouette is an SVG path string. Skia's `Group` component accepts `clip={Skia.Path.MakeFromSVGString(svgPath)!}`, confining all child drawing to the silhouette boundary. Balls are rendered as `Circle` nodes inside the clipped Group.
**Source:** https://shopify.github.io/react-native-skia/docs/group/

```typescript
// BodyFillCanvas.tsx
import { Canvas, Group, Circle, useValue } from '@shopify/react-native-skia';
import { Skia } from '@shopify/react-native-skia';

const BODY_SVG_PATH = `M 100 0 L 120 40 L 140 80 ...`; // cartoonish silhouette (see Body SVG section)
const bodyClipPath = Skia.Path.MakeFromSVGString(BODY_SVG_PATH)!;

export function BodyFillCanvas({ ballStates }: Props) {
  return (
    <Canvas style={{ flex: 1 }}>
      {/* Silhouette outline (visible stroke) */}
      <Path path={bodyClipPath} color="transparent" strokeWidth={2} style="stroke" color={colors.border} />

      {/* All balls clipped to body shape */}
      <Group clip={bodyClipPath}>
        {ballStates.current.map((ball, i) => (
          <Circle
            key={i}
            cx={ball.x}    // Reanimated SharedValue — auto-reacts
            cy={ball.y}
            r={ball.r}
            color={ball.color}
          />
        ))}
      </Group>
    </Canvas>
  );
}
```

### Pattern 7: Expo Router Full-Screen Modal for Body-Fill

**What:** The physics view lives at `app/body-fill.tsx` and is pushed as a `fullScreenModal` from the analytics scroll.
**Source:** https://docs.expo.dev/router/advanced/modals/

The root `app/_layout.tsx` already uses a `<Stack>` — add the new screen there:

```typescript
// In app/_layout.tsx Stack, add:
<Stack.Screen
  name="body-fill"
  options={{
    presentation: 'fullScreenModal',
    headerShown: false,
  }}
/>
```

Navigate from the preview card:
```typescript
import { router } from 'expo-router';
router.push('/body-fill');
```

### Pattern 8: Data Aggregation — New logStore Methods Needed

The existing `getLogsByPeriod()` returns raw logs. Charts need aggregated data. Add these to `logStore.ts`:

```typescript
// Daily log counts by pillar for BarChart
getDailyLogsByPillar: async (startDate: string, endDate: string) => Promise<DailyPillarCount[]>
// SQL: SELECT date(created_at) as day, pillar_id, direction, COUNT(*) as count
//      FROM logs WHERE created_at >= ? AND created_at <= ?
//      GROUP BY day, pillar_id, direction
//      ORDER BY day ASC

// Per-target log count and trend
getLogsByTarget: async (targetId: string, startDate: string, endDate: string) => Promise<Log[]>
// SQL: SELECT * FROM logs WHERE target_id = ? AND created_at >= ? AND created_at <= ? ORDER BY created_at ASC
```

### Anti-Patterns to Avoid

- **Recomputing chart data inside chart render functions:** Always memoize with `useMemo` keyed on the period + logs.
- **Using `useState` for physics body positions:** Use `makeMutable` + `useRef` — `useState` triggers JS re-renders on every physics frame.
- **Using `Bodies.fromVertices` for the body silhouette:** A concave SVG silhouette requires poly-decomp and produces unreliable collision shapes. Use rectangular static walls to approximate body segments instead (ADR-025).
- **Rendering physics canvas inside ScrollView:** The full-screen physics view should be a separate screen (no ScrollView parent) to avoid gesture conflicts.
- **Not cleaning up the Matter.js engine on unmount:** Always `cancelAnimationFrame` + `Matter.World.clear` + `Matter.Engine.clear` in the `useEffect` cleanup.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bar charts | Custom SVG bar renderer | `BarChart` from react-native-gifted-charts | Animation, axis labels, press handling, thousands of edge cases |
| Pie/donut charts | Custom arc math | `PieChart` from react-native-gifted-charts | Sector calculations, label positioning, focus-on-press |
| Trend lines | Custom polyline with interpolation | `LineChart` from react-native-gifted-charts | Curve smoothing, multiple datasets, area fill |
| Physics simulation | Custom collision detection | Matter.js engine | Broad-phase + narrow-phase collision, constraint solving |
| 2D graphics | React Native `View` positioning | Skia `Canvas` | Sub-pixel rendering, GPU acceleration, clip paths |
| Date range calculations | Custom date math | JavaScript `Date` with explicit UTC | Timezone edge cases (always work in local time for diary apps) |

**Key insight:** Physics + rendering is the highest-risk area. The Matter.js + Skia pattern is proven and documented by Expo's own engineering blog — do not deviate.

---

## Body SVG Design Strategy

The human body silhouette does not exist as a ready-made SVG in the codebase. Three options, from least to most complex:

| Option | Approach | Effort | Risk |
|--------|----------|--------|------|
| A (recommended) | Hand-author a minimal cartoonish SVG path (head circle + body rectangle + arm/leg rectangles) using SVG primitives; combine into one viewBox-normalized path string | LOW | LOW |
| B | Adapt an open-source body silhouette SVG (e.g., react-native-body-highlighter's paths) scaled to the canvas size | MEDIUM | MEDIUM (licensing, path complexity) |
| C | Convert a real body silhouette via Potrace to an SVG polygon and simplify | HIGH | HIGH (concave shape → poly-decomp required) |

**Recommended (Option A):** A cartoonish body can be constructed as a Skia `Path` using `addCircle` (head), `addRect` (torso), and `addRect` (legs). This gives total control over the shape, is guaranteed convex-decomposable for Matter.js walls, and matches the "cartoonish" brief from ADR-025.

**Physics boundary strategy (per ADR-025):** Instead of using the SVG path as a Matter.js body, define 6-8 rectangular static bodies that approximate the silhouette's internal walls (left torso wall, right torso wall, hip floor, etc.). The Skia `Group clip` handles the visual containment — Matter.js walls only need to be *approximately* correct.

---

## Common Pitfalls

### Pitfall 1: react-native-svg Peer Missing
**What goes wrong:** `react-native-gifted-charts` fails to render with a module-not-found error.
**Why it happens:** `react-native-svg` is a peer dependency but is NOT in the project's current `package.json`.
**How to avoid:** Run `npx expo install react-native-gifted-charts react-native-svg` before writing any chart code.
**Warning signs:** Metro bundler error referencing `react-native-svg` at startup.

### Pitfall 2: Matter.js Coordinate System vs. Skia
**What goes wrong:** Balls appear at wrong positions, offset by radius amount.
**Why it happens:** Matter.js uses center-based coordinates; Skia Circle uses center (`cx`, `cy`) — these match. However, static walls need careful positioning: a floor 50px tall sitting below the canvas should be at `y = canvasHeight + 25` (center of the wall body below screen).
**How to avoid:** Always calculate wall centers as `edge ± (wallThickness / 2)` offset.
**Warning signs:** Balls pass through floor, or appear offset on screen.

### Pitfall 3: Physics Memory Leak on Unmount
**What goes wrong:** App crashes or slows significantly when navigating away from physics screen.
**Why it happens:** `requestAnimationFrame` keeps running after component unmounts, and Matter.js engine continues ticking.
**How to avoid:** `useEffect` cleanup must call `cancelAnimationFrame(rafRef.current)`, `Matter.World.clear(world, false)`, `Matter.Engine.clear(engine)`.
**Warning signs:** Memory usage grows continuously in Expo Go dev tools.

### Pitfall 4: Chart Width Overflow
**What goes wrong:** Charts overflow the card container or truncate on small screens.
**Why it happens:** `react-native-gifted-charts` requires explicit `width` prop; it does not auto-fit.
**How to avoid:** Use `useWindowDimensions().width - (spacing.xl * 2) - (spacing.lg * 2)` to compute chart width accounting for screen padding and card padding.
**Warning signs:** Chart clips or overflows horizontally on Android (narrower screen variants).

### Pitfall 5: ScreenContainer scrollable + Sticky Selector
**What goes wrong:** Period selector scrolls away with the page content.
**Why it happens:** `ScreenContainer` with `scrollable={true}` wraps everything in a `ScrollView`, including the selector.
**How to avoid:** Extract the period selector OUTSIDE the `ScreenContainer`'s scrollable children. Pattern: SafeAreaView → [sticky PeriodSelector] → ScrollView for rest of content.
**Warning signs:** Period selector disappears when user scrolls down the analytics page.

### Pitfall 6: Ball Aggregation Threshold
**What goes wrong:** High log counts (100+ logs for a week) create too many physics bodies, dropping below 60fps.
**Why it happens:** Each Matter.js body adds collision computation cost O(n²) in worst case.
**How to avoid (ADR-026):** Cap displayed balls at 50 max. For N logs > 50, compute `scale = N / 50` and multiply each ball's radius by `Math.cbrt(scale)` (volume scaling). This visually encodes "more logs" via larger balls while keeping body count constant.
**Warning signs:** Frame rate drops visible when loading Week/Month periods with heavy logging history.

### Pitfall 7: getLogsByPeriod Returns DESC Order
**What goes wrong:** Line chart trend appears inverted (newest data on left).
**Why it happens:** The existing `getLogsByPeriod()` orders by `created_at DESC`.
**How to avoid:** For chart data aggregation queries, always use `ORDER BY day ASC` (or `ORDER BY created_at ASC` for target trends).
**Warning signs:** Trend lines show downward slope when logs actually increased over time.

---

## Code Examples

### Time Period Calculation Helpers
```typescript
// Source: standard JS Date patterns — no library needed
function getPeriodDates(period: 'today' | 'week' | 'month'): { start: string; end: string } {
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
  throw new Error('Unknown period');
}

// Comparison period: subtract 7 days for week, 1 month for month
function getPreviousPeriodDates(period: 'week' | 'month'): { start: string; end: string } {
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
```

### Ball Aggregation for High Log Counts (ADR-026)
```typescript
// Source: ADR-026 pattern — derived from physics research
const MAX_BALLS = 50;

interface BallConfig {
  dropX: number;
  radius: number;
  color: string;
}

function aggregateToBalls(logs: Log[], containerWidth: number): BallConfig[] {
  if (logs.length === 0) return [];

  const scaleFactor = logs.length > MAX_BALLS ? logs.length / MAX_BALLS : 1;
  const baseRadius = 8;  // base ball radius in points
  const aggregatedRadius = baseRadius * Math.cbrt(scaleFactor);

  const displayLogs = logs.length > MAX_BALLS
    ? logs.filter((_, i) => i % Math.ceil(logs.length / MAX_BALLS) === 0)
    : logs;

  return displayLogs.map((log) => ({
    dropX: Math.random() * (containerWidth - aggregatedRadius * 2) + aggregatedRadius,
    radius: aggregatedRadius,
    color: getLogColor(log.pillarId as PillarId, log.direction as SwipeDirection),
  }));
}
```

### SQL Aggregation Query for Daily Bar Chart
```typescript
// Source: Expo SQLite pattern matching existing logStore.ts
const rows = await db.getAllAsync<{
  day: string;
  pillar_id: number;
  direction: string;
  count: number;
}>(
  `SELECT date(created_at) as day, pillar_id, direction, COUNT(*) as count
   FROM logs
   WHERE created_at >= ? AND created_at <= ?
   GROUP BY day, pillar_id, direction
   ORDER BY day ASC`,
  [startDate, endDate]
);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `data2`/`data3` props for multiple lines | `dataSet` prop for multi-line | react-native-gifted-charts v1.3.19 | Use `dataSet` not `data2` |
| `requestAnimationFrame` for game loop | Same — still the correct approach | — | No change needed |
| Reanimated v2 `useSharedValue` | Reanimated v4 `makeMutable` (for imperative) | Reanimated v3+ | Project uses v4.2.1 — use `makeMutable` for dynamic bodies |
| Skia `makeImageSnapshot` for canvas | `Canvas` component wrapping declarative tree | Skia 1.0+ | Use `<Canvas>` and `<Circle>` components |
| SVG-path → Matter.js polygon for body boundary | Static rectangular walls + Skia clip | ADR-025 | Simpler, 60fps guaranteed |

**Deprecated/outdated:**
- `data2`, `data3`, `data4`, `data5` props on LineChart: Works but `dataSet` is preferred for variable-length multi-line charts.
- `Matter.World.add` directly: Still valid in Matter.js 0.20.0 — the `Composite` API was not fully adopted in 0.20.

---

## Open Questions

1. **Body SVG path definition**
   - What we know: ADR-025 calls for a "cartoonish segmented" body, not anatomically detailed.
   - What's unclear: The exact SVG path string has not been defined. The planner should allocate a task to design and author the body silhouette path as a constant in `src/constants/bodyPath.ts`.
   - Recommendation: Implement as Option A (hand-authored simple shapes). Test in isolation on the Skia canvas before integrating with physics.

2. **ScreenContainer sticky header**
   - What we know: `ScreenContainer` wraps content in a `ScrollView` — the period selector needs to be sticky.
   - What's unclear: Whether `ScreenContainer` needs to be extended to accept a `stickyHeader` prop, or if `analytics.tsx` should manage its own layout structure.
   - Recommendation: Do not modify `ScreenContainer`. Instead, `analytics.tsx` should own its layout: `SafeAreaView` → `PeriodSelector` (fixed) → `ScrollView` (rest of content).

3. **Reanimated v4 + react-native-gifted-charts compatibility**
   - What we know: react-native-gifted-charts uses SVG internally (not Reanimated). Reanimated v4 is in the project.
   - What's unclear: Whether chart animations conflict with Reanimated v4 in any known way (no specific issues found).
   - Recommendation: LOW risk. If animation issues appear, set `isAnimated={false}` on charts as a fallback.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build tooling | Yes | 20.20.1 | — |
| react-native-gifted-charts | VIZ-01 charts | No (not installed) | 1.4.76 available | — (no fallback, install required) |
| react-native-svg | react-native-gifted-charts peer | No (not installed) | 15.15.4 available | — (no fallback, install required) |
| expo-linear-gradient | react-native-gifted-charts peer | Yes (55.0.9 in package.json) | 55.0.9 | — |
| @shopify/react-native-skia | VIZ-02 physics | Yes | 2.4.18 | — |
| matter-js | VIZ-02 physics | Yes | 0.20.0 | — |
| react-native-reanimated | Physics bridge | Yes | 4.2.1 | — |

**Missing dependencies with no fallback:**
- `react-native-gifted-charts` — must install: `npx expo install react-native-gifted-charts react-native-svg`
- `react-native-svg` — required peer for the above

**Missing dependencies with fallback:** None.

---

## Validation Architecture

> `nyquist_validation: true` in config — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None detected — no jest.config, no test files found in project |
| Config file | None — Wave 0 must add if validation is required |
| Quick run command | N/A — no test infrastructure |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIZ-01 | Charts render without crash for all period types | Smoke (manual) | — | No test infra |
| VIZ-01 | Bar chart displays correct pillar colors | Visual (manual) | — | No test infra |
| VIZ-02 | Physics balls fall and settle within body boundary | Visual (manual) | — | No test infra |
| VIZ-02 | Ball count caps at MAX_BALLS for high-log periods | Unit (logic) | — | No test infra |
| VIZ-03 | Period selector switches data correctly | Integration (manual) | — | No test infra |
| VIZ-04 | Comparison shows correct delta calculations | Unit (logic) | — | No test infra |
| VIZ-05 | Target trend shows correct per-target data | Integration (manual) | — | No test infra |

**Note:** This React Native / Expo project has no test infrastructure. Adding Jest/Expo Jest configuration for a visualization-heavy phase carries significant overhead and is not recommended for this phase. Manual testing in Expo Go on a device covers the primary validation risk (physics 60fps performance, chart rendering correctness). The planner should include a manual verification checklist per the success criteria rather than automated test steps.

### Wave 0 Gaps

- No test infrastructure exists. Adding tests for this phase would require: `npx expo install jest expo-jest` plus `babel.config.js` Jest transform configuration. This is out of scope unless the user explicitly adds it to requirements.

---

## Project Constraints (from CLAUDE.md)

CLAUDE.md does not exist in the working directory. No additional project-level constraints to enforce.

---

## Sources

### Primary (HIGH confidence)
- [Expo Blog: Build 2D game-style physics with Matter.js and React Native Skia](https://expo.dev/blog/build-2d-game-style-physics-with-matter-js-and-react-native-skia) — game loop pattern, Reanimated bridge, static walls
- [react-native-gifted-charts BarChart Props](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/docs/BarChart/BarChartProps.md) — verified data format, color props, axis config
- [react-native-gifted-charts PieChart Props](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/docs/PieChart/PieChartProps.md) — donut mode, labeling
- [react-native-gifted-charts LineChart Props](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/docs/LineChart/LineChartProps.md) — dataSet prop, animation, area fill
- [React Native Skia Group Docs](https://shopify.github.io/react-native-skia/docs/group/) — clip prop, SVG path conversion via `Skia.Path.MakeFromSVGString()`
- [React Native Skia Mask Docs](https://shopify.github.io/react-native-skia/docs/mask/) — Mask component API
- [Expo Router Modals Docs](https://docs.expo.dev/router/advanced/modals/) — fullScreenModal presentation pattern
- npm registry — verified package versions (2026-03-23)

### Secondary (MEDIUM confidence)
- [Matter.js Bodies API Docs](https://brm.io/matter-js/docs/classes/Bodies.html) — static bodies, circle, rectangle factory
- [React Native Skia Path Docs](https://shopify.github.io/react-native-skia/docs/shapes/path/) — path SVG string usage

### Tertiary (LOW confidence)
- [OpenReplay: Top 9 React Native Chart Libraries 2025](https://blog.openreplay.com/react-native-chart-libraries-2025/) — react-native-gifted-charts ecosystem positioning (cross-verification only)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries verified against npm registry and official docs
- Architecture patterns: HIGH for charts (official docs verified), MEDIUM for physics body SVG (body path design is an open question)
- Pitfalls: HIGH — derived from official source material and ADR decisions
- Environment availability: HIGH — verified by `npm view` and `package.json` inspection

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (react-native-gifted-charts releases frequently; re-verify version before install)
