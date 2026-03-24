---
phase: 05-polish-launch
plan: 01
subsystem: data
tags: [expo-document-picker, expo-file-system, expo-sharing, jest, jest-expo, ts-jest, sqlite, backup, export, import]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: SQLite database (hayat.db) with 5 tables and getDatabase() function
  - phase: 03-goals-privacy
    provides: settingsStore for app state persistence

provides:
  - exportAllData function — queries all 5 SQLite tables, writes JSON backup to cache, opens OS share sheet
  - pickBackupFile function — opens document picker, validates backup schema, returns BackupSummary
  - restoreFromBackup function — full table replace (DELETE all + INSERT from backup)
  - BackupFile and BackupSummary types for backup/restore contract
  - jest.config.js and jest.unit.config.js — test infrastructure split (unit=ts-jest/node, native=jest-expo)
  - babel.config.js — reanimated:false to avoid worklets build issue in Jest
  - weeklyReviewDay field in settingsStore (default 1=Sunday)
  - expo-notifications plugin in app.json

affects:
  - 05-02 (notifications — uses jest infrastructure and settingsStore weeklyReviewDay)
  - 05-03 (settings screen — uses exportAllData, pickBackupFile, restoreFromBackup)
  - 05-04 (onboarding — uses settingsStore)

# Tech tracking
tech-stack:
  added:
    - expo-document-picker (~55.0.9) — file picker for JSON backup import
    - jest-expo (^55.0.11) — expo jest preset for React Native test environment
    - jest (^30.3.0) — test runner
    - ts-jest (^29.4.6) — TypeScript transformer for Jest
    - "@types/jest" (^30.0.0) — Jest type definitions
  patterns:
    - TDD (RED → GREEN) for service layer testing
    - Split jest config: services use ts-jest+node, components use jest-expo+native
    - Full table replace pattern (DELETE all 5 tables then INSERT) for restore
    - copyToCacheDirectory: true for Android content:// URI compatibility in document picker

key-files:
  created:
    - src/services/exportService.ts
    - src/services/exportService.test.ts
    - src/services/importService.ts
    - src/services/importService.test.ts
    - jest.config.js
    - jest.unit.config.js
    - babel.config.js
  modified:
    - package.json (new deps + test scripts)
    - app.json (expo-notifications plugin added)
    - src/stores/settingsStore.ts (weeklyReviewDay field)

key-decisions:
  - "Split jest config: services/utils use ts-jest with node env (no RN setup overhead); components use jest-expo"
  - "babel.config.js sets reanimated:false to avoid react-native-worklets/plugin missing error in Jest"
  - "expo-file-system/legacy used in importService for readAsStringAsync (stable API)"
  - "copyToCacheDirectory: true in DocumentPicker for Android content:// URI compatibility"
  - "Full table replace strategy: DELETE all 5 tables then INSERT — simple, atomic, no partial states"

patterns-established:
  - "Service tests: jest.mock for all native deps, ts-jest with node env"
  - "BackupFile interface: version+appVersion+exportedAt+data{5 tables} — canonical backup shape"

requirements-completed: [DATA-02, DATA-03]

# Metrics
duration: 25min
completed: 2026-03-23
---

# Phase 05 Plan 01: Dependencies, Test Infra, Export/Import Services Summary

**expo-document-picker + jest-expo test infra + exportAllData (share sheet) + pickBackupFile/restoreFromBackup (full table replace) — 11 unit tests all green**

## Performance

- **Duration:** ~25 min
- **Started:** 2026-03-23T22:06:00Z
- **Completed:** 2026-03-23T22:31:00Z
- **Tasks:** 3
- **Files modified:** 9 (created 7, modified 2)

## Accomplishments

- Installed expo-document-picker, jest-expo, jest, ts-jest, @types/jest; added test scripts to package.json
- Created split jest config (unit=ts-jest/node, native=jest-expo) and babel.config.js to unblock testing in Jest
- exportAllData: queries all 5 tables in parallel, writes JSON to cache dir, opens OS share sheet via expo-sharing
- pickBackupFile: opens document picker, validates backup schema, returns BackupSummary with log/target counts and date range
- restoreFromBackup: full atomic replace (DELETE all 5 tables then INSERT each row from backup)
- Extended settingsStore with weeklyReviewDay field (needed by notifications plan)
- Added expo-notifications plugin to app.json

## Task Commits

Each task was committed atomically:

1. **Task 1: Install deps, configure test infra, update settingsStore and app.json** - `607a41c` (feat)
2. **Task 2: Build export service with tests (DATA-02)** - `602c348` (feat)
3. **Task 3: Build import service with tests (DATA-03)** - `58d64b8` (feat)

_Note: TDD tasks 2 and 3 followed RED → GREEN flow_

## Files Created/Modified

- `src/services/exportService.ts` — exportAllData: parallel 5-table query, JSON file write, share sheet
- `src/services/exportService.test.ts` — 5 tests: table queries, backup structure, mimeType, sharing unavailable
- `src/services/importService.ts` — pickBackupFile: validate schema + summary; restoreFromBackup: DELETE+INSERT all tables
- `src/services/importService.test.ts` — 6 tests: cancel, invalid JSON, missing version, missing data.logs, valid summary, DELETE+INSERT
- `jest.config.js` — projects split routing services to unit config, components to native preset
- `jest.unit.config.js` — ts-jest + node env for service/util tests (no React Native setup)
- `babel.config.js` — expo preset with reanimated:false to fix jest-worklets error
- `package.json` — added expo-document-picker, jest deps, test/test:services scripts
- `app.json` — added expo-notifications plugin with defaultChannel: "hayat-reminders"
- `src/stores/settingsStore.ts` — added weeklyReviewDay: number field (default 1=Sunday), setWeeklyReviewDay action

## Decisions Made

- Split jest config: `jest.unit.config.js` uses ts-jest with node environment for pure service tests — avoids React Native setup overhead and the `expo/src/winter/runtime.native.ts` error that occurs when jest-expo setup files try to use `require()` outside test scope context.
- `babel.config.js` with `reanimated: false` — suppresses `react-native-worklets/plugin` missing error that occurs because babel-preset-expo auto-adds reanimated plugin when the package is installed, but the worklets package isn't present.
- `expo-file-system/legacy` used in importService — provides `readAsStringAsync` for stable cross-platform file reading after document picker returns a URI.
- Full table replace (DELETE → INSERT) over UPDATE/UPSERT — simpler atomicity, no partial state risk, and backup restore is a rare enough operation that performance isn't a concern.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Jest configuration required split into unit/native projects**
- **Found during:** Task 2 (RED phase test run)
- **Issue:** jest-expo setup files call `require('expo/src/winter')` which fails in Jest node environment with "You are trying to `import` a file outside of the scope of the test code". Service tests don't need React Native environment.
- **Fix:** Created `jest.unit.config.js` using ts-jest with node environment for `src/services/**/*.test.ts`. Updated `jest.config.js` to use `projects` array routing services to unit config. Created `babel.config.js` with `reanimated: false` to fix `react-native-worklets/plugin` missing error.
- **Files modified:** `jest.config.js`, `jest.unit.config.js` (created by parallel agent), `babel.config.js`
- **Verification:** `npx jest src/services/` runs all 11 tests without errors
- **Committed in:** `602c348` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed TypeScript type error in export test**
- **Found during:** Task 2 (ts-jest type checking)
- **Issue:** `(File as jest.Mock)` caused TS2352 because DOM `File` type doesn't overlap with `jest.Mock`
- **Fix:** Changed to `(File as unknown as jest.Mock)` double-cast pattern
- **Files modified:** `src/services/exportService.test.ts`
- **Verification:** TypeScript compilation succeeds, tests pass
- **Committed in:** `602c348` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both auto-fixes necessary for test infrastructure to work. No scope creep.

## Issues Encountered

- **Jest + React Native Reanimated conflict:** `babel-preset-expo` auto-adds `react-native-reanimated/plugin` which requires `react-native-worklets/plugin` (not installed in this project). Fixed by setting `reanimated: false` in `babel.config.js`.
- **Expo winter runtime in Jest:** `jest-expo` setup file loads `expo/src/winter/runtime.native.ts` which causes "import outside test scope" errors in node environment. Fixed by routing service tests to `ts-jest` with node environment.

## Next Phase Readiness

- Test infrastructure ready: both service and component tests can now run independently
- exportAllData and pickBackupFile/restoreFromBackup ready for integration in Settings screen (plan 05-03)
- settingsStore.weeklyReviewDay available for notification scheduling (plan 05-02)
- expo-notifications in app.json so native module is linked on next build

## Self-Check: PASSED

- FOUND: src/services/exportService.ts
- FOUND: src/services/importService.ts
- FOUND: src/services/exportService.test.ts
- FOUND: src/services/importService.test.ts
- FOUND: jest.config.js
- FOUND: babel.config.js
- Commit 607a41c: FOUND
- Commit 602c348: FOUND
- Commit 58d64b8: FOUND

---
*Phase: 05-polish-launch*
*Completed: 2026-03-23*
