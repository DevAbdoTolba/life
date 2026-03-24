---
phase: 08
slug: custom-date-range-picker
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 08 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29 (jest-expo for components, ts-jest for utils) |
| **Config file** | `jest.config.js` (projects array), `jest.unit.config.js` |
| **Quick run command** | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --config jest.unit.config.js --testPathPattern periodHelpers`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | VIZ-03 | unit | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers -x` | ❌ W0 | ⬜ pending |
| 08-01-02 | 01 | 1 | VIZ-03 | unit | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers -x` | ❌ W0 | ⬜ pending |
| 08-01-03 | 01 | 1 | VIZ-03 | unit | `npx jest --config jest.unit.config.js --testPathPattern periodHelpers -x` | ❌ W0 | ⬜ pending |
| 08-02-01 | 02 | 1 | VIZ-03 | manual | Expo dev build visual inspection | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/periodHelpers.test.ts` — stubs for `formatDateShort`, `formatDateRangeLabel`, `getPeriodDates` custom fallback (VIZ-03)

*Existing infrastructure covers test framework; only test file stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| CustomDateRangeModal renders with date pickers | VIZ-03 | Native DatePicker cannot be unit-tested with jest-expo | 1. Open analytics tab 2. Tap "Custom" pill 3. Verify date picker modal appears with start/end selection |
| Selected custom range updates charts | VIZ-03 | End-to-end flow requires native rendering | 1. Select custom range 2. Verify charts update with new date range data |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
