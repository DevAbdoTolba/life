# Phase 07: Integration Wiring Fixes - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto-generated (gap closure phase — success criteria fully specify the work)

<domain>
## Phase Boundary

Fix three integration gaps identified by the v1.0 milestone audit: (1) privacy mode toggle not wired to display components, (2) target deletion using hard DELETE instead of soft-delete, (3) notification channel not initialized at app startup.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — this is a gap closure phase with fully specified success criteria. The ROADMAP defines exactly what must change:
1. Settings Privacy Mode toggle must control masking in TargetCard, TargetAnalyticsList, TargetTrendModal, RadialMenu
2. deleteTarget() must use soft-delete (status='deleted') instead of hard DELETE, preserving target_history FK integrity
3. initNotificationChannel() must be called at app startup in _layout.tsx

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/stores/settingsStore.ts` — has `privacyMode` state, used in `app/(tabs)/settings.tsx`
- `src/stores/targetStore.ts` — has `deleteTarget()` function
- `src/components/goals/TargetActionSheet.tsx` — calls `deleteTarget()`
- `src/services/notifications.ts` — has `initNotificationChannel()` function

### Established Patterns
- Privacy mode state lives in settingsStore (Zustand + MMKV)
- Components subscribe to store state via `useSettingsStore(state => state.X)`
- Target status uses string enum: 'active', 'paused', 'completed', 'archived'

### Integration Points
- Privacy toggle: settingsStore → TargetCard, TargetAnalyticsList, TargetTrendModal, RadialMenu
- Soft-delete: targetStore.deleteTarget() → SQLite UPDATE instead of DELETE
- Notification channel: notifications.ts → app/_layout.tsx useEffect

</code_context>

<specifics>
## Specific Ideas

No specific requirements — success criteria are fully specified in ROADMAP.

</specifics>

<deferred>
## Deferred Ideas

None — gap closure phase.

</deferred>

---

*Phase: 07-integration-wiring-fixes*
*Context gathered: 2026-03-24 via autonomous smart discuss (infrastructure)*