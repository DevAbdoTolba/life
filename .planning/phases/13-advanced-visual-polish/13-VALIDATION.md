---
phase: 13
slug: advanced-visual-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 with jest-expo preset + ts-jest (unit) |
| **Config file** | `jest.config.js` (multi-project: unit + native) |
| **Quick run command** | `npx jest --config jest.unit.config.js --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~5 seconds (unit), ~10 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --config jest.unit.config.js --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green + manual device verification
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | VIS-03 | manual | Device test — Skia glow canvas | N/A | ⬜ pending |
| 13-01-02 | 01 | 1 | VIS-05 | manual | Device test — background hue shift | N/A | ⬜ pending |
| 13-02-01 | 02 | 1 | VIS-06 | unit | `npx jest --config jest.unit.config.js --testPathPattern pillars --passWithNoTests` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 1 | VIS-06 | manual | Visual — Ionicons render correctly | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/constants/pillars.test.ts` — verify `iconName` field present on all pillars, no `emoji` field, all iconNames are non-empty strings

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Skia glow intensifies with drag | VIS-03 | Canvas rendering requires device | Drag joystick, verify glow ring intensifies with distance |
| Water-drop stretch toward drag direction | VIS-03 | Visual animation | Drag joystick, verify glow stretches toward drag direction |
| Background hue shifts during drag | VIS-05 | Animated color transition | Drag joystick, verify background tints toward pillar color |
| Background returns to neutral on release | VIS-05 | Animated transition | Release joystick, verify background eases back to #0A0A0F |
| Ionicons replace all emoji | VIS-06 | Visual verification | Navigate all screens, verify no emoji anywhere, icons correct |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
