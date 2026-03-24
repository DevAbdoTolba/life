# Architecture Research

**Domain:** React Native mobile app — v1.1 feature integration into existing RNGH/Reanimated/Skia/Matter.js architecture
**Researched:** 2026-03-24
**Confidence:** HIGH (codebase read directly; library docs verified)

---

## Standard Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        Screen Layer                               │
│  ┌────────────┐  ┌─────────────┐  ┌──────────┐  ┌───────────┐   │
│  │ HomeScreen │  │ Analytics   │  │ Goals    │  │ Settings  │   │
│  │ index.tsx  │  │ analytics   │  │ goals    │  │ settings  │   │
│  └─────┬──────┘  └──────┬──────┘  └────┬─────┘  └─────┬─────┘   │
├────────┴─────────────────┴──────────────┴───────────────┴─────────┤
│                      Component Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │   Joystick   │  │   Physics    │  │       Analytics         │  │
│  │  (RNGH v2 + │  │ (Matter.js + │  │ (gifted-charts +        │  │
│  │  Reanimated) │  │    Skia)     │  │  Reanimated)            │  │
│  └──────┬───────┘  └──────┬───────┘  └────────────────────────┘  │
├─────────┴─────────────────┴────────────────────────────────────────┤
│                      Store Layer (Zustand)                          │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │  logStore  │  │  authStore   │  │ settingsStore │               │
│  │ targetStore│  │  (PIN today) │  │  (privacy,   │               │
│  └─────┬──────┘  └──────┬───────┘  │   reminders) │               │
│        │                │          └──────┬────────┘               │
├────────┴────────────────┴─────────────────┴────────────────────────┤
│                     Persistence Layer                               │
│  ┌──────────────────────┐  ┌─────────────────────────────────────┐  │
│  │  expo-sqlite (data)  │  │ zustandStorage (KV via SQLite)     │  │
│  └──────────────────────┘  └────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Implementation |
|-----------|---------------|----------------|
| `Joystick.tsx` | Pan + LongPress gestures, knob animation, hold state | RNGH v2 Simultaneous compose, Reanimated SharedValues |
| `useSwipeLog.ts` | Bridge gesture results to logStore, fire haptics | JS thread; called via `runOnJS` from gesture worklet |
| `RadialMenu.tsx` | Animated target bubbles on hold, proximity hover | Reanimated `useAnimatedStyle`, derives from thumb SharedValue |
| `useRadialMenu.ts` | Target position math (arc, 30deg intervals) | Pure JS, called from JS callbacks |
| `BodyFillCanvas.tsx` | Render physics balls clipped to body silhouette | Skia Canvas, Circle accepts SharedValue cx/cy directly |
| `useBodyFillPhysics.ts` | Run Matter.js simulation, sync positions to SharedValues | RAF loop in useEffect, `makeMutable` for cross-thread values |
| `PillarBarChart.tsx` | Daily activity bar chart | gifted-charts BarChart, `DailyPillarCount[]` data |
| `TrendLineChart.tsx` | Multi-pillar area/line trend chart | gifted-charts LineChart with `dataSet` prop |
| `AuthModal.tsx` | PIN entry for privacy unlock | Modal + authStore |
| `settingsStore.ts` | Privacy mode flag, reminders config, persisted | Zustand + zustandStorage |
| `authStore.ts` | PIN storage and unlock state | Zustand + zustandStorage (PIN only persisted) |

---

## Integration Architecture for v1.1 Features

### Feature 1: Haptic Feedback on Hold Events

**Current state:** `useSwipeLog.ts` already calls `Haptics.impactAsync()` and `Haptics.notificationAsync()` post-swipe on the JS thread. The `expo-haptics` package is already installed.

**Gap:** Hold-start event currently has no haptic. `handleHoldStart` is called via `runOnJS` from the `LongPress.onStart` worklet — the right call site exists but haptic is missing.

**Integration point:** Add `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)` (or `Heavy`) inside `handleHoldStart` in `Joystick.tsx`. This is already on the JS thread via `runOnJS`, so no worklet wrapping needed.

**Key constraint:** `expo-haptics` functions are async JS functions and cannot be called directly from worklets. They must always cross through `runOnJS`. The existing pattern in `useSwipeLog.ts` is the correct model.

**Files to modify:**
- `src/components/joystick/Joystick.tsx` — add haptic call in `handleHoldStart` callback
- `src/components/joystick/useSwipeLog.ts` — optional: add `selectionAsync` for center-hold note toggle if added

```typescript
// In Joystick.tsx handleHoldStart (already on JS thread via runOnJS)
const handleHoldStart = useCallback((direction: SwipeDirection) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); // ADD
  setRadialDirection(direction);
  setRadialVisible(true);
  onHoldStart?.(direction);
}, [onHoldStart]);
```

---

### Feature 2: Biometric Auth for Privacy Mode

**Current state:** `authStore.ts` holds a PIN; `AuthModal.tsx` is a PIN-entry modal. `settingsStore.isPrivacyMode` is toggled freely (no gate). `expo-local-authentication` is NOT yet installed.

**Gap:** No biometric prompt exists. Privacy mode toggle fires immediately without authentication. The goals screen PIN disconnect is also present.

**Integration design:**

The biometric layer should sit as an auth strategy wrapper around `authStore`, not replace it. PIN remains the fallback. The flow:

```
User toggles Privacy Mode ON
        ↓
useBiometricAuth hook:
  hasHardwareAsync() + isEnrolledAsync()
        ↓
  [biometric enrolled] → authenticateAsync()
  [not enrolled]       → show AuthModal (PIN fallback)
        ↓
  [success] → authStore.unlock() + settingsStore.togglePrivacyMode()
  [failure] → no-op / show error
```

**New hook:** `src/hooks/useBiometricAuth.ts`

```typescript
// Pseudocode structure
export function useBiometricAuth() {
  const authenticate = async (): Promise<boolean> => {
    const hasHW = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (hasHW && isEnrolled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Privacy Mode',
        disableDeviceFallback: false,
      });
      return result.success;
    }
    return false; // caller shows PIN modal
  };
  return { authenticate };
}
```

**Files to modify:**
- `app.json` — add `"expo-local-authentication"` to plugins, add iOS `NSFaceIDUsageDescription`
- `src/hooks/useBiometricAuth.ts` — NEW hook
- `app/(tabs)/settings.tsx` — intercept privacy mode toggle with biometric check
- `src/components/privacy/AuthModal.tsx` — used as PIN fallback when biometric not enrolled

**`app.json` iOS addition required:**
```json
"ios": {
  "infoPlist": {
    "NSFaceIDUsageDescription": "Used to protect your private target names."
  }
}
```

**authStore changes:** Add `unlockWithBiometric()` action that sets `isUnlocked: true` without PIN comparison — biometric is the proof.

**Confidence:** HIGH — `expo-local-authentication` pattern is well-documented and the existing authStore shape accommodates it cleanly.

---

### Feature 3: Liquid Analog Design (Water-Drop Shadow Effect)

**Current state:** `Joystick.tsx` uses `glowAnimatedStyle` with `shadowOpacity` and `shadowRadius` animated by `dragIntensity`. These properties animate correctly on iOS but **not on Android** (platform limitation confirmed in Reanimated docs).

**Gap:** Android gets no animated glow. Desired "liquid" look needs a more organic, morphing feel.

**Integration design:**

Two-part approach:

**Part A — Cross-platform animated glow (replace shadowOpacity/shadowRadius):**

Use `boxShadow` string-based property which works on both platforms. Construct it as a derived string from `dragIntensity`:

```typescript
// Note: boxShadow animation via useAnimatedStyle had a regression in RN 0.76+
// Verified workaround: use Skia RoundedRect + BlurMask on a separate canvas layer
```

The most robust approach for the "liquid" shadow is a thin Skia `Canvas` layer rendered behind the joystick ring using a `RoundedRect` with `BlurMask`. This avoids the boxShadow animation regression (confirmed GitHub issue #6687 with RN 0.76+, which this project uses at 0.83.2).

**Part B — Organic knob shape morphing:**

Keep the `borderRadius` on the knob as-is (it's already a circle). The "liquid" feel comes from the glow size pulsing on hold, which is achievable with Skia blur + a `withSpring` on the blur radius SharedValue.

**Implementation:**

New `JoystickGlow.tsx` component rendered beneath the `outerRing`:

```typescript
// Skia Canvas behind the ring, driven by dragIntensity SharedValue
// RoundedRect matching JOYSTICK_SIZE, BlurMask radius scales with dragIntensity
// No React re-renders — Skia reads SharedValue directly on UI thread
```

**Key constraint:** Skia color animations should use `interpolateColors` (Skia's version), not Reanimated's `interpolateColor`, due to different internal color formats.

**Files to modify:**
- `src/components/joystick/Joystick.tsx` — mount `JoystickGlow` behind ring, pass `dragIntensity` and `directionValence` shared values
- `src/components/joystick/JoystickGlow.tsx` — NEW Skia canvas component

---

### Feature 4: Background Hue Shift on Directional Drag

**Current state:** `HomeScreen` (`app/(tabs)/index.tsx`) has a static `backgroundColor: colors.background` on the `SafeAreaView`. The `Joystick` exposes `dragIntensity` and `directionValence` shared values but does not communicate them upward.

**Gap:** Home screen background is unaware of gesture state.

**Integration design:**

The cleanest approach avoids prop-drilling 6 shared values (2 per joystick × 3 joysticks) up through FlatList headers. Instead, use a Zustand-like shared value store:

**Option A (recommended): Reanimated shared values at screen level, passed down as props**

Lift `dragIntensity` and `activeDirection` shared values to `HomeScreen`, pass them into each `Joystick`. The screen background reads them via `useAnimatedStyle`.

```typescript
// HomeScreen creates these:
const bgIntensity = useSharedValue(0);
const bgHue = useSharedValue(0); // 0=neutral, 1=afterlife, 2=self, 3=others

// Animated background
const bgStyle = useAnimatedStyle(() => ({
  backgroundColor: interpolateColor(
    bgIntensity.value,
    [0, 1],
    [colors.background, activePillarColor]
  ),
}));
```

**Option B:** A Zustand slice for gesture state — heavier than needed for a visual-only effect.

**Recommended:** Option A. The Joystick props interface already has `onHoldStart/onHoldEnd`; extend `JoystickProps` with optional `onDragIntensityChange?: (sv: SharedValue<number>) => void` or simply pass the shared values as props.

**Files to modify:**
- `src/components/joystick/types.ts` — add optional shared value props
- `src/components/joystick/Joystick.tsx` — write to externally-provided shared values instead of internal ones
- `app/(tabs)/index.tsx` — create shared values, wrap container in `Animated.View`, apply background style

---

### Feature 5: Quadrant Lines + Background Color Change on Hold

**Current state:** Direction indicators are small dots (4 of them). On drag, the active dot scale/opacity changes. No quadrant dividers exist on the ring.

**Gap:** No radial quadrant lines, no background fill change on hold.

**Integration design:**

Quadrant lines are best rendered using Skia (already a dep) inside the existing joystick canvas, OR as absolute-positioned `View` dividers inside `outerRing`.

**Recommended: Skia approach** — a small `Canvas` overlay inside the `outerRing` with 2 perpendicular lines (cross pattern), opacity driven by `isHolding` SharedValue.

For the background fill on hold: the `outerRing`'s `flashOverlay` already does a color fill during swipe confirmation. Reuse the same overlay with a lower opacity on `isHolding === 1`. Animate `backgroundColor` via `interpolateColor` on `directionValence`.

```typescript
const holdOverlayStyle = useAnimatedStyle(() => ({
  opacity: isHolding.value * 0.15, // subtle fill, not a flash
  backgroundColor: interpolateColor(
    directionValence.value,
    [0, 1],
    [pillar.positiveColor, pillar.negativeColor]
  ),
}));
```

This reuses the already-present `flashAnimatedStyle` pattern with different opacity math.

**Files to modify:**
- `src/components/joystick/Joystick.tsx` — add `holdOverlayStyle`, add quadrant line elements

---

### Feature 6: Target Fan at 30-Degree Intervals (Joystick Hold Behavior Fix)

**Current state:** `useRadialMenu.ts` uses `RADIAL_ARC_SPAN = 120` degrees, distributing N targets evenly across 120 degrees centered on the drag direction. With 1 target the step is 0 (placed dead-center).

**Gap:** The requirement is 30-degree fixed intervals, not variable distribution across 120 degrees.

**Integration design:**

Change the position calculation in `useRadialMenu.ts`:

```typescript
// Current: step = RADIAL_ARC_SPAN / (n - 1)  (variable spacing)
// New: step = 30  (fixed 30-degree intervals)
// Center the fan: startAngle = baseAngle - (n - 1) * 15

const step = 30; // degrees
const totalSpan = (n - 1) * step;
const startAngle = baseAngle - totalSpan / 2;
```

This is a pure math change in a single hook file with no downstream type changes.

**Files to modify:**
- `src/components/joystick/useRadialMenu.ts` — change step calculation
- `src/components/joystick/constants.ts` — replace `RADIAL_ARC_SPAN` with `RADIAL_FAN_STEP = 30`

---

### Feature 7: Fix Body-Fill Animation (Balls Not Falling)

**Current state:** `useBodyFillPhysics.ts` uses a `requestAnimationFrame` loop inside `useEffect`. Ball positions are written to `makeMutable` SharedValues. `BodyFillCanvas.tsx` reads `ballStates.current` (a `MutableRefObject`) and maps them to `<Circle cx={ball.x} cy={ball.y} />`.

**Probable root cause:** The Skia `Canvas` renders `ballStates.current` at the time of the initial React render. Since `ballStates.current` is a ref (not state), React never re-renders the Canvas when balls are added to the array. The RAF loop updates SharedValue `.value` properties correctly, but the Skia tree is not rebuilt to include new `<Circle>` elements that appear after the initial render.

**Evidence:** The design uses `makeMutable` (correct for cross-thread values) and the RAF loop writes `.value` (correct pattern). The issue is structural: Skia's declarative `<Circle>` nodes need to exist in the component tree from the start, but balls are added to the array via `setTimeout` stagger after mount.

**Fix:** Pre-create all `MAX_BALLS` Circle slots at mount time, using a sentinel value (y = -9999 to hide off-screen). The RAF loop updates positions including the hidden slots; only spawned balls become visible.

```typescript
// In useBodyFillPhysics.ts:
// Pre-allocate all ball SharedValues at init, hide unspawned balls off-canvas
// ballStates.current initialized with MAX_BALLS entries at y = -9999, r = 0

// In BodyFillCanvas.tsx:
// Map ALL ballStates.current entries (not just spawned ones)
// Skia Circle with r=0 or y=-9999 is invisible — no visual cost
```

**Alternative fix:** Wrap `BodyFillCanvas` renders using a Reanimated-driven React state update. However this re-introduces the JS-thread re-render cost that the SharedValue approach was designed to avoid.

**Second possible cause:** `canvasWidth <= 0 || canvasHeight <= 0` guard exits the effect before the engine starts. If the canvas doesn't report dimensions on first layout, logs might be present but physics never starts.

**Fix for second cause:** Add an `onLayout` callback on the canvas container to capture dimensions and trigger the effect.

**Files to modify:**
- `src/components/physics/useBodyFillPhysics.ts` — pre-allocate SharedValues, remove sentinel check on array
- `src/components/physics/BodyFillCanvas.tsx` — render from all pre-allocated slots

---

### Feature 8: Daily Activity Line Chart (Replace Bar Chart)

**Current state:** `PillarBarChart.tsx` uses gifted-charts `BarChart` with `DailyPillarCount[]` data. `TrendLineChart.tsx` already exists and uses gifted-charts `LineChart` with the `dataSet` prop for multi-pillar lines.

**Gap:** The "Daily Activity" card uses `BarChart`. The requirement is to replace it with a `LineChart`.

**Integration design:**

`TrendLineChart` already implements the correct pattern. The simplest path is to rename/repurpose `PillarBarChart` to use `LineChart` with the same data transformation logic.

Key data mapping difference: `BarChart` uses flat `{value, frontColor, label}` items; `LineChart` with `dataSet` uses per-series arrays `{data: [{value, label}], color}`.

The `TrendLineChart` component already does this exact transformation (`pillarTotals` by pillar). The "Daily Activity" chart is a subset: it can reuse the same transform but show totals per day (summed across directions) rather than per-pillar trends.

**Recommended:** Rename `PillarBarChart` → `DailyActivityChart`, replace `BarChart` import with `LineChart`, adapt the data transform to match the `dataSet` format already established in `TrendLineChart`.

**Files to modify:**
- `src/components/analytics/PillarBarChart.tsx` — rename to `DailyActivityChart.tsx`, replace BarChart with LineChart
- `app/(tabs)/analytics.tsx` — update import from `PillarBarChart` to `DailyActivityChart`

**No data API changes needed** — `DailyPillarCount[]` is already the correct input type.

---

### Feature 9: Daily Activity List in Bottom Half (Thumb-Reachable)

**Current state:** `HomeScreen` uses a `FlatList` with `ListHeaderComponent` containing the joystick triangle and a "Today's Activity" label. The activity items appear below the header — which already puts them in the lower portion. However with joysticks in the header, the list may not start in the truly thumb-reachable zone.

**Gap:** The list title "Today's Activity" is inside the header (rendered above), not as a sticky element. Activity list items may appear too high on tall phones.

**Integration design:**

No structural changes needed — the `FlatList` already renders items below the joystick block. The fix is layout tuning: adjust `paddingBottom` on the `triangleContainer` and/or use a `stickyHeaderIndices` approach if needed.

If the intent is a split-screen layout (joysticks fixed top half, list fixed bottom half), the approach changes to a two-section `View` with explicit `flex` allocation:

```typescript
// Top: flex 0.55 for joystick triangle
// Bottom: flex 0.45 for list (thumb zone)
// FlatList inside bottom section, no scrolling header
```

**Files to modify:**
- `app/(tabs)/index.tsx` — layout restructure if true split required; otherwise padding tuning only

---

## Recommended Component Structure for New Files

```
src/
├── components/
│   ├── joystick/
│   │   ├── Joystick.tsx          # MODIFY: haptics, hold overlay, lift shared values
│   │   ├── JoystickGlow.tsx      # NEW: Skia glow canvas behind ring
│   │   ├── useRadialMenu.ts      # MODIFY: 30deg fixed intervals
│   │   ├── useSwipeLog.ts        # MODIFY: haptic on center-hold
│   │   ├── constants.ts          # MODIFY: RADIAL_FAN_STEP
│   │   └── types.ts              # MODIFY: optional shared value props
│   ├── physics/
│   │   ├── BodyFillCanvas.tsx    # MODIFY: render all pre-allocated slots
│   │   └── useBodyFillPhysics.ts # MODIFY: pre-allocate SharedValues
│   └── analytics/
│       └── DailyActivityChart.tsx # RENAME from PillarBarChart.tsx
├── hooks/
│   └── useBiometricAuth.ts       # NEW: LocalAuthentication wrapper
app/
├── (tabs)/
│   ├── index.tsx                 # MODIFY: bg hue, list layout
│   └── settings.tsx              # MODIFY: biometric gate on privacy toggle
└── app.json                      # MODIFY: LocalAuthentication plugin + iOS plist
```

---

## Data Flow

### Gesture → Haptic → Log Flow

```
User thumb moves (UI thread)
    ↓
Pan.onUpdate worklet (UI thread)
    ↓ writes
dragIntensity SharedValue ──► JoystickGlow reads (Skia, UI thread)
activeDirection SharedValue ──► indicator styles (Reanimated, UI thread)
    ↓
LongPress.onStart worklet (UI thread)
    ↓ runOnJS
handleHoldStart() (JS thread)
    ├── Haptics.impactAsync(Heavy)    ← NEW
    ├── setRadialVisible(true)
    └── onHoldStart?.()
    ↓
Pan.onEnd worklet (UI thread)
    ↓ runOnJS
handleHoldEnd(tx, ty, dir) (JS thread)
    ├── getClosestTarget() → targetId
    ├── handleSwipe(result, targetId)
    │     ├── addLog() → SQLite
    │     ├── Haptics.notificationAsync(Success)
    │     └── setPendingLogId() → NoteEntryModal shows
    └── setRadialVisible(false)
```

### Biometric Auth Flow

```
User taps Privacy Mode toggle (Settings screen, JS thread)
    ↓
useBiometricAuth.authenticate()
    ├── hasHardwareAsync() + isEnrolledAsync()
    │     ├── [enrolled] → LocalAuthentication.authenticateAsync()
    │     │     ├── success → authStore.unlock() + togglePrivacyMode()
    │     │     └── failure → show error toast, no-op
    │     └── [not enrolled] → show AuthModal (PIN fallback)
    │           └── PIN correct → authStore.unlock() + togglePrivacyMode()
    └── [no hardware] → show AuthModal (PIN fallback)
```

### Physics Animation Flow (After Fix)

```
useBodyFillPhysics useEffect runs (canvasWidth/Height > 0)
    ↓
Pre-allocate MAX_BALLS SharedValues at y=-9999, r=0  ← NEW
    ↓
BodyFillCanvas renders all MAX_BALLS Circle elements   ← NEW (stable tree)
    ↓
RAF loop starts
    ↓
setTimeout stagger: ball[i] spawns into Matter world
    ├── SharedValues[i].y updated from -9999 to drop position  ← visible
    └── SharedValues[i].r set to config.radius
    ↓
Each RAF frame:
    Matter.Engine.update(engine, 1000/60)
        ↓ writes
    SharedValues[i].{x, y}.value = body.position.{x, y}
        ↓
    Skia Canvas re-draws Circle positions at 60fps (UI thread)
    (no React re-renders involved)
```

---

## Architectural Patterns

### Pattern 1: runOnJS Bridge for Side Effects

**What:** Haptics, state updates, and any non-worklet code called from gesture worklets use `runOnJS()` to cross from the UI thread back to JS.
**When to use:** Any call inside a gesture handler that touches non-worklet APIs (expo-haptics, React state, Zustand).
**Trade-offs:** Small latency (~1 frame delay) but unavoidable. Keep worklet code minimal; push logic to JS callbacks.

```typescript
// Correct: expo-haptics is a JS function, use runOnJS
longPressGesture.onStart(() => {
  'worklet';
  runOnJS(handleHoldStart)(dir); // handleHoldStart calls Haptics inside
});
```

### Pattern 2: Shared Values as Cross-Thread Data Conduit

**What:** `makeMutable` / `useSharedValue` SharedValues are the only safe way to pass data between the UI thread (gestures, Skia, RAF loops) and the JS thread.
**When to use:** Any value that both a worklet (gesture/animation) and a Skia canvas need to read.
**Trade-offs:** Values are mutable by reference — accidental mutation from JS while the UI thread reads causes tearing. Keep writes unidirectional where possible.

### Pattern 3: Skia Canvas with Pre-Allocated Slots

**What:** Skia's declarative `<Circle>` elements must exist in the React tree before they animate. Pre-allocate all slots at mount with sentinel values; the RAF loop makes them visible by updating position/radius SharedValues.
**When to use:** Any physics/particle system where elements are added dynamically after mount.
**Trade-offs:** Pre-allocation wastes a small amount of memory for unused slots (MAX_BALLS = 50 SharedValues ≈ negligible). Avoids the "ref array not re-rendering" class of bug entirely.

### Pattern 4: Zustand for Slow-Changing Auth/Settings State

**What:** Privacy mode, PIN, and biometric unlock status live in Zustand stores. Gesture-speed state (drag intensity, direction) lives in Reanimated SharedValues.
**When to use:** Any state that components need to `useStore()` subscribe to (React renders on change). Never put gesture-speed values in Zustand.
**Trade-offs:** Zustand state changes trigger React re-renders; fine for settings, catastrophic for 60fps gesture values.

---

## Anti-Patterns

### Anti-Pattern 1: Calling expo-haptics Directly from a Worklet

**What people do:** `'worklet'; Haptics.impactAsync();` inside a gesture handler.
**Why it's wrong:** `expo-haptics` is a JS-thread module. Worklets run on the UI thread. This causes a crash: "Tried to synchronously call a non-worklet function on the UI thread."
**Do this instead:** `runOnJS(triggerHaptic)()` where `triggerHaptic` is defined on the JS thread.

### Anti-Pattern 2: Animating `shadowOpacity` / `shadowRadius` for Cross-Platform Glow

**What people do:** `useAnimatedStyle(() => ({ shadowOpacity: ..., shadowRadius: ... }))` expecting it to animate on both platforms.
**Why it's wrong:** `shadowOpacity`/`shadowRadius` are iOS-only. Android ignores them entirely. There is also a regression with `boxShadow` in Reanimated + RN 0.76+ (issue #6687).
**Do this instead:** Use a Skia `BlurMask` on a background canvas layer. Works on both platforms at 60fps without the React Native shadow property limitations.

### Anti-Pattern 3: Dynamic Skia Circle Array via Ref

**What people do:** `ballStates.current.map((ball, i) => <Circle key={i} cx={ball.x} cy={ball.y} />)` where `ballStates.current` grows after mount.
**Why it's wrong:** React renders the Canvas once; new array entries added after mount are not picked up unless React re-renders. But re-rendering to update the Skia tree defeats the purpose of SharedValues.
**Do this instead:** Pre-allocate the maximum number of Circle elements at mount. Use SharedValue position/radius to show/hide individual balls.

### Anti-Pattern 4: Storing Biometric "isAuthenticated" in Zustand persisted state

**What people do:** Persist `isUnlocked: true` in MMKV/SQLite so the app stays unlocked across app restarts.
**Why it's wrong:** The privacy protection goal is to require re-authentication on each session. The authStore already correctly only persists `pin` (not `isUnlocked`). Do not change this.
**Do this instead:** `isUnlocked` remains ephemeral; biometric auth runs on app start when privacy mode is on.

### Anti-Pattern 5: Polling Zustand State in Worklets

**What people do:** Reading `useSettingsStore.getState().isPrivacyMode` inside a worklet.
**Why it's wrong:** Zustand state is on the JS thread. Accessing it in a worklet causes a crash or returns stale data.
**Do this instead:** Pass privacy mode as a prop or derive a SharedValue from it in the component's JS context before entering the gesture.

---

## Integration Points

### New Library: expo-local-authentication

| Integration | Pattern | Notes |
|-------------|---------|-------|
| `app.json` plugin registration | Add `"expo-local-authentication"` to `plugins[]` | Required for managed workflow |
| iOS perm | `infoPlist.NSFaceIDUsageDescription` | Required by Apple, app rejected without it |
| Android perms | Auto-added via plugin | `USE_BIOMETRIC`, `USE_FINGERPRINT` |
| Hook | `useBiometricAuth.ts` wraps `authenticateAsync` | Returns `boolean`, caller handles PIN fallback |
| Fallback | Existing `AuthModal.tsx` | No changes needed to modal itself |

### Internal Boundaries Changed by v1.1

| Boundary | Change | Notes |
|----------|--------|-------|
| `Joystick` → `HomeScreen` | Export `dragIntensity` SharedValue upward (bg hue) | New optional prop or lift to parent |
| `authStore` → `settingsStore` | Auth check gates `togglePrivacyMode` | Auth must succeed before privacy toggle fires |
| `useBodyFillPhysics` → `BodyFillCanvas` | Pre-allocate all slots; ref shape unchanged | Breaking change in initialization but same interface |
| `PillarBarChart` → analytics screen | Rename to `DailyActivityChart`; same props | Import update only |

---

## Build Order (Dependency Ordering)

Build in this sequence to avoid blocking dependencies:

1. **Body-fill animation fix** — standalone, no deps on other v1.1 work, unblocks visual QA of physics
2. **Haptics on hold** — 1 line change in existing callback, tests gesture pipeline immediately
3. **Target fan 30-degree fix** — pure math in `useRadialMenu.ts`, no UI deps
4. **Daily activity line chart** — isolated component swap, testable in analytics alone
5. **Biometric auth** — requires `app.json` change + new hook; needs device build to test FaceID
6. **Background hue shift** — requires lifting shared values in `Joystick` + `HomeScreen` changes
7. **Liquid analog / Skia glow** — depends on `dragIntensity` architecture from step 6 being settled
8. **Quadrant lines + hold fill** — builds on `isHolding` SharedValue already in Joystick; low risk last

---

## Scaling Considerations

This is a local-only single-user app. Scale concerns are performance-only:

| Concern | Current approach | v1.1 impact |
|---------|-----------------|-------------|
| Physics simulation | 50-ball cap, RAF loop | No change — pre-allocation doesn't affect simulation cost |
| Gesture thread | UI thread, 60fps | Haptics add 1 runOnJS call per hold; negligible |
| Auth latency | PIN modal ~instant | Biometric prompt adds OS-managed 0.5–2s; acceptable |
| Chart render | gifted-charts native-optimized | LineChart replaces BarChart; same performance class |

---

## Sources

- Reanimated supported properties (shadowOpacity Android gap, boxShadow recommendation): https://docs.swmansion.com/react-native-reanimated/docs/guides/supported-properties/
- Expo Haptics API: https://docs.expo.dev/versions/latest/sdk/haptics/
- expo-local-authentication API: https://docs.expo.dev/versions/latest/sdk/local-authentication/
- Matter.js + Skia integration pattern (Expo official blog): https://expo.dev/blog/build-2d-game-style-physics-with-matter-js-and-react-native-skia
- Skia animation with Reanimated SharedValues: https://shopify.github.io/react-native-skia/docs/animations/animations/
- gifted-charts LineChart props (dataSet, curved, areaChart): https://github.com/Abhinandan-Kushwaha/react-native-gifted-charts/blob/master/docs/LineChart/LineChartProps.md
- Reanimated runOnJS usage: https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/
- boxShadow animation regression issue (RN 0.76+): https://github.com/software-mansion/react-native-reanimated/issues/6687

---
*Architecture research for: Hayat v1.1 Refinement & Polish — feature integration*
*Researched: 2026-03-24*
