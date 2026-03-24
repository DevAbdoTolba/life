# Phase 9: Foundation Fixes - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix three shipped-but-broken behaviors: screen never dims (battery drain), body-fill physics balls never render, and a rules-of-hooks violation in the joystick indicator styles that blocks safe extension with new animated styles. Requirements: BUG-01, BUG-02.

</domain>

<decisions>
## Implementation Decisions

### Screen Wake Lock (BUG-01)
- **D-01:** Always allow normal OS screen dimming — no wake lock at all
- **D-02:** Root cause is unknown — no `expo-keep-awake` is installed, yet screen never dims. Investigate RAF loop in `useBodyFillPhysics.ts`, continuous Reanimated animations, or other causes. Find and fix whatever prevents dimming.
- **D-03:** Do NOT install `expo-keep-awake` — the goal is to remove the problem, not manage it

### Body-Fill Physics (BUG-02)
- **D-04:** Performance is the #1 priority — must work smoothly on any device, not just high-end
- **D-05:** Ball behavior: fast drop with satisfying bounce at the bottom — playful, energetic feel
- **D-06:** Pre-allocate all ball SharedValue slots at init (stable Skia Circle tree, no dynamic array growth)
- **D-07:** Move physics tick from JS RAF loop to Reanimated `useFrameCallback` for UI-thread execution
- **D-08:** Ball aggregation (ADR-026) stays in place to cap memory on high log counts
- **D-09:** Root cause: `BodyFillCanvas` reads `ballStates.current` (useRef) at mount time when array is empty — zero Circle elements rendered, physics runs invisibly. Fix must ensure Skia tree has all Circle elements before physics starts.

### Hooks Anti-Pattern Cleanup
- **D-10:** Fix `createIndicatorStyle` violation in BOTH `Joystick.tsx` (lines 298-309) AND `GestureSlide.tsx` (lines 128-137)
- **D-11:** Inline all four `useAnimatedStyle` calls at component top level — no factory function wrapping hooks

### Claude's Discretion
- Exact Matter.js restitution/friction values for the "fast drop + bounce" feel
- Whether to use `useState` trigger or pre-allocation pattern for the body-fill fix (whichever performs better)
- RAF cleanup approach for the wake lock investigation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Body-Fill Physics
- `src/components/physics/BodyFillCanvas.tsx` — Skia canvas rendering balls, mount lifecycle bug location
- `src/components/physics/useBodyFillPhysics.ts` — Matter.js engine, RAF loop (lines 132-170), SharedValue population
- `app/body-fill.tsx` — Screen component that wires physics hook to canvas
- `src/constants/bodyPath.ts` — SVG body silhouette path

### Joystick & Hooks
- `src/components/joystick/Joystick.tsx` — Lines 298-309: `createIndicatorStyle` hooks violation; lines 96-118: SharedValue patterns; lines 269-295: correct animated style examples
- `src/components/onboarding/GestureSlide.tsx` — Lines 128-137: same `createIndicatorStyle` anti-pattern

### Project Decisions
- `.planning/PROJECT.md` — ADR-025 (simplified physics boundary), ADR-026 (ball aggregation)
- `.planning/research/PITFALLS.md` — Pitfall 6 (body-fill mount lifecycle), Pitfall 10 (wake lock strategy)
- `.planning/research/ARCHITECTURE.md` — Body-fill fix approach and recommended build order

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useBodyFillPhysics.ts`: Matter.js engine setup, ball config aggregation, settlement tracking — keep physics logic, fix rendering bridge
- `BodyFillCanvas.tsx`: Skia Canvas + Group clip with scaled body path — rendering shell is correct, just needs stable Circle tree
- Joystick animated styles (lines 269-295): correct top-level `useAnimatedStyle` pattern to follow for refactor

### Established Patterns
- SharedValues created via `useSharedValue()` at component top level
- Worklet code reads/writes `.value` directly; JS callbacks via `runOnJS()`
- `withSpring()` for snap-back, `withTiming()` for linear transitions
- `interpolateColor()` for color blending in animated styles
- `Gesture.Simultaneous()` for composed Pan+LongPress

### Integration Points
- `body-fill.tsx` screen: wires `useBodyFillPhysics` → `BodyFillCanvas` via shared `ballStates` ref
- Joystick.tsx: indicator styles feed into 4 `Animated.View` direction indicators
- GestureSlide.tsx: same indicator pattern for onboarding tutorial

</code_context>

<specifics>
## Specific Ideas

- User emphasized body-fill must be "the most performance" — work on any device, not just flagship
- Fast drop + bounce feel — playful and energetic, not calm/gentle
- Screen dimming: just let the OS handle it normally, no wake lock management at all

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-foundation-fixes*
*Context gathered: 2026-03-24*
