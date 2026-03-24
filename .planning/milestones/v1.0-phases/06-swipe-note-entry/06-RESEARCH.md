# Phase 06: Swipe Note Entry - Research

**Researched:** 2026-03-23
**Domain:** React Native modal UI, TextInput, Zustand state management, existing swipe logging flow
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| LOG-04 | Optional text notes can be added to any log entry | Database column exists (`note TEXT` in logs table), `addLog()` already accepts `note` param, `updateLogNote()` already exists in logStore — UI layer is the only missing piece |
</phase_requirements>

---

## Summary

Phase 06 is a pure UI wiring task. The data layer is already fully ready: the `logs` table has a `note TEXT` column, the `Log` type includes `note: string | null`, `addLog()` already accepts `note` as its 4th parameter, and `updateLogNote()` already exists in `useLogStore`. No schema migration and no store changes are required.

The work is entirely in the presentation layer: a bottom-sheet modal that appears after a swipe completes, allows the user to type an optional note, and saves it via `addLog()` with the note text. The modal must integrate into `useSwipeLog` (which calls `addLog`) without breaking the existing <2-second swipe flow. The note is optional — the user must be able to skip it with zero friction.

Notes must also render wherever logs are displayed. Currently the only place logs are listed is the home screen's "X actions today" count (no detailed log list shown). The success criteria states notes display "in log history views," which means either: (a) the home screen needs a today-log list with note display, or (b) the analytics screens need note display in log entries. Given this is a gap-closure phase targeting a single unsatisfied requirement, the minimal interpretation is: notes surface in any log detail view that exists or is created as part of this phase.

**Primary recommendation:** Implement a bottom-sheet `NoteEntryModal` that triggers from `useSwipeLog` post-log, displaying an optional `TextInput`. Keep the note path optional so zero-friction logging is preserved. Render notes on the home screen in an expandable today-log list (the simplest "log history view" in scope).

---

## Standard Stack

### Core (all already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React Native `Modal` | built-in (RN 0.83.2) | Bottom-sheet note entry overlay | Already used in TargetFormModal, AuthModal, TargetTrendModal — established pattern |
| React Native `TextInput` | built-in | Note text capture | Already used in TargetFormModal and AuthModal |
| React Native `KeyboardAvoidingView` | built-in | Push modal above keyboard | Already used in TargetFormModal with `behavior={Platform.OS === 'ios' ? 'padding' : 'height'}` |
| Zustand `useLogStore` | ^5.0.12 | Note persistence via addLog() / updateLogNote() | Already the state layer for all log operations |
| `expo-haptics` | ~55.0.9 | Haptic feedback on note save | Already used in useSwipeLog for confirmation feedback |

### No New Dependencies Required
This phase installs zero new packages. All required capabilities exist in the current stack.

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── joystick/
│   │   ├── useSwipeLog.ts          # MODIFY: add note modal trigger
│   │   └── NoteEntryModal.tsx      # NEW: bottom-sheet note entry
│   └── ui/
│       └── LogHistoryItem.tsx      # NEW: log row with optional note display
app/
└── (tabs)/
    └── index.tsx                   # MODIFY: add today-log list below joysticks
```

### Pattern 1: Post-Swipe Note Modal (bottom-sheet)

**What:** After `addLog()` succeeds in `useSwipeLog`, set a pending log ID in state. The modal reads this state to show/hide and saves the note via `updateLogNote()`.

**When to use:** Immediately after every swipe. The modal is dismissable (skip = no note).

**Key design decision:** Two approaches are viable:

**Option A — Note in addLog() (blocking):** `useSwipeLog` sets `pendingLogId` state, modal shows, user types, modal calls `updateLogNote(pendingLogId, text)` then closes. Log is created immediately without note, note is added after.

**Option B — Note before addLog() (pre-save):** Modal appears, user types note (or skips), then `addLog(pillarId, direction, targetId, note)` is called with the note already captured.

Option A is simpler for the existing flow because `addLog()` is `async` and already called in `useSwipeLog.handleSwipe`. The log is committed to SQLite immediately so it survives if the user skips the modal. Option B would require refactoring `handleSwipe` to be a two-step async operation. **Use Option A.**

**Example (Option A pattern):**
```typescript
// useSwipeLog.ts — add pendingLogId state
export function useSwipeLog(pillarId: PillarId) {
  const addLog = useLogStore((state) => state.addLog);
  const [pendingLogId, setPendingLogId] = useState<string | null>(null);
  const lastSwipeTime = useRef<number>(0);

  const handleSwipe = useCallback(async (result: SwipeResult, targetId: string | null = null) => {
    // ... debounce check unchanged ...

    // addLog already returns void — we need the log ID
    // Option: generate UUID here, pass to addLog, then set pendingLogId
    await addLog(result.pillarId, result.direction, targetId);
    setPendingLogId(/* id */);   // trigger modal
    // haptics unchanged
  }, [addLog]);

  return { handleSwipe, pendingLogId, clearPendingLogId: () => setPendingLogId(null) };
}
```

**Critical implementation note:** `addLog` currently generates the UUID internally. To propagate the log ID back to `useSwipeLog`, either:
- Generate UUID in `useSwipeLog` and pass it as a parameter to `addLog`, OR
- Change `addLog` to return the `id` it created

The second option is a cleaner API change: `addLog` returns `Promise<string>` (the new log ID). This avoids duplicating `uuidv4()` calls.

### Pattern 2: Bottom-Sheet Modal UI (established codebase pattern)

**What:** `Modal` with `transparent`, `animationType="slide"`, overlay `justifyContent: 'flex-end'` — exactly matching `TargetFormModal` and `TargetTrendModal`.

**Example:**
```typescript
// NoteEntryModal.tsx
<Modal visible={!!pendingLogId} animationType="slide" transparent onRequestClose={onSkip}>
  <KeyboardAvoidingView
    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
  >
    <View style={styles.card}>
      <Text style={styles.title}>Add a note? (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="What were you thinking..."
        placeholderTextColor={colors.textSecondary}
        multiline
        maxLength={280}
        autoFocus
      />
      <View style={styles.buttonRow}>
        <TouchableOpacity onPress={onSkip}><Text>Skip</Text></TouchableOpacity>
        <TouchableOpacity onPress={onSave}><Text>Save</Text></TouchableOpacity>
      </View>
    </View>
  </KeyboardAvoidingView>
</Modal>
```

### Pattern 3: Log History Display (today-log list on home screen)

**What:** A scrollable list of today's logs below the joystick triangle on the home screen. Each `LogHistoryItem` shows: pillar color dot, direction label, target name if present, timestamp, and note text if present.

The home screen already fetches `todayLogs` via `useEffect` → `getTodayLogs()`. The list can be added below the `triangleContainer` in a `ScrollView` or `FlatList`.

**Existing data already in scope:** `todayLogs: Log[]` is already in the home screen component's store subscription.

### Anti-Patterns to Avoid

- **Do not block the swipe with a required modal.** The note is optional — the modal must be dismissable by tapping "Skip", pressing back, or tapping the overlay. LOG-02 specifies logging in under 2 seconds; the note modal is post-log, not blocking.
- **Do not re-implement keyboard avoidance.** Use `KeyboardAvoidingView` with the `Platform.OS` pattern already established in `TargetFormModal`.
- **Do not re-architect the log flow.** `useSwipeLog` → `addLog()` is the established path. Wire note capture as a post-add step.
- **Do not add FlatList `key` prop issues.** When rendering today's log list, use `log.id` as the key.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Note persistence | Custom SQLite note column | `updateLogNote()` in `useLogStore` — already exists | Already wired to `UPDATE logs SET note = ? WHERE id = ?` |
| Keyboard avoidance | Custom layout shifts | `KeyboardAvoidingView` with `Platform.OS` ternary | RN built-in, already used in codebase |
| Bottom sheet animation | Custom Reanimated sheet | `Modal animationType="slide"` | Simpler, matches all other modals in the app |
| UUID generation | Custom ID scheme | `uuid` v13 (`uuidv4()`) — already in package.json | Already used in `logStore.addLog` |

---

## Common Pitfalls

### Pitfall 1: addLog() doesn't return the log ID
**What goes wrong:** `useSwipeLog` calls `addLog()` and gets `Promise<void>`, so it can't know the new log's ID to pass to the note modal or `updateLogNote()`.
**Why it happens:** The current `addLog` signature returns `Promise<void>`.
**How to avoid:** Change `addLog` return type to `Promise<string>` — return the generated `id` at the end of the function. This is a one-line change to `logStore.ts` with no breaking downstream effects (existing callers discard the return value).
**Warning signs:** TypeScript will flag it if callers expect `void`.

### Pitfall 2: Modal autoFocus conflicts with gesture handler
**What goes wrong:** When `Modal` becomes visible with `autoFocus` on the `TextInput`, the keyboard appears immediately. On Android, this can sometimes trigger gesture interference if the modal mount is synchronous with the swipe end event.
**Why it happens:** RNGH gesture events and JS thread state updates compete.
**How to avoid:** Add a small `setTimeout` (~50ms) before setting `pendingLogId` in `useSwipeLog`, giving the gesture handler time to fully resolve. Or use `requestAnimationFrame`. Check if the existing modals (TargetFormModal) have any such guard — they don't appear to need one since they're triggered by button presses, not gesture ends.
**Warning signs:** Keyboard flicker, or gesture handler firing twice.

### Pitfall 3: Note modal appears on HOLD swipes (target selection)
**What goes wrong:** A hold-swipe triggers the note modal after target selection, which was not necessarily the intent.
**Why it happens:** `handleSwipe` in `useSwipeLog` is called for both quick swipes and hold swipes.
**How to avoid:** The `SwipeResult.wasHeld` flag is already available. The planner should decide whether notes apply to hold (target) swipes too. For v1 simplicity, apply to all swipes (both quick and hold). Document this as a design choice.
**Warning signs:** User confusion about note modal appearing after target selection.

### Pitfall 4: updateLogNote() updates in-memory todayLogs state but only for today
**What goes wrong:** Calling `updateLogNote()` updates `todayLogs` in Zustand state, so the home screen log list reflects the note. But `getLogsByPeriod()` in analytics re-fetches from SQLite on period change — so analytics will show the note correctly.
**Why it happens:** The store has separate in-memory arrays vs. fetch-on-demand functions.
**How to avoid:** This is actually correct behavior — no fix needed. Just be aware that `todayLogs` in the store is the source of truth for the home screen; the note will appear immediately after save.
**Warning signs:** Note not appearing immediately in today list — check if `updateLogNote` is correctly mutating the `todayLogs` array (it does via `state.todayLogs.map()`).

### Pitfall 5: TextInput `multiline` height on Android
**What goes wrong:** `multiline` TextInput on Android does not auto-resize by default without explicit `style` props for height.
**Why it happens:** Android text input behavior differs from iOS.
**How to avoid:** Set `minHeight` and let it grow, or use a fixed single-line input for short notes (simpler and sufficient for v1).
**Warning signs:** Text cut off on Android, or input too small.

---

## Code Examples

### Changing addLog to return ID (one-line change)
```typescript
// src/stores/logStore.ts — addLog
addLog: async (pillarId, direction, targetId = null, note = null) => {
  const db = getDatabase();
  const id = uuidv4();
  const createdAt = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO logs (id, pillar_id, direction, target_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [id, pillarId, direction, targetId, note, createdAt]
  );

  const newLog: Log = { id, pillarId, direction, targetId, note, createdAt };
  set((state) => ({ todayLogs: [newLog, ...state.todayLogs] }));

  return id;  // <-- ADD THIS LINE
},
```

And update the interface:
```typescript
addLog: (
  pillarId: number,
  direction: SwipeDirectionType,
  targetId?: string | null,
  note?: string | null
) => Promise<string>;   // was Promise<void>
```

### useSwipeLog with note modal trigger
```typescript
export function useSwipeLog(pillarId: PillarId) {
  const addLog = useLogStore((state) => state.addLog);
  const [pendingLogId, setPendingLogId] = useState<string | null>(null);
  const lastSwipeTime = useRef<number>(0);

  const handleSwipe = useCallback(async (result: SwipeResult, targetId: string | null = null) => {
    const now = Date.now();
    if (now - lastSwipeTime.current < DEBOUNCE_MS) return;
    lastSwipeTime.current = now;

    const logId = await addLog(result.pillarId, result.direction, targetId);
    setPendingLogId(logId);  // triggers NoteEntryModal

    if (targetId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [addLog]);

  return { handleSwipe, pendingLogId, clearPendingLogId: () => setPendingLogId(null) };
}
```

### NoteEntryModal integration in Joystick.tsx
```typescript
// In Joystick.tsx — add to JSX:
const { handleSwipe, pendingLogId, clearPendingLogId } = useSwipeLog(pillarId);

// After closing modal, clear state:
<NoteEntryModal
  visible={!!pendingLogId}
  logId={pendingLogId}
  onClose={clearPendingLogId}
/>
```

### LogHistoryItem component (note display)
```typescript
// Today log list row: pillar color + direction label + note if present
function LogHistoryItem({ log }: { log: Log }) {
  const pillar = getPillarById(log.pillarId as PillarId);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: pillar.positiveColor }]} />
      <Text style={styles.direction}>{log.direction}</Text>
      {log.note ? <Text style={styles.note}>{log.note}</Text> : null}
    </View>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom bottom-sheet libraries (reanimated-bottom-sheet) | RN Modal + slide animation | Codebase from inception | No extra dep needed |
| Separate note screen/route | Inline bottom-sheet modal | Project pattern | Faster UX, no navigation disruption |

---

## Open Questions

1. **Should note modal appear for hold (target) swipes too?**
   - What we know: `SwipeResult.wasHeld` flag is available; the current `handleSwipe` in `useSwipeLog` doesn't distinguish
   - What's unclear: Whether the user intent for hold swipes (more deliberate, target-specific) already captures context, making notes less needed
   - Recommendation: Apply to all swipes for v1 simplicity; `wasHeld` can be used to suppress it if UX feedback warrants it post-MVP

2. **Where exactly is the "log history view" for note display?**
   - What we know: The home screen already fetches `todayLogs` but only shows a count; analytics screens show aggregate data, not individual log entries
   - What's unclear: Whether "log history views" means a new today-log list or the analytics screen
   - Recommendation: Add a compact today-log FlatList on the home screen below the joystick triangle — this is the most natural "log history" location and uses already-available `todayLogs` data

---

## Environment Availability

Step 2.6: No new external dependencies. All required tools are available (Node 20.20.1, Expo SDK 55, existing package.json deps). SKIPPED.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest 29.7.0 with jest-expo (native) and ts-jest (unit) |
| Config file | `jest.config.js` (project root), `jest.unit.config.js` (services/utils) |
| Quick run command | `npx jest --config jest.unit.config.js` |
| Full suite command | `npx jest` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| LOG-04 | `addLog()` returns log ID | unit | `npx jest --config jest.unit.config.js src/stores/logStore.test.ts -x` | Wave 0 |
| LOG-04 | `updateLogNote()` persists note to SQLite | unit | `npx jest --config jest.unit.config.js src/stores/logStore.test.ts -x` | Wave 0 |
| LOG-04 | `NoteEntryModal` renders when `pendingLogId` is set | native | `npx jest src/components/joystick/NoteEntryModal.test.tsx -x` | Wave 0 |
| LOG-04 | Note text appears in `LogHistoryItem` when `log.note` is non-null | native | `npx jest src/components/ui/LogHistoryItem.test.tsx -x` | Wave 0 |
| LOG-04 | Skip button closes modal without calling `updateLogNote` | native | `npx jest src/components/joystick/NoteEntryModal.test.tsx -x` | Wave 0 |

**Note:** `logStore` tests belong in `src/stores/` — but the unit jest config only targets `src/services/` and `src/utils/`. Either extend `jest.unit.config.js` to include `src/stores/**/*.test.ts`, or place store tests in the native config's match pattern. The native preset (`jest-expo`) handles TS files and supports Zustand mocking. **Recommendation:** Add `src/stores/**/*.test.ts` to `jest.unit.config.js` testMatch (no native dependencies in logStore).

### Sampling Rate
- **Per task commit:** `npx jest --config jest.unit.config.js`
- **Per wave merge:** `npx jest`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/stores/logStore.test.ts` — covers addLog return ID + updateLogNote SQLite (unit, mock db)
- [ ] `src/components/joystick/NoteEntryModal.test.tsx` — covers show/hide, save, skip (native)
- [ ] `src/components/ui/LogHistoryItem.test.tsx` — covers note display (native)
- [ ] Extend `jest.unit.config.js` testMatch to include `src/stores/**/*.test.ts`

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection: `src/stores/logStore.ts` — confirmed `addLog` signature, `updateLogNote`, `note` column
- Direct codebase inspection: `src/database/schema.ts` — confirmed `note TEXT` column exists in logs table
- Direct codebase inspection: `src/components/joystick/useSwipeLog.ts` — confirmed current flow and `addLog` call site
- Direct codebase inspection: `src/components/goals/TargetFormModal.tsx` — confirmed bottom-sheet Modal pattern with KeyboardAvoidingView
- Direct codebase inspection: `src/database/types.ts` — confirmed `Log.note: string | null` type
- Direct codebase inspection: `package.json` — confirmed all stack versions (RN 0.83.2, Expo 55, RN Gesture Handler 2.30, Reanimated 4.2.1)

### Secondary (MEDIUM confidence)
- React Native Modal + KeyboardAvoidingView pattern: inferred from three existing modal implementations in codebase (TargetFormModal, AuthModal, TargetTrendModal)

### Tertiary (LOW confidence)
- None required — all findings verified from source

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from package.json and existing components
- Architecture: HIGH — data layer complete, UI pattern clearly established in codebase
- Pitfalls: HIGH — derived from direct code analysis of addLog() return type gap and existing RNGH patterns

**Research date:** 2026-03-23
**Valid until:** 2026-04-23 (stable stack — Expo SDK 55 is pinned)
