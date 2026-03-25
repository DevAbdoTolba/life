---
phase: 10-gesture-interaction-overhaul
plan: 01
subsystem: ui
tags: [react-native, zustand, jest, gestures, radial-menu, joystick, hooks]

# Dependency graph
requires:
  - phase: 02-joystick-core
    provides: useRadialMenu, useSwipeLog, constants, targetStore
  - phase: 03-targets-goals
    provides: Target model, targetStore structure
provides:
  - CENTER_HOLD_THRESHOLD and MAX_ACTIVE_TARGETS constants in constants.ts
  - getActiveTargetsByPillar selector (active-only, capped at 3) in targetStore
  - computeFanPositions pure function (symmetric 30-degree fan geometry)
  - noteMode gate on useSwipeLog.handleSwipe (pendingLogId only set when noteMode=true)
  - Unit tests for all three logic changes (28 tests total)
affects:
  - 10-gesture-interaction-overhaul plan 02 (Joystick.tsx wiring)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Exported pure function alongside hook for unit testability (computeFanPositions)"
    - "Fixed 30-degree symmetric fan geometry: spread=(n-1)*30, startAngle=base-spread/2"
    - "Default-false noteMode parameter gates side effects without breaking existing callers"
    - "expo-crypto/expo-sqlite mocks in jest.unit.config.js for node test environment"

key-files:
  created:
    - src/components/joystick/useRadialMenu.test.ts
    - src/components/joystick/useSwipeLog.test.ts
    - src/__mocks__/expo-crypto.js
    - src/__mocks__/expo-sqlite.js
    - src/types/react-test-renderer.d.ts
  modified:
    - src/components/joystick/constants.ts
    - src/stores/targetStore.ts
    - src/stores/targetStore.test.ts
    - src/components/joystick/useRadialMenu.ts
    - src/components/joystick/useSwipeLog.ts
    - jest.unit.config.js

key-decisions:
  - "Export computeFanPositions as pure function alongside hook — enables direct unit testing without React environment"
  - "Hardcode .slice(0, 3) in getActiveTargetsByPillar with comment referencing MAX_ACTIVE_TARGETS to avoid circular dependency"
  - "noteMode defaults to false — backward-compatible; all existing handleSwipe callers unchanged"
  - "Add expo-crypto/expo-sqlite moduleNameMapper to jest.unit.config.js to unblock pre-existing test failures"

patterns-established:
  - "Fan geometry: n targets at 30-degree intervals symmetric around base direction angle"
  - "getActiveTargetsByPillar always returns status='active' targets only, capped at 3"

requirements-completed: [BUG-04, UX-01]

# Metrics
duration: 7min
completed: 2026-03-25
---

# Phase 10 Plan 01: Gesture Interaction Overhaul — Foundation Summary

**getActiveTargetsByPillar selector (3-target cap), symmetric 30-degree fan geometry via computeFanPositions, and noteMode gate on useSwipeLog — all with 28 passing unit tests**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-25T07:17:43Z
- **Completed:** 2026-03-25T07:24:23Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Added `CENTER_HOLD_THRESHOLD = 15` and `MAX_ACTIVE_TARGETS = 3` constants to `constants.ts`
- Added `getActiveTargetsByPillar` selector to targetStore — filters status='active', caps at 3 targets
- Refactored `useRadialMenu` to use fixed 30-degree symmetric fan via exported `computeFanPositions` pure function
- Gated `setPendingLogId` in `useSwipeLog.handleSwipe` behind `noteMode: boolean = false` parameter
- All 28 unit tests green (20 via jest.unit.config.js, 8 via native project)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add constants, targetStore selector, and fan geometry with tests** - `eefe891` (feat)
2. **Task 2: Gate useSwipeLog note prompt behind noteMode parameter with tests** - `cb48211` (feat)

_Note: Both tasks used TDD (RED then GREEN). No separate refactor commits needed._

## Files Created/Modified

- `src/components/joystick/constants.ts` - Added CENTER_HOLD_THRESHOLD=15, MAX_ACTIVE_TARGETS=3
- `src/stores/targetStore.ts` - Added getActiveTargetsByPillar interface + implementation
- `src/stores/targetStore.test.ts` - Added 6 tests for getActiveTargetsByPillar + makeTarget helper
- `src/components/joystick/useRadialMenu.ts` - Replaced arc-span fan with 30-degree symmetric fan, exported computeFanPositions
- `src/components/joystick/useRadialMenu.test.ts` - New file: 10 fan geometry tests (all directions, n=1/2/3)
- `src/components/joystick/useSwipeLog.ts` - Added noteMode parameter, gated setPendingLogId
- `src/components/joystick/useSwipeLog.test.ts` - New file: 4 note-mode gate tests
- `jest.unit.config.js` - Added src/components/**/*.test.ts testMatch + expo-crypto/sqlite mocks
- `src/__mocks__/expo-crypto.js` - Node environment mock for expo-crypto (ESM)
- `src/__mocks__/expo-sqlite.js` - Node environment mock for expo-sqlite (ESM)
- `src/types/react-test-renderer.d.ts` - Type declaration for react-test-renderer in unit tests

## Decisions Made

- Exported `computeFanPositions` as a standalone pure function from `useRadialMenu.ts` rather than testing through the hook — avoids needing to mock `useTargetStore` in the unit test environment
- Used `noteMode: boolean = false` (not a required parameter) to keep all existing callers backward-compatible without requiring changes in Plan 02
- Hardcoded `.slice(0, 3)` with a comment referencing `MAX_ACTIVE_TARGETS` rather than importing the constant from components — avoids a circular dependency between stores and component constants

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed pre-existing targetStore.test.ts expo-crypto ESM failure**
- **Found during:** Task 1 (running RED tests)
- **Issue:** `targetStore.ts` imports `expo-crypto` and `database` (which imports `expo-sqlite`) — both use ESM `import` syntax that crashes the node test environment
- **Fix:** Added `moduleNameMapper` to `jest.unit.config.js` mapping expo-crypto and expo-sqlite to CJS mocks in `src/__mocks__/`
- **Files modified:** `jest.unit.config.js`, `src/__mocks__/expo-crypto.js`, `src/__mocks__/expo-sqlite.js`
- **Verification:** All targetStore tests pass after fix
- **Committed in:** `eefe891` (Task 1 commit)

**2. [Rule 3 - Blocking] Added react-test-renderer.d.ts to resolve TS7016 in unit test environment**
- **Found during:** Task 2 (running useSwipeLog tests in unit project)
- **Issue:** `react-test-renderer` has no bundled types, causing TS7016 when the unit project compiled the test
- **Fix:** Added minimal ambient declaration `src/types/react-test-renderer.d.ts`
- **Files modified:** `src/types/react-test-renderer.d.ts`
- **Verification:** Type error resolved, unit project compiles test file
- **Committed in:** `cb48211` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both fixes addressed pre-existing test infrastructure failures. No scope creep. All plan-specified behavior implemented exactly as specified.

## Issues Encountered

- `useSwipeLog.test.ts` is picked up by both the `unit` (node) and `native` (jest-expo) jest projects. The `native` project runs it correctly with React renderer support; the `unit` project also passes after the type declaration fix (with harmless `act()` environment warnings). Tests pass in both environments.

## Next Phase Readiness

- All pure-logic contracts from Plan 01 are established and tested
- Plan 02 (Joystick.tsx wiring) can immediately consume: `getActiveTargetsByPillar`, `computeFanPositions`, `CENTER_HOLD_THRESHOLD`, `MAX_ACTIVE_TARGETS`, and the `noteMode` parameter
- No blockers — all acceptance criteria met and verified

## Self-Check: PASSED

- constants.ts: FOUND
- targetStore.ts: FOUND
- useRadialMenu.ts: FOUND
- useSwipeLog.ts: FOUND
- useRadialMenu.test.ts: FOUND
- useSwipeLog.test.ts: FOUND
- SUMMARY.md: FOUND
- Commit eefe891: FOUND
- Commit cb48211: FOUND

---
*Phase: 10-gesture-interaction-overhaul*
*Completed: 2026-03-25*
