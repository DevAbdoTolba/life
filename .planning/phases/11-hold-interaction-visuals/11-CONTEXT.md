# Phase 11: Hold Interaction Visuals - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add visual and tactile feedback to the joystick hold gesture: quadrant separator lines visible at rest, section fill with color on hold, and haptic pulse at hold-start. Requirements: VIS-01, VIS-02, VIS-04.

</domain>

<decisions>
## Implementation Decisions

### Quadrant Separator Lines (VIS-01)
- **D-01:** Four separator lines divide the joystick base into quadrants (cross pattern — vertical + horizontal through center).
- **D-02:** Lines are subtle hairlines: 0.5-1px width, in `colors.border` (#2A2A3A), at ~30% opacity.
- **D-03:** Lines are visible at rest. They hint at the 4 directional zones without being visually heavy.

### Section Fill on Hold (VIS-02)
- **D-04:** When a hold begins, the active quadrant fills with the direction's valence color: up/right quadrants use pillar `positiveColor`, down/left use pillar `negativeColor`.
- **D-05:** Fill opacity is subtle (~20%) so it tints the quadrant without obscuring separator lines or the knob.
- **D-06:** The app background also shifts to match — covered by Phase 13's hue shift (VIS-05), but section fill is Phase 11's scope.

### Haptic Feedback (VIS-04)
- **D-07:** `Haptics.impactAsync(ImpactFeedbackStyle.Heavy)` fires at the instant hold-start is detected — before any target menu appears.
- **D-08:** This is distinct from the Medium impact used on regular swipes and the Success notification on target selection. Three-tier haptic hierarchy: Medium (swipe) < Heavy (hold-start) < Success pattern (target select).

### Claude's Discretion
- Exact rendering approach for quadrant lines (Skia paths vs RN Views vs SVG)
- Section fill animation timing (instant vs quick fade-in)
- Whether separator lines should subtly brighten on hold in addition to quadrant fill

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Joystick Component
- `src/components/joystick/Joystick.tsx` — outerRing style (100px circle), indicator positions, existing animated styles (dragIntensity, directionValence SharedValues)
- `src/components/joystick/constants.ts` — JOYSTICK_SIZE (100px), KNOB_SIZE (56px), INDICATOR_SIZE (6px)
- `src/constants/colors.ts` — Pillar positive/negative colors, border color (#2A2A3A)

### Gesture State
- `src/components/joystick/Joystick.tsx` — `isHolding` SharedValue, `activeDirection` SharedValue (0-4 mapping), LongPress.onStart handler
- `src/components/joystick/useSwipeLog.ts` — Haptics import and current usage patterns

### Project Decisions
- `.planning/PROJECT.md` — ADR-013 (haptic + animation only for confirmation)
- `.planning/phases/10-gesture-interaction-overhaul/10-CONTEXT.md` — Phase 10 must complete first (hold-start event must be reliable)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `dragIntensity` SharedValue (0→1) — can drive section fill opacity
- `directionValence` SharedValue (0=positive, 1=negative) — already maps to positive/negative color via `interpolateColor`
- `activeDirection` SharedValue (0=none, 1-4=direction) — identifies which quadrant to fill
- `flashAnimatedStyle` — existing pattern for `interpolateColor` between positive/negative colors
- `glowAnimatedStyle` — existing shadow-based glow driven by `dragIntensity`

### Established Patterns
- `useAnimatedStyle` with `interpolateColor` for color blending
- Absolute positioning within outerRing for indicator placement
- `StyleSheet.absoluteFillObject` for overlay layers (flashOverlay pattern)

### Integration Points
- Separator lines: absolute-positioned Views or Skia paths inside the outerRing Animated.View
- Section fill: new Animated.View overlay per quadrant, opacity driven by `activeDirection` + `isHolding`
- Haptic: add `Haptics.impactAsync(Heavy)` call in LongPress.onStart (after Phase 10 adds center detection)

</code_context>

<specifics>
## Specific Ideas

- Three-tier haptic hierarchy gives each gesture type a distinct feel
- Separator lines should be barely-there at rest — the joystick currently looks clean and minimal, separators add structure without clutter
- Section fill uses existing directionValence color logic — positive/negative distinction is already wired

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-hold-interaction-visuals*
*Context gathered: 2026-03-24*
