# Stack Research

**Domain:** React Native + Expo — v1.1 Refinement & Polish (new capabilities only)
**Researched:** 2026-03-24
**Confidence:** HIGH

> This document covers ONLY net-new library additions for v1.1 features. The existing
> validated stack (Expo SDK 55, RNGH v2, Reanimated v3, Skia 2.4.x, gifted-charts, etc.)
> is not re-researched here.

---

## New Library Required: One Addition

### `expo-local-authentication` (biometric + PIN auth)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| expo-local-authentication | ~55.0.9 | Biometric auth (Face ID, Touch ID, fingerprint) with PIN fallback | First-party Expo module; wraps iOS LocalAuthentication framework and Android BiometricPrompt API. Zero native config for managed workflow. FaceID plist entry handled automatically by Expo. |

**Install:**

```bash
npx expo install expo-local-authentication
```

**Key API:**

```typescript
import * as LocalAuth from 'expo-local-authentication';

// Check hardware capability
const hasHardware = await LocalAuth.hasHardwareAsync();

// Check enrolled biometrics
const enrolled = await LocalAuth.isEnrolledAsync();

// Authenticate — PIN fallback is ON by default (disableDeviceFallback defaults false)
const result = await LocalAuth.authenticateAsync({
  promptMessage: 'Unlock privacy mode',
  fallbackLabel: 'Use PIN',          // shown when biometric fails
  disableDeviceFallback: false,      // PIN/pattern/password allowed as fallback
});
// result.success === true on pass
```

**Confidence:** HIGH — official Expo docs, matches SDK 55 versioning pattern (~55.x.x).

---

## No New Libraries Required for Other Features

The following v1.1 features are fully covered by the **existing stack**:

### Haptic feedback on hold events

**Library:** `expo-haptics` — already in `package.json` at `~55.0.9`

Already used in `useSwipeLog.ts` for swipe events. Hold events need the same call pattern in the `longPressGesture.onStart` callback in `Joystick.tsx`.

```typescript
// Inside longPressGesture.onStart worklet — call via runOnJS:
runOnJS(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy))();

// OR from the JS-thread handleHoldStart callback:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
```

Use `Heavy` for hold activation (feels distinct from swipe's `Medium`).
Use `notificationAsync(Success)` on target selection (already done for target swipes).

**Confidence:** HIGH — confirmed in official Expo docs and existing codebase.

---

### Liquid/water-drop effect on joystick outer ring

**Library:** `@shopify/react-native-skia` — already at `2.4.18`

The `Box` + `BoxShadow` primitives in Skia are the fastest path to a liquid/neumorphic
appearance on a rounded circle. The approach: replace the current `<Animated.View>` outer
ring with a Skia `<Canvas>` that renders a `<Box>` (RoundedRect) with stacked inner and
outer `<BoxShadow>` components.

```typescript
import { Canvas, Box, BoxShadow, rrect, rect } from '@shopify/react-native-skia';

// Inner shadow (top-left light source) + outer glow:
<Canvas style={{ width: JOYSTICK_SIZE, height: JOYSTICK_SIZE }}>
  <Box box={rrect(rect(2, 2, JOYSTICK_SIZE-4, JOYSTICK_SIZE-4), JOYSTICK_SIZE/2, JOYSTICK_SIZE/2)}
       color={colors.surface}>
    {/* Inner shadow for depth */}
    <BoxShadow dx={-4} dy={-4} blur={8} color="rgba(255,255,255,0.08)" inner />
    <BoxShadow dx={4}  dy={4}  blur={8} color="rgba(0,0,0,0.4)"        inner />
    {/* Outer glow driven by Reanimated SharedValue */}
    <BoxShadow dx={0} dy={0}  blur={glowRadius} color={pillar.positiveColor} />
  </Box>
</Canvas>
```

For animated outer glow keyed to `dragIntensity`, use Skia's `useValue` bridge or pass a
Reanimated SharedValue directly (Skia 2.x supports `useDerivedValue` bridge via `useSharedValue`
from Reanimated).

**Note on CSS "water-drop" shadows:** The requirement describes a CSS border-shadow water-drop
effect. In React Native, CSS box-shadow is not available — the equivalent is Skia's `BoxShadow`
with `inner` props for the inset highlight/shadow pair that creates the liquid convex appearance.
No additional library is needed.

**Confidence:** HIGH — `Box`/`BoxShadow` are documented Skia primitives, confirmed in official
Shopify/react-native-skia docs.

---

### Screen dimming / wake lock control

**Library:** `expo-keep-awake` — already available as part of Expo SDK 55 (version ~55.0.4),
NOT currently in `package.json`.

**Install:**

```bash
npx expo install expo-keep-awake
```

**Wait — check before adding:** `expo-keep-awake` is a lightweight wrapper. The current bug
("screen never dimming") may be caused by something else in the codebase (e.g., a gesture
handler or animation loop preventing the OS idle timer from firing). Investigate root cause
first. If the animation loop (`requestAnimationFrame` in `useBodyFillPhysics`) is running
globally, that will prevent sleep on some platforms.

**API:**

```typescript
import { useKeepAwake, activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

// Declarative (component-scoped — only keeps screen on while component is mounted):
function ActiveLoggingScreen() {
  useKeepAwake(); // screen stays on only while this screen is visible
  ...
}

// Imperative (for conditional activation):
await activateKeepAwakeAsync('logging-session');
// ... later
deactivateKeepAwake('logging-session');
```

Use the hook form scoped to the home screen only. Do NOT apply globally — increases battery drain.
The `tag` parameter lets you deactivate specific sources independently.

**Confidence:** HIGH — official Expo docs, version ~55.0.4 matches SDK 55 pattern, 2.4M weekly
downloads confirms active use.

---

### Line chart (replacing bar chart for daily activity)

**Library:** `react-native-gifted-charts` — already at `^1.4.76`

The `LineChart` component is included in the existing library. **No new install required.**
Replace `<BarChart>` in `PillarBarChart.tsx` (rename component to `DailyActivityLineChart`)
with `<LineChart>`.

```typescript
import { LineChart } from 'react-native-gifted-charts';

// Basic conversion from existing BarChart data shape:
// Data format: same {value, frontColor, label} objects work for LineChart.
// Add curved + areaChart for a visual upgrade:
<LineChart
  data={lineData}
  width={chartWidth}
  height={180}
  curved
  areaChart
  color={colors.accent}           // line color
  startFillColor={colors.accent}  // area gradient start
  endFillColor="transparent"      // area gradient end
  maxValue={maxValue}
  noOfSections={4}
  isAnimated
  xAxisColor={colors.border}
  yAxisTextStyle={{ color: colors.textSecondary }}
  xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
  rulesColor={colors.border}
  rulesType="dashed"
/>
```

**Multi-pillar handling:** For showing all 3 pillars on one chart, use `dataSet` prop (v1.3.19+,
already met by 1.4.76) instead of `data`/`data2`/`data3`.

**Confidence:** HIGH — official gifted-charts docs, already a project dependency.

---

### Background color transitions on drag (hue shift)

**Library:** `react-native-reanimated` — already at `4.2.1`

`interpolateColor` is already imported and used in `Joystick.tsx` for the flash overlay.
The existing `dragIntensity` and `directionValence` SharedValues can drive a background
color change on the screen container via `interpolateColor` in a `useAnimatedStyle`.

```typescript
// Already available in Joystick.tsx scope — extend the existing pattern:
const screenBgStyle = useAnimatedStyle(() => {
  const hue = interpolateColor(
    directionValence.value,
    [0, 1],
    ['hsl(220, 20%, 10%)', 'hsl(280, 20%, 10%)'],  // subtle positive/negative hue
    'HSV',  // HSV space for smooth hue traversal
  );
  return {
    backgroundColor: interpolateColor(
      dragIntensity.value,
      [0, 1],
      [colors.background, hue],
    ),
  };
});
```

**No new libraries needed.** Pass the animated style up to the screen container via a callback
ref or lift the SharedValues to a screen-level context.

**Confidence:** HIGH — `interpolateColor` is a documented Reanimated v3 utility, verified in
official Software Mansion docs.

---

### Body-fill Matter.js animation debugging

**Library:** No new library. This is a runtime bug in the existing `useBodyFillPhysics.ts`.

**Root cause candidates identified from codebase review:**

1. **`requestAnimationFrame` not available in RN without polyfill** — Matter.js's built-in
   runner uses `requestAnimationFrame`, but the hook uses a manual `requestAnimationFrame`
   loop. In React Native, `requestAnimationFrame` is provided by the JS runtime but may
   behave differently in the Expo Go environment vs a dev build. Verify the `rafId` loop
   is actually firing.

2. **`BallState` uses `SharedValue<number>` for `x`/`y`, but `BodyFillCanvas` reads
   `ball.x` / `ball.y` as static numbers** — The `Circle` component receives `cx={ball.x}`
   but `ball.x` is a `SharedValue<number>`, not a plain number. Skia's `Circle` must receive
   either a plain number or a Skia `Value`/Reanimated shared value via proper bridge. Direct
   `.value` access from `.current` without Reanimated's `useValue` bridge means the Skia canvas
   never re-renders when values change.

3. **`ballStates.current` is a plain React ref** — Skia canvas doesn't track React ref
   mutations. The canvas needs to read from `SharedValue` objects using the Skia-Reanimated
   bridge, or re-render must be triggered explicitly (e.g., via a Reanimated `useFrameCallback`).

**Recommended fix approach:** Use Reanimated's `useFrameCallback` (Reanimated v3 API) to drive
both the physics tick and the Skia re-render within a single frame loop, eliminating the
`requestAnimationFrame` dependency and ensuring SharedValues are updated on the UI thread.

**Confidence:** MEDIUM — root cause analysis from code inspection; specific fix may require
iteration. The `SharedValue` bridge gap between `makeMutable` and Skia primitives is the
highest-confidence root cause.

---

## Recommended Installation

```bash
# New dependencies for v1.1:
npx expo install expo-local-authentication expo-keep-awake
```

That is the complete set of new package additions. Everything else leverages the existing stack.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| expo-local-authentication | react-native-biometrics | Only for bare workflow without Expo managed; requires manual native config |
| expo-local-authentication | @react-native-community/blur + custom PIN UI | When you need a fully custom lock screen UI without OS biometric dialog |
| expo-keep-awake | Activate system `activateKeepAwake` globally | Never — scoped to screens reduces battery impact |
| Skia BoxShadow (liquid effect) | react-native-inner-shadow (3rd party) | Only if Skia is not already in the project; unnecessary overhead here |
| Skia BoxShadow (liquid effect) | CSS-style shadows on `<View>` | Insufficient — RN `shadowColor` on Android requires `elevation`, no inner shadow, no blur on Android |
| Reanimated interpolateColor (hue shift) | react-native-linear-gradient | Gradient is better for static gradient fills, not animated per-frame hue |
| gifted-charts LineChart (existing dep) | victory-native or react-native-charts-wrapper | Justified only if gifted-charts has a hard limitation; adds ~300KB bundle |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-native-touch-id | Deprecated; merged into expo-local-authentication | expo-local-authentication |
| react-native-keep-awake (corbt) | Unmaintained (last commit 2019), requires linking | expo-keep-awake |
| react-native-haptic-feedback | Extra native dependency; expo-haptics already present and sufficient | expo-haptics (existing) |
| lottie-react-native | Overkill for the liquid joystick effect; Skia handles it natively at 60fps | @shopify/react-native-skia (existing) |
| react-native-blur | Not needed for any v1.1 feature | n/a |
| @react-native-community/masked-view | Not needed; Skia clip handles body fill masking | @shopify/react-native-skia (existing) |
| MMKV (add for state) | Already listed in stack but NOT in package.json — may have been replaced by zustand+mmkv integration; verify before adding | Zustand + existing SQLite |

---

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| expo-local-authentication | ~55.0.9 | Expo SDK 55, React Native 0.83.x | FaceID requires development build (not Expo Go) |
| expo-keep-awake | ~55.0.4 | Expo SDK 55, React Native 0.83.x | Works in Expo Go for testing |
| expo-haptics | ~55.0.9 (existing) | Expo SDK 55 | Already installed, no change needed |
| @shopify/react-native-skia | 2.4.18 (existing) | React Native 0.83.x, Reanimated 4.x | BoxShadow/Box API confirmed stable in 2.x |
| react-native-reanimated | 4.2.1 (existing) | React Native 0.83.x | interpolateColor + useFrameCallback available |
| react-native-gifted-charts | ^1.4.76 (existing) | React Native SVG 15.x (already present) | LineChart + dataSet confirmed available |

---

## Sources

- [Expo LocalAuthentication docs](https://docs.expo.dev/versions/latest/sdk/local-authentication/) — API methods, PIN fallback behavior (HIGH confidence)
- [expo-local-authentication npm](https://www.npmjs.com/package/expo-local-authentication) — version ~55.0.9 for SDK 55 (HIGH confidence)
- [Expo KeepAwake docs](https://docs.expo.dev/versions/latest/sdk/keep-awake/) — useKeepAwake hook, activateKeepAwakeAsync (HIGH confidence)
- [expo-keep-awake npm](https://www.npmjs.com/package/expo-keep-awake) — version 55.0.4, 2.4M weekly downloads (HIGH confidence)
- [Expo Haptics docs](https://docs.expo.dev/versions/latest/sdk/haptics/) — ImpactFeedbackStyle enums confirmed (HIGH confidence)
- [Reanimated interpolateColor docs](https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolateColor/) — RGB/HSV/LAB color spaces, SharedValue integration (HIGH confidence)
- [React Native Skia Box/BoxShadow docs](https://shopify.github.io/react-native-skia/docs/shapes/box/) — inner shadow, spread, dx/dy props (HIGH confidence)
- [React Native Skia Shadow docs](https://shopify.github.io/react-native-skia/docs/image-filters/shadows/) — DropShadow inner mode (HIGH confidence)
- [gifted-charts LineChart props](https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/docs/LineChart/LineChartProps.md) — areaChart, curved, dataSet props (HIGH confidence)
- Codebase inspection: `src/components/joystick/Joystick.tsx`, `useSwipeLog.ts`, `BodyFillCanvas.tsx`, `useBodyFillPhysics.ts`, `PillarBarChart.tsx` — existing patterns confirmed (HIGH confidence)

---

*Stack research for: React Native + Expo v1.1 Refinement & Polish new capabilities*
*Researched: 2026-03-24*
