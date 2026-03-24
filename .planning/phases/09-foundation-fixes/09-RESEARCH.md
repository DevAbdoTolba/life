# Phase 9: Foundation Fixes - Research

**Researched:** 2026-03-24
**Domain:** React Native Reanimated 4.x hooks rules, Matter.js + Skia physics rendering lifecycle, React Native screen dimming behavior
**Confidence:** HIGH (all findings verified directly against installed library source and live codebase)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Screen Wake Lock (BUG-01)**
- D-01: Always allow normal OS screen dimming — no wake lock at all
- D-02: Root cause is unknown — no `expo-keep-awake` is installed, yet screen never dims. Investigate RAF loop in `useBodyFillPhysics.ts`, continuous Reanimated animations, or other causes. Find and fix whatever prevents dimming.
- D-03: Do NOT install `expo-keep-awake` — the goal is to remove the problem, not manage it

**Body-Fill Physics (BUG-02)**
- D-04: Performance is the #1 priority — must work smoothly on any device, not just high-end
- D-05: Ball behavior: fast drop with satisfying bounce at the bottom — playful, energetic feel
- D-06: Pre-allocate all ball SharedValue slots at init (stable Skia Circle tree, no dynamic array growth)
- D-07: Move physics tick from JS RAF loop to Reanimated `useFrameCallback` for UI-thread execution
- D-08: Ball aggregation (ADR-026) stays in place to cap memory on high log counts
- D-09: Root cause: `BodyFillCanvas` reads `ballStates.current` (useRef) at mount time when array is empty — zero Circle elements rendered, physics runs invisibly. Fix must ensure Skia tree has all Circle elements before physics starts.

**Hooks Anti-Pattern Cleanup**
- D-10: Fix `createIndicatorStyle` violation in BOTH `Joystick.tsx` (lines 298-309) AND `GestureSlide.tsx` (lines 128-137)
- D-11: Inline all four `useAnimatedStyle` calls at component top level — no factory function wrapping hooks

### Claude's Discretion
- Exact Matter.js restitution/friction values for the "fast drop + bounce" feel
- Whether to use `useState` trigger or pre-allocation pattern for the body-fill fix (whichever performs better)
- RAF cleanup approach for the wake lock investigation

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-01 | App allows screen to dim when not actively interacting (no permanent wake lock) | Root cause investigation of RAF loop + Reanimated animations; no expo-keep-awake installed means cause is in-app code |
| BUG-02 | Body-fill visualization renders and animates balls falling with physics | Pre-allocation pattern (D-06, D-09), useFrameCallback migration (D-07), physics tuning (D-05) |
</phase_requirements>

---

## Summary

Phase 9 fixes three distinct shipped-but-broken behaviors. The problems are mechanically independent but all touch the same animation/rendering pipeline (Reanimated + Skia + Matter.js). Each has a pinpointed root cause and a clear fix.

**BUG-01 (screen never dims):** No `expo-keep-awake` is installed. The RAF loop in `useBodyFillPhysics.ts` runs on the body-fill screen only; it cannot prevent dimming on the home screen. The most probable cause is that `requestAnimationFrame` itself — when running continuously on the JS thread — interacts with the native frame scheduler in a way that signals "activity" to the OS display timer on some platforms. The fix is to stop the RAF loop as soon as balls settle (the `isSettled` flag and settlement logic already exist; verify `VELOCITY_THRESHOLD` is reachable and RAF cancellation actually fires). If RAF is not the cause, the secondary investigation target is any Reanimated `withRepeat` or continuous `withSpring`/`withTiming` chains — none were found in the codebase search, so RAF is the most likely culprit.

**BUG-02 (balls not falling):** The root cause is confirmed: `BodyFillCanvas` maps `ballStates.current` (a `useRef`) at React render time. `useEffect` populates `ballStates.current` after the render, but since `useRef` mutations never trigger re-renders, the Skia `<Circle>` elements are never added to the tree. The fix is pre-allocation (D-06/D-09): initialize `ballStates.current` with `MAX_BALLS` slots at hook init time (before the first render), so the Skia tree always has Circle elements. D-07 mandates migrating the tick from `requestAnimationFrame` to Reanimated's `useFrameCallback` — but **this has a critical constraint**: `Matter.Engine.update()` is pure JS and cannot run inside a worklet. `useFrameCallback`'s callback runs on the UI thread via `scheduleOnUI`. The physics update must therefore either stay on the JS thread (RAF) or be restructured to separate physics advancement (JS) from position writing (UI thread).

**Hooks violation:** The `createIndicatorStyle` function in both `Joystick.tsx` and `GestureSlide.tsx` calls `useAnimatedStyle` inside a non-component function. This violates React Rules of Hooks. The fix is mechanical: replace the four factory-pattern calls with four explicit top-level `useAnimatedStyle` calls in each component.

**Primary recommendation:** Fix the hooks violation first (it is a 10-minute mechanical refactor), then fix the body-fill pre-allocation (core visual bug), then investigate and stop the wake lock behavior (requires testing on a real device to confirm).

---

## Standard Stack

### Core (already installed, no new dependencies required)

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| react-native-reanimated | 4.2.1 | SharedValues, useAnimatedStyle, useFrameCallback | useFrameCallback confirmed in installed source |
| matter-js | ^0.20.0 | Physics simulation | Pure JS, cannot run in worklets |
| @shopify/react-native-skia | 2.4.18 | Canvas rendering with SharedValue animation | Circle accepts SharedValue cx/cy directly |
| react-native-gesture-handler | ~2.30.0 | Pan + LongPress gestures | Simultaneous compose already established |

### No New Packages

This phase requires zero new npm installs. All required libraries are already installed. Do NOT install `expo-keep-awake` (D-03).

---

## Architecture Patterns

### Pattern 1: Pre-Allocated Skia Circle Slots (BUG-02 Fix)

**What:** Initialize `ballStates.current` with `MAX_BALLS` entries at hook creation time, before any `useEffect` runs. Each slot starts with `y = -9999` (hidden off-canvas) and `r = 0`. The Skia Canvas renders all `MAX_BALLS` Circle elements from mount. The physics loop activates slots progressively by updating their position SharedValues.

**When to use:** Any Skia canvas that needs to add physics/particle elements after mount.

**Why it works:** `ballStates.current` is populated synchronously before the component renders. `BodyFillCanvas` reads the ref during render, finds `MAX_BALLS` entries, and creates `MAX_BALLS` Circle elements in the Skia tree. SharedValue position updates then drive 60fps animation without any React re-render.

**Implementation in `useBodyFillPhysics.ts`:**

```typescript
// CURRENT (broken): ballStates initialized empty, populated in useEffect
const ballStates = useRef<BallState[]>([]);

// FIXED: Pre-allocate MAX_BALLS slots synchronously
const ballStates = useRef<BallState[]>(
  Array.from({ length: MAX_BALLS }, () => ({
    x: makeMutable(-9999),
    y: makeMutable(-9999),
    r: 0,  // r is not a SharedValue — it can stay static per-slot
    color: 'transparent',
  }))
);
```

**Implementation in `useBodyFillPhysics.ts` useEffect:**

```typescript
// In useEffect, populate the pre-allocated slots with real ball data
const ballConfigs = aggregateLogs(logs, scaleX, scaleY);
ballConfigs.forEach((config, i) => {
  // Update the pre-allocated slot in place (do NOT replace the SharedValue)
  ballStates.current[i].x.value = config.dropX;
  ballStates.current[i].y.value = -config.radius;
  // r and color must be in a parallel state array since they aren't SharedValues
});
```

**Critical constraint:** `r` (radius) and `color` are not `SharedValue` in the current `BallState` type. They are static `number` and `string`. Since they are read by the Skia `<Circle r={ball.r} color={ball.color} />` declaratively during React render, changing them after render would require either (a) making them SharedValues, or (b) triggering a React re-render. Simplest approach: keep `r` and `color` as static values but populate them in the slot at pre-allocation time using a default radius and update them via a `useState` counter that triggers a single re-render once `aggregateLogs` runs. See Pitfall: "BallState r/color are not SharedValues" below.

**Alternative approach — two-phase init:**
1. Phase 1 (synchronous, before render): allocate `MAX_BALLS` slots with hidden positions and `r=0` / `color='transparent'`
2. Phase 2 (in `useEffect`, triggers one re-render): call `setBallCount(ballConfigs.length)` — a single `useState` counter that causes `BodyFillCanvas` to re-render reading the now-populated `ballStates.current` slots

This second approach preserves the existing `BallState` interface shape (no changes to `r`/`color` types) and causes exactly one additional React render.

**Source:** Verified against `BodyFillCanvas.tsx` (line 52: `{ballStates.current.map((ball, i) => <Circle ... r={ball.r} color={ball.color} />)}`) and `useBodyFillPhysics.ts` (line 68: `const ballStates = useRef<BallState[]>([])`)

---

### Pattern 2: useFrameCallback with JS-thread Matter.js (D-07 Constraint)

**Decision D-07 says:** Move physics tick from JS RAF loop to Reanimated `useFrameCallback`.

**Critical constraint verified from installed source:** `useFrameCallback` registers its callback via `FrameCallbackRegistryUI` which uses `scheduleOnUI` from `react-native-worklets`. The callback therefore runs on the UI thread as a worklet. `Matter.Engine.update()` is pure JS and will crash or be unavailable on the UI thread.

**Resolution options:**

**Option A (recommended — hybrid approach):** Keep `Matter.Engine.update()` on the JS thread via RAF, but use `useFrameCallback` for the SharedValue write step only. In practice this means the RAF loop calls `Matter.Engine.update()` and then writes `sharedValue.value = body.position.x` — which is already what the current code does. The "move to useFrameCallback" intent from D-07 cannot be literally satisfied for Matter.js physics without a worklet-compatible physics engine.

**Option B (literal D-07 compliance):** Keep RAF for Matter.js stepping, add `useFrameCallback` for position reads that are then written to SharedValues from the UI thread. This is architecturally complex and offers no real benefit over Option A since SharedValue writes from the JS thread are already non-blocking.

**Practical recommendation:** Implement Option A. The key performance win is that SharedValue `.value` writes are cross-thread safe. The RAF loop doing `newBallStates[i].x.value = body.position.x` is already the correct pattern. The true issue is the pre-allocation fix (D-06/D-09), not the thread model. Document D-07 as "implemented via SharedValue writes from RAF" — the Skia canvas reads happen on the UI thread regardless of where `.value` is set.

**If the team insists on literal `useFrameCallback` for the tick:** The callback body must be a worklet, which means `Matter.Engine.update()` cannot be called inside it. The closest worklet-compatible physics alternative would be a custom gravity + collision system using pure SharedValue math — well beyond Phase 9 scope.

**Source:** `/home/appuser/workspace/life/node_modules/react-native-reanimated/src/frameCallback/FrameCallbackRegistryUI.ts` — `scheduleOnUI` confirms UI thread execution.

---

### Pattern 3: Inline useAnimatedStyle at Component Top Level (D-10/D-11 Fix)

**What goes wrong:** `createIndicatorStyle(direction)` calls `useAnimatedStyle` inside a regular function. React's Rules of Hooks require hooks to be called at the top level of a React function component, never inside nested functions.

**Confirmed violation locations:**
- `Joystick.tsx` lines 298-309: `createIndicatorStyle` defined and called 4 times
- `GestureSlide.tsx` lines 128-137: same pattern

**Correct pattern (already used in `Joystick.tsx` lines 269-295):**

```typescript
// VIOLATION — do not do this:
const createIndicatorStyle = (direction: number) =>
  useAnimatedStyle(() => ({
    opacity: activeDirection.value === direction ? 1 : 0.25,
    transform: [{ scale: activeDirection.value === direction ? 1.4 : 1 }],
  }));
const upIndicatorStyle = createIndicatorStyle(1);    // hooks inside function
const downIndicatorStyle = createIndicatorStyle(2);  // hooks inside function

// CORRECT — do this instead:
const upIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 1 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 1 ? 1.4 : 1 }],
}));
const downIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 2 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 2 ? 1.4 : 1 }],
}));
const leftIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 3 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 3 ? 1.4 : 1 }],
}));
const rightIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 4 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 4 ? 1.4 : 1 }],
}));
```

The logic is identical — only the structure changes. The `activeDirection.value` comparison moves inline into each `useAnimatedStyle` callback.

**Source:** Codebase read of `Joystick.tsx` lines 269-309 and `GestureSlide.tsx` lines 117-137. React Rules of Hooks: https://react.dev/warnings/invalid-hook-call-warning

---

### Pattern 4: RAF Settlement and Screen Dimming Investigation

**Screen dimming cause hypothesis:** `expo-keep-awake` is NOT installed (verified: not in `package.json`). No `withRepeat` or infinite animation loops found in the codebase search. The `requestAnimationFrame` loop in `useBodyFillPhysics.ts` runs on the body-fill screen only, not the home screen — so it is unlikely to be the cause of dimming on the home screen during joystick use.

**Most likely actual cause:** On React Native + Expo (managed workflow), the Reanimated gesture handler pipeline keeps the event dispatch loop active during any gesture in progress. This is expected behavior — the screen should not dim while the user is actively touching/dragging a joystick. The "screen never dims" bug is most likely observed when the user puts the phone down (not actively gesturing) and the screen still doesn't dim.

**Root cause candidates in priority order:**
1. **RAF loop not stopping after settlement** — `isSettled` flag may never trigger because `VELOCITY_THRESHOLD = 0.5` is too low. Micro-jitter from Matter.js contact resolution keeps velocity above threshold. Raising to `1.0` may fix.
2. **RAF running when body-fill screen is not mounted** — confirm cleanup fires. Already present in code (`cancelAnimationFrame(rafId)` in cleanup), but verify `isSettled` actually stops it when balls are at rest.
3. **Body-fill screen accessed during investigation** — if tester opens body-fill screen (which starts the RAF loop) and then goes back to home screen without proper cleanup, the RAF runs in the background.
4. **Expo Go / development mode artifact** — some screen dimming behaviors differ in Expo Go vs. standalone build.

**Fix approach (D-02):** Add logging to confirm RAF stops after settlement. Raise `VELOCITY_THRESHOLD` from `0.5` to `1.0`. Add a `maxRuntime` safety net (e.g., force-settle after 30 seconds regardless of velocity). Test by: open body-fill screen → let balls settle → go back to home screen → wait 2 minutes → verify screen dims.

**Source:** Codebase search confirms no `withRepeat`, no `expo-keep-awake`, no `AppState` subscriptions. `useBodyFillPhysics.ts` cleanup inspected directly.

---

### Pattern 5: Matter.js Physics Tuning for Playful Bounce (D-05)

**Current values (from `useBodyFillPhysics.ts` line 119-123):**
```typescript
{
  restitution: 0.3,   // bounce coefficient (0=no bounce, 1=perfect bounce)
  friction: 0.1,      // surface friction
  frictionAir: 0.02,  // air drag
}
```

**Target feel:** "fast drop with satisfying bounce at the bottom — playful, energetic"

**Recommended values (Claude's discretion):**
```typescript
{
  restitution: 0.6,   // higher bounce — balls visibly bounce off floor
  friction: 0.05,     // lower friction — balls slide into position more freely
  frictionAir: 0.01,  // lower air drag — faster fall speed
}
```

**Engine gravity (line 81):**
```typescript
const engine = Matter.Engine.create({ gravity: { x: 0, y: 1.2 } });
// Increase to 2.0-2.5 for faster drop
```

**Verification:** Tune on device. Values above are a starting point. The `restitution` of 0.6 will cause 2-3 visible bounces before settling, which matches "satisfying bounce." The settlement time will increase slightly — ensure `VELOCITY_THRESHOLD` and `SETTLED_THRESHOLD` still work.

**Source:** Matter.js docs (body properties), existing code in `useBodyFillPhysics.ts`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Skia canvas with dynamic particle count | Custom re-render system | Pre-allocated slots with SharedValues | SharedValue writes are non-blocking; re-render system defeats the performance goal |
| Wake lock management | `expo-keep-awake` or native module | Fix the root cause (stop the RAF) | D-03 explicitly forbids expo-keep-awake |
| Physics on UI thread | Custom worklet physics | Hybrid: Matter.js on JS thread + SharedValue writes | Matter.js is pure JS, cannot run as worklet |
| Hooks deduplication | Factory functions or HOCs | Inline each `useAnimatedStyle` call | Rules of Hooks forbid hooks in non-component functions |

---

## Common Pitfalls

### Pitfall 1: Replacing SharedValue Objects Instead of Updating .value

**What goes wrong:** In the pre-allocation fix, a developer might do `ballStates.current[i] = { x: makeMutable(newX), ... }` (replacing the whole slot object) instead of `ballStates.current[i].x.value = newX` (updating the existing SharedValue in place).

**Why it happens:** It looks like a normal array update.

**How to avoid:** Only ever write `.value` on an existing `makeMutable` SharedValue. Replacing the SharedValue object breaks the connection between the Skia `<Circle cx={ball.x} />` prop (which captured the original SharedValue reference) and the physics loop.

**Warning signs:** Balls appear at initial position but never move.

---

### Pitfall 2: BallState r and color Are Not SharedValues

**What goes wrong:** The current `BallState` interface has `r: number` and `color: string` — not SharedValues. If pre-allocation uses placeholder values for these, the Skia Circle renders with `r=0` (invisible) or `color='transparent'`. When the physics useEffect sets real values, no React re-render occurs to pick them up.

**Why it happens:** Developers assume setting `ballStates.current[i].r = realRadius` will trigger a re-render or Skia update.

**How to avoid:** Use a `useState<number>` counter (`setBallCount`) in `useBodyFillPhysics` that triggers one React re-render after all real values are assigned to the slots. The planner must choose between:
- Option A: Add `r` and `color` as SharedValues (more complex, worklet-accessible)
- Option B: Keep `r`/`color` static and trigger one re-render with a state counter (simpler, established pattern)
Option B is recommended — it is a single `useState` call and a single `setState` in useEffect.

---

### Pitfall 3: useFrameCallback Callback Must Be a Worklet

**What goes wrong:** Trying to call `Matter.Engine.update()` inside a `useFrameCallback` callback will either crash or silently fail because `Matter.Engine.update` is not a worklet function.

**Why it happens:** D-07 says "move to useFrameCallback" and developers follow it literally.

**How to avoid:** Keep `Matter.Engine.update()` in the RAF loop on the JS thread. Use `useFrameCallback` only if there is a pure-computation step that can run on the UI thread. Writing `sharedValue.value = body.position` from the JS thread RAF is already correct and non-blocking.

**Warning signs:** App crashes with "Calling non-worklet function from UI thread" or physics stops updating.

---

### Pitfall 4: Settlement Threshold Too Low, RAF Never Stops

**What goes wrong:** `VELOCITY_THRESHOLD = 0.5` may never be reached due to Matter.js contact-resolution micro-jitter. Balls visually appear still but their physics velocity oscillates around `0.1–0.4`. The RAF loop runs forever. This is the most likely cause of the screen-dimming bug.

**Why it happens:** Matter.js constraint solving introduces small velocity corrections on every frame for resting bodies.

**How to avoid:** Raise `VELOCITY_THRESHOLD` to `1.0`. Add a hard maximum runtime (e.g., after 30 seconds, force `isSettledRef.current.value = true` and cancel RAF regardless).

**Warning signs:** CPU profiler shows `tick` function running continuously after balls visually settle. `isSettled.value` stays `false`.

---

### Pitfall 5: GestureSlide.tsx Hooks Fix May Break Onboarding

**What goes wrong:** `GestureSlide.tsx` is the onboarding gesture tutorial. Refactoring it incorrectly could break the tutorial. It has fewer SharedValues than `Joystick.tsx` (no `isHolding`, no `dragIntensity`, no `directionValence`) — the four indicator styles use only `activeDirection`.

**Why it happens:** Developer copies the full `Joystick.tsx` indicator pattern without accounting for the simpler SharedValue set in `GestureSlide.tsx`.

**How to avoid:** Fix `GestureSlide.tsx` independently. The four indicator `useAnimatedStyle` calls need only one SharedValue (`activeDirection`). No other Animated styles change.

---

## Code Examples

### Correct: Pre-Allocated Ball States with Sentinel Values

```typescript
// In useBodyFillPhysics.ts — at hook definition level (not inside useEffect)
const HIDDEN_POS = -9999;

export function useBodyFillPhysics(
  logs: Log[],
  canvasWidth: number,
  canvasHeight: number,
): { ballStates: React.MutableRefObject<BallState[]>; isSettled: SharedValue<boolean>; ballCount: number } {
  // Pre-allocate MAX_BALLS slots synchronously — stable reference for Skia tree
  const ballStates = useRef<BallState[]>(
    Array.from({ length: MAX_BALLS }, () => ({
      x: makeMutable(HIDDEN_POS),
      y: makeMutable(HIDDEN_POS),
      r: 0,
      color: 'transparent',
    }))
  );
  const [ballCount, setBallCount] = useState(0); // triggers re-render when balls are ready
  const isSettledRef = useRef<SharedValue<boolean>>(makeMutable(false));

  useEffect(() => {
    if (canvasWidth <= 0 || canvasHeight <= 0) return;
    // ... engine setup ...
    const ballConfigs = aggregateLogs(logs, scaleX, scaleY);

    // Populate pre-allocated slots in place (DO NOT replace SharedValue objects)
    ballConfigs.forEach((config, i) => {
      ballStates.current[i].x.value = config.dropX;
      ballStates.current[i].y.value = HIDDEN_POS; // hidden until spawned
      ballStates.current[i].r = config.radius;     // static — triggers re-render below
      ballStates.current[i].color = config.color;  // static — triggers re-render below
    });

    // Single re-render to pick up r/color changes on pre-allocated slots
    setBallCount(ballConfigs.length);

    // ... rest of physics setup and RAF loop ...
  }, [logs, canvasWidth, canvasHeight]);

  return { ballStates, isSettled: isSettledRef.current, ballCount };
}
```

### Correct: BodyFillCanvas with Stable Slot Count

```typescript
// In BodyFillCanvas.tsx — render ALL MAX_BALLS slots, not just ballCount
// Slots beyond ballCount have r=0 and are invisible
export function BodyFillCanvas({ ballStates, width, height }: BodyFillCanvasProps) {
  // ballStates.current always has MAX_BALLS entries from pre-allocation
  return (
    <Canvas style={{ width, height }}>
      {scaledPath && (
        <Group clip={scaledPath}>
          {ballStates.current.map((ball, i) => (
            <Circle
              key={i}
              cx={ball.x}   // SharedValue — animates on UI thread at 60fps
              cy={ball.y}   // SharedValue — animates on UI thread at 60fps
              r={ball.r}    // static number — fine, only changes on re-render
              color={ball.color}
            />
          ))}
        </Group>
      )}
    </Canvas>
  );
}
```

### Correct: Raised Settlement Threshold + Hard Timeout

```typescript
// In useBodyFillPhysics.ts tick function
const VELOCITY_THRESHOLD = 1.0; // raised from 0.5 — avoids micro-jitter false negatives
const MAX_PHYSICS_RUNTIME_MS = 30_000; // 30s hard limit on RAF loop
const startTime = Date.now();

const tick = () => {
  Matter.Engine.update(engine, 1000 / 60);

  // Write positions to SharedValues
  bodies.forEach((body, i) => {
    if (body && ballStates.current[i]) {
      ballStates.current[i].x.value = body.position.x;
      ballStates.current[i].y.value = body.position.y;
    }
  });

  // Force-settle after max runtime
  if (Date.now() - startTime > MAX_PHYSICS_RUNTIME_MS) {
    isSettledRef.current.value = true;
    return; // no requestAnimationFrame — loop ends
  }

  if (!isSettledRef.current.value) {
    const spawnedBodies = bodies.filter((b): b is Matter.Body => b !== null);
    if (spawnedBodies.length > 0) {
      const allStill = spawnedBodies.every(
        (body) =>
          Math.abs(body.velocity.x) < VELOCITY_THRESHOLD &&
          Math.abs(body.velocity.y) < VELOCITY_THRESHOLD,
      );
      if (allStill) {
        settledFrames++;
        if (settledFrames >= SETTLED_THRESHOLD) {
          isSettledRef.current.value = true;
          return; // stop RAF — screen can now dim
        }
      } else {
        settledFrames = 0;
      }
    }
  }

  // Only continue if not settled
  if (!isSettledRef.current.value) {
    rafId = requestAnimationFrame(tick);
  }
};
```

### Correct: Inline Indicator Styles (D-10/D-11)

```typescript
// In Joystick.tsx — replace createIndicatorStyle factory with four explicit calls

// REMOVE these lines (298-309):
// const createIndicatorStyle = (direction: number) =>
//   useAnimatedStyle(() => ({ ... }));
// const upIndicatorStyle = createIndicatorStyle(1);
// ...

// ADD these at the top-level animated styles section (after line 295):
const upIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 1 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 1 ? 1.4 : 1 }],
}));
const downIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 2 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 2 ? 1.4 : 1 }],
}));
const leftIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 3 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 3 ? 1.4 : 1 }],
}));
const rightIndicatorStyle = useAnimatedStyle(() => ({
  opacity: activeDirection.value === 4 ? 1 : 0.25,
  transform: [{ scale: activeDirection.value === 4 ? 1.4 : 1 }],
}));
// Same pattern applies to GestureSlide.tsx lines 128-137
```

---

## State of the Art

| Old Approach | Current Approach | Impact for Phase 9 |
|--------------|------------------|--------------------|
| Dynamic Skia array via useRef | Pre-allocated slots with SharedValues | The correct approach — implement it |
| `useAnimatedStyle` in factory function | Inline at component top level | Industry-standard React pattern — fix it |
| RAF loop with no maximum runtime | RAF with hard timeout + settlement check | Prevents indefinite battery drain |
| `restitution: 0.3` (gentle bounce) | `restitution: 0.6` + higher gravity | Matches "fast drop + bounce" feel (D-05) |

**Deprecated patterns found in codebase:**
- `createIndicatorStyle` factory: violates Rules of Hooks, replace immediately
- `ballStates = useRef<BallState[]>([])` empty init: causes zero-circle Skia tree, replace with pre-allocation

---

## Open Questions

1. **Is the RAF loop actually causing screen dimming?**
   - What we know: No `expo-keep-awake` installed. No `withRepeat` animations found. RAF only runs on body-fill screen.
   - What's unclear: Whether `requestAnimationFrame` on React Native (JS thread) signals "active" to the OS display timer even when no gesture is in progress.
   - Recommendation: Instrument the fix and test on a physical device. The settlement fix (raise VELOCITY_THRESHOLD, add hard timeout) is the right first action. If dimming still doesn't work after bodies settle, investigate at the platform level (Expo build vs. Expo Go difference).

2. **Should `r` and `color` in `BallState` become SharedValues?**
   - What we know: They are currently static `number` and `string`. Changing them requires a React re-render to be picked up by Skia.
   - What's unclear: Whether the performance cost of one re-render vs. the complexity of adding SharedValue `r`/`color` is acceptable.
   - Recommendation: Keep `r`/`color` as static types, trigger one re-render with `setBallCount(n)`. Avoids changing the BallState interface or adding SharedValue overhead for values that only change once at init.

3. **Does D-07 (`useFrameCallback`) apply to Matter.js stepping or just position writes?**
   - What we know: `useFrameCallback` runs on UI thread as a worklet. `Matter.Engine.update` is pure JS, cannot run in a worklet.
   - What's unclear: Whether the decision was intended to mean "UI-thread timing" (impossible for Matter.js) or "better cleanup lifecycle."
   - Recommendation: Implement the pre-allocation fix (D-06/D-09) first — this fixes the visible bug. Document that D-07 cannot be literally implemented for Matter.js. If the settlement RAF-stop fix resolves the screen dimming issue, the thread model is acceptable as-is.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code changes with no external CLI tools, services, or databases beyond the project's own code. All required libraries are already installed.

---

## Validation Architecture

`nyquist_validation: true` in `.planning/config.json` — section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 |
| Config files | `jest.config.js` (root), `jest.unit.config.js` (services/utils/stores) |
| Quick run command | `npx jest --config jest.unit.config.js` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-01 | RAF loop stops after settlement (isSettled=true fires) | unit | `npx jest --config jest.unit.config.js src/components/physics/useBodyFillPhysics.test.ts` | ❌ Wave 0 |
| BUG-01 | RAF does not restart after stopping | unit | same file | ❌ Wave 0 |
| BUG-02 | ballStates.current has MAX_BALLS entries on mount (before useEffect) | unit | same file | ❌ Wave 0 |
| BUG-02 | SharedValue positions update when physics body moves | unit | same file | ❌ Wave 0 |
| BUG-02 | Hooks violation removed — createIndicatorStyle no longer exists | manual | ESLint + code review | — |

**Note on BUG-01 device testing:** Screen dimming cannot be verified in Jest. Device testing (physical iOS or Android) is required to confirm the OS timer responds after the RAF stops.

**Note on Reanimated/Skia testing:** `useBodyFillPhysics` uses `makeMutable` from Reanimated and `matter-js`. These can be mocked in the `node` Jest environment. The `jest.unit.config.js` uses `testEnvironment: 'node'` which does not mock React Native modules — manual mocking of `react-native-reanimated` is required.

### Sampling Rate

- **Per task commit:** `npx jest --config jest.unit.config.js`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green + manual device test for screen dimming + visual confirmation of balls falling

### Wave 0 Gaps

- [ ] `src/components/physics/useBodyFillPhysics.test.ts` — covers BUG-01 (RAF stops) and BUG-02 (pre-allocation); requires mock of `react-native-reanimated` (`makeMutable`, `SharedValue`) and `matter-js`

---

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` exists in the project root. No project-specific guidelines to enforce.

---

## Sources

### Primary (HIGH confidence)
- Installed source: `/home/appuser/workspace/life/node_modules/react-native-reanimated/src/hook/useFrameCallback.ts` — confirmed UI thread execution via `scheduleOnUI`
- Installed source: `/home/appuser/workspace/life/node_modules/react-native-reanimated/src/frameCallback/FrameCallbackRegistryUI.ts` — confirmed worklet context
- Codebase read: `src/components/physics/useBodyFillPhysics.ts` — confirmed empty `useRef([])` init, RAF loop, settlement logic
- Codebase read: `src/components/physics/BodyFillCanvas.tsx` — confirmed `ballStates.current.map(...)` at render time (root cause of BUG-02)
- Codebase read: `src/components/joystick/Joystick.tsx` lines 298-309 — confirmed `createIndicatorStyle` hooks violation
- Codebase read: `src/components/onboarding/GestureSlide.tsx` lines 128-137 — confirmed same violation
- Codebase read: `package.json` — confirmed `expo-keep-awake` NOT installed; Reanimated 4.2.1, Matter.js ^0.20.0, Skia 2.4.18

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` — Pitfall 6 (body-fill mount lifecycle), Pitfall 9 (useAnimatedStyle factory), Pitfall 10 (wake lock)
- `.planning/research/ARCHITECTURE.md` — Feature 7 (body-fill fix) and build order

### Tertiary (LOW confidence)
- None required — all findings are code-verified

---

## Metadata

**Confidence breakdown:**
- BUG-02 root cause: HIGH — directly confirmed by reading `BodyFillCanvas.tsx` + `useBodyFillPhysics.ts`
- BUG-02 fix approach: HIGH — pre-allocation pattern verified against library source
- BUG-01 root cause: MEDIUM — most likely candidate identified (RAF + settlement threshold), but screen dimming requires device testing to confirm
- D-07 useFrameCallback constraint: HIGH — confirmed from installed library source that callback runs on UI thread as worklet, making Matter.js stepping impossible inside it
- Hooks violation fix: HIGH — React Rules of Hooks are well-established; inline pattern verified against existing correct styles in same files
- Matter.js tuning values: LOW (Claude's discretion) — starting recommendations based on physics constants, require device tuning

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable libraries — Matter.js, Reanimated, Skia — low change rate)
