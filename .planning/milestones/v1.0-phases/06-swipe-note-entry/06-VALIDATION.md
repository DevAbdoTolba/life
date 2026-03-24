---
phase: 06
slug: swipe-note-entry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 06 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7.0 with jest-expo (native) and ts-jest (unit) |
| **Config file** | `jest.config.js` (project root), `jest.unit.config.js` (services/utils) |
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
| 06-01-01 | 01 | 1 | LOG-04 | unit | `npx jest --config jest.unit.config.js src/stores/logStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | LOG-04 | unit | `npx jest --config jest.unit.config.js src/stores/logStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | LOG-04 | native | `npx jest src/components/joystick/NoteEntryModal.test.tsx -x` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 1 | LOG-04 | native | `npx jest src/components/joystick/NoteEntryModal.test.tsx -x` | ❌ W0 | ⬜ pending |
| 06-03-01 | 03 | 2 | LOG-04 | native | `npx jest src/components/ui/LogHistoryItem.test.tsx -x` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/logStore.test.ts` — stubs for addLog return ID + updateLogNote SQLite
- [ ] `src/components/joystick/NoteEntryModal.test.tsx` — stubs for show/hide, save, skip
- [ ] `src/components/ui/LogHistoryItem.test.tsx` — stubs for note display
- [ ] Extend `jest.unit.config.js` testMatch to include `src/stores/**/*.test.ts`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Note modal appears after swipe gesture | LOG-04 | Requires gesture handler + native animation | 1. Swipe on joystick 2. Verify modal slides up 3. Verify keyboard opens |
| Skip button dismisses without saving | LOG-04 | Gesture + animation timing | 1. Swipe 2. Tap Skip 3. Verify modal closes, no note saved |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending