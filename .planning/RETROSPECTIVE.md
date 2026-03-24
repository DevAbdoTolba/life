# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-24
**Phases:** 8 | **Plans:** 27 | **Commits:** 122

### What Was Built
- Gesture-driven logging with 3 joystick analogs (4-direction swipe, radial target menu, optional notes)
- Goal lifecycle management with privacy codenames and password-protected reveal
- Bullet journal analytics (bar, donut, trend) with period comparison and custom date range
- Physics body-fill visualization (Matter.js + Skia, ball aggregation for performance)
- Export/import backup, notification scheduling, onboarding with gesture tutorial
- Integration hardening: soft-delete, privacy toggle wiring, notification channel init

### What Worked
- Gap closure phases (06-08) after milestone audit caught real integration issues before ship
- TDD for later phases (07, 08) caught regressions early
- Parallel plan execution via subagents significantly sped up multi-plan phases
- Phase-level summaries preserved decision context across sessions
- The audit-then-fix pattern (audit → plan gaps → execute fixes) was very effective

### What Was Inefficient
- Early phases (01-03) lacked structured summaries, making retrospective extraction harder
- REQUIREMENTS.md coverage stats fell out of date as checkboxes were checked incrementally
- Some plan summaries used inconsistent frontmatter formats, breaking automated extraction

### Patterns Established
- `--legacy-peer-deps` required for all npm installs in Expo ecosystem
- Split jest config: unit tests use ts-jest/node, component tests use jest-expo
- Bottom-sheet modal pattern for inline data entry (NoteEntryModal, CustomDateRangeModal)
- Inline DatePicker inside RN Modal to avoid native modal nesting conflicts
- Soft-delete pattern for FK integrity preservation

### Key Lessons
1. Run milestone audit before declaring completion — it caught 3 gap-closure phases worth of real issues
2. Privacy features need integration testing across all display components, not just the toggle itself
3. Schema migrations in SQLite require table recreation (no ALTER CHECK) — plan for this
4. 50ms setTimeout can resolve gesture handler / modal autoFocus conflicts on React Native

### Cost Observations
- Model mix: balanced profile (opus for planning/execution, sonnet for subagents)
- Sessions: ~6 sessions across 2 days
- Notable: Full MVP from zero to shipped in 2 days with AI-assisted development

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 122 | 8 | Established audit-then-fix pattern for milestone completion |

### Cumulative Quality

| Milestone | LOC | Tests | Key Quality Win |
|-----------|-----|-------|-----------------|
| v1.0 | ~39,900 | Unit + integration | Milestone audit caught 3 phases of integration gaps |

### Top Lessons (Verified Across Milestones)

1. Milestone audits before ship are non-negotiable — they catch what phase-level verification misses
2. Privacy/masking features need cross-component integration tests, not just unit tests
