# Phase 11: Hold Interaction Visuals - Research

**Researched:** 2026-03-24
**Domain:** React Native Reanimated animated styles, expo-haptics, React Native absolute positioning
**Confidence:** HIGH

## Summary

Phase 11 is a contained visual-polish pass on the existing `Joystick.tsx` component. The three deliverables are: (1) static hairline separator lines dividing the joystick base into four quadrants; (2) per-quadrant color fill that activates when a hold-start is detected; and (3) a `Heavy` haptic impulse that fires at the moment hold-start is detected. All three deliverables are additions to a single file — no new libraries, no new stores, no schema changes.

The shared-value topology already provides everything needed. `activeDirection` (0–4), `isHolding` (0/1), and `directionValence` (0=positive, 1=negative) are live in `Joystick.tsx` and already drive indicator dots and the flash overlay. The section-fill pattern is a direct extension of `flashAnimatedStyle` — four `useAnimatedStyle` calls, each gated on `activeDirection.value === N && isHolding.value === 1`, using `interpolateColor` against `directionValence`. The separator lines are plain static `View` elements — no SharedValue needed.

The haptic call (`Haptics.impactAsync(ImpactFeedbackStyle.Heavy)`) runs on the JS thread via the existing `runOnJS(handleHoldStart)` call path — no worklet-boundary concern. `expo-haptics` version `~55.0.9` is already in the dependency list.

**Primary recommendation:** Extend `Joystick.tsx` in-place. Add two static `View` separator lines, four `useAnimatedStyle`-driven quadrant fill overlays, and one `Haptics.impactAsync(Heavy)` call in `handleHoldStart`. Zero new files, zero new dependencies.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Four separator lines divide the joystick base into quadrants (cross pattern — vertical + horizontal through center).
**D-02:** Lines are subtle hairlines: 0.5–1px width, in `colors.border` (#2A2A3A), at ~30% opacity.
**D-03:** Lines are visible at rest. They hint at the 4 directional zones without being visually heavy.
**D-04:** When a hold begins, the active quadrant fills with the direction's valence color: up/right quadrants use pillar `positiveColor`, down/left use pillar `negativeColor`.
**D-05:** Fill opacity is subtle (~20%) so it tints the quadrant without obscuring separator lines or the knob.
**D-06:** The app background also shifts to match — covered by Phase 13's hue shift (VIS-05), but section fill is Phase 11's scope.
**D-07:** `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` fires at the instant hold-start is detected — before any target menu appears.
**D-08:** This is distinct from the Medium impact used on regular swipes and the Success notification on target selection. Three-tier haptic hierarchy: Medium (swipe) < Heavy (hold-start) < Success pattern (target select).

### Claude's Discretion
- Exact rendering approach for quadrant lines (Skia paths vs RN Views vs SVG)
- Section fill animation timing (instant vs quick fade-in)
- Whether separator lines should subtly brighten on hold in addition to quadrant fill

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| VIS-01 | Joystick base has 4 section separator lines dividing the quadrants | Static `View` hairlines inside `outerRing`; `StyleSheet.hairlineWidth` for sub-pixel accuracy; z-order below fill overlays |
| VIS-02 | Held section changes background color (section fill + app background — joystick fill only in this phase) | Four `useAnimatedStyle` overlays driven by `activeDirection` + `isHolding` SharedValues; `interpolateColor` via `directionValence`; `withTiming` fade-in/out |
| VIS-04 | Haptic vibration fires on every hold-start event | `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` in `handleHoldStart` JS callback, already on runOnJS path; `expo-haptics ~55.0.9` installed |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-reanimated | 4.2.1 (installed) | `useAnimatedStyle`, `useSharedValue`, `withTiming`, `interpolateColor` | Already used everywhere in Joystick.tsx; worklet-safe animation API |
| expo-haptics | ~55.0.9 (installed) | `impactAsync(Heavy)` | Already imported in `useSwipeLog.ts`; only haptics library in the project |
| react-native | 0.83.2 (installed) | `View`, `StyleSheet.hairlineWidth`, `StyleSheet.absoluteFillObject` | Separator lines and fill overlays are plain RN Views |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-native-gesture-handler | ~2.30.0 (installed) | `Gesture.LongPress().onStart` — the hold-start trigger | Already composed; no changes to gesture setup, only the callback body |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| RN `View` for separator lines | Skia `<Line>` or `<SVG>` | Skia adds a canvas layer and import; plain Views render inside the same layout tree with zero overhead — preferred for two static lines |
| Four full-screen `absoluteFillObject` overlays | Clipped half-Views (overflow:hidden rectangles) | True quadrant clipping is complex; full-ring overlays at 20% opacity achieve the same visual since colors are already subtle — matches existing `flashOverlay` pattern |
| `runOnJS` in LongPress.onStart for haptic | Direct `Haptics` call in worklet | Haptics API is not worklet-safe; must call from JS thread via `runOnJS` or in the JS-thread callback |

**Installation:** No new packages needed. All dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure

No new files needed. All changes land in `src/components/joystick/Joystick.tsx`.

```
src/
└── components/
    └── joystick/
        ├── Joystick.tsx       ← ALL changes: separator lines, fill overlays, haptic
        ├── constants.ts       ← No changes needed
        └── useSwipeLog.ts     ← No changes needed (haptic goes in Joystick.tsx, not here)
```

### Pattern 1: Static Separator Lines

**What:** Two plain `View` elements with hairline width/height, positioned absolutely at center of the outerRing circle.
**When to use:** Any non-animated dividing element inside a fixed-size circular container.
**Z-order:** First children in `outerRing` — behind fill overlays (z:2), flashOverlay (z:5), and knob (z:10).

```typescript
// Source: src/components/joystick/Joystick.tsx — existing outerRing layout pattern
// Vertical line
<View style={styles.separatorVertical} />
// Horizontal line
<View style={styles.separatorHorizontal} />

// In StyleSheet:
separatorVertical: {
  position: 'absolute',
  width: StyleSheet.hairlineWidth,
  height: JOYSTICK_SIZE,
  left: JOYSTICK_SIZE / 2,   // 50px — exact center
  top: 0,
  backgroundColor: colors.border,
  opacity: 0.3,
  zIndex: 1,
},
separatorHorizontal: {
  position: 'absolute',
  height: StyleSheet.hairlineWidth,
  width: JOYSTICK_SIZE,
  top: JOYSTICK_SIZE / 2,    // 50px — exact center
  left: 0,
  backgroundColor: colors.border,
  opacity: 0.3,
  zIndex: 1,
},
```

**`StyleSheet.hairlineWidth`** resolves to `1 / PixelRatio.get()` — sub-pixel precision on high-density screens. Confirmed in React Native docs.

### Pattern 2: Quadrant Fill Overlays

**What:** Four `Animated.View` instances, each using `StyleSheet.absoluteFillObject` (covers full outerRing circle), with opacity animated between 0 and 0.2. Only the active quadrant's opacity is non-zero during a hold.
**When to use:** Per-region color feedback where true geometric clipping is avoided for simplicity. Acceptable because opacity is very low (20%) and colors naturally blend.

```typescript
// Source: extends flashAnimatedStyle pattern already in Joystick.tsx

// SharedValues already available:
// activeDirection: 0=none, 1=up, 2=down, 3=left, 4=right
// isHolding: 0 | 1
// directionValence: 0=positive, 1=negative

const upFillStyle = useAnimatedStyle(() => {
  const active = activeDirection.value === 1 && isHolding.value === 1;
  const color = interpolateColor(
    directionValence.value,
    [0, 1],
    [pillar.positiveColor, pillar.negativeColor]
  );
  return {
    backgroundColor: color,
    opacity: withTiming(active ? 0.2 : 0, {
      duration: active ? 100 : 150,
      easing: Easing.out(Easing.ease),
    }),
  };
});

// Repeat for down (activeDirection.value === 2), left (3), right (4)

// In JSX (inside outerRing, between separators and flashOverlay):
<Animated.View style={[styles.quadrantFill, upFillStyle]} />
<Animated.View style={[styles.quadrantFill, downFillStyle]} />
<Animated.View style={[styles.quadrantFill, leftFillStyle]} />
<Animated.View style={[styles.quadrantFill, rightFillStyle]} />

// StyleSheet:
quadrantFill: {
  ...StyleSheet.absoluteFillObject,
  borderRadius: JOYSTICK_SIZE / 2,
  zIndex: 2,
},
```

**Note on `interpolateColor` and `directionValence`:** The valence SharedValue is already set in `onUpdate` before `isHolding` is set in `onStart`. By the time `isHolding.value` becomes 1, `directionValence.value` already reflects the correct quadrant color. No ordering issue.

### Pattern 3: Heavy Haptic on Hold-Start

**What:** `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` called at the top of the JS-thread `handleHoldStart` callback.
**When to use:** Distinct tactile event for the hold-start moment, before any UI state changes.

```typescript
// Source: src/components/ui/Button.tsx (Light impact), src/components/joystick/useSwipeLog.ts (Medium + Success)
// expo-haptics ~55.0.9, expo SDK 55

// In handleHoldStart (already a JS-thread useCallback):
const handleHoldStart = useCallback(
  (direction: SwipeDirection) => {
    // Haptic fires first — instant tactile confirmation before menu appears
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setRadialDirection(direction);
    setRadialVisible(true);
    onHoldStart?.(direction);
  },
  [onHoldStart]
);
```

The import is already present in `useSwipeLog.ts` but NOT yet in `Joystick.tsx`. The `Haptics` import must be added to `Joystick.tsx`.

### Anti-Patterns to Avoid

- **Calling Haptics inside a worklet:** `expo-haptics` is not a worklet-compatible API. Do not call `Haptics.impactAsync()` directly inside `LongPress.onStart` without `runOnJS`. In the current code, `runOnJS(handleHoldStart)(dir)` is already used — keep the haptic call inside `handleHoldStart` on the JS side, not in the worklet body.
- **Growing useAnimatedStyle count beyond safe limits:** Adding 4 quadrant fill styles brings the total to 12 `useAnimatedStyle` calls. The HOOK-01 fix from Phase 9 enables this safely. Do not use factory wrappers or loops — inline all four calls at the top level of the component function.
- **Using factory functions to create animated styles:** Phase 9's HOOK-01 fix explicitly removed `createIndicatorStyle` factory wrapper. All animated styles must be inlined at component top level. Four explicit calls (`upFillStyle`, `downFillStyle`, `leftFillStyle`, `rightFillStyle`) is the correct pattern.
- **Placing separator lines above fill overlays in z-order:** Separators must render below fill overlays (z:1 vs z:2) so the fill tint is visible without obscuring the line cues. If separator z-order is higher than fill, the 20% opacity fill will still show but will visually layer above the lines.
- **Skia paths for separator lines:** Overkill for two static lines. Skia requires a `<Canvas>` wrapper and adds a separate render layer. Plain `View` elements within the existing `Animated.View` outerRing are sufficient and simpler.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sub-pixel line rendering | Custom 1px border View | `StyleSheet.hairlineWidth` | Automatically resolves to device pixel ratio — always truly thin |
| Color interpolation between positive/negative | Manual lerp function | `interpolateColor` from react-native-reanimated | Already used in `flashAnimatedStyle`; handles color spaces correctly on both iOS and Android |
| Haptic timing coordination | `setTimeout` delay or Promise chaining | Direct call in JS callback (no delay needed) | Haptics API is fire-and-forget; no await needed — call first in `handleHoldStart`, UI state follows |

**Key insight:** All the difficult work (gesture detection, SharedValue wiring, color interpolation setup) is already done. This phase is configuration of existing infrastructure, not new capability.

---

## Common Pitfalls

### Pitfall 1: Haptic Import Missing in Joystick.tsx

**What goes wrong:** `Haptics.impactAsync` is called in `handleHoldStart` but `expo-haptics` is not imported at the top of `Joystick.tsx`. TypeScript error at compile time.
**Why it happens:** Haptics is currently only imported in `useSwipeLog.ts`. `Joystick.tsx` does not currently import it.
**How to avoid:** Add `import * as Haptics from 'expo-haptics';` to `Joystick.tsx` imports.
**Warning signs:** TS error `Cannot find name 'Haptics'` during compilation.

### Pitfall 2: Animated Style Count and Rules of Hooks

**What goes wrong:** Four new `useAnimatedStyle` calls for quadrant fills must be inlined at top level. If placed in a loop, an array, or a helper function, the Rules of Hooks violation that Phase 9 fixed will re-appear.
**Why it happens:** React hooks must be called unconditionally at the top level — not inside loops, conditionals, or nested functions.
**How to avoid:** Write four explicit const declarations (`upFillStyle`, `downFillStyle`, `leftFillStyle`, `rightFillStyle`) at the top of the component, adjacent to the existing indicator styles.
**Warning signs:** Runtime warning "Invalid hook call" or linter error from `eslint-plugin-react-hooks`.

### Pitfall 3: directionValence Not Set for Center-Hold Case

**What goes wrong:** If Phase 10 adds a center-hold path where `isHolding` is set to 1 but `activeDirection` remains 0, none of the four fill overlays will activate (correct behavior). However, if Phase 10's center detection inadvertently sets `activeDirection` to a non-zero value for a center hold, a fill overlay could activate incorrectly.
**Why it happens:** Phase 10 modifies `LongPress.onStart` to branch on center vs. directional hold. If center-hold path sets `isHolding.value = 1` without explicitly setting `activeDirection.value = 0`, the previous drag direction bleeds through.
**How to avoid:** Verify in `LongPress.onStart` (after Phase 10 is implemented) that center-hold path sets `activeDirection.value = 0` before `isHolding.value = 1`. Phase 11 fill logic must guard on `activeDirection.value !== 0`.
**Warning signs:** Quadrant fill activates during a center-hold press.

### Pitfall 4: Separator Lines Outside Clip Boundary

**What goes wrong:** The `outerRing` style sets `overflow: 'visible'` (line 396 of Joystick.tsx). Static separator lines positioned at `JOYSTICK_SIZE / 2` center on a 100px circle — they are contained within the ring. However if the developer positions them using `left: 0` without accounting for the `borderRadius`, lines appear to extend beyond the visual circle boundary.
**Why it happens:** `overflow: 'visible'` means children render outside the rounded boundary. The circle clip is only visual (border-radius), not a layout clip.
**How to avoid:** Separator lines positioned correctly (100px width/height, centered at 50px) naturally stay within the ring's visual area since their endpoints land at the ring edge. No clipping needed. Do NOT change `overflow` on outerRing — that would break the indicator dots and RadialMenu positioning.
**Warning signs:** Lines appear to bleed outside the circular joystick ring when viewed on device.

### Pitfall 5: withTiming Inside useAnimatedStyle Causing Unnecessary Rerenders

**What goes wrong:** Calling `withTiming` inside `useAnimatedStyle` on every frame can cause animation artifacts or performance issues if the input values change rapidly.
**Why it happens:** `useAnimatedStyle` re-evaluates whenever its dependencies change. `withTiming` must be called only when the target value changes, not on every render.
**How to avoid:** This is safe in Reanimated v3 — `withTiming` inside `useAnimatedStyle` is the documented pattern and creates an animation only when the value it wraps changes. The worklet re-runs on SharedValue changes, not on JS renders. Verified in Reanimated v3 docs.
**Warning signs:** None — this is actually the correct pattern for Reanimated v3.

---

## Code Examples

Verified patterns from existing project code:

### Full Quadrant Fill Pattern (extending flashAnimatedStyle)

```typescript
// Source: Joystick.tsx flashAnimatedStyle (line 280) — direct extension of this pattern
const flashAnimatedStyle = useAnimatedStyle(() => {
  const bgColor = interpolateColor(
    directionValence.value,
    [0, 1],
    [pillar.positiveColor, pillar.negativeColor]
  );
  return {
    backgroundColor: bgColor,
    opacity: flashOpacity.value * 0.4,
  };
});

// Phase 11 extension — four versions, gated on activeDirection + isHolding:
const upFillStyle = useAnimatedStyle(() => {
  const active = activeDirection.value === 1 && isHolding.value === 1;
  const color = interpolateColor(
    directionValence.value,
    [0, 1],
    [pillar.positiveColor, pillar.negativeColor]
  );
  return {
    backgroundColor: color,
    opacity: withTiming(active ? 0.2 : 0, {
      duration: active ? 100 : 150,
      easing: Easing.out(Easing.ease),
    }),
  };
});
```

### Haptic Integration (extending existing useSwipeLog pattern)

```typescript
// Source: src/components/joystick/useSwipeLog.ts — existing haptic calls
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);  // target select
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);              // quick swipe
// Source: src/components/ui/Button.tsx
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);               // button press

// Phase 11 addition — Heavy for hold-start (in Joystick.tsx handleHoldStart):
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);               // hold-start
```

### StyleSheet.hairlineWidth Usage

```typescript
// React Native built-in — resolves to 1 / PixelRatio.get()
// e.g., on a 3x device: 0.333...px
separatorVertical: {
  position: 'absolute',
  width: StyleSheet.hairlineWidth,
  height: JOYSTICK_SIZE,           // 100
  left: JOYSTICK_SIZE / 2,         // 50 — exact center
  top: 0,
  backgroundColor: colors.border,  // '#2A2A3A'
  opacity: 0.3,
  zIndex: 1,
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Factory-wrapped `useAnimatedStyle` calls | Inlined calls at component top level | Phase 9 (HOOK-01 fix) | Phase 11 can safely add 4 more calls — no factory pattern allowed |
| No hold-specific haptic | Three-tier haptic hierarchy (Light/Medium/Heavy/Success) | Phase 11 (this phase) | Hold-start gets distinct tactile identity |

**Deprecated/outdated:**
- `createIndicatorStyle` factory wrapper: Removed in Phase 9 — do not reintroduce. All animated styles must be inlined.

---

## Open Questions

1. **Phase 10 center-hold interaction with Phase 11 fill**
   - What we know: Phase 10 will branch `LongPress.onStart` into center-hold vs. directional-hold paths. Center-hold should NOT activate any quadrant fill.
   - What's unclear: How Phase 10 sets `activeDirection.value` in the center-hold branch — if it sets it to 0, Phase 11's guard (`activeDirection.value !== 0`) works correctly. If it leaves it at the last drag value, fill could activate incorrectly.
   - Recommendation: Phase 11 implementation must verify Phase 10's center-hold path. If `activeDirection.value` is not explicitly reset to 0 on center-hold, add `activeDirection.value = 0` in the center-hold branch of `LongPress.onStart`. This is a single-line fix if needed.

2. **Hold release cleanup — isHolding reset path**
   - What we know: `isHolding.value = 0` is set in `panGesture.onEnd` when a hold-direction swipe completes. But if the user releases without swiping (lifts thumb without exceeding `SWIPE_THRESHOLD`), `onEnd` fires but `dir` is null — `isHolding.value` is never reset to 0 in the current code.
   - What's unclear: This may be a pre-existing gap addressed in Phase 10 or left as-is.
   - Recommendation: Phase 11 implementation should confirm that `isHolding.value` is reset to 0 in all hold-end paths (including the "cancel / no swipe" path). If not, add `isHolding.value = 0` at the end of `panGesture.onEnd` unconditionally. The fill fade-out depends on `isHolding` returning to 0.

---

## Environment Availability

Step 2.6: All dependencies are already installed in the project. No external tools beyond the React Native build toolchain are needed for this phase.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| expo-haptics | VIS-04 haptic pulse | Yes | ~55.0.9 | — |
| react-native-reanimated | VIS-02 animated fill | Yes | 4.2.1 | — |
| react-native (View, StyleSheet) | VIS-01 separator lines | Yes | 0.83.2 | — |

No missing dependencies. No install steps required.

---

## Validation Architecture

`nyquist_validation: true` — validation section required.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 + jest-expo preset |
| Config file | `/home/appuser/workspace/life/jest.config.js` |
| Quick run command | `npx jest src/components/joystick/ --passWithNoTests` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| VIS-01 | Separator lines render inside joystick | Visual / manual-only | Manual: run on device/simulator and visually inspect | N/A |
| VIS-02 | Quadrant fill activates on hold-start, fades on release | Visual / manual-only | Manual: hold gesture in simulator, observe color fill | N/A |
| VIS-04 | Heavy haptic fires on hold-start | Manual-only (haptics require native device) | Manual: test on physical device — simulator does not vibrate | N/A |

**Assessment:** All three requirements in Phase 11 are visual or tactile — they cannot be meaningfully covered by automated unit tests in a Jest/jsdom environment. Reanimated animated styles don't execute in a test environment (worklets are no-ops in Jest). Haptics are a native API with no testable output in unit tests.

The correct verification strategy is:
1. TypeScript compilation: `npx tsc --noEmit` — confirms correct types and no missing imports
2. Visual inspection on iOS Simulator (VIS-01, VIS-02) — separator lines visible, fill activates
3. Physical device test (VIS-04) — Heavy haptic perceptibly stronger than Medium swipe haptic

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit` (compile check, ~5s)
- **Per wave merge:** `npx jest src/components/` (smoke test component suite)
- **Phase gate:** Manual device smoke test + `npx jest` full suite green before `/gsd:verify-work`

### Wave 0 Gaps

None — existing test infrastructure covers the automated portion. No new test files are needed for this phase's requirements (all are visual/tactile, not unit-testable). The existing `src/components/joystick/NoteEntryModal.test.tsx` pattern is available as reference if the implementor wants to add smoke tests for render output.

---

## Sources

### Primary (HIGH confidence)
- `src/components/joystick/Joystick.tsx` — Full existing SharedValue topology, animated styles, gesture composition, flashOverlay pattern, outerRing dimensions
- `src/components/joystick/constants.ts` — JOYSTICK_SIZE=100, KNOB_SIZE=56, INDICATOR_SIZE=6
- `src/constants/colors.ts` — colors.border=#2A2A3A, pillar positiveColor/negativeColor values
- `src/components/joystick/useSwipeLog.ts` — Existing haptic call patterns (Medium, Success)
- `src/components/ui/Button.tsx` — Existing haptic call pattern (Light)
- `package.json` — Confirmed expo-haptics ~55.0.9, react-native-reanimated 4.2.1 installed
- `.planning/phases/11-hold-interaction-visuals/11-UI-SPEC.md` — Approved visual contract with exact pixel values, z-order, animation timing

### Secondary (MEDIUM confidence)
- React Native `StyleSheet.hairlineWidth` — documented as `1 / PixelRatio.get()`, renders sub-pixel thin lines on retina displays
- Reanimated v3 `withTiming` inside `useAnimatedStyle` — documented pattern, worklet-safe, animates only on value change

### Tertiary (LOW confidence)
- None — all claims are grounded in the project's actual source code and installed package versions.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries already installed and in active use in the codebase
- Architecture: HIGH — directly extends existing patterns (flashOverlay, indicator dots) already proven in production
- Pitfalls: HIGH — pitfalls derived from reading actual code (Rules of Hooks violation is the exact issue HOOK-01 fixed in Phase 9; haptic import gap is a direct read of the import list)

**Research date:** 2026-03-24
**Valid until:** 2026-05-01 (stable stack — Reanimated 4.x and expo-haptics are not fast-moving)
