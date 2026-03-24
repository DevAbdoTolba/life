---
phase: 05
slug: polish-launch
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest (via jest-expo preset) — Wave 0 installs |
| **Config file** | jest.config.js — Wave 0 creates |
| **Quick run command** | `npx jest --testPathPattern=src/services` |
| **Full suite command** | `npx jest` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --testPathPattern=src/services`
- **After every plan wave:** Run `npx jest`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DATA-02 | unit | `npx jest src/services/exportService.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DATA-03 | unit | `npx jest src/services/importService.test.ts` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | DATA-03 | integration | `npx jest src/services/importService.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | NOTIFY-01 | unit (mock) | `npx jest src/services/notifications.test.ts` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | NOTIFY-02 | unit (mock) | `npx jest src/services/notifications.test.ts` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 2 | POLISH-01 | manual | Manual: first-launch test on device | N/A | ⬜ pending |
| 05-04-01 | 04 | 2 | POLISH-02 | manual | Manual: visual inspection of settings sections | N/A | ⬜ pending |
| 05-04-02 | 04 | 2 | POLISH-03 | manual | Manual: production build icon/splash inspection | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `jest-expo` — install via `npx expo install jest-expo jest @types/jest`
- [ ] `jest.config.js` — configure with `preset: 'jest-expo'`
- [ ] `package.json` — add `"test": "jest"` script
- [ ] `src/services/exportService.test.ts` — stubs for DATA-02
- [ ] `src/services/importService.test.ts` — stubs for DATA-03
- [ ] `src/services/notifications.test.ts` — stubs for NOTIFY-01, NOTIFY-02

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Onboarding carousel renders, swipe works, skip navigates | POLISH-01 | Native gesture + navigation requires device | Launch app fresh (clear settingsStore), verify 3-4 slides, skip button works |
| Settings screen shows all 4 sections | POLISH-02 | Visual layout verification | Navigate to Settings tab, verify Reminders/Privacy/Data/About sections |
| App icon and splash at correct size | POLISH-03 | Requires production build | Build with `eas build`, verify icon in launcher and splash on startup |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
