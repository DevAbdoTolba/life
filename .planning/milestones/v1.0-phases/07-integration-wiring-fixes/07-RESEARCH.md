# Phase 07: Integration Wiring Fixes - Research

**Researched:** 2026-03-24
**Domain:** React Native / Zustand store wiring, SQLite soft-delete, expo-notifications
**Confidence:** HIGH

## Summary

Phase 07 closes three integration gaps identified by the v1.0 audit. Each gap is a wiring problem where the implementation exists but is not connected to the right trigger or subscriber. No new libraries are required. No architectural changes are needed. All three fixes are localized code edits.

The most nuanced fix is soft-delete: the SQLite schema has a CHECK constraint on `targets.status` that does not include `'deleted'`, which means the UPDATE will fail at the database layer unless the schema is migrated first. This is the primary technical risk in this phase.

The privacy mode fix requires understanding the two-level masking design: `target.isMasked` is a per-target opt-in stored in the database, while `settingsStore.isPrivacyMode` is a global display toggle. The correct rule is: show codename when `target.isMasked && isPrivacyMode`, show real name otherwise. `TargetCard` currently gates on `authStore.isUnlocked` (wrong signal). `TargetAnalyticsList`, `TargetTrendModal`, and `RadialMenu` use only `target.isMasked` with no global mode check (partially correct, but still bypasses the global toggle).

**Primary recommendation:** Address the schema constraint blocker first (soft-delete migration), then wire privacy mode, then add notification channel init. Each fix is independently testable.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — this is a gap closure phase with fully specified success criteria. The ROADMAP defines exactly what must change:
1. Settings Privacy Mode toggle must control masking in TargetCard, TargetAnalyticsList, TargetTrendModal, RadialMenu
2. deleteTarget() must use soft-delete (status='deleted') instead of hard DELETE, preserving target_history FK integrity
3. initNotificationChannel() must be called at app startup in _layout.tsx

### Claude's Discretion
All implementation choices.

### Deferred Ideas (OUT OF SCOPE)
None — gap closure phase.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PRIV-01 | Goals can be masked with auto-assigned funny codenames from a pool of ~30 | Codename pool already exists in `src/constants/codenames.ts` (30 names). Per-target masking exists. Global `isPrivacyMode` toggle exists in settingsStore. Wire missing. |
| PRIV-02 | Real goal names hidden behind password-protected reveal | `authStore.isUnlocked` exists. `TargetCard` reads it but uses wrong condition. Other components don't check auth at all. Wire `isPrivacyMode && target.isMasked` pattern across all four components. |
| GOAL-02 | Full goal history/changelog tracking | `target_history` table and `getTargetHistory()` exist. `updateTargetStatus()` already records history. `deleteTarget()` does hard DELETE — must be changed to UPDATE status='deleted' + history record. Schema CHECK constraint blocks this — migration required. |
| NOTIFY-01 | Configurable daily review notification prompting user to log | `syncNotificationSchedule()` handles daily scheduling. `initNotificationChannel()` must be called at startup so Android channel is ready before any scheduling. |
| NOTIFY-02 | Period review reminders | Same as NOTIFY-01 — weekly schedule is inside `syncNotificationSchedule()`. Channel init at startup unblocks both. |
</phase_requirements>

## Standard Stack

### Core (all already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zustand | project-installed | Global state — `settingsStore`, `authStore`, `targetStore` | Project standard (ADR) |
| expo-sqlite | project-installed | SQLite — targets table, target_history | Project standard (ADR-001) |
| expo-notifications | project-installed | Android channel init, notification scheduling | Already used in `notifications.ts` |

### No new dependencies needed
All fixes use existing libraries. This is a wiring phase, not a feature-add phase.

## Architecture Patterns

### Established Store Subscription Pattern
Components subscribe to Zustand stores with selector functions:
```typescript
// Source: src/stores/settingsStore.ts + existing component usage
const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);
const isUnlocked = useAuthStore((s) => s.isUnlocked);
```

### Two-Level Privacy Masking Design
The project has two privacy concepts that interact:
- `target.isMasked` (boolean, per-target) — user opted this specific target into masking
- `settingsStore.isPrivacyMode` (boolean, global) — the mode toggle in Settings

**Correct display rule:** `shouldMask = target.isMasked && isPrivacyMode`

When privacy mode is OFF: all real names show regardless of `isMasked`.
When privacy mode is ON: only `isMasked=true` targets show codenames; others show real names.

`authStore.isUnlocked` is a separate concern (PIN-gate to reveal names temporarily). The current `TargetCard` wires it incorrectly — it reads `isUnlocked` instead of `isPrivacyMode` to decide masking.

### Soft-Delete Pattern (with Schema Migration Required)
Current:
```typescript
// src/stores/targetStore.ts:145-150
deleteTarget: async (id) => {
  const db = getDatabase();
  await db.runAsync(`DELETE FROM targets WHERE id = ?`, [id]);
  set((state) => ({ targets: state.targets.filter((t) => t.id !== id) }));
},
```

Required change — UPDATE + history record:
```typescript
deleteTarget: async (id) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const target = get().targets.find((t) => t.id === id);
  if (!target) return;

  await db.runAsync(
    `UPDATE targets SET status = 'deleted', updated_at = ? WHERE id = ?`,
    [now, id]
  );

  // Record in target_history (same pattern as updateTargetStatus)
  const historyId = uuidv4();
  await db.runAsync(
    `INSERT INTO target_history (id, target_id, old_status, new_status, changed_at) VALUES (?, ?, ?, ?, ?)`,
    [historyId, id, target.status, 'deleted', now]
  );

  // Remove from in-memory state (loadTargets already filters status != 'deleted')
  set((state) => ({ targets: state.targets.filter((t) => t.id !== id) }));
},
```

### Notification Channel Init Pattern
```typescript
// Source: src/services/notifications.ts
// Add to _layout.tsx prepare() function, after initDatabase():
await initNotificationChannel(); // Safe to call multiple times (no-op if channel exists)
```

The function is already defensive — calling it multiple times is safe. It only creates the channel on Android; iOS ignores it.

## Critical Finding: Schema Constraint Blocks Soft-Delete

The `targets` table CHECK constraint currently does NOT include `'deleted'`:

```sql
-- src/database/schema.ts line 31
status TEXT DEFAULT 'active' CHECK(status IN ('active', 'paused', 'completed', 'failed', 'reduced', 'increased'))
```

Attempting `UPDATE targets SET status = 'deleted'` will fail with a SQLite constraint violation. Two paths:

**Option A (Recommended): Migrate schema to add 'deleted' to CHECK constraint**
- Requires `SCHEMA_VERSION` bump and migration logic in `initDatabase()`
- Guarantees the constraint stays aligned with code

**Option B: Skip the CHECK constraint (remove it)**
- Simpler but loses constraint protection for other status values

**Option C: Use a different column for deletion (e.g., `deleted_at TEXT`)**
- Bigger refactor, out of scope for gap closure

**Decision: Option A** — add `'deleted'` to the CHECK constraint via schema migration. This is the cleanest approach and aligns with the existing `SCHEMA_VERSION` pattern.

**Migration approach for expo-sqlite:**
```typescript
// In initDatabase() — check schema version and run ALTER TABLE if needed
// SQLite does not support ALTER TABLE ... MODIFY COLUMN
// Must use: CREATE new table, copy data, drop old, rename
// OR: Accept that CHECK constraints on TEXT columns are rarely enforced
//     strictly in SQLite and test whether UPDATE actually fails first
```

**Important:** SQLite CHECK constraint enforcement was added in version 3.25.0. expo-sqlite on React Native uses a bundled SQLite version. Verify whether the constraint actually blocks the UPDATE in practice before assuming a migration is required.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Notification channel creation | Custom channel management | `initNotificationChannel()` already in `notifications.ts` | Already handles Android/iOS branching |
| Codename assignment | New codename generator | `getRandomCodename()` in `src/constants/codenames.ts` | Already used by `addTarget()` |
| Target history recording | New history service | `updateTargetStatus()` pattern — same SQL | Already proven in existing code |
| Schema migration | Schema rebuild | expo-sqlite `getFirstAsync` for version check + `runAsync` for DDL | Project already uses this in `initDatabase()` |

## Common Pitfalls

### Pitfall 1: SQLite CHECK Constraint on Status Column
**What goes wrong:** `UPDATE targets SET status = 'deleted'` throws constraint error at runtime on Android/iOS
**Why it happens:** Schema CHECK in `schema.ts` omits `'deleted'` from allowed values
**How to avoid:** Either migrate the schema (add 'deleted' to CHECK list) or verify SQLite's constraint enforcement behavior for the expo-sqlite version in use
**Warning signs:** Test the UPDATE in a dev build before assuming it works

### Pitfall 2: Privacy Mode vs Auth Unlock Conflation
**What goes wrong:** Using `authStore.isUnlocked` when the toggle should be `settingsStore.isPrivacyMode`
**Why it happens:** `TargetCard` already does this incorrectly — the bug pattern could spread to other components during the fix
**How to avoid:** The masking rule is `shouldMask = target.isMasked && isPrivacyMode`. Auth unlock (`isUnlocked`) is a separate read-only reveal mechanism — not the same thing as the privacy mode toggle
**Warning signs:** Privacy mode toggle in Settings has no effect on displayed names

### Pitfall 3: Notification Channel Called Too Late
**What goes wrong:** `syncNotificationSchedule()` already calls `initNotificationChannel()` internally — but only when scheduling. If the user has reminders enabled from a previous session and the app restarts, the channel may not exist yet before the OS delivers a notification
**Why it happens:** Channel must exist before notifications are delivered, not just before scheduling
**How to avoid:** Call `initNotificationChannel()` unconditionally at app startup (in `prepare()` in `_layout.tsx`), before any notification operations
**Warning signs:** Android notifications silently fail or use default channel on fresh install

### Pitfall 4: In-Memory State After Soft-Delete
**What goes wrong:** Soft-deleted targets remain visible in the UI because `targets` array in store still contains them
**Why it happens:** `deleteTarget()` must filter the item from `state.targets` even though the DB now has the row (with status='deleted')
**How to avoid:** Keep the `set(state => ({ targets: state.targets.filter(...) }))` call — same as current hard delete
**Warning signs:** Deleted targets reappear immediately after deletion action

### Pitfall 5: TargetActionSheet Confirmation for Soft-Delete
**What goes wrong:** User taps "Delete Goal" expecting permanent deletion but it's now a soft-delete — no UI feedback difference
**Why it happens:** The behavior changed but the UX label did not
**How to avoid:** Keep the same "Delete Goal" label (user intent is the same). The difference is implementation only — FK integrity is the concern, not user-visible behavior
**Warning signs:** Deleted targets reappear after import (if target_history references them) — this is a good sign, not a bug

## Code Examples

### Privacy Mode Wire — TargetCard (current vs correct)
```typescript
// CURRENT (wrong): src/components/goals/TargetCard.tsx:15-18
const isUnlocked = useAuthStore(state => state.isUnlocked);
const shouldMask = target.isMasked && !isUnlocked;

// CORRECT:
const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);
const shouldMask = target.isMasked && isPrivacyMode;
// Note: isUnlocked import no longer needed unless auth reveal is added
```

### Privacy Mode Wire — TargetAnalyticsList (add store subscription)
```typescript
// CURRENT: src/components/analytics/TargetAnalyticsList.tsx:53-56
const displayName = target.isMasked && target.codename
  ? target.codename
  : target.realName;

// CORRECT: Add isPrivacyMode subscription and use in condition
const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);
// ...
const displayName = target.isMasked && isPrivacyMode && target.codename
  ? target.codename
  : target.realName;
```

### Privacy Mode Wire — TargetTrendModal (add store subscription)
```typescript
// CURRENT: src/components/analytics/TargetTrendModal.tsx:66-72
const displayName =
  target
    ? target.isMasked && target.codename
      ? target.codename
      : target.realName
    : '';

// CORRECT:
const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);
const displayName =
  target
    ? target.isMasked && isPrivacyMode && target.codename
      ? target.codename
      : target.realName
    : '';
```

### Privacy Mode Wire — RadialMenu / RadialBubble
```typescript
// CURRENT: src/components/joystick/RadialMenu.tsx:36
const displayName = target.isMasked ? target.codename : target.realName;

// CORRECT: RadialBubble needs isPrivacyMode
// Option 1: Pass as prop from RadialMenu (which reads the store)
// Option 2: RadialBubble reads the store directly
// Recommendation: RadialMenu reads store, passes boolean prop to RadialBubble
// (avoids multiple store subscriptions for same data)
const isPrivacyMode = useSettingsStore((s) => s.isPrivacyMode);
const displayName = target.isMasked && isPrivacyMode ? target.codename : target.realName;
```

### Notification Channel Init — _layout.tsx
```typescript
// Add import:
import { initNotificationChannel } from '../src/services/notifications';

// In prepare() function, after initDatabase():
await initDatabase();
setDbReady(true);
await initNotificationChannel(); // Android channel setup — no-op on iOS, safe to call always
```

### Soft-Delete in targetStore
```typescript
// Replace current deleteTarget() with:
deleteTarget: async (id) => {
  const db = getDatabase();
  const now = new Date().toISOString();
  const target = get().targets.find((t) => t.id === id);
  if (!target) return;

  await db.runAsync(
    `UPDATE targets SET status = 'deleted', updated_at = ? WHERE id = ?`,
    [now, id]
  );

  const historyId = uuidv4();
  await db.runAsync(
    `INSERT INTO target_history (id, target_id, old_status, new_status, changed_at) VALUES (?, ?, ?, ?, ?)`,
    [historyId, id, target.status, 'deleted', now]
  );

  set((state) => ({
    targets: state.targets.filter((t) => t.id !== id),
  }));
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hard DELETE for target removal | Soft-delete via status='deleted' | Phase 07 (this phase) | Preserves FK integrity in target_history |
| No global privacy mode in display | isPrivacyMode gates all masked targets | Phase 07 (this phase) | Settings toggle now controls component display |
| Notification channel init on-demand | Channel init at app startup | Phase 07 (this phase) | Android channel guaranteed before any notification delivery |

## Open Questions

1. **Does expo-sqlite enforce CHECK constraints at runtime?**
   - What we know: The schema has a CHECK on `status` that excludes `'deleted'`
   - What's unclear: Whether bundled SQLite version in expo-sqlite actually enforces it (SQLite made CHECK enforcement optional until version 3.25.0)
   - Recommendation: Test `UPDATE targets SET status = 'deleted'` on a device/emulator during Wave 0 before building the migration. If it passes silently, schema migration may still be added for correctness. If it fails, migration is blocking.

2. **Should TargetCard keep the auth-based reveal flow (lock icon + unlock)?**
   - What we know: `TargetCard` uses `authStore.isUnlocked` as the masking gate (incorrect for privacy mode)
   - What's unclear: Whether PRIV-02 ("password-protected reveal") means tapping a masked card should still prompt for PIN
   - Recommendation: The success criteria says "privacy mode toggle controls masking" — the PIN reveal is a separate feature. For this phase, replace the auth-based masking with isPrivacyMode-based masking. The lock icon and `isUnlocked` check can be removed from TargetCard for this phase. If PIN-reveal is needed, it belongs in a follow-up phase.

## Environment Availability

Step 2.6: SKIPPED — all three fixes are code-only changes. No external services, CLI tools, or runtimes beyond the existing Expo/React Native environment are required. The existing `expo-notifications`, `expo-sqlite`, and `zustand` packages are already installed.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (two configs) |
| Config file (unit) | `jest.unit.config.js` |
| Config file (native) | `jest.config.js` (projects array) |
| Quick run command | `npx jest --config jest.unit.config.js` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PRIV-01 | `isPrivacyMode=true` + `isMasked=true` shows codename | unit (store) | `npx jest --config jest.unit.config.js src/stores/targetStore.test.ts -t privacy` | ❌ Wave 0 |
| PRIV-01 | `isPrivacyMode=false` always shows real name | unit (store) | same | ❌ Wave 0 |
| PRIV-02 | Same masking conditions apply in analytics/radial contexts | unit (store) | same | ❌ Wave 0 |
| GOAL-02 | `deleteTarget()` issues UPDATE not DELETE | unit (store) | `npx jest --config jest.unit.config.js src/stores/targetStore.test.ts -t deleteTarget` | ❌ Wave 0 |
| GOAL-02 | `deleteTarget()` inserts into target_history | unit (store) | same | ❌ Wave 0 |
| GOAL-02 | Deleted target removed from in-memory state | unit (store) | same | ❌ Wave 0 |
| NOTIFY-01 | `initNotificationChannel` called during app startup | unit (service) | `npx jest --config jest.unit.config.js src/services/notifications.test.ts` | ❌ Wave 0 |
| NOTIFY-02 | Same startup call covers weekly channel | unit (service) | same | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx jest --config jest.unit.config.js`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/targetStore.test.ts` — covers GOAL-02 (deleteTarget soft-delete behavior) and PRIV-01/PRIV-02 masking logic
- [ ] `src/services/notifications.test.ts` — covers NOTIFY-01/NOTIFY-02 channel init behavior (existing mock pattern from Phase 05 applies)

Note: Component-level privacy mode tests (TargetCard, TargetTrendModal, TargetAnalyticsList, RadialMenu) would require the native jest config with jest-expo. The store-level tests are sufficient to verify the logic — component tests would be supplementary.

## Sources

### Primary (HIGH confidence)
- Direct source code audit — `src/stores/settingsStore.ts`, `src/stores/targetStore.ts`, `src/stores/authStore.ts`
- Direct source code audit — `src/services/notifications.ts`, `app/_layout.tsx`
- Direct source code audit — `src/components/goals/TargetCard.tsx`, `src/components/analytics/TargetAnalyticsList.tsx`, `src/components/analytics/TargetTrendModal.tsx`, `src/components/joystick/RadialMenu.tsx`
- Direct source code audit — `src/database/schema.ts` (CHECK constraint finding)
- Direct source code audit — `jest.config.js`, `jest.unit.config.js` (test framework detection)

### Secondary (MEDIUM confidence)
- SQLite CHECK constraint enforcement history (SQLite 3.25.0, 2018) — general knowledge, version in expo-sqlite not verified against spec

## Metadata

**Confidence breakdown:**
- Privacy mode wiring: HIGH — direct code inspection shows exactly which lines need changing and which store field to subscribe to
- Soft-delete pattern: HIGH — existing `updateTargetStatus()` pattern is identical to what `deleteTarget()` needs; schema constraint risk flagged
- Schema migration need: MEDIUM — SQLite CHECK enforcement behavior in expo-sqlite bundle needs runtime verification
- Notification channel init: HIGH — `initNotificationChannel()` is a defensive no-op call; placement in `prepare()` is unambiguous

**Research date:** 2026-03-24
**Valid until:** 2026-04-23 (stable codebase, no fast-moving dependencies)
