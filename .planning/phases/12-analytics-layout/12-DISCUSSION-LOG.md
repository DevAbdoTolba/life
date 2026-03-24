# Phase 12: Analytics & Layout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 12-analytics-layout
**Areas discussed:** Line chart data shape, Thumb-zone layout, Activity list peek

---

## Line Chart Data Shape

| Option | Description | Selected |
|--------|-------------|----------|
| One line per pillar | 3 lines (Afterlife=golden, Self=green, Others=blue) showing total logs per day per pillar. | ✓ |
| Single total line | One line showing total logs per day across all pillars. | |
| One line per valence | 2 lines: positive vs negative actions. | |
| You decide | Claude picks best data shape. | |

**User's choice:** One line per pillar (recommended)
**Notes:** User emphasized chart MUST fit within content space — no ugly overflow. Fix any overflow issues encountered on the analytics page.

---

## Thumb-Zone Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Joysticks at bottom, header minimal | Flip layout: header top, list middle, joysticks pinned bottom. | |
| Joysticks middle, list below | Keep joysticks near current position, activity list peeks below. | ✓ |
| Full-screen joysticks, swipe for list | Joysticks fill screen. List in separate swipe-up sheet. | |

**User's choice:** Joysticks middle, list below
**Notes:** User clarified joysticks are already almost at the bottom. No major layout inversion needed. Activity peek goes below joysticks.

---

## Activity List Peek

| Option | Description | Selected |
|--------|-------------|----------|
| One row peek (~60px) | Latest log entry visible showing pillar color + direction + time. | ✓ |
| Half-row tease (~30px) | Sliver of latest entry. More minimal. | |
| Count badge only | No list peek. Small badge with count. Tap to reveal. | |

**User's choice:** One row peek (recommended)
**Notes:** User confirmed: one row peek BELOW the joystick, scrollable to see full history.

---

## Claude's Discretion

- Line chart styling (thickness, markers, interpolation)
- ScrollView/FlatList arrangement for peek + scroll behavior
- Additional chart overflow fixes on analytics page

## Deferred Ideas

None
