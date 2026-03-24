---
status: partial
phase: 09-foundation-fixes
source: [09-VERIFICATION.md]
started: 2026-03-24T00:00:00Z
updated: 2026-03-24T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Ball physics render (BUG-02)
expected: Open body-fill screen with logs present; balls should appear and fall with visible bouncing. Automated verification cannot run Matter.js + Skia.
result: [pending]

### 2. Screen dimming after settlement (BUG-01)
expected: Leave body-fill open after balls settle for 2+ minutes; screen should dim normally. Conditional RAF is code-confirmed; OS timer response requires physical device.
result: [pending]

### 3. Joystick direction indicators visual regression (HOOK-01)
expected: Slow-drag in each direction; active indicator should brighten (opacity 1, scale 1.4). Confirms refactor introduced no runtime regressions.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
