# Phase 10: Gesture Interaction Overhaul - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix joystick hold behavior so center-hold toggles note mode (vibrate only), directional hold fans targets at 30-degree fixed intervals, and plain swipes never prompt notes. Requirements: BUG-03, BUG-04, UX-01.

</domain>

<decisions>
## Implementation Decisions

### Center vs Directional Hold (BUG-03, BUG-04)
- **D-01:** Distinguish center hold from directional hold by knob displacement when LongPress fires. If knob is within ~15px of center, it's a center hold (note toggle). If past threshold, it's a directional hold (target fan).
- **D-02:** Center hold triggers vibration and toggles note-mode state on/off. No target menu appears.
- **D-03:** Directional hold reveals target fan in the swipe direction.
- **D-04:** If a directional hold is released back at center (knob returns to middle), it cancels — no entry logged, no target selected. Clean escape.

### Note Mode Indicator
- **D-05:** When note mode is active, the knob gets a pulsing glow ring in accent color. Disappears when toggled off.
- **D-06:** Note mode persists across swipes until explicitly toggled off by another center hold.

### Note Prompt Behavior (UX-01)
- **D-07:** Completing a swipe only opens NoteEntryModal if note mode is currently active. Plain swipes without prior center-hold never prompt for notes.
- **D-08:** Current behavior (every handleSwipe sets pendingLogId) must be gated behind note-mode state.

### Target Fan Layout (BUG-04)
- **D-09:** Targets fan at 30-degree fixed intervals from the swipe direction.
- **D-10:** Maximum 3 active targets per direction. Users can create many targets but only 3 are active at a time. The fan shows active targets only.
- **D-11:** Active target management (milestone logic, choosing which are "next") is deferred to a future phase.

### Claude's Discretion
- Exact distance threshold for center vs directional detection (suggested ~15px, can tune)
- Glow pulse animation timing and intensity for note mode indicator
- How "active target" state is stored/managed in targetStore (minimal implementation for 3-target cap)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Joystick Gesture System
- `src/components/joystick/Joystick.tsx` — Pan+LongPress composed gesture, direction detection, hold start/end handlers, animated styles
- `src/components/joystick/types.ts` — JoystickProps interface (onHoldStart, onHoldEnd callbacks)
- `src/components/joystick/constants.ts` — HOLD_DURATION (400ms), SWIPE_THRESHOLD (30px), RADIAL_ARC_SPAN (120deg — needs update to 30deg intervals)
- `src/components/joystick/useSwipeLog.ts` — Haptics usage, pendingLogId state that triggers NoteEntryModal
- `src/components/joystick/NoteEntryModal.tsx` — Note entry modal triggered on every swipe (must be gated)

### Target System
- `src/components/joystick/useRadialMenu.ts` — Target positions calculation, RADIAL_ARC_SPAN fan layout
- `src/components/joystick/RadialMenu.tsx` — Radial menu rendering
- `src/stores/targetStore.ts` — Target CRUD operations (needs active flag or limit)

### Project Decisions
- `.planning/PROJECT.md` — ADR-016 (composed Pan+LongPress gestures), ADR-013 (haptic + animation only for confirmation)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isHolding` SharedValue already tracks hold state in Joystick.tsx
- `Haptics.impactAsync(Medium)` already used in useSwipeLog.ts — hold-start needs different haptic
- `getTargetPositions()` in useRadialMenu.ts calculates fan positions — needs 30deg interval update
- `getClosestTarget()` hit detection works with any position layout

### Established Patterns
- `runOnJS()` bridges worklet to JS callbacks (handleHoldStart, handleHoldEnd)
- `useSharedValue` + `useAnimatedStyle` for all animation state
- `withSpring` for snap-back, `withTiming` for linear transitions
- `Gesture.Simultaneous(Pan, LongPress)` composition

### Integration Points
- `pendingLogId` in useSwipeLog controls NoteEntryModal visibility — gate this behind note-mode state
- `handleHoldStart` callback from LongPress.onStart — needs center detection branch
- Home screen `index.tsx` renders Joystick components — no changes needed at screen level

</code_context>

<specifics>
## Specific Ideas

- Center hold = press and hold without moving. Directional hold = drag then hold. Natural gesture distinction.
- Release back to center = cancel (clean escape from directional hold)
- Only 3 targets active per direction — user explicitly wants a cap, not unlimited fan
- Future "milestone logic" for rotating which targets are active — deferred

</specifics>

<deferred>
## Deferred Ideas

- **Active target milestone logic** — User wants targets to rotate (e.g., "next 3" or milestone-based selection). New capability — belongs in a future phase.

</deferred>

---

*Phase: 10-gesture-interaction-overhaul*
*Context gathered: 2026-03-24*
