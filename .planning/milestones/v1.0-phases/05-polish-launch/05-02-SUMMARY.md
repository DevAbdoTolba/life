---
phase: 05-polish-launch
plan: 02
subsystem: notifications
tags: [expo-notifications, scheduling, push-notifications, android-channel, typescript]

# Dependency graph
requires:
  - phase: 05-polish-launch
    provides: settingsStore with reminderEnabled, reminderTime, weeklyReviewDay fields

provides:
  - notifications.ts service with initNotificationChannel, syncNotificationSchedule, requestNotificationPermission
  - DAILY trigger scheduling at user-configured HH:mm for NOTIFY-01
  - WEEKLY trigger scheduling on configured weekday at 10:00 for NOTIFY-02
  - Android notification channel 'hayat-reminders' with DEFAULT importance
  - Fully tested service with 10 passing unit tests

affects:
  - 05-03-settings-screen (wires syncNotificationSchedule into settings UI)
  - app startup (initNotificationChannel must be called before scheduling)

# Tech tracking
tech-stack:
  added: [jest@30, ts-jest@29, @types/jest, jest.unit.config.js]
  patterns: [separate ts-jest/node config for pure service tests, jest.mock inline jest.fn() pattern for hoisting safety]

key-files:
  created:
    - src/services/notifications.ts
    - src/services/notifications.test.ts
    - jest.unit.config.js
  modified:
    - jest.config.js

key-decisions:
  - "Used jest.unit.config.js with ts-jest/node for service tests, avoiding jest-expo's React Native setup incompatibility with pure Node modules"
  - "Mock pattern: jest.fn() inline in jest.mock() factory, then cast module fns to jest.Mock for assertions — avoids hoisting issues with const references"
  - "setNotificationHandler called at module scope per expo-notifications docs — intentional side effect on first import"
  - "Channel ID 'hayat-reminders' defined as module-level const for DRY usage across channel creation and trigger scheduling"

patterns-established:
  - "Service tests: use jest.unit.config.js with --config flag for ts-jest/node, not jest-expo"
  - "expo-notifications mocking: inline jest.fn() in factory, cast to jest.Mock for test assertions"

requirements-completed: [NOTIFY-01, NOTIFY-02]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 5 Plan 02: Notification Scheduling Service Summary

**expo-notifications scheduling service with DAILY/WEEKLY triggers, Android channel setup, and permission handling — fully tested with 10 unit tests via ts-jest**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-23T22:08:10Z
- **Completed:** 2026-03-23T22:13:05Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Built `notifications.ts` with 3 exported async functions: `initNotificationChannel`, `syncNotificationSchedule`, `requestNotificationPermission`
- `syncNotificationSchedule` cancels all existing notifications then conditionally schedules DAILY (NOTIFY-01) and WEEKLY (NOTIFY-02) triggers using expo-notifications
- Wrote 10 comprehensive unit tests covering scheduling, cancellation, permission states, and time parsing — all passing
- Created `jest.unit.config.js` for pure service tests using ts-jest/node environment (resolves jest-expo incompatibility with Node modules)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build notification service (NOTIFY-01, NOTIFY-02)** - `746c8a6` (feat)
2. **Task 2: Write notification service tests** - `16f1bf1` (feat)

## Files Created/Modified
- `src/services/notifications.ts` - Notification scheduling service with initNotificationChannel, syncNotificationSchedule, requestNotificationPermission
- `src/services/notifications.test.ts` - 10 unit tests with mocked expo-notifications
- `jest.unit.config.js` - Separate jest config for service unit tests using ts-jest/node
- `jest.config.js` - Updated to use projects array routing unit vs native tests

## Decisions Made
- Used `jest.unit.config.js` with ts-jest/node environment for service tests: jest-expo preset tries to run expo's global runtime setup which is incompatible with pure Node test environment — separate config avoids the conflict
- Mock pattern: inline `jest.fn()` in `jest.mock()` factory, then `as jest.Mock` cast on module references — avoids JavaScript hoisting issues where `const` references are `undefined` when hoisted `jest.mock` factory runs
- `setNotificationHandler` called at module scope: intentional per expo-notifications docs, configures foreground notification display globally on first import
- Channel ID as const: `CHANNEL_ID = 'hayat-reminders'` defined once, used in channel creation, daily trigger, and weekly trigger — prevents string mismatch bugs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed jest, ts-jest, @types/jest for test execution**
- **Found during:** Task 1 (pre-execution check)
- **Issue:** No jest binary in project; plan requires `npx jest` to run tests; package.json had no jest configuration
- **Fix:** `npm install --save-dev jest ts-jest @types/jest --legacy-peer-deps --ignore-scripts`
- **Files modified:** package.json (added devDependencies)
- **Verification:** `jest --version` returns 30.2.0, `ts-jest --version` returns 29.4.6
- **Committed in:** 16f1bf1 (part of task 2 commit via package.json)

**2. [Rule 3 - Blocking] Created jest.unit.config.js to bypass jest-expo incompatibility**
- **Found during:** Task 2 (first test run)
- **Issue:** jest-expo preset's setup files import expo's global runtime which errors with `You are trying to import a file outside of the scope` in node test environment
- **Fix:** Created separate `jest.unit.config.js` using ts-jest/node, no jest-expo; updated `jest.config.js` to use projects array
- **Files modified:** jest.unit.config.js (created), jest.config.js (modified)
- **Verification:** `npx jest src/services/notifications.test.ts --no-cache` exits 0 with 10 tests passing
- **Committed in:** 16f1bf1

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes were necessary to run tests at all. No scope creep — service API unchanged from plan spec.

## Issues Encountered
- jest.mock() hoisting: first test iteration used const references in jest.mock() factory which were undefined when hoisted — fixed by using inline jest.fn() calls and casting module references to jest.Mock
- babel-preset-expo not directly installed in project (only transitive): jest.config.js had a transform using it that failed — removed the broken transform and used ts-jest instead

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `notifications.ts` exports all 3 functions ready for Settings screen integration (Plan 03)
- Settings screen should call `syncNotificationSchedule` when reminderEnabled or reminderTime changes
- App startup should call `initNotificationChannel()` before any notification scheduling
- `requestNotificationPermission()` should be called when user first enables reminders

---
*Phase: 05-polish-launch*
*Completed: 2026-03-23*
