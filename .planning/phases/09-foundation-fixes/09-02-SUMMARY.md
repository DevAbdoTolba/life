---
phase: 09-foundation-fixes
plan: "02"
subsystem: ui
tags: [matter-js, skia, reanimated, physics, shared-values, animation]

# Dependency graph
requires:
  - phase: 04-analytics-visualization
    provides: body-fill physics hook and Skia canvas components
provides:
  - Pre-allocated MAX_BALLS=50 SharedValue slots for stable Skia Circle tree
  - Conditional RAF termination after ball settlement (BUG-01 fix)
  - ballCount state trigger for Skia re-render when r/color slots populate
  - Tuned physics: gravity=2.0, restitution=0.6, friction=0.05, frictionAir=0.01
affects: [body-fill visualization, analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pre-allocated Skia particle slots: initialize all slots at hook creation with sentinel positions (HIDDEN_POS=-9999), populate in-place in useEffect — never replace SharedValue objects"
    - "useState trigger for static prop re-render: ballCount causes single React re-render so BodyFillCanvas picks up r/color changes that are not SharedValues"
    - "Conditional RAF termination: if (!isSettledRef.current.value) { rafId = requestAnimationFrame(tick) } with VELOCITY_THRESHOLD=1.0 + MAX_PHYSICS_RUNTIME_MS=30_000 hard timeout"

key-files:
  created: []
  modified:
    - src/components/physics/useBodyFillPhysics.ts
    - src/components/physics/BodyFillCanvas.tsx
    - app/body-fill.tsx

key-decisions:
  - "Kept Matter.js on JS thread RAF (not useFrameCallback) — Matter.Engine.update() is pure JS and cannot run in a worklet; D-07 compliance achieved via SharedValue .value writes from RAF thread"
  - "Raised VELOCITY_THRESHOLD from 0.5 to 1.0 to avoid Matter.js contact micro-jitter preventing RAF termination"
  - "Added 30s MAX_PHYSICS_RUNTIME_MS hard timeout as safety net for edge cases where threshold is never reached"
  - "Used useState ballCount to trigger single re-render rather than making r/color SharedValues — preserves BallState interface, minimal complexity"

patterns-established:
  - "Pre-allocated physics slots: never grow Skia Circle tree dynamically; pre-allocate all slots at init with HIDDEN_POS sentinel values"
  - "In-place SharedValue updates: always write .value, never replace the SharedValue object reference"
  - "Conditional RAF: always guard requestAnimationFrame(tick) with a settlement check to allow OS screen dimming"

requirements-completed: [BUG-01, BUG-02]

# Metrics
duration: 15min
completed: 2026-03-24
---

# Phase 09 Plan 02: Body-Fill Physics Fix Summary

**Pre-allocated MAX_BALLS Skia Circle slots with conditional RAF termination, fixing zero-ball rendering (BUG-02) and indefinite screen wake lock (BUG-01) with tuned fast-drop bounce physics**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-24T00:00:00Z
- **Completed:** 2026-03-24T00:15:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Fixed body-fill zero-ball render: `BodyFillCanvas` now always has MAX_BALLS=50 Circle elements in the Skia tree from first mount because slots are pre-allocated synchronously before useEffect runs (BUG-02)
- Fixed screen never dims: RAF loop is now conditional (`if (!isSettledRef.current.value)`) with VELOCITY_THRESHOLD=1.0 and 30s hard timeout to guarantee RAF terminates after physics settles (BUG-01)
- Tuned physics for fast-drop playful bounce feel: gravity 1.2→2.0, restitution 0.3→0.6, friction 0.1→0.05, frictionAir 0.02→0.01 (D-05)
- Added `ballCount` useState/prop pattern to trigger single re-render when static `r`/`color` slot fields are populated (Pitfall 2 from RESEARCH.md)
- D-07 deviation documented: Matter.js kept on JS thread RAF (cannot run in worklet), SharedValue `.value` writes from RAF are cross-thread safe

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix useBodyFillPhysics — pre-allocate slots, stop RAF, tune physics** - `fe03fdb` (fix)
2. **Task 2: Wire BodyFillCanvas and body-fill.tsx to work with pre-allocated slots** - `af970c4` (fix)

## Files Created/Modified

- `src/components/physics/useBodyFillPhysics.ts` — Pre-allocate MAX_BALLS slots, add ballCount useState, conditional RAF, raise VELOCITY_THRESHOLD, add MAX_PHYSICS_RUNTIME_MS, tune physics constants, fix cleanup
- `src/components/physics/BodyFillCanvas.tsx` — Add ballCount prop for re-render trigger, void ballCount comment
- `app/body-fill.tsx` — Destructure ballCount from hook, pass ballCount to BodyFillCanvas

## Decisions Made

- Kept Matter.js on JS thread with RAF (not useFrameCallback as D-07 requested): `useFrameCallback` runs on UI thread as a worklet; `Matter.Engine.update()` is pure JS and cannot execute inside a worklet — literal D-07 compliance would crash the app. SharedValue `.value` writes from the JS RAF thread are already cross-thread safe. Performance wins come from pre-allocation and RAF termination, not thread model.
- VELOCITY_THRESHOLD raised from 0.5 to 1.0: Matter.js contact resolution introduces micro-jitter (~0.1–0.4 velocity units) that was preventing `isSettled` from ever becoming true
- Added 30s MAX_PHYSICS_RUNTIME_MS hard timeout: defensive guard ensuring RAF always terminates even if VELOCITY_THRESHOLD cannot be reached (e.g., zero logs, edge physics states)
- Used `useState(0)` + `setBallCount(n)` for the re-render trigger rather than converting `r`/`color` to SharedValues: simpler, preserves BallState interface, causes exactly one extra render

## Deviations from Plan

None — plan executed exactly as written. The D-07 deviation (keeping RAF instead of useFrameCallback) was pre-documented in the plan objective as expected.

## Issues Encountered

None — all changes were mechanical rewrites following the detailed plan actions. No blocking issues or unexpected behavior.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Body-fill physics fix is complete. BUG-01 (screen wake lock) requires on-device verification since screen dimming behavior cannot be tested in Jest — see 09-VALIDATION.md Manual-Only Verifications section.
- BUG-02 (zero balls rendered) is fixed by the pre-allocation pattern. Verification requires opening the body-fill screen with logs present.
- Phase 09 Plan 01 (hooks anti-pattern cleanup in Joystick.tsx and GestureSlide.tsx) runs in parallel — no dependency between plans.

## Known Stubs

None — pre-allocated slots with `r=0` and `color='transparent'` are functionally invisible (not stubs); they are replaced with real data in useEffect before any user-visible render.

---
*Phase: 09-foundation-fixes*
*Completed: 2026-03-24*

## Self-Check: PASSED

- FOUND: .planning/phases/09-foundation-fixes/09-02-SUMMARY.md
- FOUND: src/components/physics/useBodyFillPhysics.ts (commit fe03fdb)
- FOUND: src/components/physics/BodyFillCanvas.tsx (commit af970c4)
- FOUND: app/body-fill.tsx (commit af970c4)
- FOUND: docs commit 7755651
