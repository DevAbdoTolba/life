# Phase 08: Custom Date Range Picker - Research

**Researched:** 2026-03-24
**Domain:** React Native date picker UI, Expo native module installation, analytics screen state management
**Confidence:** HIGH

## Summary

Phase 08 adds a custom date range picker to the analytics screen, completing VIZ-03. The user picks start and end dates sequentially via a bottom-sheet modal when tapping the "Custom" period pill. The selected range drives `DateRange` state directly in `analytics.tsx`, bypassing the `getPeriodDates('custom')` fallback. The same range is passed via route params to `body-fill.tsx`.

The decision to use `react-native-date-picker` v5.0.13 is locked. This library requires a **native dev build** — it cannot run in Expo Go because it wraps native iOS/Android date pickers. The project has no `ios/` or `android/` directories yet, so the plan must account for `npx expo prebuild` before the date picker will work on device/simulator. The component design is straightforward: one new modal component (`CustomDateRangeModal`) following the `NoteEntryModal` / `TargetTrendModal` bottom-sheet pattern, plus small edits to `PeriodSelector`, `analytics.tsx`, `periodHelpers.ts`, and `body-fill.tsx`.

**Primary recommendation:** Install `react-native-date-picker`, run `expo prebuild`, then build the `CustomDateRangeModal` component following the established bottom-sheet modal pattern. Update `analytics.tsx` to hold `customRange` state and conditionally use it when `selectedPeriod === 'custom'`. Extend `body-fill.tsx` to accept optional `start`/`end` search params via `useLocalSearchParams`.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Use `react-native-date-picker` library — pure native, Expo-compatible, dark theme support
- Single calendar view with "Start" / "End" toggle — simpler UI, less screen space
- Bottom sheet modal presentation (consistent with NoteEntryModal pattern)
- Two sequential date inputs: pick start date, then pick end date
- Default range when "Custom" tapped: current month (matches existing `getPeriodDates` fallback)
- No max date range limit — user freedom, local-only data
- Date display format: "Mar 24, 2026" (MMM DD, YYYY) — readable, compact
- Subtitle below "Custom" pill showing selected range (e.g., "Mar 1 – Mar 24")
- Custom range stored in component state; `useEffect` uses custom range directly instead of calling `getPeriodDates` when period is 'custom'
- Custom range persists in component state across tab switches
- Pass custom DateRange to body-fill screen via route params (existing pattern)

### Claude's Discretion
- Exact modal dimensions and animation
- Calendar styling details within dark theme
- Edge cases (start after end date prevention)
- Transition animation when switching to/from custom

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIZ-03 | Custom time period selector (today, week, month, Ramadan, custom range) | `react-native-date-picker` provides native date picker; `PeriodType` already has 'custom'; `DateRange` type already defined; analytics `useEffect` needs conditional branch for custom period |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-date-picker | 5.0.13 | Native iOS/Android date picker with modal and dark theme support | Locked decision; pure native wraps platform pickers; `theme="dark"` prop built-in |
| expo-router `useLocalSearchParams` | (bundled with expo-router ~55.0.7) | Read route params in body-fill.tsx | Already used pattern in this project for tab navigation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native `Modal` | (bundled with RN 0.83.2) | Bottom-sheet wrapper container | Already used in NoteEntryModal and TargetTrendModal — outer shell of CustomDateRangeModal |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-native-date-picker (native) | @react-native-community/datetimepicker | Community picker is JS-only on Android, less consistent styling across platforms |
| react-native-date-picker (native) | custom JS calendar UI | Hand-rolling a calendar is significant work; native pickers are platform-idiomatic |

**Installation:**
```bash
npx expo install react-native-date-picker
npx expo prebuild
```

Note: `npx expo install` (not plain `npm install`) ensures Expo compatibility. After install, `expo prebuild` generates `ios/` and `android/` directories so native code links. Without prebuild, the app will crash on first render of `DatePicker`.

**Version verification:**
```bash
npm view react-native-date-picker version
# 5.0.13 (verified 2026-03-24)
```

## Architecture Patterns

### Recommended Project Structure
```
src/components/analytics/
├── PeriodSelector.tsx          # EDIT: add subtitle prop + onCustomPress callback
├── CustomDateRangeModal.tsx    # NEW: bottom-sheet with two DatePicker passes
├── BodyFillPreviewCard.tsx     # EDIT: pass customRange via router.push params
├── ... (existing components)
src/utils/
├── periodHelpers.ts            # EDIT: add formatDateShort() helper
app/(tabs)/
├── analytics.tsx               # EDIT: add customRange state + conditional useEffect
app/
├── body-fill.tsx               # EDIT: read start/end from useLocalSearchParams
```

### Pattern 1: Bottom-Sheet Modal (established project pattern)
**What:** RN `Modal` with `transparent`, `animationType="slide"`, overlay `TouchableOpacity`/`Pressable` for dismiss, card anchored at bottom.
**When to use:** Any picker/form that slides up from bottom — already used by NoteEntryModal and TargetTrendModal.
**Example:**
```typescript
// Source: /home/appuser/workspace/life/src/components/joystick/NoteEntryModal.tsx
<Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
  <View style={styles.overlay}>           // flex:1, justifyContent:'flex-end'
    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
    <View style={styles.sheet}>           // backgroundColor: colors.surface, borderTopRadius: 24
      {/* content */}
    </View>
  </View>
</Modal>
```

### Pattern 2: Sequential DatePicker state machine
**What:** A two-step modal: first pick start date, then pick end date. A single `step` state ('start' | 'end') drives which DatePicker is active and what the header label says.
**When to use:** Two-date range selection where single-calendar view is preferred.
**Example:**
```typescript
// CustomDateRangeModal internal state
const [step, setStep] = useState<'start' | 'end'>('start');
const [tempStart, setTempStart] = useState<Date>(defaultStart);
const [tempEnd, setTempEnd] = useState<Date>(defaultEnd);

// DatePicker usage (react-native-date-picker)
<DatePicker
  date={step === 'start' ? tempStart : tempEnd}
  onDateChange={(d) => step === 'start' ? setTempStart(d) : setTempEnd(d)}
  mode="date"
  theme="dark"
/>
// "Next" button advances step from 'start' to 'end'
// "Confirm" button on 'end' step calls onConfirm({start, end})
```

### Pattern 3: Conditional useEffect branch for custom period
**What:** The existing `useEffect([selectedPeriod])` in analytics.tsx calls `getPeriodDates(selectedPeriod)` unconditionally. For 'custom', it must use `customRange` state instead.
**When to use:** When period-dependent data fetching needs to branch on period type.
**Example:**
```typescript
// analytics.tsx — updated useEffect
const [customRange, setCustomRange] = useState<DateRange>(getPeriodDates('custom'));

useEffect(() => {
  const range = selectedPeriod === 'custom' ? customRange : getPeriodDates(selectedPeriod);
  setDateRange(range);
  // ... fetch data
}, [selectedPeriod, customRange]);
```

### Pattern 4: Route params for body-fill (expo-router pattern)
**What:** Pass start/end ISO strings as search params when navigating to `/body-fill`. Read them with `useLocalSearchParams`.
**When to use:** Passing data from analytics screen to body-fill modal screen.
**Example:**
```typescript
// BodyFillPreviewCard.tsx — updated push
router.push({ pathname: '/body-fill', params: { start: dateRange.start, end: dateRange.end } });

// body-fill.tsx — read params
import { useLocalSearchParams } from 'expo-router';
const { start, end } = useLocalSearchParams<{ start?: string; end?: string }>();
const range = start && end ? { start, end } : getPeriodDates('week');
```

### Pattern 5: PeriodSelector subtitle display
**What:** Below the "Custom" pill, show a compact date range label (e.g., "Mar 1 – Mar 24") when a custom range is active and 'custom' is selected.
**When to use:** Feedback to user that their custom range is set.
**Example:**
```typescript
interface PeriodSelectorProps {
  selected: PeriodType;
  onSelect: (period: PeriodType) => void;
  customLabel?: string;        // e.g. "Mar 1 – Mar 24"
  onCustomPress?: () => void;  // opens picker modal when custom already selected
}
// Render subtitle below the pill row when selected === 'custom' && customLabel
```

### Anti-Patterns to Avoid
- **Calling getPeriodDates('custom') for live data fetches:** The fallback returns current month but does not update when user picks a range — the custom range must come from state, not this function.
- **Opening the date picker modal inside PeriodSelector:** PeriodSelector should notify the parent via callback; the parent (analytics.tsx) owns modal visibility state, matching existing patterns.
- **Forgetting to re-open picker when user taps 'Custom' while already selected:** The `onSelect` callback won't fire again (same value). Need `onCustomPress` or detecting re-tap to re-open the modal.
- **Passing Date objects through route params:** Expo Router serializes params as strings. Pass ISO strings, parse with `new Date(isoString)` at the destination.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Native date picker UI | Custom JS calendar grid | react-native-date-picker | Month/day scroll wheels, accessibility, locale, dark theme all handled natively |
| Dark theme calendar | Custom styled calendar component | `theme="dark"` prop on DatePicker | Attempts to style a JS calendar to match iOS/Android native look always look off |

**Key insight:** Scrolling date pickers on mobile are deeply platform-idiomatic. Native pickers handle touch acceleration, accessibility roles, and locale (week start day, month names) automatically. A hand-rolled JS grid is weeks of work for an inferior result.

## Common Pitfalls

### Pitfall 1: react-native-date-picker requires native build (not Expo Go)
**What goes wrong:** App crashes with "Native module cannot be null" or "NativeModules.RNDatePicker is null" on first render.
**Why it happens:** The project has no `ios/` or `android/` directories — it's a managed Expo workflow. `react-native-date-picker` contains native code that must be linked via `expo prebuild` + a dev build (or EAS Build).
**How to avoid:** Run `npx expo prebuild` after installing the package to generate native directories. Then build with `npx expo run:android` or `npx expo run:ios` (or EAS Build). Do NOT test in Expo Go.
**Warning signs:** No `ios/` or `android/` directories in project root (confirmed absent in this project).

### Pitfall 2: Date picker opens modal-within-modal
**What goes wrong:** `DatePicker` with `modal` prop opens its own native modal dialog on top of the custom bottom-sheet modal. Double-modal layering causes visual and interaction conflicts.
**Why it happens:** `react-native-date-picker` has a `modal` prop that adds its own native overlay. Using it inside an RN `Modal` duplicates the presentation layer.
**How to avoid:** Use the **inline** mode (`onDateChange` + no `modal` prop) inside the custom bottom-sheet. Let the custom `Modal` handle presentation.
**Warning signs:** `open` prop present on `DatePicker` when it's already inside an RN `Modal`.

### Pitfall 3: Start date after end date
**What goes wrong:** User picks March 25 as start, then March 10 as end — the query returns zero results, confusingly.
**Why it happens:** Sequential selection allows end < start.
**How to avoid:** When step advances to 'end', set `minimumDate={tempStart}` on the DatePicker. This is in Claude's discretion — implement as a quality-of-life edge case.
**Warning signs:** `dateRange.end < dateRange.start` in the analytics query.

### Pitfall 4: useEffect not re-firing when customRange changes for non-custom period
**What goes wrong:** `customRange` state changes trigger a re-fetch even when selectedPeriod is 'week' or 'month'.
**Why it happens:** If `customRange` is in the `useEffect` dependency array, any change to it (e.g., when modal closes) fires a redundant fetch for the current non-custom period.
**How to avoid:** The `useEffect` dependency on `customRange` is correct — but only the `selectedPeriod === 'custom'` branch uses it. Non-custom branches call `getPeriodDates(selectedPeriod)` which is pure and idempotent, so the extra fetch is harmless but worth documenting.

### Pitfall 5: transformIgnorePatterns in jest.config.js
**What goes wrong:** Jest fails with "Cannot use import statement" or "SyntaxError" when importing from react-native-date-picker in tests.
**Why it happens:** The library ships ESM/TS source in `node_modules`. Jest's default ignores `node_modules` from transformation. The `transformIgnorePatterns` in `jest.config.js` must include `react-native-date-picker`.
**How to avoid:** Add `react-native-date-picker` to the `transformIgnorePatterns` allowlist in `jest.config.js` native preset:
```
'node_modules/(?!((jest-)?react-native|react-native-date-picker|@react-native(-community)?)|expo...)'
```
**Warning signs:** Tests importing `CustomDateRangeModal` fail with syntax errors, but the component builds fine.

## Code Examples

Verified patterns from existing project source:

### Bottom-sheet modal shell (from TargetTrendModal)
```typescript
// Source: /home/appuser/workspace/life/src/components/analytics/TargetTrendModal.tsx
<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
  <View style={styles.overlay}>      // rgba(0,0,0,0.7), justifyContent:'flex-end'
    <View style={styles.sheet}>      // colors.surface, borderTopRadius: borderRadius.xl
      <View style={styles.header}>
        <Text style={styles.targetTitle}>{title}</Text>
        <Pressable onPress={onClose} style={styles.closeButton} hitSlop={8}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>
      {/* content */}
    </View>
  </View>
</Modal>
```

### DatePicker inline usage (react-native-date-picker v5, verified from npm)
```typescript
import DatePicker from 'react-native-date-picker';

<DatePicker
  date={selectedDate}
  onDateChange={setSelectedDate}
  mode="date"
  theme="dark"
  minimumDate={step === 'end' ? tempStart : undefined}
/>
```

### formatDateShort helper to add to periodHelpers.ts
```typescript
/** Format a Date or ISO string as "Mar 24, 2026" */
export function formatDateShort(dateOrIso: Date | string): string {
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Format a DateRange as "Mar 1 – Mar 24" for PeriodSelector subtitle */
export function formatDateRangeLabel(range: DateRange): string {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const fmtShort = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${fmtShort(start)} – ${fmtShort(end)}`;
}
```

### analytics.tsx useEffect updated pattern
```typescript
const [customRange, setCustomRange] = useState<DateRange>(getPeriodDates('custom'));
const [showDatePicker, setShowDatePicker] = useState(false);

// When period changes to 'custom', open picker immediately
const handlePeriodSelect = (period: PeriodType) => {
  setSelectedPeriod(period);
  if (period === 'custom') setShowDatePicker(true);
};

// Re-open picker when custom is tapped while already selected
const handleCustomPress = () => setShowDatePicker(true);

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
```

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js / npm | Package install | Yes | (from npm commands) | — |
| react-native-date-picker | CustomDateRangeModal | Not installed | — | None — must install |
| `ios/` or `android/` dirs | Native build | Not present | — | Run `expo prebuild` to generate |
| Expo Go | Dev testing | Present (assumed) | — | Will NOT work with native picker — needs dev build |

**Missing dependencies with no fallback:**
- `react-native-date-picker` is not installed. Must run `npx expo install react-native-date-picker` then `npx expo prebuild`.
- Native build environment (ios/ android/ dirs) absent — planner must include prebuild step.

**Missing dependencies with fallback:**
- None. The library choice is locked; no JS-only fallback is acceptable per the decisions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29 (jest-expo for components, ts-jest for utils) |
| Config file | `/home/appuser/workspace/life/jest.config.js` (projects array), `/home/appuser/workspace/life/jest.unit.config.js` |
| Quick run command | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIZ-03 | `formatDateShort` returns "Mar 24, 2026" | unit | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers -x` | ❌ Wave 0 |
| VIZ-03 | `formatDateRangeLabel` returns "Mar 1 – Mar 24" | unit | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers -x` | ❌ Wave 0 |
| VIZ-03 | `getPeriodDates('custom')` returns current-month fallback | unit | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers -x` | ❌ Wave 0 |
| VIZ-03 | `CustomDateRangeModal` renders with correct initial dates | component (manual) | Expo dev build visual inspection | n/a — native picker |

Note: `CustomDateRangeModal` renders a native DatePicker which cannot be unit-tested with jest-expo (native module). Component correctness is verified by running the dev build and exercising the flow manually.

### Sampling Rate
- **Per task commit:** `npx jest --config jest.unit.config.js --testPathPattern periodHelpers -x`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/utils/periodHelpers.test.ts` — covers `formatDateShort`, `formatDateRangeLabel`, and `getPeriodDates` custom fallback (VIZ-03)

## Open Questions

1. **Expo Go vs. dev build — which build is used for testing?**
   - What we know: No `ios/` or `android/` directory exists; the project uses managed Expo workflow.
   - What's unclear: Whether the developer has an EAS account or local Xcode/Android SDK for `npx expo run:ios/android`.
   - Recommendation: Plan should include `npx expo prebuild` + build step, but note that if only Expo Go is available the plan will fail at first render. The phase executor must confirm build environment before execution.

2. **`react-native-gifted-charts` vs. `react-native-date-picker` in transformIgnorePatterns**
   - What we know: Current `jest.config.js` does not include `react-native-date-picker` in the transform allowlist; the native preset targets `react-native` as prefix.
   - What's unclear: Whether jest tests for `CustomDateRangeModal` will be written at all (component tests with a native picker are usually skipped or fully mocked).
   - Recommendation: If component tests are written for the modal, add `react-native-date-picker` to transformIgnorePatterns and mock the `DatePicker` component. Most practical approach: skip component-level jest tests for the modal; test only the utility helpers.

## Sources

### Primary (HIGH confidence)
- Source code read directly: `app/(tabs)/analytics.tsx`, `src/components/analytics/PeriodSelector.tsx`, `src/utils/periodHelpers.ts`, `src/types/analytics.ts`, `src/components/joystick/NoteEntryModal.tsx`, `src/components/analytics/TargetTrendModal.tsx`, `app/body-fill.tsx`, `package.json`, `jest.config.js`, `jest.unit.config.js`
- npm registry: `npm view react-native-date-picker@5.0.13` — confirmed version, peer deps (react >= 17, react-native >= 0.64.3), description

### Secondary (MEDIUM confidence)
- github.com/henninghall/react-native-date-picker README (WebFetch 2026-03-24) — confirmed `mode="date"`, `theme="dark"`, inline vs modal usage, Expo requires dev build not Expo Go

### Tertiary (LOW confidence)
- None — all claims verified with source code or official package/docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — package version confirmed from npm registry, existing code read directly
- Architecture: HIGH — all patterns extracted from existing project source files
- Pitfalls: HIGH — Pitfall 1 (native build requirement) confirmed from README and absent ios/ android/ dirs; Pitfalls 2-5 from direct code analysis
- Environment availability: HIGH — confirmed by `ls` commands on project root

**Research date:** 2026-03-24
**Valid until:** 2026-06-24 (stable ecosystem; react-native-date-picker major releases are infrequent)
