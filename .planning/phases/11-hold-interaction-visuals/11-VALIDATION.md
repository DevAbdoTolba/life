---
phase: 11
slug: hold-interaction-visuals
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 11 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 with jest-expo preset |
| **Config file** | `jest.config.js` |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~5 seconds (tsc), ~10 seconds (jest) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx jest src/components/ --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green + manual device smoke test
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 11-01-01 | 01 | 1 | VIS-01 | manual | `npx tsc --noEmit` (compile check) | N/A | ⬜ pending |
| 11-01-02 | 01 | 1 | VIS-02 | manual | `npx tsc --noEmit` (compile check) | N/A | ⬜ pending |
| 11-01-03 | 01 | 1 | VIS-04 | manual | `npx tsc --noEmit` (compile check) | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — existing test infrastructure covers the automated portion. All phase requirements are visual/tactile and not unit-testable.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Four separator lines visible at rest | VIS-01 | Visual rendering | Open app, verify cross-pattern lines on joystick base |
| Active quadrant fills on hold | VIS-02 | Animated visual | Hold in direction, verify quadrant fills with pillar color at ~20% opacity |
| Fill fades on release | VIS-02 | Animated visual | Release hold, verify quadrant fill fades out |
| Heavy haptic on hold-start | VIS-04 | Requires physical device | Hold gesture on physical device, verify stronger vibration than swipe |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
