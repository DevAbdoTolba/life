---
phase: 10
slug: gesture-interaction-overhaul
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 with jest-expo preset (native) + ts-jest (unit) |
| **Config file** | `jest.config.js` (root), `jest.unit.config.js` |
| **Quick run command** | `npx jest --testPathPattern="joystick\|targetStore" --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern="joystick|targetStore" --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | BUG-03 | unit | `npx jest --testPathPattern="useSwipeLog" --passWithNoTests` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 0 | BUG-04 | unit | `npx jest --testPathPattern="useRadialMenu" --passWithNoTests` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 0 | BUG-04 | unit | `npx jest --testPathPattern="targetStore" --passWithNoTests` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 0 | UX-01 | unit | `npx jest --testPathPattern="useSwipeLog" --passWithNoTests` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/joystick/useRadialMenu.test.ts` — fan geometry: n=1, n=2, n=3 at each cardinal direction; covers BUG-04 geometry
- [ ] `src/components/joystick/useSwipeLog.test.ts` — note-mode gate: pendingLogId set only when noteMode=true; covers UX-01 + BUG-03
- [ ] `src/stores/targetStore.test.ts` — getActiveTargetsByPillar caps at MAX_ACTIVE_TARGETS; covers BUG-04 store

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Center hold triggers vibration, no target menu | BUG-03 | Haptics + gesture require device | Hold joystick center on device, verify vibration and no radial menu |
| Directional hold fans targets correctly | BUG-04 | Visual fan layout | Hold in direction, verify 30-deg spaced targets |
| Release at center cancels hold | BUG-04 | Gesture sequence | Start directional hold, return to center, verify no entry logged |
| Note mode glow ring visible | BUG-03 | Visual animation | Toggle note mode, verify pulsing glow ring appears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
