---
phase: 07
slug: integration-wiring-fixes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (two configs: unit + native) |
| **Config file** | `jest.unit.config.js` (unit), `jest.config.js` (native) |
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
| 07-01-01 | 01 | 1 | PRIV-01, PRIV-02 | unit | `npx jest --config jest.unit.config.js src/stores/targetStore.test.ts -t privacy` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | GOAL-02 | unit | `npx jest --config jest.unit.config.js src/stores/targetStore.test.ts -t deleteTarget` | ❌ W0 | ⬜ pending |
| 07-01-03 | 01 | 1 | NOTIFY-01, NOTIFY-02 | unit | `npx jest --config jest.unit.config.js src/services/notifications.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/stores/targetStore.test.ts` — covers deleteTarget soft-delete + privacy masking logic
- [ ] Extend existing `src/services/notifications.test.ts` — covers initNotificationChannel startup call

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Privacy toggle visually masks target names | PRIV-01 | Requires rendered UI inspection | 1. Enable Privacy Mode in Settings 2. Check TargetCard shows codename 3. Check RadialMenu shows codename |
| Android notification channel created | NOTIFY-01 | Requires Android device/emulator | 1. Fresh install on Android 2. Check notification settings show channel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending