---
phase: 12
slug: analytics-layout
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest 29.7 with jest-expo preset (native) + ts-jest (unit) |
| **Config file** | `jest.config.js` (root), `jest.unit.config.js` |
| **Quick run command** | `npx jest --config jest.unit.config.js --passWithNoTests` |
| **Full suite command** | `npx jest --passWithNoTests` |
| **Estimated runtime** | ~5 seconds (unit), ~10 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx jest --config jest.unit.config.js --passWithNoTests`
- **After every plan wave:** Run `npx jest --passWithNoTests`
- **Before `/gsd:verify-work`:** Full suite must be green + manual visual check in Expo Go
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | UX-02 | unit | `npx jest --config jest.unit.config.js --testPathPattern analytics --passWithNoTests` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | UX-02 | manual | Visual chart inspection | N/A | ⬜ pending |
| 12-02-01 | 02 | 1 | UX-03 | manual | Visual layout inspection | N/A | ⬜ pending |
| 12-02-02 | 02 | 1 | UX-03 | manual | Activity peek strip check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/utils/analyticsHelpers.test.ts` — unit test for per-pillar daily total aggregation (if data transformation logic is extracted to utility)

*If aggregation logic stays inline in component, this gap is not blocking.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Line chart renders without overflow | UX-02 | Chart rendering requires native renderer | Open analytics, verify line chart fits container with no clipping |
| Three pillar lines with correct colors | UX-02 | Visual color verification | Verify golden (Afterlife), green (Self), blue (Others) lines |
| Joysticks visible without scrolling | UX-03 | Layout requires native measurement | Open home screen, verify all 3 joysticks visible in thumb zone |
| Activity list peeks at ~60px | UX-03 | Visual layout | Verify most recent entry visible below joysticks, scrollable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
