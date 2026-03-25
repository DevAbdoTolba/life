---
phase: 10-gesture-interaction-overhaul
plan: 02
subsystem: ui
tags: [react-native, reanimated, gestures, joystick, haptics, note-mode, radial-menu]

# Dependency graph
requires:
  - phase: 10-gesture-interaction-overhaul
    plan: 01
    provides: CENTER_HOLD_THRESHOLD constant, noteMode parameter on handleSwipe, getActiveTargetsByPillar selector
affects:
  - 11-hold-interaction-visuals (consumes Joystick.tsx hold branch)
provides:
  - Center-vs-directional hold branch in Joystick.tsx LongPress.onStart
  - noteModeRef (useRef) and noteModeGlow (SharedValue) for note mode state
  - handleCenterHold: Heavy haptic + pulsing amber glow ring toggle
  - handleHoldCancel: cancel escape dismisses radial menu without logging
  - noteMode wired into both handleSwipe call sites (swipe and hold paths)
  - noteGlowRing StyleSheet entry with KNOB_SIZE+8 amber border

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useRef(false) as JS-side truth for gesture-thread gating — avoids SharedValue reads in JS callbacks"
    - "withRepeat(-1, true) + withSequence for infinite oscillating pulse animation"
    - "dist < CENTER_HOLD_THRESHOLD guard in both longPress.onStart and panGesture.onEnd for center detection"

key-files:
  created: []
  modified:
    - src/components/joystick/Joystick.tsx

key-decisions:
  - "noteModeRef as useRef not SharedValue — JS callback reads it directly, no runOnJS overhead for gating"
  - "Cancel escape in panGesture.onEnd checks dist < CENTER_HOLD_THRESHOLD before dir check — catches cases where hold-released-at-center has dist=0 and dir=null"
  - "Glow ring placed inside knob Animated.View so it translates with knob movement"

patterns-established:
  - "Center hold at < 15px from center = toggle note mode (no radial menu shown)"
  - "Directional hold at >= 15px from center = show target fan"
  - "Cancel escape: release during hold with dist < 15px from center = dismiss, no log"

requirements-completed: [BUG-03, BUG-04, UX-01]

# Metrics
duration: 3min
completed: 2026-03-25
---

# Phase 10 Plan 02: Gesture Interaction Overhaul — Joystick Wiring Summary

**Center-vs-directional hold branch, note mode toggle with pulsing amber glow ring, cancel escape, and noteMode wired into all handleSwipe call sites in Joystick.tsx**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-25T07:28:41Z
- **Completed:** 2026-03-25T07:31:14Z
- **Tasks:** 1/2 (paused at human-verify checkpoint)
- **Files modified:** 1

## Accomplishments

- Replaced monolithic longPress.onStart with center-vs-directional branch using `dist < CENTER_HOLD_THRESHOLD`
- Added `handleCenterHold`: toggles `noteModeRef.current`, fires Heavy haptic, drives `noteModeGlow` SharedValue with `withRepeat(-1) + withSequence` pulse or fade-out
- Added `handleHoldCancel`: cancel escape that dismisses radial menu without logging when knob is released at center
- Added cancel escape check to `panGesture.onEnd` — `isHolding.value === 1` branch now checks `dist < CENTER_HOLD_THRESHOLD` first
- Passed `noteModeRef.current` as third argument to `handleSwipe` in both the quick-swipe path (`handleSwipeComplete`) and the hold-release path (`handleHoldEnd`)
- Added pulsing amber glow ring inside knob `Animated.View` — translates with the knob, driven by `noteGlowStyle`
- All 15 acceptance criteria verified; 28 unit tests pass (no regressions)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add center-hold branch, note mode state, glow ring, cancel escape, and noteMode wiring** - `73a420c` (feat)

_Task 2 is a `checkpoint:human-verify` — paused for device verification._

## Files Created/Modified

- `src/components/joystick/Joystick.tsx` - All 11 changes: imports, state, callbacks, gesture handlers, animated style, JSX, StyleSheet

## Decisions Made

- `noteModeRef = useRef(false)` rather than a SharedValue — the JS-side truth is read only in JS callbacks (`handleSwipeComplete`, `handleHoldEnd`), so a useRef avoids unnecessary SharedValue reads from JS thread
- Cancel escape check in `panGesture.onEnd` uses `isHolding.value === 1` (without requiring `dir`) because when the knob is at center, `dist < SWIPE_THRESHOLD` so `getSwipeDirection` returns `null` — the old `dir && isHolding.value === 1` condition would have silently dropped the cancel
- Glow ring placed inside knob `Animated.View` (not in the outer ring) so it moves with the knob as the user drags — visually correct

## Deviations from Plan

None — plan executed exactly as written. All 11 changes implemented as specified.

## Issues Encountered

- Pre-existing TypeScript error in `src/components/analytics/PillarDonutChart.tsx` (line 58: `valuesTextColor` prop not in type) — exists in main branch before this plan, out of scope per deviation rules. Logged here for visibility.

## Next Phase Readiness

- Task 1 complete and committed (`73a420c`)
- Awaiting human verification on device (Task 2 checkpoint)
- After approval, plan is fully complete — requirements BUG-03, BUG-04, UX-01 met
- Phase 11 (hold-interaction-visuals) can consume the center-vs-directional branch immediately

## Self-Check: PASSED

- src/components/joystick/Joystick.tsx: FOUND
- Commit 73a420c: FOUND

---
*Phase: 10-gesture-interaction-overhaul*
*Completed: 2026-03-25*
