---
phase: 9
slug: foundation-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 |
| **Config file** | `jest.config.js` (root), `jest.unit.config.js` (services/utils/stores) |
| **Quick run command** | `npx jest --config jest.unit.config.js` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --config jest.unit.config.js`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | HOOK-01 | structural | `grep -rn "createIndicatorStyle" src/components/joystick/Joystick.tsx` (expect 0 matches) | n/a | ⬜ pending |
| 09-01-02 | 01 | 1 | HOOK-01 | structural | `grep -rn "createIndicatorStyle" src/components/onboarding/GestureSlide.tsx` (expect 0 matches) | n/a | ⬜ pending |
| 09-02-01 | 02 | 1 | BUG-01, BUG-02 | unit | `npx jest --config jest.unit.config.js src/components/physics/useBodyFillPhysics.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | BUG-02 | structural | `grep -c "ballCount: number" src/components/physics/BodyFillCanvas.tsx` (expect 1) | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/physics/useBodyFillPhysics.test.ts` — stubs for BUG-01 (RAF stops after settlement) and BUG-02 (pre-allocation, SharedValue updates); requires mock of `react-native-reanimated` (`makeMutable`, `SharedValue`) and `matter-js`

*Existing `jest.unit.config.js` uses `testEnvironment: 'node'` — manual mocking of `react-native-reanimated` required.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Screen dims after body-fill balls settle | BUG-01 | OS screen dimming requires physical device; automated grep checks confirm conditional RAF guard and timeout constants are present, but cannot verify OS display timer behavior | 1. Open app on device 2. Navigate to body-fill screen 3. Let balls fall and settle 4. Wait 2+ minutes without touching screen 5. Verify screen dims normally |
| Screen does not dim during joystick gesture | BUG-01 | OS screen dimming during active gesture is native behavior | 1. Open app on device 2. Navigate to home 3. Use joystick for 2+ minutes 4. Verify screen stays on during gesture but dims after ~30s of inactivity |
| Balls visually fall and bounce in body-fill | BUG-02 | Skia rendering requires visual confirmation | 1. Open app 2. Navigate to body-fill screen 3. Verify balls appear and fall with physics 4. Verify satisfying bounce at bottom |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
