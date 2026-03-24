# Phase 9: Foundation Fixes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-24
**Phase:** 09-foundation-fixes
**Areas discussed:** Screen wake behavior, Body-fill animation feel, Hooks cleanup scope

---

## Screen Wake Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Always allow dimming | No wake lock at all — let the OS handle screen timeout normally. Simplest fix. | ✓ |
| Awake during gesture only | Keep screen on while a joystick drag is in progress, dim normally otherwise | |
| Awake on home screen | Keep screen on while viewing the main joystick screen, dim on other screens | |

**User's choice:** Always allow dimming
**Notes:** No wake-lock code exists (`expo-keep-awake` not installed), yet screen never dims. Root cause investigation needed.

---

## Body-Fill Animation Feel

| Option | Description | Selected |
|--------|-------------|----------|
| Fast drop + bounce | Balls drop quickly with a satisfying bounce at the bottom — playful, energetic feel | ✓ |
| Gentle rain settle | Balls gently fall and settle without bouncing — calm, mindful feel | |
| You decide | Claude picks what feels best with the existing physics config | |

**User's choice:** Fast drop + bounce
**Notes:** User emphasized performance is the #1 priority — "the most performance, to work on any device." Pre-allocation, UI-thread physics, stable Skia tree all locked as approach.

---

## Hooks Cleanup Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Fix both | Clean up Joystick.tsx AND GestureSlide.tsx — prevents future surprises in onboarding too | ✓ |
| Joystick only | Only fix Joystick.tsx — GestureSlide is onboarding-only, lower risk | |
| You decide | Claude picks based on effort vs risk | |

**User's choice:** Fix both
**Notes:** None — straightforward decision.

---

## Claude's Discretion

- Exact Matter.js restitution/friction values for bounce feel
- Pre-allocation vs useState pattern for body-fill fix
- RAF cleanup approach for wake lock fix

## Deferred Ideas

None — discussion stayed within phase scope.
