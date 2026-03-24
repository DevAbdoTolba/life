# Phase 10: Gesture Interaction Overhaul - Research

**Researched:** 2026-03-24
**Domain:** React Native Gesture Handler v2 + Reanimated v3 — LongPress branching, SharedValue state, animated glow rings, radial fan geometry
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Distinguish center hold from directional hold by knob displacement when LongPress fires. If knob is within ~15px of center, it's a center hold (note toggle). If past threshold, it's a directional hold (target fan).
**D-02:** Center hold triggers vibration and toggles note-mode state on/off. No target menu appears.
**D-03:** Directional hold reveals target fan in the swipe direction.
**D-04:** If a directional hold is released back at center (knob returns to middle), it cancels — no entry logged, no target selected. Clean escape.
**D-05:** When note mode is active, the knob gets a pulsing glow ring in accent color. Disappears when toggled off.
**D-06:** Note mode persists across swipes until explicitly toggled off by another center hold.
**D-07:** Completing a swipe only opens NoteEntryModal if note mode is currently active. Plain swipes without prior center-hold never prompt for notes.
**D-08:** Current behavior (every handleSwipe sets pendingLogId) must be gated behind note-mode state.
**D-09:** Targets fan at 30-degree fixed intervals from the swipe direction.
**D-10:** Maximum 3 active targets per direction. Users can create many targets but only 3 are active at a time. The fan shows active targets only.
**D-11:** Active target management (milestone logic, choosing which are "next") is deferred to a future phase.

### Claude's Discretion

- Exact distance threshold for center vs directional detection (suggested ~15px, can tune)
- Glow pulse animation timing and intensity for note mode indicator
- How "active target" state is stored/managed in targetStore (minimal implementation for 3-target cap)

### Deferred Ideas (OUT OF SCOPE)

- **Active target milestone logic** — User wants targets to rotate (e.g., "next 3" or milestone-based selection). New capability — belongs in a future phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BUG-03 | Center hold vibrates only (toggles note mode) — does not show targets | D-01/D-02: branch on `Math.sqrt(tx²+ty²) < CENTER_HOLD_THRESHOLD` in `longPressGesture.onStart`; `isHolding` SharedValue plus new `noteModeActive` SharedValue; `Haptics.impactAsync(Heavy)` only, no `setRadialVisible(true)` |
| BUG-04 | Directional hold shows targets fanned at 30° intervals from swipe direction | D-03/D-09/D-10: replace `RADIAL_ARC_SPAN` fan math with fixed 30° step; cap `getTargetsByPillar` result at 3 in new `getActiveTargetsByPillar` selector |
| UX-01 | Notes only prompted when center-hold note mode is active, not on every swipe | D-07/D-08: gate `setTimeout(() => setPendingLogId(logId), 50)` behind `noteModeActive` param passed into `useSwipeLog.handleSwipe` |
</phase_requirements>

---

## Summary

Phase 10 is a pure behavior-logic fix within the joystick subsystem. No new screens, no new components — only modified behavior in five existing files. The core change is splitting the current monolithic `handleHoldStart` path into two branches: center-hold (note toggle, no menu) and directional-hold (target fan, no note). The note-entry gate (UX-01) is a one-line change to `useSwipeLog` — `pendingLogId` must only be set when `noteModeActive` is true.

The codebase is already very close to the correct design. All animation primitives (`useSharedValue`, `withRepeat`, `withSequence`, `withTiming`, `runOnJS`), haptic APIs, and radial geometry helpers are in place. The work is additive branching logic and replacing one fan-calculation algorithm.

The most architecturally important decision is **where `noteModeActive` state lives**. It must be readable from both the worklet side (to suppress `handleHoldStart` for center) and from the JS side (to gate `setPendingLogId`). The right approach is a `useSharedValue(0)` for animation-side reads and a parallel `useState(false)` (or Zustand slice) for JS-side reads — bridged via `runOnJS` when center-hold fires. Alternatively, a single `useRef<boolean>` on the JS side works fine because the glow animation state can be driven by a separate SharedValue while mode truth lives in the ref.

**Primary recommendation:** Add `noteModeActive: SharedValue<number>` plus a `useRef<boolean>` (or `useState`) to `Joystick.tsx`; pass the ref/state to `useSwipeLog`; add `CENTER_HOLD_THRESHOLD = 15` and `MAX_ACTIVE_TARGETS = 3` to constants; replace fan math in `useRadialMenu`; add `getActiveTargetsByPillar` selector to `targetStore`.

---

## Standard Stack

### Core (all already installed — no new packages required)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-native-gesture-handler | ~2.30.0 | `Gesture.LongPress()` + `Gesture.Simultaneous()` | Project ADR-016; RNGH v2 API already in use |
| react-native-reanimated | 4.2.1 | SharedValues, `useAnimatedStyle`, `withRepeat`, `withSequence` | Project standard; all animation already using v3+ API |
| expo-haptics | ~55.0.9 | `Haptics.impactAsync(Heavy/Medium)` | Already used in `useSwipeLog.ts` |
| zustand | ^5.0.12 | `targetStore` selector addition | Already used throughout the app |

**No new installations required.** All libraries are present and configured.

---

## Architecture Patterns

### How the Current Hold Path Works (to understand what changes)

`longPressGesture.onStart` currently:
1. Sets `isHolding.value = 1`
2. Reads current `translateX.value` / `translateY.value` to derive direction
3. Calls `runOnJS(handleHoldStart)(dir)` — which sets `radialVisible = true`

The bug: step 2 computes direction but never checks *distance from center*. When the user holds at center, distance ≈ 0 so direction is arbitrary, yet `handleHoldStart` fires and shows the radial menu.

### Pattern 1: Center vs Directional Branch in LongPress.onStart

**What:** Read `translateX.value` and `translateY.value` in the worklet, compute `dist = Math.sqrt(tx² + ty²)`. If `dist < CENTER_HOLD_THRESHOLD` → center-hold path. Otherwise → directional-hold path.

**When to use:** Always — this is the single branching point that fixes BUG-03 and BUG-04 simultaneously.

```typescript
// Source: existing Joystick.tsx longPressGesture.onStart — add branch
.onStart(() => {
  if (isProcessing.value === 1) return;
  isHolding.value = 1;

  const tx = translateX.value;
  const ty = translateY.value;
  const dist = Math.sqrt(tx * tx + ty * ty);

  if (dist < CENTER_HOLD_THRESHOLD) {
    // CENTER HOLD — toggle note mode, no radial menu
    runOnJS(handleCenterHold)();
  } else {
    // DIRECTIONAL HOLD — show target fan
    // (existing direction-detection + runOnJS(handleHoldStart)(dir))
    let deg = Math.atan2(-ty, tx) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    let dir: SwipeDirection = 'up';
    if (deg >= 315 || deg < 45) dir = 'right';
    else if (deg >= 45 && deg < 135) dir = 'up';
    else if (deg >= 135 && deg < 225) dir = 'left';
    else dir = 'down';
    runOnJS(handleHoldStart)(dir);
  }
})
```

### Pattern 2: Note Mode State — Dual Representation

**What:** Note mode needs to be readable in two contexts:
1. **Animation (worklet):** `noteModeGlow` SharedValue drives the pulsing ring opacity — `withRepeat(withSequence(...))` runs on UI thread
2. **JS logic:** `handleSwipe` in `useSwipeLog` needs to know mode state to gate `setPendingLogId`

**Recommended approach:** Keep animation state in a `useSharedValue(0)` named `noteModeGlow`. Keep mode truth in a `useRef<boolean>(false)` named `noteModeRef`. Toggle both in `handleCenterHold` (a JS callback). Pass `noteModeRef` into `useSwipeLog` as a parameter.

**Why ref over state:** `noteModeActive` doesn't need to trigger a re-render. It's checked in `handleSwipe` (already async). A ref avoids spurious re-renders. The visual response (glow ring) comes from the SharedValue, not from React state.

```typescript
// In Joystick.tsx
const noteModeGlow = useSharedValue(0); // 0=off, 1=on (drives pulse animation)
const noteModeRef = useRef(false);      // truth for JS gating

const handleCenterHold = useCallback(() => {
  noteModeRef.current = !noteModeRef.current;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  if (noteModeRef.current) {
    noteModeGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 })
      ),
      -1,
      true
    );
  } else {
    noteModeGlow.value = withTiming(0, { duration: 200 });
  }
}, [noteModeGlow]);
```

### Pattern 3: Note Glow Ring — Absolutely Positioned Animated View

**What:** A circular `Animated.View` positioned absolutely centered on the knob. Driven by `noteModeGlow` SharedValue for opacity. Must be rendered inside the knob's parent (the `outerRing` `Animated.View`) to inherit knob translation — or positioned relative to the knob's `Animated.View` directly.

**Critical z-index ordering:**
- `flashOverlay`: zIndex 5 (below knob)
- Indicator dots: zIndex 1
- Knob: zIndex 10
- Glow ring: zIndex 9 (below knob text/emoji, above everything else on knob's layer)

**Ring dimensions per UI-SPEC:** outer diameter = KNOB_SIZE + 8 = 64px, borderWidth 2px, borderColor `colors.accent`, borderRadius 32px.

```typescript
// New useAnimatedStyle for the glow ring
const noteGlowStyle = useAnimatedStyle(() => ({
  opacity: noteModeGlow.value,
}));

// Render: inside knob Animated.View, absolutely positioned
<Animated.View
  style={[
    styles.noteGlowRing,
    noteGlowStyle,
  ]}
  pointerEvents="none"
/>

// Style:
noteGlowRing: {
  position: 'absolute',
  width: KNOB_SIZE + 8,   // 64px
  height: KNOB_SIZE + 8,  // 64px
  borderRadius: (KNOB_SIZE + 8) / 2, // 32px
  borderWidth: 2,
  borderColor: colors.accent,  // #F5A623
  top: -4,   // centers the ring on the 56px knob
  left: -4,
  zIndex: 9,
}
```

**Placement decision:** Render the glow ring inside the same `Animated.View` as the knob (the one with `knobAnimatedStyle`). This way the ring translates with the knob automatically — no extra SharedValue math needed.

### Pattern 4: Fixed 30° Fan Geometry

**What:** Replace the current proportional-step fan (`RADIAL_ARC_SPAN / (n - 1)`) with a fixed 30° interval centered on the swipe direction.

**Current algorithm (to replace):**
```typescript
const startAngle = baseAngle - RADIAL_ARC_SPAN / 2;  // RADIAL_ARC_SPAN = 120
const step = n > 1 ? RADIAL_ARC_SPAN / (n - 1) : 0;
```

**New algorithm:**
```typescript
// Fixed 30° step regardless of count
// n=1: single bubble at baseAngle
// n=2: baseAngle ± 15° (30° total)
// n=3: baseAngle - 30°, baseAngle, baseAngle + 30° (60° total)
const STEP = 30;
const startOffset = n === 1 ? 0 : -STEP * Math.floor(n / 2);
return targets.map((target, idx) => {
  const angle = baseAngle + startOffset + STEP * idx;
  // ... rest unchanged
});
```

Note: With n=2, `startOffset = -30` gives angles [baseAngle-30, baseAngle]. But per UI-SPEC the 2-target case should be `center±15°` (i.e., `[baseAngle-15, baseAngle+15]`). The correct formula for symmetric layout:

```typescript
// Symmetric centering: spread = (n-1) * STEP; start = baseAngle - spread/2
const STEP_DEG = 30;
const spread = (n - 1) * STEP_DEG;           // n=1→0, n=2→30, n=3→60
const startAngle = baseAngle - spread / 2;    // symmetric center
return targets.map((target, idx) => {
  const angle = startAngle + STEP_DEG * idx;
  // ...
});
```

This matches UI-SPEC exactly:
- n=1: angle = baseAngle (single at center)
- n=2: angles = [baseAngle-15, baseAngle+15]
- n=3: angles = [baseAngle-30, baseAngle, baseAngle+30]

### Pattern 5: Active Target Selector (3-cap)

**What:** Add `getActiveTargetsByPillar` to `targetStore`. Returns the first 3 active targets for a pillar. "First 3" means `createdAt DESC` order (newest first) — the existing `loadTargets` query already orders by `created_at DESC`.

```typescript
// In targetStore — add to interface and implementation
getActiveTargetsByPillar: (pillarId: number) => Target[];

// Implementation
getActiveTargetsByPillar: (pillarId) => {
  return get()
    .targets
    .filter((t) => t.pillarId === pillarId && t.status === 'active')
    .slice(0, MAX_ACTIVE_TARGETS);  // MAX_ACTIVE_TARGETS = 3
},
```

`useRadialMenu` and `RadialMenu` must consume `getActiveTargetsByPillar` instead of `getTargetsByPillar`.

### Pattern 6: Cancel Escape (directional hold released at center)

**What:** If the knob returns to center (< 15px) during a directional hold before release, dismiss the radial menu and prevent logging.

**How:** The Pan `onEnd` handler already checks `isHolding.value`. Add a center-check condition: if `isHolding.value === 1` and `dist < CENTER_HOLD_THRESHOLD`, call `handleHoldCancel` (new callback) instead of `handleHoldEnd`.

```typescript
// In panGesture.onEnd — after existing hold-end path
} else if (isHolding.value === 1) {
  const dist = Math.sqrt(tx * tx + ty * ty);
  if (dist < CENTER_HOLD_THRESHOLD) {
    // Cancel escape — released at center during directional hold
    runOnJS(handleHoldCancel)();
  } else {
    runOnJS(handleHoldEnd)(tx, ty, dir);
  }
  isHolding.value = 0;
}
```

`handleHoldCancel` simply calls `setRadialVisible(false)` — no log, no note.

### Pattern 7: useSwipeLog Note-Mode Gate

**What:** `handleSwipe` must receive a `noteModeActive: boolean` (or readable ref) and only call `setPendingLogId` when it's true.

**Current behavior (to fix):**
```typescript
// Line 29 in useSwipeLog.ts — fires on EVERY swipe
setTimeout(() => setPendingLogId(logId), 50);
```

**Fixed behavior — two options:**

Option A (pass boolean param):
```typescript
const handleSwipe = useCallback(async (result: SwipeResult, targetId: string | null = null, noteMode: boolean = false) => {
  // ...existing...
  if (noteMode) {
    setTimeout(() => setPendingLogId(logId), 50);
  }
}, [addLog]);
```

Option B (pass ref to hook):
```typescript
export function useSwipeLog(pillarId: PillarId, noteModeRef: React.RefObject<boolean>) {
  // ...
  if (noteModeRef.current) {
    setTimeout(() => setPendingLogId(logId), 50);
  }
}
```

**Recommendation: Option A (pass boolean param).** Cleaner API. `Joystick.tsx` reads `noteModeRef.current` at call site and passes it as a primitive. `useSwipeLog` stays pure with no ref dependency.

### Anti-Patterns to Avoid

- **Don't use `useState` for `noteModeActive`:** Triggers re-render on every toggle. A `useRef` serves the gate without forcing a render cycle.
- **Don't animate the glow ring outside the knob's `Animated.View`:** If placed at outerRing level, requires complex offset math to follow knob translation. Placing it inside the knob view makes it translate for free.
- **Don't call `handleHoldStart` from center-hold path:** The radial menu must never appear for center hold. The branch must be exclusive.
- **Don't update `RADIAL_ARC_SPAN` constant and expect the math to fix itself:** The fan algorithm must also be replaced — just changing the constant with the old formula gives wrong spread for n=2.
- **Don't skip the cancel escape check:** If hold is released at center without the cancel guard, `handleHoldEnd` runs with near-zero tx/ty, which produces ambiguous hit detection results.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Repeating pulse animation | Manual interval or setInterval | `withRepeat(withSequence(...), -1, true)` | Already in the codebase; runs on UI thread; auto-cancels on unmount |
| Haptic feedback distinction | Custom vibration patterns | `Haptics.impactAsync(Heavy)` for center, `Medium` for directional | Expo Haptics maps to native UIImpactFeedbackGenerator; correct semantic weight |
| Fan position math | Custom trigonometry service | Extend `getTargetPositions()` in `useRadialMenu.ts` | All RADIAL_MENU_RADIUS and coordinate system handling already correct |
| State bridging worklet→JS | Shared mutable objects | `runOnJS()` | Only safe way to call JS from Reanimated worklet |
| Active target limit | Database query with LIMIT | In-memory `.slice(0, 3)` on already-loaded store | `loadTargets` already loads all; slice is instant; no SQL roundtrip needed |

---

## Common Pitfalls

### Pitfall 1: Glow Ring Translates with Knob — Wrong Parent
**What goes wrong:** The glow ring is placed as a sibling of the knob inside `outerRing`. Knob translates but ring stays fixed at center.
**Why it happens:** `knobAnimatedStyle` only applies to the knob's `Animated.View`. Siblings don't inherit transforms.
**How to avoid:** Place the ring *inside* the knob's `Animated.View` (as a child), not as a sibling.
**Warning signs:** Ring visible at center even when knob is dragged to edge.

### Pitfall 2: withRepeat Not Cancelling When Note Mode Turns Off
**What goes wrong:** After toggling note mode off, the glow ring continues pulsing.
**Why it happens:** `withRepeat` runs indefinitely; assigning `withTiming(0, ...)` to the same SharedValue cancels the prior animation in Reanimated v3+ (cancelAnimation is implicit on new assignment).
**How to avoid:** Assign `withTiming(0, { duration: 200 })` directly to `noteModeGlow.value` on toggle-off. Reanimated v3 cancels the ongoing animation when a new one is assigned. No explicit `cancelAnimation()` call needed.
**Verification:** Reanimated v3 (4.2.1) cancels in-progress animation when a new animation is started on the same SharedValue. Confirmed by Reanimated documentation behavior.

### Pitfall 3: LongPress.onStart Fires Before Pan Displacement Is Set
**What goes wrong:** User drags quickly then holds; at LongPress fire time, `translateX.value`/`translateY.value` may reflect an intermediate value, not the final position.
**Why it happens:** `Gesture.Simultaneous` runs both gestures in parallel; LongPress fires at exactly `HOLD_DURATION` (400ms) after gesture start. By 400ms, the knob is at the held position.
**How to avoid:** No fix needed — this is the correct behavior. The check reads `translateX.value` and `translateY.value` at the moment LongPress fires (400ms into the gesture), which is the current knob position. This is the intended center-vs-directional discriminator.
**Warning signs:** If user presses and immediately moves, the 400ms LongPress will fire when knob is displaced — correctly triggering directional hold.

### Pitfall 4: Cancel Escape Doesn't Clear Radial Menu
**What goes wrong:** User holds directionally, returns knob to center, releases — but radial menu stays visible.
**Why it happens:** `panGesture.onEnd` checks `isHolding.value` but the current code always calls `handleHoldEnd` (which calls `setRadialVisible(false)`) — unless the `dir` check fails first.
**How to avoid:** Add explicit `handleHoldCancel` path in `panGesture.onEnd` for the case where `isHolding === 1` and `dist < CENTER_HOLD_THRESHOLD`. This cleanly dismisses the menu without logging.

### Pitfall 5: getTargetsByPillar Still Used After Adding getActiveTargetsByPillar
**What goes wrong:** `RadialMenu.tsx` and `useRadialMenu.ts` import `getTargetsByPillar`, so the 3-cap doesn't take effect even after adding `getActiveTargetsByPillar`.
**Why it happens:** Two callsites — `useRadialMenu.ts` calls `getTargetsByPillar(pillarId)` and `RadialMenu.tsx` also calls `useRadialMenu`.
**How to avoid:** Update `useRadialMenu.ts` to call `getActiveTargetsByPillar` instead of `getTargetsByPillar`. `RadialMenu.tsx` consumes `useRadialMenu` so it gets the change for free.

### Pitfall 6: Note Mode Ref Not Reset on Component Unmount
**What goes wrong:** If `Joystick` unmounts and remounts (e.g., tab navigation), `noteModeRef.current` resets to `false` but the `noteModeGlow` SharedValue may be stale.
**Why it happens:** `useRef` resets on remount; `useSharedValue` also resets. No issue in practice.
**How to avoid:** No special handling needed — both reset on remount by default.

---

## Code Examples

### Full constants additions
```typescript
// Source: src/components/joystick/constants.ts — new entries
/** Distance from center (px) below which LongPress is treated as center hold */
export const CENTER_HOLD_THRESHOLD = 15;

/** Maximum active targets shown in radial fan */
export const MAX_ACTIVE_TARGETS = 3;
```

### Fixed fan geometry (useRadialMenu.ts replacement)
```typescript
// Source: src/components/joystick/useRadialMenu.ts — replace getTargetPositions body
const getTargetPositions = useCallback((direction: SwipeDirection): TargetPosition[] => {
  if (targets.length === 0) return [];

  let baseAngle = 0;
  switch (direction) {
    case 'up': baseAngle = 90; break;
    case 'left': baseAngle = 180; break;
    case 'down': baseAngle = 270; break;
    case 'right': baseAngle = 0; break;
  }

  const STEP_DEG = 30;
  const spread = (targets.length - 1) * STEP_DEG;
  const startAngle = baseAngle - spread / 2;

  return targets.map((target, idx) => {
    const angle = startAngle + STEP_DEG * idx;
    const angleRad = angle * (Math.PI / 180);
    return {
      target,
      x: RADIAL_MENU_RADIUS * Math.cos(angleRad),
      y: -RADIAL_MENU_RADIUS * Math.sin(angleRad),
      angle,
    };
  });
}, [targets]);
```

### Glow ring style and animated style
```typescript
// Source: src/components/joystick/Joystick.tsx — new additions
const noteModeGlow = useSharedValue(0);

const noteGlowStyle = useAnimatedStyle(() => ({
  opacity: noteModeGlow.value,
}));

// In StyleSheet:
noteGlowRing: {
  position: 'absolute',
  width: KNOB_SIZE + 8,
  height: KNOB_SIZE + 8,
  borderRadius: (KNOB_SIZE + 8) / 2,
  borderWidth: 2,
  borderColor: colors.accent,
  top: -4,
  left: -4,
  zIndex: 9,
  pointerEvents: 'none',
},
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cancelAnimation()` before new animation | New assignment auto-cancels in Reanimated v3 | Reanimated 3.0 | No explicit cancel needed before `withTiming(0)` |
| `Gesture.Race()` for exclusive gesture handling | `Gesture.Simultaneous()` + SharedValue branching | RNGH v2 | Both gestures fire; branch in onStart callbacks |

---

## Environment Availability

Step 2.6: SKIPPED — all dependencies are already installed. This phase is pure source code modification within the existing React Native + Expo stack. No external tools, services, or new runtimes are required.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Jest with jest-expo preset (native) + ts-jest (unit) |
| Config file | `jest.config.js` (root), `jest.unit.config.js` |
| Quick run command | `npx jest --testPathPattern="joystick" --passWithNoTests` |
| Full suite command | `npx jest --passWithNoTests` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| BUG-03 | Center hold does not call setRadialVisible | unit | `npx jest --testPathPattern="useSwipeLog\|Joystick" --passWithNoTests` | ❌ Wave 0 |
| BUG-03 | Center hold triggers Heavy haptic | unit | same | ❌ Wave 0 |
| BUG-04 | Fan at n=1: single bubble at baseAngle | unit | `npx jest --testPathPattern="useRadialMenu" --passWithNoTests` | ❌ Wave 0 |
| BUG-04 | Fan at n=2: bubbles at center±15° | unit | same | ❌ Wave 0 |
| BUG-04 | Fan at n=3: bubbles at center±30°, center | unit | same | ❌ Wave 0 |
| BUG-04 | getActiveTargetsByPillar caps at 3 | unit | `npx jest --testPathPattern="targetStore" --passWithNoTests` | ❌ Wave 0 |
| UX-01 | handleSwipe with noteMode=false does not set pendingLogId | unit | `npx jest --testPathPattern="useSwipeLog" --passWithNoTests` | ❌ Wave 0 |
| UX-01 | handleSwipe with noteMode=true does set pendingLogId | unit | same | ❌ Wave 0 |

**All tests are manual-only alternative if Wave 0 stubs are not created:** The gesture branching logic (center vs directional) and `noteModeGlow` pulse animation cannot be unit-tested without a full Reanimated + RNGH mock environment. The pure logic functions (fan geometry, store selector, useSwipeLog gate) CAN be unit-tested.

### Sampling Rate
- **Per task commit:** `npx jest --testPathPattern="joystick|targetStore" --passWithNoTests`
- **Per wave merge:** `npx jest --passWithNoTests`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/joystick/useRadialMenu.test.ts` — fan geometry: n=1, n=2, n=3 at each cardinal direction; covers BUG-04 geometry
- [ ] `src/components/joystick/useSwipeLog.test.ts` — note-mode gate: pendingLogId set only when noteMode=true; covers UX-01
- [ ] `src/stores/targetStore.test.ts` — getActiveTargetsByPillar caps at MAX_ACTIVE_TARGETS; covers BUG-04 store
- [ ] `src/components/joystick/NoteEntryModal.test.tsx` — expand from current stub to real modal visibility tests (logId truthy = visible)

Note: `useRadialMenu` and `useSwipeLog` are pure logic hooks with no native dependencies. They can be tested with ts-jest in the unit project (`jest.unit.config.js`), moving test files to `src/stores/` pattern or adding joystick to unit testMatch.

---

## Open Questions

1. **Existing `NoteEntryModal.test.tsx` is a stub — expand or leave?**
   - What we know: File exists at `src/components/joystick/NoteEntryModal.test.tsx` with a single `expect(true).toBe(true)` placeholder from Wave 0
   - What's unclear: Whether Phase 10 plan should expand it or leave it for a dedicated QA phase
   - Recommendation: Expand minimally to cover visibility gate (logId null → not visible, logId string → visible). This is low effort and covers the UX-01 surface.

2. **Note mode persistence across joystick instances**
   - What we know: 3 joysticks render on the home screen, one per pillar. Each `Joystick` is an independent component with its own `noteModeRef`
   - What's unclear: Should note mode on one joystick affect others? CONTEXT.md doesn't address cross-pillar persistence
   - Recommendation: Keep note mode per-joystick (local to each component). The CONTEXT.md says "note mode persists across swipes" — swipes on the same joystick. Cross-joystick coupling adds complexity with no stated benefit.

3. **Cancel escape edge case: center hold during directional hold**
   - What we know: D-04 says "if knob returns to center before release, cancel". But what if user center-holds and then moves directionally during the same gesture?
   - What's unclear: Can a center-hold gesture transition into a directional hold in a single gesture event?
   - Recommendation: No — LongPress fires once at 400ms. The branch is evaluated once. If the user holds at center, it's center-hold. They'd need to release and start a new gesture to get a directional hold.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `src/components/joystick/Joystick.tsx` — complete gesture setup, all SharedValues, all animated styles
- Direct code inspection: `src/components/joystick/useSwipeLog.ts` — pendingLogId gate, haptics usage
- Direct code inspection: `src/components/joystick/useRadialMenu.ts` — current fan algorithm, RADIAL_ARC_SPAN usage
- Direct code inspection: `src/components/joystick/constants.ts` — all dimension/timing constants
- Direct code inspection: `src/stores/targetStore.ts` — getTargetsByPillar implementation, active filter
- Direct code inspection: `src/components/joystick/RadialMenu.tsx` — bubble rendering, thumbPosition hover detection
- Direct code inspection: `src/components/joystick/NoteEntryModal.tsx` — modal trigger (logId), onClose pattern
- Direct code inspection: `package.json` — react-native-gesture-handler ~2.30.0, react-native-reanimated 4.2.1, expo-haptics ~55.0.9, zustand ^5.0.12
- Direct code inspection: `jest.config.js`, `jest.unit.config.js` — test framework configuration

### Secondary (MEDIUM confidence)
- `.planning/phases/10-gesture-interaction-overhaul/10-CONTEXT.md` — all decisions D-01 through D-11, UI-SPEC animation timing table
- `.planning/phases/10-gesture-interaction-overhaul/10-UI-SPEC.md` — precise animation specs, color values, z-index ordering
- `.planning/PROJECT.md` — ADR-013 (haptic + animation only), ADR-016 (Pan+LongPress composition)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries confirmed in package.json, all APIs confirmed in existing source
- Architecture: HIGH — all patterns derived from reading actual source, no speculation
- Pitfalls: HIGH — derived from direct analysis of the existing code paths and their interactions
- Test gaps: HIGH — confirmed by listing `src/components/joystick/` directory

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable React Native ecosystem; no breaking changes expected in this window)
