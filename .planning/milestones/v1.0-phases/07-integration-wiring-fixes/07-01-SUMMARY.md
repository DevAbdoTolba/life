---
phase: 07-integration-wiring-fixes
plan: 01
subsystem: database, stores, notifications, app-startup
tags: [soft-delete, schema-migration, notifications, tdd]
dependency_graph:
  requires: []
  provides: [soft-delete-target, schema-v2-migration, notification-channel-startup]
  affects: [src/database/types.ts, src/database/schema.ts, src/database/db.ts, src/stores/targetStore.ts, app/_layout.tsx]
tech_stack:
  added: []
  patterns: [soft-delete, schema-migration, tdd-red-green]
key_files:
  created:
    - src/stores/targetStore.test.ts
  modified:
    - src/database/types.ts
    - src/database/schema.ts
    - src/database/db.ts
    - src/stores/targetStore.ts
    - app/_layout.tsx
    - src/services/notifications.test.ts
decisions:
  - "Soft-delete via UPDATE status='deleted' + target_history INSERT instead of hard DELETE preserves FK integrity"
  - "Schema migration recreates targets table via targets_v2 rename (SQLite cannot ALTER CHECK constraints)"
  - "initNotificationChannel called after setDbReady(true) and before store loads in prepare()"
metrics:
  duration: ~8min
  completed_date: "2026-03-24"
  tasks: 2
  files: 6
---

# Phase 07 Plan 01: Schema v2 soft-delete and notification channel startup wiring Summary

**One-liner:** Soft-delete deleteTarget() via UPDATE+history INSERT with SQLite CHECK migration, and Android notification channel wired at app startup.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Schema migration + soft-delete with tests | 71ee1e1 | types.ts, schema.ts, db.ts, targetStore.ts, targetStore.test.ts |
| 2 | Notification channel init at startup + test extension | a19a985 | _layout.tsx, notifications.test.ts |

## What Was Built

**Task 1 — Schema v2 + Soft-Delete (TDD):**
- Added `'deleted'` to `TargetStatus` union in `src/database/types.ts`
- Bumped `SCHEMA_VERSION` to `2` and updated CHECK constraint in `src/database/schema.ts`
- Added `migrateSchema()` in `src/database/db.ts` that recreates the targets table via a `targets_v2` intermediary (SQLite cannot ALTER CHECK constraints), called after INSERT OR IGNORE of schema_version
- Replaced hard `DELETE FROM targets` with `UPDATE targets SET status = 'deleted'` + `INSERT INTO target_history` in `deleteTarget()` in `src/stores/targetStore.ts`
- Wrote 4 unit tests in `src/stores/targetStore.test.ts` verifying: UPDATE called (not DELETE), history record inserted with correct old/new status, target removed from in-memory state, no-op for unknown IDs

**Task 2 — Notification Channel at Startup:**
- Added `import { initNotificationChannel } from '../src/services/notifications'` to `app/_layout.tsx`
- Called `await initNotificationChannel()` after `setDbReady(true)` and before `Promise.all` store loads in `prepare()`
- Added idempotency test in `src/services/notifications.test.ts` confirming safe repeated calls

## Verification

- All 31 unit tests pass (5 test suites)
- All grep checks pass: types, schema version, migration, soft-delete, channel init, history insert

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- src/stores/targetStore.test.ts: exists
- src/database/types.ts: contains 'deleted'
- src/database/schema.ts: SCHEMA_VERSION = 2
- src/database/db.ts: contains migrateSchema
- src/stores/targetStore.ts: contains UPDATE targets SET status = 'deleted'
- app/_layout.tsx: contains initNotificationChannel
- Commits 71ee1e1 and a19a985: confirmed in git log
