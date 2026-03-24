# Phase 13: Advanced Visual Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 13-advanced-visual-polish
**Areas discussed:** Liquid glow effect, Background hue shift, Pillar icon design

---

## Liquid Glow Effect

| Option | Description | Selected |
|--------|-------------|----------|
| Skia blur ring | Soft blur/glow ring around joystick, intensifies + stretches toward drag direction. Water-drop feel. | ✓ |
| Enhanced shadow only | Bigger RN shadow properties. Simpler, less visual impact. | |
| CSS-style border glow | Animated border width + color intensification. No Skia. | |
| You decide | Claude picks best approach. | |

**User's choice:** Skia blur ring (recommended)
**Notes:** User added performance caveat: if Skia glow affects performance, fall back to enhanced CSS shadows mixed with border glow. Performance always comes first.

---

## Background Hue Shift

| Option | Description | Selected |
|--------|-------------|----------|
| Subtle tint, full screen | Entire screen shifts ~10-15% toward pillar color at max drag. Spring transition on release. | ✓ |
| Strong wash, full screen | Dramatic 30-40% shift. Very noticeable. | |
| Local area only | Only behind active joystick. Rest stays dark. | |

**User's choice:** Subtle tint, full screen (recommended)
**Notes:** None

---

## Pillar Icon Design

| Option | Description | Selected |
|--------|-------------|----------|
| Ionicons from existing lib | moon-outline (Afterlife), heart-outline (Self), people-outline (Others). Chevrons for directions. | ✓ |
| Abstract geometric shapes | Custom SVG: crescent, circle, overlapping circles. | |
| Custom SVG pillar icons | Purpose-designed: prayer mat, arm, handshake. | |
| You decide | Claude picks icons. | |

**User's choice:** Ionicons from existing library (recommended)
**Notes:** User described specific layout vision: direction chevrons positioned at quadrant edges/corners (not centered on edges like current dots). Pillar icon centered on knob. Direction chevrons only appear during directional hold — not visible at rest. This changes current always-visible indicator dots.

---

## Claude's Discretion

- Skia shader configuration and intensity curve
- Performance testing approach for Skia vs fallback decision
- Icon sizing in different contexts
- Exact interpolateColor values for hue shift

## Deferred Ideas

None
