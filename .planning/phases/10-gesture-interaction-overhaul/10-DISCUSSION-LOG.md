# Phase 10: Gesture Interaction Overhaul - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 10-gesture-interaction-overhaul
**Areas discussed:** Center vs directional hold, Note mode indicator, Target fan at 30 degrees

---

## Center vs Directional Hold

| Option | Description | Selected |
|--------|-------------|----------|
| Hold before dragging | If LongPress fires while knob near center (<15px), it's center hold (note toggle). If past threshold, directional hold (target fan). | ✓ |
| Dedicated center zone | Visible center dead-zone (~30px). Position-based detection. | |
| Double-tap for notes | Abandon center-hold. Quick double-tap toggles note mode. All holds = directional. | |

**User's choice:** Hold before dragging (recommended)
**Notes:** User added: if directional hold is released back at center, it simply cancels — no entry logged.

---

## Note Mode Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Knob glow pulse | Pulsing glow ring in accent color while note mode active. Disappears when toggled off. | ✓ |
| Small dot/badge on knob | Static colored dot on knob corner when active. | |
| Border color change | Outer ring border shifts to accent color while active. | |
| You decide | Claude picks best indicator. | |

**User's choice:** Knob glow pulse
**Notes:** None

---

## Target Fan at 30 Degrees

| Option | Description | Selected |
|--------|-------------|----------|
| Cap at 5 per direction | Max 5 targets visible. Show 5 most recently used. | |
| Tighten spacing for overflow | Reduce angle to fit more targets. | |
| Two-row fan | Inner and outer ring for overflow. | |
| You decide | Claude picks best approach. | |

**User's choice:** Other — Cap at 3 active targets per direction
**Notes:** User wants max 3 active targets per direction. Users can create many targets but only activate 3 at a time. Future "milestone logic" for rotating active targets is deferred.

---

## Claude's Discretion

- Exact center detection threshold (~15px suggested)
- Glow pulse animation timing
- Active target state management implementation

## Deferred Ideas

- Active target milestone/rotation logic — future phase
